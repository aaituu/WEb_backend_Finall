document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    try {
      await API.request("/api/contact/send", {
        method: "POST",
        body: JSON.stringify({ name, email, subject, message })
      });
      alert("Message sent!");
      form.reset();
    } catch (err) {
      alert(err.message);
    }
  });
});
