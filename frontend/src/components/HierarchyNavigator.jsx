import React, { useMemo } from 'react';
import { MapPin, ChevronRight, RotateCcw, Layers } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function HierarchyNavigator({
  hierarchyData,
  selectedHierarchy,
  onHierarchyChange,
  onResetHierarchy,
  totalMatchingSchools
}) {
  const { state, district, revenue_division, mandal, local_body_name, village_locality_ward } = selectedHierarchy;

  const hasAnyFilter = Boolean(state || district || revenue_division || mandal || local_body_name || village_locality_ward);

  const stateOptions = useMemo(() => [
    { value: '', label: 'All States' },
    ...(hierarchyData?.states || []).map((s) => ({ value: s, label: s }))
  ], [hierarchyData?.states]);

  const districtOptions = useMemo(() => [
    { value: '', label: 'All Districts' },
    ...(hierarchyData?.districts || []).map((d) => ({ value: d, label: d }))
  ], [hierarchyData?.districts]);

  const divisionOptions = useMemo(() => [
    { value: '', label: 'All Divisions' },
    ...(hierarchyData?.revenue_divisions || []).map((rd) => ({ value: rd, label: rd }))
  ], [hierarchyData?.revenue_divisions]);

  const mandalOptions = useMemo(() => [
    { value: '', label: 'All Mandals' },
    ...(hierarchyData?.mandals || []).map((m) => ({ value: m, label: m }))
  ], [hierarchyData?.mandals]);

  const localBodyOptions = useMemo(() => [
    { value: '', label: 'All Local Bodies' },
    ...(hierarchyData?.local_bodies || []).map((lb) => ({
      value: lb.name,
      label: `${lb.name} (${lb.type === 'Gram Panchayat' ? 'GP' : 'Urban'})`
    }))
  ], [hierarchyData?.local_bodies]);

  const wardOptions = useMemo(() => [
    { value: '', label: 'All Wards & Villages' },
    ...(hierarchyData?.wards_villages || []).map((w) => ({ value: w, label: w }))
  ], [hierarchyData?.wards_villages]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 mb-6 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Administrative Hierarchy Filter</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drill down from State to District, Division, Mandal, Local Body, and Ward</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {totalMatchingSchools} {totalMatchingSchools === 1 ? 'school found' : 'schools found'}
          </span>
          {hasAnyFilter && (
            <button
              onClick={onResetHierarchy}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-md transition cursor-pointer"
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
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            1. State
          </label>
          <CustomDropdown
            value={state}
            onChange={(val) => onHierarchyChange('state', val)}
            options={stateOptions}
            placeholder="All States"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* 2. District */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            2. District
          </label>
          <CustomDropdown
            value={district}
            onChange={(val) => onHierarchyChange('district', val)}
            options={districtOptions}
            placeholder="All Districts"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* 3. Revenue Division / Sub-Division */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            3. Division / Sub-Div
          </label>
          <CustomDropdown
            value={revenue_division}
            onChange={(val) => onHierarchyChange('revenue_division', val)}
            options={divisionOptions}
            placeholder="All Divisions"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* 4. Mandal */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            4. Mandal
          </label>
          <CustomDropdown
            value={mandal}
            onChange={(val) => onHierarchyChange('mandal', val)}
            options={mandalOptions}
            placeholder="All Mandals"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* 5. Municipality / Gram Panchayat */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            5. Local Body (Munc/GP)
          </label>
          <CustomDropdown
            value={local_body_name}
            onChange={(val) => onHierarchyChange('local_body_name', val)}
            options={localBodyOptions}
            placeholder="All Local Bodies"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* 6. Village / Locality / Ward */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            6. Ward / Village
          </label>
          <CustomDropdown
            value={village_locality_ward}
            onChange={(val) => onHierarchyChange('village_locality_ward', val)}
            options={wardOptions}
            placeholder="All Wards & Villages"
            variant="auto"
            alignRight={true}
            searchable={true}
          />
        </div>
      </div>

      {/* Active Breadcrumb Path */}
      {hasAnyFilter && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Filtered Scope:
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">All</span>
          {state && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{state}</span>
            </>
          )}
          {district && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{district} District</span>
            </>
          )}
          {revenue_division && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{revenue_division} Div</span>
            </>
          )}
          {mandal && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{mandal} Mandal</span>
            </>
          )}
          {local_body_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{local_body_name}</span>
            </>
          )}
          {village_locality_ward && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">{village_locality_ward}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
