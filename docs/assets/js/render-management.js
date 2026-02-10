(async function () {
  const root = document.getElementById("pmWidget");

  // Resolve URL robustly (works on GitHub Pages repo sites and user/org sites)
  const url =
    (root && root.dataset && root.dataset.statusJson) ||
    window.STATUS_JSON_URL ||
    (window.STATUS_JSON_RELATIVE_URL ? window.STATUS_JSON_RELATIVE_URL : null) ||
    "assets/data/status.json"; // relative fallback (NO leading slash)

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  // Prefer querying inside the widget, but fall back to document for safety
  const byId = (id) =>
    (root ? root.querySelector("#" + id) : null) || document.getElementById(id);

  const els = {
    upcoming: byId("pmUpcoming"),
    milestones: byId("pmMilestones"),
    done: byId("pmDoneItems") || byId("pmDoneIssues"),
    summary: byId("pmSummaryCounts"),

    // If you also render these elsewhere in PM:
    issuesLogDone: byId("pmClosedIssues"),
    issuesLogUpdated: byId("pmMergedPRs"),
  };

  function setLoadingFail(message) {
    const targets = [
      els.upcoming,
      els.milestones,
      els.done,
      els.summary,
      els.issuesLogDone,
      els.issuesLogUpdated,
    ].filter(Boolean);

    for (const el of targets) {
      // Lists should still show something reasonable
      el.innerHTML = `<div class="pm-loading">${esc(message)}</div>`;
    }
  }

  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Fetch failed (${res.status}) ${res.statusText} @ ${url}`);
    }
    data = await res.json();
  } catch (e) {
    console.error("PM widget fetch error:", e);
    setLoadingFail("Failed to load status.json.");
    return;
  }

  // ---- Upcoming (issue-based) ----
  // Uses data.scheduleItems (generated in generate-status.mjs)
  const upcoming = Array.isArray(data.scheduleItems) ? data.scheduleItems : [];
  if (els.upcoming) {
    if (!upcoming.length) {
      els.upcoming.innerHTML = "<p><em>No upcoming project items found.</em></p>";
    } else {
      // group by milestone title (or "No milestone")
      const groups = new Map();
      for (const it of upcoming.slice(0, 20)) { // CAP TO 20
        const key = it.milestone?.title || "No milestone";
        if (!groups.has(key)) {
          groups.set(key, {
            title: key,
            dueOn: it.milestone?.dueOn || null,
            url: it.milestone?.url || null,
            items: []
          });
        }
        groups.get(key).items.push(it);
      }

      els.upcoming.innerHTML = Array.from(groups.values())
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
  if (els.milestones) {
    els.milestones.innerHTML =
      milestones
        .slice(0, 20)
        .map((m) => `
          <li>
            <a href="${m.url}" target="_blank" rel="noreferrer">${esc(m.title)}</a>
            <small> — due ${fmtDate(m.dueOn)} • ${m.openIssues ?? 0} open</small>
          </li>
        `)
        .join("") || "<li>No upcoming milestones with due dates.</li>";
  }

  // ---- Done items (from project status) ----
  const done = Array.isArray(data.doneItemsRecent) ? data.doneItemsRecent : [];
  if (els.done) {
    els.done.innerHTML =
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

  // ---- Optional: Summary ----
  if (els.summary) {
    const openCount = typeof data.openIssues === "number"
      ? data.openIssues
      : (Array.isArray(data.issues) ? data.issues.length : 0);

    els.summary.innerHTML = `
      <div><strong>${upcoming.length}</strong> upcoming items</div>
      <div><strong>${milestones.length}</strong> milestones</div>
      <div><strong>${openCount}</strong> open issues</div>
      <div><strong>${done.length}</strong> done items</div>
    `;
  }
})();
