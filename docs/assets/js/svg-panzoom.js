(() => {
  if (window.__t2SvgPanZoomInit) return;
  window.__t2SvgPanZoomInit = true;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function ensureViewBox(svg) {
    const vb = svg.getAttribute("viewBox");
    if (vb) return vb.split(/\s+/).map(Number);

    // fall back to width/height attrs
    const wAttr = svg.getAttribute("width") || "1000";
    const hAttr = svg.getAttribute("height") || "600";
    const w = Number(String(wAttr).replace(/[^\d.]/g, "")) || 1000;
    const h = Number(String(hAttr).replace(/[^\d.]/g, "")) || 600;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    return [0, 0, w, h];
  }

  function initFrame(frame) {
    const src = frame.getAttribute("data-src");
    if (!src) return;

    fetch(src, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((svgText) => {
        frame.innerHTML = svgText;

        const svg = frame.querySelector("svg");
        if (!svg) throw new Error("No <svg> found");

        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";

        const vb0 = ensureViewBox(svg);
        let vb = { x: vb0[0], y: vb0[1], w: vb0[2], h: vb0[3] };

        // Controls
        const controls = document.createElement("div");
        controls.className = "t2-diagram-controls";
        controls.innerHTML = `
          <button class="t2-diagram-btn" type="button" data-act="fit">Fit</button>
          <button class="t2-diagram-btn" type="button" data-act="reset">Reset</button>
        `;
        frame.appendChild(controls);

        const apply = () => svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

        controls.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-act]");
          if (!btn) return;
          const act = btn.getAttribute("data-act");
          if (act === "reset" || act === "fit") {
            vb = { x: vb0[0], y: vb0[1], w: vb0[2], h: vb0[3] };
            apply();
          }
        });

        // Screen → SVG coord helper
        const pt = svg.createSVGPoint();
        const toSvgPoint = (evt) => {
          pt.x = evt.clientX;
          pt.y = evt.clientY;
          const ctm = svg.getScreenCTM();
          if (!ctm) return { x: 0, y: 0 };
          const p = pt.matrixTransform(ctm.inverse());
          return { x: p.x, y: p.y };
        };

        // Zoom
        svg.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();
            const p = toSvgPoint(e);

            // zoom factor
            const factor = e.deltaY < 0 ? 0.9 : 1.1;

            // limit zoom in/out
            const minW = vb0[2] * 0.15;
            const maxW = vb0[2] * 8.0;

            const newW = clamp(vb.w * factor, minW, maxW);
            const newH = (newW / vb.w) * vb.h;

            // keep cursor point stable
            const dx = (p.x - vb.x) / vb.w;
            const dy = (p.y - vb.y) / vb.h;

            vb.x = p.x - dx * newW;
            vb.y = p.y - dy * newH;
            vb.w = newW;
            vb.h = newH;

            apply();
          },
          { passive: false }
        );

        // Pan (drag)
        let dragging = false;
        let start = null;
        let startVb = null;

        svg.addEventListener("pointerdown", (e) => {
          dragging = true;
          svg.setPointerCapture(e.pointerId);
          start = toSvgPoint(e);
          startVb = { ...vb };
        });

        svg.addEventListener("pointermove", (e) => {
          if (!dragging || !start || !startVb) return;
          const p = toSvgPoint(e);
          vb.x = startVb.x - (p.x - start.x);
          vb.y = startVb.y - (p.y - start.y);
          apply();
        });

        const endDrag = () => {
          dragging = false;
          start = null;
          startVb = null;
        };

        svg.addEventListener("pointerup", endDrag);
        svg.addEventListener("pointercancel", endDrag);
        svg.addEventListener("pointerleave", endDrag);
      })
      .catch(() => {
        frame.innerHTML = `<div class="t2-diagram-loading">Failed to load diagram.</div>`;
      });
  }

  function initAll() {
    document.querySelectorAll("[data-svg-panzoom]").forEach(initFrame);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
