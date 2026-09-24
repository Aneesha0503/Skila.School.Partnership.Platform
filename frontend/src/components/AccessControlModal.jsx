import React from 'react';
import { 
  X, Shield, ShieldCheck, Lock, Check, CheckCircle2, 
  XCircle, Crown, Briefcase, Sparkles, Building2, 
  Trash2, FileSpreadsheet, Bot, UserCheck
} from 'lucide-react';

export default function AccessControlModal({ isOpen, onClose, currentRole, onSelectRole }) {
  if (!isOpen) return null;

  const permissions = [
    {
      feature: 'Pan-India Map & State Discovery',
      description: 'Explore all 36 States/UTs and launch regional focus',
      admin: true,
      agent: true,
      category: 'Exploration'
    },
    {
      feature: 'School Directory & Tier Filtering',
      description: 'Browse High Range, State Board, and search attributes',
      admin: true,
      agent: true,
      category: 'Exploration'
    },
    {
      feature: 'Inspect 49-Field Intelligence Profile',
      description: 'View Institutional, Technology, and CRM telemetry',
      admin: true,
      agent: true,
      category: 'Intelligence'
    },
    {
      feature: 'Update Field CRM & Follow-Up Notes',
      description: 'Update Lead Status, meeting notes, and next follow-up date',
      admin: true,
      agent: true,
      agentNote: 'Dedicated Field CRM Console',
      category: 'CRM & Operations'
    },
    {
      feature: 'District AI Discovery Scraper',
      description: 'Trigger Skila AI multi-mandal crawler (25, 50, 100+ schools)',
      admin: true,
      agent: false,
      category: 'AI Automation'
    },
    {
      feature: 'Single-School Deep Intelligence Runner',
      description: 'Execute deep AI research on all 49 fields for un-fetched schools',
      admin: true,
      agent: false,
      category: 'AI Automation'
    },
    {
      feature: 'Add New School Record',
      description: 'Manually register and onboard new institutions',
      admin: true,
      agent: false,
      category: 'Data Management'
    },
    {
      feature: 'Edit Institutional Hierarchy & UDISE',
      description: 'Modify core state, district, mandal, and verified government UDISE',
      admin: true,
      agent: false,
      agentNote: 'Read-only to prevent corruption',
      category: 'Data Governance'
    },
    {
      feature: 'Delete School Records',
      description: 'Permanently remove institutions from platform database',
      admin: true,
      agent: false,
      category: 'Data Governance'
    },
    {
      feature: 'Reset / Wipe Platform Database',
      description: 'Clear regional directories or database collections',
      admin: true,
      agent: false,
      category: 'Security'
    },
    {
      feature: 'Microsoft Excel Export (.xlsx)',
      description: 'Download 61-column formatted spreadsheet sorted High to Low',
      admin: true,
      agent: true,
      category: 'Reporting'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shrink-0 relative border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Access Control & Roles Matrix
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                    RBAC Security
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Operational boundaries and permission levels for Administrators and Field Agents
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Role Switcher Inside Modal */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            {/* Admin Card */}
            <div 
              onClick={() => onSelectRole('admin')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                currentRole === 'admin'
                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-bold text-base">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Admin Level</span>
                    {currentRole === 'admin' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500 text-white font-semibold">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">Full System & AI Scraper Authority</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                currentRole === 'admin' ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-600'
              }`}>
                {currentRole === 'admin' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* Agent Card */}
            <div 
              onClick={() => onSelectRole('agent')}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                currentRole === 'agent'
                  ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-base">
                  💼
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white">Agent Level</span>
                    {currentRole === 'agent' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-white font-semibold">Active</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">Field CRM & Lead Operations</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                currentRole === 'agent' ? 'border-emerald-400 bg-emerald-600 text-white' : 'border-slate-600'
              }`}>
                {currentRole === 'agent' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="py-3 px-4">Feature / Platform Capability</th>
                  <th className="py-3 px-3 w-32 text-center bg-indigo-50/50 dark:bg-indigo-950/30">
                    <span className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-extrabold">
                      👑 Admin
                    </span>
                  </th>
                  <th className="py-3 px-3 w-32 text-center bg-emerald-50/50 dark:bg-emerald-950/30">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      💼 Field Agent
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {permissions.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {p.feature}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.description}
                      </div>
                    </td>
                    
                    {/* Admin Column */}
                    <td className="py-3 px-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                      {p.admin ? (
                        <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Full</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[11px]">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>

                    {/* Agent Column */}
                    <td className="py-3 px-3 text-center bg-emerald-50/20 dark:bg-emerald-950/10">
                      {p.agent ? (
                        <div className="flex flex-col items-center">
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" />
                            <span>Allowed</span>
                          </div>
                          {p.agentNote && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {p.agentNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-semibold text-[11px]">
                            <Lock className="w-3 h-3" />
                            <span>Locked</span>
                          </div>
                          {p.agentNote && (
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {p.agentNote}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Active Session: <strong className="text-slate-800 dark:text-slate-200 capitalize">{currentRole} Level</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs hover:bg-slate-800 dark:hover:bg-white transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
}
