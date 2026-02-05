(() => {
  const cards = document.querySelectorAll(".team-card");
  if (!cards.length) return;

  const backdrop = document.querySelector(".team-modal-backdrop");
  const modal = document.querySelector(".team-modal");
  const closeBtn = document.querySelector(".team-modal-close");

  const titleEl = document.getElementById("teamModalTitle");
  const roleEl = document.getElementById("teamModalRole");
  const bioEl = document.getElementById("teamModalBio");
  const linksEl = document.getElementById("teamModalLinks");

  let lastFocused = null;

  function openModal(card) {
    lastFocused = document.activeElement;

    titleEl.textContent = card.dataset.name || "";
    roleEl.textContent = card.dataset.role || "";
    bioEl.textContent = card.dataset.bio || "";

    linksEl.innerHTML = "";
    try {
      const links = JSON.parse(card.dataset.links || "[]");
      links.forEach((l) => {
        const a = document.createElement("a");
        a.href = l.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = l.label;
        linksEl.appendChild(a);
      });
    } catch (_) {}

    backdrop.hidden = false;
    modal.hidden = false;
    closeBtn.focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    modal.hidden = true;
    if (lastFocused) lastFocused.focus();
  }

  cards.forEach((card) => card.addEventListener("click", () => openModal(card)));
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (!modal.hidden && e.key === "Escape") closeModal();
  });
})();
