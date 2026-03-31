// Auth is handled by auth-guard.js (loaded before this script)

document.addEventListener("DOMContentLoaded", function () {

  const API_BASE = "http://localhost:5001/api/Auth";

    // Elements
    const profilePreview = document.getElementById("profilePreview");
  const profileImageInput = document.getElementById("profileImageInput");

  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const role = document.getElementById("role");
  const clinicName = document.getElementById("clinicName");

  const aiAlerts = document.getElementById("aiAlerts");
  const clinicReminders = document.getElementById("clinicReminders");
  const emailNotifications = document.getElementById("emailNotifications");
  const smsNotifications = document.getElementById("smsNotifications");

  const language = document.getElementById("language");
  const theme = document.getElementById("theme");
  const timezone = document.getElementById("timezone");
  const dateFormat = document.getElementById("dateFormat");

  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  const twoFactor = document.getElementById("twoFactor");
  const showPersonalDetails = document.getElementById("showPersonalDetails");
  const dataSharing = document.getElementById("dataSharing");

  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const resetSettingsBtn = document.getElementById("resetSettingsBtn");
  const logoutBtn = document.querySelector(".logout-btn");

  const headerName = document.getElementById("headerDoctorName");
  const headerImage = document.getElementById("headerProfileImg");

  let pendingProfileImage = "";

    // Load profile from api
    function loadProfile() {
    fetch(API_BASE + "/profile", {
      method: "GET",
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then(data => {
        fullName.value = data.name || "";
        email.value = data.email || "";
        phone.value = data.phone || "";
        role.value = data.specialization || "";
        clinicName.value = data.clinic || "";

        aiAlerts.checked = data.aiAlerts ?? true;
        clinicReminders.checked = data.clinicReminders ?? true;
        emailNotifications.checked = data.emailNotifications ?? true;
        smsNotifications.checked = data.smsNotifications ?? false;

        language.value = data.language || "English";
        theme.value = data.theme || "Light";
        timezone.value = data.timezone || "Asia/Colombo";
        dateFormat.value = data.dateFormat || "DD/MM/YYYY";

        twoFactor.value = data.twoFactor || "Disabled";

        showPersonalDetails.checked = data.showPersonalDetails ?? true;
        dataSharing.checked = data.dataSharing ?? false;

        // Profile image
        if (data.profileImage && data.profileImage.length > 10) {
          profilePreview.src = data.profileImage;
          pendingProfileImage = data.profileImage;
        } else {
          profilePreview.src = "../images/avatar-doctor.png";
          pendingProfileImage = "";
        }

        // Update header
        if (headerName) headerName.textContent = "Dr. " + (data.name || "Doctor");
        if (headerImage) {
          headerImage.src = (data.profileImage && data.profileImage.length > 10)
            ? data.profileImage
            : "../images/avatar-doctor.png";
        }

        // Email field is read-only (it's the identity key)
        email.readOnly = true;
        email.style.opacity = "0.6";
      })
      .catch(err => {
        console.error("Error loading profile:", err);
      });
  }

  loadProfile();

    // Profile image preview
    profileImageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Image is too large. Please select an image under 2MB.");
        return;
      }

      const reader = new FileReader();

      reader.onload = function (e) {
        profilePreview.src = e.target.result;
        pendingProfileImage = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  });

    // Save settings to api
    saveSettingsBtn.addEventListener("click", function () {

    if (
      fullName.value.trim() === "" ||
      email.value.trim() === "" ||
      phone.value.trim() === "" ||
      clinicName.value.trim() === ""
    ) {
      showToast("Please fill all required profile fields.");
      return;
    }

    // Password validation
    if (newPassword.value || confirmPassword.value) {
      if (newPassword.value !== confirmPassword.value) {
        showToast("New password and confirm password do not match.");
        return;
      }
      if (newPassword.value.length < 6) {
        showToast("New password must be at least 6 characters.");
        return;
      }
      if (!currentPassword.value) {
        showToast("Please enter your current password to change it.");
        return;
      }
    }

    const payload = {
      email: email.value.trim(),
      name: fullName.value.trim(),
      phone: phone.value.trim(),
      clinic: clinicName.value.trim(),
      specialization: role.value.trim(),
      profileImage: pendingProfileImage,

      password: newPassword.value || "",

      aiAlerts: aiAlerts.checked,
      clinicReminders: clinicReminders.checked,
      emailNotifications: emailNotifications.checked,
      smsNotifications: smsNotifications.checked,

      language: language.value,
      theme: theme.value,
      timezone: timezone.value,
      dateFormat: dateFormat.value,
      twoFactor: twoFactor.value,

      showPersonalDetails: showPersonalDetails.checked,
      dataSharing: dataSharing.checked
    };

    fetch(API_BASE + "/profile", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to save settings");
        return res.json();
      })
      .then(data => {
        localStorage.setItem("doctorName", data.name || "");

        currentPassword.value = "";
        newPassword.value = "";
        confirmPassword.value = "";

        if (headerName) headerName.textContent = "Dr. " + (data.name || "Doctor");
        if (headerImage && data.profileImage && data.profileImage.length > 10) {
          headerImage.src = data.profileImage;
        }

        showToast("Settings saved successfully.");
      })
      .catch(err => {
        console.error("Save error:", err);
        showToast("Failed to save settings. Please try again.");
      });
  });

    // Reset
    resetSettingsBtn.addEventListener("click", async function () {
    const confirmReset = await showConfirm({
      title: "Reload settings?",
      message: "This will discard unsaved profile changes and reload settings from the server.",
      confirmText: "Reload",
      variant: "warning"
    });
    if (!confirmReset) return;

    loadProfile();
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  });

    // Edit profile button
    const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", function () {
      fullName.focus();
    });
  }

    // Logout
    if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      const confirmLogout = await showConfirm({
        title: "Log out?",
        message: "Are you sure you want to logout?",
        confirmText: "Logout",
        variant: "danger"
      });
      if (confirmLogout) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("doctorEmail");
        localStorage.removeItem("doctorName");
        window.location.href = "login.html";
      }
    });
  }

});
