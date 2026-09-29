import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Trophy, Award, Crown, TrendingUp, Users, Target, FileCheck, CheckCircle2, 
  ExternalLink, Search, RefreshCw, Download, ChevronRight, User, Building2, MapPin, 
  Phone, Mail, ArrowUpRight, Flame, Sparkles, Filter, ChevronDown, Check, ShieldCheck, UserPlus
} from 'lucide-react';

export default function AgentPerformanceModal({ 
  isOpen, 
  onClose, 
  onSelectSchool,
  userRole = 'admin' 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState('All');
  const [selectedAgentForDrilldown, setSelectedAgentForDrilldown] = useState(null);
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'unassigned'
  const [assigningSchoolId, setAssigningSchoolId] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState('');

  // Fetch performance metrics from API
  const fetchPerformance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents/performance', {
        headers: {
          'X-User-Role': userRole
        }
      });

      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        // If an agent was already selected in drill-down, sync them
        if (selectedAgentForDrilldown) {
          const updated = payload.leaderboard?.find(
            (a) => a.id === selectedAgentForDrilldown.id || a.name.toLowerCase() === selectedAgentForDrilldown.name.toLowerCase()
          );
          if (updated) setSelectedAgentForDrilldown(updated);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || 'Failed to load agent performance metrics.');
      }
    } catch (err) {
      console.error('Error fetching agent performance:', err);
      setError('Network error while connecting to agent analytics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPerformance();
      setAssignSuccess('');
    }
  }, [isOpen]);

  // Handle assigning a school to an agent
  const handleAssignSchool = async (schoolId, agentName) => {
    if (!agentName) return;
    setAssigningSchoolId(schoolId);
    try {
      const res = await fetch('/api/agents/assign-school', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify({
          school_id: schoolId,
          agent_name: agentName
        })
      });

      if (res.ok) {
        setAssignSuccess(`School assigned to ${agentName} successfully!`);
        fetchPerformance();
        setTimeout(() => setAssignSuccess(''), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to assign school.');
      }
    } catch (err) {
      console.error('Assign school error:', err);
      alert('Network error while assigning school.');
    } finally {
      setAssigningSchoolId(null);
    }
  };

  // Export Leaderboard to CSV
  const handleExportCSV = () => {
    if (!data?.leaderboard || data.leaderboard.length === 0) return;

    const headers = [
      'Rank', 'Agent Name', 'Email', 'Badge', 'Score', 
      'Assigned Schools', 'Schools Contacted', 'Demos Completed', 
      'Proposals Shared', 'Deals Closed', 'MOUs Signed', 'Conversion Rate %'
    ];

    const rows = data.leaderboard.map(a => [
      a.rank,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.badge}"`,
      a.score,
      a.assigned_count,
      a.contacted_count,
      a.demos_done_count,
      a.proposals_shared_count,
      a.deals_closed_count,
      a.mou_signed_count,
      `${a.conversion_rate}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Skila_AI_Agent_Leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered leaderboard
  const filteredLeaderboard = useMemo(() => {
    if (!data?.leaderboard) return [];
    return data.leaderboard.filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.badge.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedTierFilter === 'Top Closers') return agent.deals_closed_count > 0;
      if (selectedTierFilter === 'Active Demos') return agent.demos_done_count > 0;
      if (selectedTierFilter === 'Pending Outreach') return agent.assigned_count > 0 && agent.contacted_count < agent.assigned_count;

      return true;
    });
  }, [data, searchQuery, selectedTierFilter]);

  if (!isOpen) return null;

  const metrics = data?.metrics || {};
  const top3 = (data?.leaderboard || []).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 shrink-0 border-b border-indigo-900/40 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold flex items-center gap-1.5 shadow-2xs">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Operations & Intelligence</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> Admin Only
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {metrics.total_agents || 0} Field Agents Active
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Agent Performance & Field Leaderboard</span>
              <Sparkles className="w-5 h-5 text-amber-400 hidden sm:inline" />
            </h2>
            <p className="text-xs text-slate-300/80 mt-1 max-w-2xl leading-relaxed">
              Real-time pipeline analytics tracking schools contacted, campus demos conducted, deals closed, and MOUs executed across all regional sales partners.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={loading || !data?.leaderboard?.length}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
              title="Export leaderboard as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchPerformance}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              title="Refresh performance analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-3">
              <span>⚠️ {error}</span>
            </div>
          )}

          {assignSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{assignSuccess}</span>
            </div>
          )}

          {/* TEAM EXECUTIVE KPI SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Top Performer Card */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-2 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-800/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" /> Team MVP
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  {metrics.top_performer_score || 0} pts
                </span>
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white truncate">
                {metrics.top_performer_name || 'Field Agent'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Leader of the sales leaderboard
              </div>
            </div>

            {/* Total Demos Completed */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                🎯 Campus Demos
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {metrics.team_demos_completed || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Demonstrations held
              </div>
            </div>

            {/* Deals Closed Won */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                🏆 Deals Won
              </span>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.team_deals_closed || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Confirmed partners
              </div>
            </div>

            {/* MOUs Executed */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block mb-1">
                📜 MOUs Signed
              </span>
              <div className="text-xl font-black text-violet-600 dark:text-violet-400">
                {metrics.team_mous_signed || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Legally executed
              </div>
            </div>

            {/* Team Conversion Rate */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-1">
                📈 Win Rate
              </span>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {metrics.team_conversion_rate || 0}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Lead-to-deal ratio
              </div>
            </div>
          </div>

          {/* VISUAL TOP 3 PODIUM */}
          {top3.length > 0 && (
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-950 border border-indigo-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Leaderboard Winners Podium
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Updated Live from CRM Telemetry
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2 max-w-4xl mx-auto">
                {/* 2nd Place (Silver) */}
                {top3[1] ? (
                  <div 
                    onClick={() => setSelectedAgentForDrilldown(top3[1])}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-center shadow-xs hover:border-slate-400 dark:hover:border-slate-500 transition cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-500 flex items-center justify-center text-xl font-black mb-2 shadow-2xs">
                      🥈
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      2nd Place
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                      {top3[1].name}
                    </h4>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                      {top3[1].badge}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-1 text-[11px]">
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{top3[1].score}</div>
                        <div className="text-[9px] text-slate-400">Score</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400">{top3[1].deals_closed_count}</div>
                        <div className="text-[9px] text-slate-400">Deals</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400">{top3[1].mou_signed_count}</div>
                        <div className="text-[9px] text-slate-400">MOU</div>
                      </div>
                    </div>
                  </div>
                ) : <div className="hidden md:block" />}

                {/* 1st Place (Gold / Champion) */}
                {top3[0] && (
                  <div 
                    onClick={() => setSelectedAgentForDrilldown(top3[0])}
                    className="p-5 rounded-2xl bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-800 border-2 border-amber-300 dark:border-amber-600 text-center shadow-lg hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer transform hover:-translate-y-1.5 relative"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <Crown className="w-3 h-3" /> MVP Champion
                    </div>

                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-200 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-3 border-amber-400 dark:border-amber-500 flex items-center justify-center text-2xl font-black mb-2 shadow-md">
                      🥇
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
                      1st Place
                    </span>
                    <h4 className="text-base font-black text-slate-900 dark:text-white truncate mt-0.5">
                      {top3[0].name}
                    </h4>
                    <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-bold border border-amber-300 dark:border-amber-700">
                      {top3[0].badge}
                    </div>

                    <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-800/80 grid grid-cols-3 gap-1 text-[11px]">
                      <div>
                        <div className="font-black text-amber-700 dark:text-amber-300 text-xs">{top3[0].score}</div>
                        <div className="text-[9px] text-slate-400">Score</div>
                      </div>
                      <div>
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{top3[0].deals_closed_count}</div>
                        <div className="text-[9px] text-slate-400">Deals</div>
                      </div>
                      <div>
                        <div className="font-black text-indigo-600 dark:text-indigo-400 text-xs">{top3[0].mou_signed_count}</div>
                        <div className="text-[9px] text-slate-400">MOU</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place (Bronze) */}
                {top3[2] ? (
                  <div 
                    onClick={() => setSelectedAgentForDrilldown(top3[2])}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-center shadow-xs hover:border-slate-400 dark:hover:border-slate-500 transition cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-100/60 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-700 flex items-center justify-center text-xl font-black mb-2 shadow-2xs">
                      🥉
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800/80 dark:text-amber-400">
                      3rd Place
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                      {top3[2].name}
                    </h4>
                    <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold">
                      {top3[2].badge}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-1 text-[11px]">
                      <div>
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{top3[2].score}</div>
                        <div className="text-[9px] text-slate-400">Score</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400">{top3[2].deals_closed_count}</div>
                        <div className="text-[9px] text-slate-400">Deals</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400">{top3[2].mou_signed_count}</div>
                        <div className="text-[9px] text-slate-400">MOU</div>
                      </div>
                    </div>
                  </div>
                ) : <div className="hidden md:block" />}
              </div>
            </div>
          )}

          {/* TAB CONTROLS: LEADERBOARD VS UNASSIGNED SCHOOLS POOL */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Full Agent Leaderboard ({data?.leaderboard?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('unassigned')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'unassigned'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Unallocated Schools ({data?.unassigned_schools?.length || 0})</span>
              </button>
            </div>

            {/* Filter pills for leaderboard */}
            {activeTab === 'leaderboard' && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 w-40 sm:w-52"
                  />
                </div>

                <select
                  value={selectedTierFilter}
                  onChange={(e) => setSelectedTierFilter(e.target.value)}
                  className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  <option value="All">All Tiers</option>
                  <option value="Top Closers">Deals Closed (&gt; 0)</option>
                  <option value="Active Demos">Demos Active (&gt; 0)</option>
                  <option value="Pending Outreach">Pending Outreach</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: FULL AGENT LEADERBOARD TABLE */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs bg-white dark:bg-slate-900">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="py-3 px-3 w-14 text-center">Rank</th>
                      <th className="py-3 px-4">Sales Agent & Region</th>
                      <th className="py-3 px-3">Performance Tier</th>
                      <th className="py-3 px-3 text-center">Assigned</th>
                      <th className="py-3 px-3 text-center">Contacted</th>
                      <th className="py-3 px-3 text-center">Demos</th>
                      <th className="py-3 px-3 text-center">Closed Won</th>
                      <th className="py-3 px-3 text-center">MOU Signed</th>
                      <th className="py-3 px-3 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center bg-indigo-50/50 dark:bg-indigo-950/30">Total Score</th>
                      <th className="py-3 px-3 text-right">Pipeline</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan="11" className="py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                          <span>Computing agent pipeline telemetry...</span>
                        </td>
                      </tr>
                    ) : filteredLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="py-12 text-center text-slate-500">
                          No sales agents matched the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaderboard.map((agent) => {
                        const isSelected = selectedAgentForDrilldown?.id === agent.id;
                        const contactPct = agent.assigned_count > 0 ? Math.round((agent.contacted_count / agent.assigned_count) * 100) : 0;

                        return (
                          <tr 
                            key={agent.id}
                            onClick={() => setSelectedAgentForDrilldown(agent)}
                            className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                              isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-l-4 border-indigo-600' : ''
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3.5 px-3 text-center font-black text-sm">
                              <span>{agent.medal}</span>
                            </td>

                            {/* Agent Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                                  {agent.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                    {agent.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                    {agent.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Tier Badge */}
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {agent.badge}
                              </span>
                            </td>

                            {/* Assigned Schools */}
                            <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {agent.assigned_count}
                            </td>

                            {/* Contacted */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {agent.contacted_count}
                              </div>
                              <div className="w-14 mx-auto bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full" 
                                  style={{ width: `${Math.min(100, contactPct)}%` }}
                                />
                              </div>
                            </td>

                            {/* Demos */}
                            <td className="py-3.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                              {agent.demos_done_count}
                            </td>

                            {/* Deals Closed */}
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                                agent.deals_closed_count > 0 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                                  : 'text-slate-400'
                              }`}>
                                {agent.deals_closed_count}
                              </span>
                            </td>

                            {/* MOUs Signed */}
                            <td className="py-3.5 px-3 text-center font-bold text-violet-600 dark:text-violet-400">
                              {agent.mou_signed_count}
                            </td>

                            {/* Win Rate */}
                            <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                              {agent.conversion_rate}%
                            </td>

                            {/* Score */}
                            <td className="py-3.5 px-4 text-center bg-indigo-50/40 dark:bg-indigo-950/20 font-black text-indigo-700 dark:text-indigo-300 text-sm">
                              <span className="flex items-center justify-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-amber-500" />
                                {agent.score}
                              </span>
                            </td>

                            {/* Pipeline Action */}
                            <td className="py-3.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAgentForDrilldown(agent);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Pipeline</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* AGENT PIPELINE DRILL-DOWN PANEL */}
              {selectedAgentForDrilldown && (
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-900 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {selectedAgentForDrilldown.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {selectedAgentForDrilldown.name}'s Assigned Pipeline
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                            {selectedAgentForDrilldown.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedAgentForDrilldown.assigned_count} institutions in active sales pipeline • {selectedAgentForDrilldown.deals_closed_count} deals closed
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAgentForDrilldown(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                    >
                      Close Pipeline
                    </button>
                  </div>

                  {/* School List inside Agent's Pipeline */}
                  {selectedAgentForDrilldown.assigned_schools?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No institutions currently assigned to this representative.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedAgentForDrilldown.assigned_schools.map((school) => (
                        <div
                          key={school.id}
                          className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                school.deal_closed 
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}>
                                {school.deal_closed ? '🏆 Closed Won' : school.lead_status || 'New'}
                              </span>

                              {school.mou_status && (
                                <span className="text-[10px] font-mono text-violet-600 dark:text-violet-400 font-bold">
                                  MOU: {school.mou_status}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                              {school.school_name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">{school.location || 'India'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Board: {school.board} • Students: {Number(school.student_strength || 0).toLocaleString()}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                            <button
                              onClick={() => {
                                if (onSelectSchool) onSelectSchool(school);
                                onClose();
                              }}
                              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open 49-Field Profile</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UNASSIGNED SCHOOLS ALLOCATION POOL */}
          {activeTab === 'unassigned' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">Unallocated Institutional Directory Pool</div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    These institutions do not have an assigned sales representative. Select an agent to allocate schools directly from this administrative hub.
                  </p>
                </div>
              </div>

              {data?.unassigned_schools?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  All loaded institutions are currently allocated to sales owners!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.unassigned_schools.map((school) => (
                    <div 
                      key={school.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>UDISE: {school.udise_code || 'N/A'}</span>
                          <span className="font-bold text-amber-600">Unassigned</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                          {school.school_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{school.location || 'India'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Board: {school.board} • Students: {Number(school.student_strength || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* Allocation Dropdown */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignSchool(school.id, e.target.value);
                            }
                          }}
                          disabled={assigningSchoolId === school.id}
                          className="flex-1 text-[11px] p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                        >
                          <option value="" disabled>Assign to agent...</option>
                          {data?.leaderboard?.map((a) => (
                            <option key={a.id} value={a.name}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Administrator Confidential Intelligence • Role-Based Protected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={loading || !data?.leaderboard?.length}
              className="sm:hidden px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Export CSV
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Close Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
