import React, { useState, useRef, useEffect } from 'react';
import { 
  School, FileSpreadsheet, Plus, Sun, Moon, 
  ShieldCheck, ChevronDown, Check, Lock, UserCheck, Crown, Briefcase, Bell, Clock,
  LogOut, LogIn, UserPlus, User, Trophy, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  statusInfo, 
  onOpenAddModal, 
  onExportExcel, 
  onExportCsv, 
  theme, 
  onToggleTheme,
  userRole = 'admin',
  onRoleChange,
  currentAgentName = 'Field Agent',
  onAgentNameChange,
  availableAgents = [],
  onOpenAccessModal,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsRead,
  onOpenConfirmedModal,
  confirmedCount = 0
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alertsViewMode, setAlertsViewMode] = useState('stream'); // 'stream' | 'buckets'
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('All');
  const [selectedAlertUrgency, setSelectedAlertUrgency] = useState('all'); // 'all' | 'unread' | 'urgent'
  const [expandedAgentBuckets, setExpandedAgentBuckets] = useState({});

  const { user, isAuthenticated, isAdmin, logout, setLoginModalOpen } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role && user.role !== userRole && onRoleChange) {
        onRoleChange(user.role);
      }
      if (user.role === 'agent' && user.full_name && onAgentNameChange) {
        onAgentNameChange(user.full_name);
      }
    }
  }, [user]);

  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const handleExport = onExportExcel || onExportCsv;

  // STRICT AGENT ISOLATION: Agents strictly receive ONLY their own alerts!
  const scopedNotifications = React.useMemo(() => {
    if (userRole === 'agent') {
      const active = (currentAgentName || '').trim().toLowerCase();
      return notifications.filter((n) => (n.agent_name || '').trim().toLowerCase() === active);
    }
    return notifications;
  }, [notifications, userRole, currentAgentName]);

  const unreadCount = scopedNotifications.filter(n => !n.is_read).length;

  // Extract unique agents from scoped alerts list
  const uniqueAlertAgents = React.useMemo(() => {
    const set = new Set();
    scopedNotifications.forEach((n) => {
      if (n.agent_name && n.agent_name.trim()) {
        set.add(n.agent_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [scopedNotifications]);

  // Filter alerts based on active agent and urgency criteria
  const filteredNotifications = React.useMemo(() => {
    return scopedNotifications.filter((n) => {
      if (userRole === 'admin' && selectedAgentFilter !== 'All') {
        if ((n.agent_name || '').toLowerCase() !== selectedAgentFilter.toLowerCase()) {
          return false;
        }
      }
      if (selectedAlertUrgency === 'unread' && n.is_read) {
        return false;
      }
      if (selectedAlertUrgency === 'urgent' && n.urgency !== 'Urgent Action Required') {
        return false;
      }
      return true;
    });
  }, [scopedNotifications, userRole, selectedAgentFilter, selectedAlertUrgency]);

  // Group filtered alerts into buckets by Agent
  const agentBucketsList = React.useMemo(() => {
    const bucketsMap = {};
    filteredNotifications.forEach((n) => {
      const agent = n.agent_name || 'Field Agent';
      if (!bucketsMap[agent]) {
        bucketsMap[agent] = {
          agent,
          items: [],
          unreadCount: 0,
          uniqueSchools: new Set()
        };
      }
      bucketsMap[agent].items.push(n);
      if (!n.is_read) {
        bucketsMap[agent].unreadCount += 1;
      }
      if (n.school_id || n.school_name) {
        bucketsMap[agent].uniqueSchools.add(n.school_id || n.school_name);
      }
    });

    return Object.values(bucketsMap).map((b) => ({
      agent: b.agent,
      items: b.items,
      unreadCount: b.unreadCount,
      uniqueSchoolsCount: b.uniqueSchools.size
    })).sort((a, b) => b.items.length - a.items.length);
  }, [filteredNotifications]);

  const toggleAgentBucket = (agent) => {
    setExpandedAgentBuckets((prev) => ({
      ...prev,
      [agent]: prev[agent] === false ? true : false
    }));
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role) => {
    if (onRoleChange) {
      onRoleChange(role);
    }
    setRoleDropdownOpen(false);
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & Platform Brand */}
          <div className="flex items-center gap-3 select-none">
            <div className="flex items-center gap-2.5">
              {/* Light Mode Logo */}
              <img
                src="/skila_logo_transparent.png"
                alt="Skila.ai powered by Tech Nirmaan"
                className="h-10 w-auto object-contain dark:hidden"
              />
              {/* Dark Mode Logo */}
              <img
                src="/skila_logo_dark.png"
                alt="Skila.ai powered by Tech Nirmaan"
                className="h-10 w-auto object-contain hidden dark:block"
              />
              <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                Partnership Platform
              </span>
            </div>
          </div>

          {/* Right Header Navigation & Access Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Authenticated User Profile & Role Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated ? (
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
                    userRole === 'admin'
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                  title="Click to view profile, switch persona, or manage authentication"
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                    userRole === 'admin' ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}>
                    {(user?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="font-extrabold text-[11px] truncate max-w-[120px]">
                      {user?.full_name || currentAgentName}
                    </span>
                    <span className="text-[9px] font-bold opacity-80">
                      {userRole === 'admin' ? '👑 Admin' : '💼 Agent'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Profile & Role Dropdown Menu */}
              {roleDropdownOpen && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Header */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                        userRole === 'admin' ? 'bg-purple-600' : 'bg-emerald-600'
                      }`}>
                        {(user?.full_name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {user?.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-1.5">
                    {/* Admin Switcher */}
                    <button
                      onClick={() => handleSelectRole('admin')}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        userRole === 'admin'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">👑</span>
                        <div>
                          <div className="text-xs font-bold">Admin Level</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Full 360° AI Scraper & Multi-Agent Control</div>
                        </div>
                      </div>
                      {userRole === 'admin' && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </button>

                    {/* Agent Switcher */}
                    <div
                      className={`p-2.5 rounded-xl transition ${
                        userRole === 'agent'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div 
                        onClick={() => handleSelectRole('agent')}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">💼</span>
                          <div>
                            <div className="text-xs font-bold">Agent Level</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">Strictly Scoped CRM & Private Field Notes</div>
                          </div>
                        </div>
                        {userRole === 'agent' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>

                      {/* Dynamic Agent Identity Manager */}
                      {userRole === 'agent' && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center justify-between">
                            <span>Active Agent Persona:</span>
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                              Private Scope
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mb-2">
                            <input
                              type="text"
                              value={currentAgentName}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                if (onAgentNameChange) onAgentNameChange(e.target.value);
                              }}
                              placeholder="Enter agent name..."
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                            />
                          </div>

                          {availableAgents.filter((a) => a !== currentAgentName).length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {availableAgents.filter((a) => a !== currentAgentName).map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAgentNameChange) onAgentNameChange(name);
                                  }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions / Admin & Auth Operations */}
                  <div className="pt-1.5 px-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          setLoginModalOpen(true);
                        }}
                        className="w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 flex items-center gap-2 transition cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Register New Team Member</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        if (onOpenAccessModal) onOpenAccessModal();
                      }}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-2 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Permissions Matrix</span>
                    </button>

                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Switch User / Sign In</span>
                    </button>

                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left py-1.5 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notifications Bell - Only visible when signed in */}
            {isAuthenticated && (
              <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative inline-flex items-center justify-center p-2 rounded-lg border text-xs font-medium transition cursor-pointer shadow-xs ${
                  unreadCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={unreadCount > 0 ? `${unreadCount} unread agent updates` : 'Agent update notifications'}
              >
                <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-88 sm:w-[460px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Popover Header */}
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{userRole === 'agent' ? `${currentAgentName}'s Field Alerts` : 'Agent Field Alerts'}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                          {scopedNotifications.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {userRole === 'agent'
                          ? 'Your private institutional updates & bucket activity'
                          : 'Real-time multi-agent field updates & bucket logs'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && onMarkAllNotificationsRead && (
                        <button
                          onClick={() => onMarkAllNotificationsRead()}
                          className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub Header: View Mode Switcher & Filters */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    {/* View Switcher: Stream vs Agent Buckets */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setAlertsViewMode('stream')}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                            alertsViewMode === 'stream'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Timeline Stream</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlertsViewMode('buckets')}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                            alertsViewMode === 'buckets'
                              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Briefcase className="w-3 h-3" />
                          <span>Agent Buckets</span>
                        </button>
                      </div>

                      {/* Urgency quick pills */}
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedAlertUrgency('all')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            selectedAlertUrgency === 'all'
                              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAlertUrgency('unread')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            selectedAlertUrgency === 'unread'
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Unread ({unreadCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAlertUrgency('urgent')}
                          className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                            selectedAlertUrgency === 'urgent'
                              ? 'bg-rose-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          Urgent ({scopedNotifications.filter(n => n.urgency === 'Urgent Action Required').length})
                        </button>
                      </div>
                    </div>

                    {/* Agent Isolation Indicator or Filter */}
                    {userRole === 'agent' ? (
                      <div className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Private Stream: strictly scoped to notes & alerts for <strong>{currentAgentName}</strong></span>
                      </div>
                    ) : (
                      /* Agent Name Filter Selector for Admin */
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-indigo-500" />
                          Agent Filter:
                        </span>
                        <select
                          value={selectedAgentFilter}
                          onChange={(e) => setSelectedAgentFilter(e.target.value)}
                          className="text-[11px] font-medium py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full cursor-pointer shadow-2xs"
                        >
                          <option value="All">All Reporting Agents ({scopedNotifications.length})</option>
                          {uniqueAlertAgents.map((ag) => {
                            const count = scopedNotifications.filter(n => n.agent_name === ag).length;
                            return (
                              <option key={ag} value={ag}>
                                💼 Agent: {ag} ({count} {count === 1 ? 'update' : 'updates'})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* List / Bucket Content Area */}
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <Bell className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No updates found
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {selectedAgentFilter !== 'All' 
                            ? `No alerts found for agent "${selectedAgentFilter}" under active filters.`
                            : 'When field agents log notes or updates, alerts will show here.'}
                        </p>
                        {selectedAgentFilter !== 'All' && (
                          <button
                            type="button"
                            onClick={() => setSelectedAgentFilter('All')}
                            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Reset Agent Filter
                          </button>
                        )}
                      </div>
                    ) : alertsViewMode === 'buckets' ? (
                      /* AGENT BUCKETS VIEW */
                      <div className="p-2.5 space-y-3">
                        {agentBucketsList.map((bucket) => {
                          const isExpanded = expandedAgentBuckets[bucket.agent] !== false;
                          return (
                            <div
                              key={bucket.agent}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
                            >
                              {/* Bucket Header */}
                              <div
                                onClick={() => toggleAgentBucket(bucket.agent)}
                                className="px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                                    💼
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                      <span>{bucket.agent}</span>
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                        Bucket: {bucket.items.length} {bucket.items.length === 1 ? 'note' : 'notes'}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {bucket.uniqueSchoolsCount} {bucket.uniqueSchoolsCount === 1 ? 'school' : 'schools'} visited / updated
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {bucket.unreadCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                                      {bucket.unreadCount} unread
                                    </span>
                                  )}
                                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              {/* Bucket Items */}
                              {isExpanded && (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                  {bucket.items.map((n) => {
                                    const isUnread = !n.is_read;
                                    return (
                                      <div
                                        key={n.id}
                                        onClick={() => {
                                          setNotificationsOpen(false);
                                          if (onNotificationClick) onNotificationClick(n);
                                        }}
                                        className={`p-3 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                                          isUnread ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                            {n.school_name || 'School Update'}
                                          </div>
                                          <span className="text-[10px] text-slate-400 shrink-0">
                                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                                            🗂️ {n.bucket || 'Campus Visits & Demos'}
                                          </span>
                                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                            {n.category || 'Field Note'}
                                          </span>
                                          {n.urgency === 'Urgent Action Required' && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                                              Urgent
                                            </span>
                                          )}
                                          {isUnread && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ml-auto" />
                                          )}
                                        </div>

                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                          {n.text_snippet || n.full_text}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* TIMELINE STREAM VIEW */
                      filteredNotifications.map((n) => {
                        const isUnread = !n.is_read;
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotificationsOpen(false);
                              if (onNotificationClick) onNotificationClick(n);
                            }}
                            className={`p-3.5 transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                              isUnread ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                {n.school_name || 'School Update'}
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                💼 {n.agent_name || 'Agent'}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                                🗂️ {n.bucket || 'Campus Visits & Demos'}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                {n.category || 'Field Note'}
                              </span>
                              {n.urgency === 'Urgent Action Required' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                                  Urgent
                                </span>
                              )}
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ml-auto" />
                              )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {n.text_snippet || n.full_text}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition cursor-pointer shadow-2xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="hidden md:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700 fill-slate-700" />
                  <span className="hidden md:inline">Dark</span>
                </>
              )}
            </button>

            {/* Authenticated-only Action Buttons */}
            {isAuthenticated && (
              <>
                {/* Confirmed Schools & Formalities Button */}
                <button
                  onClick={onOpenConfirmedModal}
                  title="View Confirmed Schools & Formalities Hub"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition shadow-2xs cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">Confirmed Schools</span>
                  {confirmedCount !== undefined && confirmedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold ml-0.5">
                      {confirmedCount}
                    </span>
                  )}
                </button>

                {/* Export Excel button */}
                <button
                  onClick={handleExport}
                  title="Download directory as Microsoft Excel (.xlsx)"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>

                {/* Add School button - Admin Only or locked for Agent */}
                {userRole === 'admin' ? (
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add School</span>
                  </button>
                ) : (
                  <button
                    disabled
                    title="Only Administrators can onboard new institutions"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Add School</span>
                  </button>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
