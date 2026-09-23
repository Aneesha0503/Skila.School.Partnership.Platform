import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import HierarchyNavigator from './components/HierarchyNavigator';
import FilterBar from './components/FilterBar';
import SchoolCard from './components/SchoolCard';
import SchoolTable from './components/SchoolTable';
import SchoolDetailModal from './components/SchoolDetailModal';
import AddEditSchoolModal from './components/AddEditSchoolModal';
import { School, RefreshCw } from 'lucide-react';

export default function App() {
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Administrative Hierarchy State
  const [selectedHierarchy, setSelectedHierarchy] = useState({
    state: '',
    district: '',
    revenue_division: '',
    mandal: '',
    local_body_name: '',
    village_locality_ward: ''
  });

  // Secondary Search & Category Filters
  const [filters, setFilters] = useState({
    search: '',
    board: 'All',
    lead_status: 'All',
    skila_ai_potential: 'All',
    technology_adoption_level: 'All'
  });

  const [viewMode, setViewMode] = useState('grid');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  // Fetch initial status and metadata
  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, []);

  // Fetch hierarchy options when administrative selection changes
  useEffect(() => {
    fetchHierarchyOptions();
    fetchSchools();
  }, [selectedHierarchy, filters]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setStatusInfo(data);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchHierarchyOptions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedHierarchy.state) params.append('state', selectedHierarchy.state);
      if (selectedHierarchy.district) params.append('district', selectedHierarchy.district);
      if (selectedHierarchy.revenue_division) params.append('revenue_division', selectedHierarchy.revenue_division);
      if (selectedHierarchy.mandal) params.append('mandal', selectedHierarchy.mandal);
      if (selectedHierarchy.local_body_name) params.append('local_body_name', selectedHierarchy.local_body_name);

      const res = await fetch(`/api/hierarchy?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHierarchyData(data);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
    }
  };

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedHierarchy.state) params.append('state', selectedHierarchy.state);
      if (selectedHierarchy.district) params.append('district', selectedHierarchy.district);
      if (selectedHierarchy.revenue_division) params.append('revenue_division', selectedHierarchy.revenue_division);
      if (selectedHierarchy.mandal) params.append('mandal', selectedHierarchy.mandal);
      if (selectedHierarchy.local_body_name) params.append('local_body_name', selectedHierarchy.local_body_name);
      if (selectedHierarchy.village_locality_ward) params.append('village_locality_ward', selectedHierarchy.village_locality_ward);

      if (filters.search) params.append('search', filters.search);
      if (filters.board !== 'All') params.append('board', filters.board);
      if (filters.lead_status !== 'All') params.append('lead_status', filters.lead_status);
      if (filters.skila_ai_potential !== 'All') params.append('skila_ai_potential', filters.skila_ai_potential);
      if (filters.technology_adoption_level !== 'All') params.append('technology_adoption_level', filters.technology_adoption_level);

      const res = await fetch(`/api/schools?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSchools(data);
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHierarchyChange = (level, value) => {
    setSelectedHierarchy((prev) => {
      const next = { ...prev, [level]: value };
      if (level === 'state') {
        next.district = '';
        next.revenue_division = '';
        next.mandal = '';
        next.local_body_name = '';
        next.village_locality_ward = '';
      } else if (level === 'district') {
        next.revenue_division = '';
        next.mandal = '';
        next.local_body_name = '';
        next.village_locality_ward = '';
      } else if (level === 'revenue_division') {
        next.mandal = '';
        next.local_body_name = '';
        next.village_locality_ward = '';
      } else if (level === 'mandal') {
        next.local_body_name = '';
        next.village_locality_ward = '';
      } else if (level === 'local_body_name') {
        next.village_locality_ward = '';
      }
      return next;
    });
  };

  const handleResetHierarchy = () => {
    setSelectedHierarchy({
      state: '',
      district: '',
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEditModal = (school) => {
    setSelectedSchool(null);
    setEditingSchool(school);
    setAddEditModalOpen(true);
  };

  const handleSchoolSaved = (savedSchool) => {
    fetchSchools();
    fetchStats();
    setSelectedSchool(savedSchool);
  };

  const handleExportCsv = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        statusInfo={statusInfo}
        onOpenAddModal={handleOpenAddModal}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* KPI Summary Cards */}
        <StatsBar stats={stats} />

        {/* Administrative Hierarchy Cascading Drill-Down */}
        <HierarchyNavigator
          hierarchyData={hierarchyData}
          selectedHierarchy={selectedHierarchy}
          onHierarchyChange={handleHierarchyChange}
          onResetHierarchy={handleResetHierarchy}
          totalMatchingSchools={schools.length}
        />

        {/* Search & Attribute Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Schools Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-xs">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading school details...</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <School className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No schools match this criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Try adjusting the administrative hierarchy or clearing some of the filters to see more results.
            </p>
            <button
              onClick={() => {
                handleResetHierarchy();
                setFilters({ search: '', board: 'All', lead_status: 'All', skila_ai_potential: 'All', technology_adoption_level: 'All' });
              }}
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onSelectSchool={setSelectedSchool}
              />
            ))}
          </div>
        ) : (
          <SchoolTable
            schools={schools}
            onSelectSchool={setSelectedSchool}
          />
        )}
      </main>

      {/* School Detail Modal */}
      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onUpdateSchool={(updated) => {
            setSelectedSchool(updated);
            fetchSchools();
            fetchStats();
          }}
          onOpenEditModal={handleOpenEditModal}
        />
      )}

      {/* Add / Edit School Modal */}
      {addEditModalOpen && (
        <AddEditSchoolModal
          initialData={editingSchool}
          onClose={() => {
            setAddEditModalOpen(false);
            setEditingSchool(null);
          }}
          onSaveSuccess={handleSchoolSaved}
        />
      )}
    </div>
  );
}
