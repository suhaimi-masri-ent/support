const API_URL =
  "https://suhaimi-support-api.bitsuhami.workers.dev/";

const lookupForm = document.getElementById("lookup-form");
const engineerForm = document.getElementById("engineer-form");
const results = document.getElementById("results");
const message = document.getElementById("lookup-message");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"'`]/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "`": "&#96;"
    };

    return characters[character];
  });
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function showMessage(text, type = "error") {
  if (!message) {
    return;
  }

  message.textContent = text;
  message.className = `form-message ${type}`;
  message.hidden = false;
}

function clearMessage() {
  if (!message) {
    return;
  }

  message.textContent = "";
  message.className = "form-message";
  message.hidden = true;
}

function renderTickets(tickets, engineer = false) {
  if (!results) {
    return;
  }

  if (!Array.isArray(tickets) || tickets.length === 0) {
    results.innerHTML = `
      <div class="card empty-state">
        <div class="empty-icon">⌕</div>

        <h2>No tickets found</h2>

        <p>
          Make sure the details match the information used
          when the ticket was submitted.
        </p>
      </div>
    `;

    return;
  }

  const ticketCards = tickets.map((ticket) => {
    const supportId =
      ticket.support_id ||
      ticket.supportId ||
      "—";

    const issueNumber =
      ticket.issue_number ??
      ticket.issueNumber ??
      ticket.number ??
      "";

    const issueUrl =
      ticket.issue_url ||
      ticket.issueUrl ||
      "";

    const title =
      ticket.title ||
      ticket.summary ||
      "Support request";

    const status =
      ticket.status ||
      ticket.state ||
      "Open";

    const category =
      ticket.category ||
      ticket.category_name ||
      ticket.categoryName ||
      ticket.issue_category ||
      ticket.issueCategory ||
      "—";
    
    const priority =
      ticket.priority ||
      ticket.priority_name ||
      ticket.priorityName ||
      ticket.issue_priority ||
      ticket.issuePriority ||
      "—";
    
    const solution =
      ticket.solution ||
      ticket.details ||
      "Our support team is reviewing this ticket.";

    const engineerDetails = engineer
      ? `
        <span>
          <b>Customer</b>
          ${escapeHtml(ticket.requester || "—")}
        </span>

        <span>
          <b>Email</b>
          ${escapeHtml(ticket.email || "—")}
        </span>

        <span>
          <b>Phone</b>
          ${escapeHtml(ticket.phone || "—")}
        </span>

        <span>
          <b>Company</b>
          ${escapeHtml(ticket.company || "—")}
        </span>
      `
      : "";

    const githubTicketButton = issueUrl
      ? `
        <div class="ticket-actions">
          <a
            href="${escapeHtml(issueUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="button button-secondary"
          >
            View GitHub ticket →
          </a>
        </div>
      `
      : "";

    return `
      <article class="card ticket-card">
        <div class="ticket-top">
          <div>
            <div class="ticket-reference">
              <span class="ticket-number">
                ${escapeHtml(supportId)}
              </span>

              ${
                issueNumber
                  ? `
                    <span class="github-number">
                      GitHub #${escapeHtml(issueNumber)}
                    </span>
                  `
                  : ""
              }
            </div>

            <h3>
              ${escapeHtml(title)}
            </h3>
          </div>

          <span class="status ${escapeHtml(
            String(status).toLowerCase()
          )}">
            ${escapeHtml(status)}
          </span>
        </div>

        <div class="ticket-meta">
          <span>
            <b>Category</b>
            ${escapeHtml(category)}
          </span>

          <span>
            <b>Priority</b>
            ${escapeHtml(priority)}
          </span>

          <span>
            <b>Created</b>
            ${formatDate(ticket.created_at || ticket.createdAt)}
          </span>

          ${
            ticket.updated_at || ticket.updatedAt
              ? `
                <span>
                  <b>Updated</b>
                  ${formatDate(
                    ticket.updated_at || ticket.updatedAt
                  )}
                </span>
              `
              : ""
          }

          ${engineerDetails}
        </div>

        <div class="solution-box">
          <span class="solution-label">
            ${engineer ? "Ticket details" : "Support information"}
          </span>

          <p>
            ${escapeHtml(solution)}
          </p>
        </div>

        ${githubTicketButton}
      </article>
    `;
  }).join("");

  results.innerHTML = `
    <div class="results-heading">
      <div>
        <span class="eyebrow">Ticket results</span>

        <h2>
          ${engineer ? "All support tickets" : "Your tickets"}
        </h2>
      </div>

      <span class="result-count">
        ${tickets.length}
        ticket${tickets.length === 1 ? "" : "s"}
      </span>
    </div>

    ${ticketCards}
  `;
}

async function lookupCustomer(email, phone) {
  const query = new URLSearchParams({
    email,
    phone
  });

  const response = await fetch(
    `${API_URL}ticket/lookup?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Unable to load tickets."
    );
  }

  return data;
}

async function lookupEngineer(engineerKey) {
  const response = await fetch(
    `${API_URL}engineer/tickets`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Engineer-Key": engineerKey
      }
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Engineer access failed."
    );
  }

  return data;
}

if (lookupForm) {
  lookupForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      clearMessage();

      if (results) {
        results.innerHTML = `
          <div class="card loading-state">
            Searching for tickets…
          </div>
        `;
      }

      if (!lookupForm.checkValidity()) {
        lookupForm.reportValidity();

        if (results) {
          results.innerHTML = "";
        }

        return;
      }

      const formData = new FormData(lookupForm);

      const email = String(
        formData.get("email") || ""
      ).trim();

      const phone = String(
        formData.get("phone") || ""
      ).trim();

      try {
        const data = await lookupCustomer(
          email,
          phone
        );

        renderTickets(
          data.tickets || [],
          false
        );
      } catch (error) {
        console.error(
          "Customer lookup error:",
          error
        );

        if (results) {
          results.innerHTML = "";
        }

        showMessage(
          error.message ||
          "Unable to load tickets.",
          "error"
        );
      }
    }
  );
}

if (engineerForm) {
  engineerForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      clearMessage();

      if (results) {
        results.innerHTML = `
          <div class="card loading-state">
            Loading all tickets…
          </div>
        `;
      }

      if (!engineerForm.checkValidity()) {
        engineerForm.reportValidity();

        if (results) {
          results.innerHTML = "";
        }

        return;
      }

      const formData = new FormData(engineerForm);

      const engineerKey = String(
        formData.get("engineerKey") || ""
      ).trim();

      try {
        const data = await lookupEngineer(
          engineerKey
        );

        renderTickets(
          data.tickets || [],
          true
        );
      } catch (error) {
        console.error(
          "Engineer lookup error:",
          error
        );

        if (results) {
          results.innerHTML = "";
        }

        showMessage(
          error.message ||
          "Engineer access failed.",
          "error"
        );
      }
    }
  );
}
