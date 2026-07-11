'use client'
import { useState } from 'react'
import { Users, IndianRupee, FileCheck2, Activity } from 'lucide-react'

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
  const [calcKpi, setCalcKpi] = useState('100')

  // Calculate KPIs
  const activeClients = clients.length
  
  // Total monthly retainer billing (from approved transactions for current month)
  let totalRetainer = 0
  let pendingCount = 0
  
  // Aggregate chart data (grouped by billingMonth)
  const monthlySummary: Record<string, { retainer: number, commission: number }> = {}

  transactions.forEach(tx => {
    if (tx.status === 'APPROVED') {
      totalRetainer += tx.retainerAmount || 0
    }
    if (tx.status === 'PENDING_FOR_APPROVAL') {
      pendingCount++
    }

    // Chart Data Collection
    const month = tx.billingMonth || 'Unknown'
    if (!monthlySummary[month]) {
      monthlySummary[month] = { retainer: 0, commission: 0 }
    }
    monthlySummary[month].retainer += (tx.retainerAmount || 0)
    monthlySummary[month].commission += (tx.commissionAmount || 0)
  })

  // Sort months
  const monthsSorted = Object.keys(monthlySummary).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const retainerData = monthsSorted.map(m => monthlySummary[m].retainer)
  const commissionData = monthsSorted.map(m => monthlySummary[m].commission)

  const chartData = {
    labels: monthsSorted.length > 0 ? monthsSorted : ['No Data'],
    datasets: [
      {
        label: 'Fixed Retainers',
        data: monthsSorted.length > 0 ? retainerData : [0],
        backgroundColor: '#6366f1',
        borderRadius: 6
      },
      {
        label: 'Commissions',
        data: monthsSorted.length > 0 ? commissionData : [0],
        backgroundColor: '#10b981',
        borderRadius: 6
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#94a3b8' } }
    },
    scales: {
      y: { grid: { color: '#ffffff10' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
    }
  }

  // Mini Calculator Logic
  const calcSelectedClient = clients.find(c => c.id === selectedCalcClient)
  const calcSelectedBU = calcSelectedClient?.businessUnits?.find((bu: any) => bu.id === selectedCalcBU)
  
  let calcPreview = null
  if (calcSelectedBU) {
    const kpiVal = parseFloat(calcKpi) || 100
    const fixedSplit = calcSelectedBU.fixedRetainerPercentage / 100
    const varSplit = 1 - fixedSplit
    
    const fixedAmount = calcSelectedBU.monthlyRetainerBase * fixedSplit
    const varAmount = calcSelectedBU.monthlyRetainerBase * varSplit * (kpiVal / 100)
    const total = fixedAmount + varAmount
    
    calcPreview = {
      fixed: fixedAmount,
      variable: varAmount,
      total: total
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Financial Performance</h3>
          <div className="h-[300px] w-full">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="space-y-6">
          {/* Action Alerts */}
          <div className="glass-card p-6 border border-amber-500/20">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <Activity size={18} /> Action Alerts
            </h3>
            <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              {missingBills.length === 0 ? (
                <p className="text-sm text-emerald-400">All retainers logged for {currentMonthStr}</p>
              ) : (
                missingBills.map((b, i) => (
                  <div key={i} className="p-2.5 bg-white/5 rounded text-sm text-slate-300 border-l-2 border-amber-500">
                    <span className="font-semibold text-white">{b.clientName}</span> ({b.buName}) pending for {currentMonthStr}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mini Calculator */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Retainer Lookup</h3>
            <div className="space-y-3">
              <select 
                className="input-field text-sm py-2"
                value={selectedCalcClient}
                onChange={e => { setSelectedCalcClient(e.target.value); setSelectedCalcBU('') }}
              >
                <option value="">Select Client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              
              <select 
                className="input-field text-sm py-2"
                value={selectedCalcBU}
                onChange={e => setSelectedCalcBU(e.target.value)}
                disabled={!selectedCalcClient}
              >
                <option value="">Select LOB...</option>
                {calcSelectedClient?.businessUnits?.map((bu: any) => <option key={bu.id} value={bu.id}>{bu.name}</option>)}
              </select>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="input-field text-sm py-2" 
                  placeholder="KPI %" 
                  value={calcKpi}
                  onChange={e => setCalcKpi(e.target.value)}
                  disabled={!selectedCalcBU}
                />
                <span className="text-slate-400 text-sm">%</span>
              </div>

              {calcPreview && (
                <div className="pt-3 border-t border-white/10 mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Fixed:</span> <span className="text-white">₹{calcPreview.fixed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Variable:</span> <span className="text-emerald-400">+₹{calcPreview.variable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-indigo-400 pt-1">
                    <span>Total:</span> <span>₹{calcPreview.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
