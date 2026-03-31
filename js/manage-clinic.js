const API = "http://localhost:5001/api";

document.addEventListener("DOMContentLoaded", () => {
    const saveAllBtn = document.getElementById("saveAllBtn");
    const printBtn = document.getElementById("printBtn");

    loadClinicData();

    if (saveAllBtn) {
        saveAllBtn.addEventListener("click", saveClinicData);
    }

    if (printBtn) {
        printBtn.addEventListener("click", () => window.print());
    }
});

async function loadClinicData() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API}/clinic/my-clinic`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            
            const c = data.clinic || {};
            setVal("clinicName", c.name);
            setVal("regNo", c.regNo);
            setVal("address", c.address);
            setVal("contactNumber", c.contactNumber);
            setVal("mohArea", c.mohArea);
            setVal("clinicDays", c.clinicDays);
            setVal("workingHours", c.workingHours);
            setVal("maternalClinicDay", c.maternalClinicDay);
            setVal("babyClinicDay", c.babyClinicDay);
            setVal("consultRoom", c.consultRoom);
            setVal("waitingArea", c.waitingArea);
            setVal("medicineStorage", c.medicineStorage);
            setVal("babyCheckupArea", c.babyCheckupArea);
            setVal("emergencyName", c.emergencyName);
            setVal("emergencyNumber", c.emergencyNumber);
            setVal("clinicNotes", c.notes);

            // Services checkboxes
            if (c.services && c.services.length > 0) {
                const checkboxes = document.querySelectorAll('.check-grid input[type="checkbox"]');
                checkboxes.forEach(chk => {
                    const label = chk.parentElement.textContent.trim();
                    chk.checked = c.services.includes(label);
                });
            }

            const m = data.midwife || {};
            setVal("midwifeName", m.name);
            setVal("midwifePosition", m.position);
            setVal("midwifeContact", m.contact);
            setVal("midwifeEmail", m.email);
            // Password is not populated, it's hashed and hidden
        }
    } catch (err) {
        console.error("Failed to load clinic data", err);
    }
}

async function saveClinicData() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const saveAllBtn = document.getElementById("saveAllBtn");
    saveAllBtn.innerText = "Saving...";
    saveAllBtn.disabled = true;

    // Collect services
    const services = [];
    const checkboxes = document.querySelectorAll('.check-grid input[type="checkbox"]');
    checkboxes.forEach(chk => {
        if (chk.checked) services.push(chk.parentElement.textContent.trim());
    });

    const payload = {
        clinic: {
            name: getVal("clinicName"),
            regNo: getVal("regNo"),
            address: getVal("address"),
            contactNumber: getVal("contactNumber"),
            mohArea: getVal("mohArea"),
            clinicDays: getVal("clinicDays"),
            workingHours: getVal("workingHours"),
            maternalClinicDay: getVal("maternalClinicDay"),
            babyClinicDay: getVal("babyClinicDay"),
            consultRoom: getVal("consultRoom"),
            waitingArea: getVal("waitingArea"),
            medicineStorage: getVal("medicineStorage"),
            babyCheckupArea: getVal("babyCheckupArea"),
            emergencyName: getVal("emergencyName"),
            emergencyNumber: getVal("emergencyNumber"),
            notes: getVal("clinicNotes"),
            services: services
        },
        midwife: {
            name: getVal("midwifeName"),
            position: getVal("midwifePosition"),
            contact: getVal("midwifeContact"),
            email: getVal("midwifeEmail"),
            password: getVal("midwifePassword") // Only sent if changed
        }
    };

    try {
        const res = await fetch(`${API}/clinic/my-clinic`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast("Clinic details saved successfully!");
            document.getElementById("midwifePassword").value = ""; // Clear password field
        } else {
            showToast("Failed to save clinic details.");
        }
    } catch (err) {
        console.error("Save error", err);
        showToast("An error occurred while saving.");
    } finally {
        saveAllBtn.innerText = "Save Changes";
        saveAllBtn.disabled = false;
    }
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
}
