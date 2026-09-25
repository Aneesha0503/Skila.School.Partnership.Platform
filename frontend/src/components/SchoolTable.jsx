import React, { useState } from 'react';
import { Sparkles, ChevronRight, MapPin, Award, Layers, Zap, RefreshCw, CheckCircle2, Lock } from 'lucide-react';

export default function SchoolTable({ schools, onSelectSchool, onRunSchoolDetails, userRole = 'admin' }) {
  const [runningId, setRunningId] = useState(null);

  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 High Range',
        sub: 'Intl / CBSE / ICSE',
        className: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State High',
        sub: '1,200+ Students',
        className: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Mid',
        sub: '500–1,200 Students',
        className: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Low',
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
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-3 w-12 text-center text-slate-500 dark:text-slate-400 font-mono">#</th>
              <th className="py-3 px-4">Tier (High to Low)</th>
              <th className="py-3 px-4">School Name</th>
              <th className="py-3 px-4">Administrative Location</th>
              <th className="py-3 px-4">Board & Strength</th>
              <th className="py-3 px-4">Details Status</th>
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
                      {school.agent_notes && school.agent_notes.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          💼 {school.agent_notes[0].agent_name || 'Agent'} ({school.agent_notes.length})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {info?.school_category} • {info?.management_type}
                    </div>
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
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Full Profile Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold">
                        <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Profile Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {details_fetched ? (
                      <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold inline-flex items-center text-xs">
                        View Full Profile <ChevronRight className="w-4 h-4 ml-0.5" />
                      </button>
                    ) : userRole === 'admin' ? (
                      <button
                        type="button"
                        onClick={(e) => handleRunDetailsClick(e, school.id)}
                        disabled={isRunning}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        title="Fetch verified 49-field profile for this school"
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Fetch Profile</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span 
                        title="Single school AI research requires Administrator role"
                        className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[11px] inline-flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                      >
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Admin Only</span>
                      </span>
                    )}
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
