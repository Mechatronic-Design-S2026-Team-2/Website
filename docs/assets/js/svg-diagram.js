// docs/assets/js/svg-diagram.js
(function () {
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function stripXmlPreamble(svgText) {
    return svgText
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .trim();
  }

  function ensureViewBox(svgEl) {
    const vb = svgEl.getAttribute("viewBox");
    if (vb && vb.trim()) return;

    // Try width/height attributes first
    const wAttr = svgEl.getAttribute("width");
    const hAttr = svgEl.getAttribute("height");

    const w = wAttr ? parseFloat(String(wAttr).replace(/[^\d.]/g, "")) : NaN;
    const h = hAttr ? parseFloat(String(hAttr).replace(/[^\d.]/g, "")) : NaN;

    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
      return;
    }

    // Fallback: once in DOM, we can try getBBox()
    try {
      const bbox = svgEl.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        svgEl.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }
    } catch (_) {
      // If still no viewBox, leave it; sizing will rely on CSS + intrinsic.
    }
  }

  function getViewBoxSize(svgEl) {
    const vb = (svgEl.getAttribute("viewBox") || "").trim().split(/\s+/).map(Number);
    if (vb.length === 4 && vb.every((n) => Number.isFinite(n))) {
      return { w: vb[2], h: vb[3] };
    }
    return null;
  }

  function setupPanZoom(card) {
    const viewport = card.querySelector("[data-diagram-viewport]");
    const resetBtn = card.querySelector("[data-diagram-reset]");
    const svg = viewport ? viewport.querySelector("svg") : null;
    if (!viewport || !svg) return;

    // Wrap SVG so we can transform the wrapper instead of the SVG root (more robust)
    const stage = document.createElement("div");
    stage.className = "diagram-stage";
    svg.parentNode.insertBefore(stage, svg);
    stage.appendChild(svg);

    // Normalize SVG sizing behavior
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    ensureViewBox(svg);

    // State
    const state = { x: 0, y: 0, s: 1 };

    function apply() {
      stage.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.s})`;
    }

    function fitToViewport() {
      const vbSize = getViewBoxSize(svg);

      // viewport content box
      const rect = viewport.getBoundingClientRect();
      const vw = rect.width;
      const vh = rect.height;

      // Use viewBox if possible; otherwise just start at 1 and centered
      if (vbSize && vbSize.w > 0 && vbSize.h > 0 && vw > 0 && vh > 0) {
        // Fit with small padding
        const pad = 16;
        const scale = Math.min((vw - pad) / vbSize.w, (vh - pad) / vbSize.h);
        state.s = clamp(scale, 0.2, 4);

        // Center
        state.x = (vw - vbSize.w * state.s) / 2;
        state.y = (vh - vbSize.h * state.s) / 2;
      } else {
        state.s = 1;
        state.x = 0;
        state.y = 0;
      }
      apply();
    }

    // Initial fit after layout settles
    requestAnimationFrame(() => {
      requestAnimationFrame(fitToViewport);
    });

    // Drag-to-pan
    let dragging = false;
    let startX = 0, startY = 0;
    let baseX = 0, baseY = 0;

    function onDown(e) {
      dragging = true;
      viewport.classList.add("is-dragging");
      startX = e.clientX;
      startY = e.clientY;
      baseX = state.x;
      baseY = state.y;
      viewport.setPointerCapture?.(e.pointerId);
    }

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      state.x = baseX + dx;
      state.y = baseY + dy;
      apply();
    }

    function onUp(e) {
      dragging = false;
      viewport.classList.remove("is-dragging");
      viewport.releasePointerCapture?.(e.pointerId);
    }

    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("pointerleave", onUp);

    // Wheel-to-zoom (zoom towards cursor)
    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const prev = state.s;
        const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        state.s = clamp(state.s * delta, 0.2, 6);

        // Zoom around cursor: adjust translation so point under cursor stays fixed
        state.x = cx - ((cx - state.x) * state.s) / prev;
        state.y = cy - ((cy - state.y) * state.s) / prev;

        apply();
      },
      { passive: false }
    );

    // Reset
    if (resetBtn) resetBtn.addEventListener("click", fitToViewport);

    // Re-fit on resize
    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(fitToViewport, 120);
    });
  }

  async function loadOne(card) {
    const url = card.getAttribute("data-svg-url");
    const viewport = card.querySelector("[data-diagram-viewport]");
    if (!url || !viewport) return;

    viewport.innerHTML = `<div class="diagram-loading">Loading diagram…</div>`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      let text = await res.text();
      text = stripXmlPreamble(text);

      // Insert SVG
      viewport.innerHTML = text;

      const svg = viewport.querySelector("svg");
      if (!svg) throw
