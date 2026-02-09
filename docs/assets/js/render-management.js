(async function () {
  const url = window.STATUS_JSON_URL || "/assets/data/status.json";
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

  const statusField = data.fieldNames?.status ?? "Status";
  const dueField = data.fieldNames?.due ?? "Due date";

  const DONE_STATUSES = new Set(["done", "completed", "complete"]);

  function isDoneStatus(status) {
    if (!status) return false;
    return DONE_STATUSES.has(String(status).trim().toLowerCase());
  }

  function parseDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function effectiveDue(it) {
    return it?.due || it?.fields?.[dueField] || it?.milestone?.dueOn || null;
  }

  // ---- Schedule items (issues + drafts) ----
  let items = Array.isArray(data.scheduleItems) ? data.scheduleItems : null;

  // Back-compat: derive from projectItems if scheduleItems isn’t present
  if (!items || items.length === 0) {
    const projectItems = data.projectItems ?? [];
    items = projectItems
      .filter((it) => it.type === "Issue" || it.type === "DraftIssue")
      .map((it) => ({
        type: it.type,
        number: it.number ?? null,
        title: it.title,
        url: it.url,
        updatedAt: it.updatedAt,
        status: it.fields?.[statusField] ?? null,
        due: it.fields?.[dueField] ?? it.milestone?.dueOn ?? null,
        assignees: it.assignees ?? [],
        milestone: it.milestone ?? null
      }))
      .filter((it) => it.due || it.milestone?.title);
  }

  // Filter rule: hide items that are BOTH past-due AND marked Done
  const nowTs = Date.now();
  const upcoming = (items ?? [])
    .filter((it) => {
      const d = parseDate(effectiveDue(it));
      if (!d) return true;
      const pastDue = d.getTime() < nowTs;
      return !(pastDue && isDoneStatus(it.status));
    })
    .sort((a, b) => {
      const ad = parseDate(effectiveDue(a))?.getTime() ?? Number.POSITIVE_INFINITY;
      const bd = parseDate(effectiveDue(b))?.getTime() ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .slice(0, 20);

  // Group by milestone (replaces “Target Demo”)
  const groups = new Map(); // key -> {title, dueOn, url, items[]}
  for (const it of upcoming) {
    const msTitle = it.milestone?.title || "No milestone";
    const msDue = it.milestone?.dueOn || null;
    const msUrl = it.milestone?.url || null;

    if (!groups.has(msTitle)) groups.set(msTitle, { title: msTitle, dueOn: msDue, url: msUrl, items: [] });
    groups.get(msTitle).items.push(it);
  }

  // ---- Render schedule (upcoming items) ----
  const upcomingEl = document.getElementById("pmUpcoming");
  if (upcomingEl) {
    if (!upcoming.length) {
      upcomingEl.innerHTML = "<p><em>No upcoming items found.</em></p>";
    } else {
      upcomingEl.innerHTML = Array.from(groups.values())
        .sort((a, b) => {
          const ad = parseDate(a.dueOn)?.getTime() ?? Number.POSITIVE_INFINITY;
          const bd = parseDate(b.dueOn)?.getTime() ?? Number.POSITIVE_INFINITY;
          if (ad !== bd) return ad - bd;
          return a.title.localeCompare(b.title);
        })
        .map((g) => {
          const header = g.url
            ? `<a href="${g.url}" target="_blank" rel="noreferrer">${esc(g.title)}</a>`
            : esc(g.title);

          const rows = g.items
            .map((it) => {
              const who = (it.assignees ?? []).length ? (it.assignees ?? []).join(", ") : "unassigned";
              const status = it.status ?? "—";
              const due = effectiveDue(it);
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
            })
            .join("");

          return `
            <section class="pm-group">
              <div class="pm-group-head">
                <strong>${header}</strong>
                <span class="pm-group-sub">${g.dueOn ? "Due " + fmtDate(g.dueOn) : ""}</span>
              </div>
              <div class="pm-table-wrap">
                <table class="pm-table">
                  <thead>
                    <tr><th>Item</th><th>Due</th></tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </section>
          `;
        })
        .join("");
    }
  }

  // ---- Render milestone schedule (repo milestones) ----
  const msEl = document.getElementById("pmMilestones");
  const schedule = data.schedule ?? [];
  if (msEl) {
    msEl.innerHTML =
      schedule
        .slice(0, 20)
        .map(
          (m) => `
          <li>
            <a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a>
            <small> — due ${fmtDate(m.dueOn)} • ${m.openIssues} open</small>
          </li>
        `
        )
        .join("") || "<li>No upcoming milestones with due dates.</li>";
  }

  // ---- Render recent Done items (from Project Status) ----
  const doneEl = document.getElementById("pmDoneItems");
  const done = data.doneItemsRecent ?? [];
  if (doneEl) {
    doneEl.innerHTML =
      done
        .slice(0, 25)
        .map((i) => {
          const who = (i.assignees ?? []).length ? (i.assignees ?? []).join(", ") : "unassigned";
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
    const doneCount = done.length;
    countEl.innerHTML = `
      <div><strong>${upcoming.length}</strong> upcoming items</div>
      <div><strong>${schedule.length}</strong> milestones</div>
      <div><strong>${openCount}</strong> open issues</div>
      <div><strong>${doneCount}</strong> done items</div>
    `;
  }
})();
