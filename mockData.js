// Mock Data for ERP KK-Retainer Dashboard

const initialClients = [
    {
        id: "c1",
        name: "Airtel",
        contactName: "Anil Kapoor",
        email: "billing@airtel.com",
        phone: "+91 98100 12345",
        status: "Active",
        startDate: "2026-01-01",
        lobs: [
            {
                name: "Broadband",
                billingModel: "SplitRetainer",
                totalRetainer: 1000000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                variableMetric: "KPIs"
            },
            {
                name: "Mobility",
                billingModel: "SplitRetainer",
                totalRetainer: 1000000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                variableMetric: "KPIs"
            },
            {
                name: "Finance",
                billingModel: "SplitRetainer",
                totalRetainer: 200000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                variableMetric: "KPIs"
            },
            {
                name: "Branding",
                billingModel: "SplitRetainer",
                totalRetainer: 1000000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                fixedAmount: 850000,
                variableAmount: 150000,
                variableMetric: "KPIs"
            },
            {
                name: "Airtel Thanks",
                billingModel: "SplitRetainer",
                totalRetainer: 400000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                fixedAmount: 340000,
                variableAmount: 60000,
                variableMetric: "KPIs"
            },
            {
                name: "Airtel Xstream",
                billingModel: "SplitRetainer",
                totalRetainer: 211000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                fixedAmount: 179350,
                variableAmount: 31650,
                variableMetric: "KPIs"
            },
            {
                name: "Airtel Payment Bank",
                billingModel: "Commission",
                totalRetainer: 0,
                commissionPercent: 5.0,
                commissionBase: "Revenue"
            }
        ]
    },
    {
        id: "c2",
        name: "ITC Hotels",
        contactName: "Sanjay Dutt",
        email: "finance@itchotels.in",
        phone: "+91 99110 54321",
        status: "Active",
        startDate: "2026-02-15",
        lobs: [
            {
                name: "Performance",
                billingModel: "SplitRetainer",
                totalRetainer: 560000,
                fixedSharePercent: 100,
                variableSharePercent: 0,
                fixedAmount: 560000,
                variableAmount: 0,
                variableMetric: "None"
            },
            {
                name: "SEO",
                billingModel: "SplitRetainer",
                totalRetainer: 300000,
                fixedSharePercent: 100,
                variableSharePercent: 0,
                fixedAmount: 300000,
                variableAmount: 0,
                variableMetric: "None"
            },
            {
                name: "KPI Variable",
                billingModel: "SplitRetainer",
                totalRetainer: 250000,
                fixedSharePercent: 0,
                variableSharePercent: 100,
                fixedAmount: 0,
                variableAmount: 250000,
                variableMetric: "KPIs"
            }
        ]
    },
    {
        id: "c3",
        name: "Emami",
        contactName: "Rajiv Sen",
        email: "accounts@emami.com",
        phone: "+91 94330 67890",
        status: "Upcoming",
        startDate: "2026-08-01",
        lobs: [
            {
                name: "Core",
                billingModel: "Hybrid",
                totalRetainer: 80000,
                fixedSharePercent: 100,
                commissionPercent: 3.5,
                commissionBase: "Ad Spend"
            }
        ]
    },
    {
        id: "c4",
        name: "TCPL",
        contactName: "Vikram Malhotra",
        email: "partner@tcpl.com",
        phone: "+91 98300 24680",
        status: "Upcoming",
        startDate: "2026-09-01",
        lobs: [
            {
                name: "Core",
                billingModel: "Commission",
                totalRetainer: 0,
                commissionPercent: 8.0,
                commissionBase: "Revenue"
            }
        ]
    }
];

const initialTransactions = [
    {
        id: "t1a",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Broadband",
        brandName: "Bharti Airtel Limited",
        invoiceNumber: "INV/2026/001-A",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 850000,
        commissionAmount: 150000,
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 1000000,
        status: "Paid",
        dueDate: "2026-07-10"
    },
    {
        id: "t1b",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Mobility",
        brandName: "Bharti Airtel Limited",
        invoiceNumber: "INV/2026/001-B",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 850000,
        commissionAmount: 150000,
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 1000000,
        status: "Paid",
        dueDate: "2026-07-10"
    },
    {
        id: "t1c",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Finance",
        brandName: "Xtelify Limited",
        invoiceNumber: "INV/2026/001-C",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 170000,
        commissionAmount: 30000,
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 200000,
        status: "Paid",
        dueDate: "2026-07-10"
    },
    {
        id: "t2",
        clientId: "c2",
        clientName: "ITC Hotels",
        lobName: "Performance",
        brandName: "ITC Hotel Limited",
        invoiceNumber: "INV/2026/002",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 560000,
        commissionAmount: 0,
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 560000,
        status: "Billing Initiated",
        dueDate: "2026-07-15"
    },
    {
        id: "t3a",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Broadband",
        brandName: "Bharti Airtel Limited",
        invoiceNumber: "INV/2026/003-A",
        date: "2026-05-31",
        billingMonth: "May 2026",
        retainerAmount: 850000,
        commissionAmount: 120000,
        variableBaseAmount: 0,
        kpiAchievement: 80,
        totalAmount: 970000,
        status: "Paid",
        dueDate: "2026-06-10"
    },
    {
        id: "t3b",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Mobility",
        brandName: "Bharti Airtel Limited",
        invoiceNumber: "INV/2026/003-B",
        date: "2026-05-31",
        billingMonth: "May 2026",
        retainerAmount: 850000,
        commissionAmount: 120000,
        variableBaseAmount: 0,
        kpiAchievement: 80,
        totalAmount: 970000,
        status: "Paid",
        dueDate: "2026-06-10"
    },
    {
        id: "t3c",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Finance",
        brandName: "Xtelify Limited",
        invoiceNumber: "INV/2026/003-C",
        date: "2026-05-31",
        billingMonth: "May 2026",
        retainerAmount: 170000,
        commissionAmount: 24000,
        variableBaseAmount: 0,
        kpiAchievement: 80,
        totalAmount: 194000,
        status: "Paid",
        dueDate: "2026-06-10"
    }
];

// Seed to localStorage only if empty or missing to prevent data loss on page refreshes
try {
    const clientsStored = JSON.parse(localStorage.getItem("erp_clients"));
    if (!clientsStored || !Array.isArray(clientsStored) || clientsStored.length === 0) {
        localStorage.setItem("erp_clients", JSON.stringify(initialClients));
    }
} catch (e) {
    localStorage.setItem("erp_clients", JSON.stringify(initialClients));
}

try {
    const txsStored = JSON.parse(localStorage.getItem("erp_transactions"));
    if (!txsStored || !Array.isArray(txsStored) || txsStored.length === 0) {
        localStorage.setItem("erp_transactions", JSON.stringify(initialTransactions));
    }
} catch (e) {
    localStorage.setItem("erp_transactions", JSON.stringify(initialTransactions));
}
