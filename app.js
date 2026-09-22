const form = document.getElementById("support-form");
const submitButton = document.getElementById("submit-button");
const messageBox = document.getElementById("form-message");

/*
 * IMPORTANT:
 * Replace this URL after deploying the Cloudflare Worker.
 */
const API_URL = "https://suhaimi-support-api.bitsuhami.workers.dev";


function showMessage(message, type) {
  messageBox.textContent = message;
  messageBox.className = `form-message ${type}`;
  messageBox.hidden = false;
}


function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
  messageBox.className = "form-message";
}


function setLoading(loading) {

  submitButton.disabled = loading;

  if (loading) {
    submitButton.textContent = "Submitting...";
  } else {
    submitButton.textContent = "Submit support request";
  }
}


if (form) {

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    clearMessage();


    if (!form.checkValidity()) {

      form.reportValidity();

      return;
    }


    const formData = new FormData(form);

    const payload = {

      requester: String(formData.get("requester") || "").trim(),

      email: String(formData.get("email") || "").trim(),

      company: String(formData.get("company") || "").trim(),

      category: String(formData.get("category") || "").trim(),

      priority: String(formData.get("priority") || "").trim(),

      summary: String(formData.get("summary") || "").trim(),

      details: String(formData.get("details") || "").trim()

    };


    setLoading(true);


    try {

      const response = await fetch(API_URL, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)

      });


      const result = await response.json().catch(() => ({}));


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to submit the support request."
        );

      }


      showMessage(
        `Support request submitted successfully. Ticket #${result.issueNumber}.`,
        "success"
      );


      form.reset();


    } catch (error) {

      console.error(error);

      showMessage(
        error.message ||
        "Something went wrong. Please try again.",
        "error"
      );

    } finally {

      setLoading(false);

    }

  });

}
