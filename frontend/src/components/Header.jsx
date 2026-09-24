import React, { useState, useRef, useEffect } from 'react';
import { 
  School, FileSpreadsheet, Plus, Sun, Moon, 
  ShieldCheck, ChevronDown, Check, Lock, UserCheck, Crown, Briefcase, Bell, Clock 
} from 'lucide-react';

export default function Header({ 
  statusInfo, 
  onOpenAddModal, 
  onExportExcel, 
  onExportCsv, 
  theme, 
  onToggleTheme,
  userRole = 'admin',
  onRoleChange,
  onOpenAccessModal,
  notifications = [],
  onNotificationClick,
  onMarkAllNotificationsRead
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const handleExport = onExportExcel || onExportCsv;

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Skila</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
                  Partnership Platform
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">School Intelligence & EdTech Partnership Portal</p>
            </div>
          </div>

          {/* Right Header Navigation & Access Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Role-Based Access Control Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-xs ${
                  userRole === 'admin'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
                title="Click to switch access role or view permissions matrix"
              >
                {userRole === 'admin' ? (
                  <>
                    <span>👑</span>
                    <span>Admin Level</span>
                  </>
                ) : (
                  <>
                    <span>💼</span>
                    <span>Agent Level</span>
                  </>
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Role Dropdown Menu */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Switch Active Role
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Toggle operational permissions
                    </div>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Admin Option */}
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
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Full AI Scraper & Database Control</div>
                        </div>
                      </div>
                      {userRole === 'admin' && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </button>

                    {/* Agent Option */}
                    <button
                      onClick={() => handleSelectRole('agent')}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer ${
                        userRole === 'agent'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">💼</span>
                        <div>
                          <div className="text-xs font-bold">Agent Level</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Field CRM & Lead Operations</div>
                        </div>
                      </div>
                      {userRole === 'agent' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  </div>

                  <div className="pt-1.5 px-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        if (onOpenAccessModal) onOpenAccessModal();
                      }}
                      className="w-full text-center py-2 px-3 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>View Permissions Matrix</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Notifications Bell */}
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Agent Field Alerts</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Real-time institutional field updates
                      </div>
                    </div>

                    {unreadCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        onClick={() => {
                          onMarkAllNotificationsRead();
                        }}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <Bell className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-60" />
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">No alerts yet</div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          When field agents log notes or updates, alerts will show here.
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
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
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                {n.category || 'Field Note'}
                              </span>
                              {n.urgency === 'Urgent Action Required' && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
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

          </div>
        </div>
      </div>
    </header>
  );
}
