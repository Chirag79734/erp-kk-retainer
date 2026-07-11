'use client'

import { useState } from 'react'
import { Plus, Download, FileText, Filter } from 'lucide-react'
import LogBillingModal from './LogBillingModal'

export default function BillingView({ transactions, user, clients }: { transactions: any[], user: any, clients: any[] }) {
  const [showLogModal, setShowLogModal] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // Finance and Admin can create entries
  const canCreate = user.role === 'ADMIN' || user.role === 'FINANCE'
  // Commercial and Admin can approve entries
  const canApprove = user.role === 'ADMIN' || user.role === 'COMMERCIAL'

  // Apply filters
  const filteredTransactions = transactions.filter(tx => {
    let matchClient = true
    let matchStatus = true

    if (filterClient) {
      matchClient = tx.businessUnit?.client?.id === filterClient
    }
    if (filterStatus) {
      matchStatus = tx.status === filterStatus
    }

    return matchClient && matchStatus
  })

  return (
    <div id="view-billing" className="view-panel active">
      
      <div className="panel-actions">
        <div className="filters-container" style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group-inline">
            <label>Client</label>
            <select 
              id="filter-client" 
              className="form-control"
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group-inline">
            <label>Status</label>
            <select 
              id="filter-status" 
              className="form-control"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Paid</option>
              <option value="PENDING_FOR_APPROVAL">Billing Initiated</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {canCreate && (
          <button 
            className="btn btn-primary" 
            id="btn-log-billing"
            onClick={() => setShowLogModal(true)}
          >
            <Plus size={18} /> Log Billing Transaction
          </button>
        )}
      </div>

      <div className="dashboard-card full-width">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table" id="billing-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date Logged</th>
                  <th>Client</th>
                  <th>LOB</th>
                  <th>Brand</th>
                  <th>Billing Month</th>
                  <th>Retainer</th>
                  <th>Commission</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.invoiceNumber || tx.id.substring(0,8)}</td>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>{tx.businessUnit?.client?.name}</td>
                    <td>{tx.businessUnit?.name}</td>
                    <td>{tx.brandName || '-'}</td>
                    <td>{tx.billingMonth}</td>
                    <td>₹{tx.retainerAmount?.toLocaleString() || 0}</td>
                    <td>₹{tx.commissionAmount?.toLocaleString() || 0}</td>
                    <td style={{ fontWeight: 600 }}>₹{tx.totalAmount?.toLocaleString() || 0}</td>
                    <td>
                      <span className={`status-indicator ${tx.status === 'APPROVED' ? 'status-active' : (tx.status === 'REJECTED' ? 'status-terminated' : 'status-paused')}`}></span>
                      {tx.status === 'APPROVED' ? 'Paid' : (tx.status === 'REJECTED' ? 'Rejected' : 'Billing Initiated')}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="View Details">
                          <FileText size={16} />
                        </button>
                        {canApprove && tx.status === 'PENDING_FOR_APPROVAL' && (
                          <>
                            <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '11px', height: 'auto' }}>Approve</button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', marginLeft: '4px' }}>Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center' }} className="py-8 text-muted">
                      No billing transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showLogModal && (
        <LogBillingModal 
          clients={clients} 
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
