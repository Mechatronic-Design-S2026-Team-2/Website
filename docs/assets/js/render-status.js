(async function () {
  const url = window.STATUS_JSON_URL || "/assets/data/status.json";
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";
  const esc = (s) => String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const fmtAssignees = (arr) => {
    const a = (arr ?? []).filter(Boolean);
    if (!a.length) return "unassigned";
    return a.join(", ");
  };

  const typeLabel = (t) => {
    if (t === "milestone") return "Milestone";
    if (t === "issue") return "Issue";
    if (t === "pull_request") return "PR";
    if (t === "draft") return "Draft";
    return "Item";
  };

  // ---- NOW items (full width)
  const now = data.now ?? [];
  const statusField = data.fieldNames?.status ?? "Status";
  const dueField = data.fieldNames?.due ?? "Due date";
  const demoField = data.fieldNames?.targetDemo ?? "Target Demo";

  const nowEl = document.getElementById("nowList");
  nowEl.innerHTML = now.map(it => {
    const status = it.fields?.[statusField] ?? "—";
    const due = it.fields?.[dueField] ?? null;
    const demo = it.fields?.[demoField] ?? null;
    const who = fmtAssignees(it.assignees);
    const label = it.number ? `#${it.number}` : "Draft";

    return `
      <li>
        <a href="${it.url}" target="_blank" rel="noreferrer">${label} ${esc(it.title)}</a>
        <small class="status-assignees">
          — ${esc(status)} • ${esc(who)}
          ${demo ? " • " + esc(demo) : ""}
          ${due ? " • due " + fmtDate(due) : ""}
        </small>
      </li>
    `;
  }).join("") || "<li>No active items found (check Status field names / values).</li>";

  // ---- Current milestone (half width, left on desktop)
  const m = data.currentMilestone;
  document.getElementById("milestoneBox").innerHTML = m
    ? `
      <div><strong><a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a></strong></div>
      <div>Due: ${fmtDate(m.dueOn)}</div>
      <div>${m.openIssues} open / ${m.closedIssues} closed</div>
    `
    : `<div>None set.</div>`;

  // ---- Latest update (half width, right on desktop)
  const u = data.latestUpdate;
  document.getElementById("updateBox").innerHTML = u
    ? `<div>${esc(u.body)}</div><small>${fmtDate(u.createdAt)}</small>`
    : `<div>No updates found.</div>`;

  // ---- Schedule (milestones + due-dated issues/items) (half width, left on desktop)
  const scheduleItems = data.scheduleItems ?? [];
  const schedEl = document.getElementById("scheduleList");

  schedEl.innerHTML = scheduleItems.slice(0, 12).map(s => {
    const who = fmtAssignees(s.assignees);
    const t = typeLabel(s.type);
    const number = s.meta?.number ? `#${s.meta.number} ` : "";
    const status = s.meta?.status ? ` • ${esc(s.meta.status)}` : "";
    const milestoneHint = s.meta?.milestone ? ` • ${esc(s.meta.milestone)}` : "";

    return `
      <li>
        <a href="${s.url}" target="_blank" rel="noreferrer">${number}${esc(s.title)}</a>
        <span class="status-pill">${esc(t)}</span>
        <small class="status-assignees">
          — due ${fmtDate(s.dueOn)} • ${esc(who)}${status}${milestoneHint}
        </small>
      </li>
    `;
  }).join("") || "<li>No due-dated items found (set Due date field or milestone due dates).</li>";

  // ---- Recently updated issues (half width, right on desktop) + assignees
  const issues = data.issues ?? [];
  const issuesEl = document.getElementById("issueList");
  issuesEl.innerHTML = issues.slice(0, 12).map(i => {
    const who = fmtAssignees(i.assignees);
    return `
      <li>
        <a href="${i.url}" target="_blank" rel="noreferrer">#${i.number} ${esc(i.title)}</a>
        <small class="status-assignees"> — updated ${fmtDate(i.updatedAt)} • ${esc(who)}</small>
      </li>
    `;
  }).join("") || "<li>No open issues found.</li>";
})();
