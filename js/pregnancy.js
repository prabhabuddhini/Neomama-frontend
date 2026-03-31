let visits = [];
let selectedPatientId = "";
let selectedPatientWeeks = 0;

document.addEventListener("DOMContentLoaded", function () {

    loadPatientsDropdown();
    loadOverviewCards();

    // Auto-select if patient ID is in URL (from dashboard link)
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get("id");

    if (patientId) {
        setTimeout(() => {
            const searchInput = document.getElementById("patientSearchInput");
            if (searchInput) searchInput.value = "Selected from Dashboard...";
            selectPatient(patientId);
        }, 300);
    }

    const tableBody = document.getElementById("visitTableBody");
    const addVisitBtn = document.getElementById("addVisitBtn");
    const saveVisitBtn = document.getElementById("saveVisitBtn");
    const fullHistoryBtn = document.getElementById("fullHistoryBtn");

        // Full history button (toggle)
        fullHistoryBtn.addEventListener("click", function () {
        const section = document.getElementById("historySection");

        if (section.style.display === "none" || section.style.display === "") {
            section.style.display = "block";
            section.scrollIntoView({ behavior: "smooth" });
            fullHistoryBtn.innerText = "Hide History";
        } else {
            section.style.display = "none";
            fullHistoryBtn.innerText = "📄 View History";
        }
    });

        // Scroll to visit form
        addVisitBtn.addEventListener("click", function () {
        document.getElementById("visitForm").scrollIntoView({ behavior: "smooth" });
    });

        // Save visit
        saveVisitBtn.addEventListener("click", function () {

        let patientId = selectedPatientId;

        if (!patientId || patientId === "") {
            showToast("Please select a patient first.");
            return;
        }

        let date = document.getElementById("visitDate").value;
        let weight = document.getElementById("visitWeight").value;
        let bp = document.getElementById("visitBP").value;
        let sugar = document.getElementById("visitSugar").value;
        let hemoglobin = document.getElementById("visitHb").value;
        let notes = document.getElementById("visitNotes").value;
        let next = document.getElementById("visitNext").value;

        let inputWeeks = document.getElementById("visitWeeks").value;
        let weeks = inputWeeks ? parseInt(inputWeeks) : (selectedPatientWeeks || 0);

        if (date === "" || weight === "" || bp === "") {
            showToast("Please fill required fields (Date, Weight, BP).");
            return;
        }

        if (!inputWeeks || inputWeeks === "") {
            showToast("Please enter the gestational week count.");
            return;
        }

                // Risk detection
                let risk = "Normal";
        let systolic = parseInt(bp.split("/")[0]);

        if (systolic >= 140) {
            risk = "High Risk";
        } else if (systolic >= 130) {
            risk = "Medium Risk";
        }

                // Send to backend
                fetch("http://localhost:5001/api/pregnancies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patientId: selectedPatientId,
                date: new Date(date).toISOString(),
                weight: parseFloat(weight),
                bP: bp,
                sugar: sugar,
                hemoglobin: hemoglobin,
                notes: notes,
                next: next,
                risk: risk,
                weeks: weeks
            })
        })
        .then(res => res.json())
        .then(updatedPatient => {
            // The backend returns the synced Patient object — use it immediately
            if (updatedPatient && updatedPatient.id) {
                refreshPatientUI(updatedPatient);
            }
            // Reload the visit history table
            loadPatientVisits(patientId);
        })
        .catch(err => console.error("Error saving visit:", err));

        // Clear form
        clearForm();
    });

        // Delete visit
        document.addEventListener("click", function (e) {
        if (e.target.classList.contains("delete-btn")) {
            let id = e.target.getAttribute("data-id");

            fetch(`http://localhost:5001/api/pregnancies/${id}`, {
                method: "DELETE"
            })
            .then(res => res.json())
            .then(updatedPatient => {
                if (updatedPatient && updatedPatient.id) {
                    refreshPatientUI(updatedPatient);
                }
                if (selectedPatientId) {
                    loadPatientVisits(selectedPatientId);
                }
            })
            .catch(err => console.error(err));
        }
    });

        // Clear form
        function clearForm() {
        document.getElementById("visitDate").value = "";
        document.getElementById("visitWeeks").value = "";
        document.getElementById("visitWeight").value = "";
        document.getElementById("visitBP").value = "";
        document.getElementById("visitSugar").value = "Normal";
        document.getElementById("visitHb").value = "";
        document.getElementById("visitNotes").value = "";
        document.getElementById("visitNext").value = "";
    }

});

// REFRESH PATIENT UI — called with the backend-synced Patient
function refreshPatientUI(p) {
    // Name & demographics
    const nameEl = document.getElementById("motherName");
    if (nameEl) nameEl.innerText = p.name || "No Name";
    
    const ageEl = document.getElementById("motherAge");
    if (ageEl) ageEl.innerText = p.age || "-";
    
    const bloodEl = document.getElementById("motherBlood");
    if (bloodEl) bloodEl.innerText = p.bloodGroup || "-";
    
    const doctorEl = document.getElementById("motherDoctor");
    if (doctorEl) doctorEl.innerText = p.doctorName || "-";

    // Weeks
    let weeks = p.weeks || 0;
    selectedPatientWeeks = weeks;
    
    const weeksEl = document.getElementById("motherWeeks");
    if (weeksEl) weeksEl.innerText = weeks + " weeks";

    // Progress bar
    let progress = Math.min((weeks / 40) * 100, 100);
    const bar = document.getElementById("pregnancyProgress");
    if (bar) {
        bar.style.width = progress + "%";
        bar.innerText = Math.round(progress) + "%";
    }

    let trimester = "";
    if (weeks <= 13) trimester = "First Trimester";
    else if (weeks <= 27) trimester = "Second Trimester";
    else trimester = "Third Trimester";

    const weekText = document.querySelector(".pregnancy-week-text");
    if (weekText) {
        weekText.innerText = `Pregnancy Week: ${weeks} of 40 – ${trimester}`;
    }

    // EDD
    let today = new Date();
    let edd = new Date(today.getTime() + (40 - weeks) * 7 * 24 * 60 * 60 * 1000);
    const eddEl = document.getElementById("motherEDD");
    if (eddEl) eddEl.innerText = edd.toDateString();

    // Risk badge & status
    let bp = parseInt((p.bloodPressure || "0").split("/")[0]);
    const statusEl = document.getElementById("motherStatus");
    const riskBadge = document.getElementById("riskBadge");

    if (bp >= 140) {
        if (statusEl) { statusEl.innerText = "● High Risk Monitoring"; statusEl.className = "status-badge high"; }
        if (riskBadge) { riskBadge.innerText = "High Risk Pregnancy"; riskBadge.className = "risk-badge high"; }
    } else if (bp >= 120) {
        if (statusEl) { statusEl.innerText = "● Needs Attention"; statusEl.className = "status-badge medium"; }
        if (riskBadge) { riskBadge.innerText = "Medium Risk"; riskBadge.className = "risk-badge medium"; }
    } else {
        if (statusEl) { statusEl.innerText = "● Under Monitoring"; statusEl.className = "status-badge normal"; }
        if (riskBadge) { riskBadge.innerText = "Normal Pregnancy"; riskBadge.className = "risk-badge normal"; }
    }

    // History section title
    const histTitle = document.getElementById("historyTitle");
    if (histTitle) histTitle.innerText = (p.name || "Patient") + " – Visit History";

    // Check if mother has delivered
    if (p.status === "Delivered") {
        showDeliveredBanner(p.name);
    } else {
        hideDeliveredBanner();
    }
}

// Delivered banner
function showDeliveredBanner(motherName) {
    // Set progress to 100%
    const bar = document.getElementById("pregnancyProgress");
    if (bar) {
        bar.style.width = "100%";
        bar.innerText = "100%";
        bar.style.background = "linear-gradient(90deg, #22c55e, #16a34a)";
    }

    const weekText = document.querySelector(".pregnancy-week-text");
    if (weekText) weekText.innerText = "Pregnancy Complete – Baby Delivered";

    const weeksEl = document.getElementById("motherWeeks");
    if (weeksEl) weeksEl.innerText = "40 weeks";

    // Hide visit form since pregnancy is done
    const visitForm = document.getElementById("visitForm");
    if (visitForm) visitForm.style.display = "none";

    // Show or create the delivered banner
    let banner = document.getElementById("deliveredBanner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "deliveredBanner";
        const trackingContent = document.getElementById("trackingContent");
        if (trackingContent) {
            trackingContent.insertBefore(banner, trackingContent.children[1]);
        }
    }
    banner.style.display = "block";
    banner.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 20px 30px;
            border-radius: 16px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
            animation: slideIn 0.5s ease;
        ">
            <span style="font-size: 32px; background: rgba(255,255,255,0.2); width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700;">D</span>
            <div>
                <h4 style="margin: 0; font-weight: 700; font-size: 18px;">Baby Delivered Successfully!</h4>
                <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">
                    ${motherName || "This mother"} has completed her pregnancy and delivered. 
                    Congratulations! Check the Baby Growth page for newborn tracking.
                </p>
            </div>
        </div>
    `;

    // Update status badge
    const statusEl = document.getElementById("motherStatus");
    if (statusEl) {
        statusEl.innerText = "● Delivered";
        statusEl.className = "status-badge";
        statusEl.style.background = "#dcfce7";
        statusEl.style.color = "#16a34a";
    }

    const riskBadge = document.getElementById("riskBadge");
    if (riskBadge) {
        riskBadge.innerText = "Delivered ✓";
        riskBadge.className = "risk-badge";
        riskBadge.style.background = "#22c55e";
        riskBadge.style.color = "white";
    }
}

function hideDeliveredBanner() {
    const banner = document.getElementById("deliveredBanner");
    if (banner) banner.style.display = "none";

    const visitForm = document.getElementById("visitForm");
    if (visitForm) visitForm.style.display = "block";

    // Reset progress bar color
    const bar = document.getElementById("pregnancyProgress");
    if (bar) bar.style.background = "";
}

// LOAD PATIENT DETAILS (initial load from Patient API)
function loadPatientDetails(id) {
    fetch("http://localhost:5001/api/Patients")
        .then(res => res.json())
        .then(data => {
            const p = data.find(x => x.id == id || x._id == id);
            if (!p) {
                showToast("❌ Patient not found");
                return;
            }
            refreshPatientUI(p);
        })
        .catch(err => {
            console.error("Error loading patient details:", err);
            showToast("⚠ Could not load patient details. Please check the backend connection.");
        });
}

// Fetch all pregnancies (fallback)
function fetchPregnancies() {
    fetch("http://localhost:5001/api/pregnancies")
        .then(res => res.json())
        .then(data => {
            visits = data;
            renderVisits();
        })
        .catch(err => console.error(err));
}

// Render visits table
function renderVisits() {
    const tableBody = document.getElementById("visitTableBody");
    tableBody.innerHTML = "";

    visits.forEach((v) => {
        let row = document.createElement("tr");

        let dateStr = "-";
        try { dateStr = new Date(v.date).toISOString().split("T")[0]; } catch(e) { dateStr = v.date; }

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${v.weight} kg</td>
            <td>${v.bp || "-"}</td>
            <td>${v.sugar || "-"}</td>
            <td>${v.hemoglobin || "-"}</td>
            <td><span class="badge bg-info">${v.risk || "Normal"}</span></td>
            <td>${v.next || "-"}</td>
            <td>${v.notes || "-"}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${v.id}">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// LOAD PATIENT VISITS (filtered by patient ID)
function loadPatientVisits(patientId) {
    fetch("http://localhost:5001/api/pregnancies")
        .then(res => res.json())
        .then(data => {
            let patientVisits = data.filter(v => {
                const vid = String(v.patientId || v.PatientId || "").trim();
                const pid = String(patientId).trim();
                return vid === pid;
            });

            visits = patientVisits;
            renderVisits();
            updateDashboard(patientVisits);
        })
        .catch(err => {
            console.error("Error loading visits:", err);
        });
}

// UPDATE DASHBOARD (health indicators + progress bar + insights)
function updateDashboard(visits) {
    const insightsBox = document.getElementById("clinicalInsightsBox");

    if (visits.length === 0) {
        if (insightsBox) insightsBox.innerHTML = `<p class="text-muted">No visits recorded yet. Add a visit to see clinical insights.</p>`;
        
        // Reset indicators
        document.getElementById("latestWeight").innerText = "-";
        document.getElementById("latestBP").innerText = "-";
        document.getElementById("latestSugar").innerText = "-";
        document.getElementById("hbBox").innerText = "-";
        return;
    }

    // Sort by weeks descending to get the most recent visit
    let sorted = [...visits].sort((a, b) => (b.weeks || 0) - (a.weeks || 0));
    let latest = sorted[0];

    let latestWeeks = latest.weeks || 0;

    // Update health indicator cards
    document.getElementById("latestWeight").innerText = latest.weight ? latest.weight + " kg" : "-";
    document.getElementById("latestBP").innerText = latest.bp || latest.bP || "-";
    document.getElementById("latestSugar").innerText = latest.sugar || "-";
    document.getElementById("hbBox").innerText = latest.hemoglobin || "-";

    // Update progress bar from the latest visit's weeks
    let progress = Math.min((latestWeeks / 40) * 100, 100);
    const bar = document.getElementById("pregnancyProgress");
    if (bar) {
        bar.style.width = progress + "%";
        bar.innerText = Math.round(progress) + "%";
    }

    let trimester = "";
    if (latestWeeks <= 13) trimester = "First Trimester";
    else if (latestWeeks <= 27) trimester = "Second Trimester";
    else trimester = "Third Trimester";

    const weekText = document.querySelector(".pregnancy-week-text");
    if (weekText) {
        weekText.innerText = `Pregnancy Week: ${latestWeeks} of 40 – ${trimester}`;
    }

    // Update header weeks display
    const motherWeeksEl = document.getElementById("motherWeeks");
    if (motherWeeksEl) motherWeeksEl.innerText = latestWeeks + " weeks";

    // Risk badge sync
    const riskBadge = document.getElementById("riskBadge");
    let isHighRisk = false;

    if (riskBadge) {
        if (latest.risk === "High Risk") {
            riskBadge.innerText = "High Risk Pregnancy";
            riskBadge.className = "risk-badge high";
            isHighRisk = true;
        } else if (latest.risk === "Medium Risk") {
            riskBadge.innerText = "Medium Risk";
            riskBadge.className = "risk-badge medium";
        } else {
            riskBadge.innerText = "Normal Pregnancy";
            riskBadge.className = "risk-badge normal";
        }
    }

    // Dynamic clinical insights
    if (insightsBox) {
        let insightsHTML = "<ul>";

        let systolic = parseInt((latest.bp || latest.bP || "0").split("/")[0]);
        if (systolic >= 140) {
            insightsHTML += "<li><strong>Elevated BP Detected:</strong> Monitor closely for signs of preeclampsia. Ensure low sodium intake.</li>";
            const bpBox = document.getElementById("latestBPBox");
            if (bpBox) bpBox.classList.add("alert");
        } else {
            insightsHTML += "<li><strong>Blood Pressure:</strong> Stable and within expected limits.</li>";
            const bpBox = document.getElementById("latestBPBox");
            if (bpBox) bpBox.classList.remove("alert");
        }

        if (latest.weight) {
            insightsHTML += `<li><strong>Weight Tracking:</strong> Latest weight is ${latest.weight}kg. Continue regular tracking.</li>`;
        }

        let sugarVal = latest.sugar || "-";
        if (sugarVal !== "-" && sugarVal.toLowerCase() !== "normal") {
            insightsHTML += `<li><strong>Sugar Levels:</strong> Marked as '${sugarVal}'. Consider dietary adjustments or further screening if persistent.</li>`;
        } else {
            insightsHTML += "<li><strong>Sugar Levels:</strong> Normal range observed.</li>";
        }

        insightsHTML += "</ul>";
        insightsBox.innerHTML = insightsHTML;

        if (isHighRisk) {
            insightsBox.className = "insights-box alert";
        } else {
            insightsBox.className = "insights-box";
        }
    }
}

// Load patients dropdown (searchable)
function loadPatientsDropdown() {
    fetch("http://localhost:5001/api/Patients")
        .then(res => res.json())
        .then(data => {
            const searchInput = document.getElementById("patientSearchInput");
            const dropdownList = document.getElementById("patientDropdownList");

            if (!searchInput || !dropdownList) return;

            function renderList(filterText = "") {
                dropdownList.innerHTML = "";
                const filtered = data.filter(p => {
                    const searchStr = (p.name + " " + (p.id || p._id)).toLowerCase();
                    return searchStr.includes(filterText.toLowerCase());
                });

                if (filtered.length === 0) {
                    dropdownList.innerHTML = `<div class="p-3 text-muted text-center">No patients found.</div>`;
                    return;
                }

                filtered.forEach(p => {
                    const id = p.id || p._id;
                    const item = document.createElement("div");
                    item.className = "dropdown-item";
                    item.innerHTML = `<strong>${p.name}</strong> <span class="text-muted" style="font-size:12px">(${id})</span>`;
                    item.onclick = () => {
                        searchInput.value = p.name;
                        dropdownList.style.display = "none";
                        selectPatient(id);
                    };
                    dropdownList.appendChild(item);
                });
            }

            searchInput.addEventListener("focus", () => {
                dropdownList.style.display = "block";
                renderList(searchInput.value);
            });

            searchInput.addEventListener("input", (e) => {
                dropdownList.style.display = "block";
                renderList(e.target.value);
            });

            document.addEventListener("click", (e) => {
                if (!searchInput.contains(e.target) && !dropdownList.contains(e.target)) {
                    dropdownList.style.display = "none";
                }
            });

            renderList();
        })
        .catch(err => console.error("Failed to load patients for dropdown:", err));
}

// Select patient
function selectPatient(id) {
    selectedPatientId = id;

    // Hide the overview cards to focus on the patient details
    const overviewCards = document.getElementById("pregnancyOverviewCards");
    if (overviewCards) overviewCards.style.display = "none";

    document.getElementById("trackingContent").style.display = "block";
    loadPatientDetails(selectedPatientId);
    loadPatientVisits(selectedPatientId);
}

// Load overview cards (dynamic from api)
function loadOverviewCards() {
    // Fetch both patients and pregnancies
    Promise.all([
        fetch("http://localhost:5001/api/Patients").then(r => r.json()),
        fetch("http://localhost:5001/api/pregnancies").then(r => r.json())
    ])
    .then(([patients, pregnancies]) => {
        // Active Monitored: patients that have at least 1 visit
        const patientIdsWithVisits = new Set(pregnancies.map(v => v.patientId || v.PatientId));
        const activeCount = patientIdsWithVisits.size;

        // High Risk Alerts: count unique patients whose latest visit is "High Risk"
        let highRiskCount = 0;
        patientIdsWithVisits.forEach(pid => {
            const pVisits = pregnancies.filter(v => (v.patientId || v.PatientId) === pid);
            const latest = pVisits.sort((a, b) => (b.weeks || 0) - (a.weeks || 0))[0];
            if (latest && latest.risk === "High Risk") highRiskCount++;
        });

        // Visits Today
        const todayStr = new Date().toISOString().split("T")[0];
        const todayVisits = pregnancies.filter(v => {
            try { return new Date(v.date).toISOString().split("T")[0] === todayStr; } catch(e) { return false; }
        }).length;

        // Update cards
        const el1 = document.getElementById("overviewActiveCount");
        const el2 = document.getElementById("overviewHighRiskCount");
        const el3 = document.getElementById("overviewTodayCount");
        if (el1) el1.innerText = activeCount;
        if (el2) el2.innerText = highRiskCount;
        if (el3) el3.innerText = todayVisits;
    })
    .catch(err => console.error("Overview cards load error:", err));
}
