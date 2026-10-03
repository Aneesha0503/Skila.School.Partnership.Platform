import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, User, 
  Clock, ShieldAlert, Award, ArrowRight, CheckCircle2, MessageSquare, AlertTriangle, Key 
} from 'lucide-react';
import { sendSpeechTurn, endAICall } from '../../utils/callingApi';

export default function ActiveCallModal({ 
  callData, 
  onClose, 
  onCallCompleted,
  onNavigateToSettings
}) {
  const [duration, setDuration] = useState(0);
  const [isSpeakingAI, setIsSpeakingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [speechNotice, setSpeechNotice] = useState('');
  const [liveState, setLiveState] = useState({
    interest_level: 'WARM',
    lead_status: 'CONNECTED',
    student_count: null,
    demo_requested: false,
    decision_maker: true
  });

  const transcriptEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Helper to speak text aloud using browser SpeechSynthesis
  const speakWithBrowserTTS = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      // Try to match Telugu voice, then Indian English, then default
      const teluguVoice = voices.find(v => v.lang.includes('te') || v.name.toLowerCase().includes('telugu'));
      const indianVoice = voices.find(v => v.lang.includes('en-IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('hindi'));
      
      if (teluguVoice) {
        utterance.voice = teluguVoice;
      } else if (indianVoice) {
        utterance.voice = indianVoice;
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.onstart = () => setIsSpeakingAI(true);
      utterance.onend = () => setIsSpeakingAI(false);
      utterance.onerror = () => setIsSpeakingAI(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeakingAI(false);
    }
  };

  // Play Sarvam audio bytes or fallback to browser TTS
  const playAudioOrSynthesize = (text, audioBase64) => {
    if (isMuted) return;

    // Sarvam WAV is typically > 2000 bytes; mock WAV placeholder is only ~74 bytes
    if (audioBase64 && audioBase64.length > 300 && window.Audio) {
      try {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
        currentAudioRef.current = audio;
        setIsSpeakingAI(true);
        audio.onended = () => setIsSpeakingAI(false);
        audio.onerror = () => {
          speakWithBrowserTTS(text);
        };
        audio.play().catch(() => {
          speakWithBrowserTTS(text);
        });
        return;
      } catch (e) {
        speakWithBrowserTTS(text);
        return;
      }
    }

    // Fallback: Browser Web Speech API (audible on speakers immediately)
    speakWithBrowserTTS(text);
  };

  // Initialize transcript and audibly speak initial greeting
  useEffect(() => {
    if (callData?.initial_turn?.text) {
      setTranscript([
        {
          speaker: 'Ananya (Skila AI)',
          text: callData.initial_turn.text,
          time: '00:01',
          role: 'ai'
        }
      ]);

      // Speak Ananya's Telugu greeting through speakers after brief mount delay
      const timer = setTimeout(() => {
        playAudioOrSynthesize(callData.initial_turn.text, callData.audio_base64);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [callData]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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

    // Stop speaking when user submits utterance
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

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

        // Audibly speak Ananya's reply
        playAudioOrSynthesize(res.ai_turn.text, res.audio_base64);

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

  // Toggle live microphone recognition
  const toggleMicrophone = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge, or click the quick response options.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechNotice('');
      return;
    }

    // Stop Ananya speaking when user activates mic to speak
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsSpeakingAI(false);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'te-IN'; // Telugu + English mixed recognition
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechNotice('Listening... Speak now in Telugu or English');
      };

      recognition.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript;
        if (spoken) {
          setSpeechNotice(`Recognized: "${spoken}"`);
          handleSendUtterance(spoken);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechNotice(event.error === 'not-allowed' ? 'Microphone permission blocked.' : '');
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => setSpeechNotice(''), 2000);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const handleEndCall = async () => {
    try {
      setIsProcessing(true);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsSpeakingAI(false);
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
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  callData?.is_real_telephony || callData?.provider_mode === 'REAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {callData?.is_real_telephony || callData?.provider_mode === 'REAL' ? 'Plivo Carrier Call' : 'In-Browser Audio'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {callData?.district || 'Telangana'} • Destination: <span className="font-mono text-slate-300 font-semibold">{callData?.phone_number || '9876543210'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Mute Toggle */}
            <button
              onClick={() => {
                if (!isMuted && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsMuted(!isMuted);
              }}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                isMuted 
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
              }`}
              title={isMuted ? "Audio muted (Click to unmute)" : "Mute speaker audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm font-semibold">{formatSeconds(duration)}</span>
            </div>

            {/* End Call Button */}
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

        {/* Telephony Status Notice Banner */}
        {callData?.is_real_telephony || callData?.provider_mode === 'REAL' ? (
          <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span><strong>Live Plivo Telephony Active:</strong> Ringing mobile phone <span className="font-mono text-white font-bold">{callData?.phone_number}</span>. Callee voice audio streaming in real time.</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">REAL CARRIER CALL</span>
          </div>
        ) : (
          <div className="px-6 py-2.5 bg-amber-950/40 border-b border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>In-Browser Audio Simulation Active:</strong> Carrier credentials not configured. 
                Your physical mobile phone will <u>not</u> ring. Ananya is speaking directly through your browser speakers and listening to your mic!
              </span>
            </div>
            {onNavigateToSettings && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSettings();
                }}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition shrink-0 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Key className="w-3 h-3" />
                Configure Plivo to Ring Phones
              </button>
            )}
          </div>
        )}

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
                    {isSpeakingAI ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Speaking in Telugu...
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Ready</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Telugu First AI Persona • Non-Negotiable ₹500–₹600 Pricing Guardrail
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
                  className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition cursor-pointer"
                  title="Interrupt Ananya while speaking"
                >
                  Interrupt (Barge-in)
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
                  <span>Ananya is thinking and generating Telugu response...</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Turn Simulator & Quick Principal Responses */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Principal's response (Click options or talk into microphone):
                </span>
                {speechNotice && (
                  <span className="text-[11px] text-amber-300 font-medium animate-pulse flex items-center gap-1">
                    <Mic className="w-3 h-3 text-rose-400" /> {speechNotice}
                  </span>
                )}
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

              {/* Custom Input & Mic Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendUtterance(customInput);
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isListening ? "Stop microphone recording" : "Speak into microphone in Telugu/English"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                  <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Mic'}</span>
                </button>

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

              {/* 8-Stage Conversion Funnel Tracker */}
              <div className="p-3 mb-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Conversion Funnel</span>
                  <span className="text-[9px] font-bold text-indigo-400">Target: Demo Request</span>
                </div>
                
                <div className="space-y-1">
                  {[
                    { id: 'CALL', label: '1. Call Dispatched' },
                    { id: 'INTRODUCE', label: '2. Introduce (AI Disclosed)' },
                    { id: 'UNDERSTAND', label: '3. Understand & Listen' },
                    { id: 'QUALIFY', label: '4. Qualify (Students/LMS)' },
                    { id: 'EXPLAIN', label: '5. Explain AI Books & Tutor' },
                    { id: 'GENERATE_INTEREST', label: '6. Generate Interest' },
                    { id: 'BOOK_DEMO', label: '7. Book Demo (Key Goal)' },
                    { id: 'SALES_HANDOFF', label: '8. Human Sales Handoff' },
                  ].map((step, sIdx) => {
                    const stageOrder = ['CALL', 'INTRODUCE', 'UNDERSTAND', 'QUALIFY', 'EXPLAIN', 'GENERATE_INTEREST', 'BOOK_DEMO', 'SALES_HANDOFF'];
                    const currentIdx = stageOrder.indexOf(liveState.funnel_stage || 'INTRODUCE');
                    const isCompleted = sIdx < currentIdx;
                    const isCurrent = sIdx === currentIdx;
                    const isDemo = step.id === 'BOOK_DEMO' || step.id === 'SALES_HANDOFF';

                    return (
                      <div 
                        key={step.id} 
                        className={`flex items-center justify-between px-2 py-1 rounded text-[10px] transition ${
                          isCurrent
                            ? isDemo
                              ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                              : 'bg-indigo-600/30 text-indigo-200 font-bold border border-indigo-500/40'
                            : isCompleted
                            ? 'text-emerald-400 font-medium'
                            : 'text-slate-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : isCurrent ? (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                          )}
                          {step.label}
                        </span>
                        {isCurrent && <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Current</span>}
                        {isCompleted && <span className="text-[9px] text-emerald-400">Done</span>}
                      </div>
                    );
                  })}
                </div>
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
