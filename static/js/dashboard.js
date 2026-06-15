async function addProduct(event) {

    event.preventDefault();

    const productData = {
        product_name:
            document.getElementById("productName").value,

        category:
            document.getElementById("productCategory").value,

        quantity: parseInt(document.getElementById("quantity").value, 10),

        batch_number:
            document.getElementById("batchNumber").value,

        expiry_date:
            document.getElementById("expiryDate").value,

        alert_threshold: parseInt(document.getElementById("alertThreshold").value, 10)
    };

    const response = await fetch("/add-product", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(productData)
    });

    const result = await response.json();

    if (result.success) {

        alert(result.message);

        document.getElementById(
            "addProductForm"
        ).reset();

        loadProducts();

    } else {

        alert("Failed to add product");
    }
}

const notificationState = {
    notifications: [],
    sentKeys: new Set(),
    methods: {
        browser: true,
        email: false,
        sms: false
    },
    emailConfig: {
        serviceId: "",
        templateId: "",
        publicKey: ""
    },
    quietHours: {
        start: "22:00",
        end: "08:00"
    }
};

let productsCache = [];

function loadSavedSentKeys() {
    try {
        const raw = localStorage.getItem('expiryGuardSentKeys') || '[]';
        const saved = JSON.parse(raw);
        notificationState.sentKeys = new Set(Array.isArray(saved) ? saved : []);
    } catch (error) {
        console.warn('Failed to load saved alert keys:', error);
        notificationState.sentKeys = new Set();
    }
}

function saveSentKeys() {
    try {
        localStorage.setItem('expiryGuardSentKeys', JSON.stringify([...notificationState.sentKeys]));
    } catch (error) {
        console.warn('Failed to persist alert keys:', error);
    }
}

function loadSavedAlertHistory() {
    try {
        const raw = localStorage.getItem('expiryGuardAlertHistory') || '[]';
        notificationState.history = JSON.parse(raw);
        if (!Array.isArray(notificationState.history)) {
            notificationState.history = [];
        }
    } catch (error) {
        console.warn('Failed to load saved alert history:', error);
        notificationState.history = [];
    }
}

function saveAlertHistory() {
    try {
        localStorage.setItem('expiryGuardAlertHistory', JSON.stringify(notificationState.history));
    } catch (error) {
        console.warn('Failed to persist alert history:', error);
    }
}

function appendAlertHistory(notification) {
    notificationState.history.unshift({
        ...notification,
        createdAt: new Date().toLocaleString()
    });
    saveAlertHistory();
}

function getStoredNotificationSettings() {
    return JSON.parse(
        localStorage.getItem("expiryGuardNotificationSettings") || "{}"
    );
}

function initNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem("expiryGuardSettings") || "{}");
    const stored = getStoredNotificationSettings();

    notificationState.methods = stored.methods || notificationState.methods;
    notificationState.emailConfig = stored.emailConfig || notificationState.emailConfig;
    notificationState.quietHours = stored.quietHours || notificationState.quietHours;

    if (settings.alerts && typeof settings.alerts.emailAlerts !== "undefined") {
        notificationState.methods.email = Boolean(settings.alerts.emailAlerts);
    }

    if (notificationState.emailConfig.publicKey && window.emailjs) {
        emailjs.init(notificationState.emailConfig.publicKey);
    }

    const serviceIdInput = document.getElementById("emailServiceId");
    const templateIdInput = document.getElementById("emailTemplateId");
    const publicKeyInput = document.getElementById("emailPublicKey");
    const quietStart = document.getElementById("quietStart");
    const quietEnd = document.getElementById("quietEnd");

    if (serviceIdInput) serviceIdInput.value = notificationState.emailConfig.serviceId || "";
    if (templateIdInput) templateIdInput.value = notificationState.emailConfig.templateId || "";
    if (publicKeyInput) publicKeyInput.value = notificationState.emailConfig.publicKey || "";
    if (quietStart) quietStart.value = notificationState.quietHours.start;
    if (quietEnd) quietEnd.value = notificationState.quietHours.end;

    loadSavedSentKeys();
    loadSavedAlertHistory();
    updateNotificationMethodUI();
    updateEmailStatus();
    updateNotificationUI();
}

function updateNotificationMethodUI() {
    const browserCard = document.getElementById("browserNotif");
    const emailCard = document.getElementById("emailNotif");
    const smsCard = document.getElementById("smsNotif");

    if (browserCard) browserCard.classList.toggle("active", notificationState.methods.browser);
    if (emailCard) emailCard.classList.toggle("active", notificationState.methods.email);
    if (smsCard) smsCard.classList.toggle("active", notificationState.methods.sms);
}

function saveNotificationSettings() {
    const serviceIdInput = document.getElementById("emailServiceId");
    const templateIdInput = document.getElementById("emailTemplateId");
    const publicKeyInput = document.getElementById("emailPublicKey");
    const quietStart = document.getElementById("quietStart");
    const quietEnd = document.getElementById("quietEnd");

    notificationState.emailConfig.serviceId = serviceIdInput ? serviceIdInput.value.trim() : notificationState.emailConfig.serviceId;
    notificationState.emailConfig.templateId = templateIdInput ? templateIdInput.value.trim() : notificationState.emailConfig.templateId;
    notificationState.emailConfig.publicKey = publicKeyInput ? publicKeyInput.value.trim() : notificationState.emailConfig.publicKey;
    notificationState.quietHours.start = quietStart ? quietStart.value : notificationState.quietHours.start;
    notificationState.quietHours.end = quietEnd ? quietEnd.value : notificationState.quietHours.end;

    if (notificationState.emailConfig.publicKey && window.emailjs) {
        emailjs.init(notificationState.emailConfig.publicKey);
    }

    localStorage.setItem(
        "expiryGuardNotificationSettings",
        JSON.stringify({
            methods: notificationState.methods,
            emailConfig: notificationState.emailConfig,
            quietHours: notificationState.quietHours
        })
    );

    updateNotificationMethodUI();
    updateEmailStatus();
}

function saveEmailConfig() {
    const serviceIdInput = document.getElementById("emailServiceId");
    const templateIdInput = document.getElementById("emailTemplateId");
    const publicKeyInput = document.getElementById("emailPublicKey");

    notificationState.emailConfig.serviceId = serviceIdInput ? serviceIdInput.value.trim() : notificationState.emailConfig.serviceId;
    notificationState.emailConfig.templateId = templateIdInput ? templateIdInput.value.trim() : notificationState.emailConfig.templateId;
    notificationState.emailConfig.publicKey = publicKeyInput ? publicKeyInput.value.trim() : notificationState.emailConfig.publicKey;

    saveNotificationSettings();
    alert("Email setup saved. EmailJS fallback is now enabled when backend delivery fails.");
}

function testEmailConfig() {
    const recipient = window.currentUserEmail;
    const { serviceId, templateId, publicKey } = notificationState.emailConfig;

    if (!serviceId || !templateId || !publicKey) {
        alert("Please complete the EmailJS settings before testing.");
        return;
    }

    if (!window.emailjs) {
        alert("EmailJS SDK is not loaded. Please check your internet connection.");
        return;
    }

    emailjs.init(publicKey);
    emailjs.send(serviceId, templateId, {
        subject: "ExpiryGuard Test Email",
        product_name: "Test Alert",
        message: "This is a test alert from ExpiryGuard.",
        created_at: new Date().toLocaleString(),
        to_email: recipient,
        to_name: recipient ? recipient.split('@')[0] : ''
    }).then(() => {
        alert("Test email sent successfully. Check your inbox.");
    }).catch((error) => {
        console.error("EmailJS test failed:", error);
        alert("EmailJS test failed. See console for details.");
    });
}

function saveGeneralSettings() {
    const autoCheckInterval = document.getElementById("autoCheckInterval")?.value;
    const defaultThreshold = document.getElementById("defaultThreshold")?.value;
    const dateFormat = document.getElementById("dateFormat")?.value;
    const language = document.getElementById("language")?.value;

    localStorage.setItem(
        "expiryGuardGeneralSettings",
        JSON.stringify({
            autoCheckInterval,
            defaultThreshold,
            dateFormat,
            language
        })
    );
}

function toggleNotificationMethod(method) {
    notificationState.methods.browser = method === "browser";
    notificationState.methods.email = method === "email";
    notificationState.methods.sms = method === "sms";

    saveNotificationSettings();
}

function openEmailSetup() {
    const emailConfigForm = document.getElementById("emailConfigForm");
    if (!emailConfigForm) return;
    emailConfigForm.style.display = emailConfigForm.style.display === "block" ? "none" : "block";
}

function updateEmailStatus() {
    const statusIndicator = document.getElementById("emailStatus");
    const statusText = document.getElementById("emailStatusText");
    const configured =
        notificationState.emailConfig.serviceId &&
        notificationState.emailConfig.templateId &&
        notificationState.emailConfig.publicKey;

    if (statusIndicator && statusText) {
        statusIndicator.className = "status-indicator";
        if (configured) {
            statusIndicator.classList.add("success");
            statusText.textContent = "Email notifications are ready.";
        } else {
            statusIndicator.classList.add("warning");
            statusText.textContent = "EmailJS configuration is incomplete.";
        }
    }
}

function isWithinQuietHours() {
    const now = new Date();
    const [startHour, startMinute] = notificationState.quietHours.start.split(":").map(Number);
    const [endHour, endMinute] = notificationState.quietHours.end.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function createNotification(notification) {
    const key = `${notification.type}:${notification.id}`;
    if (notificationState.sentKeys.has(key)) {
        return;
    }

    notificationState.sentKeys.add(key);
    saveSentKeys();
    appendAlertHistory(notification);
    notificationState.notifications.unshift({
        ...notification,
        createdAt: new Date().toLocaleString()
    });

    updateNotificationUI();

    if (notificationState.methods.email && !isWithinQuietHours()) {
        sendEmailNotification(notification);
    }

    if (notificationState.methods.browser && !isWithinQuietHours()) {
        showBrowserNotification(notification);
    }
}

function updateNotificationUI() {
    const badge = document.getElementById("notificationCount");
    const notificationList = document.getElementById("notificationList");
    const alertsContainer = document.getElementById("alertsContainer");

    const count = notificationState.notifications.length;
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline-block" : "none";
    }

    if (notificationList) {
        if (!count) {
            notificationList.innerHTML = `<div class="notification-empty">No alerts yet.</div>`;
        } else {
            notificationList.innerHTML = notificationState.notifications
                .slice(0, 8)
                .map(notification => `
                <div class="notification-item">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                    <small>${notification.createdAt}</small>
                </div>
            `)
                .join("");
        }
    }

    if (alertsContainer) {
        alertsContainer.innerHTML = notificationState.notifications
            .slice(0, 5)
            .map(notification => `
                <div class="alert-${notification.type === "danger" ? "danger" : "warning"}">
                    ${notification.message}
                </div>
            `)
            .join("");
    }
}

async function sendEmailNotification(notification) {
    const recipient = window.currentUserEmail || document.getElementById("profileEmailDisplay")?.textContent?.trim();
    if (!recipient) {
        console.warn("Email alert skipped because no recipient email is available.");
        return;
    }

    const payload = {
        subject: notification.title,
        message: notification.message,
        recipient
    };

    try {
        const response = await fetch("/send-email-alert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            console.warn("Backend email alert failed:", result.error || result.message || response.statusText);
            await tryEmailJsFallback(notification, recipient);
            return;
        }

        console.info("Email alert sent successfully to", recipient);
    } catch (error) {
        console.error("Email notification failed:", error);
        await tryEmailJsFallback(notification, recipient);
    }
}

async function tryEmailJsFallback(notification, recipient) {
    if (!window.emailjs) {
        return;
    }

    const { serviceId, templateId } = notificationState.emailConfig;
    if (!serviceId || !templateId) {
        return;
    }

    try {
        if (notificationState.emailConfig.publicKey) {
            emailjs.init(notificationState.emailConfig.publicKey);
        }

        await emailjs.send(serviceId, templateId, {
            subject: notification.title,
            product_name: notification.title,
            message: notification.message,
            created_at: notification.createdAt,
            to_email: recipient,
            to_name: window.currentUserEmail ? window.currentUserEmail.split('@')[0] : ''
        });
        console.info("EmailJS fallback notification sent.");
    } catch (emailJsError) {
        console.error("EmailJS fallback also failed:", emailJsError);
    }
}

function showBrowserNotification(notification) {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: notification.message,
            icon: "/static/images/notification-icon.png"
        });
        return;
    }

    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: "/static/images/notification-icon.png"
                });
            }
        });
    }
}

function showNotifications() {
    const dropdown = document.getElementById("notificationDropdown");
    if (!dropdown) return;
    dropdown.classList.toggle("active");
}

function clearNotifications() {
    notificationState.notifications = [];
    notificationState.sentKeys.clear();
    try {
        localStorage.removeItem('expiryGuardSentKeys');
    } catch (error) {
        console.warn('Failed to clear saved alert keys:', error);
    }
    updateNotificationUI();
}

function openSettings() {
    window.location.href = "/settings";
}

function openProfile() {
    window.location.href = "/settings#profile";
}

function openAlertHistory() {
    window.location.href = "/alerts-history";
}

function closeProfile() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.remove("active");
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.toggle("active");
}

function logout() {
    window.location.href = "/logout";
}

async function loadProducts() {

    const response = await fetch("/products");

    const products = await response.json();
    const alertContainer = document.getElementById("alertsContainer") || document.getElementById("alertContainer");
    const tableBody = document.getElementById("productTableBody");

    if (alertContainer) {
        alertContainer.innerHTML = "";
    }
    if (tableBody) {
        tableBody.innerHTML = "";
    }

    let totalProducts = products.length;
    let expiringSoon = 0;
    let expiredProducts = 0;
    let goodProducts = 0;

    const rows = [];

    products.forEach(product => {

        const today = new Date();
        const expiryDate = new Date(product.expiry_date);

        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        let status = "";

        if (daysLeft < 0) {
            status = "Expired";
            expiredProducts++;

            if (alertContainer) {
                alertContainer.innerHTML += `
                <div class="alert-danger">
                    ❌ ${product.product_name} has expired
                </div>
            `;
            }

            createNotification({
                id: product.id,
                title: `Expired: ${product.product_name}`,
                message: `${product.product_name} expired ${Math.abs(daysLeft)} day(s) ago.`,
                type: "danger"
            });

        } else if (daysLeft <= 7) {
            status = "Expiring Soon";
            expiringSoon++;

            if (alertContainer) {
                alertContainer.innerHTML += `
                <div class="alert-warning">
                    ⚠️ ${product.product_name} expires in ${daysLeft} day(s)
                </div>
            `;
            }

            createNotification({
                id: product.id,
                title: `Expiring Soon: ${product.product_name}`,
                message: `${product.product_name} expires in ${daysLeft} day(s).`,
                type: "warning"
            });

        } else {
            status = "Good";
            goodProducts++;
        }

                rows.push(`<tr data-category="${product.category || ''}" data-name="${(product.product_name||'').toLowerCase()}" data-status="${(status||'').toLowerCase()}">
                                <td>${product.product_name}</td>
                                <td>${product.category}</td>
                                <td>${product.expiry_date}</td>
                                <td>${status}</td>
                                <td>${daysLeft < 0 ? 0 : daysLeft}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.location.href='/edit-product/${product.id}'">Edit</button>
                                        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                                </td>
                        </tr>`);
    });

    // cache products for filtering
    productsCache = products;

    if (tableBody) tableBody.innerHTML = rows.join('');

    document.getElementById("totalProducts").textContent = totalProducts;
    document.getElementById("expiringSoon").textContent = expiringSoon;
    document.getElementById("expiredProducts").textContent = expiredProducts;
    document.getElementById("goodProducts").textContent = goodProducts;
}

function renderProductTable(products) {
    const tableBody = document.getElementById("productTableBody");
    const alertContainer = document.getElementById("alertsContainer") || document.getElementById("alertContainer");
    if (alertContainer) alertContainer.innerHTML = "";
    if (!tableBody) return;

    const rows = products.map(product => {
        const today = new Date();
        const expiryDate = new Date(product.expiry_date);
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        let status = "";
        if (daysLeft < 0) status = "Expired";
        else if (daysLeft <= 7) status = "Expiring Soon";
        else status = "Good";

                return `<tr>
                                <td>${product.product_name}</td>
                                <td>${product.category}</td>
                                <td>${product.expiry_date}</td>
                                <td>${status}</td>
                                <td>${daysLeft < 0 ? 0 : daysLeft}</td>
                                <td>
                                    <button class="btn-edit" onclick="window.location.href='/edit-product/${product.id}'">Edit</button>
                                        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                                </td>
                        </tr>`;
    });

    tableBody.innerHTML = rows.join('');
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = rows.length ? 'none' : 'block';
}

function filterProducts({ status = 'all', category = 'all', query = '' } = {}) {
    if (!Array.isArray(productsCache)) return;
    const q = (query || '').trim().toLowerCase();

    const filtered = productsCache.filter(product => {
        const today = new Date();
        const expiryDate = new Date(product.expiry_date);
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        // status filter
        if (status && status !== 'all') {
            if (status === 'expired' && !(daysLeft < 0)) return false;
            if (status === 'warning' && !(daysLeft <= 7 && daysLeft >= 0)) return false;
            if (status === 'good' && !(daysLeft > 7)) return false;
        }

        // category filter
        if (category && category !== 'all' && (product.category || '') !== category) return false;

        // query filter
        if (q) {
            const name = (product.product_name || '').toLowerCase();
            const cat = (product.category || '').toLowerCase();
            if (!name.includes(q) && !cat.includes(q)) return false;
        }

        return true;
    });

    renderProductTable(filtered);
}

function filterBy(type) {
    // type: 'all' | 'warning' | 'expired' | 'good'
    const statusMap = {
        all: 'all',
        warning: 'warning',
        expired: 'expired',
        good: 'good'
    };
    const status = statusMap[type] || 'all';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    // clear category select
    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) categorySelect.value = '';

    filterProducts({ status });
}

function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    const statusSelect = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('keyup', debounce((e) => {
            const q = e.target.value;
            const category = categorySelect ? categorySelect.value : 'all';
            const status = statusSelect ? statusSelect.value : 'all';
            filterProducts({ query: q, category, status });
        }, 300));
    }

    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const category = e.target.value;
            const q = searchInput ? searchInput.value : '';
            const status = statusSelect ? statusSelect.value : 'all';
            filterProducts({ category, query: q, status });
        });
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            const status = e.target.value;
            const q = searchInput ? searchInput.value : '';
            const category = categorySelect ? categorySelect.value : 'all';
            filterProducts({ status, category, query: q });
        });
    }
}


async function editProduct(id) {

    const response = await fetch("/products");

    const products = await response.json();

    const product = products.find(
        p => p.id === id
    );
    if (!product) {

        alert("Product not found");
        return;
    }

    document.getElementById(
        "editProductId"
    ).value = product.id;

    document.getElementById(
        "editProductName"
    ).value = product.product_name;

    document.getElementById(
        "editProductCategory"
    ).value = product.category;

    document.getElementById(
        "editQuantity"
    ).value = product.quantity;

    document.getElementById(
            "editBatchNumber"
        ).value = product.batch_number || "";

    document.getElementById(
            "editAlertThreshold"
        ).value = product.alert_threshold;

    document.getElementById(
        "editModal"
    ).style.display = "flex";
}


function closeEditModal() {

    document.getElementById(
        "editModal"
    ).style.display = "none";
}


async function updateProduct(event) {

    event.preventDefault();

    const productId =
        document.getElementById(
            "editProductId"
        ).value;

    const updatedData = {

        product_name:
            document.getElementById(
                "editProductName"
            ).value,

        category:
            document.getElementById(
                "editProductCategory"
            ).value,

        quantity: parseInt(
            document.getElementById(
                "editQuantity"
            ).value,
            10
        ),

        batch_number:
            document.getElementById(
                "editBatchNumber"
            ).value,

        expiry_date:
            document.getElementById(
                "editExpiryDate"
            ).value,

        alert_threshold: parseInt(
            document.getElementById(
                "editAlertThreshold"
            ).value,
            10
        )
    };

    const response = await fetch(
        `/update-product/${productId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify(
                updatedData
            )
        }
    );

    const result =
        await response.json();

    if (result.success) {

        alert(result.message);

        closeEditModal();

        loadProducts();

    } else {

        alert(result.message);
    }
}


async function deleteProduct(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
        return;
    }

    const response = await fetch(
        `/delete-product/${id}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    if (result.success) {

        alert(result.message);

        loadProducts();

    } else {

        alert(result.message);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    initNotificationSettings();
    loadProducts();
});