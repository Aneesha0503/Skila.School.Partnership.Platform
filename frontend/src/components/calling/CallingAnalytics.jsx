import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, MapPin, 
  Flame, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Users 
} from 'lucide-react';
import { fetchCallingAnalytics } from '../../utils/callingApi';

export default function CallingAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchCallingAnalytics();
      if (res.status === 'success') {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load calling analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const interestMap = data?.interest_distribution || { HOT: 0, WARM: 0, COLD: 0 };
  const totalCalls = data?.total_calls || (interestMap.HOT + interestMap.WARM + interestMap.COLD) || 0;

  const hotPct = totalCalls > 0 ? Math.round((interestMap.HOT / totalCalls) * 100) : 0;
  const warmPct = totalCalls > 0 ? Math.round((interestMap.WARM / totalCalls) * 100) : 0;
  const coldPct = totalCalls > 0 ? Math.round((interestMap.COLD / totalCalls) * 100) : 0;

  const districts = data?.district_distribution || [];
  const commonObjections = data?.objections_distribution || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Calling Analytics & BI
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              Telangana Outreach Insights
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            AI Qualification Performance & Market Reach
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time analytics on conversion funnels, interest classification, regional distribution, and top objection patterns detected across calls.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Lead Interest Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              Lead Classification Split
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Post-call evaluation by Skila AI Brain</p>

            {/* Visual Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">HOT Leads (Demo Requested)</span>
                  <span className="text-slate-900 dark:text-white">{interestMap.HOT} ({hotPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${hotPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">WARM Leads (Follow-up)</span>
                  <span className="text-slate-900 dark:text-white">{interestMap.WARM} ({warmPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${warmPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">COLD Leads (Not Interested)</span>
                  <span className="text-slate-900 dark:text-white">{interestMap.COLD} ({coldPct}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${coldPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Total Analyzed Outbound Calls: <strong className="text-slate-900 dark:text-white font-mono">{totalCalls}</strong>
          </div>
        </div>

        {/* District Reach */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Telangana District Reach
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Schools contacted by geographic territory</p>

            {districts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No outbound calls completed by territory yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {districts.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.district}</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                      {d.count} calls
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Real-time coverage across Telangana school districts.
          </div>
        </div>

        {/* Top Objections Analyzed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Top Detected Objections & Concerns
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Extracted dynamically from AI conversation analysis</p>

            {commonObjections.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No objections logged yet. AI call analytics will populate here as schools are called.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {commonObjections.map((obj, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                      <span>{obj.title}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">{obj.count} ({obj.pct}%)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Recorded across {obj.count} school dialogue sessions</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Categorized via post-call NLP summarization.
          </div>
        </div>

      </div>

    </div>
  );
}
