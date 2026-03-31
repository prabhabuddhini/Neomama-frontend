const API = "http://localhost:5001/api";
const REPORTS = `${API}/reports`;

// Chart instances
let chartInstances = {};

document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    loadClinicOverview();
    setupMotherSearch();
    setupBabySearch();
});

// Tab logic
function initTabs() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
        });
    });
}

// Tab 1: clinic overview
async function loadClinicOverview() {
    try {
        // Kpis
        const overview = await fetchJSON(`${REPORTS}/clinic-overview`);
        setText("kpiMothers", overview.totalMothers);
        setText("kpiActive", overview.activePregnancies);
        setText("kpiDelivered", overview.delivered);
        setText("kpiHighRisk", overview.highRisk);
        setText("kpiBabies", overview.totalBabies);
        setText("kpiGrowthAlerts", overview.growthAlerts);
        setText("kpiVisits", overview.visitsThisMonth);
        setText("kpiVaxRate", overview.vaccinationRate + "%");

        // Charts
        loadVisitChart();
        loadRiskChart();
        loadDeliveryChart();
        loadBloodGroupChart();
        loadVaccineChart();
        loadDoctorChart();
        loadHighRiskTable();

    } catch (err) { console.error("Clinic overview error:", err); }
}

async function loadVisitChart() {
    const data = await fetchJSON(`${REPORTS}/charts/visits`);
    createChart("visitChart", "line", data.labels, [{
        label: "Visits", data: data.data,
        borderColor: "#2c7da0", backgroundColor: "rgba(44,125,160,0.08)",
        borderWidth: 2.5, tension: 0.4, fill: true,
        pointBackgroundColor: "#2c7da0", pointRadius: 5
    }]);
}

async function loadRiskChart() {
    const data = await fetchJSON(`${REPORTS}/risk-breakdown`);
    createChart("riskChart", "doughnut", ["High Risk", "Normal"], [{
        data: [data.highRisk, data.normal],
        backgroundColor: ["#dc2626", "#16a34a"],
        borderWidth: 0
    }], { cutout: "65%" });
}

async function loadDeliveryChart() {
    const data = await fetchJSON(`${REPORTS}/charts/deliveries`);
    createChart("deliveryChart", "bar", data.labels, [{
        label: "Expected Deliveries", data: data.data,
        backgroundColor: "#1b4965", borderRadius: 6, barThickness: 28
    }]);
}

async function loadBloodGroupChart() {
    const data = await fetchJSON(`${REPORTS}/charts/bloodgroups`);
    const colors = ["#1b4965", "#2c7da0", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#64748b"];
    createChart("bloodGroupChart", "polarArea", data.labels, [{
        data: data.data,
        backgroundColor: colors.slice(0, data.labels.length),
        borderWidth: 0
    }]);
}

async function loadVaccineChart() {
    const data = await fetchJSON(`${REPORTS}/charts/vaccines`);
    createChart("vaccineChart", "bar", data.labels, [
        { label: "Given", data: data.given, backgroundColor: "#16a34a", borderRadius: 4, barThickness: 18 },
        { label: "Pending", data: data.pending, backgroundColor: "#d97706", borderRadius: 4, barThickness: 18 },
        { label: "Skipped", data: data.skipped, backgroundColor: "#dc2626", borderRadius: 4, barThickness: 18 }
    ], {}, { stacked: true });
}

async function loadDoctorChart() {
    const data = await fetchJSON(`${REPORTS}/charts/doctors`);
    createChart("doctorChart", "bar", data.labels, [{
        label: "Patients", data: data.data,
        backgroundColor: "#2c7da0", borderRadius: 6, barThickness: 24
    }], {}, { horizontal: true });
}

async function loadHighRiskTable() {
    const data = await fetchJSON(`${REPORTS}/high-risk-mothers`);
    const tbody = document.getElementById("highRiskTableBody");
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No high-risk mothers detected</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(m => `
        <tr>
            <td>${m.name}</td><td>${m.weeks || "-"}</td>
            <td>${m.bloodPressure || "-"}</td>
            <td>${m.riskFactors || "-"}</td>
            <td>${m.doctorName || "-"}</td>
        </tr>
    `).join("");
}

// Tab 2: mother report
async function setupMotherSearch() {
    const patients = await fetchJSON(`${API}/patients`);
    const input = document.getElementById("motherSearchInput");
    const dropdown = document.getElementById("motherDropdownList");

    function renderList(filter = "") {
        dropdown.innerHTML = "";
        const filtered = patients.filter(p => (p.name || "").toLowerCase().includes(filter.toLowerCase()));
        if (filtered.length === 0) { dropdown.innerHTML = '<div class="dropdown-item" style="color:#94a3b8">No results</div>'; return; }
        filtered.forEach(p => {
            const item = document.createElement("div");
            item.className = "dropdown-item";
            item.innerHTML = `<strong>${p.name}</strong> <span style="color:#94a3b8;font-size:12px;">${p.id}</span>`;
            item.onclick = () => { input.value = p.name; dropdown.style.display = "none"; loadMotherReport(p.id); };
            dropdown.appendChild(item);
        });
    }

    input.addEventListener("focus", () => { dropdown.style.display = "block"; renderList(input.value); });
    input.addEventListener("input", e => { dropdown.style.display = "block"; renderList(e.target.value); });
    document.addEventListener("click", e => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = "none"; });
}

async function loadMotherReport(id) {
    const data = await fetchJSON(`${REPORTS}/mother/${id}`);
    if (!data) return;

    document.getElementById("motherReportContent").style.display = "block";
    const m = data.mother;

    // Avatar
    document.getElementById("motherAvatar").innerText = (m.name || "M").charAt(0);
    document.getElementById("motherName").innerText = m.name || "-";
    document.getElementById("motherMeta").innerText = `Patient ID: ${m.id} | Age: ${m.age} | ${m.status}`;

    // Badges
    document.getElementById("motherBadges").innerHTML = `
        <span class="badge badge-info">${m.bloodGroup || "-"}</span>
        <span class="badge ${m.status === 'Delivered' ? 'badge-success' : 'badge-neutral'}">${m.status}</span>
        ${m.diabetes === 'Yes' || m.hypertension === 'Yes' ? '<span class="badge badge-danger">At Risk</span>' : '<span class="badge badge-success">Normal</span>'}
    `;

    // Info grid
    document.getElementById("motherInfoGrid").innerHTML = [
        { l: "Phone", v: m.phone }, { l: "Address", v: m.address },
        { l: "Doctor", v: m.doctorName }, { l: "Weeks", v: m.weeks },
        { l: "Blood Pressure", v: m.bloodPressure }, { l: "Weight", v: m.weight + " kg" },
        { l: "Expected Delivery", v: m.expectedDelivery || "-" }, { l: "First Pregnancy", v: m.firstPregnancy },
        { l: "Diabetes", v: m.diabetes }, { l: "Hypertension", v: m.hypertension },
        { l: "Complications", v: m.complications }, { l: "Allergies", v: m.allergies }
    ].map(i => `<div class="info-item"><span class="info-label">${i.l}</span><span class="info-value">${i.v || "-"}</span></div>`).join("");

    // Visits
    const visits = data.visits || [];

    // Visit table
    document.getElementById("motherVisitTable").innerHTML = visits.length === 0
        ? '<tr><td colspan="8" class="empty-state">No visits recorded</td></tr>'
        : visits.map(v => `<tr><td>${v.date}</td><td>${v.weeks}</td><td>${v.weight} kg</td><td>${v.bp || "-"}</td><td>${v.sugar || "-"}</td><td>${v.hemoglobin || "-"}</td><td><span class="risk-badge ${(v.risk||"").toLowerCase() === 'high' ? 'high' : 'normal'}">${v.risk || "Normal"}</span></td><td>${v.notes || "-"}</td></tr>`).join("");

    // Charts
    const labels = visits.map(v => "Wk " + v.weeks);

    destroyChart("motherWeightChart");
    createChart("motherWeightChart", "line", labels, [{
        label: "Weight (kg)", data: visits.map(v => v.weight),
        borderColor: "#2c7da0", backgroundColor: "rgba(44,125,160,0.08)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#2c7da0"
    }]);

    // BP chart: split systolic/diastolic
    const systolic = [], diastolic = [];
    visits.forEach(v => {
        if (v.bp && v.bp.includes("/")) {
            const parts = v.bp.split("/");
            systolic.push(parseInt(parts[0]) || 0);
            diastolic.push(parseInt(parts[1]) || 0);
        } else { systolic.push(0); diastolic.push(0); }
    });

    destroyChart("motherBPChart");
    createChart("motherBPChart", "line", labels, [
        { label: "Systolic", data: systolic, borderColor: "#dc2626", backgroundColor: "rgba(220,38,38,0.06)", borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: "#dc2626" },
        { label: "Diastolic", data: diastolic, borderColor: "#d97706", backgroundColor: "rgba(217,119,6,0.06)", borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: "#d97706" }
    ]);

    // Sugar
    destroyChart("motherSugarChart");
    createChart("motherSugarChart", "line", labels, [{
        label: "Sugar", data: visits.map(v => parseFloat(v.sugar) || 0),
        borderColor: "#d97706", backgroundColor: "rgba(217,119,6,0.06)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: "#d97706"
    }]);

    // Hemoglobin
    destroyChart("motherHbChart");
    createChart("motherHbChart", "line", labels, [{
        label: "Hemoglobin (g/dL)", data: visits.map(v => parseFloat(v.hemoglobin) || 0),
        borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.06)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: "#16a34a"
    }]);

    // Linked baby
    if (data.baby) {
        document.getElementById("linkedBabyCard").style.display = "block";
        document.getElementById("linkedBabyGrid").innerHTML = [
            { l: "Baby Name", v: data.baby.babyName }, { l: "Gender", v: data.baby.gender },
            { l: "Birth Date", v: data.baby.birthDate }, { l: "Birth Weight", v: data.baby.weight + " kg" },
            { l: "Delivery Type", v: data.baby.deliveryType },
            { l: "Apgar 1 min", v: data.baby.apgar1 + "/10" },
            { l: "Apgar 5 min", v: data.baby.apgar5 + "/10" }
        ].map(i => `<div class="info-item"><span class="info-label">${i.l}</span><span class="info-value">${i.v || "-"}</span></div>`).join("");
    } else {
        document.getElementById("linkedBabyCard").style.display = "none";
    }
}

// Tab 3: baby report
async function setupBabySearch() {
    const babies = await fetchJSON(`${API}/babies`);
    const input = document.getElementById("babySearchInput");
    const dropdown = document.getElementById("babyDropdownList");

    function renderList(filter = "") {
        dropdown.innerHTML = "";
        const filtered = babies.filter(b => {
            const str = ((b.babyName || "") + " " + (b.motherName || "")).toLowerCase();
            return str.includes(filter.toLowerCase());
        });
        if (filtered.length === 0) { dropdown.innerHTML = '<div class="dropdown-item" style="color:#94a3b8">No babies found</div>'; return; }
        filtered.forEach(b => {
            const item = document.createElement("div");
            item.className = "dropdown-item";
            item.innerHTML = `<strong>${b.babyName}</strong> <span style="color:#94a3b8;font-size:12px;">Mother: ${b.motherName || "-"}</span>`;
            item.onclick = () => { input.value = b.babyName; dropdown.style.display = "none"; loadBabyReport(b.id); };
            dropdown.appendChild(item);
        });
    }

    input.addEventListener("focus", () => { dropdown.style.display = "block"; renderList(input.value); });
    input.addEventListener("input", e => { dropdown.style.display = "block"; renderList(e.target.value); });
    document.addEventListener("click", e => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = "none"; });
}

async function loadBabyReport(id) {
    const data = await fetchJSON(`${REPORTS}/baby/${id}`);
    if (!data) return;

    document.getElementById("babyReportContent").style.display = "block";
    const b = data.baby;
    const records = data.growthRecords || [];

    // Avatar
    document.getElementById("babyAvatar").innerText = (b.babyName || "B").charAt(0);
    document.getElementById("babyName").innerText = b.babyName || "-";
    document.getElementById("babyMeta").innerText = `Patient ID: ${b.patientId} | Mother: ${b.motherName || "-"}`;

    // Badges
    document.getElementById("babyBadges").innerHTML = `
        <span class="badge badge-info">${b.gender || "-"}</span>
        <span class="badge badge-neutral">${b.bloodGroup || "-"}</span>
        <span class="badge ${b.riskAlert ? 'badge-danger' : 'badge-success'}">${b.riskAlert || "Healthy"}</span>
    `;

    // Info grid
    document.getElementById("babyInfoGrid").innerHTML = [
        { l: "Baby Name", v: b.babyName }, { l: "Date of Birth", v: b.birthDate },
        { l: "Gender", v: b.gender }, { l: "Blood Group", v: b.bloodGroup },
        { l: "Mother", v: b.motherName }, { l: "Delivery Type", v: b.deliveryType },
        { l: "Birth Status", v: b.birthStatus }, { l: "Clinic", v: b.clinic }
    ].map(i => `<div class="info-item"><span class="info-label">${i.l}</span><span class="info-value">${i.v || "-"}</span></div>`).join("");

    // Indicators
    const bmi = (b.weight && b.height && b.height > 30) ? (b.weight / ((b.height/100) * (b.height/100))).toFixed(1) : "-";
    document.getElementById("babyIndicators").innerHTML = [
        { l: "Birth Weight", v: b.weight ? b.weight + " kg" : "-" },
        { l: "Birth Height", v: b.height ? b.height + " cm" : "-" },
        { l: "Head Circ.", v: b.headCircumference ? b.headCircumference + " cm" : "-" },
        { l: "BMI", v: bmi },
        { l: "Apgar (1 min)", v: b.apgar1 + "/10" },
        { l: "Apgar (5 min)", v: b.apgar5 + "/10" }
    ].map(i => `<div class="indicator-card"><span class="indicator-label">${i.l}</span><span class="indicator-value">${i.v}</span></div>`).join("");

    // Growth charts
    const labels = ["Birth", ...records.map(r => r.ageAtVisit || r.visitDate)];
    const weights = [b.weight || 0, ...records.map(r => r.weight || 0)];
    const heights = [b.height || 0, ...records.map(r => r.height || 0)];
    const heads = [b.headCircumference || 0, ...records.map(r => r.headCircumference || 0)];

    destroyChart("babyWeightChart");
    createChart("babyWeightChart", "line", labels, [{
        label: "Weight (kg)", data: weights,
        borderColor: "#2c7da0", backgroundColor: "rgba(44,125,160,0.08)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#2c7da0"
    }]);

    destroyChart("babyHeightChart");
    createChart("babyHeightChart", "line", labels, [{
        label: "Height (cm)", data: heights,
        borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.06)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#16a34a"
    }]);

    destroyChart("babyHeadChart");
    createChart("babyHeadChart", "line", labels, [{
        label: "Head Circ. (cm)", data: heads,
        borderColor: "#d97706", backgroundColor: "rgba(217,119,6,0.06)",
        borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 5, pointBackgroundColor: "#d97706"
    }]);

    // Vaccination timeline
    const vaxContainer = document.getElementById("babyVaxTimeline");
    const vaccines = [];
    records.forEach(r => {
        if (!r.vaccineName) return;
        const names = r.vaccineName.split(",").map(s => s.trim());
        const statuses = (r.vaccineStatus || "").split(",").map(s => s.trim());
        names.forEach((name, i) => {
            if (name) vaccines.push({ name, status: statuses[i] || "Given", date: r.visitDate });
        });
    });
    if (b.bcgVaccine) {
        const hasBCG = vaccines.some(v => v.name === "BCG");
        if (!hasBCG) vaccines.unshift({ name: "BCG", status: b.bcgVaccine === "Yes" ? "Given" : "Pending", date: b.birthDate });
    }

    vaxContainer.innerHTML = vaccines.length === 0
        ? '<p style="color:#94a3b8;font-size:12px;text-align:center;padding:12px;">No vaccination records</p>'
        : vaccines.map(v => {
            const cls = v.status === "Given" ? "given" : v.status === "Skipped" ? "skipped" : "pending";
            return `<div class="vax-row"><span class="vax-name">${v.name}</span><span class="vax-status ${cls}">${v.status}</span></div>`;
        }).join("");

    // Growth table
    document.getElementById("babyGrowthTable").innerHTML = records.length === 0
        ? '<tr><td colspan="7" class="empty-state">No growth records</td></tr>'
        : records.map(r => {
            const dateStr = r.visitDate ? new Date(r.visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
            const vaxInfo = r.vaccineName ? `${r.vaccineName}` : "-";
            return `<tr><td>${dateStr}</td><td>${r.ageAtVisit || "-"}</td><td>${r.weight} kg</td><td>${r.height} cm</td><td>${r.headCircumference} cm</td><td>${vaxInfo}</td><td>${r.doctorNotes || "-"}</td></tr>`;
        }).join("");
}

// Chart helpers
function createChart(canvasId, type, labels, datasets, pluginOpts = {}, extra = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    const opts = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { position: "top", labels: { usePointStyle: true, padding: 16, font: { family: "'Poppins'", size: 11 } } },
            ...pluginOpts
        },
        scales: type === "doughnut" || type === "polarArea" ? {} : {
            y: { beginAtZero: type === "bar", grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { family: "'Poppins'", size: 10 } }, stacked: !!extra.stacked },
            x: { grid: { display: false }, ticks: { font: { family: "'Poppins'", size: 10 } }, stacked: !!extra.stacked }
        }
    };

    if (extra.horizontal) {
        opts.indexAxis = "y";
    }

    chartInstances[canvasId] = new Chart(ctx, { type, data: { labels, datasets }, options: opts });
}

function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

// Utils
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error: " + res.status);
    return res.json();
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}