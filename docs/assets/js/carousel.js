(() => {
  if (window.__TEAM2_CAROUSEL_INIT__) return;
  window.__TEAM2_CAROUSEL_INIT__ = true;

  function initCarousel(root) {
    if (!root || root.dataset.carouselInited === "1") return;
    root.dataset.carouselInited = "1";

    const slides = Array.from(root.querySelectorAll("[data-slide]"));
    if (!slides.length) return;

    const prevBtn = root.querySelector("[data-prev]");
    const nextBtn = root.querySelector("[data-next]");
    const dotsEl = root.querySelector("[data-dots]");
    const autoplayMs = Number(root.dataset.autoplayMs || 5000);

    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;

    function syncMedia() {
      slides.forEach((slide, k) => {
        const isActive = k === index;
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");

        slide.querySelectorAll("video").forEach((video) => {
          if (isActive) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
            try {
              video.currentTime = 0;
            } catch (_) {}
          }
        });

        slide.querySelectorAll("model-viewer").forEach((viewer) => {
          if (isActive) {
            viewer.setAttribute("camera-controls", "");
            viewer.style.pointerEvents = "auto";
            viewer.tabIndex = 0;
          } else {
            viewer.removeAttribute("camera-controls");
            viewer.style.pointerEvents = "none";
            viewer.tabIndex = -1;
          }
        });
      });
    }

    function setActive(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === index));
      if (dotsEl) {
        Array.from(dotsEl.querySelectorAll(".carousel-dot")).forEach((d, k) => {
          d.classList.toggle("is-active", k === index);
          d.setAttribute("aria-selected", k === index ? "true" : "false");
        });
      }
      syncMedia();
    }

    if (dotsEl) {
      dotsEl.innerHTML = "";
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carousel-dot" + (i === index ? " is-active" : "");
        b.setAttribute("aria-label", `Go to slide ${i + 1}`);
        b.setAttribute("aria-selected", i === index ? "true" : "false");
        b.addEventListener("click", () => setActive(i));
        dotsEl.appendChild(b);
      });
    }

    prevBtn?.addEventListener("click", () => setActive(index - 1));
    nextBtn?.addEventListener("click", () => setActive(index + 1));

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (!Number.isFinite(autoplayMs) || autoplayMs <= 0 || slides.length < 2) return;
      timer = setInterval(() => setActive(index + 1), autoplayMs);
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") setActive(index - 1);
      if (e.key === "ArrowRight") setActive(index + 1);
    });
    root.tabIndex = 0;

    setActive(index);
    start();
  }

  function initAll() {
    document.querySelectorAll("[data-carousel]").forEach(initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
