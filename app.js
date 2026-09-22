const form =
  document.getElementById("support-form");

const submitButton =
  form
    ? form.querySelector('button[type="submit"]')
    : null;

const messageBox =
  document.getElementById("form-message");


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

  /*
   * If form-message does not exist in HTML,
   * create it automatically.
   */
  let box =
    document.getElementById("form-message");

  if (!box && form) {

    box =
      document.createElement("div");

    box.id =
      "form-message";

    box.className =
      "form-message";

    box.hidden =
      true;

    form.appendChild(box);
  }


  if (!box) {
    return;
  }


  box.innerHTML = "";


  const messageText =
    document.createElement("div");

  messageText.textContent =
    message;

  box.appendChild(
    messageText
  );


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

    box.appendChild(
      supportReference
    );
  }


  /*
   * Show GitHub Ticket link
   */
  if (ticketUrl) {

    const ticketLink =
      document.createElement("a");

    ticketLink.href =
      ticketUrl;

    ticketLink.textContent =
      issueNumber
        ? `View GitHub Ticket #${issueNumber}`
        : "View GitHub Ticket";

    ticketLink.target =
      "_blank";

    ticketLink.rel =
      "noopener noreferrer";

    ticketLink.className =
      "view-ticket-button";

    box.appendChild(
      ticketLink
    );
  }


  box.className =
    `form-message ${type}`;

  box.hidden =
    false;
}


/*
 * Clear message
 */
function clearMessage() {

  const box =
    document.getElementById("form-message");

  if (!box) {
    return;
  }

  box.hidden =
    true;

  box.innerHTML =
    "";

  box.className =
    "form-message";
}


/*
 * Submit button loading state
 */
function setLoading(
  loading
) {

  if (!submitButton) {
    return;
  }

  submitButton.disabled =
    loading;


  if (loading) {

    submitButton.textContent =
      "Submitting...";

  } else {

    submitButton.textContent =
      "Submit request";

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


      /*
       * Build API payload
       *
       * IMPORTANT:
       * Phone is now included.
       */
      const payload = {

        requester:
          String(
            formData.get("requester") || ""
          ).trim(),

        email:
          String(
            formData.get("email") || ""
          ).trim(),

        phone:
          String(
            formData.get("phone") || ""
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
                  "application/json",

                "Accept":
                  "application/json"
              },

              body:
                JSON.stringify(
                  payload
                )
            }
          );


        /*
         * Read JSON response
         */
        const result =
          await response
            .json()
            .catch(
              () => ({})
            );


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
         */
        showMessage(

          "Support request submitted successfully.",

          "success",

          result.issueUrl ||
            "",

          result.issueNumber ||
            "",

          result.supportId ||
            ""
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
