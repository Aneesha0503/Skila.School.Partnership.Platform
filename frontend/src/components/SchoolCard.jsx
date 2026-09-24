import React, { useState } from 'react';
import { 
  Building, MapPin, Users, GraduationCap, Laptop, 
  Sparkles, Calendar, ChevronRight, Phone, Award, ShieldCheck, Layers, Play, RefreshCw, CheckCircle2, Zap, Lock 
} from 'lucide-react';

export default function SchoolCard({ school, onSelectSchool, onRunSchoolDetails, index, userRole = 'admin' }) {
  const { hierarchy, info, technology, sales, tier, details_fetched } = school;
  const [isRunning, setIsRunning] = useState(false);

  // Tier Badge Styling
  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 High Range (International / CBSE / ICSE)',
        className: 'bg-purple-100 text-purple-900 border-purple-300 font-bold'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State High (1,200+ Students)',
        className: 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Mid (500–1,200 Students)',
        className: 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Low (<500 Students)',
        className: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
      };
    }
    return null;
  };

  const tierBadge = getTierBadge(tier);

  const handleRunDetailsClick = async (e) => {
    e.stopPropagation();
    if (isRunning) return;
    setIsRunning(true);
    try {
      if (onRunSchoolDetails) {
        await onRunSchoolDetails(school.id);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div 
      onClick={() => onSelectSchool(school)}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col p-4 group relative"
    >
      {/* Tier Category Indicator */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {index !== undefined && (
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              #{index + 1}
            </span>
          )}
          {tierBadge && (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border shadow-2xs ${tierBadge.className}`}>
              {tierBadge.label}
            </span>
          )}
        </div>

        {details_fetched ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 49 Fields Ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
            <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Pending Run
          </span>
        )}
      </div>

      {/* Top row: Name & Board */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800">
              {info?.board}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {info?.school_category}
            </span>
            {info?.udise_code && details_fetched && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                UDISE: {info?.udise_code}
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug">
            {info?.school_name}
          </h3>
        </div>
      </div>

      {/* Location Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">
          {hierarchy?.village_locality_ward}, {hierarchy?.mandal} Mdl, {hierarchy?.district}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 mb-3 text-xs border border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Student Strength</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            {info?.student_strength?.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">students</span>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Management</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate block">
            {info?.management_type || 'Private'}
          </span>
        </div>
      </div>

      {/* Technology / Status info */}
      {details_fetched ? (
        <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
          {technology?.erp_used === 'Yes' && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">ERP: {technology?.erp_vendor || 'Yes'}</span>
          )}
          {technology?.lms_used === 'Yes' && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">LMS</span>
          )}
          {technology?.coding_used === 'Yes' && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 font-medium">Coding</span>
          )}
          {technology?.atl_lab === 'Yes' && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 font-semibold">ATL Lab</span>
          )}
          {technology?.smart_classroom === 'Yes' && (
            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800 font-medium">
              Smart ({technology?.smart_classroom_count})
            </span>
          )}
        </div>
      ) : (
        <div className="mb-3 p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>Click to run Skila AI 49-field profile</span>
          {userRole === 'admin' ? (
            <button
              type="button"
              onClick={handleRunDetailsClick}
              disabled={isRunning}
              className="px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] inline-flex items-center gap-1 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-950" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Run Details</span>
                </>
              )}
            </button>
          ) : (
            <span 
              title="Single school AI research requires Administrator role"
              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px] inline-flex items-center gap-1 shrink-0 border border-slate-300 dark:border-slate-700"
            >
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Admin Scraper</span>
            </span>
          )}
        </div>
      )}

      {/* Footer CRM Info & CTA */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="truncate">
          {details_fetched && sales?.decision_maker ? (
            <>
              <span className="text-slate-400 dark:text-slate-500">DM: </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{sales?.decision_maker}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">Full profile pending</span>
          )}
        </div>
        <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
          {details_fetched ? 'View Full Profile' : 'Open School'} <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
