const API_URL =
  "https://suhaimi-support-api.bitsuhami.workers.dev/";

const lookupForm = document.getElementById("lookup-form");
const engineerForm = document.getElementById("engineer-form");
const results = document.getElementById("results");
const message = document.getElementById("lookup-message");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}`;
  message.hidden = false;
}

function clearMessage() {
  message.hidden = true;
  message.textContent = "";
  message.className = "form-message";
}

function renderTickets(tickets, engineer = false) {
  if (!tickets.length) {
    results.innerHTML = `
      <div class="card empty-state">
        <div class="empty-icon">⌕</div>
        <h2>Tiada tiket dijumpai</h2>
        <p>
          Pastikan maklumat yang dimasukkan adalah sama seperti
          ketika tiket dihantar.
        </p>
      </div>
    `;
    return;
  }

  results.innerHTML = `
    <div class="results-heading">
      <div>
        <span class="eyebrow">Ticket results</span>
        <h2>${engineer ? "Semua tiket sokongan" : "Tiket anda"}</h2>
      </div>

      <span class="result-count">
        ${tickets.length} tiket
      </span>
    </div>

    ${tickets.map((ticket) => {

      const supportId =
        ticket.support_id ||
        ticket.supportId ||
        "—";

      const issueNumber =
        ticket.issue_number ??
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
        "—";

      const priority =
        ticket.priority ||
        "—";

      const solution =
        ticket.solution ||
        ticket.details ||
        "Pasukan sokongan sedang menyemak tiket ini.";

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
                    ? `<span class="github-number">
                         GitHub #${escapeHtml(issueNumber)}
                       </span>`
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
              <b>Dicipta</b>
              ${formatDate(ticket.created_at)}
            </span>

            ${
              ticket.updated_at
                ? `
                  <span>
                    <b>Kemaskini</b>
                    ${formatDate(ticket.updated_at)}
                  </span>
                `
                : ""
            }

            ${
              engineer
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
                : ""
            }

          </div>

          <div class="solution-box">

            <span class="solution-label">
              ${engineer ? "Ticket details" : "Support information"}
            </span>

            <p>
              ${escapeHtml(solution)}
            </p>

          </div>

          ${
            issueUrl
              ? `
                <div class="ticket-actions">
                  <a
                    href="${escapeHtml(issueUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="button button-secondary"
                  >
                    View GitHub Ticket
                    →
                  </a>
                </div>
              `
              : ""
          }

        </article>
      `;
    }).join("")}
  `;
}


/* =========================================================
   CUSTOMER LOOKUP
   GET /ticket/lookup?email=...&phone=...
   ========================================================= */

async function lookupCustomer(email, phone) {

  const url =
    `${API_URL}ticket/lookup?` +
    new URLSearchParams({
      email: email,
      phone: phone
    });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Tiket tidak dapat dimuatkan."
    );
  }

  return data;
}


/* =========================================================
   ENGINEER LOOKUP
   GET /engineer/tickets
   X-Engineer-Key header
   ========================================================= */

async function lookupEngineer(engineerKey) {

  const url =
    `${API_URL}engineer/tickets`;

  const response = await fetch(url, {
    method: "GET",

    headers: {
      "Accept": "application/json",
      "X-Engineer-Key": engineerKey
    }
  });

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Engineer access gagal."
    );
  }

  return data;
}


/* =========================================================
   CUSTOMER FORM
   ========================================================= */

if (lookupForm) {

  lookupForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      clearMessage();

      results.innerHTML = `
        <div class="card loading-state">
          Sedang mencari tiket…
        </div>
      `;

      if (!lookupForm.checkValidity()) {
        lookupForm.reportValidity();
        results.innerHTML = "";
        return;
      }

      const formData =
        new FormData(lookupForm);

      const email =
        String(
          formData.get("email") || ""
        ).trim();

      const phone =
        String(
          formData.get("phone") || ""
        ).trim();

      try {

        const data =
          await lookupCustomer(
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

        results.innerHTML = "";

        showMessage(
          error.message ||
          "Tiket tidak dapat dimuatkan.",
          "error"
        );
      }
    }
  );
}


/* =========================================================
   ENGINEER FORM
   ========================================================= */

if (engineerForm) {

  engineerForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      clearMessage();

      results.innerHTML = `
        <div class="card loading-state">
          Memuatkan semua tiket…
        </div>
      `;

      if (!engineerForm.checkValidity()) {
        engineerForm.reportValidity();
        results.innerHTML = "";
        return;
      }

      const formData =
        new FormData(engineerForm);

      const engineerKey =
        String(
          formData.get("engineerKey") || ""
        );

      try {

        const data =
          await lookupEngineer(
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

        results.innerHTML = "";

        showMessage(
          error.message ||
          "Engineer access gagal.",
          "error"
        );
      }
    }
  );
}
