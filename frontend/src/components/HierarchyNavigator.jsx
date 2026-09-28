import React, { useMemo } from 'react';
import { MapPin, ChevronRight, RotateCcw, Layers, ArrowLeft } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function HierarchyNavigator({
  hierarchyData,
  selectedHierarchy,
  onHierarchyChange,
  onResetHierarchy,
  onStepBackHierarchy,
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 mb-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Administrative Hierarchy Filter</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drill down from State to District, Division, Mandal, Local Body, and Ward</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-3">
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

      {/* Active Breadcrumb Path with Interactive Navigation & Step Back */}
      {hasAnyFilter && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Filtered Scope:
            </span>
            <button
              type="button"
              onClick={onResetHierarchy}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
              title="Click to reset to All India"
            >
              All India
            </button>
            {state && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => onHierarchyChange('state', state)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !district
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                  }`}
                  title={`Navigate back to ${state} level`}
                >
                  {state}
                </button>
              </>
            )}
            {district && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => onHierarchyChange('district', district)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !revenue_division && !mandal
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                  }`}
                  title={`Navigate back to ${district} District level`}
                >
                  {district} District
                </button>
              </>
            )}
            {revenue_division && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => onHierarchyChange('revenue_division', revenue_division)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !mandal
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                  }`}
                  title={`Navigate back to ${revenue_division} Division level`}
                >
                  {revenue_division} Div
                </button>
              </>
            )}
            {mandal && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => onHierarchyChange('mandal', mandal)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !local_body_name && !village_locality_ward
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                  }`}
                  title={`Navigate back to ${mandal} Mandal level`}
                >
                  {mandal} Mandal
                </button>
              </>
            )}
            {local_body_name && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => onHierarchyChange('local_body_name', local_body_name)}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    !village_locality_ward
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600'
                  }`}
                >
                  {local_body_name}
                </button>
              </>
            )}
            {village_locality_ward && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                  {village_locality_ward}
                </span>
              </>
            )}
          </div>

          {/* Quick Backward Navigation Step-Back Button */}
          {onStepBackHierarchy && (
            <button
              type="button"
              onClick={onStepBackHierarchy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs group shrink-0"
              title="Step back to previous hierarchy level (or press Browser Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Step Back</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
