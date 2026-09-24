import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import HierarchyNavigator from './components/HierarchyNavigator';
import FilterBar from './components/FilterBar';
import SchoolCard from './components/SchoolCard';
import SchoolTable from './components/SchoolTable';
import SchoolDetailModal from './components/SchoolDetailModal';
import AddEditSchoolModal from './components/AddEditSchoolModal';
import SkilaScraperModal from './components/SkilaScraperModal';
import DistrictRunner from './components/DistrictRunner';
import IndiaMapHero from './components/IndiaMapHero';
import AccessControlModal from './components/AccessControlModal';
import { School, RefreshCw } from 'lucide-react';

export default function App() {
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skilaScraperModalOpen, setSkilaScraperModalOpen] = useState(false);

  // Role-Based Access Control State (Admin vs Agent)
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('skila_user_role') || 'admin';
  });
  const [accessModalOpen, setAccessModalOpen] = useState(false);

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

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('skila_view_mode') || 'table';
  });

  useEffect(() => {
    localStorage.setItem('skila_view_mode', viewMode);
  }, [viewMode]);

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('info');

  // Light / Dark Theme State
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('skila_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('skila_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    localStorage.setItem('skila_user_role', userRole);
  }, [userRole]);

  // Authenticated fetch wrapper passing active role header
  const fetchWithRole = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-User-Role': userRole
      }
    });
  };

  // Fetch notifications for Admin alert bell
  const fetchNotifications = async () => {
    try {
      const res = await fetchWithRole('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [userRole]);

  const handleNotificationClick = async (notif) => {
    try {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    } catch (e) {}

    let targetSchool = schools.find((s) => s.id === notif.school_id);
    if (!targetSchool) {
      try {
        const res = await fetchWithRole(`/api/schools/${notif.school_id}`);
        if (res.ok) {
          targetSchool = await res.json();
        }
      } catch (e) {}
    }

    if (targetSchool) {
      setActiveModalTab('notes');
      setSelectedSchool(targetSchool);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  // Fetch initial status and metadata
  useEffect(() => {
    fetchStatus();
    fetchStats();
  }, [userRole]);

  // Fetch hierarchy options when administrative selection changes
  useEffect(() => {
    fetchHierarchyOptions();
    fetchSchools();
  }, [selectedHierarchy, filters, userRole]);

  const fetchStatus = async () => {
    try {
      const res = await fetchWithRole('/api/status');
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
      const res = await fetchWithRole('/api/stats');
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

      const res = await fetchWithRole(`/api/hierarchy?${params.toString()}`);
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

      const res = await fetchWithRole(`/api/schools?${params.toString()}`);
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
    if (userRole !== 'admin') {
      setAccessModalOpen(true);
      return;
    }
    setEditingSchool(null);
    setAddEditModalOpen(true);
  };

  const handleOpenEditModal = (school) => {
    if (userRole !== 'admin') {
      setAccessModalOpen(true);
      return;
    }
    setSelectedSchool(null);
    setEditingSchool(school);
    setAddEditModalOpen(true);
  };

  const handleSchoolSaved = (savedSchool) => {
    fetchSchools();
    fetchStats();
    setSelectedSchool(savedSchool);
  };

  const handleExportExcel = () => {
    let url = '/api/export/excel';
    const params = new URLSearchParams();
    if (selectedHierarchy.state) params.append('state', selectedHierarchy.state);
    if (selectedHierarchy.district) params.append('district', selectedHierarchy.district);
    const q = params.toString();
    if (q) url += `?${q}`;
    window.open(url, '_blank');
  };

  const handleRunSchoolDetails = async (schoolId) => {
    if (userRole !== 'admin') {
      setAccessModalOpen(true);
      return null;
    }
    try {
      const res = await fetchWithRole(`/api/schools/${schoolId}/run-details`, { method: 'POST' });
      if (res.ok) {
        const enriched = await res.json();
        setSchools((prev) => prev.map((s) => (s.id === schoolId ? enriched : s)));
        if (selectedSchool && selectedSchool.id === schoolId) {
          setSelectedSchool(enriched);
        }
        fetchStats();
        return enriched;
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to run school details.');
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

  const handleSelectState = (stateName) => {
    setSelectedHierarchy({
      state: stateName,
      district: '',
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <Header
        statusInfo={statusInfo}
        onOpenAddModal={handleOpenAddModal}
        onExportExcel={handleExportExcel}
        theme={theme}
        onToggleTheme={toggleTheme}
        userRole={userRole}
        onRoleChange={setUserRole}
        onOpenAccessModal={() => setAccessModalOpen(true)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Pan-India Vision & Interactive Vector Map Hero */}
        <IndiaMapHero
          onSelectState={handleSelectState}
          selectedState={selectedHierarchy.state}
        />

        {/* KPI Summary Cards */}
        <StatsBar stats={stats} schools={schools} />

        {/* Automated District Discovery & AI Scraper */}
        <DistrictRunner
          onDistrictRunComplete={handleDistrictRunComplete}
          currentState={selectedHierarchy.state}
          currentDistrict={selectedHierarchy.district}
          totalSchoolsLoaded={schools.length}
          userRole={userRole}
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
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading school details...</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mx-auto mb-3 shadow-xs">
              <School className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
              No Schools Loaded
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Select a State and District above and click Discover Schools to load regional directory records.
            </p>
            {selectedHierarchy.district && (
              <button
                onClick={() => {
                  handleResetHierarchy();
                  setFilters({ search: '', tier: 'All', board: 'All', lead_status: 'All', skila_ai_potential: 'All', technology_adoption_level: 'All' });
                }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-transparent dark:border-indigo-800 transition cursor-pointer"
              >
                Clear District Selection
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school, idx) => (
              <SchoolCard
                key={school.id}
                school={school}
                index={idx}
                onSelectSchool={setSelectedSchool}
                onRunSchoolDetails={handleRunSchoolDetails}
                userRole={userRole}
              />
            ))}
          </div>
        ) : (
          <SchoolTable
            schools={schools}
            onSelectSchool={setSelectedSchool}
            onRunSchoolDetails={handleRunSchoolDetails}
            userRole={userRole}
          />
        )}
      </main>

      {/* School Detail Modal */}
      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          initialTab={activeModalTab}
          onClose={() => {
            setSelectedSchool(null);
            setActiveModalTab('info');
          }}
          onUpdateSchool={(updated) => {
            setSelectedSchool(updated);
            fetchSchools();
            fetchStats();
            fetchNotifications();
          }}
          onOpenEditModal={handleOpenEditModal}
          userRole={userRole}
        />
      )}

      {/* Add / Edit School Modal - Admin Only */}
      {addEditModalOpen && userRole === 'admin' && (
        <AddEditSchoolModal
          initialData={editingSchool}
          onClose={() => {
            setAddEditModalOpen(false);
            setEditingSchool(null);
          }}
          onSaveSuccess={handleSchoolSaved}
        />
      )}

      {/* Skila AI Scraper Modal */}
      {skilaScraperModalOpen && (
        <SkilaScraperModal
          onClose={() => setSkilaScraperModalOpen(false)}
          onImportSuccess={() => {
            fetchSchools();
            fetchStats();
            fetchHierarchyOptions();
          }}
        />
      )}

      {/* Role-Based Access Control Matrix Modal */}
      <AccessControlModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        currentRole={userRole}
        onSelectRole={setUserRole}
      />
    </div>
  );
}
