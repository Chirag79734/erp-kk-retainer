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
    <div id="view-calculator" className="view-panel active">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '20px' }}>
          <Calculator className="text-primary" /> Commission Calculator
        </h2>
        <p className="text-muted" style={{ marginTop: '4px', fontSize: '14px' }}>Stateless scratchpad for calculating variable payouts.</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Input Panel */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          <div className="card-header border-bottom">
            <h3 style={{ margin: 0 }}>Configuration</h3>
          </div>
          <div className="card-body">
            <form id="calc-form">
              <div className="form-group">
                <label>Client</label>
                <select 
                  id="calc-client-select" 
                  className="form-control"
                  value={selectedClient}
                  onChange={e => { setSelectedClient(e.target.value); setSelectedBU('') }}
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Line of Business</label>
                <select 
                  id="calc-lob-select" 
                  className="form-control"
                  value={selectedBU}
                  onChange={e => setSelectedBU(e.target.value)}
                  disabled={!selectedClient}
                >
                  <option value="">Select LOB...</option>
                  {(client?.businessUnits || client?.lobs || []).map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {bu && (
                <div id="calc-base-config" style={{ padding: '16px', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Base Config Loaded</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span className="text-muted">Base Retainer:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>₹{bu.monthlyRetainerBase.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="text-muted">Split Ratio:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{bu.fixedRetainerPercentage}% Fixed / {100 - bu.fixedRetainerPercentage}% Var</span>
                  </div>
                </div>
              )}

              <hr className="summary-divider" />

              <div className="form-group">
                <label>KPI Achievement (%)</label>
                <div className="search-bar-container">
                  <Percent className="search-icon" style={{ width: '16px' }} />
                  <input 
                    type="number" 
                    id="calc-kpi-input" 
                    className="search-input" 
                    placeholder="e.g. 100"
                    value={kpiAchievement}
                    onChange={e => setKpiAchievement(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Optional: Revenue Target (₹)</label>
                <div className="search-bar-container">
                  <IndianRupee className="search-icon" style={{ width: '16px' }} />
                  <input 
                    type="number" 
                    id="calc-rev-target" 
                    className="search-input" 
                    placeholder="Total Revenue Target"
                    value={revenueTarget}
                    onChange={e => setRevenueTarget(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Optional: Revenue Achieved (₹)</label>
                <div className="search-bar-container">
                  <TrendingUp className="search-icon" style={{ width: '16px' }} />
                  <input 
                    type="number" 
                    id="calc-rev-achieved" 
                    className="search-input" 
                    placeholder="Actual Revenue"
                    value={revenueAchieved}
                    onChange={e => {
                      setRevenueAchieved(e.target.value)
                      if (parseFloat(revenueTarget) > 0) {
                        const ach = parseFloat(e.target.value) || 0
                        const tgt = parseFloat(revenueTarget)
                        setKpiAchievement(((ach / tgt) * 100).toFixed(2).toString())
                      }
                    }}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="dashboard-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          {!calculationResult ? (
            <div id="calc-empty-state" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <Calculator style={{ width: '48px', height: '48px', color: 'var(--border-color)', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>Awaiting Configuration</h3>
              <p className="text-muted" style={{ maxWidth: '300px', margin: 0, fontSize: '14px' }}>
                Select a client and line of business on the left to see the breakdown of their fixed and variable payouts.
              </p>
            </div>
          ) : (
            <div id="calc-results-state" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Payout Breakdown</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                  <p className="text-muted" style={{ margin: '0 0 4px 0', fontSize: '13px' }}>Guaranteed Fixed ({calculationResult.fixedPercentage}%)</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                    ₹{calculationResult.fixedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                  <p className="text-muted" style={{ margin: '0 0 4px 0', fontSize: '13px' }}>Variable Pool ({calculationResult.varPercentage}%)</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
                    ₹{calculationResult.maxVarAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed var(--border-color)' }}></div>
                <span style={{ position: 'relative', backgroundColor: 'var(--bg-card)', padding: '0 12px', fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Performance Result
                </span>
              </div>

              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                <div>
                  <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Earned Variable ({kpiAchievement}% KPI)</p>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--success)' }}>
                    +₹{calculationResult.earnedVarAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div style={{ width: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--border-color), transparent)', margin: '16px 0' }}></div>
                
                <div>
                  <p className="text-muted" style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500 }}>Total Recommended Payout</p>
                  <div style={{ display: 'inline-block', padding: '2px', borderRadius: '12px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px 32px', borderRadius: '10px' }}>
                      <p style={{ margin: 0, fontSize: '36px', fontWeight: 900, fontFamily: 'var(--font-heading)', background: 'linear-gradient(90deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ₹{calculationResult.totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--border-radius-sm)' }}>
                  <AlertCircle style={{ color: 'var(--warning)', width: '18px', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--warning)', opacity: 0.9, lineHeight: 1.5 }}>
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
