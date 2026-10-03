import React, { useState, useEffect } from 'react';
import { 
  Settings, Bot, Mic, Phone, Cpu, ShieldCheck, 
  Save, CheckCircle2, AlertCircle, RefreshCw, Key, 
  ExternalLink, Eye, EyeOff, Zap, Check, AlertTriangle, Radio
} from 'lucide-react';
import { 
  fetchCallingSettings, 
  updateCallingSettings, 
  saveCarrierCredentials, 
  testPlivoConnection 
} from '../../utils/callingApi';

export default function CallingSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingPersona, setSavingPersona] = useState(false);
  const [personaSavedSuccess, setPersonaSavedSuccess] = useState(false);

  // Persona Fields
  const [personaName, setPersonaName] = useState('Ananya');
  const [roleTitle, setRoleTitle] = useState('Skila AI School Outreach Assistant');
  const [primaryLang, setPrimaryLang] = useState('te-IN');

  // Carrier Credentials Fields
  const [plivoAuthId, setPlivoAuthId] = useState('');
  const [plivoAuthToken, setPlivoAuthToken] = useState('');
  const [plivoPhoneNumber, setPlivoPhoneNumber] = useState('');
  const [sarvamApiKey, setSarvamApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [publicWebhookUrl, setPublicWebhookUrl] = useState('');

  // Password visibility toggles
  const [showPlivoToken, setShowPlivoToken] = useState(false);
  const [showSarvamKey, setShowSarvamKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  // Verification & Testing State
  const [testingPlivo, setTestingPlivo] = useState(false);
  const [plivoTestResult, setPlivoTestResult] = useState(null);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsSavedSuccess, setCredsSavedSuccess] = useState(false);

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

        const creds = s.credentials || {};
        setPlivoAuthId(creds.plivo_auth_id_masked || '');
        setPlivoPhoneNumber(creds.plivo_phone_number || '');
        setSarvamApiKey(creds.sarvam_api_key_masked || '');
        setGeminiApiKey(creds.gemini_api_key_masked || '');
        setOpenaiApiKey(creds.openai_api_key_masked || '');
        setPublicWebhookUrl(creds.public_webhook_url || '');
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

  const handleSavePersona = async (e) => {
    e.preventDefault();
    try {
      setSavingPersona(true);
      await updateCallingSettings({
        ai_persona_name: personaName,
        ai_role_title: roleTitle,
        primary_language: primaryLang
      });
      setPersonaSavedSuccess(true);
      setTimeout(() => setPersonaSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingPersona(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    try {
      setSavingCreds(true);
      const payload = {};
      // Only send if modified and not placeholder masked
      if (plivoAuthId && !plivoAuthId.includes('...')) payload.plivo_auth_id = plivoAuthId;
      if (plivoAuthToken) payload.plivo_auth_token = plivoAuthToken;
      if (plivoPhoneNumber) payload.plivo_phone_number = plivoPhoneNumber;
      if (sarvamApiKey && !sarvamApiKey.includes('...')) payload.sarvam_api_key = sarvamApiKey;
      if (geminiApiKey && !geminiApiKey.includes('...')) payload.gemini_api_key = geminiApiKey;
      if (openaiApiKey && !openaiApiKey.includes('...')) payload.openai_api_key = openaiApiKey;
      if (publicWebhookUrl !== undefined) payload.public_webhook_url = publicWebhookUrl;

      const res = await saveCarrierCredentials(payload);
      if (res.status === 'success') {
        setCredsSavedSuccess(true);
        setTimeout(() => setCredsSavedSuccess(false), 4000);
        await loadSettings();
      }
    } catch (err) {
      alert(`Failed to save credentials: ${err.message}`);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleTestPlivo = async () => {
    try {
      setTestingPlivo(true);
      setPlivoTestResult(null);
      const payload = {};
      if (plivoAuthId && !plivoAuthId.includes('...')) payload.auth_id = plivoAuthId;
      if (plivoAuthToken) payload.auth_token = plivoAuthToken;

      const res = await testPlivoConnection(payload);
      setPlivoTestResult(res);
    } catch (err) {
      setPlivoTestResult({ success: false, error: err.message });
    } finally {
      setTestingPlivo(false);
    }
  };

  const isRealActive = settings?.active_mode === 'REAL TELEPHONY';

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
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
              isRealActive 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              <Radio className={`w-3 h-3 ${isRealActive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              {settings?.active_mode || 'MOCK SIMULATION'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Ananya Persona, Telephony & Voice AI Settings
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl">
            Configure conversational rules, Plivo carrier outbound trunking, Sarvam Telugu voice models, and pricing guardrails.
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

      {/* Notice Banner Explaining Calling Modes */}
      {!isRealActive && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-100">Why does my mobile phone not ring yet?</strong>
              <p className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                The platform is currently running in <strong>In-Browser Voice Simulation Mode</strong> because Plivo carrier credentials are not populated in <code className="bg-slate-900 px-1 rounded text-amber-300">backend/.env</code>. 
                In simulation mode, Ananya speaks directly through your computer speakers. To make real phone calls that ring physical +91 mobile phones, enter your Plivo Auth ID and Token below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Carrier Credentials Manager (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Carrier Telephony & Voice API Credentials */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Telephony & Speech AI Credentials
              </h3>
              <span className="text-[11px] text-slate-400">Persisted securely to .env</span>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              
              {/* Plivo Auth ID */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Plivo Auth ID <span className="text-slate-500 font-normal">(Required for real phone calls)</span>
                </label>
                <input
                  type="text"
                  value={plivoAuthId}
                  onChange={(e) => setPlivoAuthId(e.target.value)}
                  placeholder="e.g. MAMTM4ZTK0MWUZNGI3NG"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Plivo Auth Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Plivo Auth Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPlivoToken(!showPlivoToken)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showPlivoToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPlivoToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showPlivoToken ? 'text' : 'password'}
                  value={plivoAuthToken}
                  onChange={(e) => setPlivoAuthToken(e.target.value)}
                  placeholder={settings?.credentials?.plivo_auth_token_set ? '••••••••••••••••••••••••••••••••' : 'Enter Plivo Auth Token'}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Plivo Outbound Phone Number */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Plivo Caller ID / Outbound Phone Number
                </label>
                <input
                  type="text"
                  value={plivoPhoneNumber}
                  onChange={(e) => setPlivoPhoneNumber(e.target.value)}
                  placeholder="e.g. +918000123456"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The caller ID shown on the principal's mobile phone screen.
                </span>
              </div>

              {/* Sarvam AI API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Sarvam AI API Key <span className="text-slate-500 font-normal">(Telugu STT & TTS)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSarvamKey(!showSarvamKey)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showSarvamKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showSarvamKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showSarvamKey ? 'text' : 'password'}
                  value={sarvamApiKey}
                  onChange={(e) => setSarvamApiKey(e.target.value)}
                  placeholder="e.g. sk_sarvam_..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Powers Sarvam Saarika (Telugu Speech-to-Text) and Bulbul (Telugu Voice Synthesis).
                </span>
              </div>

              {/* Google Gemini API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Google Gemini API Key <span className="text-emerald-400 font-normal">(Free • Gemini 2.5 Flash Conversational Brain)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showGeminiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showGeminiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="e.g. AIzaSy..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Recommended free conversational brain. Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline">aistudio.google.com</a>.
                </span>
              </div>

              {/* OpenAI API Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    OpenAI API Key <span className="text-slate-500 font-normal">(GPT-4o Conversational Brain)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {showOpenaiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showOpenaiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="e.g. sk-proj-..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Public Webhook URL (Ngrok / Cloudflare / Production) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Public Webhook URL (PUBLIC_APP_URL)
                </label>
                <input
                  type="text"
                  value={publicWebhookUrl}
                  onChange={(e) => setPublicWebhookUrl(e.target.value)}
                  placeholder="e.g. https://your-domain.ngrok-free.app or https://app.skila.ai"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Plivo cloud servers require an HTTPS URL to send audio stream events to your server.
                </span>
              </div>

              {/* Test Plivo Connection Result */}
              {plivoTestResult && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  plivoTestResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {plivoTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {plivoTestResult.success ? 'Plivo Carrier Verified' : 'Plivo Verification Failed'}
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {plivoTestResult.success ? (
                      <>
                        Account Type: <strong>{plivoTestResult.account_type}</strong> • 
                        Cash Credits: <strong>${plivoTestResult.cash_credits}</strong> • 
                        Ready for real outbound calls!
                      </>
                    ) : (
                      plivoTestResult.error || 'Invalid credentials'
                    )}
                  </div>
                </div>
              )}

              {/* Save & Test Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestPlivo}
                  disabled={testingPlivo}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingPlivo ? 'animate-spin' : ''}`} />
                  {testingPlivo ? 'Testing Plivo...' : 'Test Plivo Connection'}
                </button>

                <div className="flex items-center gap-3">
                  {credsSavedSuccess && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Saved to .env!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={savingCreds}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {savingCreds ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Persona Form */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              AI Assistant Persona & Telugu Rules
            </h3>

            <form onSubmit={handleSavePersona} className="space-y-4">
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

              <div className="flex items-center justify-between pt-2">
                {personaSavedSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Persona updated!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingPersona}
                  className="ml-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingPersona ? 'Saving...' : 'Save Persona'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column: Status & Policies (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Provider Status Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Active Provider Status
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Plivo Telephony</div>
                    <div className="text-[10px] text-slate-400">Carrier GSM/PSTN calling</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  settings?.has_plivo 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
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
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  settings?.has_sarvam 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {settings?.voice_stt_tts_status || 'Web Speech API'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">OpenAI LLM Brain</div>
                    <div className="text-[10px] text-slate-400">GPT-4o reasoning & evaluation</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  settings?.has_openai 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  {settings?.brain_llm_status || 'Heuristic LLM'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Policy Card */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Non-Negotiable Target Pricing Policy
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Skila AI pricing is locked at <strong className="text-white">₹500 to ₹600 per student per year</strong>. 
              Ananya is strictly instructed by system prompt to reject discount requests over phone calls and direct the principal to the in-person demo team for institutional quotes.
            </p>
          </div>

          {/* Mandatory Opening Greeting Preview */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2">
            <div className="text-xs font-bold text-slate-300">Mandatory Opening Greeting (Telugu):</div>
            <p className="text-[11px] text-indigo-300 italic font-serif leading-relaxed">
              "{settings?.opening_greeting || 'Namaskaram sir/madam, nenu Skila AI nunchi automated AI assistant ni. Mee school kosam educational technology solution gurinchi short ga maatladataniki call chestunnanu. Ippudu maatladataniki convenient ga unda?'}"
            </p>
          </div>

          {/* Quick Guide Card */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-white">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              How Outbound Calling Works:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
              <li>Enter your Plivo credentials above and click <strong>Test Plivo Connection</strong>.</li>
              <li>When verified, save credentials. The platform switches to <strong>REAL TELEPHONY</strong> mode.</li>
              <li>When you click <strong>Start AI Call</strong> in the School Directory, Plivo places a real phone call to the mobile number.</li>
              <li>When the principal answers, Ananya conducts the dialogue in Telugu and logs the transcript and AI qualification in Firestore.</li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}
