(() => {
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function clamp(x, a, b) {
    return Math.max(a, Math.min(b, x));
  }

  function initCard(card) {
    const url = card.dataset.svgUrl;
    const viewport = card.querySelector("[data-diagram-viewport]");
    const resetBtn = card.querySelector("[data-diagram-reset]");

    if (!url || !viewport) return;

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let inner = null;

    const apply = () => {
      if (!inner) return;
      inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    const reset = () => {
      if (!inner) return;
      // Fit to viewport based on SVG viewBox if available
      const svg = inner.querySelector("svg");
      const vb = svg?.viewBox?.baseVal;

      const vw = viewport.clientWidth || 1;
      const vh = viewport.clientHeight || 1;

      if (vb && vb.width && vb.height) {
        const s = Math.min(vw / vb.width, vh / vb.height);
        scale = clamp(s * 0.98, 0.25, 6);
        // center
        const contentW = vb.width * scale;
        const contentH = vb.height * scale;
        tx = (vw - contentW) / 2;
        ty = (vh - contentH) / 2;
      } else {
        scale = 1;
        tx = 0;
        ty = 0;
      }
      apply();
    };

    if (resetBtn) resetBtn.addEventListener("click", reset);

    fetch(url, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
        return r.text();
      })
      .then((txt) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(txt, "image/svg+xml");
        const svg = doc.documentElement;

        // Basic sanity check
        if (!svg || svg.nodeName.toLowerCase() !== "svg") {
          throw new Error("Response is not an SVG document.");
        }

        // Make it responsive; pan/zoom handled by wrapper transform
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.classList.add("diagram-svg");

        viewport.innerHTML = "";
        inner = document.createElement("div");
        inner.className = "diagram-inner";
        inner.appendChild(document.importNode(svg, true));
        viewport.appendChild(inner);

        // Pan
        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        viewport.addEventListener("pointerdown", (e) => {
          dragging = true;
          viewport.setPointerCapture(e.pointerId);
          lastX = e.clientX;
          lastY = e.clientY;
          viewport.classList.add("is-dragging");
        });

        viewport.addEventListener("pointermove", (e) => {
          if (!dragging) return;
          tx += e.clientX - lastX;
          ty += e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          apply();
        });

        const endDrag = (e) => {
          if (!dragging) return;
          dragging = false;
          viewport.classList.remove("is-dragging");
          try {
            viewport.releasePointerCapture(e.pointerId);
          } catch {}
        };

        viewport.addEventListener("pointerup", endDrag);
        viewport.addEventListener("pointercancel", endDrag);

        // Zoom (wheel)
        viewport.addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const factor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = clamp(scale * factor, 0.25, 6);
            const k = newScale / scale;

            // keep mouse point stable
            tx = mx - (mx - tx) * k;
            ty = my - (my - ty) * k;

            scale = newScale;
            apply();
          },
          { passive: false }
        );

        // Double-click reset
        viewport.addEventListener("dblclick", reset);

        // Initial fit
        reset();
      })
      .catch((err) => {
        viewport.innerHTML = `
          <div class="diagram-error">
            <strong>Failed to load diagram.</strong><br>
            <a href="${esc(url)}" target="_blank" rel="noreferrer">Open SVG directly</a><br>
            <small>${esc(err.message)}</small>
          </div>
        `;
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-svg-diagram]").forEach(initCard);
  });
})();
