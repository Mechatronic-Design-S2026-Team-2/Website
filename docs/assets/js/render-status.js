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

  // ----- Current milestone (repo milestones) -----
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
      "<li>No active items found (check Status values).</li>";
  }

  // ----- Upcoming project items (ISSUE-BASED schedule) -----
  const upcoming = data.scheduleItems ?? [];
  const upcomingEl = document.getElementById("upcomingList");
  if (upcomingEl) {
    upcomingEl.innerHTML =
      upcoming
        .slice(0, 10)
        .map((it) => {
          const who =
            (it.assignees ?? []).length ? (it.assignees ?? []).join(", ") : "unassigned";
          const status = it.status ?? "—";
          const due = it.due ?? it.milestone?.dueOn ?? null;
          const ms = it.milestone?.title ?? null;
          const label = it.number ? `#${it.number}` : "Draft";

          return `
            <li>
              <a href="${it.url}" target="_blank" rel="noreferrer">${esc(label)} ${esc(it.title)}</a>
              <small>
                — ${esc(status)} • ${esc(who)}
                ${ms ? " • ms: " + esc(ms) : ""}
                ${due ? " • due " + fmtDate(due) : ""}
              </small>
            </li>
          `;
        })
        .join("") || "<li>No upcoming project items found.</li>";
  }

  // ----- Recently “Done” issues (from Project Status) -----
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
        .join("") || "<li>No Done items found.</li>";
  }
})();
