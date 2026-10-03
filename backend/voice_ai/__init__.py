"""
Skila AI Voice AI Package.
Telugu-First Outbound Calling Engine with Plivo, Sarvam AI, OpenAI, and Pipecat Architecture.
"""
from .telephony import TelephonyProvider, PlivoTelephonyProvider, MockTelephonyProvider
from .voice import VoiceProvider, SarvamVoiceProvider, MockVoiceProvider
from .brain import LLMProvider, OpenAIProvider, MockLLMProvider
from .pipeline import CallSession, VoicePipelineManager
from .prompts import SKILA_AI_SYSTEM_PROMPT, POST_CALL_ANALYSIS_PROMPT

__all__ = [
    "TelephonyProvider",
    "PlivoTelephonyProvider",
    "MockTelephonyProvider",
    "VoiceProvider",
    "SarvamVoiceProvider",
    "MockVoiceProvider",
    "LLMProvider",
    "OpenAIProvider",
    "MockLLMProvider",
    "CallSession",
    "VoicePipelineManager",
    "SKILA_AI_SYSTEM_PROMPT",
    "POST_CALL_ANALYSIS_PROMPT"
]
