const API = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    loadMidwifeProfile();

    document.getElementById("saveProfileBtn")?.addEventListener("click", updateProfile);
    document.getElementById("updateSecurityBtn")?.addEventListener("click", updatePassword);
});

async function loadMidwifeProfile() {
    try {
        const res = await fetch(`${API}/Auth/profile`, {
            headers: getAuthHeaders()
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById("mwName").value = data.name || "";
            document.getElementById("mwEmail").value = data.email || "";
            document.getElementById("mwPosition").value = data.position || "Midwife";
            document.getElementById("mwPhone").value = data.contact || "";
        }
    } catch (err) {
        console.error("Failed to load profile", err);
    }
}

async function updateProfile() {
    const btn = document.getElementById("saveProfileBtn");
    btn.innerText = "Saving...";
    btn.disabled = true;

    const payload = {
        name: document.getElementById("mwName").value,
        phone: document.getElementById("mwPhone").value
    };

    try {
        const res = await fetch(`${API}/Auth/profile`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Profile updated successfully!");
            // Update local storage name just in case it's displayed in UI
            localStorage.setItem("doctorName", payload.name);
        } else {
            showToast("Failed to update profile");
        }
    } catch (err) {
        console.error(err);
        showToast("Error updating profile");
    } finally {
        btn.innerText = "Update Profile";
        btn.disabled = false;
    }
}

async function updatePassword() {
    const pwd1 = document.getElementById("mwPassword").value;
    const pwd2 = document.getElementById("mwPasswordConfirm").value;

    if (!pwd1) {
        showToast("Please enter a new password.");
        return;
    }
    
    if (pwd1.length < 6) {
        showToast("Password must be at least 6 characters.");
        return;
    }

    if (pwd1 !== pwd2) {
        showToast("Passwords do not match!");
        return;
    }

    const btn = document.getElementById("updateSecurityBtn");
    btn.innerText = "Updating...";
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/Auth/profile`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ password: pwd1 })
        });

        if (res.ok) {
            showToast("Password updated successfully!");
            document.getElementById("mwPassword").value = "";
            document.getElementById("mwPasswordConfirm").value = "";
        } else {
            showToast("Failed to update password");
        }
    } catch (err) {
        console.error(err);
        showToast("Error updating password");
    } finally {
        btn.innerText = "Update Password";
        btn.disabled = false;
    }
}
