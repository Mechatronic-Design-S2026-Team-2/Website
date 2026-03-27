(() => {
  if (window.__TEAM2_PM_BUDGET_INIT__) return;
  window.__TEAM2_PM_BUDGET_INIT__ = true;

  function initBudgetCard(card) {
    if (!card || card.dataset.pmBudgetInited === "1") return;
    card.dataset.pmBudgetInited = "1";

    const tableWrap = card.querySelector("[data-budget-table]");
    const rows = Array.from(card.querySelectorAll("[data-budget-row]"));
    const searchInput = card.querySelector("[data-budget-search]");
    const categorySelect = card.querySelector("[data-budget-filter]");
    const countEl = card.querySelector("[data-budget-count]");

    if (!tableWrap || !rows.length) return;

    function applyFilters() {
      const query = (searchInput?.value || "").trim().toLowerCase();
      const category = (categorySelect?.value || "all").trim().toLowerCase();

      let visible = 0;

      rows.forEach((row) => {
        const rowCategory = (row.dataset.category || "").trim().toLowerCase();
        const haystack = (row.dataset.search || "").trim().toLowerCase();

        const categoryMatch = category === "all" || rowCategory === category;
        const queryMatch = !query || haystack.includes(query);
        const show = categoryMatch && queryMatch;

        row.hidden = !show;
        row.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });

      if (countEl) {
        countEl.textContent = `Showing ${visible} of ${rows.length} items`;
      }
    }

    searchInput?.addEventListener("input", applyFilters);
    categorySelect?.addEventListener("change", applyFilters);
    applyFilters();
  }

  function initAll() {
    document.querySelectorAll("[data-budget-table]").forEach((tableWrap) => {
      initBudgetCard(tableWrap.closest(".pm-card"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
