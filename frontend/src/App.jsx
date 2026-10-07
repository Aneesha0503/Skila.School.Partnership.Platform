import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StatsBar from './components/StatsBar';
import TerritoryNavigator from './components/TerritoryNavigator';
import FilterBar from './components/FilterBar';
import SchoolCard from './components/SchoolCard';
import SchoolTable from './components/SchoolTable';
import SchoolDetailModal from './components/SchoolDetailModal';
import AddEditSchoolModal from './components/AddEditSchoolModal';
import SkilaScraperModal from './components/SkilaScraperModal';
import IndiaMapHero from './components/IndiaMapHero';
import AccessControlModal from './components/AccessControlModal';
import LoginModal from './components/LoginModal';
import ConfirmedSchoolsModal from './components/ConfirmedSchoolsModal';
import AgentPerformanceModal from './components/AgentPerformanceModal';
import MOUPreviewModal from './components/MOUPreviewModal';
import PartnershipCertificateModal from './components/PartnershipCertificateModal';
import StudentRosterModal from './components/StudentRosterModal';
import FinancialAnalyticsModal from './components/FinancialAnalyticsModal';
import CallingHub from './components/calling/CallingHub';
import AuthGateSection from './components/AuthGateSection';
import { AuthProvider, useAuth } from './context/AuthContext';
import { School, RefreshCw, Phone, ArrowRight } from 'lucide-react';
import { 
  parseSearchParams, 
  buildSearchParams, 
  computeNextHierarchy, 
  computeStepBackHierarchy 
} from './utils/navigation';

function SkilaApp() {
  const { token, user, isAuthenticated, loginModalOpen, setLoginModalOpen } = useAuth();
  const [loginModalMode, setLoginModalMode] = useState('login');
  const handleOpenLogin = () => { setLoginModalMode('login'); setLoginModalOpen(true); };
  const handleOpenRegister = () => { setLoginModalMode('register'); setLoginModalOpen(true); };
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [hierarchyData, setHierarchyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skilaScraperModalOpen, setSkilaScraperModalOpen] = useState(false);

  // Confirmed Schools & Formalities State
  const [confirmedOnly, setConfirmedOnly] = useState(false);
  const [confirmedSchoolsModalOpen, setConfirmedSchoolsModalOpen] = useState(false);
  const [confirmedData, setConfirmedData] = useState({ schools: [], metrics: {} });
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedSchoolForDoc, setSelectedSchoolForDoc] = useState(null);
  const [formalitiesForDoc, setFormalitiesForDoc] = useState(null);

  // Role-Based Access Control State (Admin vs Agent)
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('skila_user_role') || 'admin';
  });
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [agentPerformanceModalOpen, setAgentPerformanceModalOpen] = useState(false);
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [platformMode, setPlatformMode] = useState(() => {
    return localStorage.getItem('skila_platform_mode') || 'calling';
  });

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
    technology_adoption_level: 'All',
    agent: 'All'
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

  const isPopStateRef = useRef(false);
  const pendingSchoolIdRef = useRef(null);
  const pendingEditIdRef = useRef(null);

  const schoolsRef = useRef(schools);
  schoolsRef.current = schools;

  const selectedHierarchyRef = useRef(selectedHierarchy);
  selectedHierarchyRef.current = selectedHierarchy;

  const selectedSchoolRef = useRef(selectedSchool);
  selectedSchoolRef.current = selectedSchool;

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

  // Current active agent identity (when in Agent Level)
  const [currentAgentName, setCurrentAgentName] = useState(() => {
    return localStorage.getItem('skila_current_agent') || 'Field Agent';
  });

  useEffect(() => {
    localStorage.setItem('skila_current_agent', currentAgentName);
  }, [currentAgentName]);

  // Synchronize authenticated user identity with active role & agent name
  useEffect(() => {
    if (user) {
      if (user.role && user.role !== userRole) {
        setUserRole(user.role);
      }
      if (user.role === 'agent' && user.full_name && user.full_name !== currentAgentName) {
        setCurrentAgentName(user.full_name);
      }
    }
  }, [user]);

  // Authenticated fetch wrapper passing JWT token, active role, and agent name headers
  const fetchWithRole = (url, options = {}) => {
    const authHeaders = {};
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-User-Role': user?.role || userRole,
        'X-Agent-Name': user?.role === 'agent' ? (user?.full_name || currentAgentName) : currentAgentName,
        ...authHeaders
      }
    });
  };

  // ----------------------------------------------------
  // Backward Navigation & URL Query History Integration
  // ----------------------------------------------------
  const updateHierarchyWithHistory = (nextHierarchy, action = 'push') => {
    setSelectedHierarchy(nextHierarchy);
    if (isPopStateRef.current) return;

    const query = buildSearchParams({ hierarchy: nextHierarchy });
    const url = query ? `?${query}` : window.location.pathname;
    const historyState = { type: 'hierarchy', hierarchy: nextHierarchy };

    if (action === 'push') {
      window.history.pushState(historyState, '', url);
    } else {
      window.history.replaceState(historyState, '', url);
    }
  };

  const handleHierarchyChange = (level, value) => {
    const next = computeNextHierarchy(selectedHierarchyRef.current, level, value);
    updateHierarchyWithHistory(next, 'push');
  };

  const handleResetHierarchy = () => {
    const next = {
      state: '',
      district: '',
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    };
    updateHierarchyWithHistory(next, 'push');
  };

  const handleStepBackHierarchy = () => {
    const next = computeStepBackHierarchy(selectedHierarchyRef.current);
    updateHierarchyWithHistory(next, 'push');
  };

  const handleSelectState = (stateName) => {
    const next = {
      state: stateName,
      district: '',
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    };
    updateHierarchyWithHistory(next, 'push');
  };

  const handleSelectSchool = (school, tab = 'info') => {
    setSelectedSchool(school);
    setActiveModalTab(tab);

    if (isPopStateRef.current) return;

    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      schoolId: school.id,
      tab: tab
    });
    const url = query ? `?${query}` : window.location.pathname;

    window.history.pushState({
      type: 'school',
      hierarchy: selectedHierarchyRef.current,
      schoolId: school.id,
      tab: tab
    }, '', url);
  };

  const handleModalTabChange = (newTab) => {
    setActiveModalTab(newTab);
    const curr = selectedSchoolRef.current;
    if (!curr) return;

    if (isPopStateRef.current) return;

    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      schoolId: curr.id,
      tab: newTab
    });
    const url = query ? `?${query}` : window.location.pathname;

    window.history.replaceState({
      type: 'school',
      hierarchy: selectedHierarchyRef.current,
      schoolId: curr.id,
      tab: newTab
    }, '', url);
  };

  const handleCloseSchoolModal = () => {
    if (window.history.state?.type === 'school') {
      window.history.back();
    } else {
      setSelectedSchool(null);
      setActiveModalTab('info');
      const query = buildSearchParams({ hierarchy: selectedHierarchyRef.current });
      const url = query ? `?${query}` : window.location.pathname;
      window.history.replaceState({
        type: 'hierarchy',
        hierarchy: selectedHierarchyRef.current
      }, '', url);
    }
  };

  const handleOpenAccessModal = () => {
    setAccessModalOpen(true);
    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      modal: 'access'
    });
    window.history.pushState({
      type: 'modal',
      hierarchy: selectedHierarchyRef.current,
      modal: 'access'
    }, '', `?${query}`);
  };

  const handleCloseAccessModal = () => {
    if (window.history.state?.type === 'modal' && window.history.state?.modal === 'access') {
      window.history.back();
    } else {
      setAccessModalOpen(false);
      const query = buildSearchParams({ hierarchy: selectedHierarchyRef.current });
      window.history.replaceState({
        type: 'hierarchy',
        hierarchy: selectedHierarchyRef.current
      }, '', query ? `?${query}` : window.location.pathname);
    }
  };

  const handleOpenAddModal = () => {
    if (userRole !== 'admin') {
      handleOpenAccessModal();
      return;
    }
    setEditingSchool(null);
    setAddEditModalOpen(true);

    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      modal: 'add_school'
    });
    window.history.pushState({
      type: 'modal',
      hierarchy: selectedHierarchyRef.current,
      modal: 'add_school'
    }, '', `?${query}`);
  };

  const handleOpenEditModal = (school) => {
    if (userRole !== 'admin') {
      handleOpenAccessModal();
      return;
    }
    setSelectedSchool(null);
    setEditingSchool(school);
    setAddEditModalOpen(true);

    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      modal: 'edit_school',
      editId: school.id
    });
    window.history.pushState({
      type: 'modal',
      hierarchy: selectedHierarchyRef.current,
      modal: 'edit_school',
      editId: school.id
    }, '', `?${query}`);
  };

  const handleCloseAddEditModal = () => {
    if (window.history.state?.type === 'modal' && (window.history.state?.modal === 'add_school' || window.history.state?.modal === 'edit_school')) {
      window.history.back();
    } else {
      setAddEditModalOpen(false);
      setEditingSchool(null);
      const query = buildSearchParams({ hierarchy: selectedHierarchyRef.current });
      window.history.replaceState({
        type: 'hierarchy',
        hierarchy: selectedHierarchyRef.current
      }, '', query ? `?${query}` : window.location.pathname);
    }
  };

  const handleOpenScraperModal = () => {
    setSkilaScraperModalOpen(true);
    const query = buildSearchParams({
      hierarchy: selectedHierarchyRef.current,
      modal: 'scraper'
    });
    window.history.pushState({
      type: 'modal',
      hierarchy: selectedHierarchyRef.current,
      modal: 'scraper'
    }, '', `?${query}`);
  };

  const handleCloseScraperModal = () => {
    if (window.history.state?.type === 'modal' && window.history.state?.modal === 'scraper') {
      window.history.back();
    } else {
      setSkilaScraperModalOpen(false);
      const query = buildSearchParams({ hierarchy: selectedHierarchyRef.current });
      window.history.replaceState({
        type: 'hierarchy',
        hierarchy: selectedHierarchyRef.current
      }, '', query ? `?${query}` : window.location.pathname);
    }
  };

  // Fetch notifications for Admin alert bell / Agent alerts
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
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, userRole, currentAgentName]);

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
      handleSelectSchool(targetSchool, 'notes');
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
    if (isAuthenticated) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [isAuthenticated, userRole, currentAgentName]);

  // Fetch hierarchy options when administrative selection changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchHierarchyOptions();
      fetchSchools();
    } else {
      setSchools([]);
      setLoading(false);
    }
  }, [isAuthenticated, selectedHierarchy, filters, userRole, currentAgentName]);

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
      if (filters.agent && filters.agent !== 'All') params.append('agent_name', filters.agent);

      const res = await fetchWithRole(`/api/schools?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSchools(data);

        // If there was a pending school ID from initial URL parse, resolve it now
        if (pendingSchoolIdRef.current) {
          const targetId = pendingSchoolIdRef.current;
          pendingSchoolIdRef.current = null;
          const found = data.find((s) => String(s.id) === String(targetId));
          if (found) {
            setSelectedSchool(found);
          } else {
            try {
              const sRes = await fetchWithRole(`/api/schools/${targetId}`);
              if (sRes.ok) {
                const sData = await sRes.json();
                setSelectedSchool(sData);
              }
            } catch (err) {}
          }
        }

        if (pendingEditIdRef.current) {
          const editId = pendingEditIdRef.current;
          pendingEditIdRef.current = null;
          const found = data.find((s) => String(s.id) === String(editId));
          if (found) {
            setEditingSchool(found);
            setAddEditModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedSchools = async () => {
    try {
      const res = await fetchWithRole('/api/schools/confirmed');
      if (res.ok) {
        const data = await res.json();
        setConfirmedData(data);
      }
    } catch (err) {
      console.error('Error fetching confirmed schools:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfirmedSchools();
    } else {
      setConfirmedData({ schools: [], metrics: {} });
    }
  }, [isAuthenticated, schools]);

  const handleOpenConfirmedModal = () => {
    fetchConfirmedSchools();
    setConfirmedSchoolsModalOpen(true);
  };

  const handleToggleConfirmedOnly = () => {
    setConfirmedOnly((prev) => !prev);
  };

  const handleOpenMOU = (school, form) => {
    setSelectedSchoolForDoc(school);
    setFormalitiesForDoc(form);
    setMouModalOpen(true);
  };

  const handleOpenCertificate = (school, form) => {
    setSelectedSchoolForDoc(school);
    setFormalitiesForDoc(form);
    setCertificateModalOpen(true);
  };

  const handleOpenRoster = (school, form) => {
    setSelectedSchoolForDoc(school);
    setFormalitiesForDoc(form);
    setRosterModalOpen(true);
  };

  const handleOpenSchoolFormalities = (school) => {
    setConfirmedSchoolsModalOpen(false);
    handleSelectSchool(school, 'formalities');
  };

  // Browser History and URL Query Synchronization (Backward / Forward Navigation)
  useEffect(() => {
    const parsed = parseSearchParams(window.location.search);

    // 1. Restore hierarchy if in URL
    if (parsed.state || parsed.district || parsed.revenue_division || parsed.mandal || parsed.local_body_name || parsed.village_locality_ward) {
      setSelectedHierarchy({
        state: parsed.state,
        district: parsed.district,
        revenue_division: parsed.revenue_division,
        mandal: parsed.mandal,
        local_body_name: parsed.local_body_name,
        village_locality_ward: parsed.village_locality_ward
      });
    }

    // 2. Restore School modal if in URL
    if (parsed.schoolId) {
      pendingSchoolIdRef.current = parsed.schoolId;
      if (parsed.tab) {
        setActiveModalTab(parsed.tab);
      }
    }

    // 3. Restore Modals if in URL
    if (parsed.modal === 'add_school') {
      setAddEditModalOpen(true);
      setEditingSchool(null);
    } else if (parsed.modal === 'edit_school' && parsed.editId) {
      pendingEditIdRef.current = parsed.editId;
    } else if (parsed.modal === 'access') {
      setAccessModalOpen(true);
    } else if (parsed.modal === 'scraper') {
      setSkilaScraperModalOpen(true);
    }

    // 4. Baseline history state for accurate popstate transitions
    const currentQuery = window.location.search;
    window.history.replaceState({
      type: parsed.schoolId ? 'school' : parsed.modal ? 'modal' : 'hierarchy',
      hierarchy: {
        state: parsed.state,
        district: parsed.district,
        revenue_division: parsed.revenue_division,
        mandal: parsed.mandal,
        local_body_name: parsed.local_body_name,
        village_locality_ward: parsed.village_locality_ward
      },
      schoolId: parsed.schoolId,
      tab: parsed.tab,
      modal: parsed.modal,
      editId: parsed.editId
    }, '', currentQuery || window.location.pathname);

    // 5. Popstate event listener for browser Back (←) and Forward (→) buttons
    const handlePopState = async () => {
      isPopStateRef.current = true;
      try {
        const urlParams = parseSearchParams(window.location.search);

        // Synchronize Hierarchy
        setSelectedHierarchy({
          state: urlParams.state,
          district: urlParams.district,
          revenue_division: urlParams.revenue_division,
          mandal: urlParams.mandal,
          local_body_name: urlParams.local_body_name,
          village_locality_ward: urlParams.village_locality_ward
        });

        // Synchronize School Detail Modal
        if (urlParams.schoolId) {
          setActiveModalTab(urlParams.tab || 'info');
          const currentSchool = selectedSchoolRef.current;
          if (!currentSchool || String(currentSchool.id) !== String(urlParams.schoolId)) {
            const found = schoolsRef.current.find((s) => String(s.id) === String(urlParams.schoolId));
            if (found) {
              setSelectedSchool(found);
            } else {
              try {
                const res = await fetchWithRole(`/api/schools/${urlParams.schoolId}`);
                if (res.ok) {
                  const s = await res.json();
                  setSelectedSchool(s);
                }
              } catch (e) {}
            }
          }
        } else {
          setSelectedSchool(null);
          setActiveModalTab('info');
        }

        // Synchronize Add/Edit Modal
        if (urlParams.modal === 'add_school') {
          setEditingSchool(null);
          setAddEditModalOpen(true);
        } else if (urlParams.modal === 'edit_school' && urlParams.editId) {
          const found = schoolsRef.current.find((s) => String(s.id) === String(urlParams.editId));
          if (found) {
            setEditingSchool(found);
            setAddEditModalOpen(true);
          } else {
            try {
              const res = await fetchWithRole(`/api/schools/${urlParams.editId}`);
              if (res.ok) {
                const s = await res.json();
                setEditingSchool(s);
                setAddEditModalOpen(true);
              }
            } catch (e) {}
          }
        } else {
          setAddEditModalOpen(false);
          setEditingSchool(null);
        }

        // Synchronize Access Modal
        if (urlParams.modal === 'access') {
          setAccessModalOpen(true);
        } else {
          setAccessModalOpen(false);
        }

        // Synchronize Scraper Modal
        if (urlParams.modal === 'scraper') {
          setSkilaScraperModalOpen(true);
        } else {
          setSkilaScraperModalOpen(false);
        }
      } finally {
        setTimeout(() => {
          isPopStateRef.current = false;
        }, 60);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSchoolSaved = (savedSchool) => {
    fetchSchools();
    fetchStats();
    handleSelectSchool(savedSchool, 'info');
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
      handleOpenAccessModal();
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
        handleSelectSchool(enriched, 'info');
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
    const next = {
      state: state,
      district: district,
      revenue_division: '',
      mandal: '',
      local_body_name: '',
      village_locality_ward: ''
    };
    setSelectedHierarchy(next);
    const query = buildSearchParams({ hierarchy: next });
    window.history.pushState({ type: 'hierarchy', hierarchy: next }, '', query ? `?${query}` : window.location.pathname);

    setFilters({
      search: '',
      tier: 'All',
      board: 'All',
      lead_status: 'All',
      skila_ai_potential: 'All',
      technology_adoption_level: 'All',
      agent: 'All'
    });
    if (returnedSchools && returnedSchools.length > 0) {
      setSchools(returnedSchools);
    } else {
      fetchSchools();
    }
    fetchHierarchyOptions();
    fetchStats();
  };

  const availableAgents = React.useMemo(() => {
    const set = new Set();
    if (currentAgentName && currentAgentName.trim() && currentAgentName.trim() !== 'Field Agent') {
      set.add(currentAgentName.trim());
    }
    schools.forEach((s) => {
      if (s.sales?.sales_owner && s.sales.sales_owner !== 'Unassigned') {
        set.add(s.sales.sales_owner.trim());
      }
      (s.agent_notes || []).forEach((n) => {
        if (n.agent_name && n.agent_name.trim()) {
          set.add(n.agent_name.trim());
        }
      });
    });
    notifications.forEach((n) => {
      if (n.agent_name && n.agent_name.trim()) {
        set.add(n.agent_name.trim());
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [schools, notifications, currentAgentName]);

  // Filter schools if "Confirmed Deals Only" toggle is active
  const displayedSchools = React.useMemo(() => {
    if (!confirmedOnly) return schools;
    return schools.filter(
      (s) => s.sales?.deal_closed || s.formalities?.is_deal_confirmed || (s.formalities?.overall_progress || 0) > 0
    );
  }, [schools, confirmedOnly]);

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
        currentAgentName={currentAgentName}
        onAgentNameChange={setCurrentAgentName}
        availableAgents={availableAgents}
        onOpenAccessModal={handleOpenAccessModal}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onOpenConfirmedModal={handleOpenConfirmedModal}
        confirmedCount={
          confirmedData?.metrics?.total_confirmed ??
          schools.filter((s) => s.sales?.deal_closed || s.formalities?.is_deal_confirmed).length
        }
        onOpenAgentPerformanceModal={() => setAgentPerformanceModalOpen(true)}
        onOpenFinancialModal={() => setFinancialModalOpen(true)}
        onOpenCallingHub={() => {
          const next = platformMode === 'calling' ? 'crm' : 'calling';
          setPlatformMode(next);
          localStorage.setItem('skila_platform_mode', next);
        }}
        platformMode={platformMode}
      />

      {/* Main Content Area */}
      <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
        
        {/* Pan-India Vision & Interactive Vector Map Hero - Visible only to guests */}
        {!isAuthenticated && (
          <IndiaMapHero
            onSelectState={handleSelectState}
            selectedState={selectedHierarchy.state}
            isAuthenticated={isAuthenticated}
            onRequireAuth={handleOpenLogin}
          />
        )}

        {/* Without sign in, except hero section, every functionality is invisible */}
        {isAuthenticated ? (
          platformMode === 'calling' ? (
            <CallingHub 
              onBackToCRM={() => {
                setPlatformMode('crm');
                localStorage.setItem('skila_platform_mode', 'crm');
              }}
            />
          ) : (
            <>
              {/* Quick AI Calling Banner */}
              <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-indigo-950/40 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <Phone className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      Skila AI Telugu Outbound Calling Platform
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Autonomous Telugu outbound calling with Ananya AI assistant. Qualifies Telangana schools & books in-person demos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPlatformMode('calling');
                    localStorage.setItem('skila_platform_mode', 'calling');
                  }}
                  className="self-start sm:self-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Launch Calling Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* KPI Summary Cards */}
              <StatsBar 
              stats={stats} 
              schools={schools} 
              onFilterConfirmedDeals={handleToggleConfirmedOnly}
              isConfirmedOnly={confirmedOnly}
            />

            {/* Unified Territory & Administrative Scope Navigator */}
            <TerritoryNavigator
              hierarchyData={hierarchyData}
              selectedHierarchy={selectedHierarchy}
              onHierarchyChange={handleHierarchyChange}
              onResetHierarchy={handleResetHierarchy}
              onDistrictRunComplete={handleDistrictRunComplete}
              totalMatchingSchools={schools.length}
              userRole={userRole}
            />

            {/* Search & Attribute Filters */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              availableAgents={availableAgents}
              userRole={userRole}
              currentAgentName={currentAgentName}
              confirmedOnly={confirmedOnly}
              onToggleConfirmedOnly={handleToggleConfirmedOnly}
            />

            {/* Schools Listing */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading school details...</p>
              </div>
            ) : displayedSchools.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-100 to-indigo-100 dark:from-slate-800 dark:to-indigo-950 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 mx-auto mb-3 shadow-xs">
                  <School className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {confirmedOnly ? 'No Confirmed Deals in Current Scope' : 'No Schools Loaded'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  {confirmedOnly
                    ? 'Toggle off "Confirmed Deals Only" or mark a school as Deal Closed in its profile to start formal onboarding.'
                    : 'Select a State and District above and click Discover Schools to load regional directory records.'}
                </p>
                {confirmedOnly ? (
                  <button
                    onClick={handleToggleConfirmedOnly}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 transition cursor-pointer"
                  >
                    Clear Confirmed Deals Filter
                  </button>
                ) : selectedHierarchy.district ? (
                  <button
                    onClick={() => {
                      handleResetHierarchy();
                      setFilters({ search: '', tier: 'All', board: 'All', lead_status: 'All', skila_ai_potential: 'All', technology_adoption_level: 'All' });
                    }}
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-transparent dark:border-indigo-800 transition cursor-pointer"
                  >
                    Clear District Selection
                  </button>
                ) : null}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedSchools.map((school, idx) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    index={idx}
                    onSelectSchool={(s) => handleSelectSchool(s, 'info')}
                    onRunSchoolDetails={handleRunSchoolDetails}
                    userRole={userRole}
                    currentAgentName={currentAgentName}
                  />
                ))}
              </div>
            ) : (
              <SchoolTable
                schools={displayedSchools}
                onSelectSchool={(s) => handleSelectSchool(s, 'info')}
                onRunSchoolDetails={handleRunSchoolDetails}
                userRole={userRole}
                currentAgentName={currentAgentName}
              />
            )}
          </>
        )) : (
          <AuthGateSection 
            onOpenLogin={handleOpenLogin} 
            onOpenRegister={handleOpenRegister} 
          />
        )}
      </main>

      {/* School Detail Modal */}
      {isAuthenticated && selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          initialTab={activeModalTab}
          onTabChange={handleModalTabChange}
          onClose={handleCloseSchoolModal}
          onUpdateSchool={(updated) => {
            setSelectedSchool(updated);
            fetchSchools();
            fetchStats();
            fetchNotifications();
            fetchConfirmedSchools();
          }}
          onOpenEditModal={handleOpenEditModal}
          userRole={userRole}
          currentAgentName={currentAgentName}
          onOpenMOU={(school, form) => handleOpenMOU(school, form)}
          onOpenCertificate={(school, form) => handleOpenCertificate(school, form)}
          onOpenRoster={(school, form) => handleOpenRoster(school, form)}
        />
      )}

      {/* Add / Edit School Modal - Admin Only */}
      {isAuthenticated && addEditModalOpen && userRole === 'admin' && (
        <AddEditSchoolModal
          initialData={editingSchool}
          onClose={handleCloseAddEditModal}
          onSaveSuccess={handleSchoolSaved}
        />
      )}

      {/* Skila AI Scraper Modal */}
      {isAuthenticated && skilaScraperModalOpen && (
        <SkilaScraperModal
          onClose={handleCloseScraperModal}
          onImportSuccess={() => {
            fetchSchools();
            fetchStats();
            fetchHierarchyOptions();
            fetchConfirmedSchools();
          }}
        />
      )}

      {/* Role-Based Access Control Matrix Modal */}
      {isAuthenticated && (
        <AccessControlModal
          isOpen={accessModalOpen}
          onClose={handleCloseAccessModal}
          currentRole={userRole}
          onSelectRole={setUserRole}
        />
      )}

      {/* Authentication & User Management Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        initialMode={loginModalMode}
      />

      {/* Confirmed Schools & Formalities Hub Modal */}
      {isAuthenticated && confirmedSchoolsModalOpen && (
        <ConfirmedSchoolsModal
          confirmedSchools={confirmedData?.schools || []}
          metrics={confirmedData?.metrics || {}}
          onClose={() => setConfirmedSchoolsModalOpen(false)}
          onOpenSchoolFormalities={handleOpenSchoolFormalities}
          onOpenMOU={handleOpenMOU}
          onOpenCertificate={handleOpenCertificate}
          onOpenRoster={handleOpenRoster}
        />
      )}

      {/* Agent Performance Dashboard & Field Team Leaderboard Modal - Admin Only */}
      {isAuthenticated && userRole === 'admin' && agentPerformanceModalOpen && (
        <AgentPerformanceModal
          isOpen={agentPerformanceModalOpen}
          onClose={() => setAgentPerformanceModalOpen(false)}
          onSelectSchool={(school) => handleSelectSchool(school, 'info')}
          userRole={userRole}
        />
      )}

      {/* Financial Analytics & P&L Statement Modal */}
      {isAuthenticated && financialModalOpen && (
        <FinancialAnalyticsModal
          isOpen={financialModalOpen}
          onClose={() => setFinancialModalOpen(false)}
          onSelectSchool={(school) => handleSelectSchool(school, 'info')}
        />
      )}

      {/* Memorandum of Understanding (MOU) Printable Document Modal */}
      {isAuthenticated && mouModalOpen && selectedSchoolForDoc && (
        <MOUPreviewModal
          school={selectedSchoolForDoc}
          formalities={formalitiesForDoc}
          onClose={() => {
            setMouModalOpen(false);
            setSelectedSchoolForDoc(null);
            setFormalitiesForDoc(null);
          }}
          onSaveFormalities={(updatedForm) => {
            setFormalitiesForDoc((prev) => ({ ...(prev || {}), ...updatedForm }));
            fetchSchools();
            fetchConfirmedSchools();
            if (selectedSchool && selectedSchool.id === selectedSchoolForDoc.id) {
              setSelectedSchool((prev) => ({
                ...prev,
                formalities: { ...(prev.formalities || {}), ...updatedForm }
              }));
            }
          }}
        />
      )}

      {/* Official Partnership Certificate Printable Document Modal */}
      {isAuthenticated && certificateModalOpen && selectedSchoolForDoc && (
        <PartnershipCertificateModal
          school={selectedSchoolForDoc}
          formalities={formalitiesForDoc}
          onClose={() => {
            setCertificateModalOpen(false);
            setSelectedSchoolForDoc(null);
            setFormalitiesForDoc(null);
          }}
        />
      )}

      {/* Bulk Student Roster Importer & Parent Welcome Kit Modal */}
      {isAuthenticated && rosterModalOpen && selectedSchoolForDoc && (
        <StudentRosterModal
          school={selectedSchoolForDoc}
          formalities={formalitiesForDoc}
          onClose={() => {
            setRosterModalOpen(false);
            setSelectedSchoolForDoc(null);
            setFormalitiesForDoc(null);
          }}
          onFormalitiesUpdated={() => {
            fetchSchools();
            fetchConfirmedSchools();
            fetchStats();
            fetchNotifications();
            if (selectedSchool && selectedSchool.id === selectedSchoolForDoc.id) {
              fetchWithRole(`/api/schools/${selectedSchool.id}/formalities`)
                .then(r => r.json())
                .then(f => {
                  setSelectedSchool(prev => ({ ...prev, formalities: f }));
                })
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SkilaApp />
    </AuthProvider>
  );
}
