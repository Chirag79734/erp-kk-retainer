'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, Receipt, Calculator, FileText, LogOut } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
// Import views
import DashboardView from './views/DashboardView'
import ClientsView from './views/ClientsView'
import BillingView from './views/BillingView'
import CommissionCalculatorView from './views/CommissionCalculatorView'

type User = any
type Client = any
type Transaction = any

export default function DashboardApp({ 
  user, 
  initialClients, 
  initialTransactions 
}: { 
  user: User
  initialClients: Client[]
  initialTransactions: Transaction[]
}) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const renderView = () => {
    switch(activeTab) {
      case 'dashboard':
        return <DashboardView transactions={transactions} clients={clients} user={user} />
      case 'clients':
        return <ClientsView clients={clients} transactions={transactions} />
      case 'billing':
        return <BillingView transactions={transactions} user={user} clients={clients} />
      case 'calculator':
        return <CommissionCalculatorView clients={clients} />
      // ... Add invoice viewer later if needed
      default:
        return <DashboardView transactions={transactions} clients={clients} user={user} />
    }
  }

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Dashboard Overview'
      case 'clients': return 'Clients Directory'
      case 'billing': return 'Billing Ledger'
      case 'calculator': return 'Commission Calculator'
      default: return 'Overview'
    }
  }

  return (
    <div className="flex h-full w-full bg-[#0f111a]">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
              KK
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">KK ERP</h2>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Clients Directory" isActive={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <NavItem icon={<Receipt size={20} />} label="Billing Ledger" isActive={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <NavItem icon={<Calculator size={20} />} label="Commission Calc" isActive={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')} />
          <NavItem icon={<FileText size={20} />} label="Invoice Hub" isActive={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} />
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-sm font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.role}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 border-b border-white/10 bg-[#0f111a]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{getTitle()}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Action buttons will go inside specific views (like Add Client in ClientsView) */}
          </div>
        </header>
        
        {/* Scrollable View Area */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          {renderView()}
        </div>
        
        {/* Background Gradients */}
        <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium
        ${isActive 
          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }
      `}
    >
      <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>{icon}</span>
      {label}
    </button>
  )
}
