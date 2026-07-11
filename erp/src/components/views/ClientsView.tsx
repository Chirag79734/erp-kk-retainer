'use client'

import { useState } from 'react'
import { Search, Plus, ArrowLeft, Download, Edit2, Trash2, Database, ShieldCheck, TrendingUp, IndianRupee, Mail, BarChart3, Receipt } from 'lucide-react'

export default function ClientsView({ clients, transactions = [] }: { clients: any[], transactions?: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null)
  
  // Workspace filter states
  const [wsMonth, setWsMonth] = useState('April')

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportWSDetails = (client: any) => {
    // Keep exact same export logic as before
    const clientBUs = client.lobs || client.businessUnits || []
    const buIds = clientBUs.map((bu: any) => bu.id)
    const clientTxs = transactions.filter(tx => buIds.includes(tx.businessUnitId))
    
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Invoice Number,LOB,Brand,Billing Month,Fixed Retainer,Variable Commission,Total Amount,Status\n"
    
    clientTxs.forEach(tx => {
      const buName = clientBUs.find((bu: any) => bu.id === tx.businessUnitId)?.name || 'Unknown'
      const row = [
        tx.invoiceNumber || '-',
        buName,
        tx.brandName || '-',
        tx.billingMonth,
        tx.retainerAmount,
        tx.commissionAmount,
        tx.totalAmount,
        tx.status
      ].map(field => `"${field}"`).join(",")
      csvContent += row + "\n"
    })
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${client.name}_workspace_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate workspace KPIs
  let wsTotalBilled = 0
  let wsFixedBilled = 0
  let wsVariableBilled = 0
  let wsTotalRetainerBase = 0 // Baseline monthly retainer

  if (selectedWorkspace) {
    const clientBUs = selectedWorkspace.lobs || selectedWorkspace.businessUnits || []
    clientBUs.forEach((bu: any) => {
      wsTotalRetainerBase += (bu.monthlyRetainerBase || 0)
    })

    const buIds = clientBUs.map((bu: any) => bu.id)
    const clientTxs = transactions.filter(tx => buIds.includes(tx.businessUnitId))
    
    clientTxs.forEach(tx => {
      if (tx.status === 'APPROVED') {
        wsTotalBilled += (tx.totalAmount || 0)
        wsFixedBilled += (tx.retainerAmount || 0)
        wsVariableBilled += (tx.commissionAmount || 0)
      }
    })
  }

  return (
    <div id="view-clients" className="view-panel active">
      
      {!selectedWorkspace ? (
        <div id="clients-list-subpanel">
          <div className="panel-actions">
            <div className="search-bar-container">
              <Search className="search-icon" />
              <input 
                type="text" 
                id="search-clients" 
                placeholder="Search clients by name, contact, billing model..." 
                className="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" id="btn-add-client">
              <Plus size={18} /> Add New Client
            </button>
          </div>
          
          <div className="dashboard-card full-width">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table" id="clients-table">
                  <thead>
                    <tr>
                      <th>Client Name</th>
                      <th>Primary Contact</th>
                      <th>Billing Model</th>
                      <th>Fixed Retainer</th>
                      <th>Commission Setup</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map(client => {
                      // Determine model text for legacy table
                      const lobs = client.lobs || client.businessUnits || []
                      const totalFixed = lobs.reduce((sum: number, bu: any) => sum + (bu.monthlyRetainerBase || 0), 0)
                      const modelText = lobs.length > 0 ? (lobs[0].fixedRetainerPercentage < 100 ? 'Hybrid (Fixed + Var)' : 'Fixed Retainer Only') : 'Not Configured'
                      
                      return (
                        <tr key={client.id}>
                          <td style={{ fontWeight: 600 }}>{client.name}</td>
                          <td>
                            <div>{client.contactName || '-'}</div>
                            <div className="small text-muted">{client.email || ''}</div>
                          </td>
                          <td>{modelText}</td>
                          <td>₹{totalFixed.toLocaleString()}</td>
                          <td>
                            <span className="badge badge-accent">Configured</span>
                          </td>
                          <td>
                            <span className="badge badge-success">{client.status || 'Active'}</span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon" title="View Workspace" onClick={() => setSelectedWorkspace(client)}>
                                <BarChart3 size={16} />
                              </button>
                              <button className="btn-icon edit" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button className="btn-icon delete" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredClients.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center' }}>No clients found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div id="clients-detail-subpanel">
          <div className="panel-actions" style={{ marginBottom: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setSelectedWorkspace(null)} style={{ padding: '6px 12px', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Back to Directory
            </button>
          </div>
          
          {/* Workspace Header Card */}
          <div className="dashboard-card" style={{ marginBottom: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div id="ws-avatar" style={{ width: '56px', height: '56px', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {selectedWorkspace.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 id="ws-client-name" style={{ margin: 0, fontSize: '24px' }}>{selectedWorkspace.name} Workspace</h2>
                  <span className="badge badge-success" id="ws-client-status">Active</span>
                </div>
                <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                  Professional drill-down across retainer, PO, billing, invoice, collection, and approval activity.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group-inline">
                  <label style={{ fontSize: '11px' }}>Financial Year</label>
                  <select id="ws-filter-fy" className="form-control form-control-sm" style={{ width: '130px' }}>
                    <option value="FY 2026-27">FY 2026-27</option>
                    <option value="FY 2025-26">FY 2025-26</option>
                  </select>
                </div>
                <div className="form-group-inline">
                  <label style={{ fontSize: '11px' }}>Month</label>
                  <select id="ws-filter-month" className="form-control form-control-sm" style={{ width: '100px' }} value={wsMonth} onChange={e => setWsMonth(e.target.value)}>
                    <option value="January">Jan</option>
                    <option value="February">Feb</option>
                    <option value="March">Mar</option>
                    <option value="April">Apr</option>
                    <option value="May">May</option>
                    <option value="June">Jun</option>
                    <option value="July">Jul</option>
                    <option value="August">Aug</option>
                    <option value="September">Sep</option>
                    <option value="October">Oct</option>
                    <option value="November">Nov</option>
                    <option value="December">Dec</option>
                  </select>
                </div>
              </div>
              
              <button className="btn btn-outline" style={{ gap: '8px' }} onClick={() => exportWSDetails(selectedWorkspace)}>
                <Download style={{ width: '16px', height: '16px' }} /> Export
              </button>
            </div>
          </div>
          
          {/* Overview Snapshot Card */}
          <div className="dashboard-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 className="text-gold" /> Client Overview
                </h3>
                <p className="text-muted small" id="ws-snapshot-label" style={{ margin: '4px 0 0 0' }}>Executive snapshot for {wsMonth}</p>
              </div>
            </div>
            
            <div className="kpi-grid" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <div className="kpi-card" style={{ backgroundColor: 'rgba(99, 102, 241, 0.04)', borderColor: 'rgba(99, 102, 241, 0.15)', padding: '16px 20px' }}>
                <div className="kpi-info">
                  <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}><Database style={{ width: '13px', height: '13px' }} /> Monthly Retainer</span>
                  <h3 className="kpi-val" id="ws-kpi-retainer" style={{ marginTop: '6px', fontSize: '18px' }}>₹{wsTotalRetainerBase.toLocaleString()}</h3>
                </div>
              </div>
              <div className="kpi-card" style={{ backgroundColor: 'rgba(14, 165, 233, 0.04)', borderColor: 'rgba(14, 165, 233, 0.15)', padding: '16px 20px' }}>
                <div className="kpi-info">
                  <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}><ShieldCheck style={{ width: '13px', height: '13px' }} /> Total Fixed Billed</span>
                  <h3 className="kpi-val" id="ws-kpi-fixed-billed" style={{ marginTop: '6px', fontSize: '18px' }}>₹{wsFixedBilled.toLocaleString()}</h3>
                </div>
              </div>
              <div className="kpi-card" style={{ backgroundColor: 'rgba(167, 139, 250, 0.04)', borderColor: 'rgba(167, 139, 250, 0.15)', padding: '16px 20px' }}>
                <div className="kpi-info">
                  <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}><TrendingUp style={{ width: '13px', height: '13px' }} /> Total Variable Billed</span>
                  <h3 className="kpi-val" id="ws-kpi-variable-billed" style={{ marginTop: '6px', fontSize: '18px' }}>₹{wsVariableBilled.toLocaleString()}</h3>
                </div>
              </div>
              <div className="kpi-card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.15)', padding: '16px 20px' }}>
                <div className="kpi-info">
                  <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}><IndianRupee style={{ width: '13px', height: '13px' }} /> Total Billed</span>
                  <h3 className="kpi-val" id="ws-kpi-billed" style={{ marginTop: '6px', fontSize: '18px' }}>₹{wsTotalBilled.toLocaleString()}</h3>
                </div>
              </div>
              <div className="kpi-card" style={{ backgroundColor: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.15)', padding: '16px 20px' }}>
                <div className="kpi-info">
                  <span className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}><Mail style={{ width: '13px', height: '13px' }} /> Collection</span>
                  <h3 className="kpi-val" id="ws-kpi-collection" style={{ marginTop: '6px', fontSize: '18px' }}>₹{wsTotalBilled.toLocaleString()}</h3>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Billing Progress</span>
                <span id="ws-progress-text" style={{ fontWeight: 700, fontSize: '13px', color: 'var(--success)' }}>100%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div id="ws-progress-bar" style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>
          </div>

          {/* Invoice Summary Card */}
          <div className="dashboard-card full-width" style={{ marginTop: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt className="text-gold" /> Invoice Summary
              </h3>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table" id="ws-invoice-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Client Name</th>
                      <th>Month</th>
                      <th>Billing Type</th>
                      <th>Basis Variable Value</th>
                      <th>Retainer Amount</th>
                      <th>Commission Amount</th>
                      <th>Total Invoice</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Simplified for demo, ordinarily we'd map over client transactions */}
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center' }} className="py-8 text-muted">Select an invoice from billing ledger.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
