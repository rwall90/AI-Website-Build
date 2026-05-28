const form = document.querySelector("#lead-form");
const statusMessage = document.querySelector("#form-status");
const submitButton = form.querySelector("button[type='submit']");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const lead = {
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    company: formData.get("company").trim(),
    phone: formData.get("phone").trim(),
    volume: formData.get("volume"),
    message: formData.get("message").trim(),
  };

  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  statusMessage.textContent = "";
  statusMessage.classList.remove("is-error");

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Could not save your request.");
    }

    form.reset();
    statusMessage.textContent = "Thanks. Your demo request has been captured.";
  } catch (error) {
    statusMessage.textContent =
      error.message || "Something went wrong. Please try again.";
    statusMessage.classList.add("is-error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Request demo";
  }
});
