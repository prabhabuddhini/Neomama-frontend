// API URLs  —  port 5001
const BABIES_API   = "http://localhost:5001/api/babies";
const PATIENTS_API = "http://localhost:5001/api/patients";

let allPatients = [];
let selectedMotherMongoId = "";

document.addEventListener("DOMContentLoaded", async function () {

    // 1. LOAD ALL PATIENTS (for mother name autocomplete)
    try {
        const res = await fetch(PATIENTS_API);
        if (res.ok) allPatients = await res.json();
    } catch (err) {
        console.warn("Patients API not reachable:", err);
    }

    // 2. load next patient id
    await loadNextPatientId();

    // 3. mother name autocomplete
    const motherInput      = document.getElementById("motherName");
    const autocompleteList = document.getElementById("autocompleteList");

    motherInput.addEventListener("input", function () {
        const query = this.value.trim().toLowerCase();
        autocompleteList.innerHTML = "";

        if (query.length < 1) {
            autocompleteList.style.display = "none";
            return;
        }

        const matches = allPatients.filter(p =>
            p.name && p.name.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            autocompleteList.style.display = "none";
            return;
        }

        matches.forEach(patient => {
            const li = document.createElement("li");
            li.innerHTML = `${patient.name} <span>Phone: ${patient.phone || "N/A"}</span>`;

            li.addEventListener("click", function () {
                motherInput.value = patient.name;
                autocompleteList.style.display = "none";
                
                // Store the mother's MongoDB ObjectId for linking
                selectedMotherMongoId = patient.id || patient._id || "";
                
                // Show the mother's ID in the Patient ID field
                document.getElementById("patientId").value = selectedMotherMongoId;

                if (patient.bloodGroup) {
                    const bgSelect = document.getElementById("bloodGroup");
                    for (let opt of bgSelect.options) {
                        if (opt.value === patient.bloodGroup) {
                            bgSelect.value = patient.bloodGroup;
                            break;
                        }
                    }
                }
            });

            autocompleteList.appendChild(li);
        });

        autocompleteList.style.display = "block";
    });

    document.addEventListener("click", function (e) {
        if (!motherInput.contains(e.target)) {
            autocompleteList.style.display = "none";
        }
    });

    // 4. baby age auto calculate
    const birthDateInput = document.getElementById("birthDate");
    const babyAgeInput   = document.getElementById("babyAge");

    birthDateInput.addEventListener("change", function () {
        const birthDate = new Date(this.value);
        const today     = new Date();

        if (isNaN(birthDate.getTime())) return;

        let totalMonths =
            (today.getFullYear() - birthDate.getFullYear()) * 12 +
            (today.getMonth() - birthDate.getMonth());

        if (totalMonths < 0) totalMonths = 0;

        if (totalMonths === 0) {
            const diffDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
            babyAgeInput.value = diffDays + " days";
        } else {
            babyAgeInput.value = totalMonths + " months";
        }
    });

    // 5. form submit
    const form = document.getElementById("babyForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const motherName   = document.getElementById("motherName").value.trim();
        const patientId    = document.getElementById("patientId").value.trim();
        const babyName     = document.getElementById("babyName").value.trim();
        const gender       = document.getElementById("gender").value;
        const birthDate    = document.getElementById("birthDate").value;
        const babyAge      = document.getElementById("babyAge").value;
        const weight       = document.getElementById("weight").value;
        const height       = document.getElementById("height").value;
        const headCirc     = document.getElementById("headCircumference").value;
        const bloodGroup   = document.getElementById("bloodGroup").value;
        const deliveryType = document.getElementById("deliveryType").value;
        const birthStatus  = document.getElementById("birthStatus").value;
        const apgar1       = document.getElementById("apgar1").value;
        const apgar5       = document.getElementById("apgar5").value;
        const bcgVaccine   = document.getElementById("bcgVaccine").value;
        const clinic       = document.getElementById("clinic").value.trim();
        const doctorNotes  = document.getElementById("doctorNotes").value.trim();

        if (!motherName || !babyName || !gender || !birthDate) {
            showToast("⚠ Please fill: Mother Name, Baby Name, Gender, Birth Date");
            return;
        }

        let riskMessage   = "";
        const weightValue = parseFloat(weight);
        const heightValue = parseFloat(height);

        if (weightValue && weightValue < 2.5) {
            riskMessage = "⚠ Low birth weight detected";
        } else if (weightValue && weightValue > 4.5) {
            riskMessage = "⚠ High birth weight detected";
        }

        const babyRecord = {
            patientId:         patientId,
            motherMongoId:     selectedMotherMongoId,
            motherName:        motherName,
            babyName:          babyName,
            gender:            gender,
            birthDate:         birthDate,
            babyAge:           babyAge,
            weight:            weightValue || 0,
            height:            heightValue || 0,
            headCircumference: parseFloat(headCirc) || 0,
            bloodGroup:        bloodGroup,
            deliveryType:      deliveryType,
            birthStatus:       birthStatus,
            apgar1:            parseInt(apgar1) || 0,
            apgar5:            parseInt(apgar5) || 0,
            bcgVaccine:        bcgVaccine,
            clinic:            clinic,
            doctorNotes:       doctorNotes,
            riskAlert:         riskMessage
        };

        try {
            const res = await fetch(BABIES_API, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(babyRecord)
            });

            if (!res.ok) {
                const errText = await res.text();
                showToast("❌ Save failed: " + res.status + "\n" + errText);
                return;
            }

            const savedBaby = await res.json();

            // Also save to localStorage (backup)
            let records = JSON.parse(localStorage.getItem("babyRecords")) || [];
            records.push(savedBaby);
            localStorage.setItem("babyRecords", JSON.stringify(records));

            // SUCCESS — go to baby-growth page to see the saved data
            showToast("✅ Baby record saved! Taking you to Growth Monitoring...");
            window.location.href = "baby-growth.html";

        } catch (err) {
            showToast("❌ Cannot connect to backend.\nMake sure backend is running on port 5001.");
        }
    });

    // 6. cancel
    document.querySelector(".cancel-btn").addEventListener("click", async function () {
        const confirmed = await showConfirm({
            title: "Cancel baby record?",
            message: "Any unsaved baby record details will be lost.",
            confirmText: "Cancel record",
            variant: "warning"
        });
        if (confirmed) {
            window.location.href = "dashboard.html";
        }
    });

    // 7. logout
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.clear();
            window.location.href = "../pages/login.html";
        });
    }

});

// NEXT PATIENT ID from babies count
async function loadNextPatientId() {
    try {
        const res = await fetch(BABIES_API);
        if (!res.ok) throw new Error();
        const babies = await res.json();
        document.getElementById("patientId").value = "NM-" + (1001 + babies.length);
    } catch {
        document.getElementById("patientId").value = "NM-1001";
    }
}
