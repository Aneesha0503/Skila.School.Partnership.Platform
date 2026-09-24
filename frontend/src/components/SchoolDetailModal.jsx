import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Building2, Cpu, DollarSign, MapPin, Phone, Mail, 
  Globe, User, CheckCircle2, XCircle, Edit3, Save, Sparkles, ExternalLink,
  Play, RefreshCw, Zap, Layers, Lock, ShieldCheck, UserCheck, ArrowLeft
} from 'lucide-react';

export default function SchoolDetailModal({ 
  school, 
  onClose, 
  onUpdateSchool, 
  onOpenEditModal,
  userRole = 'admin'
}) {
  const formatRemarks = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      try {
        return Object.entries(val).map(([k, v]) => {
          const title = k.replace(/_/g, ' ').toUpperCase();
          if (typeof v === 'object') return `${title}:\n${JSON.stringify(v, null, 2)}`;
          return `${title}: ${v}`;
        }).join('\n\n');
      } catch (e) {
        return JSON.stringify(val, null, 2);
      }
    }
    return String(val);
  };

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'tech' | 'sales'
  const [leadStatus, setLeadStatus] = useState(school?.sales?.lead_status || 'New');
  const [interestLevel, setInterestLevel] = useState(school?.sales?.interest_level || 'Medium');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(school?.sales?.next_follow_up_date || '');
  const [salesOwner, setSalesOwner] = useState(school?.sales?.sales_owner || '');
  const [remarks, setRemarks] = useState(() => formatRemarks(school?.sales?.remarks));
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichSuccess, setEnrichSuccess] = useState(false);
  const [isRunningDetails, setIsRunningDetails] = useState(false);
  const [runDetailsError, setRunDetailsError] = useState('');

  const scrollContainerRef = useRef(null);

  // Reset scroll to top whenever switching between tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  // Lock background scroll when modal is active, and listen for Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!school) return null;

  const { hierarchy, info, technology, sales, details_fetched } = school;

  const handleRunSchoolDetails = async () => {
    setIsRunningDetails(true);
    setRunDetailsError('');
    try {
      const res = await fetch(`/api/schools/${school.id}/run-details`, { 
        method: 'POST',
        headers: { 'X-User-Role': userRole }
      });
      if (res.ok) {
        const enriched = await res.json();
        onUpdateSchool(enriched);
        if (enriched?.sales?.remarks) setRemarks(formatRemarks(enriched.sales.remarks));
        if (enriched?.sales?.lead_status) setLeadStatus(enriched.sales.lead_status);
        if (enriched?.sales?.interest_level) setInterestLevel(enriched.sales.interest_level);
        if (enriched?.sales?.next_follow_up_date) setNextFollowUpDate(enriched.sales.next_follow_up_date);
        if (enriched?.sales?.sales_owner) setSalesOwner(enriched.sales.sales_owner);
      } else {
        const err = await res.json().catch(() => ({}));
        setRunDetailsError(err.detail || 'Failed to fetch school details. Please try again.');
      }
    } catch (err) {
      console.error('Run school details error:', err);
      setRunDetailsError('Network error while running school details.');
    } finally {
      setIsRunningDetails(false);
    }
  };

  const handleAiEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/ai/enrich/${school.id}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onUpdateSchool(data.school);
        if (data.school?.sales?.remarks) {
          setRemarks(formatRemarks(data.school.sales.remarks));
        }
        setEnrichSuccess(true);
        setTimeout(() => setEnrichSuccess(false), 4000);
      }
    } catch (err) {
      console.error('AI Enrichment error:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      const updatedPayload = {
        hierarchy: school.hierarchy,
        info: school.info,
        technology: school.technology,
        sales: {
          ...school.sales,
          lead_status: leadStatus,
          interest_level: interestLevel,
          next_follow_up_date: nextFollowUpDate,
          sales_owner: salesOwner,
          remarks: remarks
        }
      };

      const res = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Role': userRole
        },
        body: JSON.stringify(updatedPayload)
      });

      if (res.ok) {
        const saved = await res.json();
        onUpdateSchool(saved);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to save CRM updates.');
      }
    } catch (err) {
      console.error('Error saving sales update:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 High Range (International / CBSE / ICSE)',
        className: 'bg-purple-500/25 text-purple-200 border-purple-500/40'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State Board - High Strength (1,200+ Students)',
        className: 'bg-blue-500/25 text-blue-200 border-blue-500/40'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Board - Mid Strength (500–1,200 Students)',
        className: 'bg-amber-500/25 text-amber-200 border-amber-500/40'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Board - Low Strength (<500 Students)',
        className: 'bg-slate-700 text-slate-300 border-slate-600'
      };
    }
    return null;
  };

  const tierBadge = getTierBadge(school.tier);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col w-screen h-screen overflow-hidden select-text animate-in fade-in duration-150">
      
      {/* Fullscreen Sticky Modal Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0 border-b border-slate-800 shadow-md z-20">
        <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-5 sm:px-8 pt-5 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {tierBadge && (
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold shadow-xs ${tierBadge.className}`}>
                    {tierBadge.label}
                  </span>
                )}
                {details_fetched ? (
                  <>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
                      UDISE: <span className="text-white font-bold">{info?.udise_code}</span>
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                      {info?.board}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full 49-Field Profile Verified
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                      {info?.board}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold inline-flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Basic Info Only (Full Profile Pending)
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {info?.school_name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300/90 flex-wrap">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {hierarchy?.village_locality_ward}, {hierarchy?.local_body_name}, {hierarchy?.mandal} Mandal, {hierarchy?.revenue_division} Division, {hierarchy?.district}, {hierarchy?.state}
                </span>
                {info?.pincode && (
                  <span className="text-slate-400 font-mono">({info.pincode})</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {userRole === 'admin' ? (
                <button
                  onClick={() => onOpenEditModal(school)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700/80 transition cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Edit School</span>
                </button>
              ) : (
                <div 
                  title="Only Administrators can edit verified institutional attributes"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Admin Edit Only</span>
                </div>
              )}

              <button
                onClick={handleAiEnrich}
                disabled={isEnriching}
                title="Use Skila AI to evaluate school data, determine tech adoption score, and draft a high-converting sales pitch"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isEnriching ? 'Generating AI Pitch...' : enrichSuccess ? '✓ Sales Pitch Ready!' : '✨ Generate AI Sales Pitch'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition cursor-pointer shadow-xs group"
                title="Return to School Directory"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Directory</span>
              </button>
            </div>
          </div>

          {/* Navigation Segment Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>School Information</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'info' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                16 Fields
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tech')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'tech'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Technology Usage</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'tech' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                17 Fields
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Sales & CRM Pipeline</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'sales' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                16 Fields
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal Body with Smooth Momentum Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain scroll-smooth bg-slate-50/80 dark:bg-slate-950"
      >
        <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto p-5 sm:p-8 space-y-6 pb-28">
          {!details_fetched ? (
            <div className="py-10 px-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs my-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
                <Zap className="w-8 h-8 fill-amber-500 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3 border border-amber-200 dark:border-amber-800">
                ⚡ Step 2: Fetch Complete School Profile
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                Extract 49 Institutional & Tech Fields for {info?.school_name}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-lg">
                This school was discovered during district exploration with basic name and board. 
                Click below to fetch the <strong>complete 49-field profile</strong>: Principal & Correspondent contacts, direct phone numbers, verified email, official website, ERP/LMS software stack, smart classrooms, robotics labs, and decision-maker details.
              </p>

              {runDetailsError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800 w-full text-center">
                  {runDetailsError}
                </div>
              )}

              {userRole === 'admin' ? (
                <button
                  type="button"
                  onClick={handleRunSchoolDetails}
                  disabled={isRunningDetails}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isRunningDetails ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Extracting Contacts, Tech Stack & 49 Fields... (~8-10s)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Fetch Full 49-Field Profile (Contacts & Tech)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Access Restricted:</strong> Full institutional profile extraction requires Administrator authorization. Contact your administrator to fetch this school.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: SCHOOL INFORMATION */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* General & Academic Profile */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>General & Academic Institutional Profile</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {info?.school_category} • {info?.management_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">UDISE Code</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{info?.udise_code || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Affiliated Board</span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs inline-block">
                          {info?.board || '—'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Student Strength</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {info?.student_strength ? Number(info.student_strength).toLocaleString() : '—'} <span className="text-xs font-normal text-slate-500">Students</span>
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Teacher Strength</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {info?.teacher_strength || '—'} <span className="text-xs font-normal text-slate-500">Teachers</span>
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Student-Teacher Ratio</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {info?.teacher_strength && info?.student_strength ? (info.student_strength / info.teacher_strength).toFixed(1) + ':1' : 'N/A'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">School Category</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.school_category || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Management Type</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.management_type || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">School Type</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.school_type || 'Co-Educational'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Classes Offered</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.classes_from || '1'} to {info?.classes_to || '12'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Pincode</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{info?.pincode || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leadership & Official Contacts */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Institutional Leadership & Contact Details</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Principal Name</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{info?.principal_name || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Correspondent Name</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{info?.correspondent_name || '—'}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Official Mobile</span>
                        <a href={`tel:${info?.mobile}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 text-sm">
                          <Phone className="w-3.5 h-3.5" /> {info?.mobile || '—'}
                        </a>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Official Email</span>
                        <a href={`mailto:${info?.email}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 truncate text-xs">
                          <Mail className="w-3.5 h-3.5 shrink-0" /> {info?.email || '—'}
                        </a>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Official Website</span>
                        {info?.website ? (
                          <a href={info?.website} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 truncate">
                            <Globe className="w-3.5 h-3.5 shrink-0" /> {info?.website} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'}
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Full Campus Address</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{info?.full_address || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 6-Tier Administrative Geographic Hierarchy */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>6-Tier Administrative Geographic Hierarchy</span>
                      </h3>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Official Delimitation
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* Tier 1 State */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 1 • State</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{hierarchy?.state || '—'}</div>
                      </div>

                      {/* Tier 2 District */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 2 • District</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{hierarchy?.district || '—'}</div>
                      </div>

                      {/* Tier 3 Revenue Division */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 3 • Division</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{hierarchy?.revenue_division || '—'}</div>
                      </div>

                      {/* Tier 4 Mandal */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 4 • Mandal</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{hierarchy?.mandal || '—'}</div>
                      </div>

                      {/* Tier 5 Local Body */}
                      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60 relative overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 5 • Local Body</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{hierarchy?.local_body_name || '—'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{hierarchy?.local_body_type || 'Local Body'}</div>
                      </div>

                      {/* Tier 6 Ward / Locality */}
                      <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 relative overflow-hidden group hover:border-indigo-400 transition">
                        <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Tier 6 • Ward / Village</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        </div>
                        <div className="font-bold text-indigo-900 dark:text-indigo-200 text-sm truncate" title={hierarchy?.village_locality_ward}>
                          {hierarchy?.village_locality_ward || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* TAB 2: TECHNOLOGY USAGE */}
          {activeTab === 'tech' && (
            <div className="space-y-6">
              {/* Digital Infrastructure & Software Usage */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Digital Software & EdTech Platform Stack</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    6 Core Software Verticals
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
                  {/* ERP */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">School ERP</span>
                      {technology?.erp_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-[10px]"><XCircle className="w-3 h-3" /> None</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate" title={technology?.erp_vendor || 'Not configured'}>
                      {technology?.erp_vendor || 'Not configured'}
                    </span>
                  </div>

                  {/* LMS */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Learning LMS</span>
                      {technology?.lms_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-[10px]"><XCircle className="w-3 h-3" /> None</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate" title={technology?.lms_vendor || 'Not configured'}>
                      {technology?.lms_vendor || 'Not configured'}
                    </span>
                  </div>

                  {/* Coding */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Coding Curriculum</span>
                      {technology?.coding_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-[10px]"><XCircle className="w-3 h-3" /> None</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate" title={technology?.coding_vendor || 'Not integrated'}>
                      {technology?.coding_vendor || 'Not integrated'}
                    </span>
                  </div>

                  {/* Robotics */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">Robotics Lab</span>
                      {technology?.robotics_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-[10px]"><XCircle className="w-3 h-3" /> None</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate" title={technology?.robotics_vendor || 'Not installed'}>
                      {technology?.robotics_vendor || 'Not installed'}
                    </span>
                  </div>

                  {/* AI Curriculum */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">AI & ML Fit</span>
                      {technology?.ai_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><Sparkles className="w-3 h-3" /> In Use</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded font-semibold text-[10px]">Open Pitches</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate" title={technology?.ai_vendor || 'Skila AI Candidate'}>
                      {technology?.ai_vendor || 'Skila AI Candidate'}
                    </span>
                  </div>

                  {/* STEM Program */}
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">STEM Curriculum</span>
                      {technology?.stem_program === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold text-[10px]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium text-[10px]"><XCircle className="w-3 h-3" /> Inactive</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold block truncate">
                      {technology?.stem_program === 'Yes' ? 'Integrated in timetable' : 'Not started'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware & Lab Infrastructure */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Campus Hardware, Labs & Smart Classroom Infrastructure</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Physical Capabilities
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">ATL Lab (NITI Aayog)</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${technology?.atl_lab === 'Yes' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {technology?.atl_lab === 'Yes' ? 'Established' : 'Not Set Up'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Smart Classrooms</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {technology?.smart_classroom === 'Yes' ? `${technology?.smart_classroom_count} Rooms` : 'None'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Computer Labs</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {technology?.computer_lab === 'Yes' ? `${technology?.computer_lab_count} Labs` : 'None'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Internet Connectivity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{technology?.internet || 'Available'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Parent App</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{technology?.parent_app === 'Yes' ? 'Active' : 'No App'}</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">School Mobile App</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{technology?.school_app === 'Yes' ? 'Live on Play Store' : 'No App'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALES & CRM PIPELINE */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Opportunity & Decision Maker Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Commercial Opportunity & Decision Maker</span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAiEnrich}
                      disabled={isEnriching}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                      title="Analyze this school and write a customized sales pitch"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {isEnriching ? 'Generating AI Pitch...' : '✨ Generate AI Sales Pitch'}
                    </button>

                    <div className="flex items-center gap-1.5 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">Status:</span>
                      <select
                        value={leadStatus}
                        onChange={(e) => setLeadStatus(e.target.value)}
                        className="text-xs font-bold bg-transparent text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer"
                      >
                        <option value="New" className="dark:bg-slate-900 dark:text-slate-100">New</option>
                        <option value="Contacted" className="dark:bg-slate-900 dark:text-slate-100">Contacted</option>
                        <option value="Demo Scheduled" className="dark:bg-slate-900 dark:text-slate-100">Demo Scheduled</option>
                        <option value="Proposal Shared" className="dark:bg-slate-900 dark:text-slate-100">Proposal Shared</option>
                        <option value="Pilot Started" className="dark:bg-slate-900 dark:text-slate-100">Pilot Started</option>
                        <option value="Closed Won" className="dark:bg-slate-900 dark:text-slate-100">Closed Won</option>
                        <option value="Closed Lost" className="dark:bg-slate-900 dark:text-slate-100">Closed Lost</option>
                      </select>
                    </div>
                  </div>
                </div>

                {enrichSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Skila AI analysis completed! Strategy notes and AI potential updated below.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Key Decision Maker</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm block truncate">{sales?.decision_maker || 'Not specified'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Designation</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{sales?.decision_maker_designation || 'Leader / Trustee'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Direct Contact</span>
                    <a href={`tel:${sales?.decision_maker_contact}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 text-sm">
                      <Phone className="w-3.5 h-3.5" /> {sales?.decision_maker_contact || '—'}
                    </a>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Annual Fee Range</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-xs inline-block">
                      {sales?.annual_fee_range || 'Standard Tier'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Skila AI Potential</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1 text-xs">
                      <Sparkles className="w-3 h-3 text-amber-500" /> {sales?.skila_ai_potential || 'High'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tech Adoption Level</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sales?.technology_adoption_level || 'Moderate'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Assigned Sales Owner</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{sales?.sales_owner || 'Regional Manager'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Last Contact Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sales?.last_contact_date || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Next Follow-up Date</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">{sales?.next_follow_up_date || '—'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">EdTech Partners</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {Array.isArray(sales?.existing_edtech_partners) 
                        ? sales.existing_edtech_partners.join(', ') 
                        : (sales?.existing_edtech_partners || 'None known')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deal Funnel Milestones */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Partnership Milestones & Funnel Progress
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Stage Tracking
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                  <div className={`p-4 rounded-xl border ${sales?.interest_level === 'High' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200' : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold mb-1">Interest Level</span>
                    <span className="font-extrabold text-base">{sales?.interest_level || 'Pending'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${sales?.demo_done === 'Yes' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold mb-1">Demo Completed</span>
                    <span className="font-extrabold text-base">{sales?.demo_done === 'Yes' ? 'Completed' : 'Pending'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${sales?.proposal_shared === 'Yes' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold mb-1">Proposal Shared</span>
                    <span className="font-extrabold text-base">{sales?.proposal_shared === 'Yes' ? 'Sent' : 'Pending'}</span>
                  </div>
                  <div className={`p-4 rounded-xl border ${sales?.pilot_started === 'Yes' ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200' : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold mb-1">Pilot Started</span>
                    <span className="font-extrabold text-base">{sales?.pilot_started === 'Yes' ? 'Active Pilot' : 'Not Started'}</span>
                  </div>
                </div>
              </div>

              {/* Field Operations & CRM Console */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Field Operations & Relationship Management Console</span>
                  </h3>
                  {userRole === 'agent' ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold inline-flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Field Representative Mode
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Administrator Access
                    </span>
                  )}
                </div>

                {/* Direct Field Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                  {/* Lead Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Meeting Scheduled">Meeting Scheduled</option>
                      <option value="Demo Completed">Demo Completed</option>
                      <option value="Proposal Shared">Proposal Shared</option>
                      <option value="Pilot Running">Pilot Running</option>
                      <option value="Closed Won">Closed Won</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>

                  {/* Interest Level */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Interest Level
                    </label>
                    <select
                      value={interestLevel}
                      onChange={(e) => setInterestLevel(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Next Follow-up Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Next Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Assigned Sales Owner */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Field Representative
                    </label>
                    <input
                      type="text"
                      value={salesOwner}
                      onChange={(e) => setSalesOwner(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Remarks & Notes */}
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interaction Remarks & Strategy Notes
                </label>
                <textarea
                  rows="4"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record meeting outcomes, principal/correspondent feedback, budget constraints, next steps..."
                  className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition mb-4 font-mono text-[11px] leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Updates saved successfully to database!
                    </span>
                  )}
                  <button
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : userRole === 'agent' ? 'Save Field CRM Updates' : 'Save CRM Updates'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
      </div>
    </div>
  );
}
