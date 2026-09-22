const form = document.getElementById("support-form");
const submitButton = document.getElementById("submit-button");
const messageBox = document.getElementById("form-message");


/*
 * Cloudflare Worker API
 */
const API_URL =
  "https://suhaimi-support-api.bitsuhami.workers.dev/";


/*
 * Show message
 */
function showMessage(
  message,
  type,
  ticketUrl = "",
  issueNumber = "",
  supportId = ""
) {

  messageBox.innerHTML = "";

  const messageText =
    document.createElement("div");

  messageText.textContent = message;

  messageBox.appendChild(messageText);


  /*
   * Show Support ID
   */
  if (supportId) {

    const supportReference =
      document.createElement("div");

    supportReference.className =
      "support-reference";

    supportReference.textContent =
      `Support ID: ${supportId}`;

    messageBox.appendChild(
      supportReference
    );

  }


  /*
   * Show GitHub Ticket link
   */
  if (ticketUrl) {

    const ticketLink =
      document.createElement("a");

    ticketLink.href = ticketUrl;

    ticketLink.textContent =
      issueNumber
        ? `View GitHub Ticket #${issueNumber}`
        : "View GitHub Ticket";

    ticketLink.target = "_blank";

    ticketLink.rel =
      "noopener noreferrer";

    ticketLink.className =
      "view-ticket-button";

    messageBox.appendChild(
      ticketLink
    );

  }


  messageBox.className =
    `form-message ${type}`;

  messageBox.hidden = false;

}


/*
 * Clear message
 */
function clearMessage() {

  messageBox.hidden = true;

  messageBox.innerHTML = "";

  messageBox.className =
    "form-message";

}


/*
 * Submit button loading state
 */
function setLoading(loading) {

  submitButton.disabled =
    loading;


  if (loading) {

    submitButton.textContent =
      "Submitting...";

  } else {

    submitButton.textContent =
      "Submit support request";

  }

}


/*
 * Submit support form
 */
if (form) {

  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      clearMessage();


      /*
       * Browser validation
       */
      if (!form.checkValidity()) {

        form.reportValidity();

        return;

      }


      /*
       * Collect form data
       */
      const formData =
        new FormData(form);


      const payload = {

        requester:
          String(
            formData.get("requester") || ""
          ).trim(),

        email:
          String(
            formData.get("email") || ""
          ).trim(),

        company:
          String(
            formData.get("company") || ""
          ).trim(),

        category:
          String(
            formData.get("category") || ""
          ).trim(),

        priority:
          String(
            formData.get("priority") || ""
          ).trim(),

        summary:
          String(
            formData.get("summary") || ""
          ).trim(),

        details:
          String(
            formData.get("details") || ""
          ).trim()

      };


      /*
       * Start loading
       */
      setLoading(true);


      try {

        /*
         * Send request to Cloudflare Worker
         */
        const response =
          await fetch(
            API_URL,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(payload)
            }
          );


        /*
         * Read JSON response
         */
        const result =
          await response
            .json()
            .catch(() => ({}));


        /*
         * Handle API error
         */
        if (!response.ok) {

          throw new Error(
            result.message ||
            "Unable to submit the support request."
          );

        }


        /*
         * Successful submission
         *
         * IMPORTANT:
         * Support ID is now displayed separately
         * from GitHub Issue number.
         */
        showMessage(
          "Support request submitted successfully.",
          "success",
          result.issueUrl || "",
          result.issueNumber || "",
          result.supportId || ""
        );


        /*
         * Reset form
         */
        form.reset();


      } catch (error) {

        console.error(
          "Support submission error:",
          error
        );


        showMessage(
          error.message ||
          "Something went wrong. Please try again.",
          "error"
        );


      } finally {

        /*
         * Stop loading
         */
        setLoading(false);

      }

    }
  );

}
