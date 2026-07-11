'use client'

import { useState } from 'react'
import { Plus, Download, FileText, Filter } from 'lucide-react'
import { StatusBadge } from './DashboardView'
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Billing Ledger</h2>
          <p className="text-slate-400 text-sm mt-1">View and manage all client retainer billing entries.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <Filter size={16} className="text-slate-400 ml-2" />
            <select 
              className="bg-transparent text-sm text-slate-300 border-none outline-none py-1.5 px-2 cursor-pointer"
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <div className="w-px h-5 bg-white/10 mx-1"></div>
            
            <select 
              className="bg-transparent text-sm text-slate-300 border-none outline-none py-1.5 px-2 cursor-pointer"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_FOR_APPROVAL">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button className="btn-secondary whitespace-nowrap">
            <Download size={18} />
            Export
          </button>
          {canCreate && (
            <button 
              onClick={() => setShowLogModal(true)}
              className="btn-primary whitespace-nowrap"
            >
              <Plus size={18} />
              Log Billing
            </button>
          )}
        </div>
      </div>

      <div className="glass-card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#0f111a]/50 sticky top-0 z-10">
              <tr className="border-b border-white/10 text-slate-400 text-sm font-medium">
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-6">Date Logged</th>
                <th className="py-4 px-6">Client / LOB</th>
                <th className="py-4 px-6">Brand Name</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-mono text-sm text-slate-300">{tx.invoiceNumber || tx.id.substring(0,8)}</td>
                  <td className="py-4 px-6 text-slate-300 text-sm">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-white font-medium">{tx.businessUnit?.client?.name}</p>
                    <p className="text-slate-400 text-xs">{tx.businessUnit?.name}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-sm">{tx.brandName || '-'}</td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-emerald-400">₹{tx.totalAmount?.toLocaleString()}</p>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg transition-colors" title="View Details">
                        <FileText size={16} />
                      </button>
                      
                      {canApprove && tx.status === 'PENDING_FOR_APPROVAL' && (
                        <>
                          <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded border border-red-500/30 text-xs font-medium hover:bg-red-500/30 transition-colors">
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Receipt className="mx-auto text-slate-600 mb-3" size={32} />
                    <p>No billing transactions found matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {showLogModal && (
        <LogBillingModal 
          clients={clients} 
          onClose={() => setShowLogModal(false)}
          onSuccess={() => {
            setShowLogModal(false)
            // Trigger a refresh or handle optimistic update
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

function Receipt({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17V7"/>
    </svg>
  )
}
