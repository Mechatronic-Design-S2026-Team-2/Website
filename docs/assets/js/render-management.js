(async function () {
  const root = document.getElementById("pmWidget");
  if (!root) return;

  const jsonUrl = root.dataset.statusJson || "/assets/data/status.json";
  const res = await fetch(jsonUrl, { cache: "no-store" });
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
  const demoField = data.fieldNames?.targetDemo ?? "Target Demo";

  // ---------- Schedule (Project items + milestones) ----------
  const scheduleEl = document.getElementById("pmSchedule");
  if (scheduleEl) {
    const items = (data.projectItems ?? []).map((it) => {
      const fields = it.fields ?? {};
      const due = fields[dueField] ?? it.milestone?.dueOn ?? null;
      const demo = fields[demoField] ?? null;
      const status = fields[statusField] ?? "—";
      const assignees = it.assignees ?? [];
      return { ...it, due, demo, status, assignees };
    });

    // Keep only items that contribute to a “schedule”
    const scheduled = items
      .filter((it) => it.due || it.demo)
      .sort((a, b) => {
        const ad = a.due ? new Date(a.due).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.due ? new Date(b.due).getTime() : Number.POSITIVE_INFINITY;
        if (ad !== bd) return ad - bd;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 20);

    // Group by Target Demo if present
    const groups = new Map();
    for (const it of scheduled) {
      const key = it.demo || "No Target Demo set";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    }

    const groupHtml = [...groups.entries()]
      .map(([group, arr]) => {
        const rows = arr
          .slice(0, 40)
          .map((it) => {
            const who = (it.assignees ?? []).join(", ") || "unassigned";
            const label = it.number ? `#${it.number}` : (it.type === "PullRequest" ? "PR" : "Item");
            return `
              <tr>
                <td class="pm-td pm-tight">${esc(group)}</td>
                <td class="pm-td">
                  <a href="${it.url}" target="_blank" rel="noreferrer">${esc(label)} ${esc(it.title)}</a>
                  <div class="pm-meta">
                    <span class="pm-pill">${esc(it.status)}</span>
                    <span class="pm-muted">•</span> ${esc(who)}
                    ${it.milestone?.title ? `<span class="pm-muted">•</span> ms: ${esc(it.milestone.title)}` : ""}
                  </div>
                </td>
                <td class="pm-td pm-tight">${fmtDate(it.due)}</td>
              </tr>
            `;
          })
          .join("");

        return rows;
      })
      .join("");

    const milestoneRows = (data.schedule ?? [])
      .slice(0, 15)
      .map((m) => `
        <tr>
          <td class="pm-td">
            <a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a>
            <div class="pm-meta">${m.openIssues} open / ${m.closedIssues} closed</div>
          </td>
          <td class="pm-td pm-tight">${fmtDate(m.dueOn)}</td>
        </tr>
      `)
      .join("");

    scheduleEl.innerHTML = `
      <div class="pm-section">
        <h4 class="pm-h4">Upcoming project items</h4>
        <div class="pm-table-wrap">
          <table class="pm-table">
            <thead>
              <tr>
                <th class="pm-th pm-tight">${esc(demoField)}</th>
                <th class="pm-th">Item</th>
                <th class="pm-th pm-tight">${esc(dueField)}</th>
              </tr>
            </thead>
            <tbody>
              ${groupHtml || `<tr><td class="pm-td" colspan="3">No scheduled items found (check Target Demo / Due date fields).</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="pm-section">
        <h4 class="pm-h4">Milestones</h4>
        <div class="pm-table-wrap">
          <table class="pm-table">
            <thead>
              <tr>
                <th class="pm-th">Milestone</th>
                <th class="pm-th pm-tight">Due</th>
              </tr>
            </thead>
            <tbody>
              ${milestoneRows || `<tr><td class="pm-td" colspan="2">No milestones with due dates found.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ---------- Issues log (closed issues + merged PRs) ----------
  const closedEl = document.getElementById("pmClosedIssues");
  const prsEl = document.getElementById("pmMergedPRs");

  const closedIssues = data.closedIssues ?? [];
  if (closedEl) {
    closedEl.innerHTML =
      closedIssues.slice(0, 25).map((i) => {
        const who = (i.assignees ?? []).join(", ") || "unassigned";
        const when = i.closedAt || i.updatedAt;
        return `
          <li>
            <a href="${i.url}" target="_blank" rel="noreferrer">#${i.number} ${esc(i.title)}</a>
            <div class="pm-meta">
              <span class="pm-muted">${fmtDate(when)}</span>
              <span class="pm-muted">•</span> ${esc(who)}
              ${i.labels?.length ? `<span class="pm-muted">•</span> ${esc(i.labels.slice(0, 3).join(", "))}` : ""}
            </div>
          </li>
        `;
      }).join("") || `<li>No closed issues found.</li>`;
  }

  const mergedPRs = data.mergedPRs ?? [];
  if (prsEl) {
    prsEl.innerHTML =
      mergedPRs.slice(0, 25).map((p) => {
        const who = (p.assignees ?? []).join(", ") || "unassigned";
        const when = p.mergedAt || p.updatedAt;
        return `
          <li>
            <a href="${p.url}" target="_blank" rel="noreferrer">PR #${p.number} ${esc(p.title)}</a>
            <div class="pm-meta">
              <span class="pm-muted">${fmtDate(when)}</span>
              <span class="pm-muted">•</span> ${esc(who)}
              ${p.labels?.length ? `<span class="pm-muted">•</span> ${esc(p.labels.slice(0, 3).join(", "))}` : ""}
            </div>
          </li>
        `;
      }).join("") || `<li>No merged PRs found.</li>`;
  }
})();
