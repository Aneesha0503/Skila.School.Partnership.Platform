import React from 'react';
import { Search, LayoutGrid, ListFilter, Sparkles, SlidersHorizontal, Layers } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onClearFilters
}) {
  const { search, board, lead_status, skila_ai_potential, technology_adoption_level, tier = 'All' } = filters;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 mb-6 space-y-3">
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
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Quick Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Board */}
          <select
            value={board}
            onChange={(e) => onFilterChange('board', e.target.value)}
            className="text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 font-medium text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="All">All Boards</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
            <option value="IB">IB / Cambridge</option>
            <option value="State Board">State Board</option>
          </select>

          {/* Lead Status */}
          <select
            value={lead_status}
            onChange={(e) => onFilterChange('lead_status', e.target.value)}
            className="text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 font-medium text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="All">All Lead Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Demo Scheduled">Demo Scheduled</option>
            <option value="Proposal Shared">Proposal Shared</option>
            <option value="Pilot Started">Pilot Started</option>
            <option value="Closed Won">Closed Won</option>
          </select>

          {/* Skila AI Potential */}
          <select
            value={skila_ai_potential}
            onChange={(e) => onFilterChange('skila_ai_potential', e.target.value)}
            className="text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 font-medium text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="All">All AI Potential</option>
            <option value="High">High Potential</option>
            <option value="Medium">Medium Potential</option>
            <option value="Low">Low Potential</option>
          </select>

          {/* Tech Adoption */}
          <select
            value={technology_adoption_level}
            onChange={(e) => onFilterChange('technology_adoption_level', e.target.value)}
            className="text-xs rounded-lg border-slate-200 bg-slate-50 py-2 px-2.5 font-medium text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="All">All Tech Adoption</option>
            <option value="Advanced">Advanced Tech</option>
            <option value="High">High Tech</option>
            <option value="Medium">Medium Tech</option>
            <option value="Low">Low Tech</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-auto md:ml-0">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition cursor-pointer ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Filter Pills (High to Low) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2.5 border-t border-slate-100 text-xs">
        <span className="text-[11px] font-bold text-slate-500 mr-1 uppercase tracking-wider flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-500" /> Tier Sort & Filter:
        </span>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'All')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            !tier || tier === 'All'
              ? 'bg-slate-900 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
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
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          🔶 State Board - Mid (500–1200)
        </button>
        <button
          type="button"
          onClick={() => onFilterChange('tier', 'State Board - Low Strength')}
          className={`px-2.5 py-1 rounded-lg font-medium transition text-xs cursor-pointer ${
            tier === 'State Board - Low Strength'
              ? 'bg-slate-700 text-white shadow-2xs font-semibold'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
          }`}
        >
          ⚪ State Board - Low (&lt;500)
        </button>
      </div>
    </div>
  );
}
