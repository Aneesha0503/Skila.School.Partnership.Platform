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
        self.auth_id = (auth_id or os.environ.get("PLIVO_AUTH_ID", "")).strip()
        self.auth_token = (auth_token or os.environ.get("PLIVO_AUTH_TOKEN", "")).strip()
        self.default_from = (default_from or os.environ.get("PLIVO_PHONE_NUMBER", "")).strip()
        self.is_configured = bool(self.auth_id and self.auth_token)

    def normalize_phone_number(self, phone: str) -> str:
        """Normalizes Indian phone numbers to standard E.164 (+91XXXXXXXXXX) format."""
        clean = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if clean.startswith("+"):
            return clean
        if clean.startswith("0") and len(clean) == 11:
            return f"+91{clean[1:]}"
        if clean.startswith("91") and len(clean) == 12:
            return f"+{clean}"
        if len(clean) == 10:
            return f"+91{clean}"
        return f"+{clean}" if not clean.startswith("+") else clean

    async def test_connection(self) -> Dict[str, Any]:
        """Tests validity of Plivo credentials against Plivo REST API."""
        if not self.is_configured:
            return {
                "success": False,
                "error": "Plivo credentials (PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN) are missing."
            }

        import httpx
        endpoint = f"https://api.plivo.com/v1/Account/{self.auth_id}/"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    endpoint,
                    auth=(self.auth_id, self.auth_token),
                    timeout=12.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "success": True,
                        "account_type": data.get("account_type", "Standard"),
                        "cash_credits": data.get("cash_credits", "0.00"),
                        "currency": "USD",
                        "auth_id": self.auth_id[:6] + "..." + self.auth_id[-4:] if len(self.auth_id) > 10 else "***",
                        "phone_number": self.default_from,
                        "message": "Plivo carrier credentials verified successfully!"
                    }
                else:
                    data = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
                    err_msg = data.get("message") or data.get("error") or f"HTTP {resp.status_code}: Authentication Failed"
                    return {"success": False, "error": err_msg}
        except Exception as e:
            return {"success": False, "error": f"Connection to Plivo API timed out or failed: {str(e)}"}

    async def create_call(
        self,
        to_number: str,
        from_number: Optional[str] = None,
        webhook_url: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "success": False,
                "provider": "plivo",
                "error": "Plivo credentials (PLIVO_AUTH_ID and PLIVO_AUTH_TOKEN) are missing. In-browser simulation active.",
                "status": "FAILED"
            }

        import httpx
        from_num = from_number or self.default_from
        clean_to = self.normalize_phone_number(to_number)
        call_uuid = f"plivo_{uuid.uuid4().hex[:12]}"

        # Resolve webhook URL: Plivo requires an absolute public URL (https://...)
        resolved_webhook = webhook_url
        public_url = os.environ.get("PUBLIC_APP_URL", "").strip().rstrip("/")
        if resolved_webhook and not resolved_webhook.startswith("http"):
            if public_url:
                resolved_webhook = f"{public_url}{resolved_webhook}"
            else:
                # Without public URL, Plivo cannot reach localhost
                return {
                    "success": False,
                    "provider": "plivo",
                    "error": (
                        "Plivo requires a publicly accessible HTTPS Webhook URL (answer_url) to stream audio. "
                        "Please configure PUBLIC_APP_URL in Settings (e.g. your Ngrok URL https://xxx.ngrok-free.app or deployed domain)."
                    ),
                    "status": "FAILED"
                }

        endpoint = f"https://api.plivo.com/v1/Account/{self.auth_id}/Call/"
        payload = {
            "from": from_num,
            "to": clean_to,
            "answer_url": resolved_webhook,
            "answer_method": "POST",
            "hangup_url": f"{resolved_webhook}/hangup" if resolved_webhook else None,
            "hangup_method": "POST"
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    endpoint,
                    json=payload,
                    auth=(self.auth_id, self.auth_token),
                    timeout=15.0
                )
                data = resp.json()
                if resp.status_code >= 400:
                    err_msg = data.get("error") or data.get("message") or f"HTTP {resp.status_code}"
                    return {
                        "success": False,
                        "call_id": call_uuid,
                        "error": f"Plivo Error: {err_msg}",
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
                    "message": f"Real outbound carrier call dispatched to {clean_to} via Plivo"
                }
        except Exception as e:
            return {
                "success": False,
                "call_id": call_uuid,
                "error": f"Failed to contact Plivo API: {str(e)}",
                "provider": "plivo",
                "status": "FAILED"
            }

    async def end_call(self, call_id: str) -> Dict[str, Any]:
        if not self.is_configured:
            return {"success": False, "error": "Plivo credentials missing"}

        import httpx
        endpoint = f"https://api.plivo.com/v1/Account/{self.auth_id}/Call/{call_id}/"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.delete(
                    endpoint,
                    auth=(self.auth_id, self.auth_token),
                    timeout=10.0
                )
                return {"success": resp.status_code < 400, "call_id": call_id, "status": "COMPLETED"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_stream_xml(self, stream_ws_url: str, welcome_message: Optional[str] = None) -> str:
        """
        Generates Plivo XML stream response.
        If WebSocket streaming URL is provided, bridges call to bidirectional stream.
        Otherwise falls back to Plivo Speak with Telugu greeting.
        """
        if stream_ws_url and stream_ws_url.startswith("ws"):
            return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-l16;rate=8000">{stream_ws_url}</Stream>
</Response>""".strip()

        # Direct Speak XML fallback
        greeting = welcome_message or (
            "Namaskaram andi, nenu Skila AI nunchi Ananya ni. "
            "Mee school kosam AI technology solution gurinchi maatladataniki call chestunnanu."
        )
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak language="te-IN" voice="Polly.Aditi">{greeting}</Speak>
    <Wait length="1" />
</Response>""".strip()

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
            "to": payload.get("to") or payload.get("phone_number", ""),
            "recording_url": ""
        }
