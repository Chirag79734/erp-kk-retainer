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
                name: "Performance",
                billingModel: "SplitRetainer",
                totalRetainer: 2200000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                variableMetric: "Ad Spend"
            },
            {
                name: "Airtel Thanks",
                billingModel: "SplitRetainer",
                totalRetainer: 400000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
                variableMetric: "KPIs"
            },
            {
                name: "Airtel Xstream",
                billingModel: "SplitRetainer",
                totalRetainer: 211000,
                fixedSharePercent: 85,
                variableSharePercent: 15,
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
        name: "ITC Hotel",
        contactName: "Sanjay Dutt",
        email: "finance@itchotels.in",
        phone: "+91 99110 54321",
        status: "Active",
        startDate: "2026-02-15",
        lobs: [
            {
                name: "Performance",
                billingModel: "Retainer",
                totalRetainer: 560000,
                fixedSharePercent: 100,
                variableSharePercent: 0,
                variableMetric: "None"
            },
            {
                name: "SEO",
                billingModel: "Retainer",
                totalRetainer: 300000,
                fixedSharePercent: 100,
                variableSharePercent: 0,
                variableMetric: "None"
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
        id: "t1",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Performance",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 1870000, // 85% of 22 Lakhs
        commissionAmount: 330000, // 100% of 15% variable portion
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 2200000,
        status: "Paid",
        dueDate: "2026-07-10"
    },
    {
        id: "t2",
        clientId: "c2",
        clientName: "ITC Hotel",
        lobName: "Performance",
        date: "2026-06-30",
        billingMonth: "June 2026",
        retainerAmount: 560000,
        commissionAmount: 0,
        variableBaseAmount: 0,
        kpiAchievement: 100,
        totalAmount: 560000,
        status: "Pending",
        dueDate: "2026-07-15"
    },
    {
        id: "t3",
        clientId: "c1",
        clientName: "Airtel",
        lobName: "Performance",
        date: "2026-05-31",
        billingMonth: "May 2026",
        retainerAmount: 1870000,
        commissionAmount: 264000, // 80% of 15% variable portion (80% of 330,000)
        variableBaseAmount: 0,
        kpiAchievement: 80,
        totalAmount: 2134000,
        status: "Paid",
        dueDate: "2026-06-10"
    }
];

// Seed to localStorage - Overwrite with structured client-LOB architecture
localStorage.setItem("erp_clients", JSON.stringify(initialClients));
localStorage.setItem("erp_transactions", JSON.stringify(initialTransactions));
