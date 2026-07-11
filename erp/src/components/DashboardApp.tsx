'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Receipt, Calculator, FileText, LogOut, Calendar } from 'lucide-react'
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

  // Ensure client-side only rendering for some components if needed
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
      case 'invoice-viewer':
        // Fallback for now if invoice hub isn't implemented
        return <div className="view-panel active"><h2>Invoice Hub (Under Construction)</h2></div>
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
      case 'invoice-viewer': return 'Invoice Hub'
      default: return 'Overview'
    }
  }
  
  const getSubtitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Welcome back. Here is your business billing summary.'
      case 'clients': return 'Manage your active clients and lines of business.'
      case 'billing': return 'View and manage all client retainer billing entries.'
      case 'calculator': return 'Generate exact monthly commissions based on your dynamic performance metric.'
      case 'invoice-viewer': return 'View and print professional invoices.'
      default: return ''
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (!mounted) return null

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">KK</div>
          <h2>KK ERP</h2>
        </div>
        
        <nav className="sidebar-menu">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard') }}>
            <LayoutDashboard />
            <span>Dashboard</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('clients') }}>
            <Users />
            <span>Clients Directory</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('billing') }}>
            <Receipt />
            <span>Billing Ledger</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'calculator' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('calculator') }}>
            <Calculator />
            <span>Commission Calc</span>
          </a>
          <a href="#" className={`nav-item ${activeTab === 'invoice-viewer' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('invoice-viewer') }}>
            <FileText />
            <span>Invoice Hub</span>
          </a>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user?.email?.substring(0, 2).toUpperCase() || 'AD'}</div>
            <div className="user-info">
              <h4>{user?.role || 'Admin Panel'}</h4>
              <p>{user?.email || 'billing@kkcompany.com'}</p>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: 'auto' }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Application Area */}
      <main className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="page-title">
            <h1 id="view-title">{getTitle()}</h1>
            <p id="view-subtitle" className="text-muted">{getSubtitle()}</p>
          </div>
          <div className="topbar-actions">
            <div className="date-badge">
              <Calendar size={16} />
              <span id="current-date">{currentDate}</span>
            </div>
          </div>
        </header>
        
        {/* Render Active View */}
        {renderView()}
      </main>
    </div>
  )
}
