(async function () {
  const url = window.STATUS_JSON_URL || "/assets/data/status.json";
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const statusField = data.fieldNames?.status ?? "Status";
  const dueField = data.fieldNames?.due ?? "Due date";

  // ----- Current milestone -----
  const m = data.currentMilestone;
  const milestoneBox = document.getElementById("milestoneBox");
  if (milestoneBox) {
    milestoneBox.innerHTML = m
      ? `
        <div><strong><a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a></strong></div>
        <div>Due: ${fmtDate(m.dueOn)}</div>
        <div>${m.openIssues} open / ${m.closedIssues} closed</div>
      `
      : `<div>None set.</div>`;
  }

  // ----- Schedule (repo milestones) -----
  const schedule = data.schedule ?? [];
  const schedEl = document.getElementById("scheduleList");
  if (schedEl) {
    schedEl.innerHTML =
      schedule
        .slice(0, 10)
        .map(
          (s) => `
          <li>
            <a href="${s.url}" target="_blank" rel="noreferrer">${esc(s.title)}</a>
            <small> — due ${fmtDate(s.dueOn)} (${s.openIssues} open)</small>
          </li>
        `
        )
        .join("") || "<li>No upcoming milestones with due dates.</li>";
  }

  // ----- Latest update -----
  const u = data.latestUpdate;
  const updateBox = document.getElementById("updateBox");
  if (updateBox) {
    updateBox.innerHTML = u
      ? `<div>${esc(u.body)}</div><small>${fmtDate(u.createdAt)}</small>`
      : `<div>No updates found.</div>`;
  }

  // ----- Now (Project items with “Now” statuses) -----
  const nowItems = data.now ?? [];
  const nowEl = document.getElementById("nowList");
  if (nowEl) {
    nowEl.innerHTML =
      nowItems
        .map((it) => {
          const status = it.fields?.[statusField] ?? "—";
          const due = it.fields?.[dueField] ?? it.milestone?.dueOn ?? null;
          const milestoneTitle = it.milestone?.title ?? null;
          const who =
            (it.assignees ?? []).length ? (it.assignees ?? []).join(", ") : "unassigned";
          const label = it.number ? `#${it.number}` : "Draft";

          return `
            <li>
              <a href="${it.url}" target="_blank" rel="noreferrer">${esc(label)} ${esc(it.title)}</a>
              <small>
                — ${esc(status)}
                • ${esc(who)}
                ${milestoneTitle ? " • ms: " + esc(milestoneTitle) : ""}
                ${due ? " • due " + fmtDate(due) : ""}
              </small>
            </li>
          `;
        })
        .join("") ||
      "<li>No active items found (check Status field names / values).</li>";
  }

  // ----- Recent “Done” issues (from Project Status) -----
  const done = data.doneItemsRecent ?? [];
  const doneEl = document.getElementById("doneIssueList");
  if (doneEl) {
    doneEl.innerHTML =
      done
        .slice(0, 10)
        .map((i) => {
          const who =
            (i.assignees ?? []).length ? (i.assignees ?? []).join(", ") : "unassigned";
          const ms = i.milestone?.title ?? null;
          return `
            <li>
              <a href="${i.url}" target="_blank" rel="noreferrer">#${i.number} ${esc(i.title)}</a>
              <small> — ${fmtDate(i.updatedAt)} • ${esc(who)}${ms ? " • ms: " + esc(ms) : ""}</small>
            </li>
          `;
        })
        .join("") || "<li>No Done items found (check Status values).</li>";
  }
})();
