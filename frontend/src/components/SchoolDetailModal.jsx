import React, { useState } from 'react';
import { 
  X, Building2, Cpu, DollarSign, MapPin, Phone, Mail, 
  Globe, User, CheckCircle2, XCircle, Edit3, Save, Sparkles, ExternalLink,
  Play, RefreshCw, Zap, Layers, Lock, ShieldCheck, UserCheck
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:p-6 shrink-0 relative border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {tierBadge && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${tierBadge.className}`}>
                    {tierBadge.label}
                  </span>
                )}
                {details_fetched ? (
                  <>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      UDISE: {info?.udise_code}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                      {info?.board}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 49 Fields Ready
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                      {info?.board}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold inline-flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Details Pending Run
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
                {info?.school_name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>
                  {hierarchy?.village_locality_ward}, {hierarchy?.local_body_name}, {hierarchy?.mandal} Mandal, {hierarchy?.revenue_division} Division, {hierarchy?.district}, {hierarchy?.state}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {userRole === 'admin' ? (
                <button
                  onClick={() => onOpenEditModal(school)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit School
                </button>
              ) : (
                <div 
                  title="Only Administrators can edit verified institutional attributes"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Admin Edit Only</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === 'info' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Building2 className="w-4 h-4" />
              School Information (16 Fields)
            </button>
            <button
              onClick={() => setActiveTab('tech')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === 'tech' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Cpu className="w-4 h-4" />
              Technology Usage (17 Fields)
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === 'sales' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <DollarSign className="w-4 h-4" />
              Sales & CRM Pipeline (16 Fields)
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
          {!details_fetched ? (
            <div className="py-10 px-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs my-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
                <Zap className="w-8 h-8 fill-amber-500 text-amber-600 dark:text-amber-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-200 dark:border-amber-800">
                ⚡ Step 2: On-Demand School Intelligence
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Run Deep Intelligence for {info?.school_name}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                This school was discovered during your district run ({info?.board}, ~{info?.student_strength} students). 
                Click below to trigger <strong>Skila AI Engine</strong> to research and populate all <strong>16 School Information, 17 Technology Usage, and 16 Sales CRM fields</strong> specifically for this school.
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isRunningDetails ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Skila AI is Extracting 49 Fields... (~8-10s)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Run School Details (49 Fields)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong>Agent Mode:</strong> Deep telemetry AI scraping requires Administrator approval.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* TAB 1: SCHOOL INFORMATION */}
              {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> General & Academic Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">UDISE Code</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">{info?.udise_code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">School Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.school_category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Management Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.management_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">School Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.school_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Affiliated Board</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                      {info?.board}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Classes Range</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.classes_from} to {info?.classes_to}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Student Strength</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{info?.student_strength?.toLocaleString()} Students</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Teacher Strength</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{info?.teacher_strength} Teachers</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Student-Teacher Ratio</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {info?.teacher_strength ? (info.student_strength / info.teacher_strength).toFixed(1) : 'N/A'}:1
                    </span>
                  </div>
                </div>
              </div>

              {/* Leadership & Contacts */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Leadership & Official Contacts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Principal Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.principal_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Correspondent Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{info?.correspondent_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Mobile Number</span>
                    <a href={`tel:${info?.mobile}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {info?.mobile || '—'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Official Email</span>
                    <a href={`mailto:${info?.email}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {info?.email || '—'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Website</span>
                    {info?.website ? (
                      <a href={info?.website} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 truncate">
                        <Globe className="w-3 h-3 shrink-0" /> {info?.website} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : '—'}
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Pincode</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{info?.pincode}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Full Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{info?.full_address}</span>
                  </div>
                </div>
              </div>

              {/* Administrative Boundary Drill-Down */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Complete Administrative Geographic Hierarchy
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">State</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hierarchy?.state}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">District</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hierarchy?.district}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">Revenue Div</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hierarchy?.revenue_division}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">Mandal</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hierarchy?.mandal}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">Local Body</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{hierarchy?.local_body_name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{hierarchy?.local_body_type}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold block">Ward / Village</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">{hierarchy?.village_locality_ward}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNOLOGY USAGE */}
          {activeTab === 'tech' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Digital Infrastructure & Software Usage
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {/* ERP */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">ERP Used</span>
                      {technology?.erp_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> No</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Vendor: {technology?.erp_vendor || 'None specified'}</span>
                  </div>

                  {/* LMS */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">LMS Used</span>
                      {technology?.lms_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> No</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Vendor: {technology?.lms_vendor || 'None specified'}</span>
                  </div>

                  {/* Coding */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Coding Curriculum</span>
                      {technology?.coding_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> No</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Vendor: {technology?.coding_vendor || 'None specified'}</span>
                  </div>

                  {/* Robotics */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Robotics Program</span>
                      {technology?.robotics_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> No</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Vendor: {technology?.robotics_vendor || 'None specified'}</span>
                  </div>

                  {/* AI Used */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">AI Used</span>
                      {technology?.ai_used === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> No</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Vendor: {technology?.ai_vendor || 'None'}</span>
                  </div>

                  {/* STEM Program */}
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">STEM Program</span>
                      {technology?.stem_program === 'Yes' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]"><XCircle className="w-3.5 h-3.5" /> Inactive</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Status: {technology?.stem_program === 'Yes' ? 'Integrated in timetable' : 'Not started'}</span>
                  </div>
                </div>
              </div>

              {/* Hardware & Campus Labs */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  Hardware & Lab Infrastructure
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">ATL Lab (NITI Aayog)</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${technology?.atl_lab === 'Yes' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {technology?.atl_lab === 'Yes' ? 'Established' : 'Not Set Up'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Smart Classrooms</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {technology?.smart_classroom === 'Yes' ? `${technology?.smart_classroom_count} Rooms` : 'None'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Computer Labs</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {technology?.computer_lab === 'Yes' ? `${technology?.computer_lab_count} Labs` : 'None'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Internet Connectivity</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{technology?.internet}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">Parent App</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{technology?.parent_app === 'Yes' ? 'Available' : 'No App'}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-slate-400 dark:text-slate-500 block mb-1">School Branded App</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{technology?.school_app === 'Yes' ? 'Available' : 'No App'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SALES & CRM PIPELINE */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Sales Opportunity & Decision Maker
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleAiEnrich}
                      disabled={isEnriching}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-[11px] shadow-2xs transition disabled:opacity-50"
                      title="Analyze with Skila AI"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {isEnriching ? 'AI Analyzing...' : 'AI Pitch & Tech Insights'}
                    </button>

                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Quick Status:</span>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="text-xs font-semibold rounded-lg border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 py-1 px-2.5 focus:ring-indigo-500"
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

                {enrichSuccess && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Skila AI analysis completed! Strategy notes and AI potential updated below.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Key Decision Maker</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{sales?.decision_maker || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Designation</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sales?.decision_maker_designation || 'Leader'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Decision Maker Contact</span>
                    <a href={`tel:${sales?.decision_maker_contact}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {sales?.decision_maker_contact || '—'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Annual Fee Range</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                      {sales?.annual_fee_range}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Tech Adoption Level</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sales?.technology_adoption_level}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Skila AI Potential</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {sales?.skila_ai_potential}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Assigned Sales Owner</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sales?.sales_owner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Last Contact Date</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{sales?.last_contact_date || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Next Follow-up Date</span>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">{sales?.next_follow_up_date || '—'}</span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 dark:text-slate-500 block mb-0.5">Existing EdTech Partners</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {Array.isArray(sales?.existing_edtech_partners) 
                        ? sales.existing_edtech_partners.join(', ') 
                        : (sales?.existing_edtech_partners || 'None known')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deal Funnel Milestones */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  Partnership Milestones & Funnel Progress
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className={`p-3 rounded-lg border ${sales?.interest_level === 'High' ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-0.5">Interest Level</span>
                    <span className="font-bold text-sm">{sales?.interest_level}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${sales?.demo_done === 'Yes' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-0.5">Demo Completed</span>
                    <span className="font-bold text-sm">{sales?.demo_done === 'Yes' ? 'Done' : 'Pending'}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${sales?.proposal_shared === 'Yes' ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-0.5">Proposal Shared</span>
                    <span className="font-bold text-sm">{sales?.proposal_shared === 'Yes' ? 'Sent' : 'Pending'}</span>
                  </div>
                  <div className={`p-3 rounded-lg border ${sales?.pilot_started === 'Yes' ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-0.5">Pilot Started</span>
                    <span className="font-bold text-sm">{sales?.pilot_started === 'Yes' ? 'Active Pilot' : 'Not Started'}</span>
                  </div>
                </div>
              </div>

              {/* Field Operations & CRM Console */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Field Operations & CRM Telemetry Console
                  </h3>
                  {userRole === 'agent' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold inline-flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Agent CRM Active
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Admin Mode
                    </span>
                  )}
                </div>

                {/* Direct Field Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {/* Lead Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-indigo-500"
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
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Remarks & Notes */}
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interaction Remarks & Strategy Notes
                </label>
                <textarea
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record meeting outcomes, principal/correspondent feedback, budget constraints, next steps..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition mb-3"
                />

                <div className="flex items-center justify-between">
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Updates saved successfully to database!
                    </span>
                  )}
                  <button
                    onClick={handleQuickSave}
                    disabled={isSaving}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
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
