import React from 'react';
import { Building2, Sparkles, Presentation, FileCheck, Rocket, Users } from 'lucide-react';

export default function StatsBar({ stats }) {
  if (!stats) return null;

  const items = [
    {
      label: 'Total Schools',
      value: stats.total_schools || 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'High AI Potential',
      value: stats.high_ai_potential || 0,
      icon: Sparkles,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      label: 'Demos Done / Sched',
      value: stats.demos_done || 0,
      icon: Presentation,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Proposals Shared',
      value: stats.proposals_shared || 0,
      icon: FileCheck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Pilots Active',
      value: stats.pilots_started || 0,
      icon: Rocket,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Total Student Reach',
      value: (stats.total_students || 0).toLocaleString(),
      icon: Users,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {items.map((it, idx) => {
        const Icon = it.icon;
        return (
          <div
            key={idx}
            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-lg ${it.bg} ${it.border} border flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${it.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{it.label}</p>
              <p className="text-lg font-bold text-slate-900">{it.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
