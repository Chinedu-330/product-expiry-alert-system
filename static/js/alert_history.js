function loadAlertHistory() {
    try {
        const raw = localStorage.getItem('expiryGuardAlertHistory') || '[]';
        const history = JSON.parse(raw);
        return Array.isArray(history) ? history : [];
    } catch (error) {
        console.warn('Unable to load alert history:', error);
        return [];
    }
}

function renderAlertHistory() {
    const history = loadAlertHistory();
    const tbody = document.getElementById('alertHistoryBody');
    if (!tbody) return;

    if (!history.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="notification-empty">No alert history found. Alerts will appear here when products expire.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = history.map(item => `
        <tr>
            <td>${item.createdAt || 'Unknown'}</td>
            <td>${item.type || 'info'}</td>
            <td>${item.title || ''}</td>
            <td>${item.message || ''}</td>
        </tr>
    `).join('');
}

function exportAlertHistoryExcel() {
    const history = loadAlertHistory();
    if (!history.length) {
        alert('No alert history available to export.');
        return;
    }

    const sheetData = history.map(item => ({
        Time: item.createdAt || '',
        Type: item.type || '',
        Title: item.title || '',
        Message: item.message || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alert History');
    XLSX.writeFile(workbook, 'expiryguard-alert-history.xlsx');
}

function exportAlertHistoryPDF() {
    const history = loadAlertHistory();
    if (!history.length) {
        alert('No alert history available to export.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const rows = history.map(item => [
        item.createdAt || '',
        item.type || '',
        item.title || '',
        item.message || ''
    ]);

    doc.setFontSize(14);
    doc.text('ExpiryGuard Alert History', 40, 40);
    doc.autoTable({
        startY: 60,
        head: [['Time', 'Type', 'Title', 'Message']],
        body: rows,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        theme: 'striped',
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 80 },
            2: { cellWidth: 160 },
            3: { cellWidth: 220 }
        }
    });

    doc.save('expiryguard-alert-history.pdf');
}

function clearAlertHistory() {
    if (!confirm('Clear all saved alert history?')) return;
    localStorage.removeItem('expiryGuardAlertHistory');
    renderAlertHistory();
    alert('Alert history cleared.');
}

function goBackToDashboard() {
    window.location.href = '/dashboard';
}

window.addEventListener('DOMContentLoaded', () => {
    renderAlertHistory();
});
