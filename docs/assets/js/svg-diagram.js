// docs/assets/js/svg-diagram.js
(function () {
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function setupPanZoom(card) {
    const viewport = card.querySelector("[data-diagram-viewport]");
    const resetBtn = card.querySelector("[data-diagram-reset]");
    const img = viewport ? viewport.querySelector("img.diagram-img") : null;
    if (!viewport || !img) return;

    const stage = viewport.querySelector(".diagram-stage");
    const state = { x: 0, y: 0, s: 1 };

    function apply() {
      stage.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.s})`;
    }

    function fitToViewport() {
      const rect = viewport.getBoundingClientRect();
      const vw = rect.width;
      const vh = rect.height;

      // Natural size works well for draw.io exports (they include width/height)
      const iw = img.naturalWidth || 0;
      const ih = img.naturalHeight || 0;

      if (vw <= 0 || vh <= 0 || iw <= 0 || ih <= 0) {
        // Fallback: just reset
        state.s = 1;
        state.x = 0;
        state.y = 0;
        apply();
        return;
      }

      const pad = 16;
      const scale = Math.min((vw - pad) / iw, (vh - pad) / ih);
      state.s = clamp(scale, 0.2, 6);

      state.x = (vw - iw * state.s) / 2;
      state.y = (vh - ih * state.s) / 2;

      apply();
    }

    // Initial fit
    requestAnimationFrame(() => requestAnimationFrame(fitToViewport));

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
      if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
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
      if (viewport.releasePointerCapture) viewport.releasePointerCapture(e.pointerId);
    }

    viewport.addEventListener("pointerdown", onDown);
    viewport.addEventListener("pointermove", onMove);
    viewport.addEventListener("pointerup", onUp);
    viewport.addEventListener("pointercancel", onUp);
    viewport.addEventListener("pointerleave", onUp);

    // Wheel-to-zoom towards cursor
    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = viewport.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const prev = state.s;
        const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        state.s = clamp(state.s * delta, 0.2, 10);

        // Keep cursor point fixed
        state.x = cx - ((cx - state.x) * state.s) / prev;
        state.y = cy - ((cy - state.y) * state.s) / prev;

        apply();
      },
      { passive: false }
    );

    if (resetBtn) resetBtn.addEventListener("click", fitToViewport);

    // Refit on resize
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

    // Build stage + image (no fetch needed)
    viewport.innerHTML = `
      <div class="diagram-loading">Loading diagram…</div>
      <div class="diagram-stage"></div>
    `;
    const stage = viewport.querySelector(".diagram-stage");

    const img = document.createElement("img");
    img.className = "diagram-img";
    img.alt = card.getAttribute("data-title") || "Diagram";
    img.loading = "lazy";

    img.onload = () => {
      const loading = viewport.querySelector(".diagram-loading");
      if (loading) loading.remove();
      setupPanZoom(card);
    };

    img.onerror = () => {
      viewport.innerHTML = `<div class="diagram-error">Failed to load SVG image.</div>`;
    };

    stage.appendChild(img);

    // Important: resolve relative correctly even if someone passed /assets/... by accident
    // (handles GitHub Pages baseurl quirks)
    const resolved = new URL(url, document.baseURI).toString();
    img.src = resolved;
  }

  function init() {
    document.querySelectorAll("[data-svg-diagram]").forEach(loadOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
