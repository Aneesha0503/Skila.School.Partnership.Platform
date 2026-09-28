import React, { useState, useMemo } from 'react';
import { 
  X, Trophy, Search, FileText, Award, CheckCircle2, Clock, 
  ExternalLink, ArrowRight, ShieldCheck, DollarSign, Building2, MapPin, Sparkles, Filter
} from 'lucide-react';

export default function ConfirmedSchoolsModal({ 
  confirmedSchools = [], 
  metrics = {}, 
  onClose, 
  onOpenSchoolFormalities,
  onOpenMOU,
  onOpenCertificate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredSchools = useMemo(() => {
    return (confirmedSchools || []).filter((s) => {
      const info = s.info || {};
      const hierarchy = s.hierarchy || {};
      const form = s.formalities || s.sales?.formalities || {};

      // Search match
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const matchesName = (info.school_name || '').toLowerCase().includes(query);
        const matchesDistrict = (hierarchy.district || '').toLowerCase().includes(query);
        const matchesUdise = (info.udise_code || '').toLowerCase().includes(query);
        const matchesSpoc = (form.school_spoc_name || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDistrict && !matchesUdise && !matchesSpoc) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'Completed') {
        return form.progress_pct >= 100 || form.formalities_completed;
      }
      if (statusFilter === 'InProgress') {
        return (form.progress_pct < 100 || !form.formalities_completed) && form.progress_pct > 0;
      }
      if (statusFilter === 'PendingMOU') {
        return form.mou_status !== 'Signed by School' && form.mou_status !== 'Fully Executed';
      }
      if (statusFilter === 'PendingPayment') {
        return form.invoice_status !== 'Fully Paid';
      }

      return true;
    });
  }, [confirmedSchools, searchTerm, statusFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent dark:from-amber-950/30 dark:via-slate-900">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Confirmed Schools & Formalities Hub
                  </h1>
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-700">
                    {confirmedSchools.length} Deals
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Track post-deal confirmation formalities: MOUs, commercial clearances, institutional SPOCs, and onboarding
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-5">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Total Confirmed</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{metrics.total_confirmed ?? confirmedSchools.length}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">100% Active Partners</span>
              <p className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{metrics.formalities_completed ?? 0}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 tracking-wider">Pending MOU Signing</span>
              <p className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{metrics.pending_mou ?? 0}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-2xs">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider">Pending Payment</span>
              <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{metrics.pending_payment ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search confirmed schools by name, district, or SPOC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({confirmedSchools.length})
            </button>
            <button
              onClick={() => setStatusFilter('Completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Active Partner ({metrics.formalities_completed ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter('InProgress')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'InProgress'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              In Progress ({metrics.in_progress ?? 0})
            </button>
            <button
              onClick={() => setStatusFilter('PendingMOU')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'PendingMOU'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Pending MOU ({metrics.pending_mou ?? 0})
            </button>
          </div>
        </div>

        {/* Confirmed Schools List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredSchools.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-sm font-semibold">No confirmed schools match your filter.</p>
              <p className="text-xs text-slate-500 mt-1">Confirm deals in the School CRM tab to unlock the Formalities workflow.</p>
            </div>
          ) : (
            filteredSchools.map((s) => {
              const info = s.info || {};
              const hierarchy = s.hierarchy || {};
              const form = s.formalities || s.sales?.formalities || {};
              const progressPct = form.progress_pct ?? 20;
              const isCompleted = progressPct >= 100 || form.formalities_completed;

              return (
                <div 
                  key={s.id}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left Column: School Identity & Location */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 inline-flex items-center gap-1">
                        <span>🏆</span> Deal Confirmed
                      </span>

                      {isCompleted ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active Partner
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Formalities In Progress
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {form.mou_number || 'MOU Ready'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {info.school_name || 'School Name'}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        {hierarchy.mandal ? `${hierarchy.mandal}, ` : ''}{hierarchy.district || ''}, {hierarchy.state || 'India'}
                      </span>
                      <span>•</span>
                      <span>Board: {info.board || 'CBSE'}</span>
                      <span>•</span>
                      <span>Students: {Number(info.student_strength || 0).toLocaleString()}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 max-w-md">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-600 dark:text-slate-300">
                          Formalities Completion:
                        </span>
                        <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400'}>
                          {progressPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            isCompleted 
                              ? 'bg-emerald-500' 
                              : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badges Row */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium">
                        MOU: {form.mou_status || 'Drafting'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium">
                        Payment: {form.invoice_status || 'Pending'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium">
                        Roster: {form.roster_status || 'Pending'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 font-medium">
                        Lab: {form.lab_readiness || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => onOpenSchoolFormalities(s)}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Manage Formalities</span>
                    </button>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => onOpenMOU(s, form)}
                        className="flex-1 md:flex-initial px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="View formal Memorandum of Understanding"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>MOU</span>
                      </button>

                      <button
                        onClick={() => onOpenCertificate(s, form)}
                        className="flex-1 md:flex-initial px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="View Official Skila AI Partnership Certificate"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Certificate</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
