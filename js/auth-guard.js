// NeoMama Auth Guard
// Include this script on ALL protected pages
// It validates the JWT token against the API
// and redirects to login if invalid/expired.
(function () {
  const API_BASE = "http://localhost:5001/api/Auth";
  const token = localStorage.getItem("authToken");

  // No token at all — redirect immediately
  if (!token) {
    window.location.href = "../pages/login.html";
    return;
  }

  // Validate token against the server
  fetch(API_BASE + "/validate", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Token invalid");
      return res.json();
    })
    .then(data => {
      // Token valid — store basic info for quick access
      if (data.name) localStorage.setItem("doctorName", data.name);
      if (data.email) localStorage.setItem("doctorEmail", data.email);
      
      const role = localStorage.getItem("role") || "";
      const path = window.location.pathname;

      if (role === "midwife" && path.includes("manage-clinic.html")) {
        window.location.href = "../pages/dashboard.html";
      }
    })
    .catch(() => {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem("authToken");
      localStorage.removeItem("doctorName");
      localStorage.removeItem("doctorEmail");
      window.location.href = "../pages/login.html";
    });
})();

// Helper: get the auth header for API calls
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + (localStorage.getItem("authToken") || "")
  };
}
