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

// Query that attempts to read Project status updates (may not exist/enabled in some projects)
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
              number
              title
              url
              state
              updatedAt
              assignees(first: 5) { nodes { login } }
              milestone { title dueOn }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number
              title
              url
              state
              updatedAt
              assignees(first: 5) { nodes { login } }
              labels(first: 20) { nodes { name } }
            }
            ... on DraftIssue {
              title
              body
              createdAt
              updatedAt
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
                title
                startDate
                duration
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

    issues(first: 30, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number
        title
        url
        updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 5) { nodes { login } }
        milestone { title dueOn }
      }
    }
  }
}
`;

// Fallback query that does NOT require project status updates
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
              number
              title
              url
              state
              updatedAt
              assignees(first: 5) { nodes { login } }
              milestone { title dueOn }
              labels(first: 20) { nodes { name } }
            }
            ... on PullRequest {
              number
              title
              url
              state
              updatedAt
              assignees(first: 5) { nodes { login } }
              labels(first: 20) { nodes { name } }
            }
            ... on DraftIssue {
              title
              body
              createdAt
              updatedAt
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
                title
                startDate
                duration
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

    issues(first: 30, states: [OPEN], orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number
        title
        url
        updatedAt
        labels(first: 20) { nodes { name } }
        assignees(first: 5) { nodes { login } }
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

function getRepoRootFallback() {
  // docs/scripts -> repo root is two levels up
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "..", "..");
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

  const issues = (repo?.issues?.nodes ?? []).map(i => ({
    number: i.number,
    title: i.title,
    url: i.url,
    updatedAt: i.updatedAt,
    labels: (i.labels?.nodes ?? []).map(l => l.name),
    assignees: (i.assignees?.nodes ?? []).map(a => a.login),
    milestone: i.milestone ? { title: i.milestone.title, dueOn: i.milestone.dueOn } : null
  }));

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
          fields
        };
      }

      return {
        type: c.__typename,
        number: c.number,
        title: c.title,
        url: c.url,
        state: c.state,
        updatedAt: c.updatedAt,
        assignees: (c.assignees?.nodes ?? []).map(a => a.login),
        labels: (c.labels?.nodes ?? []).map(l => l.name),
        milestone: c.milestone ? { title: c.milestone.title, dueOn: c.milestone.dueOn } : null,
        fields
      };
    })
    .filter(Boolean);

  const now = projectItems
    .filter(it => {
      const status = it.fields?.[STATUS_FIELD];
      return status ? NOW_STATUSES.has(status) : false;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 15);

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

  const out = {
    generatedAt: new Date().toISOString(),
    org: ORG,
    repos: { robot: ROBOT_REPO, website: "Website" },
    project: project ? { number: PROJECT_NUMBER, title: project.title, url: project.url } : null,

    currentMilestone,
    schedule,

    latestUpdate,
    issues,

    now,
    projectItems,

    fieldNames: {
      status: STATUS_FIELD,
      due: DUE_FIELD,
      targetDemo: TARGET_DEMO_FIELD
    }
  };

  const siteRoot = process.env.SITE_ROOT || "docs";

  // In Actions, this is the repo root. Locally, fall back to resolving from this script.
  const workspace = process.env.GITHUB_WORKSPACE
    ? path.resolve(process.env.GITHUB_WORKSPACE)
    : getRepoRootFallback();

  const outDir = path.join(workspace, siteRoot, "assets", "data");
  const outPath = path.join(outDir, "status.json");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  if (!fs.existsSync(outPath)) {
    throw new Error(`status.json not written: ${outPath}`);
  }

  console.log(`Wrote ${outPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
