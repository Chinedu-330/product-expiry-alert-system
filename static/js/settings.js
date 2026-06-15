function loadSettingsPage() {
    const storedSettings = JSON.parse(localStorage.getItem("expiryGuardSettings") || "{}");
    const profileSettings = storedSettings.profile || {};
    const alertSettings = storedSettings.alerts || {};
    const systemSettings = storedSettings.system || {};

    document.getElementById("defaultAlertThreshold").value = alertSettings.defaultThreshold || 7;
    setToggleState("expiryNotificationsToggle", alertSettings.expiryNotifications ?? true);
    setToggleState("emailAlertsToggle", alertSettings.emailAlerts ?? false);
    setToggleState("dashboardAlertsToggle", alertSettings.dashboardAlerts ?? true);

    document.getElementById("dateFormat").value = systemSettings.dateFormat || "MM/DD/YYYY";
    document.getElementById("themeMode").value = systemSettings.themeMode || "light";
    document.getElementById("language").value = systemSettings.language || "en";

    if (profileSettings.fullName) {
        document.getElementById("profileFullName").value = profileSettings.fullName;
    }
    if (profileSettings.email) {
        document.getElementById("profileEmail").value = profileSettings.email;
    }
    if (profileSettings.username) {
        document.getElementById("profileUsername").value = profileSettings.username;
    }
}

function setToggleState(toggleElementId, enabled) {
    const element = document.getElementById(toggleElementId);
    if (!element) return;
    element.classList.toggle("active", enabled);
}

function togglePageSetting(element, key) {
    element.classList.toggle("active");
    savePageSettings();
}

function savePageSettings() {
    const settings = JSON.parse(localStorage.getItem("expiryGuardSettings") || "{}");
    settings.alerts = {
        defaultThreshold: parseInt(document.getElementById("defaultAlertThreshold").value, 10) || 7,
        expiryNotifications: document.getElementById("expiryNotificationsToggle").classList.contains("active"),
        emailAlerts: document.getElementById("emailAlertsToggle").classList.contains("active"),
        dashboardAlerts: document.getElementById("dashboardAlertsToggle").classList.contains("active")
    };
    settings.system = {
        dateFormat: document.getElementById("dateFormat").value,
        themeMode: document.getElementById("themeMode").value,
        language: document.getElementById("language").value
    };
    settings.profile = {
        fullName: document.getElementById("profileFullName").value,
        email: document.getElementById("profileEmail").value,
        username: document.getElementById("profileUsername").value
    };
    localStorage.setItem("expiryGuardSettings", JSON.stringify(settings));
}

async function saveProfileSettings(event) {
    event.preventDefault();

    const data = {
        full_name: document.getElementById("profileFullName").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        username: document.getElementById("profileUsername").value.trim(),
        current_password: document.getElementById("profileCurrentPassword").value,
        new_password: document.getElementById("profileNewPassword").value
    };

    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
            savePageSettings();
            alert(result.message || "Profile updated successfully.");
            if (result.user_full_name) {
                document.title = `${result.user_full_name} - ExpiryGuard`;
            }
        } else {
            alert(result.message || "Could not save profile.");
        }
    } catch (error) {
        console.error(error);
        alert("Unable to save profile settings. Please try again.");
    }
}

function exportproductsPDF() {
    window.location.href = "/export-pdf";
}
function exportproductsExcel() {
    window.location.href = "/export-excel";
}

function backupDatabase() {
    window.location.href = "/backup-database";
}

function deleteAccount() {
    const confirmed = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmed) {
        alert("Account deletion is currently disabled. Please contact your administrator.");
    }
}

function showNotifications() {
    alert("Notifications are available on the dashboard. Please return to the dashboard to view them.");
}

function openSettings() {
    window.location.href = "/settings";
}

function openProfile() {
    window.location.href = "/settings#profile";
}

function logout() {
    window.location.href = "/logout";
}

document.addEventListener("DOMContentLoaded", () => {
    loadSettingsPage();
});
