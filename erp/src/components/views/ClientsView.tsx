'use client'

import { Search, Plus, Building2 } from 'lucide-react'

export default function ClientsView({ clients }: { clients: any[] }) {
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
              className="input-field pl-10"
            />
          </div>
          <button className="btn-primary whitespace-nowrap">
            <Plus size={18} />
            Add Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {clients.map(client => (
          <div key={client.id} className="glass-card p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <Building2 className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{client.name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Contact:</span>
                <span className="text-slate-200">{client.contactName || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{client.email || '-'}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 font-medium mb-3 uppercase tracking-wider">Business Units (LOBs)</p>
              <div className="flex flex-wrap gap-2">
                {client.lobs?.map((lob: any) => (
                  <span key={lob.id} className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs border border-white/10">
                    {lob.name}
                  </span>
                ))}
                {(!client.lobs || client.lobs.length === 0) && (
                  <span className="text-slate-500 text-sm italic">No LOBs configured</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="col-span-full py-12 text-center glass-panel">
            <Building2 className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-300">No clients found</h3>
            <p className="text-slate-500 mt-1">Add your first client to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}
