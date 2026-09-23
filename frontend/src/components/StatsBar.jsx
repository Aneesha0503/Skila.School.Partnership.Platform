import React from 'react';
import { Building2, Award, GraduationCap, BookOpen, Layers, Users } from 'lucide-react';

export default function StatsBar({ stats, schools }) {
  // Compute live stats directly from schools array when available, or fallback to backend stats
  const activeStats = (schools && schools.length > 0) ? {
    total_schools: schools.length,
    high_range: schools.filter(s => s.tier?.tier === 'High Range').length,
    state_high: schools.filter(s => s.tier?.tier === 'State Board - High Strength').length,
    state_mid: schools.filter(s => s.tier?.tier === 'State Board - Mid Strength').length,
    state_low: schools.filter(s => s.tier?.tier === 'State Board - Low Strength').length,
    total_students: schools.reduce((acc, s) => acc + (Number(s.info?.student_strength) || 0), 0)
  } : (stats || {});

  if (!activeStats || activeStats.total_schools === undefined) return null;

  const items = [
    {
      label: 'Total Schools',
      value: activeStats.total_schools || 0,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'High Range',
      value: activeStats.high_range || 0,
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'State High (1.2k+)',
      value: activeStats.state_high || 0,
      icon: GraduationCap,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'State Mid (500-1.2k)',
      value: activeStats.state_mid || 0,
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'State Low (<500)',
      value: activeStats.state_low || 0,
      icon: Layers,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    {
      label: 'Total Student Reach',
      value: (activeStats.total_students || 0).toLocaleString(),
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
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
