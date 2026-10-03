import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, PhoneForwarded, Users, CheckCircle, Flame, Calendar, 
  Clock, TrendingUp, Sparkles, AlertCircle, ArrowUpRight, Search, Play, Phone, Key, Radio, Volume2 
} from 'lucide-react';
import { fetchCallingDashboard, initiateAICall, fetchCallingSettings } from '../../utils/callingApi';

export default function CallingDashboard({
  onStartCall,
  onViewCallDetails,
  onNavigateTab
}) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    total_schools: 0,
    calls_made: 0,
    connected: 0,
    interested: 0,
    hot_leads: 0,
    demos: 0,
    followups: 0,
    conversions: 0,
    answer_rate: 0,
    hot_rate: 0
  });
  const [recentCalls, setRecentCalls] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [telephonyConfig, setTelephonyConfig] = useState({ has_plivo: false, status: 'Simulation Mode' });
  
  // Quick dialer state (dynamic, starts empty)
  const [quickSchoolName, setQuickSchoolName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickDistrict, setQuickDistrict] = useState('');
  const [quickPrincipal, setQuickPrincipal] = useState('');
  const [callingInProgress, setCallingInProgress] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashData, schoolsRes, settingsRes] = await Promise.all([
        fetchCallingDashboard().catch(() => ({ status: 'error' })),
        fetch('/api/schools').then(r => r.ok ? r.json() : []).catch(() => []),
        fetchCallingSettings().catch(() => ({ status: 'error' }))
      ]);

      if (dashData.status === 'success') {
        setMetrics(dashData.metrics || {});
        setRecentCalls(dashData.recent_calls || []);
      }

      if (settingsRes.status === 'success' && settingsRes.settings) {
        setTelephonyConfig({
          has_plivo: !!settingsRes.settings.has_plivo,
          status: settingsRes.settings.telephony_status || 'Simulation Mode'
        });
      }

      const allSchools = Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.schools || []);
      setSchoolsList(allSchools);

      // Extract unique districts from loaded schools
      if (allSchools.length > 0 && !quickDistrict) {
        const firstDist = allSchools.find(s => s.hierarchy?.district)?.hierarchy?.district || '';
        if (firstDist) setQuickDistrict(firstDist);
      }
    } catch (err) {
      console.error('Failed to load calling dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDirectorySchool = (schoolId) => {
    setSelectedSchoolId(schoolId);
    if (!schoolId) {
      setQuickSchoolName('');
      setQuickPhone('');
      setQuickDistrict('');
      setQuickPrincipal('');
      return;
    }
    const found = schoolsList.find(s => s.id === schoolId);
    if (found) {
      const sName = found.info?.school_name || found.name || '';
      const sPhone = found.info?.phone || found.contact?.phone || '';
      const sDist = found.hierarchy?.district || '';
      const sPrincipal = found.info?.principal_name || found.contact?.principal || '';
      setQuickSchoolName(sName);
      setQuickPhone(sPhone);
      setQuickDistrict(sDist);
      setQuickPrincipal(sPrincipal);
    }
  };

  const handleQuickDial = async (e) => {
    e.preventDefault();
    if (!quickPhone.trim()) {
      alert('Please enter a phone number to make a call.');
      return;
    }
    setCallingInProgress(true);
    try {
      const res = await initiateAICall({
        school_id: selectedSchoolId || null,
        school_name: quickSchoolName || 'School Lead',
        phone_number: quickPhone,
        district: quickDistrict || 'Telangana',
        principal_name: quickPrincipal || 'Principal',
        force_mock: false
      });
      if (onStartCall) {
        onStartCall(res);
      }
    } catch (err) {
      alert(`Could not start call: ${err.message}`);
    } finally {
      setCallingInProgress(false);
    }
  };

  const uniqueDistricts = Array.from(
    new Set(schoolsList.map(s => s.hierarchy?.district).filter(Boolean))
  ).sort();

  const kpis = [
    { label: 'Schools In Scope', val: metrics.total_schools || schoolsList.length || 0, sub: 'Telangana Directory', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'AI Calls Made', val: metrics.calls_made || 0, sub: `${metrics.answer_rate || 0}% Connect Rate`, icon: PhoneForwarded, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Connected Calls', val: metrics.connected || 0, sub: 'Active Telugu Dialogues', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Interested Leads', val: metrics.interested || 0, sub: 'Curriculum & Tech fit', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'HOT Leads', val: metrics.hot_leads || 0, sub: 'High sales readiness', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'Demos Booked', val: metrics.demos || 0, sub: 'In-person / Virtual', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pending Follow-ups', val: metrics.followups || 0, sub: 'Human sales queue', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Conversions', val: metrics.conversions || 0, sub: 'Target: ₹500/student', icon: Sparkles, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Platform Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/80 border border-indigo-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Skila AI Outbound Calling Platform
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Telugu-First Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Autonomous Telugu School Outreach & Lead Qualification
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Powered by Ananya (Skila AI Outreach Assistant). Calls Telangana schools, conducts natural Telugu conversation, qualifies student strength and interest, and automatically queues HOT leads for human sales demos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('schools')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            Open School Directory
          </button>
          <button
            onClick={() => onNavigateTab('hot-leads')}
            className="px-4 py-2 bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            View HOT Leads
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-black text-white tracking-tight">{kpi.val}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Row: Quick AI Dialer + Recent Call Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick 1-Click Outbound Dialer (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-800">
              <Phone className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Instant AI Telugu Dialer</h2>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Trigger Ananya to call any Telangana school immediately with complete conversational disclosure and curriculum qualification.
            </p>

            <form onSubmit={handleQuickDial} className="space-y-3">
              {schoolsList.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Select School from Directory (Auto-Fill)
                  </label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => handleSelectDirectorySchool(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose school or enter details manually below --</option>
                    {schoolsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.info?.school_name || s.name} ({s.hierarchy?.district || 'Telangana'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">School Name</label>
                <input
                  type="text"
                  value={quickSchoolName}
                  onChange={(e) => setQuickSchoolName(e.target.value)}
                  placeholder="e.g. ZPHS High School"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Principal / In-Charge Name</label>
                <input
                  type="text"
                  value={quickPrincipal}
                  onChange={(e) => setQuickPrincipal(e.target.value)}
                  placeholder="e.g. Headmaster"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    placeholder="e.g. 9849012345"
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">District</label>
                  {uniqueDistricts.length > 0 ? (
                    <select
                      value={quickDistrict}
                      onChange={(e) => setQuickDistrict(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select District</option>
                      {uniqueDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={quickDistrict}
                      onChange={(e) => setQuickDistrict(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>

              {/* Telephony Connection Mode Badge */}
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
                telephonyConfig.has_plivo
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${telephonyConfig.has_plivo ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                  <span>{telephonyConfig.has_plivo ? 'Plivo Carrier Ready (Rings mobile phone)' : 'In-Browser Simulation (Speakers & Mic)'}</span>
                </div>
                {!telephonyConfig.has_plivo && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('settings')}
                    className="text-[10px] font-bold underline hover:text-white cursor-pointer shrink-0"
                  >
                    Setup Plivo
                  </button>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300 mb-0.5">Telugu Speech Persona:</div>
                Ananya initiates with formal Telugu greetings, verifies availability, qualifies students, answers curriculum questions, and offers demo booking.
              </div>

              <button
                type="submit"
                disabled={callingInProgress}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                {callingInProgress ? 'Connecting Ananya...' : (telephonyConfig.has_plivo ? 'Place Outbound Carrier Call' : 'Start In-Browser Telugu Call')}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Calls Feed (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white">Recent Calls & AI Transcripts</h2>
              <p className="text-xs text-slate-400">Real-time outbound conversations with school principals</p>
            </div>
            <button
              onClick={() => onNavigateTab('calls')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              All Calls <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentCalls.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No calls made yet. Use the dialer or School Directory to trigger your first AI call.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentCalls.map((call, idx) => {
                const interest = call.interest_level || 'WARM';
                const isHot = interest === 'HOT' || call.status === 'HOT' || call.demo_requested;
                return (
                  <div
                    key={call.call_id ? `${call.call_id}-${idx}` : `call-${idx}`}
                    onClick={() => onViewCallDetails(call.call_id, call)}
                    className="p-3.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isHot ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {isHot ? <Flame className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white hover:text-indigo-300 transition">
                            {call.school_name || 'Telangana School'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isHot 
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                              : interest === 'WARM'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          }`}>
                            {interest}
                          </span>
                          {call.demo_requested && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {call.district} • {call.phone_number} • Duration: {call.duration || 45}s
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[10px] text-slate-500">
                        {call.created_at ? new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCallDetails(call.call_id, call);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition cursor-pointer"
                      >
                        Inspect AI Analysis
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
