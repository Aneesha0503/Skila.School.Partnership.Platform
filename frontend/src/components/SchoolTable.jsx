import React, { useState } from 'react';
import { Sparkles, ChevronRight, MapPin, Award, Layers, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SchoolTable({ schools, onSelectSchool, onRunSchoolDetails }) {
  const [runningId, setRunningId] = useState(null);

  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 High Range',
        sub: 'Intl / CBSE / ICSE',
        className: 'bg-purple-100 text-purple-900 border-purple-300'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State High',
        sub: '1,200+ Students',
        className: 'bg-blue-100 text-blue-900 border-blue-300'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Mid',
        sub: '500–1,200 Students',
        className: 'bg-amber-100 text-amber-900 border-amber-300'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Low',
        sub: '<500 Students',
        className: 'bg-slate-100 text-slate-700 border-slate-300'
      };
    }
    return {
      label: 'Standard',
      sub: '',
      className: 'bg-slate-100 text-slate-600 border-slate-200'
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-4">Tier (High to Low)</th>
              <th className="py-3 px-4">School Name</th>
              <th className="py-3 px-4">Administrative Location</th>
              <th className="py-3 px-4">Board & Strength</th>
              <th className="py-3 px-4">Details Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {schools.map((school) => {
              const { hierarchy, info, technology, sales, tier, details_fetched } = school;
              const tierBadge = getTierBadge(tier);
              const isRunning = runningId === school.id;

              return (
                <tr
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="hover:bg-indigo-50/40 transition cursor-pointer"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${tierBadge.className}`}>
                      {tierBadge.label}
                    </span>
                    {tierBadge.sub && (
                      <div className="text-[10px] text-slate-500 mt-0.5 font-medium pl-1">
                        {tierBadge.sub}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{info?.school_name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {info?.school_category} • {info?.management_type}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{hierarchy?.village_locality_ward}</div>
                    <div className="text-[11px] text-slate-500">
                      {hierarchy?.mandal} Mdl, {hierarchy?.district}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold mb-0.5 border border-indigo-100">
                      {info?.board}
                    </span>
                    <div className="text-[11px] font-semibold text-slate-700">
                      {info?.student_strength?.toLocaleString()} students
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {details_fetched ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 49 Fields Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        <Zap className="w-3 h-3 text-amber-600" /> Ready to Run
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {details_fetched ? (
                      <button className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center text-xs">
                        View 49 Fields <ChevronRight className="w-4 h-4 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleRunDetailsClick(e, school.id)}
                        disabled={isRunning}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                            <span>Running...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Run Details</span>
                          </>
                        )}
                      </button>
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
