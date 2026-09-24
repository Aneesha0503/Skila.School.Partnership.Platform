import React from 'react';
import { MapPin, ChevronRight, RotateCcw, Layers, SlidersHorizontal } from 'lucide-react';

export default function HierarchyNavigator({
  hierarchyData,
  selectedHierarchy,
  onHierarchyChange,
  onResetHierarchy,
  totalMatchingSchools
}) {
  const { state, district, revenue_division, mandal, local_body_name, village_locality_ward } = selectedHierarchy;

  const hasAnyFilter = Boolean(state || district || revenue_division || mandal || local_body_name || village_locality_ward);

  return (
    <div 
      id="hierarchy-navigator-section"
      className="relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/95 dark:to-cyan-950/40 rounded-2xl border-2 border-cyan-500/40 dark:border-cyan-500/50 ring-2 ring-cyan-500/15 shadow-xl shadow-cyan-950/20 p-5 sm:p-6 mb-6 overflow-hidden transition-all hover:border-cyan-500/70"
    >
      {/* Decorative top accent glow bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-400" />

      {/* Secondary Console Top Badge */}
      <div className="flex items-center justify-between mb-3.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-400/40 text-cyan-700 dark:text-cyan-300 text-[11px] font-extrabold tracking-wide uppercase shadow-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>Secondary Hierarchy Drill-Down</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
          6-Tier Granular Administrative Scope
        </span>
      </div>

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-cyan-900/30">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-teal-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Administrative Hierarchy Filter
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-300/80">
              Drill down from State to District, Division, Mandal, Local Body, and Ward
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>{totalMatchingSchools} {totalMatchingSchools === 1 ? 'school found' : 'schools found'}</span>
          </span>
          {hasAnyFilter && (
            <button
              onClick={onResetHierarchy}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Hierarchy
            </button>
          )}
        </div>
      </div>

      {/* Cascading Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mt-4">
        {/* 1. State */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            1. State
          </label>
          <select
            value={state}
            onChange={(e) => onHierarchyChange('state', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All States</option>
            {hierarchyData?.states?.map((st) => (
              <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{st}</option>
            ))}
          </select>
        </div>

        {/* 2. District */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            2. District
          </label>
          <select
            value={district}
            onChange={(e) => onHierarchyChange('district', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All Districts</option>
            {hierarchyData?.districts?.map((d) => (
              <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{d}</option>
            ))}
          </select>
        </div>

        {/* 3. Revenue Division / Sub-Division */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            3. Division / Sub-Div
          </label>
          <select
            value={revenue_division}
            onChange={(e) => onHierarchyChange('revenue_division', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All Divisions</option>
            {hierarchyData?.revenue_divisions?.map((rd) => (
              <option key={rd} value={rd} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{rd}</option>
            ))}
          </select>
        </div>

        {/* 4. Mandal */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            4. Mandal
          </label>
          <select
            value={mandal}
            onChange={(e) => onHierarchyChange('mandal', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All Mandals</option>
            {hierarchyData?.mandals?.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{m}</option>
            ))}
          </select>
        </div>

        {/* 5. Municipality / Gram Panchayat */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            5. Local Body (Munc/GP)
          </label>
          <select
            value={local_body_name}
            onChange={(e) => onHierarchyChange('local_body_name', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All Local Bodies</option>
            {hierarchyData?.local_bodies?.map((lb, i) => (
              <option key={i} value={lb.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {lb.name} ({lb.type === 'Gram Panchayat' ? 'GP' : 'Urban'})
              </option>
            ))}
          </select>
        </div>

        {/* 6. Village / Locality / Ward */}
        <div>
          <label className="block text-[11px] font-bold text-cyan-800 dark:text-cyan-300/90 mb-1.5 uppercase tracking-wider">
            6. Ward / Village
          </label>
          <select
            value={village_locality_ward}
            onChange={(e) => onHierarchyChange('village_locality_ward', e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 bg-slate-50 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 p-2.5 text-slate-800 dark:text-white font-semibold cursor-pointer transition shadow-xs"
          >
            <option value="">All Wards & Villages</option>
            {hierarchyData?.wards_villages?.map((w) => (
              <option key={w} value={w} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Breadcrumb Path */}
      {hasAnyFilter && (
        <div className="mt-4 pt-3.5 border-t border-slate-200/80 dark:border-cyan-950/60 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
          <span className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Filtered Scope:
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">All</span>
          {state && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-semibold">{state}</span>
            </>
          )}
          {district && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-semibold">{district} District</span>
            </>
          )}
          {revenue_division && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-semibold">{revenue_division} Div</span>
            </>
          )}
          {mandal && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-semibold">{mandal} Mandal</span>
            </>
          )}
          {local_body_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-semibold">{local_body_name}</span>
            </>
          )}
          {village_locality_ward && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500/70" />
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 border border-cyan-300 dark:border-cyan-500/40 text-cyan-900 dark:text-cyan-100 font-bold">{village_locality_ward}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

