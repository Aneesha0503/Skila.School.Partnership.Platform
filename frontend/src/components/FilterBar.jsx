import React, { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, ListFilter, SlidersHorizontal, Layers, X, Check, RotateCcw } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  availableAgents = [],
  userRole = 'admin',
  currentAgentName = 'Field Agent',
  confirmedOnly = false,
  onToggleConfirmedOnly
}) {
  const { search, board, lead_status, skila_ai_potential, technology_adoption_level, tier = 'All', agent = 'All' } = filters;

  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const moreFiltersRef = useRef(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreFiltersRef.current && !moreFiltersRef.current.contains(event.target)) {
        setMoreFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active secondary filters
  const activeSecondaryCount = [
    board && board !== 'All',
    skila_ai_potential && skila_ai_potential !== 'All',
    technology_adoption_level && technology_adoption_level !== 'All'
  ].filter(Boolean).length;

  const hasAnyFilterActive = Boolean(
    (search && search.trim()) ||
    (lead_status && lead_status !== 'All') ||
    (agent && agent !== 'All') ||
    (tier && tier !== 'All') ||
    activeSecondaryCount > 0 ||
    confirmedOnly
  );

  const resetAllFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onFilterChange('search', '');
      onFilterChange('board', 'All');
      onFilterChange('lead_status', 'All');
      onFilterChange('skila_ai_potential', 'All');
      onFilterChange('technology_adoption_level', 'All');
      onFilterChange('tier', 'All');
      if (userRole === 'admin') onFilterChange('agent', 'All');
      if (confirmedOnly && onToggleConfirmedOnly) onToggleConfirmedOnly();
    }
  };

  const resetSecondaryFilters = () => {
    onFilterChange('board', 'All');
    onFilterChange('skila_ai_potential', 'All');
    onFilterChange('technology_adoption_level', 'All');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3 sm:p-3.5 mb-6 space-y-3 transition-colors">
      {/* Top Core Controls Row */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        {/* Instant Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search school name, city, district, principal..."
            value={search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          />
          {search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Dropdowns & Secondary Filter Popover */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent Filter / Locked Scope Indicator */}
          {userRole === 'agent' ? (
            <div 
              className="text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 py-1.5 px-2.5 font-semibold text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1.5 shadow-2xs shrink-0"
              title="Your view is strictly scoped to your assigned schools and field notes."
            >
              <span>💼</span>
              <span className="truncate max-w-[120px]">{currentAgentName}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold uppercase">Scoped</span>
            </div>
          ) : (
            <select
              value={agent}
              onChange={(e) => onFilterChange('agent', e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs shrink-0"
              title="Filter by Field Agent"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Agents</option>
              {availableAgents.map((ag) => (
                <option key={ag} value={ag} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  💼 {ag}
                </option>
              ))}
            </select>
          )}

          {/* Core Pipeline Status Filter */}
          <select
            value={lead_status}
            onChange={(e) => onFilterChange('lead_status', e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer shadow-2xs shrink-0"
          >
            <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Status (New, Visited, Joined...)</option>
            <option value="New" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">New School</option>
            <option value="Contacted" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Call / Contacted</option>
            <option value="Demo Scheduled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Meeting / Demo Fixed</option>
            <option value="Proposal Shared" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Offer / Proposal Sent</option>
            <option value="Pilot Started" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Trial Started</option>
            <option value="Closed Won" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Joined & Signed (Won)</option>
            <option value="Closed Lost" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Not Interested (Lost)</option>
          </select>

          {/* Secondary Filters Popover Button */}
          <div className="relative" ref={moreFiltersRef}>
            <button
              type="button"
              onClick={() => setMoreFiltersOpen(!moreFiltersOpen)}
              className={`inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-2xs ${
                activeSecondaryCount > 0
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="More Filters (Board, Tech, AI)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {activeSecondaryCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {activeSecondaryCount}
                </span>
              )}
            </button>

            {/* Popover Card */}
            {moreFiltersOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3.5 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">More School Filters</span>
                  {activeSecondaryCount > 0 && (
                    <button
                      type="button"
                      onClick={resetSecondaryFilters}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Board */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    School Board (CBSE, State, etc.)
                  </label>
                  <select
                    value={board}
                    onChange={(e) => onFilterChange('board', e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Boards</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IB">IB / Cambridge</option>
                    <option value="State Board">State Board</option>
                  </select>
                </div>

                {/* AI Potential */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Interest in AI & Coding
                  </label>
                  <select
                    value={skila_ai_potential}
                    onChange={(e) => onFilterChange('skila_ai_potential', e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Levels</option>
                    <option value="High">High Interest</option>
                    <option value="Medium">Medium Interest</option>
                    <option value="Low">Low Interest</option>
                  </select>
                </div>

                {/* Tech Adoption */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Computer Lab & Tech Facility
                  </label>
                  <select
                    value={technology_adoption_level}
                    onChange={(e) => onFilterChange('technology_adoption_level', e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 px-2.5 font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Facilities</option>
                    <option value="Advanced">Advanced (Full Lab & Smart TVs)</option>
                    <option value="High">High (Computer Lab Available)</option>
                    <option value="Medium">Medium (Few Computers)</option>
                    <option value="Low">Low (No Computer Lab)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMoreFiltersOpen(false)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset All Filters Button (Only when filters are active) */}
          {hasAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              title="Reset all search and filter values"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Table View (Dense CRM)"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer flex items-center justify-center ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Filter Pills Row */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" /> School Type:
        </span>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'All')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            !tier || tier === 'All'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'High Range')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            tier === 'High Range'
              ? 'bg-purple-700 text-white shadow-2xs font-semibold'
              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800'
          }`}
        >
          👑 Big Private / CBSE
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'State Board - High Strength')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            tier === 'State Board - High Strength'
              ? 'bg-blue-700 text-white shadow-2xs font-semibold'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800'
          }`}
        >
          🔷 State Big (1200+)
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'State Board - Mid Strength')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            tier === 'State Board - Mid Strength'
              ? 'bg-amber-600 text-white shadow-2xs font-semibold'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
          }`}
        >
          🔶 State Medium (500–1200)
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'State Board - Low Strength')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            tier === 'State Board - Low Strength'
              ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
          }`}
        >
          ⚪ State Small (&lt;500)
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* Quick Confirmed Deals Only Toggle */}
        <button
          type="button"
          onClick={onToggleConfirmedOnly}
          className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1.5 cursor-pointer ${
            confirmedOnly
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/60'
          }`}
          title="Show only joined and closed schools"
        >
          <span>🏆</span>
          <span>Joined Schools Only</span>
          {confirmedOnly && (
            <span className="text-[10px] ml-0.5 bg-white/20 px-1 py-0.2 rounded-full font-bold">
              ON
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
