'use client'

import { useState } from 'react'
import { Search, Plus, Building2, Download, Edit2, Trash2, X, Filter } from 'lucide-react'

export default function ClientsView({ clients, transactions = [] }: { clients: any[], transactions?: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null)

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportWSDetails = (client: any) => {
    // Collect all transactions for this client's LOBs
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Client Directory</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your active clients and lines of business.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button className="btn-primary whitespace-nowrap">
            <Plus size={18} />
            Add Client
          </button>
        </div>
      </div>

      {/* Legacy Data Table Layout */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-300 text-sm font-medium">
                <th className="py-4 px-6">Client Name</th>
                <th className="py-4 px-6">Contact Details</th>
                <th className="py-4 px-6">Business Units</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <Building2 className="text-indigo-400" size={20} />
                      </div>
                      <span className="font-bold text-white">{client.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-slate-200">{client.contactName || 'N/A'}</span>
                      <span className="text-slate-400 text-sm">{client.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {client.lobs?.slice(0, 2).map((lob: any) => (
                        <span key={lob.id} className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-xs">
                          {lob.name}
                        </span>
                      ))}
                      {client.lobs && client.lobs.length > 2 && (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-xs">
                          +{client.lobs.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {client.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setSelectedWorkspace(client)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        Workspace
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No clients match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workspace Drill-down Modal */}
      {selectedWorkspace && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-[#1a1d27] border-l border-white/10 w-full max-w-3xl h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Building2 className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedWorkspace.name}</h2>
                  <p className="text-slate-400 text-sm">Client Workspace & Billing Data</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => exportWSDetails(selectedWorkspace)}
                  className="btn-secondary whitespace-nowrap"
                >
                  <Download size={16} /> Export CSV
                </button>
                <button 
                  onClick={() => setSelectedWorkspace(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-8 custom-scrollbar">
              {/* Financial Year/Month Filters */}
              <div className="flex gap-4">
                <select className="input-field max-w-[200px]">
                  <option>FY 2025-26</option>
                  <option>FY 2026-27</option>
                </select>
                <button className="btn-secondary"><Filter size={16} /> Apply Filters</button>
              </div>

              {/* KPI Snapshots */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-sm text-slate-400">Total Billed YTD</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">₹0.00</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-sm text-slate-400">Pending Approvals</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">0</p>
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-sm text-slate-400">Active LOBs</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{selectedWorkspace.lobs?.length || 0}</p>
                </div>
              </div>

              {/* Billing Progress Bars */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">LOB Billing Progress</h3>
                <div className="space-y-4">
                  {selectedWorkspace.lobs?.map((lob: any) => (
                    <div key={lob.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 font-medium">{lob.name}</span>
                        <span className="text-slate-400">0 / 12 Invoices Generated</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                    </div>
                  ))}
                  {(!selectedWorkspace.lobs || selectedWorkspace.lobs.length === 0) && (
                    <p className="text-slate-500 italic">No Lines of Business assigned.</p>
                  )}
                </div>
              </div>

              {/* Invoice Summary Table */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Invoices</h3>
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-slate-400 text-sm">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Month</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500">
                          No invoices generated yet.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
