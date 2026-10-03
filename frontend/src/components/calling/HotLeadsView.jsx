import React, { useState, useEffect } from 'react';
import { 
  Flame, Calendar, Phone, CheckCircle2, UserCheck, 
  Sparkles, Clock, ArrowRight, RefreshCw, FileText, IndianRupee 
} from 'lucide-react';
import { fetchHotLeads } from '../../utils/callingApi';

export default function HotLeadsView({
  onViewCallDetails,
  onBookDemo
}) {
  const [hotLeads, setHotLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetchHotLeads();
      if (res.status === 'success') {
        setHotLeads(res.hot_leads || []);
      }
    } catch (err) {
      console.error('Failed to load hot leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-900/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              HOT Leads Priority Queue
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Human Sales Handoff
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            High Intent School Opportunities
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Schools that expressed strong interest, verified student strength, or explicitly requested an in-person or online Skila AI demo during Ananya's Telugu call.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Grid of Hot Lead Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">
          Loading priority HOT leads...
        </div>
      ) : hotLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-dashed border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No HOT leads yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Run AI outbound calls to schools. When principals express interest or request a demo, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotLeads.map((lead) => {
            const students = lead.student_count || 0;
            const dealValue = students > 0 ? students * 500 : 0; // Target pricing: ₹500/student/year

            return (
              <div
                key={lead.call_id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-900/50 transition shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {lead.school_name || 'School Lead'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {lead.district || 'Telangana'} • Phone: <span className="font-mono text-slate-300">{lead.phone_number || '-'}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0">
                      <Flame className="w-3 h-3" />
                      HOT LEAD
                    </span>
                  </div>

                  {/* Estimated Deal Value Banner */}
                  <div className="p-3 mb-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Student Strength</div>
                      <div className="text-xs font-bold text-slate-200">
                        {students > 0 ? `${students.toLocaleString()} Students` : 'To be verified on demo'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Est. Deal Value</div>
                      {dealValue > 0 ? (
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-end">
                          <IndianRupee className="w-3 h-3" />
                          {dealValue.toLocaleString('en-IN')} / yr
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-400">Assessed on Demo</div>
                      )}
                    </div>
                  </div>

                  {/* AI Qualification Trigger */}
                  <div className="p-3 mb-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-xs text-slate-300">
                    <div className="text-[10px] font-bold text-rose-300 uppercase mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-400" />
                      Why it qualified:
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      {lead.interest_reason || (lead.demo_requested 
                        ? 'Principal explicitly requested a live classroom demonstration for teachers and students.'
                        : 'Expressed clear alignment with Skila AI curriculum and indicated readiness for annual student fee.')}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onViewCallDetails(lead.call_id, lead)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Transcript
                  </button>

                  <button
                    onClick={() => onBookDemo(lead)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Demo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
