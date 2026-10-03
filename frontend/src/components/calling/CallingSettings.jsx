import React, { useState, useEffect } from 'react';
import { 
  Settings, Bot, Mic, Phone, Cpu, ShieldCheck, 
  Save, CheckCircle2, AlertCircle, RefreshCw, Key 
} from 'lucide-react';
import { fetchCallingSettings, updateCallingSettings } from '../../utils/callingApi';

export default function CallingSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [personaName, setPersonaName] = useState('Ananya');
  const [roleTitle, setRoleTitle] = useState('Skila AI School Outreach Assistant');
  const [primaryLang, setPrimaryLang] = useState('te-IN');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchCallingSettings();
      if (res.status === 'success') {
        const s = res.settings || {};
        setSettings(s);
        setPersonaName(s.ai_persona_name || 'Ananya');
        setRoleTitle(s.ai_role_title || 'Skila AI School Outreach Assistant');
        setPrimaryLang(s.primary_language || 'te-IN');
      }
    } catch (err) {
      console.error('Failed to load calling settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateCallingSettings({
        ai_persona_name: personaName,
        ai_role_title: roleTitle,
        primary_language: primaryLang
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              Calling Engine Configuration
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Ananya Persona & Voice AI Settings
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Configure conversational rules, telephony credentials, Sarvam voice synthesis models, and price integrity guardrails.
          </p>
        </div>

        <button
          onClick={loadSettings}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-2 text-xs font-semibold self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Settings
        </button>
      </div>

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Persona Form (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            AI Persona & Telugu Language Rules
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">AI Assistant Name</label>
              <input
                type="text"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Role Title / Designation</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Dialogue Language</label>
              <select
                value={primaryLang}
                onChange={(e) => setPrimaryLang(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="te-IN">Telugu (te-IN) - Sarvam Bulbul with English Code-switching</option>
                <option value="en-IN">English (en-IN) - Indian Accent</option>
              </select>
            </div>

            {/* Fixed Policy Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Non-Negotiable Target Pricing Policy
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Skila AI pricing is locked at <strong className="text-white">₹500 to ₹600 per student per year</strong>. 
                Ananya is strictly instructed by system prompt to reject discount requests over phone calls and direct the principal to the in-person demo team for institutional quotes.
              </p>
            </div>

            {/* Opening Greeting Preview */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-slate-300">Mandatory Opening Greeting (Telugu):</div>
              <p className="text-[11px] text-indigo-300 italic font-serif">
                "{settings?.opening_greeting || 'Namaskaram sir/madam, nenu Skila AI nunchi automated AI assistant ni. Mee school kosam educational technology solution gurinchi short ga maatladataniki call chestunnanu. Ippudu maatladataniki convenient ga unda?'}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Persona Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* System & Telephony Health Status (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Provider Credentials & Status
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Plivo Telephony</div>
                    <div className="text-[10px] text-slate-400">Outbound SIP trunking & audio streams</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {settings?.telephony_status || 'Simulation Mode'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Sarvam AI Speech Engine</div>
                    <div className="text-[10px] text-slate-400">Telugu STT Saarika + TTS Bulbul</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {settings?.voice_stt_tts_status || 'Simulation Mode'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">OpenAI LLM Brain</div>
                    <div className="text-[10px] text-slate-400">GPT-4o realtime reasoning & analysis</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {settings?.brain_llm_status || 'Simulation Mode'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-200">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-white">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              Automatic Live/Mock Switching:
            </div>
            When `PLIVO_AUTH_ID`, `SARVAM_API_KEY`, and `OPENAI_API_KEY` are provided in backend environment variables, the platform automatically engages live carrier telephony. Without keys, the interactive simulation engine runs flawlessly for full testing.
          </div>
        </div>

      </div>

    </div>
  );
}
