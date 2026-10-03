"""
Telephony Provider Abstraction for Skila AI Outbound Calling Platform.
Supports Plivo Telephony and Mock Telephony for zero-credential development.
"""
from abc import ABC, abstractmethod
import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class TelephonyProvider(ABC):
    """Abstract Base Class for Telephony Providers (Plivo, Twilio, Exotel, etc.)"""

    @abstractmethod
    async def create_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        webhook_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Initiates an outbound phone call."""
        pass

    @abstractmethod
    async def end_call(self, call_id: str) -> Dict[str, Any]:
        """Terminates an active phone call."""
        pass

    @abstractmethod
    def generate_stream_xml(self, stream_ws_url: str, welcome_message: Optional[str] = None) -> str:
        """Generates Telephony XML (e.g. Plivo XML) to bridge call to a bidirectional WebSocket stream."""
        pass

    @abstractmethod
    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Parses vendor-specific webhook payload into normalized event data."""
        pass


class PlivoTelephonyProvider(TelephonyProvider):
    """
    Real Plivo Telephony Provider.
    Uses Plivo REST API and Plivo XML Audio Stream (<Stream> tag).
    """

    def __init__(self, auth_id: Optional[str] = None, auth_token: Optional[str] = None, default_from: Optional[str] = None):
        self.auth_id = auth_id or os.environ.get("PLIVO_AUTH_ID", "")
        self.auth_token = auth_token or os.environ.get("PLIVO_AUTH_TOKEN", "")
        self.default_from = default_from or os.environ.get("PLIVO_PHONE_NUMBER", "+919876543210")
        self.is_configured = bool(self.auth_id and self.auth_token)

    async def create_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        webhook_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Plivo credentials (PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN) are not configured.")

        import httpx
        from_num = from_number or self.default_from
        call_uuid = f"plivo_{uuid.uuid4().hex[:12]}"
        
        # Format phone number with +91 if needed
        clean_to = to_number.strip().replace(" ", "").replace("-", "")
        if not clean_to.startswith("+"):
            if len(clean_to) == 10:
                clean_to = f"+91{clean_to}"
            else:
                clean_to = f"+{clean_to}"

        endpoint = f"https://api.plivo.com/v1/Account/{self.auth_id}/Call/"
        payload = {
            "from": from_num,
            "to": clean_to,
            "answer_url": webhook_url,
            "answer_method": "POST",
            "hangup_url": f"{webhook_url}/hangup" if webhook_url else None,
            "hangup_method": "POST"
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                endpoint,
                json=payload,
                auth=(self.auth_id, self.auth_token),
                timeout=15.0
            )
            data = resp.json()
            if resp.status_code >= 400:
                return {
                    "success": False,
                    "call_id": call_uuid,
                    "error": data.get("error") or data.get("message") or f"HTTP {resp.status_code}",
                    "provider": "plivo",
                    "status": "FAILED"
                }

            plivo_uuid = data.get("request_uuid") or call_uuid
            return {
                "success": True,
                "call_id": plivo_uuid,
                "provider": "plivo",
                "to": clean_to,
                "from": from_num,
                "status": "CALLING",
                "message": "Outbound call dispatched via Plivo"
            }

    async def end_call(self, call_id: str) -> Dict[str, Any]:
        if not self.is_configured:
            return {"success": False, "error": "Plivo credentials missing"}

        import httpx
        endpoint = f"https://api.plivo.com/v1/Account/{self.auth_id}/Call/{call_id}/"
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                endpoint,
                auth=(self.auth_id, self.auth_token),
                timeout=10.0
            )
            return {"success": resp.status_code < 400, "call_id": call_id, "status": "COMPLETED"}

    def generate_stream_xml(self, stream_ws_url: str, welcome_message: Optional[str] = None) -> str:
        """
        Generates Plivo XML stream response.
        Plivo connects to bidirectional WebSocket audio stream.
        """
        # Plivo XML audio streaming
        xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-l16;rate=8000">{stream_ws_url}</Stream>
</Response>"""
        return xml.strip()

    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        call_uuid = payload.get("CallUUID") or payload.get("request_uuid") or ""
        call_status = (payload.get("CallStatus") or payload.get("Event") or "in-progress").lower()
        
        normalized_status = "CONNECTED"
        if "ring" in call_status:
            normalized_status = "CALLING"
        elif "answer" in call_status or "in-progress" in call_status:
            normalized_status = "CONNECTED"
        elif "hangup" in call_status or "completed" in call_status:
            normalized_status = "COMPLETED"
        elif "busy" in call_status:
            normalized_status = "BUSY"
        elif "no-answer" in call_status:
            normalized_status = "NO_ANSWER"
        elif "fail" in call_status:
            normalized_status = "FAILED"

        return {
            "call_id": call_uuid,
            "status": normalized_status,
            "duration": int(payload.get("Duration") or 0),
            "from": payload.get("From") or "",
            "to": payload.get("To") or "",
            "recording_url": payload.get("RecordUrl") or ""
        }


class MockTelephonyProvider(TelephonyProvider):
    """
    Mock Telephony Provider for local testing, browser-based calls, and sandbox verification.
    Clearly identifies as MOCK MODE.
    """

    def __init__(self):
        self.active_mock_calls: Dict[str, Dict[str, Any]] = {}

    async def create_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        webhook_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        call_uuid = f"mock_call_{uuid.uuid4().hex[:8]}"
        clean_to = to_number.strip()
        from_num = from_number or "+918000SKILA"

        self.active_mock_calls[call_uuid] = {
            "call_id": call_uuid,
            "to": clean_to,
            "from": from_num,
            "status": "CONNECTED",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "extra_data": extra_data or {}
        }

        return {
            "success": True,
            "call_id": call_uuid,
            "provider": "mock",
            "mode": "MOCK MODE",
            "to": clean_to,
            "from": from_num,
            "status": "CONNECTED",
            "message": "Mock outbound call connected successfully (Simulation)"
        }

    async def end_call(self, call_id: str) -> Dict[str, Any]:
        call = self.active_mock_calls.pop(call_id, None)
        return {
            "success": True,
            "call_id": call_id,
            "provider": "mock",
            "status": "COMPLETED",
            "message": "Mock call completed"
        }

    def generate_stream_xml(self, stream_ws_url: str, welcome_message: Optional[str] = None) -> str:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <!-- MOCK MODE: Simulated Audio WebSocket Stream -->
    <Stream bidirectional="true">{stream_ws_url}</Stream>
</Response>"""

    def parse_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "call_id": payload.get("call_id") or "mock_call",
            "status": payload.get("status") or "CONNECTED",
            "duration": payload.get("duration") or 60,
            "from": payload.get("from") or "+918000SKILA",
            "to": payload.get("to") or "+919876543210",
            "recording_url": ""
        }
