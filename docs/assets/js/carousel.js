(function () {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const track = root.querySelector("[data-track]");
  const prevBtn = root.querySelector("[data-prev]");
  const nextBtn = root.querySelector("[data-next]");
  const dotsEl = root.querySelector("[data-dots]");

  let index = slides.findIndex(s => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  function setActive(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === index));
    const dots = dotsEl ? Array.from(dotsEl.querySelectorAll(".carousel-dot")) : [];
    dots.forEach((d, k) => d.classList.toggle("is-active", k === index));
  }

  // Build dots
  if (dotsEl) {
    dotsEl.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => setActive(i));
      dotsEl.appendChild(b);
    });
  }

  prevBtn?.addEventListener("click", () => setActive(index - 1));
  nextBtn?.addEventListener("click", () => setActive(index + 1));

  // Auto-advance (optional)
  let timer = null;
  const AUTOPLAY_MS = 5000;

  function start() {
    stop();
    timer = setInterval(() => setActive(index + 1), AUTOPLAY_MS);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // pause on hover/focus
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);

  // keyboard support
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") setActive(index - 1);
    if (e.key === "ArrowRight") setActive(index + 1);
  });
  root.tabIndex = 0;

  setActive(index);
  start();
})();
