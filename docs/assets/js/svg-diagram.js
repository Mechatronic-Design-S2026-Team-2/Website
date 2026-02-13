// docs/assets/js/svg-diagram.js
(() => {
  if (window.__TEAM2_SVGDIAGRAM_INIT__) return;
  window.__TEAM2_SVGDIAGRAM_INIT__ = true;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function parseViewBox(svg) {
    const vb = (svg.getAttribute("viewBox") || "").trim();
    const parts = vb.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite)) {
      return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
    return null;
  }

  function setViewBox(svg, vb) {
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function safeGetBBox(svg) {
    try {
      const bb = svg.getBBox();
      if (bb && bb.width > 0 && bb.height > 0) return bb;
    } catch (_) {}
    return null;
  }

  function ensureBaseViewBox(svg) {
    // Prefer the SVG's own viewBox (draw.io exports typically have it and it’s correct)
    const existing = parseViewBox(svg);
    if (existing && existing.w > 0 && existing.h > 0) return existing;

    // Otherwise derive from rendered bbox
    const bb = safeGetBBox(svg);
    if (bb) {
      const padX = bb.width * 0.02;
      const padY = bb.height * 0.02;
      const base = { x: bb.x - padX, y: bb.y - padY, w: bb.width + 2 * padX, h: bb.height + 2 * padY };
      setViewBox(svg, base);
      return base;
    }

    // Fallback: infer from width/height attributes
    const w = parseFloat(svg.getAttribute("width")) || 1200;
    const h = parseFloat(svg.getAttribute("height")) || 700;
    const base = { x: 0, y: 0, w, h };
    setViewBox(svg, base);
    return base;
  }

  function fit(svg, base, paddingFrac = 0.04) {
    const padX = base.w * paddingFrac;
    const padY = base.h * paddingFrac;
    const vb = { x: base.x - padX, y: base.y - padY, w: base.w + 2 * padX, h: base.h + 2 * padY };
    setViewBox(svg, vb);
    return vb;
  }

  // When preserveAspectRatio is "xMidYMid meet", there can be letterboxing.
  // This computes the rendered scale and offsets so cursor zoom feels correct.
  function renderMetrics(viewport, vb) {
    const cw = viewport.clientWidth;
    const ch = viewport.clientHeight;

    const scale = Math.min(cw / vb.w, ch / vb.h);
    const vw = vb.w * scale;
    const vh = vb.h * scale;

    const offX = (cw - vw) / 2;
    const offY = (ch - vh) / 2;

    return { cw, ch, scale, vw, vh, offX, offY };
  }

  function clientToSvgPoint(ev, viewport, vb) {
    const rect = viewport.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;

    const m = renderMetrics(viewport, vb);

    // Normalize within the actually-rendered SVG area (excluding letterbox margins)
    const rx = (px - m.offX) / m.vw;
    const ry = (py - m.offY) / m.vh;

    const crx = clamp(rx, 0, 1);
    const cry = clamp(ry, 0, 1);

    return {
      rx: crx,
      ry: cry,
      x: vb.x + vb.w * crx,
      y: vb.y + vb.h * cry,
      scale: m.scale
    };
  }

  async function loadSVG(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch SVG (${res.status})`);
    const text = await res.text();

    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("SVG parse failed (no <svg>)");
    return svg;
  }

  function initViewport(viewport) {
    if (viewport.dataset.svgdiInited === "1") return;
    viewport.dataset.svgdiInited = "1";

    const url = viewport.dataset.svgUrl;
    if (!url) return;

    const card = viewport.closest(".svgdi-card") || viewport.parentElement;
    const resetBtn = card ? card.querySelector("[data-svgdi-reset]") : null;

    const state = {
      svg: null,
      base: null,
      dragging: false,
      dragStart: null,
      dragVB: null,
      ro: null
    };

    const fail = (msg) => {
      viewport.innerHTML = `<div class="svgdi-loading">${msg}</div>`;
    };

    loadSVG(url)
      .then((svg) => {
        // Normalize rendering behavior
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        svg.classList.add("svgdi-svg");
        // prevent any accidental inline filter inversion on the root svg
        if (svg.style && svg.style.filter) svg.style.filter = "none";

        viewport.innerHTML = "";
        viewport.appendChild(svg);

        state.svg = svg;

        // Wait a frame so bbox/viewBox computations are reliable
        requestAnimationFrame(() => {
          state.base = ensureBaseViewBox(svg);

          // This is the key fix for your “tiny + offset” default view:
          // always start in a fitted, centered viewBox.
          fit(svg, state.base, 0.04);
        });

        // Resize: refit only if user hasn't interacted since load
        state.ro = new ResizeObserver(() => {
          if (!state.svg || !state.base) return;
          if (viewport.dataset.svgdiUserMoved === "1") return;
          fit(state.svg, state.base, 0.04);
        });
        state.ro.observe(viewport);

        // Zoom (wheel)
        viewport.addEventListener(
          "wheel",
          (ev) => {
            if (!state.svg || !state.base) return;
            ev.preventDefault();
            viewport.dataset.svgdiUserMoved = "1";

            const vb = parseViewBox(state.svg);
            if (!vb) return;

            const pt = clientToSvgPoint(ev, viewport, vb);

            // smooth zoom: deltaY>0 zoom out, deltaY<0 zoom in
            const zoom = Math.exp(ev.deltaY * 0.0012);

            let newW = vb.w * zoom;
            let newH = vb.h * zoom;

            const minW = state.base.w * 0.08;
            const minH = state.base.h * 0.08;
            const maxW = state.base.w * 20;
            const maxH = state.base.h * 20;

            newW = clamp(newW, minW, maxW);
            newH = clamp(newH, minH, maxH);

            const newX = pt.x - newW * pt.rx;
            const newY = pt.y - newH * pt.ry;

            setViewBox(state.svg, { x: newX, y: newY, w: newW, h: newH });
          },
          { passive: false }
        );

        // Pan (pointer drag)
        viewport.addEventListener("pointerdown", (ev) => {
          if (!state.svg) return;
          viewport.dataset.svgdiUserMoved = "1";

          state.dragging = true;
          viewport.classList.add("is-grabbing");
          viewport.setPointerCapture(ev.pointerId);

          state.dragStart = { x: ev.clientX, y: ev.clientY };
          state.dragVB = parseViewBox(state.svg);
        });

        viewport.addEventListener("pointermove", (ev) => {
          if (!state.dragging || !state.svg || !state.dragStart || !state.dragVB) return;

          const vb = state.dragVB;
          const m = renderMetrics(viewport, vb);

          // Convert pixels to SVG units using the current rendered scale
          const dxPx = ev.clientX - state.dragStart.x;
          const dyPx = ev.clientY - state.dragStart.y;

          const dx = dxPx / m.scale;
          const dy = dyPx / m.scale;

          setViewBox(state.svg, { x: vb.x - dx, y: vb.y - dy, w: vb.w, h: vb.h });
        });

        viewport.addEventListener("pointerup", () => {
          state.dragging = false;
          viewport.classList.remove("is-grabbing");
        });

        viewport.addEventListener("pointercancel", () => {
          state.dragging = false;
          viewport.classList.remove("is-grabbing");
        });

        // Reset view button
        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            if (!state.svg || !state.base) return;
            viewport.dataset.svgdiUserMoved = "0";
            fit(state.svg, state.base, 0.04);
          });
        }
      })
      .catch((e) => {
        console.error(e);
        fail("Failed to load diagram.");
      });
  }

  function initAll() {
    document.querySelectorAll("[data-svgdi]").forEach(initViewport);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
