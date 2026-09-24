import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Send, Sparkles, CheckCircle2, Copy, Check, ExternalLink, 
  User, Building2, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Key, HelpCircle
} from 'lucide-react';

export default function SendEmailModal({ school, isOpen, onClose, onUpdateSchool }) {
  if (!isOpen || !school) return null;

  const { info, hierarchy, sales, technology } = school;

  const schoolName = info?.school_name || 'School';
  const principalName = info?.principal_name || info?.correspondent_name || '';
  const initialEmail = info?.email || sales?.decision_maker_contact || '';
  const board = info?.board || 'Affiliated';
  const strength = info?.student_strength ? Number(info.student_strength).toLocaleString() : '1,000+';
  const location = [hierarchy?.mandal, hierarchy?.district, hierarchy?.state].filter(Boolean).join(', ') || 'your district';

  const defaultSalutation = principalName ? `Dear ${principalName},` : 'Respected Principal,';
  const defaultSubject = `Partnership Proposal: Skila AI & STEM Curriculum Collaboration — ${schoolName}`;

  const defaultBody = `${defaultSalutation}

Greetings from Skila AI.

I am writing to formally propose an educational technology partnership with ${schoolName}. In alignment with NEP 2020 guidelines and the modern technological requirements of ${board} institutions, Skila AI collaborates with forward-thinking schools to establish comprehensive AI, Coding, and Robotics curricula.

With an esteemed student body of approximately ${strength} students in ${location}, ${schoolName} has a remarkable opportunity to empower learners with future-ready digital competencies.

Our institutional partnership framework provides:
• Turnkey AI, Robotics & Coding Curriculum for Grades 1–12 (mapped to ${board} learning outcomes)
• Hands-on Innovation & Atal Tinkering Labs (ATL) with certified mentor support
• Integrated School Management, ERP, and Student Progress Telemetry for institutional leadership

We would welcome the privilege of scheduling a brief 15-minute virtual briefing or an on-campus demonstration for your leadership team this week.

Please let us know your preferred date and time, or feel free to reply directly to this email.

Warm regards,

Strategic Partnerships Team
Skila AI Educational Technologies
Email: partnerships@skila.ai | Website: https://skila.ai`;

  const [senderType, setSenderType] = useState('company'); // 'company' | 'personal'
  const [emailConfig, setEmailConfig] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  const [recipientName, setRecipientName] = useState(principalName || 'Principal');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Fetch available sender configurations on mount
  useEffect(() => {
    fetch('/api/email-config')
      .then(res => res.json())
      .then(data => {
        setEmailConfig(data);
        if (data.personal?.is_configured) {
          setSenderType('personal');
          const pName = data.personal?.name || 'Skila AI';
          const pEmail = data.personal?.email || 'skila.udaymerugu@gmail.com';
          const pSig = `Warm regards,\n\n${pName}\nEducational Partnership Lead, Skila AI\nEmail: ${pEmail}`;
          setBody(b => {
            if (b.includes('Warm regards,')) {
              const parts = b.split('Warm regards,');
              return parts[0].trim() + '\n\n' + pSig;
            }
            return b;
          });
        }
      })
      .catch(err => console.error('Failed to load email config:', err));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getSignature = (type) => {
    if (type === 'personal') {
      const pName = emailConfig?.personal?.name || 'Partner Representative';
      const pEmail = emailConfig?.personal?.email || 'personal@gmail.com';
      return `Warm regards,\n\n${pName}\nEducational Partnership Lead, Skila AI\nEmail: ${pEmail}`;
    } else {
      const cName = emailConfig?.company?.name || 'Strategic Partnerships Team';
      const cEmail = emailConfig?.company?.email || 'partnerships@skila.ai';
      return `Warm regards,\n\n${cName}\nSkila AI Educational Technologies\nEmail: ${cEmail} | Website: https://skila.ai`;
    }
  };

  const handleSenderChange = (newType) => {
    const oldSig = getSignature(senderType);
    const newSig = getSignature(newType);
    setSenderType(newType);

    if (body.includes(oldSig)) {
      setBody(body.replace(oldSig, newSig));
    } else if (body.includes('Warm regards,')) {
      const parts = body.split('Warm regards,');
      setBody(parts[0].trim() + '\n\n' + newSig);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAiRegenerate = async () => {
    setIsGeneratingAi(true);
    setSendError('');
    try {
      const res = await fetch(`/api/schools/${school.id}/generate-email`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(data.body);
        if (data.recipient_email && !recipientEmail) setRecipientEmail(data.recipient_email);
        if (data.recipient_name) setRecipientName(data.recipient_name);
      }
    } catch (err) {
      console.error('Error generating email with AI:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendAutomatic = async () => {
    if (!recipientEmail || !recipientEmail.trim()) {
      setSendError('Please provide a valid recipient email address.');
      return;
    }

    setIsSending(true);
    setSendError('');
    try {
      const payload = {
        recipient_email: recipientEmail.trim(),
        recipient_name: recipientName.trim(),
        subject: subject.trim(),
        body: body.trim(),
        sender_type: senderType
      };

      const res = await fetch(`/api/schools/${school.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (onUpdateSchool && data.school) {
          onUpdateSchool(data.school);
        }
        if (data.smtp_sent) {
          setSendSuccess(true);
          setTimeout(() => {
            setSendSuccess(false);
            onClose();
          }, 2500);
        } else if (data.smtp_error) {
          setSendError(`SMTP dispatch error: ${data.smtp_error}`);
        } else {
          setSendSuccess(true);
          setTimeout(() => {
            setSendSuccess(false);
            onClose();
          }, 2500);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setSendError(err.detail || 'Failed to dispatch email. Please check address.');
      }
    } catch (err) {
      console.error('Send email error:', err);
      setSendError('Network error while dispatching email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenMailClient = async () => {
    const mailto = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    // Record engagement in CRM
    try {
      await fetch(`/api/schools/${school.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: recipientEmail || 'School Mail Client',
          recipient_name: recipientName,
          subject: subject,
          body: `[Dispatched via Local Mail Client as ${senderType === 'personal' ? 'Personal' : 'Company'}]\n` + body,
          sender_type: senderType
        })
      }).then(r => r.json()).then(data => {
        if (onUpdateSchool && data.school) onUpdateSchool(data.school);
      });
    } catch (e) {
      console.error('Failed to log mail client trigger', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shrink-0 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                <Mail className="w-3 h-3" /> Partnership Outreach
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {board}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Send Contextual Proposal to {schoolName}
            </h3>
            <p className="text-xs text-slate-300/80 mt-0.5">
              Select your sending account and dispatch customized institutional outreach.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {sendSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Proposal email successfully dispatched to {recipientEmail} from your {senderType === 'personal' ? 'Personal' : 'Company'} account and logged in CRM!</span>
            </div>
          )}

          {sendError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* SENDER ACCOUNT SELECTOR DROPDOWN */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Send From (Sender Account):</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Automation Setup Guide</span>
                {showConfigHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            <select
              value={senderType}
              onChange={(e) => handleSenderChange(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
            >
              <option value="personal">
                👤 Personal Account: {emailConfig?.personal?.name || 'Skila AI'} ({emailConfig?.personal?.email || 'skila.udaymerugu@gmail.com'}) {emailConfig?.personal?.is_configured ? '✓ [Ready for 1-Click Send]' : ''}
              </option>
              <option value="company">
                🏢 Company Account: {emailConfig?.company?.name || 'Skila AI Partnerships'} ({emailConfig?.company?.email || 'partnerships@skila.ai'}) {emailConfig?.company?.is_configured ? '✓ [Ready]' : '(Not Configured)'}
              </option>
            </select>

            {/* Collapsible Automation Setup Instructions */}
            {showConfigHelp && (
              <div className="mt-2.5 p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 animate-in fade-in">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>How to enable 1-Click Background Automation for your Gmail or Company Email:</span>
                </div>
                <p>
                  1. <strong>Personal Gmail:</strong> Go to Google Account → Security → App Passwords → Generate a 16-character App Password.
                </p>
                <p>
                  2. <strong>Company Email:</strong> Use your Google Workspace App Password, or an SMTP key from Resend/SendGrid.
                </p>
                <p>
                  3. Paste into <code className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[10px]">backend/.env</code> under <code className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[10px]">PERSONAL_SMTP_PASSWORD</code> or <code className="px-1 py-0.5 bg-white dark:bg-slate-900 rounded font-mono text-[10px]">COMPANY_SMTP_PASSWORD</code>.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  Tip: You can always click "Open in Mail Client" below to send right now from either account with zero setup!
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Recipient Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient School Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. principal@school.edu.in"
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Name / Designation
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Dr. Anil Kumar (Principal)"
                  className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Contextual Partnership Email Body
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiRegenerate}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
                  title="Generate alternative AI proposal draft"
                >
                  <Sparkles className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Regenerating...' : 'Re-draft with AI'}</span>
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <textarea
              rows="9"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px] leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleOpenMailClient}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-xs"
            title="Open in your default email client (Gmail, Outlook, Apple Mail)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Mail Client</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendAutomatic}
              disabled={isSending || sendSuccess}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Email...</span>
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Sent!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Automatically</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
