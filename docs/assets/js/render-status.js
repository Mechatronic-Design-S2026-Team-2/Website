(async function () {
  const url = window.STATUS_JSON_URL || "/assets/data/status.json";
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();


  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";
  const esc = (s) => String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  // Current milestone
  const m = data.currentMilestone;
  document.getElementById("milestoneBox").innerHTML = m
    ? `
      <div><strong><a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a></strong></div>
      <div>Due: ${fmtDate(m.dueOn)}</div>
      <div>${m.openIssues} open / ${m.closedIssues} closed</div>
    `
    : `<div>None set.</div>`;

  // Schedule
  const schedule = data.schedule ?? [];
  const schedEl = document.getElementById("scheduleList");
  schedEl.innerHTML = schedule.slice(0, 10).map(s => `
    <li>
      <a href="${s.url}" target="_blank" rel="noreferrer">${esc(s.title)}</a>
      <small> — due ${fmtDate(s.dueOn)} (${s.openIssues} open)</small>
    </li>
  `).join("") || "<li>No upcoming milestones with due dates.</li>";

  // Latest update
  const u = data.latestUpdate;
  document.getElementById("updateBox").innerHTML = u
    ? `<div>${esc(u.body)}</div><small>${fmtDate(u.createdAt)}</small>`
    : `<div>No updates found.</div>`;

  // Now items (from Project fields)
  const now = data.now ?? [];
  const statusField = data.fieldNames?.status ?? "Status";
  const dueField = data.fieldNames?.due ?? "Due date";
  const demoField = data.fieldNames?.targetDemo ?? "Target Demo";

  const nowEl = document.getElementById("nowList");
  nowEl.innerHTML = now.map(it => {
    const status = it.fields?.[statusField] ?? "—";
    const due = it.fields?.[dueField] ?? null;
    const demo = it.fields?.[demoField] ?? null;
    const who = it.assignees?.[0] ?? "unassigned";
    const label = it.number ? `#${it.number}` : "Draft";

    return `
      <li>
        <a href="${it.url}" target="_blank" rel="noreferrer">${label} ${esc(it.title)}</a>
        <small> — ${esc(status)} • ${esc(who)}${demo ? " • " + esc(demo) : ""}${due ? " • due " + fmtDate(due) : ""}</small>
      </li>
    `;
  }).join("") || "<li>No active items found (check Status field names / values).</li>";

  // Recently updated issues
  const issues = data.issues ?? [];
  const issuesEl = document.getElementById("issueList");
  issuesEl.innerHTML = issues.slice(0, 10).map(i => `
    <li>
      <a href="${i.url}" target="_blank" rel="noreferrer">#${i.number} ${esc(i.title)}</a>
      <small> — updated ${fmtDate(i.updatedAt)}</small>
    </li>
  `).join("") || "<li>No open issues found.</li>";
})();
