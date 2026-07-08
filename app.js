// ERP KK-Retainer App Controller Logic

// --- STATE MANAGEMENT ---
let clients = [];
let transactions = [];
let revenueChart = null;

// Initialize app data
function initData() {
    // Always load client LOB config from mockData.js (initialClients) to guarantee structural updates take effect immediately
    clients = initialClients;
    localStorage.setItem("erp_clients", JSON.stringify(clients));
    
    // Transactions are user-generated ledger items, load from localStorage
    transactions = JSON.parse(localStorage.getItem("erp_transactions")) || initialTransactions;
    if (!localStorage.getItem("erp_transactions")) {
        localStorage.setItem("erp_transactions", JSON.stringify(initialTransactions));
    }
}

function saveData() {
    localStorage.setItem("erp_transactions", JSON.stringify(transactions));
}

// --- UTILITY FUNCTIONS ---
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function generateId(prefix) {
    return prefix + "_" + Math.random().toString(36).substr(2, 9);
}

// --- TAB NAVIGATION CONTROLLER ---
const viewsMap = {
    'dashboard': { title: 'Dashboard Overview', subtitle: 'Welcome back. Here is your business billing summary.' },
    'clients': { title: 'Clients Directory', subtitle: 'Manage company clients, fixed retainers, and billing configurations.' },
    'billing': { title: 'Billing Ledger', subtitle: 'Track and process monthly fixed retainers and commission invoices.' },
    'calculator': { title: 'Commission Calculator', subtitle: 'Calculate dynamic performance billing and log invoice records.' },
    'invoice-viewer': { title: 'Invoice Hub', subtitle: 'View, export, and print client invoices.' }
};

function switchTab(targetId) {
    // Toggle active view panel
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`view-${targetId}`);
    if (activePanel) activePanel.classList.add('active');
    
    // Toggle active nav menu items
    document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === targetId) {
            item.classList.add('active');
        }
    });

    // Update Header Title/Subtitle
    if (viewsMap[targetId]) {
        document.getElementById('view-title').textContent = viewsMap[targetId].title;
        document.getElementById('view-subtitle').textContent = viewsMap[targetId].subtitle;
    }

    // Refresh view specific components
    if (targetId === 'dashboard') {
        renderDashboard();
    } else if (targetId === 'clients') {
        renderClients();
    } else if (targetId === 'billing') {
        renderBillingLedger();
    } else if (targetId === 'calculator') {
        resetCalculator();
    }

    // Recalculate icons
    lucide.createIcons();
}

// --- DASHBOARD CONTROLLER ---
function renderDashboard() {
    initData();
    
    // 1. Calculate and update KPI Cards
    const activeClientsCount = clients.filter(c => c.status === 'Active').length;
    document.getElementById('kpi-active-clients').textContent = activeClientsCount;

    // We aggregate totals for the latest billing month (e.g., June 2026 in mock data, or overall totals)
    let totalBilling = 0;
    let totalRetainers = 0;
    let totalCommissions = 0;
    let outstandingBilling = 0;

    transactions.forEach(t => {
        totalBilling += t.totalAmount;
        totalRetainers += t.retainerAmount;
        totalCommissions += t.commissionAmount;
        if (t.status === 'Pending') {
            outstandingBilling += t.totalAmount;
        }
    });

    document.getElementById('kpi-monthly-billing').textContent = formatCurrency(totalBilling);
    document.getElementById('kpi-retainer-share').textContent = formatCurrency(totalRetainers);
    document.getElementById('kpi-commission-share').textContent = formatCurrency(totalCommissions);
    document.getElementById('kpi-outstanding-billing').textContent = formatCurrency(outstandingBilling);

    // 2. Render Recent Invoices (limit to 5)
    const recentTableBody = document.querySelector('#recent-invoices-table tbody');
    recentTableBody.innerHTML = '';
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (sortedTransactions.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="8" class="text-muted text-center" style="text-align:center; padding: 24px;">No billing records found.</td></tr>`;
    } else {
        sortedTransactions.forEach(t => {
            const statusBadgeClass = t.status === 'Paid' ? 'badge-success' : 'badge-warning';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>#${t.id.toUpperCase()}</strong></td>
                <td>${t.clientName}${t.lobName ? ` <span class="text-muted small">(${t.lobName})</span>` : ''}</td>
                <td>${t.billingMonth}</td>
                <td>${formatCurrency(t.retainerAmount)}</td>
                <td>${formatCurrency(t.commissionAmount)}</td>
                <td><strong>${formatCurrency(t.totalAmount)}</strong></td>
                <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice('${t.id}')">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </button>
                </td>
            `;
            recentTableBody.appendChild(row);
        });
    }

    // 3. Render Chart
    renderChart();

    // 4. Populate Mini Calculator Client Select dropdown
    populateMiniCalcDropdown();
}

function renderChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }

    // Aggregate monthly data (grouped by billingMonth)
    const monthlySummary = {};
    transactions.forEach(t => {
        const month = t.billingMonth;
        if (!monthlySummary[month]) {
            monthlySummary[month] = { retainer: 0, commission: 0 };
        }
        monthlySummary[month].retainer += t.retainerAmount;
        monthlySummary[month].commission += t.commissionAmount;
    });

    // Sort months (simple alphabetical sort for mock data like "May 2026", "June 2026")
    const monthsSorted = Object.keys(monthlySummary).sort((a, b) => {
        // Parse date for comparison
        const da = new Date(a);
        const db = new Date(b);
        return da - db;
    });

    const retainerData = [];
    const commissionData = [];
    monthsSorted.forEach(m => {
        retainerData.push(monthlySummary[m].retainer);
        commissionData.push(monthlySummary[m].commission);
    });

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthsSorted,
            datasets: [
                {
                    label: 'Fixed Retainers',
                    data: retainerData,
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                },
                {
                    label: 'Commissions',
                    data: commissionData,
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f8fafc', font: { family: 'Inter' } }
                }
            }
        }
    });
}

// --- CLIENTS DIRECTORY CONTROLLER ---
function renderClients(filterQuery = '') {
    initData();
    const tableBody = document.querySelector('#clients-table tbody');
    tableBody.innerHTML = '';

    const filteredClients = clients.filter(c => {
        const term = filterQuery.toLowerCase();
        return c.name.toLowerCase().includes(term) ||
               c.contactName.toLowerCase().includes(term) ||
               c.billingModel.toLowerCase().includes(term) ||
               c.email.toLowerCase().includes(term);
    });

    if (filteredClients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding: 32px;">No clients found.</td></tr>`;
        return;
    }

    filteredClients.forEach(c => {
        let modelBadgeClass = 'badge-success';
        if (c.billingModel === 'Retainer') modelBadgeClass = 'badge-info';
        if (c.billingModel === 'Commission') modelBadgeClass = 'badge-warning';

        let commissionDetail = "-";
        if (c.billingModel !== 'Retainer') {
            commissionDetail = `${c.commissionPercent}% on ${c.commissionBase}`;
        }

        let statusClass = 'status-active';
        if (c.status === 'Upcoming') statusClass = 'status-upcoming';
        if (c.status === 'Paused') statusClass = 'status-paused';
        if (c.status === 'Terminated') statusClass = 'status-terminated';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="font-weight: 600; font-size: 15px;">${c.name}</div>
                <div class="text-muted small">Started: ${formatDate(c.startDate)}</div>
            </td>
            <td>
                <div>${c.contactName}</div>
                <div class="text-muted small">${c.email}</div>
                <div class="text-muted small">${c.phone}</div>
            </td>
            <td><span class="badge ${modelBadgeClass}">${c.billingModel}</span></td>
            <td><strong>${c.retainerRate > 0 ? formatCurrency(c.retainerRate) : "₹0"}</strong></td>
            <td>${commissionDetail}</td>
            <td>
                <span class="status-indicator ${statusClass}"></span>
                <span>${c.status}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editClient('${c.id}')" title="Edit Client Configuration">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteClient('${c.id}')" title="Remove Client">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    lucide.createIcons();
}

// Open Client Modal (Add mode)
document.getElementById('btn-add-client').addEventListener('click', () => {
    document.getElementById('client-modal-title').textContent = "Add New Client";
    document.getElementById('client-form').reset();
    document.getElementById('client-id-field').value = '';
    
    // Default setup fields visibility
    toggleClientBillingFields('Retainer');
    
    document.getElementById('modal-client').classList.add('active');
});

// Close Client Modal
document.getElementById('btn-close-client-modal').addEventListener('click', closeClientModal);
document.getElementById('btn-cancel-client-modal').addEventListener('click', closeClientModal);

function closeClientModal() {
    document.getElementById('modal-client').classList.remove('active');
}

// Toggle Billing configuration fields based on billingModel select
document.getElementById('client-model').addEventListener('change', (e) => {
    toggleClientBillingFields(e.target.value);
});

function toggleClientBillingFields(model) {
    const retainerGroup = document.getElementById('cfg-retainer-group');
    const commissionGroup = document.getElementById('cfg-commission-group');
    
    if (model === 'Retainer') {
        retainerGroup.style.display = 'block';
        commissionGroup.style.display = 'none';
    } else if (model === 'Commission') {
        retainerGroup.style.display = 'none';
        commissionGroup.style.display = 'block';
    } else if (model === 'Hybrid') {
        retainerGroup.style.display = 'block';
        commissionGroup.style.display = 'block';
    }
}

// Client Form submit logic (Add/Update)
document.getElementById('client-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('client-id-field').value;
    const name = document.getElementById('client-name').value;
    const contactName = document.getElementById('client-contact').value;
    const status = document.getElementById('client-status').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;
    const billingModel = document.getElementById('client-model').value;
    
    let retainerRate = 0;
    let commissionPercent = 0;
    let commissionBase = "None";

    if (billingModel === 'Retainer' || billingModel === 'Hybrid') {
        retainerRate = parseFloat(document.getElementById('client-retainer-rate').value) || 0;
    }
    if (billingModel === 'Commission' || billingModel === 'Hybrid') {
        commissionPercent = parseFloat(document.getElementById('client-commission-percent').value) || 0;
        commissionBase = document.getElementById('client-commission-base').value;
    }

    if (id) {
        // Edit Mode
        const index = clients.findIndex(c => c.id === id);
        if (index !== -1) {
            clients[index] = {
                ...clients[index],
                name, contactName, status, email, phone, billingModel, retainerRate, commissionPercent, commissionBase
            };
        }
    } else {
        // Add Mode
        const newClient = {
            id: generateId('c'),
            name, contactName, status, email, phone, billingModel, retainerRate, commissionPercent, commissionBase,
            startDate: new Date().toISOString().split('T')[0]
        };
        clients.push(newClient);
    }

    saveData();
    closeClientModal();
    renderClients();
    populateDropdowns();
});

// Edit Client Action
window.editClient = function(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    document.getElementById('client-modal-title').textContent = `Edit Client: ${client.name}`;
    document.getElementById('client-id-field').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-contact').value = client.contactName;
    document.getElementById('client-status').value = client.status;
    document.getElementById('client-email').value = client.email;
    document.getElementById('client-phone').value = client.phone;
    document.getElementById('client-model').value = client.billingModel;
    
    toggleClientBillingFields(client.billingModel);
    
    document.getElementById('client-retainer-rate').value = client.retainerRate;
    document.getElementById('client-commission-percent').value = client.commissionPercent;
    document.getElementById('client-commission-base').value = client.commissionBase;

    document.getElementById('modal-client').classList.add('active');
};

// Delete Client Action
window.deleteClient = function(id) {
    if (confirm("Are you sure you want to delete this client? All billing summaries remain but configurations are removed.")) {
        clients = clients.filter(c => c.id !== id);
        saveData();
        renderClients();
        populateDropdowns();
    }
};

// Client Search Handler
document.getElementById('search-clients').addEventListener('input', (e) => {
    renderClients(e.target.value);
});


// --- BILLING LEDGER CONTROLLER ---
function renderBillingLedger() {
    initData();
    const tableBody = document.querySelector('#billing-ledger-table tbody');
    tableBody.innerHTML = '';

    const filterClient = document.getElementById('filter-billing-client').value;
    const filterStatus = document.getElementById('filter-billing-status').value;

    const filteredTransactions = transactions.filter(t => {
        const clientMatch = filterClient === 'all' || t.clientId === filterClient;
        const statusMatch = filterStatus === 'all' || t.status === filterStatus;
        return clientMatch && statusMatch;
    });

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-muted" style="text-align:center; padding: 32px;">No billing ledger entries found.</td></tr>`;
        return;
    }

    // Sort by latest transaction date
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    filteredTransactions.forEach(t => {
        const statusBadgeClass = t.status === 'Paid' ? 'badge-success' : 'badge-warning';
        
        let basisValDesc = "-";
        if (t.variableBaseAmount > 0) {
            // Find base model from client definition or log
            basisValDesc = `${formatCurrency(t.variableBaseAmount)}`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${t.id.toUpperCase()}</strong></td>
            <td>${t.clientName}${t.lobName ? ` <span class="text-muted small">(${t.lobName})</span>` : ''}</td>
            <td>${t.billingMonth}</td>
            <td>${basisValDesc}</td>
            <td>${formatCurrency(t.retainerAmount)}</td>
            <td>${formatCurrency(t.commissionAmount)}</td>
            <td><strong>${formatCurrency(t.totalAmount)}</strong></td>
            <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice('${t.id}')">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </button>
                    ${t.status === 'Pending' ? `
                        <button class="btn btn-sm btn-primary" onclick="markAsPaid('${t.id}')" style="background-color: var(--success);">
                            <i data-lucide="check" style="width: 14px; height: 14px;"></i> Pay
                        </button>
                    ` : ''}
                    <button class="btn-icon delete" onclick="deleteTransaction('${t.id}')" title="Delete record">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    lucide.createIcons();
}

// Mark Transaction Status as Paid
window.markAsPaid = function(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        transaction.status = 'Paid';
        saveData();
        renderBillingLedger();
    }
};

// Delete Transaction Record
window.deleteTransaction = function(id) {
    if (confirm("Are you sure you want to delete this billing ledger record? This will change historical metrics.")) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderBillingLedger();
    }
};

// Populate filters and forms dropdowns
function populateDropdowns() {
    initData();
    
    // Populate client filter list in Billing Ledger
    const filterSelect = document.getElementById('filter-billing-client');
    filterSelect.innerHTML = `<option value="all">All Clients</option>`;
    
    // Populate log billing dialog client select
    const logBillSelect = document.getElementById('log-bill-client');
    logBillSelect.innerHTML = `<option value="">Choose Client...</option>`;
    
    // Populate full calc dropdown
    const calcSelect = document.getElementById('calc-client');
    calcSelect.innerHTML = `<option value="">Select a Client...</option>`;

    clients.forEach(c => {
        // filter
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filterSelect.appendChild(opt);

        // log invoice dropdown (active and upcoming clients)
        if (c.status === 'Active' || c.status === 'Upcoming') {
            const optLog = document.createElement('option');
            optLog.value = c.id;
            optLog.textContent = c.name;
            logBillSelect.appendChild(optLog);

            const optCalc = document.createElement('option');
            optCalc.value = c.id;
            optCalc.textContent = c.name;
            calcSelect.appendChild(optCalc);
        }
    });
}

// Populate client selection in Dashboard Mini-calculator
function populateMiniCalcDropdown() {
    const miniCalcSelect = document.getElementById('mini-calc-client');
    miniCalcSelect.innerHTML = `<option value="">Choose Client...</option>`;
    
    clients.forEach(c => {
        if (c.status === 'Active' || c.status === 'Upcoming') {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            miniCalcSelect.appendChild(opt);
        }
    });
}

// Listeners for ledger filter changes
document.getElementById('filter-billing-client').addEventListener('change', renderBillingLedger);
document.getElementById('filter-billing-status').addEventListener('change', renderBillingLedger);


// --- LOG BILL MODAL CONTROLLER ---
document.getElementById('btn-quick-bill').addEventListener('click', openBillingModal);
document.getElementById('btn-create-bill').addEventListener('click', openBillingModal);

function openBillingModal() {
    document.getElementById('billing-form').reset();
    hideLogBillGroups();

    // Hide onboarding alert and reset submit/lob controls
    document.getElementById('log-bill-onboarding-alert').style.display = 'none';
    document.querySelector('#billing-form button[type="submit"]').disabled = false;
    document.getElementById('log-bill-lob').disabled = false;
    
    // Clear LOB dropdown options
    const lobSelect = document.getElementById('log-bill-lob');
    lobSelect.innerHTML = `<option value="">Select LOB...</option>`;
    
    // Set default month to current month
    const now = new Date();
    const currentMonthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('log-bill-month').value = currentMonthVal;

    document.getElementById('modal-billing').classList.add('active');
}

document.getElementById('btn-close-billing-modal').addEventListener('click', closeBillingModal);
document.getElementById('btn-cancel-billing-modal').addEventListener('click', closeBillingModal);

function closeBillingModal() {
    document.getElementById('modal-billing').classList.remove('active');
}

function hideLogBillGroups() {
    document.getElementById('log-bill-terms-info').style.display = 'none';
    document.getElementById('log-bill-variable-group').style.display = 'none';
    document.getElementById('log-bill-fixed-group').style.display = 'none';
    document.getElementById('log-bill-kpi-group').style.display = 'none';
    document.getElementById('log-bill-summary-box').style.display = 'none';
}

// Handle Client Select on Log Bill form
document.getElementById('log-bill-client').addEventListener('change', (e) => {
    const clientId = e.target.value;
    const lobSelect = document.getElementById('log-bill-lob');
    lobSelect.innerHTML = `<option value="">Select LOB...</option>`;
    
    const alertBox = document.getElementById('log-bill-onboarding-alert');
    const submitBtn = document.querySelector('#billing-form button[type="submit"]');

    if (!clientId) {
        alertBox.style.display = 'none';
        submitBtn.disabled = false;
        lobSelect.disabled = false;
        hideLogBillGroups();
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Block Upcoming Clients from billing logging
    if (client.status === 'Upcoming') {
        alertBox.style.display = 'flex';
        submitBtn.disabled = true;
        lobSelect.disabled = true;
        hideLogBillGroups();
        return;
    } else {
        alertBox.style.display = 'none';
        submitBtn.disabled = false;
        lobSelect.disabled = false;
    }

    if (!client.lobs) return;

    // Populate LOBs dropdown
    client.lobs.forEach(lob => {
        const opt = document.createElement('option');
        opt.value = lob.name;
        opt.textContent = lob.name;
        lobSelect.appendChild(opt);
    });

    // If only one LOB exists, auto select and trigger it
    if (client.lobs.length === 1) {
        lobSelect.value = client.lobs[0].name;
        triggerLogBillLobChange(client, client.lobs[0]);
    } else {
        hideLogBillGroups();
    }
});

// Handle LOB Select on Log Bill form
document.getElementById('log-bill-lob').addEventListener('change', (e) => {
    const clientId = document.getElementById('log-bill-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const lobName = e.target.value;
    if (!lobName) {
        hideLogBillGroups();
        return;
    }

    const lob = client.lobs.find(l => l.name === lobName);
    if (!lob) return;

    triggerLogBillLobChange(client, lob);
});

function triggerLogBillLobChange(client, lob) {
    hideLogBillGroups();

    // Show Terms Badge
    const termsBox = document.getElementById('log-bill-terms-info');
    termsBox.style.display = 'flex';
    
    let termsHTML = `<div><strong>LOB:</strong> ${lob.name}</div>`;
    if (lob.billingModel === 'SplitRetainer') {
        termsHTML += `
            <div><strong>Model:</strong> Split Retainer (85/15)</div>
            <div><strong>Total Retainer:</strong> ${formatCurrency(lob.totalRetainer)}</div>
            <div><strong>Fixed Share:</strong> ${lob.fixedSharePercent}%</div>
        `;
    } else if (lob.billingModel === 'Retainer') {
        termsHTML += `
            <div><strong>Model:</strong> Fixed Retainer</div>
            <div><strong>Total Retainer:</strong> ${formatCurrency(lob.totalRetainer)}</div>
        `;
    } else if (lob.billingModel === 'Hybrid') {
        termsHTML += `
            <div><strong>Model:</strong> Hybrid (Fixed + Commission)</div>
            <div><strong>Fixed:</strong> ${formatCurrency(lob.totalRetainer)}</div>
            <div><strong>Commission:</strong> ${lob.commissionPercent}% on ${lob.commissionBase}</div>
        `;
    } else if (lob.billingModel === 'Commission') {
        termsHTML += `
            <div><strong>Model:</strong> Commission Only</div>
            <div><strong>Commission:</strong> ${lob.commissionPercent}% on ${lob.commissionBase}</div>
        `;
    }
    termsBox.innerHTML = termsHTML;

    // Show/hide inputs
    if (lob.billingModel === 'SplitRetainer') {
        // Show Billing Type selection
        document.getElementById('log-bill-type-group').style.display = 'block';
        document.getElementById('log-bill-type').value = 'Fixed'; // Default to Fixed
        
        triggerLogBillTypeChange(client, lob);
    } else {
        // Hide Billing Type selection
        document.getElementById('log-bill-type-group').style.display = 'none';

        if (lob.billingModel === 'Retainer') {
            // Lock fixed retainer
            document.getElementById('log-bill-fixed-group').style.display = 'block';
            document.getElementById('log-bill-fixed-value').value = lob.totalRetainer;

            // Hide others
            document.getElementById('log-bill-kpi-group').style.display = 'none';
            document.getElementById('log-bill-variable-group').style.display = 'none';
            document.getElementById('log-bill-variable-value').value = '';
        } else if (lob.billingModel === 'Hybrid') {
            // Lock fixed retainer
            document.getElementById('log-bill-fixed-group').style.display = 'block';
            document.getElementById('log-bill-fixed-value').value = lob.totalRetainer;

            // Show monthly base spend
            document.getElementById('log-bill-variable-group').style.display = 'block';
            document.getElementById('lbl-log-bill-variable-value').textContent = `Monthly Base Value (${lob.commissionBase}) (INR)`;
            document.getElementById('log-bill-variable-value').value = '';

            // Hide KPI
            document.getElementById('log-bill-kpi-group').style.display = 'none';
        } else if (lob.billingModel === 'Commission') {
            // Hide Fixed retainer
            document.getElementById('log-bill-fixed-group').style.display = 'none';
            document.getElementById('log-bill-fixed-value').value = '';

            // Show monthly base spend
            document.getElementById('log-bill-variable-group').style.display = 'block';
            document.getElementById('lbl-log-bill-variable-value').textContent = `Monthly Base Value (${lob.commissionBase}) (INR)`;
            document.getElementById('log-bill-variable-value').value = '';

            // Hide KPI
            document.getElementById('log-bill-kpi-group').style.display = 'none';
        }

        runLogBillCalculation();
    }
}

// Handle Billing Type Change
document.getElementById('log-bill-type').addEventListener('change', () => {
    const clientId = document.getElementById('log-bill-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const lobName = document.getElementById('log-bill-lob').value;
    const lob = client.lobs.find(l => l.name === lobName);
    if (!lob) return;

    triggerLogBillTypeChange(client, lob);
});

function triggerLogBillTypeChange(client, lob) {
    const billType = document.getElementById('log-bill-type').value;

    if (lob.billingModel === 'SplitRetainer') {
        if (billType === 'Fixed') {
            // Show Fixed Retainer group (Read-only)
            document.getElementById('log-bill-fixed-group').style.display = 'block';
            const fixedVal = lob.fixedAmount !== undefined ? lob.fixedAmount : lob.totalRetainer * (lob.fixedSharePercent / 100);
            document.getElementById('log-bill-fixed-value').value = fixedVal;

            // Hide KPI & Variable
            document.getElementById('log-bill-kpi-group').style.display = 'none';
            document.getElementById('log-bill-variable-group').style.display = 'none';
        } else if (billType === 'Variable') {
            // Hide Fixed Retainer
            document.getElementById('log-bill-fixed-group').style.display = 'none';
            document.getElementById('log-bill-fixed-value').value = '0';

            // Show KPI Group
            document.getElementById('log-bill-kpi-group').style.display = 'block';
            document.getElementById('log-bill-kpi-value').value = 100;

            // Hide Variable group
            document.getElementById('log-bill-variable-group').style.display = 'none';
        }
    }
    
    runLogBillCalculation();
}

function runLogBillCalculation() {
    const clientId = document.getElementById('log-bill-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const lobName = document.getElementById('log-bill-lob').value;
    if (!lobName) return;

    const lob = client.lobs.find(l => l.name === lobName);
    if (!lob) return;

    let retainerAmt = 0;
    let commissionAmt = 0;
    let baseVal = parseFloat(document.getElementById('log-bill-variable-value').value) || 0;
    let kpiVal = parseFloat(document.getElementById('log-bill-kpi-value').value) || 0;
    if (kpiVal < 0) kpiVal = 0;
    if (kpiVal > 100) kpiVal = 100;

    if (lob.billingModel === 'SplitRetainer') {
        const billType = document.getElementById('log-bill-type').value;
        if (billType === 'Fixed') {
            retainerAmt = lob.fixedAmount !== undefined ? lob.fixedAmount : lob.totalRetainer * (lob.fixedSharePercent / 100);
            commissionAmt = 0;
        } else if (billType === 'Variable') {
            retainerAmt = 0;
            const maxVarAmt = lob.variableAmount !== undefined ? lob.variableAmount : lob.totalRetainer * (lob.variableSharePercent / 100);
            commissionAmt = maxVarAmt * (kpiVal / 100);
        }
    } else if (lob.billingModel === 'Retainer') {
        retainerAmt = lob.totalRetainer;
        commissionAmt = 0;
    } else if (lob.billingModel === 'Hybrid') {
        retainerAmt = lob.totalRetainer;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    } else if (lob.billingModel === 'Commission') {
        retainerAmt = 0;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    }

    const total = retainerAmt + commissionAmt;

    document.getElementById('log-bill-calc-retainer').textContent = formatCurrency(retainerAmt);
    document.getElementById('log-bill-calc-commission').textContent = formatCurrency(commissionAmt);
    document.getElementById('log-bill-calc-total').textContent = formatCurrency(total);
    document.getElementById('log-bill-summary-box').style.display = 'block';
}

// Live calculation triggers on Log Bill inputs
document.getElementById('log-bill-variable-value').addEventListener('input', runLogBillCalculation);
document.getElementById('log-bill-kpi-value').addEventListener('input', runLogBillCalculation);

// Log Bill Submit handler
document.getElementById('billing-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const clientId = document.getElementById('log-bill-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const lobName = document.getElementById('log-bill-lob').value;
    const lob = client.lobs.find(l => l.name === lobName);
    if (!lob) return;

    const rawMonth = document.getElementById('log-bill-month').value; // e.g. "2026-07"
    const dateObj = new Date(rawMonth + "-01");
    const formattedMonth = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); // e.g. "July 2026"

    const baseVal = parseFloat(document.getElementById('log-bill-variable-value').value) || 0;
    const kpiVal = parseFloat(document.getElementById('log-bill-kpi-value').value) || 0;
    const billType = lob.billingModel === 'SplitRetainer' ? document.getElementById('log-bill-type').value : null;

    let retainerAmt = 0;
    let commissionAmt = 0;

    if (lob.billingModel === 'SplitRetainer') {
        if (billType === 'Fixed') {
            retainerAmt = lob.fixedAmount !== undefined ? lob.fixedAmount : lob.totalRetainer * (lob.fixedSharePercent / 100);
            commissionAmt = 0;
        } else if (billType === 'Variable') {
            retainerAmt = 0;
            const maxVarAmt = lob.variableAmount !== undefined ? lob.variableAmount : lob.totalRetainer * (lob.variableSharePercent / 100);
            commissionAmt = maxVarAmt * (kpiVal / 100);
        }
    } else if (lob.billingModel === 'Retainer') {
        retainerAmt = lob.totalRetainer;
        commissionAmt = 0;
    } else if (lob.billingModel === 'Hybrid') {
        retainerAmt = lob.totalRetainer;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    } else if (lob.billingModel === 'Commission') {
        retainerAmt = 0;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    }

    const total = retainerAmt + commissionAmt;

    const newTx = {
        id: generateId('t'),
        clientId: client.id,
        clientName: client.name,
        lobName: lob.name,
        billingType: billType,
        date: new Date().toISOString().split('T')[0],
        billingMonth: formattedMonth,
        retainerAmount: retainerAmt,
        commissionAmount: commissionAmt,
        variableBaseAmount: baseVal,
        kpiAchievement: lob.billingModel === 'SplitRetainer' && billType === 'Variable' ? kpiVal : null,
        totalAmount: total,
        status: "Pending", // Set as pending for new records
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days due
    };

    transactions.push(newTx);
    saveData();
    closeBillingModal();
    
    // Redirect to billing list
    switchTab('billing');
});


// --- COMMISSION CALCULATOR TAB CONTROLLER ---
function resetCalculator() {
    document.getElementById('full-calculator-form').reset();
    document.getElementById('calc-client-config-box').style.display = 'none';
    document.getElementById('calc-inputs-section').style.display = 'none';
    document.getElementById('calc-results-section').style.display = 'none';
    document.getElementById('calc-onboarding-alert').style.display = 'none';
    document.getElementById('btn-calc-calculate').disabled = false;
    document.getElementById('btn-calc-save').disabled = true;

    // Default month selector to current month
    const now = new Date();
    const currentMonthVal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('calc-billing-month').value = currentMonthVal;
}

// Client Change on Main Calculator
document.getElementById('calc-client').addEventListener('change', (e) => {
    const clientId = e.target.value;
    const alertBox = document.getElementById('calc-onboarding-alert');
    const calcBtn = document.getElementById('btn-calc-calculate');

    if (!clientId) {
        resetCalculator();
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (client.status === 'Upcoming') {
        alertBox.style.display = 'flex';
        calcBtn.disabled = true;
        document.getElementById('calc-client-config-box').style.display = 'none';
        document.getElementById('calc-inputs-section').style.display = 'none';
        document.getElementById('calc-results-section').style.display = 'none';
        document.getElementById('btn-calc-save').disabled = true;
        return;
    } else {
        alertBox.style.display = 'none';
        calcBtn.disabled = false;
    }

    // Show Terms box
    document.getElementById('calc-client-config-box').style.display = 'block';
    
    // Use first LOB details for general config preview
    const lob = client.lobs && client.lobs.length > 0 ? client.lobs[0] : {
        billingModel: 'Retainer',
        totalRetainer: 0,
        commissionPercent: 0,
        commissionBase: 'None'
    };

    document.getElementById('calc-preview-model').textContent = lob.billingModel;
    document.getElementById('calc-preview-retainer').textContent = formatCurrency(lob.totalRetainer);
    document.getElementById('calc-preview-commission-rate').textContent = lob.billingModel !== 'Retainer' ? `${lob.commissionPercent}%` : '0%';
    document.getElementById('calc-preview-base').textContent = lob.commissionBase || 'None';

    // Show input fields if dynamic commission model
    const inputSection = document.getElementById('calc-inputs-section');
    if (lob.billingModel === 'Retainer' || lob.billingModel === 'SplitRetainer') {
        inputSection.style.display = 'none';
        document.getElementById('calc-variable-base').value = '';
    } else {
        inputSection.style.display = 'block';
        document.getElementById('lbl-calc-variable-base').textContent = `Monthly performance value (${lob.commissionBase}) (INR)`;
        document.getElementById('calc-variable-base').value = '';
    }

    // Hide results screen till user clicks calculate
    document.getElementById('calc-results-section').style.display = 'none';
    document.getElementById('btn-calc-save').disabled = true;
});

// Trigger Calculation
document.getElementById('btn-calc-calculate').addEventListener('click', () => {
    const clientId = document.getElementById('calc-client').value;
    if (!clientId) {
        alert("Please select a client first.");
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const baseVal = parseFloat(document.getElementById('calc-variable-base').value) || 0;
    
    let retainerAmt = client.retainerRate || 0;
    let commissionAmt = 0;

    if (client.billingModel === 'Commission' || client.billingModel === 'Hybrid') {
        commissionAmt = (baseVal * (client.commissionPercent / 100));
    }

    const total = retainerAmt + commissionAmt;

    // Display Breakdown
    document.getElementById('calc-results-section').style.display = 'block';
    document.getElementById('breakdown-retainer').textContent = formatCurrency(retainerAmt);
    document.getElementById('breakdown-comm-perc').textContent = `${client.commissionPercent}%`;
    document.getElementById('breakdown-commission').textContent = formatCurrency(commissionAmt);
    document.getElementById('breakdown-total').textContent = formatCurrency(total);

    // Enable Save action
    document.getElementById('btn-calc-save').disabled = false;
});

// Submit/Save Calculator transaction
document.getElementById('full-calculator-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const clientId = document.getElementById('calc-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const rawMonth = document.getElementById('calc-billing-month').value;
    const dateObj = new Date(rawMonth + "-01");
    const formattedMonth = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    const baseVal = parseFloat(document.getElementById('calc-variable-base').value) || 0;

    let retainerAmt = client.retainerRate || 0;
    let commissionAmt = 0;

    if (client.billingModel === 'Commission' || client.billingModel === 'Hybrid') {
        commissionAmt = (baseVal * (client.commissionPercent / 100));
    }

    const total = retainerAmt + commissionAmt;
    const newTxId = generateId('t');

    const newTx = {
        id: newTxId,
        clientId: client.id,
        clientName: client.name,
        date: new Date().toISOString().split('T')[0],
        billingMonth: formattedMonth,
        retainerAmount: retainerAmt,
        commissionAmount: commissionAmt,
        variableBaseAmount: baseVal,
        totalAmount: total,
        status: "Pending",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    transactions.push(newTx);
    saveData();

    // Redirect straight to invoice display
    viewInvoice(newTxId);
});


// --- DASHBOARD MINI ESTIMATOR WIDGET CONTROLLER ---
document.getElementById('mini-calc-client').addEventListener('change', (e) => {
    const clientId = e.target.value;
    const miniSaveBtn = document.getElementById('btn-mini-save');
    
    if (!clientId) {
        document.getElementById('mini-res-retainer').textContent = "₹0";
        document.getElementById('mini-res-commission').textContent = "₹0";
        document.getElementById('mini-res-comm-label').textContent = "Commission (0%):";
        document.getElementById('mini-res-total').textContent = "₹0";
        miniSaveBtn.disabled = true;
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Update Label based on commission metric type
    document.getElementById('lbl-mini-calc-base').textContent = client.billingModel !== 'Retainer' 
        ? `Monthly ${client.commissionBase} (INR)` 
        : 'Fixed billing (no var metric)';

    // Trigger update calculation
    runMiniCalculation(client);
});

document.getElementById('mini-calc-base').addEventListener('input', () => {
    const clientId = document.getElementById('mini-calc-client').value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
        runMiniCalculation(client);
    }
});

function runMiniCalculation(client) {
    const baseVal = parseFloat(document.getElementById('mini-calc-base').value) || 0;
    
    let retainerAmt = client.retainerRate || 0;
    let commissionAmt = 0;

    if (client.billingModel === 'Commission' || client.billingModel === 'Hybrid') {
        commissionAmt = (baseVal * (client.commissionPercent / 100));
    }

    const total = retainerAmt + commissionAmt;

    document.getElementById('mini-res-retainer').textContent = formatCurrency(retainerAmt);
    document.getElementById('mini-res-comm-label').textContent = `Commission (${client.commissionPercent}%):`;
    document.getElementById('mini-res-commission').textContent = formatCurrency(commissionAmt);
    document.getElementById('mini-res-total').textContent = formatCurrency(total);

    document.getElementById('btn-mini-save').disabled = false;
}

// Mini Calc Save Button Clicked
document.getElementById('btn-mini-save').addEventListener('click', () => {
    const clientId = document.getElementById('mini-calc-client').value;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const baseVal = parseFloat(document.getElementById('mini-calc-base').value) || 0;
    
    const now = new Date();
    const formattedMonth = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

    let retainerAmt = client.retainerRate || 0;
    let commissionAmt = 0;

    if (client.billingModel === 'Commission' || client.billingModel === 'Hybrid') {
        commissionAmt = (baseVal * (client.commissionPercent / 100));
    }

    const total = retainerAmt + commissionAmt;
    const newTxId = generateId('t');

    const newTx = {
        id: newTxId,
        clientId: client.id,
        clientName: client.name,
        date: now.toISOString().split('T')[0],
        billingMonth: formattedMonth,
        retainerAmount: retainerAmt,
        commissionAmount: commissionAmt,
        variableBaseAmount: baseVal,
        totalAmount: total,
        status: "Pending",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    transactions.push(newTx);
    saveData();

    // Reset Mini estimator form
    document.getElementById('mini-calc-form').reset();
    document.getElementById('btn-mini-save').disabled = true;
    document.getElementById('mini-res-retainer').textContent = "₹0";
    document.getElementById('mini-res-commission').textContent = "₹0";
    document.getElementById('mini-res-comm-label').textContent = "Commission (0%):";
    document.getElementById('mini-res-total').textContent = "₹0";

    // Switch view to invoice viewer
    viewInvoice(newTxId);
});


// --- INVOICE VIEW CONTROLLER ---
window.viewInvoice = function(transactionId) {
    initData();
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx) {
        alert("Transaction invoice not found.");
        return;
    }

    const client = clients.find(c => c.id === tx.clientId) || {
        name: tx.clientName,
        contactName: "Contact Person",
        email: "contact@clientcompany.com",
        phone: "+91 99999 88888",
        lobs: []
    };

    const lob = client.lobs ? client.lobs.find(l => l.name === tx.lobName) : null;

    // Switch tab silently to invoice-viewer (so navigation styling highlights it)
    switchTab('invoice-viewer');

    // Populate Fields
    const badge = document.getElementById('inv-status');
    badge.textContent = tx.status.toUpperCase();
    if (tx.status === 'Paid') {
        badge.className = 'invoice-badge badge-success';
    } else {
        badge.className = 'invoice-badge badge-warning';
    }

    document.getElementById('inv-id').textContent = tx.id.toUpperCase();
    document.getElementById('inv-date').textContent = formatDate(tx.date);
    document.getElementById('inv-client-name').textContent = tx.lobName ? `${tx.clientName} (${tx.lobName})` : tx.clientName;
    document.getElementById('inv-client-contact').textContent = client.contactName;
    document.getElementById('inv-client-email').textContent = client.email;
    document.getElementById('inv-client-phone').textContent = client.phone;

    // Line Items Details
    const rowRetainer = document.getElementById('inv-row-retainer');
    const rowCommission = document.getElementById('inv-row-commission');

    document.getElementById('inv-row-month').textContent = tx.billingMonth;
    document.getElementById('inv-row-month-comm').textContent = tx.billingMonth;

    if (lob && lob.billingModel === 'SplitRetainer') {
        // Retainer fixed share
        rowRetainer.style.display = 'table-row';
        rowRetainer.querySelector('td:nth-child(2)').textContent = `Fixed Monthly Retainer Service Fee (${lob.fixedSharePercent}% share)`;
        rowRetainer.querySelector('td:nth-child(3)').textContent = `-`;
        document.getElementById('inv-rate-retainer').textContent = formatCurrency(tx.retainerAmount);
        document.getElementById('inv-total-retainer').textContent = formatCurrency(tx.retainerAmount);

        // Variable KPI share
        rowCommission.style.display = 'table-row';
        rowCommission.querySelector('td:nth-child(2)').textContent = `KPI Variable Performance Retainer Share (${lob.variableSharePercent}% share x ${tx.kpiAchievement || 0}% score)`;
        document.getElementById('inv-comm-rate-badge').textContent = `${lob.variableSharePercent}%`;
        document.getElementById('inv-comm-basis').textContent = `Target KPI rating: ${tx.kpiAchievement || 0}%`;
        document.getElementById('inv-comm-rate-val').textContent = `${lob.variableSharePercent}% max`;
        document.getElementById('inv-total-commission').textContent = formatCurrency(tx.commissionAmount);
    } else {
        // Standard model display
        if (tx.retainerAmount > 0) {
            rowRetainer.style.display = 'table-row';
            rowRetainer.querySelector('td:nth-child(2)').textContent = "Fixed Monthly Retainer Service Fee";
            rowRetainer.querySelector('td:nth-child(3)').textContent = "-";
            document.getElementById('inv-rate-retainer').textContent = formatCurrency(tx.retainerAmount);
            document.getElementById('inv-total-retainer').textContent = formatCurrency(tx.retainerAmount);
        } else {
            rowRetainer.style.display = 'none';
        }

        if (tx.commissionAmount > 0) {
            rowCommission.style.display = 'table-row';
            rowCommission.querySelector('td:nth-child(2)').textContent = `Performance Commission Billing (${lob ? lob.commissionPercent : (tx.variableBaseAmount > 0 ? ((tx.commissionAmount / tx.variableBaseAmount) * 100).toFixed(1) : 0)}%)`;
            document.getElementById('inv-comm-rate-badge').textContent = `${lob ? lob.commissionPercent : 0}%`;
            document.getElementById('inv-comm-basis').textContent = `${formatCurrency(tx.variableBaseAmount)} (${lob ? lob.commissionBase : 'Basis Metric'})`;
            document.getElementById('inv-comm-rate-val').textContent = `${lob ? lob.commissionPercent : 0}%`;
            document.getElementById('inv-total-commission').textContent = formatCurrency(tx.commissionAmount);
        } else {
            rowCommission.style.display = 'none';
        }
    }

    // Invoice Calculations (with GST 18%)
    const subtotal = tx.totalAmount;
    const gst = subtotal * 0.18;
    const grandTotal = subtotal + gst;

    document.getElementById('inv-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('inv-gst').textContent = formatCurrency(gst);
    document.getElementById('inv-grand-total').textContent = formatCurrency(grandTotal);
};


// --- INITIAL STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // Current date on topbar
    const dateSpan = document.getElementById('current-date');
    if (dateSpan) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        dateSpan.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // Set Navigation active listeners
    document.querySelectorAll('.sidebar-menu .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            switchTab(target);
        });
    });

    initData();
    populateDropdowns();
    switchTab('dashboard'); // Start on Dashboard
});
