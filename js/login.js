// LOGIN FORM — JWT Authentication
const loginForm = document.querySelector("form");

if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.querySelector("input[type='email']").value;
    const password = document.querySelector("#password").value;

    if (email === "" || password === "") {
      showToast("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }

    fetch("http://localhost:5001/api/Auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    .then(res => {
      if (!res.ok) return res.json().then(err => { throw new Error(err.message || "Login failed"); });
      return res.json();
    })
    .then(data => {
      // Store JWT token and basic info
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("token", data.token); // Unified token key
      localStorage.setItem("doctorEmail", data.email);
      localStorage.setItem("doctorName", data.name || "");
      localStorage.setItem("role", data.role || "");

      // Redirect to dashboard
      window.location.href = "../pages/dashboard.html";
    })
    .catch(err => {
      showToast(err.message || "Invalid email or password.");
    });
  });
}

// Forgot password + reset
const forgotLink = document.querySelector(".form-options a");

if (forgotLink) {
  forgotLink.addEventListener("click", function(e) {
    e.preventDefault();

    const modalElement = document.getElementById("forgotModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    setTimeout(() => {
      const resetBtn = document.getElementById("resetBtn");

      if (resetBtn) {
        resetBtn.onclick = function () {
          const email = document.getElementById("resetEmail").value;
          const newPassword = document.getElementById("newPassword").value;

          if (!email || !newPassword) {
            showToast("Please fill all fields.");
            return;
          }

          if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters.");
            return;
          }

          fetch("http://localhost:5001/api/Auth/forgot-password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword })
          })
          .then(res => {
            if (!res.ok) return res.json().then(err => { throw new Error(err.message || "Error"); });
            return res.json();
          })
          .then(() => {
            showToast("Password reset successful.");
            location.reload();
          })
          .catch(err => {
            showToast(err.message || "Email not found.");
          });
        };
      }
    }, 300);
  });
}