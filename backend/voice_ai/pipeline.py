"""
Real-time Voice Pipeline Session & Interruption Manager (Pipecat Architecture).
Bridges Telephony (Plivo/Mock), Speech STT/TTS (Sarvam/Mock), and Brain (OpenAI/Mock).
"""
import asyncio
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable
from .telephony import TelephonyProvider, PlivoTelephonyProvider, MockTelephonyProvider
from .voice import VoiceProvider, SarvamVoiceProvider, MockVoiceProvider
from .brain import LLMProvider, OpenAIProvider, MockLLMProvider
from .prompts import SKILA_AI_SYSTEM_PROMPT

class CallSession:
    """
    Active Voice AI Call Session with turn detection, state tracking, and barge-in support.
    """

    def __init__(
        self,
        call_id: str,
        school_id: str,
        school_info: Dict[str, Any],
        telephony: TelephonyProvider,
        voice: VoiceProvider,
        llm: LLMProvider,
        on_turn_callback: Optional[Callable[[Dict[str, Any]], Any]] = None,
        on_complete_callback: Optional[Callable[[Dict[str, Any]], Any]] = None
    ):
        self.call_id = call_id
        self.school_id = school_id
        self.school_info = school_info
        self.telephony = telephony
        self.voice = voice
        self.llm = llm
        self.on_turn_callback = on_turn_callback
        self.on_complete_callback = on_complete_callback

        self.started_at = time.time()
        self.is_active = True
        self.is_speaking = False
        self.interrupted = False

        # Conversation State
        self.state: Dict[str, Any] = {
            "language": "te-IN",
            "student_count": None,
            "current_lms": None,
            "current_erp": None,
            "pain_points": [],
            "interest_level": "WARM",
            "lead_status": "CONNECTED",
            "demo_requested": False,
            "pricing_discussed": False,
            "pricing_discussion_required": False,
            "callback_requested": False,
            "details_requested": False,
            "management_approval_required": False
        }

        # Timestamped transcript
        self.transcript_lines: List[Dict[str, Any]] = []
        self.conversation_history: List[Dict[str, str]] = []

    def format_timestamp(self) -> str:
        elapsed = int(time.time() - self.started_at)
        mins = elapsed // 60
        secs = elapsed % 60
        return f"{mins:02d}:{secs:02d}"

    def record_turn(self, speaker: str, text: str) -> Dict[str, Any]:
        ts = self.format_timestamp()
        turn_data = {
            "timestamp": ts,
            "speaker": speaker,
            "text": text.strip()
        }
        self.transcript_lines.append(turn_data)
        role = "assistant" if "ananya" in speaker.lower() or "ai" in speaker.lower() else "user"
        self.conversation_history.append({"role": role, "content": text.strip()})
        
        if self.on_turn_callback:
            try:
                self.on_turn_callback(turn_data)
            except Exception as e:
                print(f"[Pipeline] Turn callback error: {e}")
        return turn_data

    async def start_call(self) -> Dict[str, Any]:
        """Dispatches opening greeting in natural conversational Telugu with AI disclosure."""
        opening = (
            "Namaskaram sir, nenu Skila AI nunchi automated AI assistant ni. "
            "Mee school kosam educational technology solution gurinchi short ga maatladataniki call chestunnanu. "
            "Ippudu maatladataniki convenient ga unda?"
        )
        self.is_speaking = True
        turn = self.record_turn("Ananya (Skila AI)", opening)
        tts_res = await self.voice.text_to_speech(opening, language_code="te-IN", speaker="ananya")
        self.is_speaking = False
        return {
            "turn": turn,
            "tts": tts_res,
            "state": self.state
        }

    async def handle_user_speech(self, user_text: str) -> Dict[str, Any]:
        """
        Processes utterance from the principal.
        Handles barge-in (interruption) and generates immediate context-aware Telugu reply.
        """
        if not self.is_active or not user_text.strip():
            return {}

        # 1. Barge-in / Interruption check: If AI was speaking, immediately stop speaking
        if self.is_speaking:
            self.interrupted = True
            self.is_speaking = False

        # 2. Record Principal's response
        self.record_turn("Principal", user_text)

        # 3. Generate Brain Response via LLM
        brain_res = await self.llm.generate_response(
            conversation_history=self.conversation_history,
            current_state=self.state,
            user_utterance=user_text,
            school_info=self.school_info
        )

        reply_text = brain_res.get("reply", "Arthamaindi sir, mee school requirements gurinchi cheppandi.")
        self.state = brain_res.get("updated_state", self.state)

        # 4. Check for immediate termination triggers
        is_closing = False
        if self.state.get("lead_status") in ["DO_NOT_CALL", "NOT_INTERESTED"]:
            is_closing = True

        # 5. Synthesize TTS response
        self.is_speaking = True
        turn = self.record_turn("Ananya (Skila AI)", reply_text)
        tts_res = await self.voice.text_to_speech(reply_text, language_code="te-IN", speaker="ananya")
        self.is_speaking = False

        if is_closing:
            asyncio.create_task(self._auto_close_after_speech())

        return {
            "turn": turn,
            "tts": tts_res,
            "state": self.state,
            "is_closing": is_closing
        }

    async def _auto_close_after_speech(self):
        await asyncio.sleep(4)
        if self.is_active:
            await self.end_call()

    async def end_call(self) -> Dict[str, Any]:
        """Terminates call, compiles full transcript, runs post-call analysis, and triggers callbacks."""
        if not self.is_active:
            return {}
        self.is_active = False
        self.is_speaking = False
        duration = int(time.time() - self.started_at)

        # Format full transcript string
        transcript_str = "\n".join([f"{t['timestamp']} {t['speaker']}:\n{t['text']}\n" for t in self.transcript_lines])

        # Run post-call LLM analysis
        analysis = await self.llm.analyze_call(
            transcript=transcript_str,
            metadata={"call_id": self.call_id, "school_id": self.school_id, "duration": duration}
        )

        # Merge extracted analysis into state
        self.state["lead_status"] = analysis.get("lead_status", self.state.get("lead_status", "CONNECTED"))
        self.state["interest_level"] = analysis.get("interest_level", self.state.get("interest_level", "WARM"))
        if analysis.get("student_count"):
            self.state["student_count"] = analysis["student_count"]

        call_summary = {
            "call_id": self.call_id,
            "school_id": self.school_id,
            "school_name": self.school_info.get("school_name", "School"),
            "district": self.school_info.get("district", ""),
            "duration": duration,
            "transcript_lines": self.transcript_lines,
            "transcript_text": transcript_str,
            "analysis": analysis,
            "state": self.state,
            "ended_at": datetime.now(timezone.utc).isoformat()
        }

        if self.on_complete_callback:
            try:
                self.on_complete_callback(call_summary)
            except Exception as e:
                print(f"[Pipeline] Complete callback error: {e}")

        return call_summary


class VoicePipelineManager:
    """Manages active call sessions across the platform."""

    def __init__(self):
        self.active_sessions: Dict[str, CallSession] = {}

    def get_session(self, call_id: str) -> Optional[CallSession]:
        return self.active_sessions.get(call_id)

    def register_session(self, session: CallSession):
        self.active_sessions[session.call_id] = session

    def remove_session(self, call_id: str) -> Optional[CallSession]:
        return self.active_sessions.pop(call_id, None)
