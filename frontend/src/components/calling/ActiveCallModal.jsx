import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, Sparkles, User, 
  Clock, ShieldAlert, Award, ArrowRight, CheckCircle2, MessageSquare, AlertTriangle 
} from 'lucide-react';
import { sendSpeechTurn, endAICall } from '../../utils/callingApi';

export default function ActiveCallModal({ 
  callData, 
  onClose, 
  onCallCompleted 
}) {
  const [duration, setDuration] = useState(0);
  const [isSpeakingAI, setIsSpeakingAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [liveState, setLiveState] = useState({
    interest_level: 'WARM',
    lead_status: 'CONNECTED',
    student_count: null,
    demo_requested: false,
    decision_maker: true
  });
  const transcriptEndRef = useRef(null);

  // Initialize transcript with initial greeting
  useEffect(() => {
    if (callData?.initial_turn) {
      setTranscript([
        {
          speaker: 'Ananya (Skila AI)',
          text: callData.initial_turn.text,
          time: '00:01',
          role: 'ai'
        }
      ]);
    }
  }, [callData]);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendUtterance = async (userText) => {
    if (!userText.trim() || isProcessing) return;
    setIsProcessing(true);
    setIsSpeakingAI(false);

    const currentTime = formatSeconds(duration);
    const updated = [
      ...transcript,
      {
        speaker: 'Principal',
        text: userText,
        time: currentTime,
        role: 'user'
      }
    ];
    setTranscript(updated);
    setCustomInput('');

    try {
      const res = await sendSpeechTurn(callData.call_id, userText);
      if (res.status === 'success' && res.ai_turn) {
        setIsSpeakingAI(true);
        setTranscript((prev) => [
          ...prev,
          {
            speaker: 'Ananya (Skila AI)',
            text: res.ai_turn.text,
            time: formatSeconds(duration + 1),
            role: 'ai'
          }
        ]);
        if (res.state) {
          setLiveState((prev) => ({ ...prev, ...res.state }));
        }

        // Play synthetic speech if web audio available
        if (res.audio_base64 && window.Audio) {
          try {
            const audio = new Audio(`data:audio/wav;base64,${res.audio_base64}`);
            audio.play().catch(() => {});
          } catch (e) {}
        }

        // Auto end if closing turn detected
        if (res.is_closing) {
          setTimeout(() => {
            handleEndCall();
          }, 3500);
        }
      }
    } catch (err) {
      console.error('Failed to submit turn:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndCall = async () => {
    try {
      setIsProcessing(true);
      const res = await endAICall(callData.call_id);
      if (onCallCompleted) {
        onCallCompleted(res.summary || res.call || { call_id: callData.call_id });
      }
    } catch (err) {
      console.error('Failed to end call:', err);
      if (onCallCompleted) {
        onCallCompleted({ call_id: callData.call_id });
      }
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleBargeIn = () => {
    setIsSpeakingAI(false);
    // User interrupts AI
  };

  const quickResponses = [
    {
      telugu: "ఔను, మీ Skila AI ప్రోగ్రామ్ గురించి చెప్పండి, సిలబస్ ఏముంటుంది?",
      label: "Ask about curriculum (Interested)"
    },
    {
      telugu: "స్టూడెంట్ కి ఎంత ఫీజు అవుతుంది? డిస్కౌంట్ ఏమైనా ఉంటుందా?",
      label: "Ask about pricing (₹500-600)"
    },
    {
      telugu: "మా స్కూల్ లో 450 మంది స్టూడెంట్స్ ఉన్నారు. మాకు శనివారం లైవ్ డెమో ఇవ్వగలరా?",
      label: "Request Live Demo (HOT Lead)"
    },
    {
      telugu: "మాకు ఇప్పటికే వేరే కంప్యూటర్ సిలబస్ ఉంది, ఇప్పుడు అవసరం లేదు.",
      label: "Object: Already have syllabus"
    },
    {
      telugu: "ఇప్పుడు బిజీగా ఉన్నాను, రేపు సాయంత్రం 4 గంటలకి కాల్ చేయండి.",
      label: "Busy: Request Callback"
    },
    {
      telugu: "మాకు ఎలాంటి AI సిలబస్ ఆసక్తి లేదు.",
      label: "Cold: Not interested"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Call Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {callData?.school_name || 'Telangana School'}
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Telugu First AI
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300">
                  {callData?.provider_mode === 'REAL' ? 'Plivo + Sarvam Live' : 'Voice Simulation'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {callData?.district || 'Telangana'} • Phone: <span className="font-mono text-slate-300">{callData?.phone_number || '9876543210'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm font-semibold">{formatSeconds(duration)}</span>
            </div>
            <button
              onClick={handleEndCall}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-rose-600/30 transition cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              End Call & Evaluate
            </button>
          </div>
        </div>

        {/* Call Live Body: Split into Visualizer/Transcript & Realtime Qualification */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          
          {/* Main Conversation Stream (8 cols) */}
          <div className="lg:col-span-8 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            
            {/* Ananya AI Voice Status Banner & Soundwave */}
            <div className="p-3 mb-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                    SK
                  </div>
                  {isSpeakingAI && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    Ananya (Skila AI Outreach Assistant)
                    {isSpeakingAI && <span className="text-[10px] text-emerald-400 font-normal">● Speaking Telugu</span>}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Mandatory AI Disclosure • Sarvam Bulbul Voice • Zero Hallucination
                  </div>
                </div>
              </div>

              {/* Animated Sound Wave Bars */}
              <div className="flex items-center gap-1 h-6">
                {[12, 24, 16, 28, 20, 14, 26, 18].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: isSpeakingAI ? `${h}px` : '4px' }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isSpeakingAI ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {isSpeakingAI && (
                <button
                  onClick={handleBargeIn}
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
                  title="Simulate user speaking over AI"
                >
                  Barge-in (Interrupt)
                </button>
              )}
            </div>

            {/* Live Transcript Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[250px]">
              {transcript.map((item, index) => {
                const isAI = item.role === 'ai';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className={`text-[10px] font-semibold ${isAI ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {item.speaker}
                      </span>
                      <span className="text-[9px] text-slate-500">{item.time}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isAI
                          ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-none shadow-sm'
                          : 'bg-emerald-600 text-white rounded-tr-none shadow-md font-medium'
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                );
              })}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse py-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ananya is listening and preparing response in Telugu...</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Turn Simulator & Quick Principal Responses */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Select Principal's response or type custom utterance:
              </div>

              {/* Quick Option Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                {quickResponses.map((btn, idx) => (
                  <button
                    key={idx}
                    disabled={isProcessing}
                    onClick={() => handleSendUtterance(btn.telugu)}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:border-indigo-500/50 text-[11px] transition flex flex-col justify-center disabled:opacity-50 cursor-pointer"
                  >
                    <span className="font-medium text-slate-200 truncate">{btn.telugu}</span>
                    <span className="text-[9px] text-indigo-400">{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendUtterance(customInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type principal response in Telugu or English (e.g. 'Avunu, demo arrange cheyandi')..."
                  className="flex-1 bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!customInput.trim() || isProcessing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Real-time AI Lead Qualification & Insights (4 cols) */}
          <div className="lg:col-span-4 p-5 bg-slate-950/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Live Qualification
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-extrabold rounded-full ${
                    liveState.interest_level === 'HOT'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : liveState.interest_level === 'WARM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {liveState.interest_level} LEAD
                </span>
              </div>

              {/* Extracted Parameters */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Target School</div>
                  <div className="font-bold text-slate-200">{callData?.school_name}</div>
                  <div className="text-slate-400 text-[11px]">{callData?.district} • Principal</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Student Strength</div>
                  <div className="font-semibold text-slate-200">
                    {liveState.student_count ? `${liveState.student_count} Students` : 'Extracting from dialogue...'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Target Pricing Rule</div>
                  <div className="font-semibold text-emerald-400">₹500 – ₹600 / student / year</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fixed policy: No discount over phone call</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Demo Requested</div>
                  <div className="flex items-center gap-1.5">
                    {liveState.demo_requested ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes (Immediate Sales Handoff)
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending Principal Confirmation</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grounding Guarantees Alert */}
            <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-[11px] text-indigo-300">
              <div className="font-bold flex items-center gap-1 text-indigo-200 mb-0.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Skila AI Safe Guardrail
              </div>
              Mandatory AI disclosure made at 00:01. Strictly presents Skila AI computer curriculum. Escalates pricing negotiations to human team.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
