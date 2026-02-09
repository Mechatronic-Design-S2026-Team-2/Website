(async function () {
  const url = window.STATUS_JSON_URL || "/assets/data/status.json";

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    const all = ["pmUpcoming", "pmMilestones", "pmDoneItems", "pmSummaryCounts"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    for (const el of all) el.innerHTML = "<div class='pm-loading'>Failed to load status.json.</div>";
    return;
  }

  // ---- Upcoming (issue-based) ----
  const upcoming = Array.isArray(data.scheduleItems) ? data.scheduleItems : [];
  const upcomingEl = document.getElementById("pmUpcoming");
  if (upcomingEl) {
    if (!upcoming.length) {
      upcomingEl.innerHTML = "<p><em>No upcoming project items found.</em></p>";
    } else {
      // Group by milestone
      const groups = new Map();
      for (const it of upcoming) {
        const key = it.milestone?.title || "No milestone";
        if (!groups.has(key)) groups.set(key, { title: key, dueOn: it.milestone?.dueOn || null, url: it.milestone?.url || null, items: [] });
        groups.get(key).items.push(it);
      }

      upcomingEl.innerHTML = Array.from(groups.values())
        .map((g) => {
          const head = g.url
            ? `<a href="${g.url}" target="_blank" rel="noreferrer">${esc(g.title)}</a>`
            : esc(g.title);

          const rows = g.items.map((it) => {
            const who = (it.assignees ?? []).length ? it.assignees.join(", ") : "unassigned";
            const due = it.due ?? it.milestone?.dueOn ?? null;
            const status = it.status ?? "—";
            const label = it.number ? `#${it.number}` : "Draft";

            return `
              <tr>
                <td class="pm-title">
                  <a href="${it.url}" target="_blank" rel="noreferrer">${esc(label)} ${esc(it.title)}</a>
                  <div class="pm-meta">
                    <span class="pm-pill">${esc(status)}</span>
                    <span class="pm-who">${esc(who)}</span>
                  </div>
                </td>
                <td class="pm-due">${due ? fmtDate(due) : "—"}</td>
              </tr>
            `;
          }).join("");

          return `
            <section class="pm-group">
              <div class="pm-group-head">
                <strong>${head}</strong>
                <span class="pm-group-sub">${g.dueOn ? "Due " + fmtDate(g.dueOn) : ""}</span>
              </div>
              <div class="pm-table-wrap">
                <table class="pm-table">
                  <thead><tr><th>Item</th><th>Due</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </section>
          `;
        })
        .join("");
    }
  }

  // ---- Milestones list (repo milestones) ----
  const milestones = Array.isArray(data.schedule) ? data.schedule : [];
  const msEl = document.getElementById("pmMilestones");
  if (msEl) {
    msEl.innerHTML =
      milestones
        .slice(0, 20)
        .map((m) => `
          <li>
            <a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a>
            <small> — due ${fmtDate(m.dueOn)} • ${m.openIssues} open</small>
          </li>
        `)
        .join("") || "<li>No upcoming milestones with due dates.</li>";
  }

  // ---- Done items (from project status) ----
  const done = Array.isArray(data.doneItemsRecent) ? data.doneItemsRecent : [];
  const doneEl = document.getElementById("pmDoneItems");
  if (doneEl) {
    doneEl.innerHTML =
      done
        .slice(0, 25)
        .map((i) => {
          const who = (i.assignees ?? []).length ? i.assignees.join(", ") : "unassigned";
          const ms = i.milestone?.title ?? null;
          return `
            <li>
              <a href="${i.url}" target="_blank" rel="noreferrer">#${i.number} ${esc(i.title)}</a>
              <small> — ${fmtDate(i.updatedAt)} • ${esc(who)}${ms ? " • ms: " + esc(ms) : ""}</small>
            </li>
          `;
        })
        .join("") || "<li>No Done items found.</li>";
  }

  // ---- Summary ----
  const countEl = document.getElementById("pmSummaryCounts");
  if (countEl) {
    const openCount = data.openIssues ?? (data.issues?.length ?? 0);
    countEl.innerHTML = `
      <div><strong>${upcoming.length}</strong> upcoming items</div>
      <div><strong>${milestones.length}</strong> milestones</div>
      <div><strong>${openCount}</strong> open issues</div>
      <div><strong>${done.length}</strong> done items</div>
    `;
  }
})();
