import React from 'react';
import { Search, LayoutGrid, ListFilter, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onClearFilters
}) {
  const { search, board, lead_status, skila_ai_potential, technology_adoption_level } = filters;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 mb-6">
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
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
