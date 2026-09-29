import React, { useState, useEffect, useMemo } from 'react';
import {
  X, UploadCloud, Users, CheckCircle2, AlertTriangle, MessageSquare, Send,
  FileSpreadsheet, Sparkles, Download, Copy, Check, Search, Filter, ShieldCheck,
  Smartphone, Mail, RefreshCw, Key, ChevronRight, ArrowUpDown, School, AlertCircle,
  Clock
} from 'lucide-react';

export default function StudentRosterModal({
  school,
  formalities,
  onClose,
  onFormalitiesUpdated
}) {
  const [activeTab, setActiveTab] = useState('ingest'); // 'ingest' | 'directory' | 'provision'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Roster state
  const [rosterData, setRosterData] = useState({
    school_id: school?.id || '',
    school_name: school?.info?.school_name || 'Partner School',
    agreed_capacity: 350,
    uploaded_count: 0,
    verified_count: 0,
    match_percentage: 100.0,
    capacity_status: 'empty',
    capacity_delta: 0,
    classes_breakdown: {},
    roster_file_name: '',
    roster_uploaded_at: '',
    roster_status: 'Pending',
    accounts_provisioned: false,
    accounts_provisioned_count: 0,
    welcome_kit_dispatched: false,
    welcome_kit_dispatched_at: '',
    welcome_kit_channels: ['WhatsApp', 'SMS'],
    students: []
  });

  // Directory search & filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Batch provisioning setup
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: false
  });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionProgress, setProvisionProgress] = useState(0);
  const [provisionStepText, setProvisionStepText] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Fetch initial roster info
  const fetchRoster = async () => {
    if (!school?.id) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/schools/${school.id}/roster`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setRosterData(data);
    } catch (err) {
      console.error('Error fetching roster:', err);
      setErrorMsg('Could not load current roster data. You can load a sample roster or upload a new one.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [school?.id]);

  // 1-Click Load Realistic Sample Roster
  const handleLoadSampleRoster = async () => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/schools/${school.id}/roster/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setSuccessMsg(`✅ Generated ${data.uploaded_count} student records perfectly matching MOU Agreed Capacity of ${data.agreed_capacity}!`);
      fetchRoster();
      if (onFormalitiesUpdated) onFormalitiesUpdated();
    } catch (err) {
      console.error('Error generating sample roster:', err);
      setErrorMsg('Failed to generate sample roster. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // CSV File upload & parsing
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file appears empty or missing data rows.');
        }

        const students = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^\"|\"$/g, ''));
          if (cols.length < 2) continue;

          const studentName = cols[1] || cols[0] || `Student ${i}`;
          const rollNum = cols[0] || `SK-${1000 + i}`;
          const classGrade = cols[2] || `Grade ${((i % 10) + 1)}`;
          const section = cols[3] || 'A';
          const parentName = cols[4] || 'Parent';
          const parentPhone = cols[5] || '+91 98765 00000';
          const parentEmail = cols[6] || '';

          students.push({
            roll_number: rollNum,
            student_name: studentName,
            class_grade: classGrade,
            section: section,
            parent_name: parentName,
            parent_phone: parentPhone,
            parent_email: parentEmail
          });
        }

        const res = await fetch(`/api/schools/${school.id}/roster/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_name: file.name,
            students: students
          })
        });

        if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
        const result = await res.json();
        setSuccessMsg(`🎉 Successfully ingested ${result.uploaded_count} students from ${file.name}!`);
        fetchRoster();
        if (onFormalitiesUpdated) onFormalitiesUpdated();
      } catch (err) {
        console.error('CSV Parsing error:', err);
        setErrorMsg(`Failed to parse CSV file: ${err.message}`);
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // 1-Click Batch Provisioning & Parent Welcome Kit Dispatch
  const handleBatchProvision = async () => {
    const activeChannels = [];
    if (channels.whatsapp) activeChannels.push('WhatsApp');
    if (channels.sms) activeChannels.push('SMS');
    if (channels.email) activeChannels.push('Email');

    if (activeChannels.length === 0) {
      setErrorMsg('Please select at least one dispatch channel (WhatsApp, SMS, or Email).');
      return;
    }

    setIsProvisioning(true);
    setProvisionProgress(15);
    setProvisionStepText('Generating encrypted LMS credentials for all students...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await new Promise(r => setTimeout(r, 500));
      setProvisionProgress(45);
      setProvisionStepText('Enrolling student records into Skila.ai Institutional Platform...');

      await new Promise(r => setTimeout(r, 500));
      setProvisionProgress(75);
      setProvisionStepText(`Dispatching automated Welcome Kits via ${activeChannels.join(' & ')}...`);

      const res = await fetch(`/api/schools/${school.id}/roster/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: activeChannels
        })
      });

      if (!res.ok) throw new Error(`Provisioning returned ${res.status}`);
      const data = await res.json();

      setProvisionProgress(100);
      setProvisionStepText('All accounts provisioned & welcome notifications dispatched!');
      await new Promise(r => setTimeout(r, 400));

      setSuccessMsg(`🚀 Successfully provisioned ${data.accounts_provisioned_count} student LMS accounts and sent parent welcome kits via ${activeChannels.join(', ')}!`);
      fetchRoster();
      if (onFormalitiesUpdated) onFormalitiesUpdated();
    } catch (err) {
      console.error('Batch provisioning error:', err);
      setErrorMsg('Provisioning failed. Please verify network connection.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Filtered students for Directory tab
  const filteredStudents = useMemo(() => {
    return (rosterData.students || []).filter(student => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        (student.student_name || '').toLowerCase().includes(q) ||
        (student.roll_number || '').toLowerCase().includes(q) ||
        (student.parent_phone || '').includes(q) ||
        (student.lms_username || '').toLowerCase().includes(q);

      const matchGrade = selectedGrade === 'All' || student.class_grade === selectedGrade;

      const matchStatus = selectedStatus === 'All' ||
        (selectedStatus === 'Provisioned' && (student.provision_status === 'Provisioned' || student.welcome_dispatched)) ||
        (selectedStatus === 'Pending' && student.provision_status !== 'Provisioned');

      return matchSearch && matchGrade && matchStatus;
    });
  }, [rosterData.students, searchTerm, selectedGrade, selectedStatus]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const schoolName = school?.info?.school_name || 'Partner School';
  const agreedCapacity = rosterData.agreed_capacity || 350;
  const uploadedCount = rosterData.uploaded_count || 0;
  const verifiedCount = rosterData.verified_count || 0;
  const matchPct = rosterData.match_percentage || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* ================= MODAL HEADER ================= */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Roster Ingestion & Parent Welcome Kit
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Stage 3 Formalities
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <School className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{schoolName}</span>
                <span>•</span>
                <span>MOU Agreed Target: <strong className="text-indigo-600 dark:text-indigo-400">{agreedCapacity} Students</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRoster}
              disabled={loading || actionLoading}
              title="Refresh Roster"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= KEY METRICS SUMMARY BANNER ================= */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">MOU Agreed Target</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{agreedCapacity} Students</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              uploadedCount === agreedCapacity && uploadedCount > 0
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : uploadedCount > agreedCapacity
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {uploadedCount === agreedCapacity && uploadedCount > 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Uploaded Roster</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{uploadedCount}</span>
                <span className="text-[10px] text-slate-400">/ {agreedCapacity}</span>
                {uploadedCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    uploadedCount === agreedCapacity
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : uploadedCount > agreedCapacity
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                  }`}>
                    {matchPct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              rosterData.accounts_provisioned
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">LMS Provisioning</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {rosterData.accounts_provisioned ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Active ({rosterData.accounts_provisioned_count || verifiedCount})</span>
                ) : (
                  <span className="text-slate-400 font-medium">Pending 1-Click Setup</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              rosterData.welcome_kit_dispatched
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
            }`}>
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Parent Welcome Kit</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {rosterData.welcome_kit_dispatched ? (
                  <span className="text-purple-600 dark:text-purple-400">Dispatched ({rosterData.welcome_kit_channels?.join(', ') || 'WhatsApp'})</span>
                ) : (
                  <span className="text-slate-400 font-medium">Ready to Dispatch</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('ingest')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ingest'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>1. Ingestion & Capacity Validator</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Student & Parent Directory</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono">
              {uploadedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('provision')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'provision'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3. Batch LMS & Parent Welcome Kit</span>
            {rosterData.accounts_provisioned && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= TAB 1: INGESTION & CAPACITY VALIDATOR ================= */}
        {activeTab === 'ingest' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Top Row: Upload Area + Quick Load Sample */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Drag and Drop Zone */}
              <div className="md:col-span-2 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-6 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col items-center justify-center text-center hover:border-indigo-400 transition-all group">
                <input
                  type="file"
                  id="roster-file-input"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={actionLoading}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Upload Student Roster (.xlsx or .csv)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
                  Drag & drop your institutional student spreadsheet containing Roll No, Class, Section, and Parent Mobile.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="roster-file-input"
                    className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Choose Spreadsheet File</span>
                  </label>

                  <a
                    href={`/api/schools/${school?.id}/roster/template`}
                    download="Skila_Student_Roster_Template.csv"
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Blank Template</span>
                  </a>
                </div>

                <div className="text-[11px] text-slate-400 mt-3 flex items-center gap-3">
                  <span>Supports: .csv, .xlsx</span>
                  <span>•</span>
                  <span>Required columns: Student Name, Class, Parent Mobile</span>
                </div>
              </div>

              {/* Instant 1-Click Sample Generator Card */}
              <div className="border border-purple-200 dark:border-purple-900/50 rounded-2xl p-5 bg-gradient-to-br from-purple-50/60 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Demo & Instant Loader</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Need realistic roster data for testing?
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Auto-synthesize {agreedCapacity} verified student records distributed across Grades 1–10 with authentic Indian names, parent contacts, and LMS IDs.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleLoadSampleRoster}
                    disabled={actionLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{actionLoading ? 'Synthesizing...' : `⚡ Load Realistic Roster (${agreedCapacity} Students)`}</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2">
                    Instant 1-click test fixture for onboarding demonstrations
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity Auto-Validation Section */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Automated MOU Capacity Validator</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time verification against agreed student license quota in MOU Schedule III
                  </p>
                </div>

                {uploadedCount > 0 && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    uploadedCount === agreedCapacity
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : uploadedCount > agreedCapacity
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
                  }`}>
                    {uploadedCount === agreedCapacity
                      ? '✅ 100% MOU Capacity Match'
                      : uploadedCount > agreedCapacity
                      ? `⚠️ Over Capacity by ${uploadedCount - agreedCapacity}`
                      : `ℹ️ Partial Roster (${uploadedCount}/${agreedCapacity})`}
                  </span>
                )}
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Enrolled Ingestion Progress</span>
                  <span className="font-bold text-slate-900 dark:text-white">{uploadedCount} of {agreedCapacity} Enrolled ({matchPct}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      uploadedCount === agreedCapacity
                        ? 'bg-emerald-500'
                        : uploadedCount > agreedCapacity
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(matchPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Status explanation */}
              {uploadedCount === 0 ? (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  <span>No student roster spreadsheet uploaded yet. Upload a CSV or click <strong>Load Realistic Roster</strong> above to begin.</span>
                </div>
              ) : uploadedCount === agreedCapacity ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Capacity Validated:</strong> The uploaded roster contains exactly <strong>{uploadedCount} students</strong>, fulfilling the institutional MOU capacity. All student records are ready for 1-click batch LMS account creation.
                  </span>
                </div>
              ) : uploadedCount > agreedCapacity ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Over-Capacity Notice:</strong> Uploaded roster has <strong>{uploadedCount} students</strong> ({uploadedCount - agreedCapacity} extra beyond the agreed {agreedCapacity} MOU quota). Per terms, additional students will be billed at standard discounted rate.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Partial Ingestion:</strong> {uploadedCount} of {agreedCapacity} students uploaded. School coordinator can upload additional sections later.
                  </span>
                </div>
              )}

              {/* Grade-by-grade Breakdown Chips */}
              {Object.keys(rosterData.classes_breakdown || {}).length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Class & Grade Distribution:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(rosterData.classes_breakdown).map(([grade, count]) => (
                      <div
                        key={grade}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{grade}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* File Ingestion Details Card if uploaded */}
            {rosterData.roster_file_name && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{rosterData.roster_file_name}</div>
                    <div className="text-[11px] text-slate-400">
                      Uploaded at: {rosterData.roster_uploaded_at ? new Date(rosterData.roster_uploaded_at).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('directory')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Directory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('provision')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Proceed to Provisioning</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: STUDENT & PARENT DIRECTORY ================= */}
        {activeTab === 'directory' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Search by student name, roll number, mobile, LMS ID..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grade Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Grade:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => { setSelectedGrade(e.target.value); setCurrentPage(1); }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                >
                  <option value="All">All Grades ({uploadedCount})</option>
                  {Object.keys(rosterData.classes_breakdown || {}).map(g => (
                    <option key={g} value={g}>{g} ({rosterData.classes_breakdown[g]})</option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Provisioned">Provisioned</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Export Button */}
              <a
                href={`/api/schools/${school?.id}/roster/export`}
                download={`${schoolName.replace(/\s+/g, '_')}_Student_Roster.csv`}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Roster CSV</span>
              </a>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No students found matching your criteria</p>
                  <p className="mt-1">Try adjusting your search filters or upload a student list in Tab 1.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Roll No</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Grade & Sec</th>
                      <th className="py-2.5 px-4">Parent Contact</th>
                      <th className="py-2.5 px-4">Skila LMS Username</th>
                      <th className="py-2.5 px-4">Temp Password</th>
                      <th className="py-2.5 px-4">Account Status</th>
                      <th className="py-2.5 px-4">Welcome Kit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((st, idx) => {
                      const isProvisioned = st.provision_status === 'Provisioned' || rosterData.accounts_provisioned;
                      const isWelcomeSent = st.welcome_dispatched || rosterData.welcome_kit_dispatched;

                      return (
                        <tr key={st.roll_number || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {st.roll_number || `SK-${1000 + idx}`}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {st.student_name}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              {st.class_grade} ({st.section || 'A'})
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="text-slate-900 dark:text-white font-medium flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-emerald-500" />
                              <span>{st.parent_phone}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">{st.parent_name || 'Parent'}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span>{st.lms_username || `skila.student.${idx + 1}`}</span>
                            <button
                              onClick={() => copyToClipboard(st.lms_username, `user-${idx}`)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy Username"
                            >
                              {copiedId === `user-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            <span>{st.temp_password || 'SkilaAI@2026'}</span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isProvisioned
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              <CheckCircle2 className={`w-3 h-3 ${isProvisioned ? 'text-emerald-500' : 'text-slate-400'}`} />
                              <span>{isProvisioned ? 'Provisioned' : 'Pending'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isWelcomeSent
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                            }`}>
                              <MessageSquare className="w-3 h-3" />
                              <span>{isWelcomeSent ? 'Dispatched' : 'Queued'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredStudents.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BATCH PROVISIONING & PARENT WELCOME KIT ================= */}
        {activeTab === 'provision' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Channels & Provisioning Control */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>1-Click LMS Batch Creation Engine</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Instantly creates live student profiles on the Skila.ai LMS, generates initial credentials, and triggers automated Welcome Kits to parents.
                  </p>
                </div>

                {/* Dispatch Channel Options */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Automated Dispatch Channels
                  </h4>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.whatsapp}
                      onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Business Cloud API (Recommended)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Official verified message with student credentials and one-click login link</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-indigo-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.sms}
                      onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Transactional SMS (DLT Approved Gateway)</span>
                      </div>
                      <div className="text-[11px] text-slate-400">High priority text message dispatched to parent primary mobile number</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-purple-400 transition-colors">
                    <input
                      type="checkbox"
                      checked={channels.email}
                      onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                        <span>Parent Welcome Email & Onboarding Guide</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Includes downloadable parent handbook & AI curriculum overview</div>
                    </div>
                  </label>
                </div>

                {/* Provisioning Action Button & Progress */}
                {isProvisioning ? (
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <span>{provisionStepText}</span>
                      <span>{provisionProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-indigo-200 dark:bg-indigo-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
                        style={{ width: `${provisionProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleBatchProvision}
                      disabled={uploadedCount === 0 || actionLoading}
                      className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5 text-amber-300" />
                      <span>
                        {rosterData.accounts_provisioned
                          ? `⚡ Re-Sync & Dispatch Parent Welcome Kits (${uploadedCount} Students)`
                          : `⚡ Provision All ${uploadedCount || agreedCapacity} Accounts & Dispatch Welcome Kits`}
                      </span>
                    </button>
                    <p className="text-[11px] text-center text-slate-400 mt-2">
                      Automatically marks Stage 3 Formalities as Complete and creates celebrations in Institutional Dashboard.
                    </p>
                  </div>
                )}

                {/* Post-provision celebration state */}
                {rosterData.accounts_provisioned && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>LMS Accounts Provisioned & Parent Kits Dispatched</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                      All {rosterData.accounts_provisioned_count || uploadedCount} students are officially registered in the Skila LMS database.
                      Parent Welcome notices were dispatched via {rosterData.welcome_kit_channels?.join(', ') || 'WhatsApp, SMS'}.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/api/schools/${school?.id}/roster/export`}
                        download={`${schoolName.replace(/\s+/g, '_')}_Credentials.csv`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Complete Credentials File</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Authentic WhatsApp Message Preview Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Parent WhatsApp Message Preview</span>
                  </h4>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                    Official Template
                  </span>
                </div>

                {/* WhatsApp Chat UI Mockup */}
                <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-[#EFEAE2] dark:bg-[#0b141a] p-4 shadow-inner space-y-3">
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-[#d1d7db] dark:border-[#202c33]">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      SK
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>Skila.ai Official</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-500 text-white" />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Institutional Partner Gateway</div>
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div className="bg-white dark:bg-[#1f2c34] p-4 rounded-xl shadow-xs text-xs text-slate-800 dark:text-slate-100 space-y-2 border-l-4 border-emerald-500 max-w-[95%]">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      🎓 Welcome to the Skila AI Learning Program!
                    </p>
                    
                    <p className="text-[11px] leading-relaxed">
                      Dear Parent, we are delighted to inform you that <strong>{schoolName}</strong> has partnered with <strong>Skila.ai</strong> to provide comprehensive Artificial Intelligence, Coding, and STEM education for the 2026-2027 academic session.
                    </p>

                    <div className="p-2.5 bg-slate-50 dark:bg-[#111b21] rounded-lg border border-slate-200 dark:border-[#2a3942] space-y-1 font-mono text-[11px]">
                      <div><strong>Student:</strong> Aarav Sharma (Grade 6-A)</div>
                      <div><strong>LMS Login:</strong> skila.{schoolName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6)}.1001</div>
                      <div><strong>Temp Password:</strong> SkilaAI@2026</div>
                      <div><strong>Portal URL:</strong> https://lms.skila.ai</div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      💡 Please log in with your child within 48 hours to complete student onboarding and diagnostic assessment.
                    </p>

                    <div className="text-[10px] text-slate-400 pt-1 text-right">
                      Delivered via WhatsApp Cloud Gateway • Just now ✓✓
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Compliant with DLT Telecom Regulations & TRAI Consent Framework for educational institutions.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Stage 3 Formalities Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full ${
              rosterData.roster_status === 'Verified'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                : rosterData.roster_status === 'Uploaded'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {rosterData.roster_status || 'Pending'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeTab !== 'provision' && (
              <button
                onClick={() => setActiveTab('provision')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Proceed to Provisioning</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
