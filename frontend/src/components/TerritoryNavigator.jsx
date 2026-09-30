import React, { useState, useMemo } from 'react';
import { MapPin, Search, RefreshCw, RotateCcw, ChevronDown, ChevronUp, Layers, CheckCircle2 } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

export default function TerritoryNavigator({
  hierarchyData,
  selectedHierarchy,
  onHierarchyChange,
  onResetHierarchy,
  onDistrictRunComplete,
  totalMatchingSchools,
  userRole = 'admin'
}) {
  const { state, district, revenue_division, mandal, local_body_name, village_locality_ward } = selectedHierarchy;

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showGranular, setShowGranular] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState('');

  const hasAnyFilter = Boolean(state || district || revenue_division || mandal || local_body_name || village_locality_ward);

  // States & Districts options from hierarchy
  const stateOptions = useMemo(() => [
    { value: '', label: 'All States' },
    ...(hierarchyData?.states || []).map((s) => ({ value: s, label: s }))
  ], [hierarchyData?.states]);

  const districtOptions = useMemo(() => [
    { value: '', label: 'All Districts' },
    ...(hierarchyData?.districts || []).map((d) => ({ value: d, label: d }))
  ], [hierarchyData?.districts]);

  const mandalOptions = useMemo(() => [
    { value: '', label: 'All Mandals' },
    ...(hierarchyData?.mandals || []).map((m) => ({ value: m, label: m }))
  ], [hierarchyData?.mandals]);

  const divisionOptions = useMemo(() => [
    { value: '', label: 'All Divisions' },
    ...(hierarchyData?.revenue_divisions || []).map((rd) => ({ value: rd, label: rd }))
  ], [hierarchyData?.revenue_divisions]);

  const localBodyOptions = useMemo(() => [
    { value: '', label: 'All Local Bodies' },
    ...(hierarchyData?.local_bodies || []).map((lb) => ({
      value: lb.name,
      label: `${lb.name} (${lb.type === 'Gram Panchayat' ? 'GP' : 'Urban'})`
    }))
  ], [hierarchyData?.local_bodies]);

  const wardOptions = useMemo(() => [
    { value: '', label: 'All Wards & Localities' },
    ...(hierarchyData?.wards_villages || []).map((w) => ({ value: w, label: w }))
  ], [hierarchyData?.wards_villages]);

  // Single point-to-point district scanner action
  const handleTriggerDiscovery = async () => {
    if (!state || !district) {
      alert('Please select both a State and District to run discovery.');
      return;
    }

    setIsDiscovering(true);
    setDiscoveryMessage(`Discovering schools in ${district}, ${state}...`);

    try {
      const res = await fetch('/api/run-district', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({
          state,
          district,
          count: 25,
          force_scrape: false,
          scrape_more: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDiscoveryMessage(`Loaded ${data.count} schools in ${district}.`);
        if (onDistrictRunComplete) {
          onDistrictRunComplete({
            state,
            district,
            schools: data.schools
          });
        }
        setTimeout(() => setDiscoveryMessage(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Discovery request failed.');
        setDiscoveryMessage('');
      }
    } catch (err) {
      console.error('Territory discovery error:', err);
      alert('Network error while running discovery.');
      setDiscoveryMessage('');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 mb-6 transition-colors">
      {/* Header bar: Title, Scope Breadcrumb & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Territory & Administrative Scope</span>
              {state && district && (
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                  — {state} &gt; {district} {mandal ? `> ${mandal}` : ''}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {discoveryMessage || 'Select state and district to scope schools and pipeline metrics'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {totalMatchingSchools} {totalMatchingSchools === 1 ? 'school' : 'schools'}
          </span>
          {hasAnyFilter && (
            <button
              onClick={onResetHierarchy}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-md transition cursor-pointer"
              title="Reset location drill-down"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Territory Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 mt-3 items-end">
        {/* State */}
        <div className="sm:col-span-1 md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            State
          </label>
          <CustomDropdown
            value={state}
            onChange={(val) => onHierarchyChange('state', val)}
            options={stateOptions}
            placeholder="Select State"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* District */}
        <div className="sm:col-span-1 md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            District
          </label>
          <CustomDropdown
            value={district}
            onChange={(val) => onHierarchyChange('district', val)}
            options={districtOptions}
            placeholder="Select District"
            variant="auto"
            searchable={true}
          />
        </div>

        {/* Mandal */}
        <div className="sm:col-span-1 md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Mandal / Sub-District
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
      </div>

      {/* Granular Sub-Division / Ward Expansion */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setShowGranular(!showGranular)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold cursor-pointer transition text-[11px]"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showGranular ? 'Hide granular zoning' : 'Granular zoning (Division, Local Body, Ward)'}</span>
          {showGranular ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Admin Single Discover / Scan Action */}
        {userRole === 'admin' && state && district && (
          <button
            type="button"
            onClick={handleTriggerDiscovery}
            disabled={isDiscovering}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800/80 transition cursor-pointer shadow-2xs disabled:opacity-50"
            title="Scan live sources to discover new institutions in this district"
          >
            {isDiscovering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Discover More Schools</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Granular Dropdowns */}
      {showGranular && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Revenue Division
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
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Local Body (Municipality/GP)
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
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Ward / Village
            </label>
            <CustomDropdown
              value={village_locality_ward}
              onChange={(val) => onHierarchyChange('village_locality_ward', val)}
              options={wardOptions}
              placeholder="All Wards"
              variant="auto"
              searchable={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
