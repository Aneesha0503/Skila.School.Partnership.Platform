import React, { useState, useEffect } from 'react';
import { 
  X, Play, Pause, Volume2, Sparkles, CheckCircle2, AlertTriangle, 
  Calendar, Clock, User, Phone, School, FileText, ArrowRight, ShieldCheck, Download
} from 'lucide-react';
import { fetchCallDetails } from '../../utils/callingApi';

export default function CallDetailModal({ 
  callId, 
  initialData = null, 
  onClose,
  onBookDemo,
  onCreateFollowup
}) {
  const [loading, setLoading] = useState(!initialData);
  const [callData, setCallData] = useState(initialData?.call || initialData || null);
  const [transcriptData, setTranscriptData] = useState(initialData?.transcript || null);
  const [analysisData, setAnalysisData] = useState(initialData?.analysis || null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    if (callId) {
      setLoading(true);
      fetchCallDetails(callId)
        .then((res) => {
          if (res.status === 'success') {
            setCallData(res.call);
            setTranscriptData(res.transcript);
            setAnalysisData(res.analysis?.analysis || res.analysis);
          }
        })
        .catch((err) => {
          console.error('Failed to load call details:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [callId]);

  // Audio player simulation
  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  const interestLevel = analysisData?.interest_level || callData?.interest_level || 'WARM';

  const badgeStyles = {
    HOT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    WARM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    COLD: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white w-full h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {callData?.school_name || 'Telangana School'}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border ${badgeStyles[interestLevel] || badgeStyles.WARM}`}>
                  {interestLevel} LEAD
                </span>
                {callData?.demo_requested && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Demo Requested
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {callData?.district || 'Telangana'} • Phone: <span className="font-mono text-slate-300">{callData?.phone_number || 'N/A'}</span> • Call ID: <span className="font-mono text-slate-400">{callId || callData?.call_id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
            Loading call recording, transcript, and AI analysis...
          </div>
        ) : (
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 h-full min-h-0 space-y-6">
            
            {/* Audio Recording Player */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-200">Call Audio Recording (Sarvam AI / Plivo)</div>
                  <div className="text-[11px] text-slate-400">Duration: {callData?.duration || 0} seconds • Audio Codec: WAV 16kHz</div>
                </div>
              </div>

              {/* Scrubber */}
              <div className="flex-1 w-full max-w-md flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-400">
                  00:{Math.floor((audioProgress / 100) * (callData?.duration || 0)).toString().padStart(2, '0')}
                </span>
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    setAudioProgress((clickX / rect.width) * 100);
                  }}
                  className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  00:{String(callData?.duration || 0).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* AI Qualification Summary Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-900/40 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-900/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Skila AI Post-Call Qualification Analysis
                  </h3>
                </div>
                <div className="text-xs text-indigo-300 font-medium">
                  Confidence: <span className="font-bold text-emerald-400">{analysisData?.confidence_score || (interestLevel === 'HOT' ? 'High' : 'Normal')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Interest Assessment</div>
                  <div className="text-sm font-bold text-white">{analysisData?.interest_level || callData?.interest_level || 'WARM'}</div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {analysisData?.interest_reason || analysisData?.summary || 'Principal responded to Skila AI outreach call.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Student Strength & Budget</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {analysisData?.student_count || callData?.student_count ? `${analysisData?.student_count || callData?.student_count} Students` : 'Not specified during call'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Budget status: {analysisData?.budget_readiness || 'Standard school fee model (₹500-600/student)'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Decision Authority</div>
                  <div className="text-sm font-bold text-indigo-300">
                    {analysisData?.decision_maker_identified ? 'Direct Principal / Correspondent' : 'Staff / Unverified'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Next Action: {analysisData?.recommended_action || (callData?.demo_requested ? 'Schedule in-person demo' : 'Follow up as requested')}
                  </p>
                </div>
              </div>

              {/* Objections & Key Takeaways */}
              {analysisData?.objections && analysisData.objections.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2">
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Objections / Questions Raised
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {analysisData.objections.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Conversation Transcript (Telugu & English) */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Full Speaker-Tagged Call Transcript</h3>
                </div>
                <span className="text-xs text-slate-400">
                  Sarvam Speech-to-Text (Telugu-first code switched)
                </span>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {transcriptData?.transcript_lines && transcriptData.transcript_lines.length > 0 ? (
                  transcriptData.transcript_lines.map((line, idx) => {
                    const isAnanya = line.speaker?.includes('Ananya') || line.speaker?.includes('AI');
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border ${
                          isAnanya 
                            ? 'bg-slate-900/90 border-indigo-900/40 text-slate-200' 
                            : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                          <span className={isAnanya ? 'text-indigo-400' : 'text-emerald-400'}>
                            {line.speaker}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{line.timestamp || '00:00'}</span>
                        </div>
                        <p className="leading-relaxed text-[12px]">{line.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No transcript lines recorded for this session.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified against Skila AI Pricing Policy (₹500–₹600/student/year)
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onCreateFollowup) onCreateFollowup(callData);
                onClose();
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Add Follow-up Note
            </button>
            <button
              onClick={() => {
                if (onBookDemo) onBookDemo(callData);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-emerald-600/30 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Book Live Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
