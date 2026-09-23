import React from 'react';
import { MapPin, ChevronRight, RotateCcw, Layers } from 'lucide-react';

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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Administrative Hierarchy Filter</h2>
            <p className="text-xs text-slate-500">Drill down from State to District, Division, Mandal, Local Body, and Ward</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {totalMatchingSchools} {totalMatchingSchools === 1 ? 'school found' : 'schools found'}
          </span>
          {hasAnyFilter && (
            <button
              onClick={onResetHierarchy}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Hierarchy
            </button>
          )}
        </div>
      </div>

      {/* Cascading Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
        {/* 1. State */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            1. State
          </label>
          <select
            value={state}
            onChange={(e) => onHierarchyChange('state', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All States</option>
            {hierarchyData?.states?.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* 2. District */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            2. District
          </label>
          <select
            value={district}
            onChange={(e) => onHierarchyChange('district', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All Districts</option>
            {hierarchyData?.districts?.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 3. Revenue Division / Sub-Division */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            3. Division / Sub-Div
          </label>
          <select
            value={revenue_division}
            onChange={(e) => onHierarchyChange('revenue_division', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All Divisions</option>
            {hierarchyData?.revenue_divisions?.map((rd) => (
              <option key={rd} value={rd}>{rd}</option>
            ))}
          </select>
        </div>

        {/* 4. Mandal */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            4. Mandal
          </label>
          <select
            value={mandal}
            onChange={(e) => onHierarchyChange('mandal', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All Mandals</option>
            {hierarchyData?.mandals?.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* 5. Municipality / Gram Panchayat */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            5. Local Body (Munc/GP)
          </label>
          <select
            value={local_body_name}
            onChange={(e) => onHierarchyChange('local_body_name', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All Local Bodies</option>
            {hierarchyData?.local_bodies?.map((lb, i) => (
              <option key={i} value={lb.name}>
                {lb.name} ({lb.type === 'Gram Panchayat' ? 'GP' : 'Urban'})
              </option>
            ))}
          </select>
        </div>

        {/* 6. Village / Locality / Ward */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
            6. Ward / Village
          </label>
          <select
            value={village_locality_ward}
            onChange={(e) => onHierarchyChange('village_locality_ward', e.target.value)}
            className="w-full text-xs rounded-lg border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2 text-slate-800 font-medium"
          >
            <option value="">All Wards & Villages</option>
            {hierarchyData?.wards_villages?.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Breadcrumb Path */}
      {hasAnyFilter && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
          <span className="font-semibold text-indigo-700 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Filtered Scope:
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">All</span>
          {state && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{state}</span>
            </>
          )}
          {district && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{district} District</span>
            </>
          )}
          {revenue_division && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{revenue_division} Div</span>
            </>
          )}
          {mandal && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{mandal} Mandal</span>
            </>
          )}
          {local_body_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{local_body_name}</span>
            </>
          )}
          {village_locality_ward && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">{village_locality_ward}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
