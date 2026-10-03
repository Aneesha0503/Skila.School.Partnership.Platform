"""
Voice Provider Abstraction for Skila AI Outbound Calling Platform.
Supports Sarvam AI (Telugu/English STT & TTS) and Mock Voice for development.
"""
from abc import ABC, abstractmethod
import os
import base64
import json
from typing import Optional, Dict, Any

class VoiceProvider(ABC):
    """Abstract Base Class for Voice Processing Providers (Sarvam, ElevenLabs, Deepgram)."""

    @abstractmethod
    async def speech_to_text(self, audio_bytes: bytes, language_code: str = "te-IN") -> str:
        """Transcribes incoming audio stream to text (Telugu / English / Mixed)."""
        pass

    @abstractmethod
    async def text_to_speech(
        self,
        text: str,
        language_code: str = "te-IN",
        speaker: str = "ananya"
    ) -> Dict[str, Any]:
        """Synthesizes text to natural speech audio bytes."""
        pass


class SarvamVoiceProvider(VoiceProvider):
    """
    Production Sarvam AI Voice Provider.
    Implements:
    - Sarvam STT (Saarika / Saaras models) with Telugu & code-switching support
    - Sarvam TTS (Bulbul models) with natural conversational cadence
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("SARVAM_API_KEY", "")
        self.is_configured = bool(self.api_key)

    async def speech_to_text(self, audio_bytes: bytes, language_code: str = "te-IN") -> str:
        if not self.is_configured:
            raise ValueError("SARVAM_API_KEY is not configured.")

        import httpx
        url = "https://api.sarvam.ai/speech-to-text"
        headers = {
            "api-subscription-key": self.api_key
        }
        
        # Audio file payload
        files = {
            "file": ("audio.wav", audio_bytes, "audio/wav")
        }
        data = {
            "model": "saarika:v2",
            "language_code": language_code
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, files=files, data=data, timeout=12.0)
            if resp.status_code >= 400:
                print(f"[Sarvam STT Error] HTTP {resp.status_code}: {resp.text}")
                return ""
            res_data = resp.json()
            return res_data.get("transcript") or ""

    async def text_to_speech(
        self,
        text: str,
        language_code: str = "te-IN",
        speaker: str = "ananya"
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("SARVAM_API_KEY is not configured.")

        import httpx
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        # Sarvam Bulbul TTS parameters
        payload = {
            "inputs": [text.strip()],
            "target_language_code": language_code,
            "speaker": speaker if speaker in ["meera", "pavithra", "arvind"] else "meera",
            "pitch": 0.0,
            "pace": 1.0,
            "loudness": 1.2,
            "speech_sample_rate": 8000, # Standard telephony rate
            "enable_preprocessing": True,
            "model": "bulbul:v1"
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=12.0)
            if resp.status_code >= 400:
                print(f"[Sarvam TTS Error] HTTP {resp.status_code}: {resp.text}")
                return {"audio_base64": "", "format": "wav", "sample_rate": 8000}
            res_data = resp.json()
            audios = res_data.get("audios") or []
            audio_b64 = audios[0] if audios else ""
            return {
                "audio_base64": audio_b64,
                "format": "wav",
                "sample_rate": 8000,
                "provider": "sarvam"
            }


class MockVoiceProvider(VoiceProvider):
    """
    Mock Voice Provider for sandbox development and zero-cost local testing.
    Provides instant transcription and realistic mock audio generation.
    """

    def __init__(self):
        # 1-second silent WAV base64 placeholder for telephony audio pipeline
        self.mock_wav_base64 = "UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAAAAAAAAAAAAAAAA"

    async def speech_to_text(self, audio_bytes: bytes, language_code: str = "te-IN") -> str:
        # Returns realistic simulated transcription for testing
        return "Namaskaram andi. Maa school lo 600 students unnaru, details cheppandi."

    async def text_to_speech(
        self,
        text: str,
        language_code: str = "te-IN",
        speaker: str = "ananya"
    ) -> Dict[str, Any]:
        return {
            "audio_base64": self.mock_wav_base64,
            "format": "wav",
            "sample_rate": 8000,
            "provider": "mock",
            "mode": "MOCK MODE",
            "text": text
        }
