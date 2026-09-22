const OWNER = "suhaimi-masri-ent";
const REPO = "support";

function corsHeaders(origin) {
  const allowedOrigin = "https://suhaimi-masri-ent.github.io";

  return {
    "Access-Control-Allow-Origin":
      origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin)
  });
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("60")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+60${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function issueField(body, label) {
  const match = String(body || "").match(
    new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i")
  );

  return match ? match[1].trim() : "";
}

function parseSolution(body) {
  const match = String(body || "").match(
    /## Customer solution\s*([\s\S]*?)(?=\n## |\n---|$)/i
  );

  return match ? match[1].trim() : "Pending support team update.";
}

async function githubRequest(path, env, method = "GET", requestBody) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "suhaimi-support-desk"
  };

  const init = {
    method,
    headers
  };

  if (requestBody !== undefined) {
    init.body = JSON.stringify(requestBody);
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`https://api.github.com${path}`, init);
  const data = await response.json().catch(() => ({}));

  return { response, data };
}

async function listTickets(request, env, origin) {
  const url = new URL(request.url);
  const email = clean(url.searchParams.get("email"), 160).toLowerCase();
  const phone = normalizePhone(url.searchParams.get("phone"));
  const engineerKey = clean(url.searchParams.get("engineerKey"), 200);

  const engineer =
    Boolean(engineerKey) &&
    Boolean(env.ENGINEER_ACCESS_KEY) &&
    engineerKey === env.ENGINEER_ACCESS_KEY;

  if (!engineer && (!email || !phone)) {
    return json(
      {
        message: "Email and phone number are required."
      },
      400,
      origin
    );
  }

  const { response, data } = await githubRequest(
    `/repos/${OWNER}/${REPO}/issues?state=all&per_page=100`,
    env,
    "GET"
  );

  if (!response.ok) {
    console.error("GitHub issue listing error:", data);
    return json(
      {
        message: "Unable to load tickets."
      },
      502,
      origin
    );
  }

  const tickets = data
    .filter((issue) => !issue.pull_request)
    .filter((issue) => {
      if (engineer) return true;

      const issueEmail = issueField(issue.body, "Email").toLowerCase();
      const issuePhone = normalizePhone(issueField(issue.body, "Phone"));

      return issueEmail === email && issuePhone === phone;
    })
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      email: issueField(issue.body, "Email"),
      phone: issueField(issue.body, "Phone"),
      solution: parseSolution(issue.body)
    }));

  return json({ tickets }, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    if (request.method === "GET") {
      return listTickets(request, env, origin);
    }

    if (request.method !== "POST") {
      return json(
        {
          message: "Method not allowed."
        },
        405,
        origin
      );
    }

    try {
      const data = await request.json();

      const requester = clean(data.requester, 100);
      const email = clean(data.email, 160);
      const phone = normalizePhone(data.phone);
      const company = clean(data.company, 150);
      const category = clean(data.category, 50);
      const priority = clean(data.priority, 20);
      const summary = clean(data.summary, 180);
      const details = clean(data.details, 10000);

      if (
        !requester ||
        !email ||
        !phone ||
        !category ||
        !priority ||
        !summary ||
        !details
      ) {
        return json(
          {
            message: "Please complete all required fields, including phone number."
          },
          400,
          origin
        );
      }

      const validCategories = [
        "Account access",
        "Billing",
        "Technical issue",
        "Feature request",
        "Other"
      ];

      const validPriorities = [
        "Low",
        "Medium",
        "High",
        "Urgent"
      ];

      if (!validCategories.includes(category)) {
        return json(
          {
            message: "Invalid category."
          },
          400,
          origin
        );
      }

      if (!validPriorities.includes(priority)) {
        return json(
          {
            message: "Invalid priority."
          },
          400,
          origin
        );
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        return json(
          {
            message: "Please provide a valid email address."
          },
          400,
          origin
        );
      }

      const issueBody = `
## Requester

**Name:** ${requester}

**Email:** ${email}

**Phone:** ${phone}

**Company:** ${company || "Not provided"}

## Request

**Category:** ${category}

**Priority:** ${priority}

**Summary:** ${summary}

## Problem details

${details}

## Customer solution

_Pending support team update._

---

_This section is customer-visible. Keep internal discussion in GitHub comments or engineering notes._
`;

      const issuePayload = {
        title: `[${priority}] ${summary}`,
        body: issueBody,
        labels: [
          "support",
          `priority:${priority.toLowerCase()}`
        ]
      };

      const { response, data: githubData } = await githubRequest(
        `/repos/${OWNER}/${REPO}/issues`,
        env,
        "POST",
        issuePayload
      );

      if (!response.ok) {
        console.error("GitHub API error:", githubData);
        return json(
          {
            message: "GitHub could not create the ticket."
          },
          502,
          origin
        );
      }

      return json(
        {
          success: true,
          issueNumber: githubData.number,
          issueUrl: "https://suhaimi-masri-ent.github.io/support/tickets.html"
        },
        200,
        origin
      );
    } catch (error) {
      console.error(error);

      return json(
        {
          message: "Unable to process the support request."
        },
        500,
        origin
      );
    }
  }
};
