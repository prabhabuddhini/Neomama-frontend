// SIGNUP FORM — JWT Authentication
const form = document.getElementById("signupForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const clinic = document.getElementById("clinic").value;
  const doctorRegNo = document.getElementById("regNo").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!name || !email || !phone || !clinic || !doctorRegNo || !password) {
    showToast("Please fill all fields.");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match.");
    return;
  }

  fetch("http://localhost:5001/api/Auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      phone,
      clinic,
      doctorRegNo,
      password,
      role: "doctor"
    })
  })
  .then(res => {
    if (!res.ok) return res.json().then(err => { throw new Error(err.message || "Registration failed"); });
    return res.json();
  })
  .then(data => {
    // Store JWT token — user is automatically logged in
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("doctorEmail", data.email);
    localStorage.setItem("doctorName", data.name || "");

    showToast("Account created successfully! Redirecting to dashboard...");
    window.location.href = "dashboard.html";
  })
  .catch(err => {
    showToast(err.message || "Error creating account.");
  });
});