const API_URL = "https://suhaimi-support-api.bitsuhami.workers.dev/";
const lookupForm = document.getElementById("lookup-form");
const engineerForm = document.getElementById("engineer-form");
const results = document.getElementById("results");
const message = document.getElementById("lookup-message");

function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" }); }
function showMessage(text, type = "error") { message.textContent = text; message.className = `form-message ${type}`; message.hidden = false; }
function renderTickets(tickets, engineer) {
  if (!tickets.length) { results.innerHTML = '<div class="card empty-state"><div class="empty-icon">⌕</div><h2>Tiada tiket dijumpai</h2><p>Pastikan email dan nombor telefon adalah sama seperti ketika tiket dihantar.</p></div>'; return; }
  results.innerHTML = `<div class="results-heading"><div><span class="eyebrow">Ticket results</span><h2>${engineer ? "Semua tiket sokongan" : "Tiket anda"}</h2></div><span class="result-count">${tickets.length} tiket</span></div>` + tickets.map((ticket) => `<article class="card ticket-card"><div class="ticket-top"><div><span class="ticket-number">#${escapeHtml(ticket.number)}</span><h3>${escapeHtml(ticket.title)}</h3></div><span class="status ${escapeHtml(ticket.state)}">${escapeHtml(ticket.state)}</span></div><div class="ticket-meta"><span><b>Dicipta</b>${formatDate(ticket.created_at)}</span><span><b>Kemaskini terakhir</b>${formatDate(ticket.updated_at)}</span>${engineer ? `<span><b>Customer</b>${escapeHtml(ticket.email || "—")} · ${escapeHtml(ticket.phone || "—")}</span>` : ""}</div><div class="solution-box"><span class="solution-label">Customer solution</span><p>${escapeHtml(ticket.solution || "Pasukan sokongan sedang menyemak tiket ini. Kemas kini akan dipaparkan di sini.")}</p></div></article>`).join("");
}
async function loadTickets(params, engineer = false) {
  message.hidden = true;
  results.innerHTML = '<div class="card loading-state">Sedang memuatkan tiket…</div>';
  try { const response = await fetch(`${API_URL}?${new URLSearchParams(params)}`); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || "Tiket tidak dapat dimuatkan."); renderTickets(data.tickets || [], engineer); } catch (error) { results.replaceChildren(); showMessage(error.message); }
}
lookupForm.addEventListener("submit", (event) => { event.preventDefault(); if (!lookupForm.checkValidity()) return lookupForm.reportValidity(); const data = new FormData(lookupForm); loadTickets({ email: String(data.get("email")).trim(), phone: String(data.get("phone")).trim() }); });
engineerForm.addEventListener("submit", (event) => { event.preventDefault(); if (!engineerForm.checkValidity()) return engineerForm.reportValidity(); const data = new FormData(engineerForm); loadTickets({ engineerKey: String(data.get("engineerKey")) }, true); });
