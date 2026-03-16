// SMOOTH SCROLL (Explore button → features section) =====
document.addEventListener("DOMContentLoaded", function () {
  const exploreBtn = document.querySelector(".btn-main");

  if (exploreBtn) {
    exploreBtn.addEventListener("click", function () {
      window.scrollTo({
        top: window.innerHeight,
        behavior: "smooth"
      });
    });
  }
});

// Scroll animation for cards =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
});

document.querySelectorAll(".feature-card").forEach((card) => {
  observer.observe(card);
});

document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.querySelector("#contact form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const fullName = contactForm.querySelector('input[type="text"]').value.trim();
      const email = contactForm.querySelector('input[type="email"]').value.trim();
      const subject = contactForm.querySelectorAll('input[type="text"]')[1].value.trim();
      const message = contactForm.querySelector("textarea").value.trim();

      if (fullName === "" || email === "" || subject === "" || message === "") {
        showToast("Please fill in all fields.");
        return;
      }

      showToast("Message submitted successfully!");
      contactForm.reset();
    });
  }
});

// Contact form submit
document.getElementById("contactForm")?.addEventListener("submit", function (e) {

  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("message").value;

  fetch("http://localhost:5001/api/contact", {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          name,
          email,
          subject,
          message
      })
  })
  .then(() => {
      showToast("Message sent successfully!");
      document.getElementById("contactForm").reset();
  })
  .catch(err => console.error(err));

});