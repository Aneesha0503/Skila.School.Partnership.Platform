import React, { useState } from 'react';
import { Sparkles, ChevronRight, MapPin, Award, Layers, Zap, RefreshCw, CheckCircle2, Lock, User } from 'lucide-react';
import { getLeadStatusBadge } from '../utils/formatters';

export default function SchoolTable({ schools, onSelectSchool, onRunSchoolDetails, userRole = 'admin', currentAgentName = 'Field Agent' }) {
  const [runningId, setRunningId] = useState(null);

  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 Big Private / CBSE',
        sub: 'CBSE / ICSE / Top Pvt',
        className: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State Big',
        sub: '1,200+ Students',
        className: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Medium',
        sub: '500–1,200 Students',
        className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Small',
        sub: '<500 Students',
        className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      };
    }
    return {
      label: 'Standard',
      sub: '',
      className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    };
  };

  const handleRunDetailsClick = async (e, schoolId) => {
    e.stopPropagation();
    if (runningId) return;
    setRunningId(schoolId);
    try {
      if (onRunSchoolDetails) {
        await onRunSchoolDetails(schoolId);
      }
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* MOBILE RESPONSIVE CARD VIEW (visible on < sm screens) */}
      <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {schools.map((school, index) => {
          const { hierarchy, info, technology, sales, tier, details_fetched } = school;
          const tierBadge = getTierBadge(tier);
          const isRunning = runningId === school.id;
          const statusBadge = getLeadStatusBadge(sales?.lead_status, sales?.deal_closed);
          const isDealClosed = Boolean(sales?.deal_closed || sales?.lead_status === 'Closed Won');
          const form = school.formalities || sales?.formalities || {};
          const isComp = form.progress_pct >= 100 || form.formalities_completed;

          return (
            <div
              key={school.id}
              onClick={() => onSelectSchool(school)}
              className="p-3.5 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition cursor-pointer flex flex-col gap-2"
            >
              {/* Card Top Row: #, Tier, Status */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    #{index + 1}
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierBadge.className}`}>
                    {tierBadge.label}
                  </span>
                  {statusBadge && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${statusBadge.className}`}>
                      <span>{statusBadge.icon}</span> {statusBadge.label}
                    </span>
                  )}
                  {isDealClosed && isComp && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                      <span>🎓</span> Active Partner
                    </span>
                  )}
                  {isDealClosed && !isComp && form.progress_pct > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                      <span>📜</span> {form.progress_pct}%
                    </span>
                  )}
                </div>

                {details_fetched ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 49 Fields Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    ⚡ Basic Discovery
                  </span>
                )}
              </div>

              {/* School Name & Board */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                  {info?.school_name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span>{info?.board || 'CBSE'}</span>
                  <span>•</span>
                  <span>{info?.student_strength ? `${Number(info.student_strength).toLocaleString()} Students` : '1,000+ Students'}</span>
                  {info?.udise_code && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px]">UDISE: {info.udise_code}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Location & Agent */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 flex-wrap">
                <span className="flex items-center gap-1 truncate max-w-[200px]">
                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    {[hierarchy?.mandal, hierarchy?.district, hierarchy?.state].filter(Boolean).join(', ') || 'Location unavailable'}
                  </span>
                </span>

                <span className="flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{sales?.sales_owner || 'Unassigned'}</span>
                </span>
              </div>

              {/* Action Link Row */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP & TABLET DATA TABLE (hidden on < sm screens) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-3 w-12 text-center text-slate-500 dark:text-slate-400 font-mono">#</th>
              <th className="py-3 px-4">School Type</th>
              <th className="py-3 px-4">School Name & Place</th>
              <th className="py-3 px-4">Agent / Notes</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Board & Students</th>
              <th className="py-3 px-4">Info Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {schools.map((school, index) => {
              const { hierarchy, info, technology, sales, tier, details_fetched } = school;
              const tierBadge = getTierBadge(tier);
              const isRunning = runningId === school.id;

              return (
                <tr
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer"
                >
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500 text-xs">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${tierBadge.className}`}>
                      {tierBadge.label}
                    </span>
                    {tierBadge.sub && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium pl-1">
                        {tierBadge.sub}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                      <span>{info?.school_name}</span>
                      {(() => {
                        const statusBadge = getLeadStatusBadge(sales?.lead_status, sales?.deal_closed);
                        const isDealClosed = Boolean(sales?.deal_closed || sales?.lead_status === 'Closed Won');
                        const form = school.formalities || sales?.formalities || {};
                        const isComp = form.progress_pct >= 100 || form.formalities_completed;

                        return (
                          <>
                            {statusBadge && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${statusBadge.className}`}>
                                <span>{statusBadge.icon}</span> {statusBadge.label}
                              </span>
                            )}
                            {isDealClosed && isComp && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                <span>🎓</span> Joined School
                              </span>
                            )}
                            {isDealClosed && !isComp && form.progress_pct > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                                <span>📜</span> Joining Steps: {form.progress_pct}%
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {info?.school_category} • {info?.management_type}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {(() => {
                      const notes = userRole === 'agent'
                        ? (school.agent_notes || []).filter(n => (n.agent_name || '').toLowerCase().trim() === (currentAgentName || '').toLowerCase().trim())
                        : (school.agent_notes || []);
                      
                      if (notes.length > 0) {
                        return (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs">
                              <span>💼</span>
                              <span className="font-bold">{notes[0].agent_name || 'Agent'}</span>
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200">
                                {notes.length}
                              </span>
                            </span>
                            {notes[0].bucket && (
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate max-w-[140px]">
                                {notes[0].bucket}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      const isOwnerVisible = userRole === 'admin' || (sales?.sales_owner && sales.sales_owner.toLowerCase().trim() === (currentAgentName || '').toLowerCase().trim());
                      if (isOwnerVisible && sales?.sales_owner && sales.sales_owner !== 'Unassigned') {
                        return (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sales.sales_owner}</span>
                          </span>
                        );
                      }
                      
                      return <span className="text-slate-300 dark:text-slate-600 text-xs font-medium">—</span>;
                    })()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{hierarchy?.village_locality_ward}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {hierarchy?.mandal} Mdl, {hierarchy?.district}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold mb-0.5 border border-indigo-100 dark:border-indigo-800">
                      {info?.board}
                    </span>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {info?.student_strength?.toLocaleString()} students
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {details_fetched ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Complete Info
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                        <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Basic Info
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 font-semibold inline-flex items-center text-xs">
                      Open Details <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
