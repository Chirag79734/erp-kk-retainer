'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'

export default function LogBillingModal({ 
  onClose, 
  clients,
  onSuccess
}: { 
  onClose: () => void
  clients: any[]
  onSuccess: () => void
}) {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedLob, setSelectedLob] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [billingMonth, setBillingMonth] = useState('')
  
  // Computed fields
  const [brandName, setBrandName] = useState('')
  const [retainerAmount, setRetainerAmount] = useState<number>(0)
  const [commissionAmount, setCommissionAmount] = useState<number>(0)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeClient = clients.find(c => c.id === selectedClient)
  const activeLob = activeClient?.lobs?.find((l: any) => l.id === selectedLob)

  // Auto-fill logic based on selected Client and LOB
  useEffect(() => {
    if (activeClient && activeLob) {
      // Retainer calculation
      if (activeLob.billingModel === 'SplitRetainer') {
        const fixed = activeLob.fixedAmount || (activeLob.totalRetainer * (activeLob.fixedSharePercent / 100))
        setRetainerAmount(fixed)
      } else {
        setRetainerAmount(activeLob.totalRetainer || 0)
      }

      // Brand Name logic (Legacy parity)
      if (activeClient.name === 'Airtel') {
        if (activeLob.name === 'Airtel Payment Bank') {
          setBrandName('Airtel Payment Bank')
        } else {
          setBrandName('Bharti Airtel Limited')
        }
      } else {
        setBrandName(activeClient.name)
      }
    } else {
      setRetainerAmount(0)
      setBrandName('')
    }
  }, [activeClient, activeLob])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          poNumber,
          billingMonth,
          brandName,
          retainerAmount: Number(retainerAmount),
          commissionAmount: Number(commissionAmount),
          totalAmount: Number(retainerAmount) + Number(commissionAmount),
          businessUnitId: selectedLob
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create transaction')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0f111a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-xl font-bold text-white">Log New Billing</h3>
            <p className="text-slate-400 text-sm">Create a new retainer and commission entry.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <form id="billingForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Client *</label>
                <select 
                  required
                  value={selectedClient} 
                  onChange={(e) => {
                    setSelectedClient(e.target.value)
                    setSelectedLob('')
                  }}
                  className="input-field"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Business Unit (LOB) *</label>
                <select 
                  required
                  disabled={!selectedClient}
                  value={selectedLob} 
                  onChange={(e) => setSelectedLob(e.target.value)}
                  className="input-field disabled:opacity-50"
                >
                  <option value="">-- Choose LOB --</option>
                  {activeClient?.lobs?.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">PO Number</label>
                <input 
                  type="text" 
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Billing Month *</label>
                <input 
                  type="month" 
                  required
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-4">Financial Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Billed Entity Name (Brand)</label>
                  <input 
                    type="text" 
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="input-field bg-white/5"
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-1">Auto-calculated based on rules</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Retainer Amount (₹) *</label>
                  <input 
                    type="number" 
                    required
                    value={retainerAmount}
                    onChange={(e) => setRetainerAmount(Number(e.target.value))}
                    className="input-field"
                  />
                  {activeLob?.billingModel === 'SplitRetainer' && (
                    <p className="text-xs text-indigo-400 mt-1">Split Retainer: Auto-calculated fixed share ({activeLob.fixedSharePercent}%)</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Commission / Variable (₹)</label>
                  <input 
                    type="number" 
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Total Amount (₹)</label>
                  <input 
                    type="number" 
                    value={Number(retainerAmount) + Number(commissionAmount)}
                    readOnly
                    className="input-field bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>
        
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="billingForm"
            className="btn-primary"
            disabled={loading}
          >
            <CheckCircle2 size={18} />
            {loading ? 'Submitting...' : 'Submit to Workflow'}
          </button>
        </div>
      </div>
    </div>
  )
}
