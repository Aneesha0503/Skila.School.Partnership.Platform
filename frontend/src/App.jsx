import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import HierarchyNavigator from './components/HierarchyNavigator';
import FilterBar from './components/FilterBar';
import SchoolCard from './components/SchoolCard';
import SchoolTable from './components/SchoolTable';
import SchoolDetailModal from './components/SchoolDetailModal';
import AddEditSchoolModal from './components/AddEditSchoolModal';
import MistralScraperModal from './components/MistralScraperModal';
import DistrictRunner from './components/DistrictRunner';
import { School, RefreshCw } from 'lucide-react';

export default function App() {
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mistralModalOpen, setMistralModalOpen] = useState(false);

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
    tier: 'All',
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
      if (filters.tier && filters.tier !== 'All') params.append('tier', filters.tier);
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

  const handleRunSchoolDetails = async (schoolId) => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/run-details`, { method: 'POST' });
      if (res.ok) {
        const enriched = await res.json();
        setSchools((prev) => prev.map((s) => (s.id === schoolId ? enriched : s)));
        if (selectedSchool && selectedSchool.id === schoolId) {
          setSelectedSchool(enriched);
        }
        fetchStats();
        return enriched;
      }
    } catch (err) {
      console.error('Error running school details:', err);
    }
    return null;
  };

  const handleDistrictRunComplete = ({ state, district, schools: returnedSchools }) => {
    setSelectedHierarchy({
      state: state,
      district: district,
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    });
    setFilters({
      search: '',
      tier: 'All',
      board: 'All',
      lead_status: 'All',
      skila_ai_potential: 'All',
      technology_adoption_level: 'All'
    });
    if (returnedSchools && returnedSchools.length > 0) {
      setSchools(returnedSchools);
    } else {
      fetchSchools();
    }
    fetchHierarchyOptions();
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <Header
        statusInfo={statusInfo}
        onOpenAddModal={handleOpenAddModal}
        onOpenMistralScraper={() => setMistralModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* KPI Summary Cards */}
        <StatsBar stats={stats} />

        {/* Automated District Discovery & AI Scraper */}
        <DistrictRunner
          onDistrictRunComplete={handleDistrictRunComplete}
          currentState={selectedHierarchy.state}
          currentDistrict={selectedHierarchy.district}
        />

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
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 mx-auto mb-3 shadow-xs">
              <School className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Database is Clean — Ready for Discovery
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
              All dummy data has been removed. Select any <strong>State</strong> and <strong>District</strong> in the Automated Discovery box above, then click <strong>"Run District Schools"</strong> to scrape and list schools strictly from High to Low.
            </p>
            {selectedHierarchy.district && (
              <button
                onClick={() => {
                  handleResetHierarchy();
                  setFilters({ search: '', tier: 'All', board: 'All', lead_status: 'All', skila_ai_potential: 'All', technology_adoption_level: 'All' });
                }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
              >
                Clear District Selection
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                onSelectSchool={setSelectedSchool}
                onRunSchoolDetails={handleRunSchoolDetails}
              />
            ))}
          </div>
        ) : (
          <SchoolTable
            schools={schools}
            onSelectSchool={setSelectedSchool}
            onRunSchoolDetails={handleRunSchoolDetails}
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

      {/* Mistral AI Scraper Modal */}
      {mistralModalOpen && (
        <MistralScraperModal
          onClose={() => setMistralModalOpen(false)}
          onImportSuccess={() => {
            fetchSchools();
            fetchStats();
            fetchHierarchyOptions();
          }}
        />
      )}
    </div>
  );
}
