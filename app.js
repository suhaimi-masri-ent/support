const form = document.getElementById("support-form");

const issueFormUrl =
  "https://github.com/suhaimi-masri-ent/support/issues/new?template=support-request.yml";

if (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    window.location.href = issueFormUrl;
  });
}
