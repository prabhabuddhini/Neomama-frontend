let editId = null;

/* =============================
   AUTO-GENERATE PASSWORD
============================= */
function autoGeneratePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('patPassword').value = password;
}

/* =============================
PATIENT SEARCH & FILTER
============================= */

const searchInput = document.querySelector(".search-bar input");
const searchBtn = document.querySelector(".btn-search");

if (searchBtn) searchBtn.addEventListener("click", filterPatients);
if (searchInput) searchInput.addEventListener("keyup", filterPatients);

function filterPatients() {

  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const riskValue = document.getElementById("riskFilter").value;
  const triValue = document.getElementById("trimesterFilter").value;

  const rows = document.querySelectorAll("#patientTableBody tr");

  rows.forEach(row => {

    const id = row.children[0].innerText.toLowerCase();
    const name = row.children[1].innerText.toLowerCase();
    const weeks = parseInt(row.children[4].innerText) || 0;
    const risk = row.children[8].innerText.toLowerCase();

    let trimester = "1";
    if (weeks <= 12) trimester = "1";
    else if (weeks <= 26) trimester = "2";
    else trimester = "3";

    const matchSearch = name.includes(searchText) || id.includes(searchText);
    const matchRisk =
      riskValue === "all" ||
      (riskValue === "high" && risk.includes("high")) ||
      (riskValue === "medium" && risk.includes("medium")) ||
      (riskValue === "normal" && risk.includes("normal"));
    const matchTrimester = triValue === "all" || triValue === trimester;

    row.style.display = (matchSearch && matchRisk && matchTrimester) ? "" : "none";
  });
}

/* =============================
RISK CALCULATION
============================= */

function getRiskText(bp) {
  if (!bp) return "Normal";
  const value = parseInt(bp);
  if (value >= 140) return "High";
  if (value >= 120) return "Medium";
  return "Normal";
}

function getRiskClass(bp) {
  const risk = getRiskText(bp);
  if (risk === "High") return "high";
  if (risk === "Medium") return "medium";
  return "normal";
}

/* =============================
UPDATE STATS
============================= */

function updatePatientStats(data) {

  document.getElementById("totalMothers").textContent = data.length;

  const highRisk = data.filter(p => parseInt(p.bloodPressure) >= 140);
  document.getElementById("highRisk").textContent = highRisk.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Use lastVisit from patient data directly
  const monthlyVisits = data.filter(p => {
    if (!p.lastVisit) return false;
    const d = new Date(p.lastVisit);
    if (isNaN(d.getTime())) return false;
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  document.getElementById("monthlyVisits").textContent = monthlyVisits.length;

  const expected = data.filter(p => parseInt(p.weeks) >= 36);
  document.getElementById("deliveries").textContent = expected.length;
}

/* =============================
LOAD PATIENTS
============================= */

function loadPatients() {

  fetch("http://localhost:5001/api/Patients")
    .then(res => res.json())
    .then(data => {

      allPatientsData = data;

      const table = document.querySelector("tbody");
      table.innerHTML = "";

      data.forEach((patient, index) => {

        const realId = patient.id || patient._id || patient.Id || "";
        const displayId = "P" + String(index + 1).padStart(3, "0");

        const riskText = getRiskText(patient.bloodPressure);
        const riskClass = getRiskClass(patient.bloodPressure);

        const row = `
<tr>
  <td>${displayId}</td>
  <td>${patient.name || "-"}</td>
  <td>${patient.phone || "-"}</td>
  <td>${patient.age || "-"}</td>
  <td>${patient.weeks || "-"}</td>
  <td>${patient.weight || "-"}</td>
  <td>${patient.bloodGroup || "-"}</td>
  <td>${patient.bloodPressure || "-"}</td>
  <td>
    <span class="badge ${riskClass}">
      ${riskText}
    </span>
  </td>
  <td>${patient.lastVisit || "-"}</td>
  <td>${patient.doctorName || "-"}</td>
  <td>Active</td>
  <td class="actions">
    <button class="view" onclick="openProfileModal('${realId}', '${displayId}')" title="View Profile">👤</button>
    <button class="chart" onclick="viewPatient('${realId}', ${index + 1})" title="Pregnancy Chart">👁</button>
    <button class="edit" data-id="${realId}" title="Edit Patient">✏️</button>
    <button class="delete" data-id="${realId}" title="Delete Patient">🗑</button>
  </td>
</tr>
`;

        table.insertAdjacentHTML("beforeend", row);
      });

      updatePatientStats(data);
      attachRowEvents();
    })
    .catch(err => {
      console.error("Failed to load patients:", err);
      const table = document.querySelector("tbody");
      if (table) table.innerHTML = `<tr><td colspan="13" style="text-align:center;color:#e63946;padding:1rem;">⚠ Unable to reach backend. Please ensure the API is running.</td></tr>`;
    });
}

let allPatientsData = [];

/* =============================
DELETE + EDIT EVENTS
============================= */

function attachRowEvents() {

  document.querySelectorAll(".edit").forEach(btn => {
    btn.onclick = () => {
      editId = btn.dataset.id;
      const patient = allPatientsData.find(p => String(p.id || p._id || "").trim() === String(editId).trim());
      
      if (!patient) {
        showToast("Patient data not found.");
        return;
      }

      document.getElementById("name").value = patient.name || "";
      document.getElementById("phone").value = patient.phone || "";
      document.getElementById("age").value = patient.age || "";
      document.getElementById("weeks").value = patient.weeks || "";
      document.getElementById("weight").value = patient.weight || "";
      document.getElementById("bloodGroup").value = patient.bloodGroup || "";
      document.getElementById("bp").value = patient.bloodPressure || "";
      document.getElementById("date").value = patient.lastVisit || "";
      document.getElementById("doctor").value = patient.doctorName || "";
      document.getElementById("address").value = patient.address || "";
      document.getElementById("pregnancy").value = patient.firstPregnancy || "First Pregnancy?";
      document.getElementById("conditions").value = patient.medicalConditions || "";

      // New Fields
      document.getElementById("emgName").value = patient.emergencyName || "";
      document.getElementById("emgPhone").value = patient.emergencyPhone || "";
      document.getElementById("diabetes").value = patient.diabetes || "No";
      document.getElementById("hypertension").value = patient.hypertension || "No";
      document.getElementById("allergies").value = patient.allergies || "";
      document.getElementById("complications").value = patient.complications || "";

      // Mobile Credentials
      document.getElementById("patUsername").value = patient.username || "";
      document.getElementById("patPassword").value = ""; // Never show existing password

      // Profile image
      const preview = document.getElementById("motherProfilePreview");
      if(preview) {
        if(patient.profileImage && patient.profileImage.length > 10) {
            preview.src = patient.profileImage;
            pendingMotherProfileImage = patient.profileImage;
        } else {
            preview.src = "../images/avatar-mother.png";
            pendingMotherProfileImage = "";
        }
      }

      openForm();
    };
  });

  document.querySelectorAll(".delete").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      if (!id) { showToast("Cannot delete: ID not found"); return; }
      const confirmed = await showConfirm({
        title: "Delete patient?",
        message: "This patient record will be permanently removed.",
        confirmText: "Delete",
        variant: "danger"
      });
      if (confirmed) {
        fetch(`http://localhost:5001/api/Patients/${id}`, { method: "DELETE" })
          .then(() => { showToast("✅ Deleted"); loadPatients(); })
          .catch(err => {
            console.error("Delete failed:", err);
            showToast("⚠ Failed to delete. Please check the backend connection.");
          });
      }
    };
  });
}

/* =============================
MODAL & IMAGE UPLOAD
============================= */

let pendingMotherProfileImage = "";

function openForm() {
  document.getElementById("registerModal").style.display = "flex";
}

function closeForm() {
  document.getElementById("registerModal").style.display = "none";
  // Reset image
  pendingMotherProfileImage = "";
  const preview = document.getElementById("motherProfilePreview");
  if(preview) preview.src = "../images/avatar-mother.png";

  // Clear fields
  document.querySelectorAll("#registerModal input").forEach(input => input.value = "");
  document.querySelectorAll("#registerModal select").forEach(select => select.selectedIndex = 0);
  editId = null;
}

const motherProfileInput = document.getElementById("motherProfileImageInput");
if (motherProfileInput) {
  motherProfileInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("motherProfilePreview").src = e.target.result;
        pendingMotherProfileImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

/* =============================
ADD + EDIT PATIENT
============================= */

function addPatient() {

  const patient = {
    name: document.getElementById("name").value,
    age: parseInt(document.getElementById("age").value) || 0,
    phone: document.getElementById("phone").value,
    gender: "Female",
    address: document.getElementById("address").value,
    weeks: parseInt(document.getElementById("weeks").value) || 0,
    bloodPressure: document.getElementById("bp").value,
    weight: parseFloat(document.getElementById("weight").value) || 0,
    bloodGroup: document.getElementById("bloodGroup").value,
    firstPregnancy: document.getElementById("pregnancy").value,
    medicalConditions: document.getElementById("conditions").value,
    doctorName: document.getElementById("doctor").value,
    lastVisit: document.getElementById("date").value,
    profileImage: pendingMotherProfileImage,
    
    // New Fields
    emergencyName: document.getElementById("emgName").value,
    emergencyPhone: document.getElementById("emgPhone").value,
    diabetes: document.getElementById("diabetes").value,
    hypertension: document.getElementById("hypertension").value,
    allergies: document.getElementById("allergies").value,
    complications: document.getElementById("complications").value,

    // Mobile App Credentials
    username: document.getElementById("patUsername").value,
    password: document.getElementById("patPassword").value
  };

  if (!patient.name || !patient.phone) {
    showToast("Please fill in the required fields (Name and Phone).");
    return;
  }

  // Use getAuthHeaders for protected APIs if the API is protected
  const headers = { 
    "Content-Type": "application/json",
    "Authorization": "Bearer " + (localStorage.getItem("authToken") || "")
  };

  if (editId) {
    // If editing, we shouldn't wipe the image if not changed.
    // A proper fix requires fetching the patient first, but for now we pass the image if changed.
    // In a real scenario we'd do a fetch first or use PATCH.
    fetch(`http://localhost:5001/api/Patients/${editId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(patient)
    })
    .then(() => {
      showToast("✅ Patient updated successfully.");
      editId = null;
      closeForm();
      loadPatients();
    })
    .catch(err => {
      console.error("Update failed:", err);
      showToast("⚠ Failed to update patient. Please check the backend connection.");
    });
  } else {
    fetch("http://localhost:5001/api/Patients", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(patient)
    })
    .then(res => res.json())
    .then(() => {
      showToast("✅ Patient registered successfully.");
      closeForm();
      loadPatients();
    })
    .catch(err => {
      console.error("Registration failed:", err);
      showToast("⚠ Failed to register patient. Please check the backend connection.");
    });
  }
}

function viewPatient(id, index) {
  window.location.href = `pregnancy.html?id=${id}&displayId=P${String(index).padStart(3, "0")}`;
}

/* =============================
PROFILE MODAL
============================= */

function openProfileModal(id, displayId) {
  // Show the modal first so the user sees something is happening
  const modal = document.getElementById("profileModal");
  if (!modal) return;
  modal.style.display = "flex";

  document.getElementById("modalPatientId").innerText = "Patient ID: " + displayId;
  document.getElementById("modalPatientName").innerText = "Loading...";

  // Set the full record button link
  const goToPregnancyBtn = document.getElementById("goToPregnancyBtn");
  if (goToPregnancyBtn) {
    const indexStr = displayId.replace("P", "");
    goToPregnancyBtn.onclick = () => viewPatient(id, parseInt(indexStr) || 1);
  }

  // Fetch full details
  fetch(`http://localhost:5001/api/Patients`)
    .then(res => res.json())
    .then(data => {
      const patient = data.find(x => String(x.id || x._id || "").trim() === String(id).trim());
      if (!patient) {
        document.getElementById("modalPatientName").innerText = "Error: Patient not found";
        return;
      }

      document.getElementById("modalPatientName").innerText = patient.name || "-";
      document.getElementById("modalAge").innerText = patient.age || "-";
      document.getElementById("modalPhone").innerText = patient.phone || "-";
      document.getElementById("modalBlood").innerText = patient.bloodGroup || "-";
      document.getElementById("modalWeeks").innerText = patient.weeks || "-";
      document.getElementById("modalWeight").innerText = patient.weight || "-";
      document.getElementById("modalBP").innerText = patient.bloodPressure || "-";

      // Medical History
      document.getElementById("modalDiabetes").innerText = patient.diabetes || "No";
      document.getElementById("modalHypertension").innerText = patient.hypertension || "No";
      document.getElementById("modalAllergies").innerText = patient.allergies || "None";
      document.getElementById("modalComplications").innerText = patient.complications || "No";

      // Risk Badge
      const bp = parseInt(patient.bloodPressure) || 0;
      const riskBadge = document.getElementById("modalRiskBadge");
      riskBadge.className = "badge"; // reset
      if (bp >= 140) {
        riskBadge.innerText = "High Risk";
        riskBadge.classList.add("high");
      } else if (bp >= 120) {
        riskBadge.innerText = "Medium Risk";
        riskBadge.classList.add("medium");
      } else {
        riskBadge.innerText = "Normal";
        riskBadge.classList.add("normal");
      }

      // Profile Photo
      const photoEl = document.getElementById("modalPatientPhoto");
      if (photoEl) {
        if (patient.profileImage && patient.profileImage.length > 10) {
          photoEl.src = patient.profileImage;
        } else {
          photoEl.src = "../images/avatar-mother.png";
        }
      }

      // Emergency Contact
      const emgName = patient.emergencyName || "";
      const emgPhone = patient.emergencyPhone || "";
      if (emgName || emgPhone) {
          document.getElementById("modalEmergency").innerText = `${emgName} (${emgPhone})`;
      } else {
          document.getElementById("modalEmergency").innerText = "-";
      }

      // Mobile Credentials
      document.getElementById("modalUsername").innerText = patient.username || "Not Set";
      document.getElementById("modalLoginStatus").innerText = (patient.username && patient.username.length > 0) ? "✅ Active" : "❌ Not Created";

      // Password Reset Button
      const resetBtn = document.getElementById("resetPatPasswordBtn");
      if (resetBtn) {
        resetBtn.onclick = () => {
          const newPass = prompt("Enter new password for " + patient.name + " (min 6 characters):");
          if (!newPass || newPass.length < 6) {
            showToast("Password must be at least 6 characters.");
            return;
          }
          const newUser = prompt("Update username? (leave blank to keep current: " + (patient.username || 'none') + ")");
          fetch(`http://localhost:5001/api/Patients/${id}/reset-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: newUser || "", password: newPass })
          })
          .then(res => {
            if (res.ok) {
              showToast("✅ Password reset successfully!");
              if (newUser) document.getElementById("modalUsername").innerText = newUser;
            } else {
              showToast("⚠ Failed to reset password.");
            }
          })
          .catch(err => {
            console.error("Reset error:", err);
            showToast("⚠ Error resetting password.");
          });
        };
      }

      // Fetch Latest Visit Indicators (Sugar, Hemoglobin)
      fetch("http://localhost:5001/api/Pregnancies")
        .then(r => r.json())
        .then(visits => {
            const patientVisits = visits.filter(v => String(v.patientId || v.PatientId || "").trim() === String(id).trim());
            if (patientVisits.length > 0) {
                const latest = patientVisits[patientVisits.length - 1];
                document.getElementById("modalSugar").innerText = latest.sugar || "-";
                document.getElementById("modalHb").innerText = latest.hemoglobin || "-";
            } else {
                document.getElementById("modalSugar").innerText = "-";
                document.getElementById("modalHb").innerText = "-";
            }
        })
        .catch(err => {
            console.error("Failed to load visit data:", err);
            document.getElementById("modalSugar").innerText = "-";
            document.getElementById("modalHb").innerText = "-";
        });
    })
    .catch(err => {
      console.error("Failed to load patient details:", err);
      document.getElementById("modalPatientName").innerText = "Error loading data";
    });
}

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (modal) modal.style.display = "none";
}

// Close modals when clicking outside
window.onclick = function(event) {
  const regModal = document.getElementById("registerModal");
  const profModal = document.getElementById("profileModal");
  if (event.target === regModal) closeForm();
  if (event.target === profModal) closeProfileModal();
}

window.addEventListener("DOMContentLoaded", loadPatients);
