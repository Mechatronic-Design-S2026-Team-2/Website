import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GraphQLClient, gql } from "graphql-request";

const GH_TOKEN = process.env.GH_TOKEN;
if (!GH_TOKEN) throw new Error("Missing GH_TOKEN (set secrets.GH_PAT)");

const ORG = process.env.ORG;
const ROBOT_REPO = process.env.ROBOT_REPO;
const PROJECT_NUMBER = Number(process.env.PROJECT_NUMBER);

if (!ORG) throw new Error("Missing ORG env var");
if (!ROBOT_REPO) throw new Error("Missing ROBOT_REPO env var");
if (!PROJECT_NUMBER) throw new Error("Missing PROJECT_NUMBER env var");

const STATUS_FIELD = process.env.STATUS_FIELD || "Status";
const DUE_FIELD = process.env.DUE_FIELD || "Due date";
const TARGET_DEMO_FIELD = process.env.TARGET_DEMO_FIELD || "Target Demo";

// Consider “Now” as any of these Status values (edit to match your project)
const NOW_STATUSES = new Set(["In Progress", "Doing", "Ready", "Blocked"]);

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: { Authorization: `Bearer ${GH_TOKEN}` }
});

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
              number title url state updatedAt
              assignees(first: 10) { nodes { login } }
              milestone { title dueOn }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number title url state updatedAt
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
        openIssues: issues(first: 1, states: [OPEN]) { totalCount }
        closedIssues: issues(first: 1, states: [CLOSED]) { totalCount }
      }
    }

    issues(first: 60, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number title url updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        milestone { title dueOn }
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
              number title url state updatedAt
              assignees(first: 10) { nodes { login } }
              milestone { title dueOn }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number title url state updatedAt
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
        openIssues: issues(first: 1, states: [OPEN]) { totalCount }
        closedIssues: issues(first: 1, states: [CLOSED]) { totalCount }
      }
    }

    issues(first: 60, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number title url updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        milestone { title dueOn }
      }
    }
  }
}
`;

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

function repoRootFallback() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..", ".."); // docs/scripts -> repo root
}

function asLogins(nodes) {
  return (nodes ?? []).map(n => n.login).filter(Boolean);
}

function safeDate(d) {
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : NaN;
}

async function run() {
  let data;
  try {
    data = await client.request(QUERY_WITH_UPDATES, {
      org: ORG,
      robotRepo: ROBOT_REPO,
      projectNumber: PROJECT_NUMBER
    });
  } catch {
    data = await client.request(QUERY_NO_UPDATES, {
      org: ORG,
      robotRepo: ROBOT_REPO,
      projectNumber: PROJECT_NUMBER
    });
  }

  const project = data.organization?.projectV2;
  const repo = data.repository;

  // ---- Milestone schedule (existing)
  const milestones = repo?.milestones?.nodes ?? [];
  const schedule = milestones
    .filter(m => m?.dueOn)
    .sort((a, b) => safeDate(a.dueOn) - safeDate(b.dueOn))
    .map(m => ({
      title: m.title,
      url: m.url,
      dueOn: m.dueOn,
      openIssues: m.openIssues?.totalCount ?? 0,
      closedIssues: m.closedIssues?.totalCount ?? 0
    }));

  const currentMilestone = schedule.length ? schedule[0] : null;

  // ---- Repo issues (existing, but include assignees array)
  const issues = (repo?.issues?.nodes ?? []).map(i => ({
    number: i.number,
    title: i.title,
    url: i.url,
    updatedAt: i.updatedAt,
    labels: (i.labels?.nodes ?? []).map(l => l.name),
    assignees: asLogins(i.assignees?.nodes),
    milestone: i.milestone ? { title: i.milestone.title, dueOn: i.milestone.dueOn } : null
  }));

  // ---- Project items (existing)
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
          assignees: [],
          labels: [],
          milestone: null,
          fields
        };
      }

      return {
        type: c.__typename, // Issue or PullRequest
        number: c.number,
        title: c.title,
        url: c.url,
        state: c.state,
        updatedAt: c.updatedAt,
        assignees: asLogins(c.assignees?.nodes),
        labels: (c.labels?.nodes ?? []).map(l => l.name),
        milestone: c.milestone ? { title: c.milestone.title, dueOn: c.milestone.dueOn } : null,
        fields
      };
    })
    .filter(Boolean);

  // ---- NOW (existing)
  const now = projectItems
    .filter(it => {
      const status = it.fields?.[STATUS_FIELD];
      return status ? NOW_STATUSES.has(status) : false;
    })
    .sort((a, b) => safeDate(b.updatedAt) - safeDate(a.updatedAt))
    .slice(0, 15);

  // ---- Latest update (existing)
  const projectUpdateNode = project?.statusUpdates?.nodes?.[0] ?? null;
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

  // ---- NEW: Combined schedule items (milestones + due-dated issues/items)
  // Rule: include anything with a due date we can discover:
  // 1) Milestones dueOn (repo)
  // 2) Project items with Due date field (project)
  // 3) Repo issues that have a milestone with dueOn (fallback)
  const scheduleItems = [];

  // 1) milestones
  for (const m of schedule) {
    scheduleItems.push({
      type: "milestone",
      title: m.title,
      url: m.url,
      dueOn: m.dueOn,
      assignees: [],
      meta: { openIssues: m.openIssues, closedIssues: m.closedIssues }
    });
  }

  // 2) project items with Due date field
  for (const it of projectItems) {
    const due = it.fields?.[DUE_FIELD] ?? null;
    if (!due) continue;

    scheduleItems.push({
      type:
        it.type === "Issue" ? "issue" :
        it.type === "PullRequest" ? "pull_request" :
        "draft",
      title: it.title,
      url: it.url,
      dueOn: due,
      assignees: it.assignees ?? [],
      meta: {
        number: it.number ?? null,
        status: it.fields?.[STATUS_FIELD] ?? null,
        targetDemo: it.fields?.[TARGET_DEMO_FIELD] ?? null
      }
    });
  }

  // 3) repo issues whose milestone has dueOn (only if not already included as a due-dated project item)
  // Deduplicate by URL
  const scheduledUrls = new Set(scheduleItems.map(s => s.url).filter(Boolean));
  for (const i of issues) {
    const due = i.milestone?.dueOn ?? null;
    if (!due) continue;
    if (scheduledUrls.has(i.url)) continue;

    scheduleItems.push({
      type: "issue",
      title: i.title,
      url: i.url,
      dueOn: due,
      assignees: i.assignees ?? [],
      meta: {
        number: i.number ?? null,
        milestone: i.milestone?.title ?? null
      }
    });
  }

  scheduleItems.sort((a, b) => safeDate(a.dueOn) - safeDate(b.dueOn));

  const out = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    repos: { robot: ROBOT_REPO, website: "Website" },
    project: project ? { number: PROJECT_NUMBER, title: project.title, url: project.url } : null,

    // existing
    currentMilestone,
    schedule,
    latestUpdate,
    issues,
    now,
    projectItems,

    // new
    scheduleItems,

    fieldNames: {
      status: STATUS_FIELD,
      due: DUE_FIELD,
      targetDemo: TARGET_DEMO_FIELD
    }
  };

  const siteRoot = process.env.SITE_ROOT || "docs";
  const workspace = process.env.GITHUB_WORKSPACE
    ? path.resolve(process.env.GITHUB_WORKSPACE)
    : repoRootFallback();

  const outDir = path.join(workspace, siteRoot, "assets", "data");
  const outPath = path.join(outDir, "status.json");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  if (!fs.existsSync(outPath)) throw new Error(`status.json not written: ${outPath}`);
  console.log(`Wrote ${outPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
