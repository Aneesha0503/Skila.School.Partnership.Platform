import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Search, Filter, Flame, Clock, 
  FileText, RefreshCw, Calendar, ArrowRight, Play 
} from 'lucide-react';
import { fetchCallsHistory } from '../../utils/callingApi';

export default function CallingHistoryView({ 
  onViewCallDetails, 
  onStartCall 
}) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [interestFilter, setInterestFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadCalls = async () => {
    try {
      setLoading(true);
      const res = await fetchCallsHistory({
        interest: interestFilter,
        status: statusFilter,
        search
      });
      if (res.status === 'success') {
        setCalls(res.calls || []);
      }
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [interestFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCalls();
  };

  return (
    <div className="space-y-5">
      
      {/* Header and Filter Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Outbound Call Logs & Live Transcripts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full audit history of all AI calls made with audio recordings and Sarvam Telugu transcripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school or district..."
              className="bg-slate-950/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48"
            />
          </form>

          {/* Interest Filter */}
          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Interest Levels</option>
            <option value="HOT">HOT Leads Only</option>
            <option value="WARM">WARM Leads</option>
            <option value="COLD">COLD Leads</option>
          </select>

          <button
            onClick={loadCalls}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Calls Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading call history records...
          </div>
        ) : calls.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No calls found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">School Name</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">AI Interest</th>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {calls.map((c, idx) => {
                  const interest = c.interest_level || 'WARM';
                  const isHot = interest === 'HOT' || c.status === 'HOT' || c.demo_requested;

                  return (
                    <tr key={c.call_id || `call-${idx}`} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{c.school_name || 'Telangana School'}</span>
                          {c.demo_requested && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {c.call_id}</div>
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {c.district}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-400">
                        {c.phone_number}
                      </td>

                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {c.duration || 45}s
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHot 
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                            : interest === 'WARM'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {interest}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : 'Recent'}
                      </td>

                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewCallDetails(c.call_id, c)}
                            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Transcript
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
