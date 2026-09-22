const API_URL = "https://suhaimi-support-api.bitsuhami.workers.dev/";
const lookupForm = document.getElementById("lookup-form");
const engineerForm = document.getElementById("engineer-form");
const results = document.getElementById("results");
const message = document.getElementById("lookup-message");

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = `form-message ${type}`;
  message.hidden = false;
}
function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
function renderTickets(tickets, engineer = false) {
  if (!tickets.length) { results.innerHTML = '<div class="card empty-state">Tiada tiket dijumpai untuk maklumat yang diberikan.</div>'; return; }
  results.innerHTML = `<div class="section-header"><p class="eyebrow">${tickets.length} ticket(s)</p><h3>${engineer ? "All support tickets" : "Your support tickets"}</h3></div>` + tickets.map(ticket => `<article class="card ticket-card"><div class="ticket-heading"><div><span class="ticket-number">#${escapeHtml(ticket.number)}</span><h3>${escapeHtml(ticket.title)}</h3></div><span class="status-pill">${escapeHtml(ticket.state)}</span></div><dl><div><dt>Created</dt><dd>${new Date(ticket.created_at).toLocaleString()}</dd></div><div><dt>Updated</dt><dd>${new Date(ticket.updated_at).toLocaleString()}</dd></div>${engineer ? `<div><dt>Customer</dt><dd>${escapeHtml(ticket.email || "—")} · ${escapeHtml(ticket.phone || "—")}</dd></div>` : ""}</dl><div class="solution"><strong>Customer solution</strong><p>${escapeHtml(ticket.solution || "Support team is reviewing this ticket. Updates will appear here.")}</p></div></article>`).join("");
}
async function loadTickets(params, engineer = false) {
  message.hidden = true; results.innerHTML = '<div class="card empty-state">Loading tickets…</div>';
  try { const response = await fetch(`${API_URL}?${new URLSearchParams(params)}`); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load tickets."); renderTickets(data.tickets || [], engineer); } catch (error) { results.innerHTML = ""; showMessage(error.message); }
}
lookupForm.addEventListener("submit", event => { event.preventDefault(); if (!lookupForm.checkValidity()) return lookupForm.reportValidity(); const data = new FormData(lookupForm); loadTickets({ email: data.get("email").trim(), phone: data.get("phone").trim() }); });
engineerForm.addEventListener("submit", event => { event.preventDefault(); const data = new FormData(engineerForm); loadTickets({ engineerKey: data.get("engineerKey") }, true); });
