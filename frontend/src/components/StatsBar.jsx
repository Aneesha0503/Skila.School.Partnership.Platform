import React from 'react';
import { Building2, Award, GraduationCap, BookOpen, Layers, Users, Trophy } from 'lucide-react';

export default function StatsBar({ stats, schools, onFilterConfirmedDeals, isConfirmedOnly = false }) {
  // Compute live stats directly from schools array when available, or fallback to backend stats
  const activeStats = (schools && schools.length > 0) ? {
    total_schools: schools.length,
    deals_closed: schools.filter(s => s.sales?.deal_closed || s.sales?.lead_status === 'Closed Won').length,
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
      label: 'Big Private / CBSE',
      value: activeStats.high_range || 0,
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      label: 'State Big (1200+)',
      value: activeStats.state_high || 0,
      icon: GraduationCap,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'State Medium (500-1.2k)',
      value: activeStats.state_mid || 0,
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'State Small (<500)',
      value: activeStats.state_low || 0,
      icon: Layers,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    {
      label: 'Total Students',
      value: (activeStats.total_students || 0).toLocaleString(),
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      id: 'deals_confirmed',
      label: 'Joined Schools',
      value: activeStats.deals_closed || 0,
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      isClickable: true,
      isActive: isConfirmedOnly,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 sm:gap-3 mb-6">
      {items.map((it, idx) => {
        const Icon = it.icon;
        const isDealsConfirmed = it.id === 'deals_confirmed';
        return (
          <div
            key={idx}
            onClick={it.isClickable ? onFilterConfirmedDeals : undefined}
            className={`bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl border shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all ${
              isDealsConfirmed ? 'col-span-2 sm:col-span-1' : ''
            } ${
              it.isClickable ? 'cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-sm' : ''
            } ${
              it.isActive 
                ? 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/40 dark:bg-amber-950/20' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
            title={it.isClickable ? (it.isActive ? 'Viewing Confirmed Deals. Click to clear filter.' : 'Click to filter confirmed deals') : undefined}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${it.bg} dark:bg-slate-800/80 ${it.border} dark:border-slate-700/60 border flex items-center justify-center shrink-0`}>
              <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${it.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">{it.label}</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">{it.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
