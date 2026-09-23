import React from 'react';
import { 
  Building, MapPin, Users, GraduationCap, Laptop, 
  Sparkles, Calendar, ChevronRight, Phone, Award, ShieldCheck 
} from 'lucide-react';

export default function SchoolCard({ school, onSelectSchool }) {
  const { hierarchy, info, technology, sales } = school;

  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed Won':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pilot Started':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Proposal Shared':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Demo Scheduled':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPotentialBadge = (pot) => {
    switch (pot) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div 
      onClick={() => onSelectSchool(school)}
      className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col p-4 group"
    >
      {/* Top row: Name & UDISE */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              UDISE: {info?.udise_code}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
              {info?.board}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
              {info?.school_category}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition leading-snug">
            {info?.school_name}
          </h3>
        </div>

        {/* AI Potential Badge */}
        <div className={`px-2 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1 shrink-0 ${getPotentialBadge(sales?.skila_ai_potential)}`}>
          <Sparkles className="w-3 h-3" />
          <span>{sales?.skila_ai_potential} Potential</span>
        </div>
      </div>

      {/* Location Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="truncate">
          {hierarchy?.village_locality_ward}, {hierarchy?.mandal} Mdl, {hierarchy?.district}
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-lg p-2.5 mb-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Students / Teachers</span>
          <span className="font-semibold text-slate-800">
            {info?.student_strength?.toLocaleString()} / {info?.teacher_strength}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lead Status</span>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(sales?.lead_status)}`}>
            {sales?.lead_status}
          </span>
        </div>
      </div>

      {/* Technology Pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
        {technology?.erp_used === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">ERP: {technology?.erp_vendor || 'Yes'}</span>
        )}
        {technology?.lms_used === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">LMS</span>
        )}
        {technology?.coding_used === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-medium">Coding</span>
        )}
        {technology?.robotics_used === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-medium">Robotics</span>
        )}
        {technology?.atl_lab === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">ATL Lab</span>
        )}
        {technology?.smart_classroom === 'Yes' && (
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-medium">
            Smart Class ({technology?.smart_classroom_count})
          </span>
        )}
      </div>

      {/* Footer CRM Info & CTA */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="truncate">
          <span className="text-slate-400">DM: </span>
          <span className="font-medium text-slate-700">{sales?.decision_maker || 'Not specified'}</span>
          {sales?.decision_maker_designation && (
            <span className="text-slate-400"> ({sales?.decision_maker_designation})</span>
          )}
        </div>
        <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
          Details <ChevronRight className="w-4 h-4 ml-0.5" />
        </div>
      </div>
    </div>
  );
}
