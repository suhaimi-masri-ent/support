const form = document.getElementById("support-form");
const submitButton = document.getElementById("submit-button");
const messageBox = document.getElementById("form-message");

/*
 * Cloudflare Worker API
 */
const API_URL = "https://suhaimi-support-api.bitsuhami.workers.dev/";


function showMessage(message, type, ticketUrl = "") {

  messageBox.innerHTML = "";

  const messageText = document.createElement("div");
  messageText.textContent = message;

  messageBox.appendChild(messageText);

  if (ticketUrl) {

    const ticketLink = document.createElement("a");

    ticketLink.href = ticketUrl;
    ticketLink.target = "_blank";
    ticketLink.rel = "noopener noreferrer";
    ticketLink.textContent = "View Ticket";

    ticketLink.className = "view-ticket-button";

    messageBox.appendChild(ticketLink);
  }

  messageBox.className = `form-message ${type}`;
  messageBox.hidden = false;
}


function clearMessage() {

  messageBox.hidden = true;
  messageBox.innerHTML = "";
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

      requester:
        String(formData.get("requester") || "").trim(),

      email:
        String(formData.get("email") || "").trim(),

      company:
        String(formData.get("company") || "").trim(),

      category:
        String(formData.get("category") || "").trim(),

      priority:
        String(formData.get("priority") || "").trim(),

      summary:
        String(formData.get("summary") || "").trim(),

      details:
        String(formData.get("details") || "").trim()

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


      const result =
        await response.json().catch(() => ({}));


      if (!response.ok) {

        throw new Error(

          result.message ||

          "Unable to submit the support request."

        );

      }


      /*
       * GitHub issue successfully created.
       */
      if (result.success) {

        showMessage(

          `Support request submitted successfully. Ticket #${result.issueNumber}.`,

          "success",

          result.issueUrl

        );

        form.reset();

      } else {

        throw new Error(

          "The support request was submitted, but no ticket information was returned."

        );

      }


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
