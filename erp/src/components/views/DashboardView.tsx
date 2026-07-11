'use client'
import { useState } from 'react'
import { Users, IndianRupee, Wallet, TrendingUp, Bell, Search, BarChart3 } from 'lucide-react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function DashboardView({ transactions, clients, user }: { transactions: any[], clients: any[], user: any }) {
  const [selectedCalcClient, setSelectedCalcClient] = useState('')
  const [selectedCalcBU, setSelectedCalcBU] = useState('')
  const [calcMonth, setCalcMonth] = useState('')

  // Calculate KPIs
  const activeClients = clients.length
  
  let totalRetainer = 0
  
  const monthlySummary: Record<string, { retainer: number, commission: number }> = {}

  transactions.forEach(tx => {
    if (tx.status === 'APPROVED') {
      totalRetainer += tx.retainerAmount || 0
    }

    const month = tx.billingMonth || 'Unknown'
    if (!monthlySummary[month]) {
      monthlySummary[month] = { retainer: 0, commission: 0 }
    }
    monthlySummary[month].retainer += (tx.retainerAmount || 0)
    monthlySummary[month].commission += (tx.commissionAmount || 0)
  })

  const monthsSorted = Object.keys(monthlySummary).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const retainerData = monthsSorted.map(m => monthlySummary[m].retainer)
  const commissionData = monthsSorted.map(m => monthlySummary[m].commission)

  // Current month fixed & variable averages for KPI (Simplified mock for legacy parity)
  const currentMonthFixed = retainerData.length > 0 ? retainerData[retainerData.length - 1] : 0
  const currentMonthVariable = commissionData.length > 0 ? commissionData[commissionData.length - 1] : 0

  const chartData = {
    labels: monthsSorted.length > 0 ? monthsSorted : ['No Data'],
    datasets: [
      {
        label: 'Fixed Retainers',
        data: monthsSorted.length > 0 ? retainerData : [0],
        backgroundColor: '#6366f1',
        borderRadius: 4
      },
      {
        label: 'Commissions',
        data: monthsSorted.length > 0 ? commissionData : [0],
        backgroundColor: '#10b981',
        borderRadius: 4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  // Mini Calculator Logic (Legacy behavior)
  const calcSelectedClientObj = clients.find(c => c.id === selectedCalcClient)
  const calcSelectedBUObj = calcSelectedClientObj?.businessUnits?.find((bu: any) => bu.id === selectedCalcBU)
  
  let calcPreview = null
  if (calcSelectedBUObj && calcMonth) {
    const matchingTx = transactions.find(tx => 
      tx.businessUnitId === calcSelectedBUObj.id && tx.billingMonth === calcMonth
    )
    if (matchingTx) {
      calcPreview = {
        status: matchingTx.status === 'APPROVED' ? 'PAID' : (matchingTx.status === 'PENDING_FOR_APPROVAL' ? 'BILLING INITIATED' : 'NOT YET BILLED'),
        fixed: matchingTx.retainerAmount || 0,
        variable: matchingTx.commissionAmount || 0,
        total: matchingTx.totalAmount || 0
      }
    } else {
      calcPreview = {
        status: 'NOT YET BILLED',
        fixed: 0,
        variable: 0,
        total: 0
      }
    }
  }

  // Billing Alerts Logic
  const now = new Date()
  const currentMonthName = now.toLocaleString('default', { month: 'long' })
  const currentYear = now.getFullYear()
  const currentMonthStr = `${currentMonthName} ${currentYear}`
  
  const missingBills: any[] = []
  clients.forEach(c => {
    c.businessUnits?.forEach((bu: any) => {
      const hasBilled = transactions.some(tx => 
        tx.businessUnitId === bu.id && 
        tx.billingMonth === currentMonthStr && 
        tx.status !== 'REJECTED'
      )
      if (!hasBilled) missingBills.push({ clientName: c.name, buName: bu.name })
    })
  })

  return (
    <div id="view-dashboard" className="view-panel active">
      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="kpi-card purple-gradient">
          <div className="kpi-icon"><Users /></div>
          <div className="kpi-info">
            <span className="kpi-label">Active Clients</span>
            <h3 className="kpi-val">{activeClients}</h3>
          </div>
        </div>
        <div className="kpi-card green-gradient">
          <div className="kpi-icon"><IndianRupee /></div>
          <div className="kpi-info">
            <span className="kpi-label">Total Monthly Retainer Billing</span>
            <h3 className="kpi-val">₹{totalRetainer.toLocaleString()}</h3>
          </div>
        </div>
        <div className="kpi-card blue-gradient">
          <div className="kpi-icon"><Wallet /></div>
          <div className="kpi-info">
            <span className="kpi-label">Monthly Fixed Retainer</span>
            <h3 className="kpi-val">₹{currentMonthFixed.toLocaleString()}</h3>
          </div>
        </div>
        <div className="kpi-card gold-gradient">
          <div className="kpi-icon"><TrendingUp /></div>
          <div className="kpi-info">
            <span className="kpi-label">Monthly Variable Retainer</span>
            <h3 className="kpi-val">₹{currentMonthVariable.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Billing Alerts Card */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', margin: 0, padding: '24px' }}>
          <div className="card-header border-bottom" style={{ paddingTop: 0, paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px' }}>
              <Bell className="text-gold" style={{ width: '18px', height: '18px' }} />
              Billing Action Alerts
            </h3>
          </div>
          <div className="card-body" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
            {missingBills.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: 'var(--success-light)', borderLeft: '3px solid var(--success)', borderRadius: '4px', color: 'var(--success)' }}>
                <strong>All clear!</strong> No pending billing actions for {currentMonthStr}.
              </div>
            ) : (
              missingBills.map((b, i) => (
                <div key={i} style={{ padding: '12px', backgroundColor: 'var(--warning-light)', borderLeft: '3px solid var(--warning)', borderRadius: '4px' }}>
                  <strong>{b.clientName} ({b.buName})</strong> pending billing action for {currentMonthStr}.
                </div>
              ))
            )}
          </div>
        </div>

        {/* Retainer Lookup & Tracker Card */}
        <div className="dashboard-card mini-calc-card">
          <div className="card-header">
            <h3>Retainer Lookup & Tracker</h3>
            <Search className="text-gold" size={18} />
          </div>
          <div className="card-body">
            <form>
              <div className="form-group">
                <label>Select Client</label>
                <select className="form-control" value={selectedCalcClient} onChange={e => { setSelectedCalcClient(e.target.value); setSelectedCalcBU(''); setCalcMonth('') }}>
                  <option value="">Choose Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Business Unit</label>
                <select className="form-control" value={selectedCalcBU} onChange={e => setSelectedCalcBU(e.target.value)} disabled={!selectedCalcClient}>
                  <option value="">Choose BU...</option>
                  {calcSelectedClientObj?.businessUnits?.map((bu: any) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Billing Month</label>
                <input type="month" className="form-control" value={calcMonth} onChange={e => setCalcMonth(e.target.value)} disabled={!selectedCalcBU} />
              </div>
              
              {calcPreview && (
                <div className="calc-results-preview" style={{ display: 'flex', marginTop: '18px', borderTop: '1px dashed var(--border-color)', paddingTop: '14px' }}>
                  <div className="result-row" style={{ marginBottom: '8px' }}>
                    <span>Status:</span>
                    <span className={`badge ${calcPreview.status === 'PAID' ? 'badge-success' : (calcPreview.status === 'NOT YET BILLED' ? 'badge-danger' : 'badge-warning')}`}>{calcPreview.status}</span>
                  </div>
                  <div className="result-row">
                    <span>Fixed Retainer:</span>
                    <strong>₹{calcPreview.fixed.toLocaleString()}</strong>
                  </div>
                  <div className="result-row">
                    <span>Variable Retainer:</span>
                    <strong>₹{calcPreview.variable.toLocaleString()}</strong>
                  </div>
                  <hr className="summary-divider" style={{ margin: '10px 0' }} />
                  <div className="result-row total">
                    <span>Total Retainer:</span>
                    <strong>₹{calcPreview.total.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Alerts & Recent Invoices */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
        
        {/* Financial Performance Chart Card */}
        <div className="dashboard-card chart-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', margin: 0, padding: '24px' }}>
          <div className="card-header" style={{ paddingTop: 0, paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Financial Performance</h3>
            <div className="card-actions">
              <span className="badge badge-accent">Monthly Trend</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ maxHeight: '250px', width: '100%', height: '250px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="dashboard-card table-card" style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', margin: 0, padding: '24px' }}>
          <div className="card-header" style={{ paddingTop: 0, paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Recent Billing Invoices</h3>
            <button className="btn btn-sm btn-outline">View All Ledger</button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Client Name</th>
                    <th>Billing Month</th>
                    <th>Retainer Fee</th>
                    <th>Commission Fee</th>
                    <th>Total Billed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.invoiceNumber || '-'}</td>
                      <td>{tx.businessUnit?.client?.name}</td>
                      <td>{tx.billingMonth}</td>
                      <td>₹{tx.retainerAmount?.toLocaleString()}</td>
                      <td>₹{tx.commissionAmount?.toLocaleString()}</td>
                      <td>₹{tx.totalAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`status-indicator ${tx.status === 'APPROVED' ? 'status-active' : (tx.status === 'REJECTED' ? 'status-terminated' : 'status-paused')}`}></span>
                        {tx.status === 'APPROVED' ? 'Paid' : (tx.status === 'REJECTED' ? 'Rejected' : 'Billing Initiated')}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center' }}>No recent invoices.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
