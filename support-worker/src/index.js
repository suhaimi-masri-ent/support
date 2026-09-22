const OWNER = "suhaimi-masri-ent";
const REPO = "support";


function corsHeaders(origin) {

  const allowedOrigin =
    "https://suhaimi-masri-ent.github.io";

  return {
    "Access-Control-Allow-Origin":
      origin === allowedOrigin
        ? origin
        : allowedOrigin,

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Content-Type":
      "application/json"
  };
}


function json(data, status, origin) {

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: corsHeaders(origin)
    }
  );

}


function clean(value, maxLength) {

  return String(value || "")
    .trim()
    .slice(0, maxLength);

}


export default {

  async fetch(request, env) {

    const origin =
      request.headers.get("Origin") || "";


    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });

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


      const requester =
        clean(data.requester, 100);

      const email =
        clean(data.email, 160);

      const company =
        clean(data.company, 150);

      const category =
        clean(data.category, 50);

      const priority =
        clean(data.priority, 20);

      const summary =
        clean(data.summary, 180);

      const details =
        clean(data.details, 10000);


      if (
        !requester ||
        !email ||
        !category ||
        !priority ||
        !summary ||
        !details
      ) {

        return json(
          {
            message:
              "Please complete all required fields."
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


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (!emailPattern.test(email)) {

        return json(
          {
            message:
              "Please provide a valid email address."
          },
          400,
          origin
        );

      }


      const issueBody = `
## Requester

**Name:** ${requester}

**Email:** ${email}

**Company:** ${company || "Not provided"}


## Request

**Category:** ${category}

**Priority:** ${priority}

**Summary:** ${summary}


## Problem details

${details}


---

_Submitted through Support Desk._
`;


      const githubResponse =
        await fetch(
          `https://api.github.com/repos/${OWNER}/${REPO}/issues`,
          {
            method: "POST",

            headers: {

              "Accept":
                "application/vnd.github+json",

              "Authorization":
                `Bearer ${env.GITHUB_TOKEN}`,

              "X-GitHub-Api-Version":
                "2022-11-28",

              "User-Agent":
                "suhaimi-support-desk"

            },

            body: JSON.stringify({

              title:
                `[${priority}] ${summary}`,

              body:
                issueBody,

              labels: [
                "support",
                `priority:${priority.toLowerCase()}`
              ]

            })

          }
        );


      const githubData =
        await githubResponse.json();


      if (!githubResponse.ok) {

        console.error(
          "GitHub API error:",
          githubData
        );


        return json(
          {
            message:
              "GitHub could not create the ticket."
          },
          502,
          origin
        );

      }


      return json(
        {
          success: true,

          issueNumber:
            githubData.number,

          issueUrl:
            githubData.html_url
        },
        200,
        origin
      );


    } catch (error) {

      console.error(error);


      return json(
        {
          message:
            "Unable to process the support request."
        },
        500,
        origin
      );

    }

  }

};
