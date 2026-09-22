const form = document.getElementById("support-form");
const submitButton = document.getElementById("submit-button");
const messageBox = document.getElementById("form-message");
const API_URL = "https://suhaimi-support-api.bitsuhami.workers.dev/";

function showMessage(text, type, ticketUrl = "") {
  messageBox.replaceChildren();
  const copy = document.createElement("div");
  copy.textContent = text;
  messageBox.append(copy);
  if (ticketUrl) {
    const link = document.createElement("a");
    link.href = ticketUrl;
    link.textContent = "Semak tiket anda →";
    link.className = "message-link";
    messageBox.append(link);
  }
  messageBox.className = `form-message ${type}`;
  messageBox.hidden = false;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  submitButton.disabled = true;
  submitButton.textContent = "Menghantar…";
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Permintaan tidak dapat dihantar.");
    showMessage(`Permintaan berjaya dihantar. Nombor tiket #${result.issueNumber}.`, "success", result.issueUrl);
    form.reset();
  } catch (error) {
    showMessage(error.message || "Sesuatu telah berlaku. Sila cuba lagi.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Hantar permintaan";
  }
});
