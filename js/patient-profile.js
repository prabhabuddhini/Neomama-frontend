// Load sidebar component
fetch("../components/sidebar/sidebar.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("sidebar").innerHTML = data;
    });

// Show today date
const today = new Date();
const options = { year: "numeric", month: "long", day: "numeric" };
const dateBox = document.getElementById("todayDate");
if (dateBox) dateBox.innerHTML = today.toLocaleDateString("en-US", options);

// Live clock
function updateClock() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    let s = now.getSeconds();
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    const timeBox = document.getElementById("liveTime");
    if (timeBox) timeBox.innerHTML = h + ":" + m + ":" + s;
}
setInterval(updateClock, 1000);

// Greeting message
const hour = new Date().getHours();
let greeting = "";
if (hour < 12) greeting = "🌅 Good Morning Doctor";
else if (hour < 18) greeting = "☀️ Good Afternoon Doctor";
else greeting = "🌙 Good Evening Doctor";
const greetingBox = document.getElementById("greetingText");
if (greetingBox) greetingBox.innerHTML = greeting;

// Page load (main)
document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("id");
    const displayId = params.get("displayId");

    window.currentPatientId = patientId;

    console.log("=== PATIENT PROFILE ===");
    console.log("patientId:", patientId);
    console.log("displayId:", displayId);

    if (patientId) {
        loadPatientProfile(patientId, displayId);
    }

    // Quick action button - pregnancy
    const pregnancyBtn = document.querySelector(".actions button:nth-child(1)");
    if (pregnancyBtn) {
        pregnancyBtn.addEventListener("click", () => {
            window.location.href = "pregnancy.html?id=" + patientId;
        });
    }

        // Edit medical button
        const editBtn = document.getElementById("editMedicalBtn");
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            document.getElementById("medicalForm").style.display = "block";
            document.getElementById("diabetesInput").value =
                document.getElementById("diabetes").innerText;
            document.getElementById("hypertensionInput").value =
                document.getElementById("hypertension").innerText;
            document.getElementById("complicationsInput").value =
                document.getElementById("complications").innerText;
            document.getElementById("allergiesInput").value =
                document.getElementById("allergies").innerText;
        });
    }

        // Edit emergency contact
        const editEmgBtn = document.getElementById("editEmgBtn");
    if (editEmgBtn) {
        editEmgBtn.addEventListener("click", () => {
            document.getElementById("emgForm").style.display = "block";
            document.getElementById("emgNameInput").value =
                document.getElementById("emgName").innerText;
            document.getElementById("emgPhoneInput").value =
                document.getElementById("emgPhone").innerText;
        });
    }

        // Save medical data
        const saveBtn = document.getElementById("saveMedicalBtn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            saveMedicalData();
        });
    }

        // Save emergency contact
        const saveEmgBtn = document.getElementById("saveEmgBtn");
    if (saveEmgBtn) {
        saveEmgBtn.addEventListener("click", () => {
            saveEmergencyData();
        });
    }
});

// Load patient profile
function loadPatientProfile(id, displayId) {

    fetch("http://localhost:5001/api/Patients")
        .then(res => res.json())
        .then(data => {

            const p = data.find(x =>
                String(x.id || x._id || "").trim() === String(id).trim()
            );

            if (!p) {
                console.error("Patient not found:", id);
                console.log("Available IDs:", data.map(x => x.id || x._id));
                return;
            }

            console.log("Patient found:", p.name);
            console.log("Full patient object:", JSON.stringify(p));

                        // Basic info
            // C# camelCase JSON: Name->name, Age->age
                        document.getElementById("profileName").innerText = p.name || "-";
            document.getElementById("profileId").innerText = "Patient ID : " + (displayId || id);
            document.getElementById("profileAge").innerText = "Age : " + (p.age || "-");
            document.getElementById("pId").innerText = displayId || id;
            document.getElementById("pName").innerText = p.name || "-";
            document.getElementById("pAge").innerText = p.age || "-";
            document.getElementById("pPhone").innerText = p.phone || "-";
            document.getElementById("pAddress").innerText = p.address || "-";
            document.getElementById("pBlood").innerText = p.bloodGroup || "-";

                        // Emergency contact
                        document.getElementById("emgName").innerText = p.emergencyName || "-";
            document.getElementById("emgPhone").innerText = p.emergencyPhone || "-";

                        // Weeks + trimester
                        const patientWeeks = parseInt(p.weeks) || 0;
            document.getElementById("weeksBox").innerText = patientWeeks + " Weeks";

            let trimester = "1st Trimester";
            if (patientWeeks > 27) trimester = "3rd Trimester";
            else if (patientWeeks > 13) trimester = "2nd Trimester";
            document.getElementById("trimesterBox").innerText = trimester;

                        // FIXED: Expected Delivery
            // C# ExpectedDelivery -> JSON expectedDelivery (camelCase)
                        const edd = p.expectedDelivery || "-";
            document.getElementById("eddBox").innerText = edd;
            console.log("Expected Delivery:", edd);

                        // Risk status
                        const bpVal = parseInt(p.bloodPressure) || 0;
            const riskBox = document.getElementById("riskStatusBox");
            if (bpVal >= 140) {
                riskBox.innerText = "High Risk";
                riskBox.style.color = "red";
            } else if (bpVal >= 120) {
                riskBox.innerText = "Medium Risk";
                riskBox.style.color = "orange";
            } else {
                riskBox.innerText = "Normal";
                riskBox.style.color = "green";
            }

                        // Health indicators
                        document.getElementById("bpBox").innerText = p.bloodPressure || "-";
            document.getElementById("weightBox").innerText = p.weight || "-";

                        // Medical history
            // C# Diabetes->diabetes, Hypertension->hypertension etc.
                        document.getElementById("diabetes").innerText = p.diabetes || "No";
            document.getElementById("hypertension").innerText = p.hypertension || "No";
            document.getElementById("complications").innerText = p.complications || "No";
            document.getElementById("allergies").innerText = p.allergies || "None";

                        // Profile picture
                        const photoEl = document.getElementById("patientPhoto");
            if (photoEl) {
                if (p.profileImage && p.profileImage.length > 10) {
                    photoEl.src = p.profileImage;
                } else {
                    photoEl.src = "../images/avatar-mother.png";
                }
            }

            // Load Sugar + Hemoglobin from latest pregnancy visit
            loadLatestVisitData(id);
        })
        .catch(err => console.error("Load error:", err));
}

// Full-screen image modal
function openImageModal() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const photoEl = document.getElementById("patientPhoto");
    
    if (modal && modalImg && photoEl) {
        modal.style.display = "flex";
        modalImg.src = photoEl.src;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const closeBtn = document.querySelector(".close-modal");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("imageModal").style.display = "none";
        });
    }
    
    // Close modal when clicking outside the image
    const imageModal = document.getElementById("imageModal");
    if (imageModal) {
        imageModal.addEventListener("click", (e) => {
            if (e.target === imageModal) {
                imageModal.style.display = "none";
            }
        });
    }
});

// Load latest visit - sugar + hb
function loadLatestVisitData(patientId) {

    fetch("http://localhost:5001/api/Pregnancies")
        .then(res => res.json())
        .then(allVisits => {

            const visits = allVisits.filter(v =>
                String(v.patientId || v.PatientId || "").trim() === String(patientId).trim()
            );

            console.log("Visits found:", visits.length);

            if (visits.length === 0) {
                document.getElementById("sugarBox").innerText = "-";
                document.getElementById("hbBox").innerText = "-";
                return;
            }

            const latest = visits[visits.length - 1];
            document.getElementById("sugarBox").innerText = latest.sugar || "-";
            document.getElementById("hbBox").innerText = latest.hemoglobin || "-";
        })
        .catch(err => {
            console.error("Visit error:", err);
            document.getElementById("sugarBox").innerText = "-";
            document.getElementById("hbBox").innerText = "-";
        });
}

// Save medical data
// FIXED: Using PUT (backend has no PATCH endpoint)
function saveMedicalData() {

    const patientId = window.currentPatientId;

    if (!patientId) {
        showToast("Patient ID missing");
        return;
    }

    fetch("http://localhost:5001/api/Patients")
        .then(res => res.json())
        .then(data => {

            const oldData = data.find(x =>
                String(x.id || x._id || "").trim() === String(patientId).trim()
            );

            if (!oldData) {
                showToast("Patient not found");
                return;
            }

            const updatedData = {
                ...oldData,
                diabetes: document.getElementById("diabetesInput").value,
                hypertension: document.getElementById("hypertensionInput").value,
                complications: document.getElementById("complicationsInput").value,
                allergies: document.getElementById("allergiesInput").value
            };

            console.log("Saving medical data:", updatedData);

            // FIXED: PUT instead of PATCH
            return fetch(`http://localhost:5001/api/Patients/${patientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });
        })
        .then(res => {
            if (res && res.ok) {
                showToast("Saved successfully!");
                location.reload();
            } else {
                showToast("Save failed - Status: " + (res ? res.status : "unknown"));
            }
        })
        .catch(err => {
            console.error("Save error:", err);
            showToast("Error saving");
        });
}

// Save emergency contact
function saveEmergencyData() {

    const patientId = window.currentPatientId;

    if (!patientId) {
        showToast("Patient ID missing");
        return;
    }

    fetch("http://localhost:5001/api/Patients")
        .then(res => res.json())
        .then(data => {

            const oldData = data.find(x =>
                String(x.id || x._id || "").trim() === String(patientId).trim()
            );

            if (!oldData) {
                showToast("Patient not found");
                return;
            }

            const updatedData = {
                ...oldData,
                emergencyName: document.getElementById("emgNameInput").value,
                emergencyPhone: document.getElementById("emgPhoneInput").value
            };

            console.log("Saving emergency contact:", updatedData);

            return fetch(`http://localhost:5001/api/Patients/${patientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });
        })
        .then(res => {
            console.log("STATUS:", res.status);

            if (res.ok) {
                showToast("Emergency contact saved!");
                loadPatientProfile(patientId);
            } else {
                showToast("Save failed - Status: " + res.status);
            }
        })
        .catch(err => console.error("Emergency save error:", err));
}