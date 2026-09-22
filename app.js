 const form = document.getElementById("support-form");

const issueBaseUrl =
  "https://github.com/suhaimi-masri-ent/support/issues/new";

function buildIssueUrl(formData) {
  const requester =
    formData.get("requester")?.trim() || "Unknown requester";
  const email =
    formData.get("email")?.trim() || "No email provided";
  const company =
    formData.get("company")?.trim() || "No company provided";
  const category =
    formData.get("category")?.trim() || "Uncategorized";
  const priority =
    formData.get("priority")?.trim() || "Medium";
  const summary =
    formData.get("summary")?.trim() || "Support request";
  const details =
    formData.get("details")?.trim() || "No details provided";

  const title = `[Support] ${summary}`;

  const body = [
    `**Requester name:** ${requester}`,
    `**Email:** ${email}`,
    `**Company:** ${company}`,
    `**Category:** ${category}`,
    `**Priority:** ${priority}`,
    "",
    "---",
    "",
    "**Problem details**",
    "",
    details
  ].join("\n");

  const params = new URLSearchParams({
    template: "support-request.yml",
    labels: "support",
    title,
    body
  });

  return `${issueBaseUrl}?${params.toString()}`;
}

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(form);
    const issueUrl = buildIssueUrl(formData);

    window.location.href = issueUrl;
  });
}
