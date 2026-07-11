'use client'

import { useState } from 'react'
import { Calculator, AlertCircle, TrendingUp, IndianRupee, Percent } from 'lucide-react'

export default function CommissionCalculatorView({ clients }: { clients: any[] }) {
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedBU, setSelectedBU] = useState('')
  const [kpiAchievement, setKpiAchievement] = useState('100')
  const [revenueTarget, setRevenueTarget] = useState('0')
  const [revenueAchieved, setRevenueAchieved] = useState('0')

  const client = clients.find(c => c.id === selectedClient)
  const bu = client?.businessUnits?.find((b: any) => b.id === selectedBU) || client?.lobs?.find((b: any) => b.id === selectedBU)

  let calculationResult = null

  if (bu) {
    const kpiVal = parseFloat(kpiAchievement) || 0
    const fixedSplit = bu.fixedRetainerPercentage / 100
    const varSplit = 1 - fixedSplit
    
    const fixedAmount = bu.monthlyRetainerBase * fixedSplit
    const maxVarAmount = bu.monthlyRetainerBase * varSplit
    const earnedVarAmount = maxVarAmount * (kpiVal / 100)
    
    calculationResult = {
      fixedAmount,
      maxVarAmount,
      earnedVarAmount,
      totalEarned: fixedAmount + earnedVarAmount,
      targetBase: bu.monthlyRetainerBase,
      fixedPercentage: bu.fixedRetainerPercentage,
      varPercentage: 100 - bu.fixedRetainerPercentage
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator className="text-indigo-400" />
          Commission Calculator
        </h2>
        <p className="text-slate-400 text-sm mt-1">Stateless scratchpad for calculating variable payouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Client</label>
                <select 
                  className="input-field"
                  value={selectedClient}
                  onChange={e => { setSelectedClient(e.target.value); setSelectedBU('') }}
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Line of Business</label>
                <select 
                  className="input-field"
                  value={selectedBU}
                  onChange={e => setSelectedBU(e.target.value)}
                  disabled={!selectedClient}
                >
                  <option value="">Select LOB...</option>
                  {(client?.businessUnits || client?.lobs)?.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {bu && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <p className="text-xs text-indigo-300 font-semibold mb-2 uppercase tracking-wide">Base Config Loaded</p>
                  <div className="flex justify-between text-sm text-slate-300 mb-1">
                    <span>Base Retainer:</span>
                    <span className="font-mono text-white">₹{bu.monthlyRetainerBase.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-300">
                    <span>Split Ratio:</span>
                    <span className="font-mono text-white">{bu.fixedRetainerPercentage}% Fixed / {100 - bu.fixedRetainerPercentage}% Var</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-slate-300 mb-1">KPI Achievement (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    className="input-field pl-9"
                    value={kpiAchievement}
                    onChange={e => setKpiAchievement(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Optional: Revenue Target (₹)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    className="input-field pl-9"
                    value={revenueTarget}
                    onChange={e => setRevenueTarget(e.target.value)}
                    placeholder="Total Revenue Target"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Optional: Revenue Achieved (₹)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number" 
                    className="input-field pl-9"
                    value={revenueAchieved}
                    onChange={e => {
                      setRevenueAchieved(e.target.value)
                      if (parseFloat(revenueTarget) > 0) {
                        const ach = parseFloat(e.target.value) || 0
                        const tgt = parseFloat(revenueTarget)
                        setKpiAchievement(((ach / tgt) * 100).toFixed(2).toString())
                      }
                    }}
                    placeholder="Actual Revenue"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!calculationResult ? (
            <div className="glass-card h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
              <Calculator className="text-slate-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-300">Awaiting Configuration</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Select a client and line of business on the left to see the breakdown of their fixed and variable payouts.
              </p>
            </div>
          ) : (
            <div className="glass-card p-6 h-full flex flex-col animate-fade-in">
              <h3 className="text-lg font-semibold text-white mb-6">Payout Breakdown</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Guaranteed Fixed ({calculationResult.fixedPercentage}%)</p>
                  <p className="text-2xl font-bold text-white">₹{calculationResult.fixedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Variable Pool ({calculationResult.varPercentage}%)</p>
                  <p className="text-2xl font-bold text-slate-300">₹{calculationResult.maxVarAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-white/10 border-dashed"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-[#1a1d27] text-sm text-indigo-400 font-semibold uppercase tracking-wider">
                    Performance Result
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Earned Variable ({kpiAchievement}% KPI)</p>
                  <p className="text-4xl font-bold text-emerald-400">
                    +₹{calculationResult.earnedVarAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4"></div>
                
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-2">Total Recommended Payout</p>
                  <div className="inline-block p-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    <div className="bg-[#1a1d27] px-8 py-4 rounded-lg">
                      <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                        ₹{calculationResult.totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-amber-200/80">
                    This is a stateless scratchpad. Values calculated here are not saved to the database. To log an official transaction, use the "Log Billing" button on the Billing Ledger.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
