import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Send, Sparkles, CheckCircle2, Copy, Check, ExternalLink, 
  User, Phone, AlertCircle, RefreshCw, Smartphone, ShieldCheck
} from 'lucide-react';

export default function SendWhatsAppModal({ school, isOpen, onClose, onUpdateSchool }) {
  if (!isOpen || !school) return null;

  const { info, hierarchy, sales } = school;

  const schoolName = info?.school_name || 'School';
  const principalName = info?.principal_name || info?.correspondent_name || sales?.decision_maker || '';
  const board = info?.board || 'Affiliated';
  const initialContact = sales?.decision_maker_contact || info?.mobile || info?.phone || '';

  // Clean phone number with 91 prefix
  const cleanInitialPhone = () => {
    let p = String(initialContact || '').replace(/\D/g, '');
    if (p.startsWith('0')) p = p.slice(1);
    if (p.length === 10) return `91${p}`;
    return p;
  };

  const defaultSalutation = principalName ? `Respected *${principalName}*,` : 'Respected *Principal*,';
  const defaultMessage = `${defaultSalutation}

Greetings from *Skila AI Educational Technologies* 🚀

In alignment with *NEP 2020 guidelines*, we partner with progressive *${board}* institutions to empower students with future-ready AI, Robotics, and Coding competencies.

Our Turnkey Partnership Framework for *${schoolName}* includes:
🤖 *Hands-on AI & Coding Curriculum* (Grades 1–12 mapped to ${board})
🔬 *Atal Tinkering Lab (ATL)* setup & certified mentor support
📊 *Integrated Student Progress Analytics* for institutional leadership

Could we schedule a quick *15-minute virtual briefing* or an on-campus demonstration for your leadership team this week?

Warm regards,
*Skila AI Strategic Partnerships*
🌐 https://skila.ai`;

  const [recipientPhone, setRecipientPhone] = useState(cleanInitialPhone());
  const [recipientName, setRecipientName] = useState(principalName || 'Principal');
  const [message, setMessage] = useState(defaultMessage);
  const [templateVars, setTemplateVars] = useState({
    var1: principalName || 'Principal',
    var2: schoolName,
    var3: board
  });

  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [copied, setCopied] = useState(false);
  const [whatsappConfig, setWhatsappConfig] = useState(null);

  useEffect(() => {
    fetch('/api/whatsapp-config')
      .then(res => res.json())
      .then(data => setWhatsappConfig(data))
      .catch(err => console.error('Failed to load WhatsApp config:', err));
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiRegenerate = async () => {
    setIsGeneratingAi(true);
    setSendError('');
    try {
      const res = await fetch(`/api/schools/${school.id}/generate-whatsapp`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) setMessage(data.message);
        if (data.recipient_phone && !recipientPhone) setRecipientPhone(data.recipient_phone);
        if (data.recipient_name) setRecipientName(data.recipient_name);
        setTemplateVars({
          var1: data.var1 || recipientName,
          var2: data.var2 || schoolName,
          var3: data.var3 || board
        });
      } else {
        setSendError('Failed to generate AI pitch. Please try again.');
      }
    } catch (err) {
      console.error('AI WhatsApp error:', err);
      setSendError('Network error while drafting with AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSendViaMSG91 = async () => {
    const clean = recipientPhone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setSendError('Please provide a valid 10-digit mobile number with country code (e.g. 919876543210).');
      return;
    }

    setIsSending(true);
    setSendError('');
    try {
      const payload = {
        recipient_phone: clean,
        recipient_name: recipientName.trim(),
        message: message.trim(),
        var1: templateVars.var1 || recipientName,
        var2: templateVars.var2 || schoolName,
        var3: templateVars.var3 || board
      };

      const res = await fetch(`/api/schools/${school.id}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (onUpdateSchool && data.school) {
          onUpdateSchool(data.school);
        }
        setSendSuccess(true);
        setTimeout(() => {
          setSendSuccess(false);
          onClose();
        }, 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        setSendError(err.detail || 'Failed to dispatch via MSG91 WhatsApp. You can send via WhatsApp Web below.');
      }
    } catch (err) {
      console.error('Send WhatsApp error:', err);
      setSendError('Network error while connecting to MSG91.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendViaWhatsAppWeb = async () => {
    const clean = recipientPhone.replace(/\D/g, '');
    if (!clean) {
      setSendError('Please provide a mobile number to open WhatsApp.');
      return;
    }

    const waUrl = `https://web.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message.trim())}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Automatically record engagement in CRM as Contacted
    try {
      const res = await fetch(`/api/schools/${school.id}/log-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_phone: clean,
          recipient_name: recipientName.trim(),
          message: message.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (onUpdateSchool && data.school) onUpdateSchool(data.school);
      }
    } catch (e) {
      console.error('Failed to log WhatsApp Web dispatch:', e);
    }

    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 shrink-0 border-b border-emerald-900/40 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-400" /> WhatsApp Institutional Outreach
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {board}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              WhatsApp Pitch to {schoolName}
            </h3>
            <p className="text-xs text-slate-300/80 mt-0.5">
              Send an instant AI-formatted partnership pitch to school leadership.
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
              <span>WhatsApp outreach recorded in CRM for +{recipientPhone}!</span>
            </div>
          )}

          {sendError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{sendError}</span>
              </div>
              <div className="pl-6 pt-0.5">
                <button
                  type="button"
                  onClick={handleSendViaWhatsAppWeb}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp Web (1-Click Fallback)</span>
                </button>
              </div>
            </div>
          )}

          {/* MSG91 Sender Status Banner */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Integrated Business WhatsApp:</span>{' '}
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  +{whatsappConfig?.integrated_number || '919390875225'}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-500/20">
              MSG91 Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Recipient Phone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                <span>Recipient Mobile Number * (with Country Code)</span>
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: 10-digit mobile prefixed with 91 (India)
              </span>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Recipient Name / Designation</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  setTemplateVars(v => ({ ...v, var1: e.target.value }));
                }}
                placeholder="e.g. Dr. K. Sharma (Principal)"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* WhatsApp Pitch Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp Message Content (Supports *bold* & emojis)</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiRegenerate}
                  disabled={isGeneratingAi}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                  title="Generate alternative WhatsApp pitch"
                >
                  <Sparkles className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Drafting...' : 'Re-draft with AI'}</span>
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
              rows="10"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-sans text-[12px] leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 resize-y"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSendViaWhatsAppWeb}
              disabled={sendSuccess}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
              title="Open WhatsApp Web with this phone number and customized message pre-filled"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Send via WhatsApp Web (1-Click)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendViaMSG91}
              disabled={isSending || sendSuccess}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Dispatch automated message via MSG91 API (Requires IP whitelisted in MSG91)"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching via MSG91...</span>
                </>
              ) : sendSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dispatched!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via MSG91 (Automated)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
