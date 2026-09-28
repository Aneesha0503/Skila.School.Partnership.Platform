import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Building2, Cpu, DollarSign, MapPin, Phone, Mail, 
  Globe, User, CheckCircle2, XCircle, Edit3, Save, Sparkles, ExternalLink,
  Play, RefreshCw, Zap, Layers, Lock, ShieldCheck, UserCheck, ArrowLeft, Send, MessageSquare, AlertCircle,
  FileText, Clock, Tag, Bell, CheckCheck, Award, PartyPopper
} from 'lucide-react';
import SendEmailModal from './SendEmailModal';
import SendWhatsAppModal from './SendWhatsAppModal';
import { triggerDealCelebration } from '../utils/confetti';
import { formatRemarksToCleanText, getLeadStatusBadge } from '../utils/formatters';

export default function SchoolDetailModal({ 
  school, 
  onClose, 
  onUpdateSchool, 
  onOpenEditModal,
  userRole = 'admin',
  currentAgentName = 'Field Agent',
  initialTab = 'info',
  onTabChange,
  onOpenMOU,
  onOpenCertificate
}) {
  const formatRemarks = formatRemarksToCleanText;

  const [activeTab, setActiveTab] = useState(initialTab || 'info'); // 'info' | 'tech' | 'sales' | 'notes'
  const [agentNotes, setAgentNotes] = useState(school?.agent_notes || []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  useEffect(() => {
    if (school?.agent_notes) {
      setAgentNotes(school.agent_notes);
    } else {
      setAgentNotes([]);
    }
  }, [school?.agent_notes, school?.id]);

  // Note composer form state
  const [noteText, setNoteText] = useState('');
  const [noteAgentName, setNoteAgentName] = useState(userRole === 'agent' ? currentAgentName : 'Admin');
  const [noteBucket, setNoteBucket] = useState('Campus Visits & Demos');
  const [noteCategory, setNoteCategory] = useState('School Visit');
  const [noteUrgency, setNoteUrgency] = useState('Normal');
  const [noteActionRequired, setNoteActionRequired] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSubmitSuccess, setNoteSubmitSuccess] = useState('');
  const [noteSubmitError, setNoteSubmitError] = useState('');
  const noteTextareaRef = useRef(null);

  useEffect(() => {
    if (userRole === 'agent') {
      setNoteAgentName(currentAgentName);
    }
  }, [userRole, currentAgentName]);

  // STRICT AGENT PRIVACY ISOLATION:
  // Agents can ONLY see their own notes. Peer agent notes are completely redacted.
  const visibleAgentNotes = React.useMemo(() => {
    if (userRole === 'agent') {
      const active = (currentAgentName || '').trim().toLowerCase();
      return (agentNotes || []).filter((n) => (n.agent_name || '').trim().toLowerCase() === active);
    }
    return agentNotes || [];
  }, [agentNotes, userRole, currentAgentName]);

  // Note history filters
  const [historyAgentFilter, setHistoryAgentFilter] = useState('All');
  const [historyBucketFilter, setHistoryBucketFilter] = useState('All');

  const uniqueNoteAgents = React.useMemo(() => {
    const set = new Set();
    visibleAgentNotes.forEach((n) => {
      if (n.agent_name && n.agent_name.trim()) set.add(n.agent_name.trim());
    });
    return Array.from(set).sort();
  }, [visibleAgentNotes]);

  const uniqueNoteBuckets = React.useMemo(() => {
    const set = new Set();
    visibleAgentNotes.forEach((n) => {
      if (n.bucket && n.bucket.trim()) set.add(n.bucket.trim());
    });
    return Array.from(set).sort();
  }, [visibleAgentNotes]);

  const filteredAgentNotes = React.useMemo(() => {
    return visibleAgentNotes.filter((n) => {
      if (userRole === 'admin' && historyAgentFilter !== 'All' && (n.agent_name || '').toLowerCase() !== historyAgentFilter.toLowerCase()) {
        return false;
      }
      if (historyBucketFilter !== 'All' && (n.bucket || 'Campus Visits & Demos').toLowerCase() !== historyBucketFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [visibleAgentNotes, userRole, historyAgentFilter, historyBucketFilter]);

  const [leadStatus, setLeadStatus] = useState(school?.sales?.lead_status || 'New');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [interestLevel, setInterestLevel] = useState(school?.sales?.interest_level || 'Medium');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(school?.sales?.next_follow_up_date || '');
  const [salesOwner, setSalesOwner] = useState(school?.sales?.sales_owner || '');
  const [remarks, setRemarks] = useState(() => formatRemarks(school?.sales?.remarks));
  const [isDealClosed, setIsDealClosed] = useState(() => {
    return Boolean(school?.sales?.deal_closed || school?.sales?.lead_status === 'Closed Won');
  });
  const [isTogglingDeal, setIsTogglingDeal] = useState(false);
  const [dealCelebrationBanner, setDealCelebrationBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichSuccess, setEnrichSuccess] = useState(false);
  const [isRunningDetails, setIsRunningDetails] = useState(false);
  const [runDetailsError, setRunDetailsError] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  // Formalities State & Sync
  const initialFormalities = school?.formalities || school?.sales?.formalities || {};
  const [formalities, setFormalities] = useState(initialFormalities);
  const [isSavingFormalities, setIsSavingFormalities] = useState(false);
  const [formalitiesSuccess, setFormalitiesSuccess] = useState('');
  const [formalitiesError, setFormalitiesError] = useState('');

  useEffect(() => {
    if (school?.id) {
      fetch(`/api/schools/${school.id}/formalities`, {
        headers: {
          'X-User-Role': userRole,
          'X-Agent-Name': currentAgentName
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setFormalities(data);
          }
        })
        .catch(err => console.error('Error loading formalities:', err));
    }
  }, [school?.id]);

  const handleFormalitiesFieldChange = (field, value) => {
    setFormalities(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveFormalities = async (e) => {
    if (e) e.preventDefault();
    setIsSavingFormalities(true);
    setFormalitiesSuccess('');
    setFormalitiesError('');

    try {
      const res = await fetch(`/api/schools/${school.id}/formalities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-Agent-Name': currentAgentName
        },
        body: JSON.stringify(formalities)
      });

      if (!res.ok) {
        throw new Error('Failed to update formalities');
      }

      const updated = await res.json();
      setFormalities(updated);
      setFormalitiesSuccess('Formalities updated and synchronized successfully!');

      if (updated.progress_pct >= 100 || updated.formalities_completed) {
        triggerDealCelebration();
      }

      if (onUpdateSchool) {
        onUpdateSchool({
          ...school,
          formalities: updated,
          sales: {
            ...(school.sales || {}),
            formalities: updated
          }
        });
      }

      setTimeout(() => setFormalitiesSuccess(''), 4000);
    } catch (err) {
      setFormalitiesError(err.message || 'Error saving formalities');
    } finally {
      setIsSavingFormalities(false);
    }
  };

  const scrollContainerRef = useRef(null);
  const remarksTextareaRef = useRef(null);

  const handleSaveAndSubmitNote = async (e) => {
    if (e) e.preventDefault();
    if (!noteText.trim()) {
      setNoteSubmitError('Please enter note text before submitting.');
      return;
    }
    setIsSubmittingNote(true);
    setNoteSubmitError('');
    setNoteSubmitSuccess('');

    const effectiveAgentName = userRole === 'agent' ? currentAgentName : (noteAgentName.trim() || 'Admin');

    try {
      const res = await fetch(`/api/schools/${school.id}/agent-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-Agent-Name': currentAgentName
        },
        body: JSON.stringify({
          agent_name: effectiveAgentName,
          bucket: noteBucket,
          category: noteCategory,
          urgency: noteUrgency,
          text: noteText.trim(),
          action_required: noteActionRequired.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.school) {
          onUpdateSchool(data.school);
          setAgentNotes(data.school.agent_notes || []);
        } else if (data.note) {
          setAgentNotes((prev) => [data.note, ...prev]);
        }
        setNoteText('');
        setNoteActionRequired('');
        setNoteSubmitSuccess(`Field update saved to bucket "${noteBucket}" successfully! Admin alert has been dispatched.`);
        setTimeout(() => setNoteSubmitSuccess(''), 5000);
      } else {
        const err = await res.json().catch(() => ({}));
        setNoteSubmitError(err.detail || 'Failed to submit field update.');
      }
    } catch (err) {
      console.error('Submit agent note error:', err);
      setNoteSubmitError('Network error while saving field note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Synchronize local CRM form state whenever school updates or changes
  useEffect(() => {
    if (school?.sales) {
      setLeadStatus(school.sales.lead_status || 'New');
      setInterestLevel(school.sales.interest_level || 'Medium');
      setNextFollowUpDate(school.sales.next_follow_up_date || '');
      setSalesOwner(school.sales.sales_owner || '');
      setRemarks(formatRemarks(school.sales.remarks));
      setIsDealClosed(Boolean(school.sales.deal_closed || school.sales.lead_status === 'Closed Won'));
      setSaveError('');
      setSaveSuccess(false);
    }
  }, [school?.id, school?.sales?.deal_closed, school?.sales?.lead_status]);

  const handleToggleDealClosed = async (e) => {
    const nextState = e ? e.target.checked : !isDealClosed;
    setIsDealClosed(nextState);

    if (nextState) {
      setLeadStatus('Closed Won');
      setDealCelebrationBanner(true);
      triggerDealCelebration();
    } else {
      setDealCelebrationBanner(false);
      if (leadStatus === 'Closed Won') {
        setLeadStatus('Proposal Shared');
      }
    }

    setIsTogglingDeal(true);
    try {
      const res = await fetch(`/api/schools/${school.id}/toggle-deal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-Agent-Name': currentAgentName
        },
        body: JSON.stringify({ deal_closed: nextState })
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdateSchool(updated);
      } else {
        const updatedPayload = {
          hierarchy: school.hierarchy,
          info: school.info,
          technology: school.technology,
          sales: {
            ...school.sales,
            deal_closed: nextState,
            deal_closed_at: nextState ? new Date().toISOString() : '',
            deal_closed_by: nextState ? (userRole === 'agent' ? currentAgentName : 'Admin') : '',
            lead_status: nextState ? 'Closed Won' : (leadStatus === 'Closed Won' ? 'Proposal Shared' : leadStatus)
          }
        };
        const putRes = await fetch(`/api/schools/${school.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': userRole,
            'X-Agent-Name': currentAgentName
          },
          body: JSON.stringify(updatedPayload)
        });
        if (putRes.ok) {
          const saved = await putRes.json();
          onUpdateSchool(saved);
        }
      }
    } catch (err) {
      console.error('Error toggling deal closed:', err);
    } finally {
      setIsTogglingDeal(false);
    }
  };

  const handleLeadStatusChange = async (newStatus) => {
    setLeadStatus(newStatus);
    setIsUpdatingStatus(true);
    setStatusUpdateMessage('');

    if (newStatus === 'Closed Won') {
      setIsDealClosed(true);
      setDealCelebrationBanner(true);
      triggerDealCelebration();
    } else if (isDealClosed) {
      setIsDealClosed(false);
      setDealCelebrationBanner(false);
    }

    try {
      const res = await fetch(`/api/schools/${school.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': userRole,
          'X-Agent-Name': currentAgentName
        },
        body: JSON.stringify({ lead_status: newStatus })
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdateSchool(updated);
        setStatusUpdateMessage('Saved');
        setTimeout(() => setStatusUpdateMessage(''), 2500);
      } else {
        // Fallback: update via general school PUT endpoint
        const updatedPayload = {
          hierarchy: school.hierarchy,
          info: school.info,
          technology: school.technology,
          sales: {
            ...school.sales,
            lead_status: newStatus,
            deal_closed: newStatus === 'Closed Won',
            deal_closed_at: newStatus === 'Closed Won' ? (school.sales?.deal_closed_at || new Date().toISOString()) : '',
            deal_closed_by: newStatus === 'Closed Won' ? (school.sales?.deal_closed_by || (userRole === 'agent' ? currentAgentName : 'Admin')) : ''
          }
        };
        const putRes = await fetch(`/api/schools/${school.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Role': userRole,
            'X-Agent-Name': currentAgentName
          },
          body: JSON.stringify(updatedPayload)
        });
        if (putRes.ok) {
          const saved = await putRes.json();
          onUpdateSchool(saved);
          setStatusUpdateMessage('Saved');
          setTimeout(() => setStatusUpdateMessage(''), 2500);
        }
      }
    } catch (err) {
      console.error('Error updating school status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Auto-resize remarks textarea so notes are completely visible and never restricted
  useEffect(() => {
    if (remarksTextareaRef.current && activeTab === 'sales') {
      remarksTextareaRef.current.style.height = 'auto';
      const scrollH = remarksTextareaRef.current.scrollHeight;
      remarksTextareaRef.current.style.height = `${Math.max(260, scrollH + 4)}px`;
    }
  }, [remarks, activeTab]);

  const handleRemarksChange = (e) => {
    setRemarks(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.max(260, e.target.scrollHeight + 4)}px`;
  };

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

  const parseErrorMessage = (err, fallback = 'Failed to save CRM updates.') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (typeof err.detail === 'string') return err.detail;
    if (Array.isArray(err.detail)) {
      return err.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] : 'field'}: ${d.msg}`).join(', ');
    }
    if (err.message && typeof err.message === 'string') return err.message;
    return fallback;
  };

  const handleQuickSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
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
          remarks: remarks,
          deal_closed: isDealClosed,
          deal_closed_at: isDealClosed ? (school.sales?.deal_closed_at || new Date().toISOString()) : '',
          deal_closed_by: isDealClosed ? (school.sales?.deal_closed_by || (userRole === 'agent' ? currentAgentName : 'Admin')) : ''
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
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(parseErrorMessage(err));
      }
    } catch (err) {
      console.error('Error saving sales update:', err);
      setSaveError(err.message || 'Network error while saving CRM updates.');
    } finally {
      setIsSaving(false);
    }
  };

  const getTierBadge = (tierObj) => {
    const t = tierObj?.tier || '';
    if (t === 'High Range') {
      return {
        label: '👑 High Range',
        className: 'bg-purple-500/20 text-purple-200 border-purple-500/30'
      };
    } else if (t === 'State Board - High Strength') {
      return {
        label: '🔷 State Board (High Strength)',
        className: 'bg-blue-500/20 text-blue-200 border-blue-500/30'
      };
    } else if (t === 'State Board - Mid Strength') {
      return {
        label: '🔶 State Board (Mid Strength)',
        className: 'bg-amber-500/20 text-amber-200 border-amber-500/30'
      };
    } else if (t === 'State Board - Low Strength') {
      return {
        label: '⚪ State Board (<500)',
        className: 'bg-slate-700/60 text-slate-300 border-slate-600'
      };
    }
    return null;
  };

  const tierBadge = getTierBadge(school.tier);

  const getCleanLocation = () => {
    const locality = hierarchy?.village_locality_ward || hierarchy?.local_body_name || '';
    const district = hierarchy?.district || '';
    const state = hierarchy?.state || '';
    const pin = info?.pincode ? ` • ${info.pincode}` : '';

    const parts = [];
    if (locality) parts.push(locality);
    if (district && !locality.toLowerCase().includes(district.toLowerCase())) {
      parts.push(district);
    }
    if (state) parts.push(state);
    return (parts.join(', ') + pin) || info?.full_address || 'Location unavailable';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col w-screen h-screen overflow-hidden select-text animate-in fade-in duration-150">
      
      {/* Minimal Sticky Modal Header */}
      <div className="bg-slate-900 text-white shrink-0 border-b border-slate-800 shadow-sm z-20">
        <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto px-3.5 sm:px-8 py-2.5 sm:py-3.5">
          <div className="flex flex-col gap-2.5">
            {/* Top Bar on Mobile / Desktop */}
            <div className="flex items-center justify-between gap-2">
              {/* Backward Navigation: Back to Directory */}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs group"
                title="Back to Schools Directory (or press Browser Back / Esc)"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Back to Directory</span>
                <span className="sm:hidden">Back</span>
              </button>

              {/* Right: Direct Actions & Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {userRole === 'admin' && (
                  <button
                    onClick={() => onOpenEditModal(school)}
                    className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                    title="Edit School Data"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}

                <button
                  onClick={handleAiEnrich}
                  disabled={isEnriching}
                  title="Generate AI sales strategy"
                  className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">
                    {isEnriching ? 'Analyzing...' : enrichSuccess ? 'Pitch Ready' : 'AI Pitch'}
                  </span>
                </button>

                <button
                  onClick={() => setEmailModalOpen(true)}
                  title="Send Proposal Email"
                  className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Email</span>
                </button>

                <button
                  onClick={() => setWhatsappModalOpen(true)}
                  title="Send WhatsApp Message"
                  className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                <div className="h-4 w-px bg-slate-800 mx-0.5 sm:mx-1 hidden sm:block" />

                <button
                  onClick={onClose}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1.5"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
                  <span className="hidden sm:inline">Close</span>
                </button>
              </div>
            </div>

            {/* School Identity & Key Meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white truncate max-w-full">
                  {info?.school_name}
                </h2>
                {tierBadge && (
                  <span className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 rounded-full border font-semibold ${tierBadge.className}`}>
                    {tierBadge.label}
                  </span>
                )}
                {info?.board && (
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                    {info.board}
                  </span>
                )}
                {info?.udise_code && (
                  <span className="font-mono text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/80">
                    UDISE: <span className="text-slate-100 font-semibold">{info.udise_code}</span>
                  </span>
                )}

                {/* Deal Confirmed and Closed Header Checkbox Badge */}
                <label 
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer select-none shadow-2xs ${
                    isDealClosed
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-emerald-500/60'
                  }`}
                  title={isDealClosed ? "Deal Confirmed and Closed! Click to uncheck." : "Click to mark Deal Confirmed and Closed"}
                >
                  <input
                    type="checkbox"
                    checked={isDealClosed}
                    onChange={handleToggleDealClosed}
                    disabled={isTogglingDeal}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-900 border-slate-600 focus:ring-emerald-400 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[11px] sm:text-xs">{isDealClosed ? '🏆 Deal Confirmed' : 'Deal Confirmed'}</span>
                </label>

                {!isDealClosed && (() => {
                  const badge = getLeadStatusBadge(leadStatus, false);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] sm:text-xs font-bold shadow-2xs ${badge.className}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Clean single-line Location */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{getCleanLocation()}</span>
              </div>
            </div>
          </div>

          {/* Minimal Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 pt-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => handleTabClick('info')}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>School Information</span>
            </button>

            <button
              onClick={() => handleTabClick('tech')}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                activeTab === 'tech'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Technology Usage</span>
            </button>

            <button
              onClick={() => handleTabClick('sales')}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                activeTab === 'sales'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Sales & CRM Pipeline</span>
            </button>

            <button
              onClick={() => handleTabClick('notes')}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Field Notes & Updates</span>
              {visibleAgentNotes.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'notes' 
                    ? 'bg-indigo-700/80 text-white' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {visibleAgentNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabClick('formalities')}
              className={`shrink-0 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                activeTab === 'formalities'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Partnership Formalities</span>
              {isDealClosed && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  (formalities?.progress_pct >= 100 || formalities?.formalities_completed)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {(formalities?.progress_pct >= 100 || formalities?.formalities_completed) ? '100%' : `${formalities?.progress_pct || 20}%`}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Deal Closure Confetti Notification Banner */}
      {dealCelebrationBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white px-3.5 sm:px-8 py-2.5 sm:py-3 shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl animate-bounce">🎉</span>
            <div>
              <div className="font-extrabold text-xs sm:text-sm flex items-center gap-2">
                <span>Deal Confirmed and Closed!</span>
                <span className="text-[10px] sm:text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">🏆 Closed Won</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-100">
                Congratulations! {info?.school_name} partnership has been officially confirmed and closed.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerDealCelebration()}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] sm:text-xs font-bold transition cursor-pointer"
            >
              More Confetti 🎊
            </button>
            <button
              type="button"
              onClick={() => setDealCelebrationBanner(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Modal Body with Smooth Momentum Scroll */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain scroll-smooth bg-slate-50/80 dark:bg-slate-950"
      >
        <div className="w-full max-w-7xl 2xl:max-w-[1700px] mx-auto p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-28">
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
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Official Mobile</span>
                            <button
                              type="button"
                              onClick={() => setWhatsappModalOpen(true)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
                              title="Send WhatsApp pitch"
                            >
                              <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                            </button>
                          </div>
                          <a href={`tel:${info?.mobile}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 text-sm">
                            <Phone className="w-3.5 h-3.5" /> {info?.mobile || '—'}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWhatsappModalOpen(true)}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          title="Open WhatsApp pitch composer"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp Principal
                        </button>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Official Email</span>
                            <button
                              type="button"
                              onClick={() => setEmailModalOpen(true)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                              title="Send partnership proposal email"
                            >
                              <Send className="w-2.5 h-2.5" /> Send Mail
                            </button>
                          </div>
                          <a href={`mailto:${info?.email}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 truncate text-xs">
                            <Mail className="w-3.5 h-3.5 shrink-0" /> {info?.email || '—'}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailModalOpen(true)}
                          className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                          title="Compose and send contextual proposal email"
                        >
                          <Send className="w-3 h-3" /> Send Partnership Email
                        </button>
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
              {/* Top: Deal Confirmed and Closed Dedicated Milestone Card */}
              <div className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 shadow-xs ${
                isDealClosed
                  ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border-emerald-300 dark:border-emerald-700/70 shadow-emerald-500/5'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <label className="relative flex items-center justify-center cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={isDealClosed}
                        onChange={handleToggleDealClosed}
                        disabled={isTogglingDeal}
                        className="w-6 h-6 rounded-lg text-emerald-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer accent-emerald-600 transition"
                      />
                    </label>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Deal Confirmed and Closed</span>
                          {isDealClosed && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                              <span>🏆</span> Partnership Finalized
                            </span>
                          )}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {isDealClosed
                          ? "This school partnership is officially confirmed, signed, and closed! Lead status is marked as Closed Won."
                          : "Check this box once the school administration has agreed, confirmed, or signed the Skila partnership deal."}
                      </p>

                      {isDealClosed && (
                        <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                          <span className="text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                            <span>🎉</span> Closed by {sales?.deal_closed_by || (userRole === 'agent' ? currentAgentName : 'Admin')}
                          </span>
                          {sales?.deal_closed_at && (
                            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              Confirmed: {new Date(sales.deal_closed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isDealClosed && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTabClick('formalities')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        title="Proceed to Partnership Formalities (MOU, Invoicing, Onboarding)"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Manage Formalities ({formalities?.progress_pct ?? 20}%)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerDealCelebration()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm hover:shadow transition inline-flex items-center gap-2 cursor-pointer"
                        title="Trigger celebratory confetti!"
                      >
                        <span>🎉</span>
                        <span>Celebrate!</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sales Opportunity & Decision Maker Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-3">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Commercial Opportunity & Decision Maker</span>
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-indigo-50/80 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">Status:</span>
                      <select
                        value={leadStatus}
                        onChange={(e) => handleLeadStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="text-xs font-bold bg-transparent text-indigo-900 dark:text-indigo-200 focus:outline-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="New" className="dark:bg-slate-900 dark:text-slate-100">New</option>
                        <option value="Contacted" className="dark:bg-slate-900 dark:text-slate-100">Contacted</option>
                        <option value="Demo Scheduled" className="dark:bg-slate-900 dark:text-slate-100">Demo Scheduled</option>
                        <option value="Proposal Shared" className="dark:bg-slate-900 dark:text-slate-100">Proposal Shared</option>
                        <option value="Pilot Started" className="dark:bg-slate-900 dark:text-slate-100">Pilot Started</option>
                        <option value="Closed Won" className="dark:bg-slate-900 dark:text-slate-100">Closed Won</option>
                        <option value="Closed Lost" className="dark:bg-slate-900 dark:text-slate-100">Closed Lost</option>
                      </select>
                      {isUpdatingStatus ? (
                        <RefreshCw className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-spin ml-0.5" />
                      ) : statusUpdateMessage ? (
                        <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 animate-in fade-in ml-0.5">
                          ✓ Saved
                        </span>
                      ) : null}
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
                      onChange={(e) => handleLeadStatusChange(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="New">✨ New</option>
                      <option value="Contacted">📞 Contacted</option>
                      <option value="Demo Scheduled">📅 Demo Scheduled</option>
                      <option value="Proposal Shared">📄 Proposal Shared</option>
                      <option value="Pilot Started">🚀 Pilot Started</option>
                      <option value="Closed Won">🏆 Closed Won</option>
                      <option value="Closed Lost">❌ Closed Lost</option>
                      {['Meeting Scheduled', 'Demo Completed', 'Pilot Running', 'Not Interested'].includes(leadStatus) && (
                        <option value={leadStatus}>{leadStatus}</option>
                      )}
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
                      placeholder="Enter representative name..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Remarks & Notes */}
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Interaction Remarks & Strategy Notes
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRemarks(formatRemarks(remarks))}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer flex items-center gap-1"
                      title="Format raw JSON or unformatted notes into clean, bulleted text"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Clean / Format Text</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      Auto-expands to full content • Resizable
                    </span>
                  </div>
                </div>
                <textarea
                  ref={remarksTextareaRef}
                  value={remarks}
                  onChange={handleRemarksChange}
                  placeholder="Record meeting outcomes, principal/correspondent feedback, budget constraints, next steps..."
                  className="w-full text-xs sm:text-[13px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition mb-4 font-sans leading-relaxed resize-y min-h-[260px]"
                />

                {saveError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSaveError('')}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-bold cursor-pointer px-2 py-0.5"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

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

          {/* TAB 4: AGENT FIELD NOTES & INSTITUTIONAL UPDATES */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Top: New Field Note Composer Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Log Agent Field Note & Institutional Update</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Record call takeaways, visit observations, or pipeline progress. Submitting dispatches an alert to the Admin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      <Bell className="w-3 h-3 text-indigo-500" />
                      Admin Alert Automated
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveAndSubmitNote} className="space-y-4">
                  {/* Meta row: Agent Name, Target Bucket, Category, Urgency */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Agent Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Reporting Agent / Author</span>
                        {userRole === 'agent' && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </label>
                      {userRole === 'agent' ? (
                        <div className="w-full text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-2.5 font-bold flex items-center gap-1.5">
                          <span>💼</span>
                          <span>{currentAgentName}</span>
                          <span className="ml-auto text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            Active Identity
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={noteAgentName}
                          onChange={(e) => setNoteAgentName(e.target.value)}
                          placeholder="Enter agent name..."
                          className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Target Bucket Selector */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Save to Bucket</span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Bucket</span>
                      </label>
                      <select
                        value={noteBucket}
                        onChange={(e) => setNoteBucket(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Campus Visits & Demos">🏫 Campus Visits & Demos</option>
                        <option value="Lead Qualification & Scouting">🎯 Lead Qualification & Scouting</option>
                        <option value="Commercials & Budget Discussion">💼 Commercials & Budget Discussion</option>
                        <option value="Follow-up & Pipeline Progress">⏳ Follow-up & Pipeline Progress</option>
                        <option value="Blocker & Escalation">⚠️ Blocker & Escalation</option>
                        <option value="General Field Intel">📝 General Field Intel</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Update Category
                      </label>
                      <select
                        value={noteCategory}
                        onChange={(e) => setNoteCategory(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="School Visit">🏫 School Visit</option>
                        <option value="Principal Call">📞 Principal / Management Call</option>
                        <option value="Demo Feedback">💻 Demo & Presentation Feedback</option>
                        <option value="Follow-up Required">⏳ Follow-up Required</option>
                        <option value="Pricing / Budget">💰 Pricing & Proposal Discussion</option>
                        <option value="Blocker / Issue">⚠️ Blocker / Concern Raised</option>
                        <option value="General Note">📝 General Field Note</option>
                      </select>
                    </div>

                    {/* Urgency */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Priority / Urgency
                      </label>
                      <select
                        value={noteUrgency}
                        onChange={(e) => setNoteUrgency(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Normal">🟢 Normal</option>
                        <option value="Important">🟡 Important (Needs Attention)</option>
                        <option value="Urgent Action Required">🔴 Urgent Action Required</option>
                      </select>
                    </div>
                  </div>

                  {/* Main Note Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Update Notes & Meeting Summary <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      ref={noteTextareaRef}
                      value={noteText}
                      onChange={(e) => {
                        setNoteText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.max(100, e.target.scrollHeight)}px`;
                      }}
                      placeholder="Write detailed notes here: What was discussed, who did you meet, specific feedback on Skila AI, budget, key requirements, or immediate next steps..."
                      rows={4}
                      className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-3 font-normal focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed transition resize-none placeholder-slate-400"
                    />
                  </div>

                  {/* Optional Action Item */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Immediate Action Required (Optional)
                    </label>
                    <input
                      type="text"
                      value={noteActionRequired}
                      onChange={(e) => setNoteActionRequired(e.target.value)}
                      placeholder="e.g. Admin needs to approve custom pricing by Thursday, or send demo recording..."
                      className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
                    />
                  </div>

                  {/* Status / Feedback messages */}
                  {noteSubmitError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{noteSubmitError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNoteSubmitError('')}
                        className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {noteSubmitSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{noteSubmitSuccess}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !noteText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingNote ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving to Bucket & Alerting Admin...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Save & Submit Update (Alert Admin)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom: Historical Updates Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Field Notes & Updates History
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {visibleAgentNotes.length} {visibleAgentNotes.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>

                  {/* Filter controls by Agent and Bucket */}
                  {visibleAgentNotes.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Agent Filter - Only visible to Admin */}
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">Agent:</span>
                          <select
                            value={historyAgentFilter}
                            onChange={(e) => setHistoryAgentFilter(e.target.value)}
                            className="text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                          >
                            <option value="All">All Agents</option>
                            {uniqueNoteAgents.map((ag) => (
                              <option key={ag} value={ag}>{ag}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Bucket Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">Bucket:</span>
                        <select
                          value={historyBucketFilter}
                          onChange={(e) => setHistoryBucketFilter(e.target.value)}
                          className="text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
                        >
                          <option value="All">All Buckets</option>
                          {uniqueNoteBuckets.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {visibleAgentNotes.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {userRole === 'agent' ? 'No Field Notes Logged by You Yet' : 'No Field Notes Logged Yet'}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      {userRole === 'agent'
                        ? `You have not recorded any field updates for ${info?.school_name || 'this school'} yet. Use the form above to record your meeting notes or updates.`
                        : `Use the form above to record your first field note or update for ${info?.school_name || 'this school'}. All logged updates trigger an alert to the administrator.`}
                    </p>
                  </div>
                ) : filteredAgentNotes.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">No notes match the selected agent or bucket filter.</p>
                    <button
                      type="button"
                      onClick={() => { setHistoryAgentFilter('All'); setHistoryBucketFilter('All'); }}
                      className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredAgentNotes.map((note, index) => {
                      const isUrgent = note.urgency === 'Urgent Action Required';
                      const isImportant = note.urgency === 'Important';
                      const formattedTime = note.timestamp
                        ? new Date(note.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })
                        : 'Recently';

                      return (
                        <div
                          key={note.id || index}
                          className={`p-4 rounded-xl border transition ${
                            isUrgent
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                              : isImportant
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                {note.agent_name || 'Field Agent'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                                🗂️ {note.bucket || 'Campus Visits & Demos'}
                              </span>
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                {note.category || 'General Note'}
                              </span>
                              {isUrgent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                                  🔴 Urgent Action
                                </span>
                              )}
                              {isImportant && !isUrgent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  🟡 Important
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formattedTime}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCheck className="w-3 h-3" /> Admin Alerted
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {note.text}
                          </div>

                          {note.action_required && (
                            <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span><strong>Action:</strong> {note.action_required}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PARTNERSHIP FORMALITIES & ONBOARDING */}
          {activeTab === 'formalities' && (
            <div className="space-y-6">
              {!isDealClosed ? (
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-3xl p-8 sm:p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto text-3xl shadow-inner">
                    🏆
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Deal Confirmation Required
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                      Partnership formalities (MOU legal drafting, invoicing, institutional SPOC assignment, and official certification) are unlocked once the partnership deal has been confirmed and closed.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleToggleDealClosed}
                      disabled={isTogglingDeal}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>🏆</span>
                      <span>Confirm & Close Deal Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Progress & Milestone Header */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-emerald-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/30 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Partnership Onboarding & Formalities</span>
                          </h3>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            (formalities?.progress_pct >= 100 || formalities?.formalities_completed)
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          }`}>
                            {(formalities?.progress_pct >= 100 || formalities?.formalities_completed) ? '🎓 100% Active Partner' : `In Progress • ${formalities?.progress_pct || 20}%`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Track formal agreement execution, commercials, designated institutional coordinator, and campus launch readiness.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onOpenMOU && (
                          <button
                            type="button"
                            onClick={() => onOpenMOU(school, formalities)}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title="View official formal Memorandum of Understanding"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Preview MOU</span>
                          </button>
                        )}

                        {onOpenCertificate && (
                          <button
                            type="button"
                            onClick={() => onOpenCertificate(school, formalities)}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Generate Official Skila AI Certificate of Partnership"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Certificate</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span>Overall Formalities Progress</span>
                          <span className="text-[10px] text-slate-400 font-normal">({formalities?.progress_pct || 20}% of 5 stages completed)</span>
                        </span>
                        <span className={(formalities?.progress_pct >= 100 || formalities?.formalities_completed) ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400'}>
                          {formalities?.progress_pct || 20}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            (formalities?.progress_pct >= 100 || formalities?.formalities_completed)
                              ? 'bg-emerald-500' 
                              : 'bg-gradient-to-r from-amber-500 to-indigo-500'
                          }`}
                          style={{ width: `${formalities?.progress_pct || 20}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Banners */}
                  {formalitiesSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{formalitiesSuccess}</span>
                    </div>
                  )}

                  {formalitiesError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{formalitiesError}</span>
                    </div>
                  )}

                  {/* 5-Stage Step Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">1. Deal Closed</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Won & Confirmed</div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border flex items-center gap-2 ${
                      ['Signed by School', 'Fully Executed'].includes(formalities?.mou_status)
                        ? 'border-emerald-300 dark:border-emerald-700/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        ['Signed by School', 'Fully Executed'].includes(formalities?.mou_status)
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {['Signed by School', 'Fully Executed'].includes(formalities?.mou_status) ? '✓' : '2'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">2. Legal MOU</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formalities?.mou_status || 'Drafting'}</div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border flex items-center gap-2 ${
                      formalities?.invoice_status === 'Fully Paid'
                        ? 'border-emerald-300 dark:border-emerald-700/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        formalities?.invoice_status === 'Fully Paid'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {formalities?.invoice_status === 'Fully Paid' ? '✓' : '3'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">3. Commercials</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formalities?.invoice_status || 'Pending'}</div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border flex items-center gap-2 ${
                      formalities?.roster_status === 'Verified'
                        ? 'border-emerald-300 dark:border-emerald-700/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        formalities?.roster_status === 'Verified'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {formalities?.roster_status === 'Verified' ? '✓' : '4'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">4. SPOC & Roster</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formalities?.roster_status || 'Pending'}</div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border flex items-center gap-2 col-span-2 sm:col-span-1 ${
                      formalities?.lab_readiness === 'Verified Ready' && formalities?.teacher_training_status === 'Completed'
                        ? 'border-emerald-300 dark:border-emerald-700/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        formalities?.lab_readiness === 'Verified Ready' && formalities?.teacher_training_status === 'Completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {formalities?.lab_readiness === 'Verified Ready' && formalities?.teacher_training_status === 'Completed' ? '✓' : '5'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px] truncate">5. Lab & Launch</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formalities?.teacher_training_status || 'Scheduled'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Agreement & Legal MOU */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>Stage 1: Legal Memorandum of Understanding (MOU)</span>
                      </h4>
                      {onOpenMOU && (
                        <button
                          type="button"
                          onClick={() => onOpenMOU(school, formalities)}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Printable MOU</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">MOU Reference Number</label>
                        <input
                          type="text"
                          value={formalities.mou_number || ''}
                          onChange={(e) => handleFormalitiesFieldChange('mou_number', e.target.value)}
                          placeholder="SKILA-MOU-2026-XXXX"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Execution Date</label>
                        <input
                          type="date"
                          value={formalities.mou_date || ''}
                          onChange={(e) => handleFormalitiesFieldChange('mou_date', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">MOU Execution Status</label>
                        <select
                          value={formalities.mou_status || 'Drafting'}
                          onChange={(e) => handleFormalitiesFieldChange('mou_status', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Drafting">Drafting Agreement</option>
                          <option value="Sent for Signing">Sent to Principal / Signatory</option>
                          <option value="Signed by School">Signed by School</option>
                          <option value="Fully Executed">Fully Executed & Countersigned</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Authorized School Signatory</label>
                        <input
                          type="text"
                          value={formalities.mou_signatory_name || ''}
                          onChange={(e) => handleFormalitiesFieldChange('mou_signatory_name', e.target.value)}
                          placeholder="Principal / Correspondent Name"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Signatory Designation</label>
                        <input
                          type="text"
                          value={formalities.mou_signatory_designation || 'Principal'}
                          onChange={(e) => handleFormalitiesFieldChange('mou_signatory_designation', e.target.value)}
                          placeholder="Principal / Director / Trustee"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Agreement Tenure Validity</label>
                        <input
                          type="text"
                          value={formalities.mou_validity || 'June 2026 - May 2027'}
                          onChange={(e) => handleFormalitiesFieldChange('mou_validity', e.target.value)}
                          placeholder="June 2026 – May 2027"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Commercial Terms & Invoicing */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>Stage 2: Commercial Clearance & Invoicing</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Agreed Annual Contract Value</label>
                        <input
                          type="text"
                          value={formalities.contract_value || ''}
                          onChange={(e) => handleFormalitiesFieldChange('contract_value', e.target.value)}
                          placeholder="₹2,50,000"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Structure</label>
                        <select
                          value={formalities.payment_terms || 'Annual Upfront'}
                          onChange={(e) => handleFormalitiesFieldChange('payment_terms', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          <option value="Annual Upfront">100% Annual Upfront</option>
                          <option value="50-50 Split">50% Advance / 50% Post-Launch</option>
                          <option value="Quarterly">Quarterly Installments</option>
                          <option value="Per Student">Per Student License Model</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Invoicing Status</label>
                        <select
                          value={formalities.invoice_status || 'Pending Invoice'}
                          onChange={(e) => handleFormalitiesFieldChange('invoice_status', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer"
                        >
                          <option value="Pending Invoice">Pending Invoice Generation</option>
                          <option value="Invoice Dispatched">Invoice Sent to School Accounts</option>
                          <option value="Advance Paid">Partial Advance Received</option>
                          <option value="Fully Paid">100% Paid & Cleared</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Invoice Number</label>
                        <input
                          type="text"
                          value={formalities.invoice_number || ''}
                          onChange={(e) => handleFormalitiesFieldChange('invoice_number', e.target.value)}
                          placeholder="INV-SKILA-2026-XXXX"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Payment Reference / UTR No.</label>
                        <input
                          type="text"
                          value={formalities.payment_ref_no || ''}
                          onChange={(e) => handleFormalitiesFieldChange('payment_ref_no', e.target.value)}
                          placeholder="UTR / Cheque / Transaction ID"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Partnership Tier Category</label>
                        <select
                          value={formalities.partnership_tier || 'Skila AI Pioneer Partner'}
                          onChange={(e) => handleFormalitiesFieldChange('partnership_tier', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          <option value="Skila AI Pioneer Partner">👑 Skila AI Pioneer Partner</option>
                          <option value="STEM Excellence Partner">🔬 STEM Excellence Partner</option>
                          <option value="Standard EdTech Partner">💻 Standard EdTech Partner</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Institutional SPOC & Roster Handover */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-500" />
                        <span>Stage 3: School SPOC & Academic Roster</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Designated School SPOC Name</label>
                        <input
                          type="text"
                          value={formalities.school_spoc_name || ''}
                          onChange={(e) => handleFormalitiesFieldChange('school_spoc_name', e.target.value)}
                          placeholder="Primary Institutional Coordinator"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">SPOC Designation</label>
                        <input
                          type="text"
                          value={formalities.school_spoc_designation || 'AI Coordinator'}
                          onChange={(e) => handleFormalitiesFieldChange('school_spoc_designation', e.target.value)}
                          placeholder="Head of Computer Science / Academic Coordinator"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">SPOC Phone / WhatsApp</label>
                        <input
                          type="text"
                          value={formalities.school_spoc_phone || ''}
                          onChange={(e) => handleFormalitiesFieldChange('school_spoc_phone', e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">SPOC Email</label>
                        <input
                          type="email"
                          value={formalities.school_spoc_email || ''}
                          onChange={(e) => handleFormalitiesFieldChange('school_spoc_email', e.target.value)}
                          placeholder="spoc@school.edu.in"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Student & Faculty Roster Handover</label>
                        <select
                          value={formalities.roster_status || 'Pending'}
                          onChange={(e) => handleFormalitiesFieldChange('roster_status', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          <option value="Pending">Pending Roster Handover</option>
                          <option value="Uploaded">Roster Excel Uploaded</option>
                          <option value="Verified">Roster Verified & Enrolled in Portal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Academic Year</label>
                        <input
                          type="text"
                          value={formalities.academic_year || '2026-2027'}
                          onChange={(e) => handleFormalitiesFieldChange('academic_year', e.target.value)}
                          placeholder="2026-2027"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Lab Readiness & Teacher Enablement */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Stage 4: Lab Readiness & Teacher Training</span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lab / Devices Readiness</label>
                        <select
                          value={formalities.lab_readiness || 'Pending'}
                          onChange={(e) => handleFormalitiesFieldChange('lab_readiness', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          <option value="Pending">Pending Inspection</option>
                          <option value="Setup Required">Setup & Configuration Required</option>
                          <option value="Verified Ready">Verified Ready for Student Deployment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Faculty AI Training Status</label>
                        <select
                          value={formalities.teacher_training_status || 'Scheduled'}
                          onChange={(e) => handleFormalitiesFieldChange('teacher_training_status', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          <option value="Scheduled">Orientation Scheduled</option>
                          <option value="Completed">Teacher Training Completed</option>
                          <option value="Postponed">Postponed / Awaiting School Calendar</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Student Rollout Kick-off Date</label>
                        <input
                          type="date"
                          value={formalities.rollout_target_date || ''}
                          onChange={(e) => handleFormalitiesFieldChange('rollout_target_date', e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 5: Official Partnership Certificate */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 rounded-2xl border border-amber-300 dark:border-amber-700/60 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-2xl shrink-0">
                        🏆
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Official Certificate of Partnership
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Issued under Skila Institutional Alliance Charter for academic session {formalities.academic_year || '2026-2027'}
                        </p>
                      </div>
                    </div>

                    {onOpenCertificate && (
                      <button
                        type="button"
                        onClick={() => onOpenCertificate(school, formalities)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Award className="w-4 h-4" />
                        <span>Generate & Print Certificate</span>
                      </button>
                    )}
                  </div>

                  {/* Save Formalities Action Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formalities.formalities_updated_at && (
                        <span>Last updated: {new Date(formalities.formalities_updated_at).toLocaleString()} by {formalities.formalities_updated_by || 'Admin'}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveFormalities}
                      disabled={isSavingFormalities}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingFormalities ? 'Synchronizing...' : 'Save Formalities Changes'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
      </div>

      {/* Send Contextual Email Modal */}
      <SendEmailModal
        school={school}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onUpdateSchool={onUpdateSchool}
      />

      {/* Send Contextual WhatsApp Modal */}
      <SendWhatsAppModal
        school={school}
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        onUpdateSchool={onUpdateSchool}
      />
    </div>
  );
}
