import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GraphQLClient, gql } from "graphql-request";

const GH_TOKEN = process.env.GH_TOKEN;
if (!GH_TOKEN) throw new Error("Missing GH_TOKEN (set secrets.GH_PAT)");

const ORG = process.env.ORG;
const ROBOT_REPO = process.env.ROBOT_REPO;
const PROJECT_NUMBER = Number(process.env.PROJECT_NUMBER);

const STATUS_FIELD = process.env.STATUS_FIELD || "Status";
const DUE_FIELD = process.env.DUE_FIELD || "Due date";

// Status values considered “Now” (edit to match your project)
const NOW_STATUSES = new Set(["In Progress", "Doing", "Ready", "Blocked"]);

// Status values considered “Done”
const DONE_STATUSES = new Set(["Done", "Completed", "Complete"]);

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: { Authorization: `Bearer ${GH_TOKEN}` }
});

// Try a query that includes Project status updates; if your project doesn’t use them,
// we fall back gracefully to “latest updated issue” as the update signal.
const QUERY_WITH_UPDATES = gql`
query Dashboard($org: String!, $robotRepo: String!, $projectNumber: Int!) {
  organization(login: $org) {
    login
    projectV2(number: $projectNumber) {
      title
      url

      statusUpdates(last: 1) {
        nodes { body createdAt status targetDate }
      }

      items(first: 100) {
        nodes {
          id
          content {
            __typename
            ... on Issue {
              number title url state updatedAt closedAt
              assignees(first: 10) { nodes { login } }
              milestone { title dueOn url }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number title url state updatedAt mergedAt
              assignees(first: 10) { nodes { login } }
              labels(first: 20) { nodes { name } }
            }
            ... on DraftIssue {
              title body createdAt updatedAt
            }
          }
          fieldValues(first: 50) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldIterationValue {
                title startDate duration
                field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
        }
      }
    }
  }

  repository(owner: $org, name: $robotRepo) {
    url

    milestones(first: 50, states: [OPEN]) {
      nodes {
        title
        url
        dueOn
        openIssues: issues(states: [OPEN]) { totalCount }
        closedIssues: issues(states: [CLOSED]) { totalCount }
      }
    }

    issues(first: 50, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        number title url updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        milestone { title dueOn url }
      }
    }
  }
}
`;

const QUERY_NO_UPDATES = gql`
query DashboardNoUpdates($org: String!, $robotRepo: String!, $projectNumber: Int!) {
  organization(login: $org) {
    login
    projectV2(number: $projectNumber) {
      title
      url
      items(first: 100) {
        nodes {
          id
          content {
            __typename
            ... on Issue {
              number title url state updatedAt closedAt
              assignees(first: 10) { nodes { login } }
              milestone { title dueOn url }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number title url state updatedAt mergedAt
              assignees(first: 10) { nodes { login } }
              labels(first: 20) { nodes { name } }
            }
            ... on DraftIssue {
              title body createdAt updatedAt
            }
          }
          fieldValues(first: 50) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
              ... on ProjectV2ItemFieldTextValue {
                text
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldDateValue {
                date
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number
                field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldIterationValue {
                title startDate duration
                field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
        }
      }
    }
  }

  repository(owner: $org, name: $robotRepo) {
    url

    milestones(first: 50, states: [OPEN]) {
      nodes {
        title
        url
        dueOn
        openIssues: issues(states: [OPEN]) { totalCount }
        closedIssues: issues(states: [CLOSED]) { totalCount }
      }
    }

    issues(first: 50, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      totalCount
      nodes {
        number title url updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        milestone { title dueOn url }
      }
    }
  }
}
`;

function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeFieldValues(fieldValues) {
  const out = {};
  for (const v of (fieldValues?.nodes ?? [])) {
    const fieldName = v?.field?.name;
    if (!fieldName) continue;

    if (v.__typename === "ProjectV2ItemFieldSingleSelectValue") out[fieldName] = v.name;
    else if (v.__typename === "ProjectV2ItemFieldTextValue") out[fieldName] = v.text;
    else if (v.__typename === "ProjectV2ItemFieldDateValue") out[fieldName] = v.date;
    else if (v.__typename === "ProjectV2ItemFieldNumberValue") out[fieldName] = v.number;
    else if (v.__typename === "ProjectV2ItemFieldIterationValue") out[fieldName] = v.title;
  }
  return out;
}

function isDoneStatus(status) {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  for (const v of DONE_STATUSES) {
    if (s === String(v).trim().toLowerCase()) return true;
  }
  return false;
}

async function run() {
  let data;
  try {
    data = await client.request(QUERY_WITH_UPDATES, {
      org: ORG,
      robotRepo: ROBOT_REPO,
      projectNumber: PROJECT_NUMBER
    });
  } catch (e) {
    data = await client.request(QUERY_NO_UPDATES, {
      org: ORG,
      robotRepo: ROBOT_REPO,
      projectNumber: PROJECT_NUMBER
    });
  }

  const project = data.organization?.projectV2;
  const repo = data.repository;

  // Milestone schedule (repo milestones)
  const milestones = repo?.milestones?.nodes ?? [];
  const schedule = milestones
    .filter(m => m?.dueOn)
    .sort((a, b) => new Date(a.dueOn) - new Date(b.dueOn))
    .map(m => ({
      title: m.title,
      url: m.url,
      dueOn: m.dueOn,
      openIssues: m.openIssues?.totalCount ?? 0,
      closedIssues: m.closedIssues?.totalCount ?? 0
    }));

  const currentMilestone = schedule.length ? schedule[0] : null;

  // Recent open issues (repo issues)
  const issues = (repo?.issues?.nodes ?? []).map(i => ({
    number: i.number,
    title: i.title,
    url: i.url,
    updatedAt: i.updatedAt,
    labels: (i.labels?.nodes ?? []).map(l => l.name),
    assignees: (i.assignees?.nodes ?? []).map(a => a.login),
    milestone: i.milestone ? { title: i.milestone.title, dueOn: i.milestone.dueOn, url: i.milestone.url } : null
  }));

  // Project items (project board)
  const projectItems = (project?.items?.nodes ?? [])
    .map(n => {
      const c = n.content;
      const fields = normalizeFieldValues(n.fieldValues);
      if (!c) return null;

      if (c.__typename === "DraftIssue") {
        return {
          type: "DraftIssue",
          title: c.title,
          url: project?.url,
          updatedAt: c.updatedAt,
          fields,
          assignees: [],
          labels: [],
          milestone: null
        };
      }

      return {
        type: c.__typename,
        number: c.number,
        title: c.title,
        url: c.url,
        state: c.state,
        updatedAt: c.updatedAt,
        closedAt: c.closedAt ?? null,
        mergedAt: c.mergedAt ?? null,
        assignees: (c.assignees?.nodes ?? []).map(a => a.login),
        labels: (c.labels?.nodes ?? []).map(l => l.name),
        milestone: c.milestone ? { title: c.milestone.title, dueOn: c.milestone.dueOn, url: c.milestone.url } : null,
        fields
      };
    })
    .filter(Boolean);

  // “Now” view
  const now = projectItems
    .filter(it => {
      const status = it.fields?.[STATUS_FIELD];
      return status ? NOW_STATUSES.has(status) : false;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 15);

  // Upcoming project items: Issues/Drafts with Due date or Milestone
  // (Filters out items that are BOTH past-due AND marked Done at generation time; UI also filters again)
  const nowTs = Date.now();

  function effectiveDueISO(it) {
    return it.fields?.[DUE_FIELD] || it.milestone?.dueOn || null;
  }

  const scheduleItems = projectItems
    .filter(it => it.type === "Issue" || it.type === "DraftIssue")
    .map(it => ({
      type: it.type,
      number: it.number ?? null,
      title: it.title,
      url: it.url,
      updatedAt: it.updatedAt,
      status: it.fields?.[STATUS_FIELD] ?? null,
      due: effectiveDueISO(it),
      assignees: it.assignees ?? [],
      milestone: it.milestone ?? null
    }))
    .filter(it => it.due || it.milestone?.title) // “scheduled” = has due or milestone label
    .filter(it => {
      const due = parseDate(it.due);
      if (!due) return true;
      const pastDue = due.getTime() < nowTs;
      return !(pastDue && isDoneStatus(it.status));
    })
    .sort((a, b) => {
      const ad = parseDate(a.due)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bd = parseDate(b.due)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .slice(0, 20);

  // Recent items marked Done (from Project Status, not GitHub closed state)
  const doneItemsRecent = projectItems
    .filter(it => it.type === "Issue" && isDoneStatus(it.fields?.[STATUS_FIELD]))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 20)
    .map(it => ({
      number: it.number,
      title: it.title,
      url: it.url,
      updatedAt: it.updatedAt,
      assignees: it.assignees ?? [],
      milestone: it.milestone ?? null
    }));

  // Latest update: prefer Project status update, fallback to latest updated open issue
  const projectUpdateNode = data.organization?.projectV2?.statusUpdates?.nodes?.[0] ?? null;
  const latestIssue = issues[0] ?? null;

  const latestUpdate = projectUpdateNode
    ? {
        source: "project_status_update",
        body: projectUpdateNode.body,
        status: projectUpdateNode.status,
        targetDate: projectUpdateNode.targetDate,
        createdAt: projectUpdateNode.createdAt
      }
    : (latestIssue
        ? {
            source: "latest_issue",
            body: `Latest issue updated: #${latestIssue.number} ${latestIssue.title}`,
            createdAt: latestIssue.updatedAt
          }
        : null);

  const out = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    repos: { robot: ROBOT_REPO, website: "Website" },
    project: project ? { number: PROJECT_NUMBER, title: project.title, url: project.url } : null,

    currentMilestone,
    schedule,

    // For “Now” / dashboard
    now,

    // Schedule that includes issues (not just milestones)
    scheduleItems,

    // Recent “Done” items (from Project Status)
    doneItemsRecent,

    latestUpdate,

    // Recent open issues (repo)
    issues,
    openIssues: repo?.issues?.totalCount ?? issues.length,

    // Full project items (optional)
    projectItems,

    fieldNames: {
      status: STATUS_FIELD,
      due: DUE_FIELD
    }
  };

  const siteRoot = process.env.SITE_ROOT || "docs";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..", "..");

  const outDir = path.join(repoRoot, siteRoot, "assets", "data");
  const outPath = path.join(outDir, "status.json");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
