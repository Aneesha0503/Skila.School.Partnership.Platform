import React from 'react';
import { Sparkles, ChevronRight, MapPin } from 'lucide-react';

export default function SchoolTable({ schools, onSelectSchool }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed Won':
        return 'bg-emerald-100 text-emerald-800';
      case 'Pilot Started':
        return 'bg-purple-100 text-purple-800';
      case 'Proposal Shared':
        return 'bg-indigo-100 text-indigo-800';
      case 'Demo Scheduled':
        return 'bg-amber-100 text-amber-800';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-700';
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3 px-4">School & UDISE</th>
              <th className="py-3 px-4">Administrative Location</th>
              <th className="py-3 px-4">Board & Strength</th>
              <th className="py-3 px-4">Technology Stack</th>
              <th className="py-3 px-4">Lead Status</th>
              <th className="py-3 px-4">AI Potential</th>
              <th className="py-3 px-4">Decision Maker</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {schools.map((school) => {
              const { hierarchy, info, technology, sales } = school;
              return (
                <tr
                  key={school.id}
                  onClick={() => onSelectSchool(school)}
                  className="hover:bg-indigo-50/40 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{info?.school_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">UDISE: {info?.udise_code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{hierarchy?.village_locality_ward}</div>
                    <div className="text-[11px] text-slate-500">
                      {hierarchy?.mandal} Mdl, {hierarchy?.district}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-800 mb-0.5">
                      {info?.board}
                    </span>
                    <div className="text-[11px] text-slate-500">
                      {info?.student_strength?.toLocaleString()} students
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[10px]">
                        {sales?.technology_adoption_level}
                      </span>
                      {technology?.atl_lab === 'Yes' && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          ATL
                        </span>
                      )}
                      {technology?.smart_classroom === 'Yes' && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium text-[10px]">
                          Smart ({technology?.smart_classroom_count})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${getStatusBadge(sales?.lead_status)}`}>
                      {sales?.lead_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] inline-flex items-center gap-1 ${getPotentialBadge(sales?.skila_ai_potential)}`}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {sales?.skila_ai_potential}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{sales?.decision_maker || '—'}</div>
                    <div className="text-[11px] text-slate-500">{sales?.decision_maker_designation || 'Leader'}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center text-xs">
                      View <ChevronRight className="w-4 h-4 ml-0.5" />
                    </button>
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
