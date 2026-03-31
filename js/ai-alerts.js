const API = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    checkAiHealth();
    loadAlerts();
});

// Ai health check
async function checkAiHealth() {
    const badge = document.getElementById("aiStatusBadge");
    try {
        const res = await fetch(`${API}/ai/health`);
        const data = await res.json();
        if (data.status === "connected") {
            badge.textContent = "AI Online";
            badge.className = "ai-status online";
        } else {
            badge.textContent = "AI Offline";
            badge.className = "ai-status offline";
        }
    } catch {
        badge.textContent = "AI Offline";
        badge.className = "ai-status offline";
    }
}

// Load alerts
let allAlerts = [];

async function loadAlerts() {
    try {
        const res = await fetch(`${API}/alerts`);
        if (!res.ok) throw new Error("API error");
        allAlerts = await res.json();
        initFilters();
        renderAll();
        renderCharts();
        bindExport();
    } catch (err) {
        console.error("Failed to load alerts:", err);
        document.getElementById("alertsTableBody").innerHTML =
            '<tr><td colspan="7" class="empty-state">Unable to load alerts. Ensure backend is running.</td></tr>';
    }
}

// Filters
function initFilters() {
    ["alertSearch", "alertTypeFilter", "severityFilter", "statusFilter"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", renderAll);
    });
}

function getFiltered() {
    const search = (document.getElementById("alertSearch")?.value || "").toLowerCase();
    const type = (document.getElementById("alertTypeFilter")?.value || "all").toLowerCase();
    const severity = (document.getElementById("severityFilter")?.value || "all").toLowerCase();
    const status = (document.getElementById("statusFilter")?.value || "all").toLowerCase();

    return allAlerts.filter(a => {
        const matchSearch = !search || (a.patientName || "").toLowerCase().includes(search) || (a.alertType || "").toLowerCase().includes(search);
        const matchType = type === "all" || (a.alertType || "").toLowerCase() === type;
        const matchSev = severity === "all" || (a.severity || "").toLowerCase() === severity;
        const matchStatus = status === "all" || (a.status || "").toLowerCase() === status;
        return matchSearch && matchType && matchSev && matchStatus;
    });
}

// Render all
function renderAll() {
    const filtered = getFiltered();
    updateKPIs(filtered);
    renderCriticalAlerts(filtered);
    renderTable(filtered);
    renderRecommendations(filtered);
}

function updateKPIs(filtered) {
    setText("totalAlertsCount", filtered.length);
    setText("criticalAlertsCount", filtered.filter(a => sev(a) === "critical").length);
    setText("moderateAlertsCount", filtered.filter(a => sev(a) === "moderate").length);
    setText("resolvedAlertsCount", filtered.filter(a => sev(a) === "low" || st(a) === "resolved").length);
}

function renderCriticalAlerts(filtered) {
    const wrap = document.getElementById("criticalAlertsWrap");
    const critical = filtered.filter(a => sev(a) === "critical");
    const section = document.getElementById("criticalSection");

    if (critical.length === 0) {
        section.style.display = "none";
        return;
    }
    section.style.display = "block";

    wrap.innerHTML = critical.slice(0, 6).map(a => `
        <div class="critical-card">
            <div class="critical-card-top">
                <span class="critical-patient">${a.patientName}</span>
                <span class="status-badge ${statusClass(a.status)}">${a.status}</span>
            </div>
            <h5>${a.alertType}</h5>
            <p>${a.message}</p>
        </div>
    `).join("");
}

function renderTable(filtered) {
    const tbody = document.getElementById("alertsTableBody");
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No alerts match your filters</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${a.patientName}</td>
            <td>${a.alertType}</td>
            <td><span class="severity-badge ${sev(a)}">${a.severity}</span></td>
            <td>${a.date}</td>
            <td><span class="status-badge ${statusClass(a.status)}">${a.status}</span></td>
            <td style="font-size:12px;">${a.action}</td>
        </tr>
    `).join("");
}

function renderRecommendations(filtered) {
    const container = document.getElementById("aiRecommendationList");
    const unique = [...new Map(filtered.map(a => [a.alertType, a])).values()];

    if (unique.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;font-size:12px;padding:8px;">No recommendations at this time.</p>';
        return;
    }

    container.innerHTML = unique.slice(0, 6).map(a => `
        <div class="rec-card">
            <h5>${a.alertType}</h5>
            <p>${a.recommendation}</p>
        </div>
    `).join("");
}

// Charts
function renderCharts() {
    // Severity doughnut
    const critCount = allAlerts.filter(a => sev(a) === "critical").length;
    const modCount = allAlerts.filter(a => sev(a) === "moderate").length;
    const lowCount = allAlerts.filter(a => sev(a) === "low").length;

    new Chart(document.getElementById("severityChart"), {
        type: "doughnut",
        data: {
            labels: ["Critical", "Moderate", "Low"],
            datasets: [{ data: [critCount, modCount, lowCount], backgroundColor: ["#dc2626", "#d97706", "#0284c7"], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, font: { family: "'Poppins'", size: 11 } } } }, cutout: "65%" }
    });

    // Type distribution bar
    const typeCounts = {};
    allAlerts.forEach(a => { typeCounts[a.alertType] = (typeCounts[a.alertType] || 0) + 1; });
    const typeLabels = Object.keys(typeCounts);
    const typeData = Object.values(typeCounts);
    const typeColors = ["#1b4965", "#2c7da0", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#64748b"];

    new Chart(document.getElementById("typeChart"), {
        type: "bar",
        data: {
            labels: typeLabels,
            datasets: [{ label: "Count", data: typeData, backgroundColor: typeColors.slice(0, typeLabels.length), borderRadius: 6, barThickness: 22 }]
        },
        options: {
            responsive: true, indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "'Poppins'", size: 10 } } },
                y: { grid: { display: false }, ticks: { font: { family: "'Poppins'", size: 10 } } }
            }
        }
    });
}

// Export
function bindExport() {
    const btn = document.getElementById("exportAlertsBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        const filtered = getFiltered();
        const rows = [
            ["Alert ID", "Patient", "Type", "Severity", "Date", "Status", "Action"],
            ...filtered.map(a => [a.id, a.patientName, a.alertType, a.severity, a.date, a.status, a.action])
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `NeoMama_Alerts_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

// Helpers
function sev(a) { return (a.severity || "").toLowerCase(); }
function st(a) { return (a.status || "").toLowerCase(); }

function statusClass(status) {
    switch ((status || "").toLowerCase()) {
        case "new": return "new";
        case "pending review": return "pending";
        case "under monitoring": return "monitoring";
        case "resolved": return "resolved";
        case "escalated": return "escalated";
        default: return "";
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}