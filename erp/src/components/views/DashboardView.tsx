'use client'

import { Users, IndianRupee, FileCheck2, Activity } from 'lucide-react'

export default function DashboardView({ transactions, clients, user }: { transactions: any[], clients: any[], user: any }) {
  // Calculate KPIs
  const activeClients = clients.length
  
  // Total monthly retainer billing (from approved transactions for current month)
  const currentMonth = new Date().toLocaleString('default', { month: 'short' }) + "'" + new Date().getFullYear().toString().slice(2)
  
  let totalRetainer = 0
  let pendingCount = 0
  
  transactions.forEach(tx => {
    if (tx.status === 'APPROVED') {
      totalRetainer += tx.retainerAmount || 0
    }
    if (tx.status === 'PENDING_FOR_APPROVAL') {
      pendingCount++
    }
  })

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          icon={<Users size={24} />}
          label="Active Clients"
          value={activeClients.toString()}
          gradient="from-blue-500 to-cyan-500"
        />
        <KPICard 
          icon={<IndianRupee size={24} />}
          label="Total Retainer Billed"
          value={`₹${totalRetainer.toLocaleString()}`}
          gradient="from-emerald-500 to-teal-500"
        />
        <KPICard 
          icon={<FileCheck2 size={24} />}
          label="Pending Approvals"
          value={pendingCount.toString()}
          gradient="from-amber-500 to-orange-500"
        />
        <KPICard 
          icon={<Activity size={24} />}
          label="System Status"
          value="Online"
          gradient="from-purple-500 to-indigo-500"
        />
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Billing Activity</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-sm font-medium">
                <th className="pb-3 px-4">Invoice #</th>
                <th className="pb-3 px-4">Client</th>
                <th className="pb-3 px-4">LOB</th>
                <th className="pb-3 px-4">Brand</th>
                <th className="pb-3 px-4">Amount</th>
                <th className="pb-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-mono text-sm text-slate-300">{tx.invoiceNumber || '-'}</td>
                  <td className="py-4 px-4 text-white font-medium">{tx.businessUnit?.client?.name}</td>
                  <td className="py-4 px-4 text-slate-300">{tx.businessUnit?.name}</td>
                  <td className="py-4 px-4 text-slate-400 text-sm">{tx.brandName || '-'}</td>
                  <td className="py-4 px-4 font-semibold text-emerald-400">₹{tx.totalAmount?.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No recent transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({ icon, label, value, gradient }: { icon: React.ReactNode, label: string, value: string, gradient: string }) {
  return (
    <div className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradient} rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500 ease-out`}></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'APPROVED':
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>
    case 'PENDING_FOR_APPROVAL':
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
    case 'REJECTED':
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>
  }
}
