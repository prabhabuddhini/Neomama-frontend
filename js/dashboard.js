// Auth is handled by auth-guard.js (loaded before this script)

// Auto date show
const today = new Date();

const options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};

const dateElement = document.getElementById("todayDate");

if (dateElement) {
  dateElement.innerHTML = today.toLocaleDateString("en-US", options);
}

// Live time
function updateTime() {
  const now = new Date();

  let h = now.getHours();
  let m = now.getMinutes();
  let s = now.getSeconds();

  m = m < 10 ? "0" + m : m;
  s = s < 10 ? "0" + s : s;

  const timeElement = document.getElementById("liveTime");

  if (timeElement) {
    timeElement.innerHTML = h + ":" + m + ":" + s;
  }
}

setInterval(updateTime, 1000);

// Greeting
const hour = new Date().getHours();
let greeting = "";

if (hour < 12) {
  greeting = "Good Morning";
}
else if (hour < 18) {
  greeting = "Good Afternoon";
}
else {
  greeting = "Good Evening";
}

const role = localStorage.getItem("role") || "";
const isMidwife = role.toLowerCase() === "midwife";

const greetElement = document.getElementById("greetingText");

if (greetElement) {
  const dashType = isMidwife ? "Midwife Dashboard" : "Doctor Dashboard";
  greetElement.innerHTML = greeting + " — " + dashType;
}

// PROFILE — name & avatar
const rawName    = localStorage.getItem("doctorName") || "";
const doctorName = rawName.trim() || (isMidwife ? "Midwife" : "Doctor");

const namePrefix = isMidwife ? "" : "Dr. ";

// Header profile name (initial from localStorage)
const profileNameEl = document.getElementById("profileName");
if (profileNameEl) {
  profileNameEl.textContent = namePrefix + doctorName;
}

// Hero welcome text (initial from localStorage)
const welcomeEl = document.getElementById("welcomeText");
if (welcomeEl) {
  welcomeEl.textContent = "Welcome back, " + namePrefix + doctorName + ".";
}

// Fetch fresh profile data to get the profile picture
fetch("http://localhost:5001/api/Auth/profile", {
  headers: getAuthHeaders()
})
  .then(res => res.json())
  .then(data => {
    // Update name
    if (data.name) {
      if (profileNameEl) profileNameEl.textContent = namePrefix + data.name;
      if (welcomeEl) welcomeEl.textContent = "Welcome back, " + namePrefix + data.name + ".";
      localStorage.setItem("doctorName", data.name);
    }
    
    // Update avatar
    const profileAvatar = document.getElementById("profileAvatar");
    if (profileAvatar) {
      if (data.profileImage && data.profileImage.length > 10) {
        profileAvatar.src = data.profileImage;
      } else {
        const defaultAvatar = isMidwife ? "../images/avatar-mother.png" : "../images/avatar-doctor.png";
        profileAvatar.src = defaultAvatar;
      }
    }
  })
  .catch(err => console.error("Error loading profile:", err));

// Notification bell click
const bell = document.querySelector(".notif");

if (bell) {
  bell.addEventListener("click", () => {
    showToast("No new notifications");
  });
}

// Logout button confirm
const logoutBtn = document.querySelector(".logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {

    const confirmLogout = await showConfirm({
      title: "Log out?",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      variant: "danger"
    });

    if (confirmLogout) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("doctorEmail");
      localStorage.removeItem("doctorName");
      localStorage.removeItem("role");

      window.location.href = "login.html";
    }

  });
}
// View reports button click
const reportBtn = document.querySelector(".reports-btn");

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
    window.location.href = "reports.html";
  });
}

// Feature card navigation
document
  .querySelector(".maternal-card")
  ?.addEventListener("click", () => {
    window.location.href = "mothers.html";
  });

document
  .querySelector(".baby-card")
  ?.addEventListener("click", () => {
    window.location.href = "babies.html";
  });

document
  .querySelector(".clinic-card")
  ?.addEventListener("click", () => {
    window.location.href = "patients.html";
  });

document
  .querySelector(".ai-card")
  ?.addEventListener("click", () => {
    window.location.href = "assistant.html";
  });

// Quick action buttons
const registerBtn = document.querySelector(".quick-left button:nth-child(1)");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    window.location.href = "mothers.html";
  });
}

const babyBtn = document.querySelector(".quick-left button:nth-child(2)");

if (babyBtn) {
  babyBtn.addEventListener("click", () => {
    window.location.href = "babies.html";
  });
}

const reportBtn2 = document.querySelector(".quick-left button:nth-child(3)");

if (reportBtn2) {
  reportBtn2.addEventListener("click", () => {
    window.location.href = "reports.html";
  });
}

const aiBtn = document.querySelector(".quick-left button:nth-child(4)");

if (aiBtn) {
  aiBtn.addEventListener("click", () => {
    window.location.href = "assistant.html";
  });
}

const clinicBtn = document.querySelector(".quick-left button:nth-child(5)");

if (clinicBtn) {
  clinicBtn.addEventListener("click", () => {
    window.location.href = "patients.html";
  });
}

// BACKEND CONNECT — Dashboard Summary
document.addEventListener("DOMContentLoaded", function () {

  fetch("http://localhost:5001/api/dashboard/summary", {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("API error: " + res.status);
      return res.json();
    })
    .then(data => {

      const totalPatients = document.getElementById("totalPatients");
      if (totalPatients) totalPatients.innerText = data.totalPatients ?? 0;

      const totalVisits = document.getElementById("totalVisits");
      if (totalVisits) totalVisits.innerText = data.babiesMonitored ?? 0;

      const highRiskCount = document.getElementById("highRiskCount");
      if (highRiskCount) highRiskCount.innerText = data.highRiskAlerts ?? 0;

      const todayVisits = document.getElementById("todayVisits");
      if (todayVisits) todayVisits.innerText = data.clinicVisitsToday ?? 0;

    })
    .catch(err => {
      console.error("Dashboard API error:", err);
    });

  loadDashboardAlerts();
  loadRecentActivities();

});

// Recent Patient Activity — live dashboard widget
function loadRecentActivities() {
  const list = document.getElementById("recentActivityList");
  if (!list) return;

  fetch("http://localhost:5001/api/dashboard/activities", {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Activities API error: " + res.status);
      return res.json();
    })
    .then(activities => {
      renderRecentActivities(Array.isArray(activities) ? activities : []);
    })
    .catch(err => {
      console.error("Dashboard activities API error:", err);
      renderRecentActivityState("Unable to load activities");
    });
}

function renderRecentActivities(activities) {
  const list = document.getElementById("recentActivityList");
  if (!list) return;

  if (!activities.length) {
    renderRecentActivityState("No recent activities");
    return;
  }

  list.innerHTML = "";

  activities.forEach(activity => {
    const item = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "dot";
    
    const text = document.createTextNode(activity.message || "Unknown activity");
    
    // Optional: Add timestamp
    const timeSpan = document.createElement("small");
    timeSpan.style.display = "block";
    timeSpan.style.color = "#888";
    timeSpan.style.fontSize = "0.75rem";
    timeSpan.textContent = formatActivityTime(activity.timestamp);

    item.appendChild(dot);
    item.appendChild(text);
    item.appendChild(timeSpan);
    list.appendChild(item);
  });
}

function renderRecentActivityState(message) {
  const list = document.getElementById("recentActivityList");
  if (!list) return;

  list.innerHTML = "";
  const item = document.createElement("li");
  item.textContent = message;
  list.appendChild(item);
}

function formatActivityTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  return date.toLocaleDateString();
}

// Ai health alerts — live dashboard widget
function loadDashboardAlerts() {
  const list = document.getElementById("dashboardAlertList");
  if (!list) return;

  fetch("http://localhost:5001/api/alerts", {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Alerts API error: " + res.status);
      return res.json();
    })
    .then(alerts => {
      renderDashboardAlerts(Array.isArray(alerts) ? alerts : []);
    })
    .catch(err => {
      console.error("Dashboard alerts API error:", err);
      renderDashboardAlertState("Unable to load alerts");
    });
}

function renderDashboardAlerts(alerts) {
  if (!alerts.length) {
    renderDashboardAlertState("No active health alerts");
    return;
  }

  const list = document.getElementById("dashboardAlertList");
  if (!list) return;

  list.innerHTML = "";

  alerts.slice(0, 4).forEach(alert => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const badge = document.createElement("span");
    const severity = mapDashboardAlertSeverity(alert.severity);

    label.textContent = `${alert.alertType || "Health Alert"} - ${alert.patientName || "Unknown"}`;
    badge.className = `badge ${severity.className}`;
    badge.textContent = severity.label;

    item.append(label, badge);
    list.appendChild(item);
  });
}

function renderDashboardAlertState(message) {
  const list = document.getElementById("dashboardAlertList");
  if (!list) return;

  list.innerHTML = "";
  const item = document.createElement("li");
  item.className = "alert-empty";
  item.textContent = message;
  list.appendChild(item);
}

function mapDashboardAlertSeverity(value) {
  switch ((value || "").toLowerCase()) {
    case "critical":
      return { className: "high", label: "HIGH" };
    case "moderate":
      return { className: "medium", label: "MEDIUM" };
    case "low":
      return { className: "low", label: "LOW" };
    default:
      return { className: "low", label: "LOW" };
  }
}
