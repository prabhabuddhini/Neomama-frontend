const BABIES_API = "http://localhost:5001/api/babies";
const GROWTH_API = "http://localhost:5001/api/growthrecords";

let growthChart = null;
let currentBaby = null;
let allBabiesCache = [];

document.addEventListener("DOMContentLoaded", async function () {

    await loadAllBabies();
    loadOverviewCards();

    // Save growth record
    const saveBtn = document.getElementById("saveGrowthBtn");
    if (saveBtn) saveBtn.addEventListener("click", saveGrowthRecord);

    // Add vaccine row button
    const addVaxBtn = document.getElementById("addVaccineBtn");
    if (addVaxBtn) addVaxBtn.addEventListener("click", addVaccineRow);

    // Delete handler (delegated)
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-delete")) {
            const id = e.target.getAttribute("data-id");
            deleteGrowthRecord(id);
        }
        if (e.target.classList.contains("btn-remove-vax")) {
            e.target.closest(".vaccine-row").remove();
        }
    });
});

// LOAD ALL BABIES — searchable dropdown
async function loadAllBabies() {
    try {
        const res = await fetch(BABIES_API);
        if (!res.ok) throw new Error("Cannot reach babies API");
        const babies = await res.json();
        allBabiesCache = babies;

        const searchInput = document.getElementById("babySearchInput");
        const dropdownList = document.getElementById("babyDropdownList");
        if (!searchInput || !dropdownList) return;

        function renderList(filterText = "") {
            dropdownList.innerHTML = "";
            const filtered = babies.filter(b => {
                const str = ((b.babyName || "") + " " + (b.motherName || "") + " " + (b.patientId || "")).toLowerCase();
                return str.includes(filterText.toLowerCase());
            });

            if (filtered.length === 0) {
                dropdownList.innerHTML = '<div class="dropdown-item" style="color:#94a3b8;text-align:center;">No babies found</div>';
                return;
            }

            filtered.forEach(baby => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `<strong>${baby.babyName}</strong> <span style="color:#94a3b8;font-size:12px;">Mother: ${baby.motherName || "N/A"} | ${baby.patientId || ""}</span>`;
                item.onclick = () => {
                    searchInput.value = baby.babyName;
                    dropdownList.style.display = "none";
                    selectBaby(baby);
                };
                dropdownList.appendChild(item);
            });
        }

        searchInput.addEventListener("focus", () => { dropdownList.style.display = "block"; renderList(searchInput.value); });
        searchInput.addEventListener("input", (e) => { dropdownList.style.display = "block"; renderList(e.target.value); });
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !dropdownList.contains(e.target)) dropdownList.style.display = "none";
        });

        renderList();

    } catch (err) {
        console.error("Failed to load babies:", err);
    }
}

// Select baby
function selectBaby(baby) {
    currentBaby = baby;
    document.getElementById("trackingContent").style.display = "block";
    const overview = document.getElementById("overviewCards");
    if (overview) overview.style.display = "none";
    loadBabyData(baby);
}

// Load baby data
function loadBabyData(baby) {

    // Avatar
    const avatarEl = document.getElementById("avatarLetter");
    if (avatarEl) avatarEl.innerText = (baby.babyName || "B").charAt(0).toUpperCase();

    // Header
    setText("headerBabyName", baby.babyName || "-");
    setText("headerPatientId", baby.patientId || "-");
    setText("infoBabyName", baby.babyName || "-");
    setText("infoMotherName", baby.motherName || "-");
    setText("infoDeliveryType", baby.deliveryType || "-");
    setText("infoBirthStatus", baby.birthStatus || "-");
    setText("infoClinic", baby.clinic || "-");

    // Badges
    const genderBadge = document.getElementById("genderBadge");
    if (genderBadge) { genderBadge.innerText = baby.gender || "-"; genderBadge.className = "badge badge-info"; }

    const bloodBadge = document.getElementById("bloodBadge");
    if (bloodBadge) { bloodBadge.innerText = baby.bloodGroup || "-"; bloodBadge.className = "badge badge-neutral"; }

    // DOB + Age
    if (baby.birthDate) {
        setText("babyDOB", new Date(baby.birthDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }));
        calculateAge(baby.birthDate);
    }

    // Birth indicators
    setText("weightValue", baby.weight ? baby.weight + " kg" : "-");
    setText("heightValue", baby.height ? baby.height + " cm" : "-");
    setText("headValue", baby.headCircumference ? baby.headCircumference + " cm" : "-");
    setText("apgar1Value", baby.apgar1 !== undefined ? baby.apgar1 + "/10" : "-");
    setText("apgar5Value", baby.apgar5 !== undefined ? baby.apgar5 + "/10" : "-");

    // BMI
    if (baby.weight && baby.height && baby.height > 30) {
        const hm = baby.height / 100;
        setText("bmiValue", (baby.weight / (hm * hm)).toFixed(1));
    } else {
        setText("bmiValue", "-");
    }

    // WHO comparison
    const whoStandards = { 0:3.3, 1:4.5, 2:5.6, 3:6.4, 4:7.0, 5:7.5, 6:7.9, 7:8.3, 8:8.6, 9:8.9, 10:9.2, 11:9.4, 12:9.6 };
    let ageMonths = 0;
    if (baby.birthDate) {
        const dob = new Date(baby.birthDate);
        ageMonths = Math.max(0, (new Date().getFullYear() - dob.getFullYear()) * 12 + (new Date().getMonth() - dob.getMonth()));
    }
    const whoKey = Math.min(ageMonths, 12);
    const whoStd = whoStandards[whoKey] || 3.3;
    setText("whoStandardWeight", whoStd + " kg");
    setText("whoWeightDisplay", baby.weight ? baby.weight + " kg" : "-");

    const whoEl = document.getElementById("whoStatus");
    if (whoEl && baby.weight) {
        const diff = baby.weight - whoStd;
        if (diff < -1.5) { whoEl.innerText = "Underweight for age"; whoEl.style.color = "#dc2626"; }
        else if (diff > 1.5) { whoEl.innerText = "Overweight for age"; whoEl.style.color = "#d97706"; }
        else { whoEl.innerText = "Normal weight for age"; whoEl.style.color = "#16a34a"; }
    }

    // Risk
    const riskEl = document.getElementById("riskStatus");
    const riskRec = document.getElementById("riskRecommendation");
    if (riskEl) {
        if (baby.riskAlert && baby.riskAlert !== "") {
            riskEl.innerText = baby.riskAlert;
            riskEl.className = "risk-box warning";
            if (riskRec) riskRec.innerText = "Close monitoring recommended. Consult pediatrician.";
        } else if (baby.weight && baby.weight >= 2.5 && baby.weight <= 4.5) {
            riskEl.innerText = "Normal birth weight — no risk detected";
            riskEl.className = "risk-box normal";
            if (riskRec) riskRec.innerText = "Continue monthly growth tracking.";
        } else {
            riskEl.innerText = "Review required";
            riskEl.className = "risk-box warning";
            if (riskRec) riskRec.innerText = "Weight may be outside expected range. Consult pediatrician.";
        }
    }

    // Doctor notes
    setText("doctorNotesDisplay", baby.doctorNotes || "No notes available.");

    // Risk badge
    const riskBadge = document.getElementById("riskBadge");
    if (riskBadge) {
        if (baby.riskAlert && baby.riskAlert !== "") {
            riskBadge.innerText = "At Risk";
            riskBadge.className = "badge badge-danger";
        } else {
            riskBadge.innerText = "Healthy";
            riskBadge.className = "badge badge-success";
        }
    }

    // Load growth history + vaccination summary
    if (baby.patientId) loadGrowthHistory(baby.patientId);
}

// VACCINE ROW — add / collect
function addVaccineRow() {
    const container = document.getElementById("vaccineRowsContainer");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "vaccine-row";
    row.innerHTML = `
        <select class="vax-name-select">
            <option value="">Select Vaccine</option>
            <option>BCG</option>
            <option>Pentavalent 1</option>
            <option>Pentavalent 2</option>
            <option>Pentavalent 3</option>
            <option>Polio (OPV) 1</option>
            <option>Polio (OPV) 2</option>
            <option>Polio (OPV) 3</option>
            <option>MMR</option>
            <option>Hepatitis B</option>
        </select>
        <select class="vax-status-select">
            <option value="Given">Given</option>
            <option value="Pending">Pending</option>
            <option value="Skipped">Skipped</option>
        </select>
        <button type="button" class="btn-remove-vax">x</button>
    `;
    container.appendChild(row);
}

function getVaccineData() {
    const rows = document.querySelectorAll(".vaccine-row");
    const names = [];
    const statuses = [];
    rows.forEach(row => {
        const name = row.querySelector(".vax-name-select").value;
        const status = row.querySelector(".vax-status-select").value;
        if (name) {
            names.push(name);
            statuses.push(status || "Given");
        }
    });
    return { names, statuses };
}

// Calculate age
function calculateAge(birthDateStr) {
    const dob = new Date(birthDateStr);
    const today = new Date();
    let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
    if (months < 0) months = 0;
    const ageText = months === 0 ? Math.floor((today - dob) / (1000 * 60 * 60 * 24)) + " days" : months + " months";
    setText("babyAge", ageText);
}

// Save growth record
async function saveGrowthRecord() {
    const date = document.getElementById("recordDate").value;
    const weight = document.getElementById("recordWeight").value;
    const height = document.getElementById("recordHeight").value;
    const head = document.getElementById("recordHead").value;
    const notes = document.getElementById("recordNotes").value;

    // Collect all vaccine rows
    const vaccineData = getVaccineData();

    if (!date || !weight || !height) {
        showToast("Please fill date, weight, and height.");
        return;
    }
    if (!currentBaby) {
        showToast("Please select a baby first.");
        return;
    }

    let ageAtVisit = "-";
    if (currentBaby.birthDate) {
        const dob = new Date(currentBaby.birthDate);
        const visitDate = new Date(date);
        let m = (visitDate.getFullYear() - dob.getFullYear()) * 12 + (visitDate.getMonth() - dob.getMonth());
        if (m < 0) m = 0;
        ageAtVisit = m + " months";
    }

    // Store multiple vaccines as comma-separated
    const record = {
        patientId: currentBaby.patientId,
        babyMongoId: currentBaby.id || currentBaby._id || "",
        babyName: currentBaby.babyName,
        visitDate: date,
        ageAtVisit: ageAtVisit,
        weight: parseFloat(weight),
        height: parseFloat(height),
        headCircumference: parseFloat(head) || 0,
        doctorNotes: notes,
        vaccineName: vaccineData.names.join(", "),
        vaccineStatus: vaccineData.statuses.join(", ")
    };

    try {
        const res = await fetch(GROWTH_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record)
        });

        if (!res.ok) throw new Error("Save failed: " + res.status);
        await res.json();

        // Reload full history (includes chart update)
        loadGrowthHistory(currentBaby.patientId);

        // Clear form
        document.getElementById("recordDate").value = "";
        document.getElementById("recordWeight").value = "";
        document.getElementById("recordHeight").value = "";
        document.getElementById("recordHead").value = "";
        document.getElementById("recordNotes").value = "";
        document.getElementById("vaccineRowsContainer").innerHTML = "";

    } catch (err) {
        console.error(err);
        showToast("Could not save record: " + err.message);
    }
}

// Delete growth record
async function deleteGrowthRecord(id) {
    const confirmed = await showConfirm({
        title: "Delete growth record?",
        message: "This growth visit entry will be permanently removed.",
        confirmText: "Delete",
        variant: "danger"
    });
    if (!confirmed) return;
    try {
        await fetch(`${GROWTH_API}/${id}`, { method: "DELETE" });
        if (currentBaby && currentBaby.patientId) loadGrowthHistory(currentBaby.patientId);
    } catch (err) {
        console.error("Delete error:", err);
    }
}

// Load growth history
async function loadGrowthHistory(patientId) {
    try {
        const res = await fetch(`${GROWTH_API}/patient/${patientId}`);
        if (!res.ok) throw new Error("Could not load history");
        const records = await res.json();

        // Render table
        const tbody = document.getElementById("growthTableBody");
        tbody.innerHTML = "";

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No growth records yet. Add a visit above.</td></tr>';
        } else {
            records.forEach(r => {
                const row = document.createElement("tr");
                const dateStr = r.visitDate ? new Date(r.visitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-";
                const vaccineInfo = r.vaccineName ? `${r.vaccineName} (${r.vaccineStatus || "N/A"})` : "-";
                row.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${r.ageAtVisit || "-"}</td>
                    <td>${r.weight} kg</td>
                    <td>${r.height} cm</td>
                    <td>${r.headCircumference} cm</td>
                    <td>${vaccineInfo}</td>
                    <td>${r.doctorNotes || "-"}</td>
                    <td><button class="btn-delete" data-id="${r.id}">Delete</button></td>
                `;
                tbody.appendChild(row);
            });
        }

        // Update chart with real data
        updateChart(records);

        // Update vaccination summary
        updateVaccinationSummary(records);

        // Update widgets with latest visit data
        if (records.length > 0) {
            refreshWidgetsWithLatest(records);
        }

    } catch (err) {
        console.warn("Growth history load error:", err);
    }
}

// REFRESH WIDGETS — uses latest growth record
function refreshWidgetsWithLatest(records) {
    // Get the latest record (last in sorted array)
    const latest = records[records.length - 1];

    // Update indicator cards with current (latest) values
    setText("weightValue", latest.weight ? latest.weight + " kg" : "-");
    setText("heightValue", latest.height ? latest.height + " cm" : "-");
    setText("headValue", latest.headCircumference ? latest.headCircumference + " cm" : "-");

    // BMI from latest
    if (latest.weight && latest.height && latest.height > 30) {
        const hm = latest.height / 100;
        setText("bmiValue", (latest.weight / (hm * hm)).toFixed(1));
    }

    // WHO comparison — use latest weight
    const whoStandards = { 0:3.3, 1:4.5, 2:5.6, 3:6.4, 4:7.0, 5:7.5, 6:7.9, 7:8.3, 8:8.6, 9:8.9, 10:9.2, 11:9.4, 12:9.6 };
    let ageMonths = 0;
    if (currentBaby && currentBaby.birthDate) {
        const dob = new Date(currentBaby.birthDate);
        ageMonths = Math.max(0, (new Date().getFullYear() - dob.getFullYear()) * 12 + (new Date().getMonth() - dob.getMonth()));
    }
    const whoKey = Math.min(ageMonths, 12);
    const whoStd = whoStandards[whoKey] || 3.3;
    setText("whoStandardWeight", whoStd + " kg");
    setText("whoWeightDisplay", latest.weight ? latest.weight + " kg" : "-");

    const whoEl = document.getElementById("whoStatus");
    if (whoEl && latest.weight) {
        const diff = latest.weight - whoStd;
        if (diff < -1.5) { whoEl.innerText = "Underweight for age"; whoEl.style.color = "#dc2626"; }
        else if (diff > 1.5) { whoEl.innerText = "Overweight for age"; whoEl.style.color = "#d97706"; }
        else { whoEl.innerText = "Normal weight for age"; whoEl.style.color = "#16a34a"; }
    }

    // Risk analysis — based on latest weight
    const riskEl = document.getElementById("riskStatus");
    const riskRec = document.getElementById("riskRecommendation");
    if (riskEl && latest.weight) {
        if (latest.weight < 2.5) {
            riskEl.innerText = "Low weight detected";
            riskEl.className = "risk-box warning";
            if (riskRec) riskRec.innerText = "Close monitoring recommended. Consult pediatrician.";
        } else if (latest.weight > 10) {
            riskEl.innerText = "High weight for age — review diet";
            riskEl.className = "risk-box warning";
            if (riskRec) riskRec.innerText = "Review feeding patterns. Consult pediatrician.";
        } else {
            riskEl.innerText = "Normal growth — no risk detected";
            riskEl.className = "risk-box normal";
            if (riskRec) riskRec.innerText = "Continue monthly growth tracking.";
        }
    }

    // Risk badge
    const riskBadge = document.getElementById("riskBadge");
    if (riskBadge && latest.weight) {
        if (latest.weight < 2.5 || latest.weight > 10) {
            riskBadge.innerText = "At Risk";
            riskBadge.className = "badge badge-danger";
        } else {
            riskBadge.innerText = "Healthy";
            riskBadge.className = "badge badge-success";
        }
    }

    // Doctor notes — show latest
    if (latest.doctorNotes) {
        setText("doctorNotesDisplay", latest.doctorNotes);
    }
}

// UPDATE CHART — uses REAL growth records
function updateChart(records) {
    const ctx = document.getElementById("growthChart");
    if (!ctx) return;

    if (growthChart) growthChart.destroy();

    // Include birth data as the first point
    let labels = [];
    let weights = [];
    let heights = [];
    let heads = [];

    if (currentBaby) {
        labels.push("Birth");
        weights.push(currentBaby.weight || 0);
        heights.push(currentBaby.height || 0);
        heads.push(currentBaby.headCircumference || 0);
    }

    records.forEach(r => {
        labels.push(r.ageAtVisit || r.visitDate);
        weights.push(r.weight || 0);
        heights.push(r.height || 0);
        heads.push(r.headCircumference || 0);
    });

    if (labels.length === 0) return;

    growthChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Weight (kg)",
                    data: weights,
                    borderColor: "#2c7da0",
                    backgroundColor: "rgba(44,125,160,0.08)",
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "#2c7da0",
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: "Height (cm)",
                    data: heights,
                    borderColor: "#16a34a",
                    backgroundColor: "rgba(22,163,74,0.05)",
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "#16a34a",
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: "Head Circ. (cm)",
                    data: heads,
                    borderColor: "#d97706",
                    backgroundColor: "rgba(217,119,6,0.05)",
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: "#d97706",
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: { usePointStyle: true, padding: 20, font: { family: "'Poppins', sans-serif", size: 12 } }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: "rgba(0,0,0,0.04)" },
                    ticks: { font: { family: "'Poppins', sans-serif", size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Poppins', sans-serif", size: 11 } }
                }
            }
        }
    });
}

// VACCINATION SUMMARY — built from growth records
function updateVaccinationSummary(records) {
    const container = document.getElementById("vaccinationSummary");
    if (!container) return;

    // Collect vaccines — each record can have multiple (comma-separated)
    const vaccines = [];
    records.forEach(r => {
        if (!r.vaccineName || r.vaccineName === "") return;
        const names = r.vaccineName.split(",").map(s => s.trim());
        const statuses = (r.vaccineStatus || "").split(",").map(s => s.trim());
        names.forEach((name, i) => {
            if (name) vaccines.push({ name, status: statuses[i] || "Given" });
        });
    });

    // Also include BCG from baby record if not already present
    if (currentBaby && currentBaby.bcgVaccine) {
        const hasBCG = vaccines.some(v => v.name === "BCG");
        if (!hasBCG) {
            vaccines.unshift({ name: "BCG", status: currentBaby.bcgVaccine === "Yes" ? "Given" : "Pending" });
        }
    }

    if (vaccines.length === 0) {
        container.innerHTML = '<p class="text-muted">No vaccination records yet</p>';
        return;
    }

    container.innerHTML = vaccines.map(v => {
        const badgeClass = v.status === "Given" ? "given" : v.status === "Skipped" ? "skipped" : "pending";
        return `<div class="vax-item"><span class="vax-name">${v.name}</span><span class="vax-badge ${badgeClass}">${v.status}</span></div>`;
    }).join("");
}

// Helper
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

// LOAD OVERVIEW CARDS (dashboard stats)
function loadOverviewCards() {
    Promise.all([
        fetch(BABIES_API).then(r => r.json()),
        fetch(GROWTH_API).then(r => r.json())
    ])
    .then(([babies, records]) => {
        // Total babies
        const el1 = document.getElementById("overviewBabyCount");
        if (el1) el1.innerText = babies.length;

        // Growth alerts (babies with risk)
        let alertCount = 0;
        babies.forEach(b => {
            if (b.riskAlert && b.riskAlert !== "") alertCount++;
            else if (b.weight && (b.weight < 2.5 || b.weight > 4.5)) alertCount++;
        });
        const el2 = document.getElementById("overviewAlertCount");
        if (el2) el2.innerText = alertCount;

        // Visits this month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const monthVisits = records.filter(r => {
            try {
                const d = new Date(r.visitDate);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            } catch(e) { return false; }
        }).length;
        const el3 = document.getElementById("overviewVisitCount");
        if (el3) el3.innerText = monthVisits;

        // Vaccinations given
        const vaxGiven = records.filter(r => r.vaccineName && r.vaccineStatus === "Given").length;
        const el4 = document.getElementById("overviewVaxCount");
        if (el4) el4.innerText = vaxGiven;
    })
    .catch(err => console.error("Overview load error:", err));
}
