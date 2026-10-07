import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Play, Pause, Square, Upload, Users, 
  PhoneCall, CheckCircle2, Flame, Calendar, RefreshCw, X 
} from 'lucide-react';
import { fetchCampaigns, createCampaign, triggerCampaignAction } from '../../utils/callingApi';

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [districtsList, setDistrictsList] = useState(['All Telangana']);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    district: 'All Telangana',
    target_count: 50,
    daily_call_limit: 20
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const [campRes, schoolsRes] = await Promise.all([
        fetchCampaigns().catch(() => ({ campaigns: [] })),
        fetch('/api/schools').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      setCampaigns(campRes.campaigns || []);

      const schools = Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.schools || []);
      const uniqueDistricts = Array.from(
        new Set(schools.map(s => s.hierarchy?.district).filter(Boolean))
      ).sort();
      setDistrictsList(['All Telangana', ...uniqueDistricts]);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await triggerCampaignAction(id, action);
      if (res.status === 'success') {
        loadCampaigns();
      }
    } catch (err) {
      alert(`Campaign action failed: ${err.message}`);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createCampaign(newCampaign);
      if (res.status === 'success') {
        setCreateModalOpen(false);
        loadCampaigns();
      }
    } catch (err) {
      alert(`Could not create campaign: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Campaign Manager
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              Bulk Dialing Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Automated Regional Calling Campaigns
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Queue and execute large-scale outbound calling waves across Telangana districts. Ananya dials automatically within configured daily limits.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
          <button
            onClick={loadCampaigns}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">No campaigns created yet. Click "New Campaign" to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const progress = camp.total_leads ? Math.round((camp.calls_made / camp.total_leads) * 100) : 0;
            const isRunning = camp.status === 'RUNNING';

            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{camp.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      camp.status === 'RUNNING' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : camp.status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>District: <strong className="text-slate-800 dark:text-slate-200">{camp.district}</strong></span>
                    <span>Daily Limit: <strong className="text-slate-800 dark:text-slate-200">{camp.daily_limit || 20} calls/day</strong></span>
                    <span>Leads: <strong className="text-slate-800 dark:text-slate-200">{camp.calls_made} / {camp.total_leads}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-md pt-1">
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Quick Stats */}
                <div className="grid grid-cols-3 gap-3 md:border-l md:border-r border-slate-200 dark:border-slate-800 md:px-6">
                  <div className="text-center">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{camp.connected || 0}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Connected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400">{camp.hot_leads || 0}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">HOT Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-purple-600 dark:text-purple-400">{camp.demos_requested || 0}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Demos</div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      onClick={() => handleAction(camp.id, 'PAUSE')}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-600/20 dark:hover:bg-amber-600/30 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction(camp.id, 'START')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Start
                    </button>
                  )}

                  <button
                    onClick={() => handleAction(camp.id, 'STOP')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Outbound Campaign</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target District</label>
                <select
                  value={newCampaign.district}
                  onChange={(e) => setNewCampaign({ ...newCampaign, district: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {districtsList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Schools</label>
                  <input
                    type="number"
                    value={newCampaign.target_count}
                    onChange={(e) => setNewCampaign({ ...newCampaign, target_count: parseInt(e.target.value) || 50 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="5"
                    max="1000"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Daily Call Limit</label>
                  <input
                    type="number"
                    value={newCampaign.daily_call_limit}
                    onChange={(e) => setNewCampaign({ ...newCampaign, daily_call_limit: parseInt(e.target.value) || 20 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Outbound calls use Sarvam Bulbul Telugu voice with smart pause detection and 1-second Plivo webhook streaming.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
