// ERP KK-Retainer App Controller Logic

// --- STATE MANAGEMENT ---
let clients = [];
let transactions = [];
let revenueChart = null;

// Initialize app data
async function initData() {
    try {
        const { db, collection, getDocs } = await import('./auth.js');
        
        // Fetch clients
        const clientsSnap = await getDocs(collection(db, 'clients'));
        clients = [];
        clientsSnap.forEach(doc => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        
        // Fetch transactions
        const txSnap = await getDocs(collection(db, 'transactions'));
        transactions = [];
        txSnap.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        
    } catch (err) {
        console.error("Failed to fetch data from Firestore:", err);
    }
}

async function logAuditAction(action, details) {
    try {
        const { db, collection, addDoc, serverTimestamp, auth } = await import('./auth.js');
        if (!auth.currentUser) return;
        
        await addDoc(collection(db, 'audit_logs'), {
            action: action,
            userEmail: auth.currentUser.email,
            userName: auth.currentUser.displayName || 'Unknown',
            timestamp: serverTimestamp(),
            details: details
        });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}

function saveData() {
    // No-op. Data is now saved directly to Firestore via specific functions.
}

function safeCreateIcons() {
    try {
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
            lucide.createIcons();
            if (window.currentUserRole && window.applyRBAC) {
                window.applyRBAC(window.currentUserRole);
            }
        } else {
            console.warn("Lucide library not loaded yet.");
        }
    } catch (e) {
        console.error("Lucide failed to render icons:", e);
    }
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
    'invoice-viewer': { title: 'Invoice Hub', subtitle: 'View, export, and print client invoices.' },
    'audit-logs': { title: 'System Audit Trail', subtitle: 'Immutable log of all system actions and approvals.' }
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
        closeClientDetails();
        renderClients();
    } else if (targetId === 'billing') {
        renderBillingLedger();
    } else if (targetId === 'calculator') {
        resetCalculator();
    } else if (targetId === 'audit-logs') {
        if (window.loadAuditLogs) window.loadAuditLogs();
    }

    // Recalculate icons
    safeCreateIcons();
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
        const st = (t.status || '').toUpperCase();
        if (st === 'APPROVED' || st === 'PAID') {
            totalBilling += t.totalAmount;
            totalRetainers += t.retainerAmount;
            totalCommissions += t.commissionAmount;
        }
        if (st === 'PENDING APPROVAL' || st === 'PENDING' || st === 'BILLING INITIATED') {
            outstandingBilling += t.totalAmount;
        }
    });

    document.getElementById('kpi-monthly-billing').textContent = formatCurrency(totalBilling);
    document.getElementById('kpi-retainer-share').textContent = formatCurrency(totalRetainers);
    document.getElementById('kpi-commission-share').textContent = formatCurrency(totalCommissions);

    // 2. Render Recent Invoices (limit to 5)
    const recentTableBody = document.querySelector('#recent-invoices-table tbody');
    recentTableBody.innerHTML = '';
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (sortedTransactions.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="8" class="text-muted text-center" style="text-align:center; padding: 24px;">No billing records found.</td></tr>`;
    } else {
        sortedTransactions.forEach(t => {
            let statusBadgeClass = 'badge-warning';
            const st = (t.status || '').toUpperCase();
            if (st === 'PAID' || st === 'APPROVED') statusBadgeClass = 'badge-success';
            else if (st === 'REJECTED') statusBadgeClass = 'badge-danger';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${t.invoiceNumber ? t.invoiceNumber : `#${t.id.toUpperCase()}`}</strong></td>
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
    try {
        renderChart();
    } catch (e) {
        console.error("Failed to render chart:", e);
    }

    // 4. Populate Mini Calculator Client Select dropdown
    populateMiniCalcDropdown();

    // 5. Render Billing Action Alerts
    renderBillingAlerts();
}

function renderBillingAlerts() {
    const alertsContainer = document.getElementById('billing-alerts-container');
    if (!alertsContainer) return;
    alertsContainer.innerHTML = '';

    const activeClients = clients.filter(c => c.status === 'Active');
    
    // Determine the current month dynamically
    const now = new Date();
    const currentMonthName = now.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();
    const currentMonthStr = `${currentMonthName} ${currentYear}`; // e.g. "July 2026" (current month context)

    const pendingAlerts = [];

    activeClients.forEach(c => {
        // Check if there is any valid (non-rejected) logged billing transaction in the current billingMonth
        const hasBilled = transactions.some(t => {
            const st = (t.status || '').toUpperCase();
            return t.clientId === c.id && t.billingMonth === currentMonthStr && st !== 'REJECTED';
        });
        if (!hasBilled) {
            pendingAlerts.push(c);
        }
    });

    if (pendingAlerts.length === 0) {
        alertsContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--success); gap: 12px; padding: 24px; margin: auto 0;">
                <i data-lucide="check-circle" style="width: 40px; height: 40px; color: var(--success);"></i>
                <div>
                    <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--success);">All retainers up to date!</h4>
                    <p class="text-muted small" style="margin: 4px 0 0 0; font-size: 11px;">No pending retainer bills for ${currentMonthName}.</p>
                </div>
            </div>
        `;
    } else {
        pendingAlerts.forEach(c => {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.style.cssText = `
                background-color: rgba(239, 68, 68, 0.05); 
                border-left: 4px solid var(--danger); 
                padding: 10px 12px; 
                border-radius: var(--border-radius-sm); 
                display: flex; 
                align-items: center; 
                justify-content: space-between; 
                gap: 8px;
                border-top: 1px solid rgba(239, 68, 68, 0.08);
                border-bottom: 1px solid rgba(239, 68, 68, 0.08);
                border-right: 1px solid rgba(239, 68, 68, 0.08);
            `;
            alertItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex-grow: 1;">
                    <i data-lucide="alert-triangle" style="width: 14px; height: 14px; color: var(--danger); flex-shrink: 0;"></i>
                    <span style="font-size: 12px; font-weight: 500; color: #fca5a5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        Retainer billing pending for ${c.name} - ${currentMonthName}
                    </span>
                </div>
                <button class="btn btn-sm btn-primary" onclick="quickLogBillingForClient('${c.id}')" style="padding: 2px 8px; font-size: 10.5px; font-weight: 600; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; gap: 4px; border-radius: var(--border-radius-sm);">
                    <i data-lucide="plus-circle" style="width: 11px; height: 11px;"></i> Log Bill
                </button>
            `;
            alertsContainer.appendChild(alertItem);
        });
    }

    safeCreateIcons();
}

window.quickLogBillingForClient = function(clientId) {
    openBillingModal();
    const select = document.getElementById('log-bill-client');
    select.value = clientId;
    const event = new Event('change');
    select.dispatchEvent(event);
};

function renderChart() {
    // Financial Performance Chart has been removed by user request.
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
        let billingModelStr = "";
        let commissionDetail = "";
        let modelBadgeClass = "";
        let isWaiting = false;

        if (c.name === "Airtel") {
            billingModelStr = "Retainer/Commission";
            commissionDetail = "Fixed+Variable";
            modelBadgeClass = "badge-success";
        } else if (c.name === "ITC Hotels") {
            billingModelStr = "Retainer";
            commissionDetail = "Fixed+Variable";
            modelBadgeClass = "badge-info";
        } else if (c.name === "Emami" || c.name === "TCPL") {
            billingModelStr = "waiting for finalized commercial";
            commissionDetail = "waiting for finalized commercial";
            isWaiting = true;
        } else {
            // Fallback for new clients
            const models = c.lobs ? [...new Set(c.lobs.map(lob => lob.billingModel))] : [];
            billingModelStr = models.join(' / ') || 'Retainer';
            modelBadgeClass = 'badge-success';
            if (billingModelStr === 'Retainer') modelBadgeClass = 'badge-info';
            if (billingModelStr === 'Commission') modelBadgeClass = 'badge-warning';

            const commissionParts = [];
            if (c.lobs) {
                c.lobs.forEach(lob => {
                    if (lob.billingModel === 'Commission') {
                        commissionParts.push(`${lob.commissionPercent}% on ${lob.commissionBase}`);
                    } else if (lob.billingModel === 'Hybrid') {
                        commissionParts.push(`${lob.commissionPercent}% on ${lob.commissionBase}`);
                    } else if (lob.billingModel === 'SplitRetainer' && lob.variableSharePercent > 0) {
                        commissionParts.push(`${lob.variableSharePercent}% Var (${lob.variableMetric})`);
                    }
                });
            }
            commissionDetail = commissionParts.length > 0 ? commissionParts.join(' + ') : '-';
        }

        // Calculate total fixed retainer budget portion
        let totalFixedRetainer = c.retainerRate !== undefined ? parseFloat(c.retainerRate) : undefined;
        let totalVariableRetainer = c.variableRetainerRate !== undefined ? parseFloat(c.variableRetainerRate) : undefined;
        
        if (totalFixedRetainer === undefined && c.lobs && c.lobs.length > 0) {
            totalFixedRetainer = c.lobs.reduce((sum, lob) => {
                if (lob.billingModel === 'SplitRetainer') {
                    return sum + (lob.fixedAmount !== undefined ? lob.fixedAmount : (lob.totalRetainer * (lob.fixedSharePercent / 100)));
                } else if (lob.billingModel === 'Retainer' || lob.billingModel === 'Hybrid' || lob.billingModel === 'Fixed+Variable') {
                    return sum + (lob.totalRetainer || 0);
                }
                return sum;
            }, 0);
        }
        
        if (totalVariableRetainer === undefined && c.lobs && c.lobs.length > 0) {
            totalVariableRetainer = c.lobs.reduce((sum, lob) => {
                if (lob.billingModel === 'SplitRetainer') {
                    return sum + (lob.variableAmount !== undefined ? lob.variableAmount : (lob.totalRetainer * (lob.variableSharePercent / 100)));
                }
                return sum;
            }, 0);
        }

        totalFixedRetainer = totalFixedRetainer || 0;
        totalVariableRetainer = totalVariableRetainer || 0;

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
            <td>${isWaiting ? `<span class="badge" style="background-color: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border-color); text-transform: none; font-size: 11px;">${billingModelStr}</span>` : `<span class="badge ${modelBadgeClass}">${billingModelStr}</span>`}</td>
            <td><strong>${totalFixedRetainer > 0 ? formatCurrency(totalFixedRetainer) : "₹0"}</strong></td>
            <td><strong>${totalVariableRetainer > 0 ? formatCurrency(totalVariableRetainer) : "₹0"}</strong></td>
            <td>${isWaiting ? `<span class="badge" style="background-color: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border-color); text-transform: none; font-size: 11px;">${commissionDetail}</span>` : commissionDetail}</td>
            <td>
                <span class="status-indicator ${statusClass}"></span>
                <span>${c.status}</span>
            </td>
            <td>
                <div class="action-buttons" style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-sm btn-secondary" onclick="viewClientWorkspace('${c.id}')" style="padding: 4px 8px; font-size: 11px; display: flex; align-items: center; gap: 4px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--bg-app); color: var(--text-secondary); cursor: pointer;">
                        <i data-lucide="eye" style="width: 12px; height: 12px;"></i> View Details
                    </button>
                    <button class="btn-icon edit" onclick="editClient('${c.id}')" title="Edit Client Configuration" data-role-required="admin">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteClient('${c.id}')" title="Remove Client" data-role-required="admin">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    safeCreateIcons();
}

// --- CLIENT WORKSPACE VIEW ---
let activeWorkspaceClientId = null;

window.viewClientWorkspace = function(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Emami and TCPL onboarding check
    if (client.status === 'Upcoming' || client.id === 'c3' || client.id === 'c4') {
        alert("Client On-boarding in process");
        return;
    }

    activeWorkspaceClientId = clientId;
    
    // Set up layout elements
    document.getElementById('ws-avatar').textContent = client.name.charAt(0);
    document.getElementById('ws-client-name').textContent = `${client.name} Workspace`;
    
    const statusBadge = document.getElementById('ws-client-status');
    statusBadge.textContent = client.status;
    statusBadge.className = 'badge';
    if (client.status === 'Active') {
        statusBadge.classList.add('badge-success');
    } else if (client.status === 'Paused') {
        statusBadge.classList.add('badge-warning');
    } else {
        statusBadge.classList.add('badge-secondary');
    }

    // Bind event listeners if not already bound
    const monthSelect = document.getElementById('ws-filter-month');
    const fySelect = document.getElementById('ws-filter-fy');
    
    if (!monthSelect.dataset.listenerBound) {
        monthSelect.addEventListener('change', () => updateWorkspaceMetrics(activeWorkspaceClientId));
        monthSelect.dataset.listenerBound = "true";
    }
    if (!fySelect.dataset.listenerBound) {
        fySelect.addEventListener('change', () => updateWorkspaceMetrics(activeWorkspaceClientId));
        fySelect.dataset.listenerBound = "true";
    }

    // Toggle panels
    document.getElementById('clients-list-subpanel').style.display = 'none';
    document.getElementById('clients-detail-subpanel').style.display = 'block';

    // Populate initial calculations
    updateWorkspaceMetrics(clientId);
};

window.closeClientDetails = function() {
    activeWorkspaceClientId = null;
    document.getElementById('clients-detail-subpanel').style.display = 'none';
    document.getElementById('clients-list-subpanel').style.display = 'block';
};

window.exportWSDetails = function() {
    alert("Exporting workspace data snapshot to CSV...");
};

function updateWorkspaceMetrics(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const monthSelect = document.getElementById('ws-filter-month');
    const fySelect = document.getElementById('ws-filter-fy');
    
    const selectedMonth = monthSelect.value; // e.g. "April"
    const selectedFY = fySelect.value; // e.g. "FY 2026-27"
    
    // Determine the year based on selected FY and Month
    // FY 2026-27 runs from April 2026 to March 2027.
    let year = 2026;
    if (selectedFY === 'FY 2026-27') {
        const lateMonths = ["January", "February", "March"];
        if (lateMonths.includes(selectedMonth)) {
            year = 2027;
        } else {
            year = 2026;
        }
    } else if (selectedFY === 'FY 2025-26') {
        const lateMonths = ["January", "February", "March"];
        if (lateMonths.includes(selectedMonth)) {
            year = 2026;
        } else {
            year = 2025;
        }
    }

    const fullMonthStr = `${selectedMonth} ${year}`;
    
    // Update label text
    document.getElementById('ws-snapshot-label').textContent = `Executive snapshot for ${selectedMonth.substring(0,3)}`;

    // 1. Monthly Retainer Budget (sum of all BUs configured for this client)
    const monthlyRetainer = client.lobs ? client.lobs.reduce((sum, lob) => sum + (lob.totalRetainer || 0), 0) : 0;
    document.getElementById('ws-kpi-retainer').textContent = formatCurrency(monthlyRetainer);

    // Calculate metrics cumulatively starting from April 2026 onwards (FY 2026-27), only for APPROVED transactions
    const clientTxs = transactions.filter(t => {
        const st = (t.status || '').toUpperCase();
        return t.clientId === clientId && t.date >= "2026-04-01" && (st === 'APPROVED' || st === 'PAID');
    });

    // 2. Total Fixed Billed (sum of all fixed retainer amounts logged from Apr 2026 onwards)
    const totalFixedBilled = clientTxs.reduce((sum, t) => sum + (t.retainerAmount || 0), 0);
    document.getElementById('ws-kpi-fixed-billed').textContent = formatCurrency(totalFixedBilled);

    // 3. Total Variable Billed (sum of all variable/commission amounts logged from Apr 2026 onwards)
    const totalVariableBilled = clientTxs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);
    document.getElementById('ws-kpi-variable-billed').textContent = formatCurrency(totalVariableBilled);

    // 4. Total Billed (sum of all transactions logged from Apr 2026 onwards for this client)
    const totalBilled = clientTxs.reduce((sum, t) => sum + t.totalAmount, 0);
    document.getElementById('ws-kpi-billed').textContent = formatCurrency(totalBilled);

    // 5. Collection (sum of all paid transactions logged from Apr 2026 onwards for this client)
    const collection = clientTxs.filter(t => t.status === 'Paid').reduce((sum, t) => sum + t.totalAmount, 0);
    document.getElementById('ws-kpi-collection').textContent = formatCurrency(collection);

    // 6. Progress Calculation (cumulative total billed versus single month retainer budget benchmark)
    const progressPercent = monthlyRetainer > 0 ? Math.min(100, Math.round((totalBilled / monthlyRetainer) * 100)) : 0;
    document.getElementById('ws-progress-text').textContent = `${progressPercent}%`;
    document.getElementById('ws-progress-bar').style.width = `${progressPercent}%`;

    // 6. Render Invoice Summary Table (Client Workspace Ledger history)
    const wsTableBody = document.querySelector('#ws-invoice-table tbody');
    if (wsTableBody) {
        wsTableBody.innerHTML = '';
        
        const filteredWS = transactions.filter(t => t.clientId === clientId);
        filteredWS.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredWS.length === 0) {
            wsTableBody.innerHTML = `<tr><td colspan="10" class="text-muted text-center" style="padding: 32px; text-align: center;">No invoices logged for this client.</td></tr>`;
        } else {
            filteredWS.forEach(t => {
                let statusBadgeClass = 'badge-warning';
                const st = (t.status || '').toUpperCase();
                if (st === 'PAID' || st === 'APPROVED') statusBadgeClass = 'badge-success';
                else if (st === 'REJECTED') statusBadgeClass = 'badge-danger';
                
                let basisValDesc = "-";
                if (t.variableBaseAmount > 0) {
                    basisValDesc = `${formatCurrency(t.variableBaseAmount)}`;
                }

                // Dynamically fetch billing type
                let billingTypeDesc = "-";
                if (t.billingType) {
                    billingTypeDesc = t.billingType;
                } else {
                    if (t.retainerAmount > 0 && t.commissionAmount > 0) {
                        billingTypeDesc = "Hybrid";
                    } else if (t.retainerAmount > 0) {
                        billingTypeDesc = "Fixed";
                    } else if (t.commissionAmount > 0) {
                        billingTypeDesc = "Commission";
                    }
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${t.invoiceNumber ? t.invoiceNumber : `#${t.id.toUpperCase()}`}</strong>${t.poNumber ? `<div class="text-muted small" style="font-size: 11px; margin-top: 2px;">PO: ${t.poNumber}</div>` : ''}</td>
                    <td>${t.clientName}${t.lobName ? ` <span class="text-muted small">(${t.lobName})</span>` : ''}</td>
                    <td>${t.billingMonth}</td>
                    <td><span style="font-weight: 500; color: var(--text-secondary);">${billingTypeDesc}</span></td>
                    <td>${basisValDesc}</td>
                    <td>${formatCurrency(t.retainerAmount)}</td>
                    <td>${formatCurrency(t.commissionAmount)}</td>
                    <td><strong>${formatCurrency(t.totalAmount)}</strong></td>
                    <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
                    <td>
                        <div class="action-buttons" style="display: flex; gap: 4px;">
                            <button class="btn btn-sm btn-secondary" onclick="viewInvoice('${t.id}')" style="padding: 4px 8px; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                <i data-lucide="eye" style="width: 12px; height: 12px;"></i> View
                            </button>
                        </div>
                    </td>
                `;
                wsTableBody.appendChild(row);
            });
        }
    }

    safeCreateIcons();
}

window.markAsPaidWS = function(id) {
    markAsPaid(id);
    if (activeWorkspaceClientId) {
        updateWorkspaceMetrics(activeWorkspaceClientId);
    }
};

// Open Client Modal (Add mode)
document.getElementById('btn-add-client').addEventListener('click', () => {
    document.getElementById('client-modal-title').textContent = "Add New Client";
    document.getElementById('client-form').reset();
    document.getElementById('client-id-field').value = '';
    
    // Default setup fields visibility
    toggleClientBillingFields('');
    
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
    const variableGroup = document.getElementById('cfg-variable-retainer-group');
    const commissionGroup = document.getElementById('cfg-commission-group');
    
    if (model === 'Retainer') {
        retainerGroup.style.display = 'block';
        if (variableGroup) variableGroup.style.display = 'none';
        commissionGroup.style.display = 'none';
    } else if (model === 'Commission') {
        retainerGroup.style.display = 'none';
        if (variableGroup) variableGroup.style.display = 'none';
        commissionGroup.style.display = 'block';
    } else if (model === 'Hybrid' || model === 'Fixed+Variable') {
        retainerGroup.style.display = 'block';
        if (variableGroup) variableGroup.style.display = 'block';
        commissionGroup.style.display = 'block';
    } else {
        retainerGroup.style.display = 'none';
        if (variableGroup) variableGroup.style.display = 'none';
        commissionGroup.style.display = 'none';
    }
}

// Client Form submit logic (Add/Update)
document.getElementById('client-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('client-id-field').value;
    const name = document.getElementById('client-name').value.trim();
    const contactName = document.getElementById('client-contact').value.trim();
    const status = document.getElementById('client-status').value;
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const billingModel = document.getElementById('client-model').value;
    
    if (!name) {
        alert("Company Name is required.");
        return;
    }
    
    let billingFields = {};
    if (billingModel) {
        let retainerRate = 0;
        let variableRetainerRate = 0;
        let commissionPercent = 0;
        let commissionBase = "None";
        
        if (billingModel === 'Retainer' || billingModel === 'Hybrid' || billingModel === 'Fixed+Variable') {
            retainerRate = parseFloat(document.getElementById('client-retainer-rate').value) || 0;
            const varInput = document.getElementById('client-variable-retainer-rate');
            if (varInput) {
                variableRetainerRate = parseFloat(varInput.value) || 0;
            }
        }
        if (billingModel === 'Commission' || billingModel === 'Hybrid' || billingModel === 'Fixed+Variable') {
            commissionPercent = parseFloat(document.getElementById('client-commission-percent').value) || 0;
            commissionBase = document.getElementById('client-commission-base').value;
        }
        billingFields = { billingModel, retainerRate, variableRetainerRate, commissionPercent, commissionBase };
    }

    // Async Firestore operations
    import('./auth.js').then(async ({ db, doc, setDoc, deleteDoc }) => {
        try {
            if (id) {
                // Edit Mode
                const index = clients.findIndex(c => c.id === id);
                if (index !== -1) {
                    clients[index] = {
                        ...clients[index],
                        name, contactName, status, email, phone,
                        ...billingFields
                    };
                    // Update in Firestore
                    const clientRef = doc(db, 'clients', id);
                    await setDoc(clientRef, clients[index]);
                }
            } else {
                // Add Mode
                const newId = generateId('c');
                const newClient = {
                    name, contactName, status, email, phone,
                    ...billingFields,
                    startDate: new Date().toISOString().split('T')[0],
                    lobs: billingModel ? [{
                        name: "Core",
                        billingModel: billingModel,
                        totalRetainer: billingModel === 'Commission' ? 0 : (billingFields.retainerRate || 0),
                        fixedSharePercent: billingModel === 'Hybrid' ? 50 : 100,
                        variableSharePercent: billingModel === 'Hybrid' ? 50 : 0,
                        commissionPercent: billingFields.commissionPercent || 0,
                        commissionBase: billingFields.commissionBase || "Revenue"
                    }] : []
                };
                
                // Update in Firestore
                const clientRef = doc(db, 'clients', newId);
                await setDoc(clientRef, newClient);
                
                // Update local state
                newClient.id = newId;
                clients.push(newClient);
            }

            closeClientModal();
            renderClients();
            populateDropdowns();
        } catch (error) {
            console.error("Error saving client:", error);
            alert("Failed to save client. Check console for details.");
        }
    });
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
    const modelVal = client.billingModel || "";
    document.getElementById('client-model').value = modelVal;
    
    toggleClientBillingFields(modelVal);
    
    document.getElementById('client-retainer-rate').value = client.retainerRate !== undefined ? client.retainerRate : "";
    
    const varInput = document.getElementById('client-variable-retainer-rate');
    if (varInput) {
        varInput.value = client.variableRetainerRate !== undefined ? client.variableRetainerRate : "";
    }

    document.getElementById('client-commission-percent').value = client.commissionPercent !== undefined ? client.commissionPercent : "";
    document.getElementById('client-commission-base').value = client.commissionBase || "";

    document.getElementById('modal-client').classList.add('active');
};

// Delete Client Action
window.deleteClient = function(id) {
    if (confirm("Are you sure you want to delete this client? All billing summaries remain but configurations are removed.")) {
        import('./auth.js').then(async ({ db, doc, deleteDoc }) => {
            try {
                await deleteDoc(doc(db, 'clients', id));
                clients = clients.filter(c => c.id !== id);
                renderClients();
                populateDropdowns();
            } catch (error) {
                console.error("Error deleting client:", error);
                alert("Failed to delete client.");
            }
        });
    }
};

// Client Search Handler
document.getElementById('search-clients').addEventListener('input', (e) => {
    renderClients(e.target.value);
});


// --- BILLING LEDGER CONTROLLER ---
async function renderBillingLedger() {
    // We don't call initData() here anymore because it's called on load and transactions are updated locally and in Firestore
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
        let statusBadgeClass = 'badge-warning';
        const st = (t.status || '').toUpperCase();
        if (st === 'PAID' || st === 'APPROVED') statusBadgeClass = 'badge-success';
        else if (st === 'REJECTED') statusBadgeClass = 'badge-danger';
        
        let basisValDesc = "-";
        if (t.variableBaseAmount > 0) {
            basisValDesc = `${formatCurrency(t.variableBaseAmount)}`;
        }

        const isPending = t.status === 'Pending Approval';
        // Only Admin and Commercial can approve/reject
        const canApprove = window.currentUserRole === 'admin' || window.currentUserRole === 'commercial';
        const isAdmin = window.currentUserRole === 'admin';
        const stCode = (t.status || '').toUpperCase();
        const isApprovedOrPaid = stCode === 'APPROVED' || stCode === 'PAID';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${t.invoiceNumber ? t.invoiceNumber : `#${t.id.toUpperCase()}`}</strong>${t.poNumber ? `<div class="text-muted small" style="font-size: 11px; margin-top: 2px;">PO: ${t.poNumber}</div>` : ''}</td>
            <td>${t.clientName}${t.lobName ? ` <span class="text-muted small">(${t.lobName})</span>` : ''}</td>
            <td>${t.billingMonth}</td>
            <td>${basisValDesc}</td>
            <td>${formatCurrency(t.retainerAmount)}</td>
            <td>${formatCurrency(t.commissionAmount)}</td>
            <td><strong>${formatCurrency(t.totalAmount)}</strong></td>
            <td><span class="badge ${statusBadgeClass}">${t.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice('${t.id}')" style="cursor: pointer;">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View
                    </button>
                    ${isPending && canApprove ? `
                        <button class="btn btn-sm btn-success" onclick="approveTransaction('${t.id}')" style="cursor: pointer; background-color: rgba(16, 185, 129, 0.1); color: var(--success); border-color: rgba(16, 185, 129, 0.2);">
                            <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="rejectTransaction('${t.id}')" style="cursor: pointer; background-color: rgba(239, 68, 68, 0.1); color: var(--danger); border-color: rgba(239, 68, 68, 0.2);">
                            <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i> Reject
                        </button>
                    ` : ''}
                    ${isApprovedOrPaid && isAdmin ? `
                        <button class="btn btn-sm btn-danger" onclick="rejectTransaction('${t.id}')" style="cursor: pointer; background-color: rgba(239, 68, 68, 0.1); color: var(--danger); border-color: rgba(239, 68, 68, 0.2); margin-left: 4px;" title="Admin Override: Cancel/Reject">
                            <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i> Cancel
                        </button>
                    ` : ''}
                    <button class="btn-icon delete" onclick="deleteTransaction('${t.id}')" title="Delete record" style="cursor: pointer;" data-role-required="admin">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    safeCreateIcons();
}

window.approveTransaction = function(id) {
    if (confirm("Approve this billing transaction?")) {
        updateTransactionStatus(id, 'Approved');
    }
};

window.rejectTransaction = function(id) {
    if (confirm("Reject this billing transaction?")) {
        updateTransactionStatus(id, 'Rejected');
    }
};

window.updateTransactionStatus = function(id, newStatus) {
    let reason = '';
    if (newStatus === 'Rejected') {
        reason = prompt("Please provide a reason for rejection (Required):");
        if (!reason || reason.trim() === '') {
            alert("Rejection reason is mandatory. Action cancelled.");
            return;
        }
    }

    import('./auth.js').then(async ({ db, doc, updateDoc }) => {
        try {
            const txRef = doc(db, 'transactions', id);
            const updatePayload = { status: newStatus };
            if (newStatus === 'Rejected') {
                updatePayload.rejectionReason = reason.trim();
            } else {
                updatePayload.rejectionReason = null;
            }
            await updateDoc(txRef, updatePayload);
            
            const idx = transactions.findIndex(t => t.id === id);
            if (idx !== -1) {
                transactions[idx].status = newStatus;
                if (newStatus === 'Rejected') transactions[idx].rejectionReason = reason.trim();
            }
            
            const auditDetails = newStatus === 'Rejected' 
                ? `Transaction ${id} was ${newStatus}. Reason: ${reason.trim()}`
                : `Transaction ${id} was ${newStatus}.`;
            await logAuditAction(`TRANSACTION_${newStatus.toUpperCase()}`, auditDetails);
            
            renderBillingLedger();
            renderDashboard();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status.");
        }
    });
};

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
const quickBillBtn = document.getElementById('btn-quick-bill');
if (quickBillBtn) {
    quickBillBtn.addEventListener('click', openBillingModal);
}
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
    document.getElementById('log-bill-brand-group').style.display = 'none';
}

// Handle Brand Name Field based on selected client & LOB
function updateBrandNameField(client, lobName) {
    const brandGroup = document.getElementById('log-bill-brand-group');
    const brandContainer = document.getElementById('log-bill-brand-container');
    if (!brandGroup || !brandContainer) return;

    if (!client) {
        brandGroup.style.display = 'none';
        brandContainer.innerHTML = `<input type="text" id="log-bill-brand-name" class="form-control" readonly value="">`;
        return;
    }

    // 1. If selected client is Airtel (id: "c1")
    if (client.id === 'c1') {
        brandGroup.style.display = 'block';
        if (lobName === 'Branding') {
            // Dropdown select
            brandContainer.innerHTML = `
                <select id="log-bill-brand-name-select" class="form-control">
                    <option value="Bharti Airtel Limited">Bharti Airtel Limited</option>
                    <option value="Xtelify Limited">Xtelify Limited</option>
                    <option value="APB">APB</option>
                </select>
            `;
        } else {
            // Readonly input field with values based on BU
            let brandVal = "";
            if (lobName === 'Mobility' || lobName === 'Broadband') {
                brandVal = "Bharti Airtel Limited";
            } else if (lobName === 'Finance' || lobName === 'Airtel Thanks' || lobName === 'Airtel Xstream') {
                brandVal = "Xtelify Limited";
            } else if (lobName === 'Airtel Payment Bank') {
                brandVal = "APB";
            }
            brandContainer.innerHTML = `<input type="text" id="log-bill-brand-name" class="form-control" readonly value="${brandVal}">`;
        }
    } 
    // 2. If selected client is ITC Hotels (id: "c2")
    else if (client.id === 'c2') {
        brandGroup.style.display = 'block';
        brandContainer.innerHTML = `<input type="text" id="log-bill-brand-name" class="form-control" readonly value="ITC Hotel Limited">`;
    } 
    // 3. Other clients
    else {
        brandGroup.style.display = 'none';
        brandContainer.innerHTML = `<input type="text" id="log-bill-brand-name" class="form-control" readonly value="">`;
    }
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
        updateBrandNameField(null, "");
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
        updateBrandNameField(null, "");
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
        updateBrandNameField(client, "");
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
        updateBrandNameField(client, "");
        return;
    }

    const lob = client.lobs.find(l => l.name === lobName);
    if (!lob) return;

    triggerLogBillLobChange(client, lob);
});

function triggerLogBillLobChange(client, lob) {
    hideLogBillGroups();
    updateBrandNameField(client, lob.name);

    // Show Terms Badge
    const termsBox = document.getElementById('log-bill-terms-info');
    termsBox.style.display = 'flex';
    
    let termsHTML = `<div><strong>Business Unit:</strong> ${lob.name}</div>`;
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
            retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
            commissionAmt = 0;
        } else if (billType === 'Variable') {
            retainerAmt = 0;
            const maxVarAmt = lob.variableAmount !== undefined ? lob.variableAmount : lob.totalRetainer * (lob.variableSharePercent / 100);
            commissionAmt = maxVarAmt * (kpiVal / 100);
        }
    } else {
        if (lob.billingModel === 'Retainer') {
            retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
            commissionAmt = 0;
        } else if (lob.billingModel === 'Hybrid') {
            retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
            commissionAmt = baseVal * (lob.commissionPercent / 100);
        } else if (lob.billingModel === 'Commission') {
            retainerAmt = 0;
            commissionAmt = baseVal * (lob.commissionPercent / 100);
        }
    }  

    const total = retainerAmt + commissionAmt;

    document.getElementById('log-bill-calc-retainer').textContent = formatCurrency(retainerAmt);
    document.getElementById('log-bill-calc-commission').textContent = formatCurrency(commissionAmt);
    document.getElementById('log-bill-calc-total').textContent = formatCurrency(total);
    document.getElementById('log-bill-summary-box').style.display = 'block';
}

// Live calculation triggers on Log Bill inputs
document.getElementById('log-bill-fixed-value').addEventListener('input', runLogBillCalculation);
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
    if (rawMonth < "2026-04") {
        alert("Billing entries can only be logged for FY 2026-27 onwards (starting April 2026).");
        return;
    }
    const monthParts = rawMonth.split('-');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedMonth = `${monthNames[parseInt(monthParts[1]) - 1]} ${monthParts[0]}`; // e.g. "July 2026"

    const baseVal = parseFloat(document.getElementById('log-bill-variable-value').value) || 0;
    const kpiVal = parseFloat(document.getElementById('log-bill-kpi-value').value) || 0;
    const billType = lob.billingModel === 'SplitRetainer' ? document.getElementById('log-bill-type').value : null;
    const invoiceNum = document.getElementById('log-bill-invoice-number').value.trim();
    const poNum = document.getElementById('log-bill-po-number').value.trim();

    if (!poNum) {
        alert("PO Number is required.");
        return;
    }

    let retainerAmt = 0;
    let commissionAmt = 0;

    if (lob.billingModel === 'SplitRetainer') {
        if (billType === 'Fixed') {
            retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
            commissionAmt = 0;
        } else if (billType === 'Variable') {
            retainerAmt = 0;
            const maxVarAmt = lob.variableAmount !== undefined ? lob.variableAmount : lob.totalRetainer * (lob.variableSharePercent / 100);
            commissionAmt = maxVarAmt * (kpiVal / 100);
        }
    } else if (lob.billingModel === 'Retainer') {
        retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
        commissionAmt = 0;
    } else if (lob.billingModel === 'Hybrid') {
        retainerAmt = parseFloat(document.getElementById('log-bill-fixed-value').value) || 0;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    } else if (lob.billingModel === 'Commission') {
        retainerAmt = 0;
        commissionAmt = baseVal * (lob.commissionPercent / 100);
    }

    const total = retainerAmt + commissionAmt;

    let brandNameVal = "";
    const brandNameInput = document.getElementById('log-bill-brand-name');
    const brandNameSelect = document.getElementById('log-bill-brand-name-select');
    if (brandNameSelect) {
        brandNameVal = brandNameSelect.value;
    } else if (brandNameInput) {
        brandNameVal = brandNameInput.value;
    }

    const newTx = {
        clientId: client.id,
        clientName: client.name,
        lobName: lob.name,
        brandName: brandNameVal,
        billingType: billType,
        invoiceNumber: invoiceNum,
        poNumber: poNum,
        date: new Date().toISOString().split('T')[0],
        billingMonth: formattedMonth,
        retainerAmount: retainerAmt,
        commissionAmount: commissionAmt,
        variableBaseAmount: baseVal,
        kpiAchievement: lob.billingModel === 'SplitRetainer' && billType === 'Variable' ? kpiVal : null,
        totalAmount: total,
        status: "Pending Approval", // New requirement: Status is Pending Approval
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days due
    };

    import('./auth.js').then(async ({ db, collection, addDoc, doc, setDoc }) => {
        try {
            const newId = generateId('t');
            const txRef = doc(db, 'transactions', newId);
            const txData = { id: newId, ...newTx };
            await setDoc(txRef, txData);
            
            transactions.push(txData);
            
            await logAuditAction('CREATE_BILLING', `Created billing transaction for ${client.name} (${formatCurrency(total)})`);
            
            closeBillingModal();
            // Redirect to billing list
            switchTab('billing');
        } catch (error) {
            console.error("Error creating billing transaction:", error);
            alert("Failed to log billing transaction.");
        }
    });
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

    if (client.status === 'Upcoming' || client.id === 'c3' || client.id === 'c4') {
        alertBox.style.display = 'flex';
        calcBtn.disabled = true;
        document.getElementById('calc-client-config-box').style.display = 'none';
        document.getElementById('calc-inputs-section').style.display = 'none';
        document.getElementById('calc-results-section').style.display = 'none';
        document.getElementById('btn-calc-save').style.display = 'none';
        return;
    } else {
        alertBox.style.display = 'none';
        calcBtn.disabled = false;
        document.getElementById('btn-calc-save').style.display = 'inline-flex';
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
    
    let commRateText = '0%';
    if (lob.commissionPercent !== undefined) {
        commRateText = `${lob.commissionPercent}%`;
    } else if (lob.variableSharePercent !== undefined) {
        commRateText = `${lob.variableSharePercent}% (Var)`;
    }
    document.getElementById('calc-preview-commission-rate').textContent = commRateText;
    document.getElementById('calc-preview-base').textContent = lob.commissionBase || lob.variableMetric || 'None';

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

// Trigger Calculation (Look up actual logged billing entries)
document.getElementById('btn-calc-calculate').addEventListener('click', () => {
    const clientId = document.getElementById('calc-client').value;
    if (!clientId) {
        alert("Please select a client first.");
        return;
    }

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    // Check onboarding alert
    if (client.status === 'Upcoming' || client.id === 'c3' || client.id === 'c4') {
        alert("Client On-boarding in process");
        return;
    }

    // Get selected billing month
    const rawMonth = document.getElementById('calc-billing-month').value;
    if (!rawMonth) {
        alert("Please select a billing month.");
        return;
    }
    if (rawMonth < "2026-04") {
        alert("Calculations can only be performed for FY 2026-27 onwards (starting April 2026).");
        return;
    }
    const monthParts = rawMonth.split('-');
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedMonth = `${monthNames[parseInt(monthParts[1]) - 1]} ${monthParts[0]}`; // e.g. "July 2026"

    // Find actual transactions logged for this client and month
    const clientTxs = transactions.filter(t => t.clientId === clientId && t.billingMonth === formattedMonth);

    // Sum fixed retainer portions (t.retainerAmount)
    const fixedRetainerSum = clientTxs.reduce((sum, t) => sum + (t.retainerAmount || 0), 0);

    // Sum variable retainer portions (t.commissionAmount)
    const variableRetainerSum = clientTxs.reduce((sum, t) => sum + (t.commissionAmount || 0), 0);

    // Sum total
    const totalBilling = fixedRetainerSum + variableRetainerSum;

    // Display Breakdown
    document.getElementById('calc-results-section').style.display = 'block';
    document.getElementById('breakdown-retainer').textContent = formatCurrency(fixedRetainerSum);
    document.getElementById('breakdown-commission').textContent = formatCurrency(variableRetainerSum);
    document.getElementById('breakdown-total').textContent = formatCurrency(totalBilling);
});

// Block default form submission
document.getElementById('full-calculator-form').addEventListener('submit', (e) => {
    e.preventDefault();
});


// --- DASHBOARD MINI LOOKUP & ESTIMATOR CONTROLLER ---
document.getElementById('mini-calc-client').addEventListener('change', (e) => {
    const clientId = e.target.value;
    const monthFrom = document.getElementById('mini-calc-month-from');
    const monthTo = document.getElementById('mini-calc-month-to');
    const resultsBox = document.getElementById('mini-calc-results');

    monthFrom.disabled = true;
    monthTo.disabled = true;
    monthFrom.value = '';
    monthTo.value = '';
    resultsBox.style.display = 'none';

    if (!clientId) return;

    monthFrom.disabled = false;
    monthTo.disabled = false;
    
    // Auto populate with current month if empty
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    monthFrom.value = `${year}-${month}`;
    monthTo.value = `${year}-${month}`;

    runMiniLookup();
});

document.getElementById('mini-calc-month-from').addEventListener('input', runMiniLookup);
document.getElementById('mini-calc-month-to').addEventListener('input', runMiniLookup);

function runMiniLookup() {
    const clientId = document.getElementById('mini-calc-client').value;
    const monthFromVal = document.getElementById('mini-calc-month-from').value;
    const monthToVal = document.getElementById('mini-calc-month-to').value;
    const resultsBox = document.getElementById('mini-calc-results');

    if (!clientId || !monthFromVal || !monthToVal) {
        resultsBox.style.display = 'none';
        return;
    }

    if (monthFromVal > monthToVal) {
        resultsBox.style.display = 'none';
        return;
    }

    // Generate list of formatted months between From and To
    const start = new Date(monthFromVal + "-01");
    // Ensure we handle timezones correctly by using UTC Date logic or simple year/month math
    const startYear = parseInt(monthFromVal.split('-')[0]);
    const startMonth = parseInt(monthFromVal.split('-')[1]) - 1;
    const endYear = parseInt(monthToVal.split('-')[0]);
    const endMonth = parseInt(monthToVal.split('-')[1]) - 1;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const targetMonths = [];
    
    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
        targetMonths.push(`${monthNames[curM]} ${curY}`);
        curM++;
        if (curM > 11) {
            curM = 0;
            curY++;
        }
    }

    let totalFixed = 0;
    let totalVariable = 0;

    // Filter transactions for this client, within the target months, that are APPROVED or PAID
    transactions.forEach(t => {
        if (t.clientId === clientId && targetMonths.includes(t.billingMonth)) {
            const st = (t.status || '').toUpperCase();
            if (st === 'APPROVED' || st === 'PAID') {
                totalFixed += (t.retainerAmount || 0);
                totalVariable += (t.commissionAmount || 0);
            }
        }
    });

    const resFixed = document.getElementById('mini-res-fixed');
    const resVariable = document.getElementById('mini-res-variable');
    const resTotal = document.getElementById('mini-res-total');

    resFixed.textContent = formatCurrency(totalFixed);
    resVariable.textContent = formatCurrency(totalVariable);
    resTotal.textContent = formatCurrency(totalFixed + totalVariable);

    resultsBox.style.display = 'block';
}


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

    document.getElementById('inv-id').textContent = tx.invoiceNumber ? tx.invoiceNumber : tx.id.toUpperCase();
    document.getElementById('inv-po-no').textContent = tx.poNumber ? tx.poNumber : '-';

    const brandMeta = document.getElementById('inv-brand-name-meta');
    const brandValEl = document.getElementById('inv-brand-name');
    if (brandMeta && brandValEl) {
        if (tx.brandName) {
            brandMeta.style.display = 'flex';
            brandValEl.textContent = tx.brandName;
        } else {
            brandMeta.style.display = 'none';
        }
    }

    const rejectionMeta = document.getElementById('inv-rejection-reason-meta');
    const rejectionReasonEl = document.getElementById('inv-rejection-reason');
    if (rejectionMeta && rejectionReasonEl) {
        if ((tx.status || '').toUpperCase() === 'REJECTED' && tx.rejectionReason) {
            rejectionMeta.style.display = 'block';
            rejectionReasonEl.textContent = tx.rejectionReason;
        } else {
            rejectionMeta.style.display = 'none';
        }
    }

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


// --- AUDIT LOGS CONTROLLER ---
window.loadAuditLogs = async function() {
    try {
        const { db, collection, getDocs, query, orderBy } = await import('./auth.js');
        const logsRef = collection(db, 'audit_logs');
        const q = query(logsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const tableBody = document.querySelector('#audit-logs-table tbody');
        tableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding: 32px;">No audit logs found.</td></tr>`;
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let dateStr = 'Pending...';
            if (data.timestamp) {
                dateStr = data.timestamp.toDate().toLocaleString('en-IN');
            }
            
            let actionBadge = 'badge-secondary';
            if (data.action.includes('CREATE')) actionBadge = 'badge-success';
            if (data.action.includes('REJECT') || data.action.includes('DELETE')) actionBadge = 'badge-danger';
            if (data.action.includes('APPROVE')) actionBadge = 'badge-success';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-size: 13px; color: var(--text-secondary);">${dateStr}</td>
                <td><strong>${data.userName}</strong><br><span style="font-size: 11px; color: var(--text-secondary);">${data.userEmail}</span></td>
                <td><span class="badge ${actionBadge}">${data.action}</span></td>
                <td style="font-size: 14px;">${data.details}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading audit logs:", error);
    }
};


// --- INITIAL STARTUP ---
document.addEventListener('DOMContentLoaded', async () => {
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

    console.log("KK ERP Loaded - v1.1.18");
    await initData();
    populateDropdowns();
    switchTab('dashboard'); // Start on Dashboard
});
