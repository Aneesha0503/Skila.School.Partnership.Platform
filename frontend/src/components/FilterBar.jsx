import React from 'react';
import { Search, LayoutGrid, ListFilter, Sparkles, SlidersHorizontal, Layers } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  availableAgents = [],
  userRole = 'admin',
  currentAgentName = 'Uday'
}) {
  const { search, board, lead_status, skila_ai_potential, technology_adoption_level, tier = 'All', agent = 'All' } = filters;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 mb-6 space-y-3 transition-colors">
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by school name, UDISE code, leader or locality..."
            value={search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Quick Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Agent Filter / Locked Scope Indicator */}
          {userRole === 'agent' ? (
            <div 
              className="text-xs rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 py-1.5 px-2.5 font-semibold text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1.5 shadow-2xs"
              title="Your view is strictly scoped to your assigned schools and field notes."
            >
              <span>💼</span>
              <span>Agent: {currentAgentName}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">Scoped</span>
            </div>
          ) : (
            <select
              value={agent}
              onChange={(e) => onFilterChange('agent', e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              title="Filter by Field Agent (notes author or sales owner)"
            >
              <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Agents</option>
              {availableAgents.map((ag) => (
                <option key={ag} value={ag} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  💼 {ag}
                </option>
              ))}
            </select>
          )}

          {/* Board */}
          <select
            value={board}
            onChange={(e) => onFilterChange('board', e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Boards</option>
            <option value="CBSE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">CBSE</option>
            <option value="ICSE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">ICSE</option>
            <option value="IB" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">IB / Cambridge</option>
            <option value="State Board" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">State Board</option>
          </select>

          {/* Lead Status */}
          <select
            value={lead_status}
            onChange={(e) => onFilterChange('lead_status', e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Lead Statuses</option>
            <option value="New" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">New</option>
            <option value="Contacted" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Contacted</option>
            <option value="Demo Scheduled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Demo Scheduled</option>
            <option value="Proposal Shared" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Proposal Shared</option>
            <option value="Pilot Started" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pilot Started</option>
            <option value="Closed Won" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Closed Won</option>
          </select>

          {/* Skila AI Potential */}
          <select
            value={skila_ai_potential}
            onChange={(e) => onFilterChange('skila_ai_potential', e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All AI Potential</option>
            <option value="High" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">High Potential</option>
            <option value="Medium" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Medium Potential</option>
            <option value="Low" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Low Potential</option>
          </select>

          {/* Tech Adoption */}
          <select
            value={technology_adoption_level}
            onChange={(e) => onFilterChange('technology_adoption_level', e.target.value)}
            className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-2.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Tech Adoption</option>
            <option value="Advanced" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Advanced Tech</option>
            <option value="High" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">High Tech</option>
            <option value="Medium" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Medium Tech</option>
            <option value="Low" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Low Tech</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto md:ml-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Filter Pills (High to Low) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" /> Tier Sort & Filter:
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
          All (High to Low)
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
          👑 High Range (International/CBSE/ICSE)
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
          🔷 State Board - High (1200+)
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
          🔶 State Board - Mid (500–1200)
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
          ⚪ State Board - Low (&lt;500)
        </button>
      </div>
    </div>
  );
}
