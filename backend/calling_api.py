"""
FastAPI Router for Skila AI Outbound Calling Platform.
Mounts REST & WebSocket endpoints for single calls, bulk campaigns, live transcripts,
AI evaluation, and human handoff.
"""
import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, Body, Header
from pydantic import BaseModel

from firebase_config import get_db
from voice_ai import (
    TelephonyProvider, PlivoTelephonyProvider, MockTelephonyProvider,
    VoiceProvider, SarvamVoiceProvider, MockVoiceProvider,
    LLMProvider, OpenAIProvider, MockLLMProvider,
    CallSession, VoicePipelineManager
)

router = APIRouter(prefix="/api/calling", tags=["Skila AI Outbound Calling"])
db = get_db()
pipeline_mgr = VoicePipelineManager()

# ==========================================
# PROVIDER FACTORY (REAL vs MOCK MODE)
# ==========================================
def get_providers(force_mock: bool = False):
    """
    Instantiates telephony, voice, and LLM providers.
    Uses real Plivo, Sarvam, and OpenAI if credentials are present and not forced to mock.
    """
    has_plivo = bool(os.environ.get("PLIVO_AUTH_ID") and os.environ.get("PLIVO_AUTH_TOKEN"))
    has_sarvam = bool(os.environ.get("SARVAM_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))

    if not force_mock and has_plivo:
        telephony = PlivoTelephonyProvider()
    else:
        telephony = MockTelephonyProvider()

    if not force_mock and has_sarvam:
        voice = SarvamVoiceProvider()
    else:
        voice = MockVoiceProvider()

    if not force_mock and has_openai:
        llm = OpenAIProvider()
    else:
        llm = MockLLMProvider()

    is_real_mode = not force_mock and (has_plivo and has_sarvam and has_openai)
    return telephony, voice, llm, is_real_mode


# ==========================================
# REQUEST / RESPONSE SCHEMAS
# ==========================================
class CallInitiateRequest(BaseModel):
    school_id: Optional[str] = None
    school_name: Optional[str] = "Government High School"
    phone_number: str
    district: Optional[str] = "Hyderabad"
    principal_name: Optional[str] = "Principal"
    force_mock: Optional[bool] = False

class TurnRequest(BaseModel):
    call_id: str
    user_speech: str

class CampaignCreateRequest(BaseModel):
    name: str
    district: Optional[str] = "All Telangana"
    target_count: Optional[int] = 50
    daily_call_limit: Optional[int] = 20

class SettingsUpdateRequest(BaseModel):
    ai_persona_name: Optional[str] = "Ananya"
    ai_role_title: Optional[str] = "Skila AI School Outreach Assistant"
    primary_language: Optional[str] = "te-IN"
    force_mock_mode: Optional[bool] = False


# ==========================================
# REST ENDPOINTS
# ==========================================

@router.get("/dashboard")
def get_calling_dashboard():
    """Returns top executive metric cards and live calling activity."""
    calls_col = db.collection("calls")
    schools_col = db.collection("schools")
    demos_col = db.collection("demos")
    followups_col = db.collection("followups")

    all_calls = [doc.to_dict() for doc in calls_col.stream()]
    all_schools = [doc.to_dict() for doc in schools_col.stream()]
    all_demos = [doc.to_dict() for doc in demos_col.stream()]
    all_followups = [doc.to_dict() for doc in followups_col.stream()]

    total_schools = len(all_schools)
    total_calls = len(all_calls)
    connected_calls = len([c for c in all_calls if c.get("status") in ["CONNECTED", "COMPLETED", "INTERESTED", "DEMO_REQUESTED", "HOT"]])
    interested_calls = len([c for c in all_calls if c.get("interest_level") in ["HOT", "WARM"] or c.get("status") in ["INTERESTED", "DEMO_REQUESTED"]])
    hot_leads = len([c for c in all_calls if c.get("interest_level") == "HOT" or c.get("status") == "HOT"])
    demo_count = len(all_demos)
    followup_count = len([f for f in all_followups if not f.get("completed")])
    conversions = len([c for c in all_calls if c.get("demo_requested") or c.get("status") == "DEMO_REQUESTED"])

    # Recent calls sorted by created_at
    all_calls.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {
        "status": "success",
        "metrics": {
            "total_schools": total_schools,
            "calls_made": total_calls,
            "connected": connected_calls,
            "interested": interested_calls,
            "hot_leads": hot_leads,
            "demos": demo_count,
            "followups": followup_count,
            "conversions": conversions,
            "answer_rate": round((connected_calls / total_calls * 100), 1) if total_calls > 0 else 0.0,
            "hot_rate": round((hot_leads / total_calls * 100), 1) if total_calls > 0 else 0.0
        },
        "recent_calls": all_calls[:12]
    }


@router.post("/initiate")
async def initiate_single_call(payload: CallInitiateRequest):
    """
    Dispatches single AI outbound call to a school principal.
    Starts streaming voice session with Ananya in Telugu.
    """
    call_id = f"call_{uuid.uuid4().hex[:10]}"
    telephony, voice, llm, is_real = get_providers(force_mock=payload.force_mock)

    # Resolve school profile
    school_info = {
        "school_id": payload.school_id or f"sch_{uuid.uuid4().hex[:6]}",
        "school_name": payload.school_name,
        "phone_number": payload.phone_number,
        "district": payload.district,
        "principal_name": payload.principal_name
    }
    if payload.school_id:
        doc = db.collection("schools").document(payload.school_id).get()
        if doc.exists:
            s_dict = doc.to_dict()
            info = s_dict.get("info") or {}
            school_info["school_name"] = info.get("school_name") or s_dict.get("name") or payload.school_name
            school_info["phone_number"] = info.get("phone") or s_dict.get("contact", {}).get("phone") or payload.phone_number
            school_info["district"] = (s_dict.get("hierarchy") or {}).get("district") or payload.district

    now = datetime.now(timezone.utc).isoformat()

    # Callback when call finishes: persist to Firestore
    def save_completed_call(summary: Dict[str, Any]):
        cid = summary["call_id"]
        sid = summary["school_id"]

        call_record = {
            "call_id": cid,
            "school_id": sid,
            "school_name": summary.get("school_name"),
            "district": summary.get("district"),
            "phone_number": payload.phone_number,
            "duration": summary.get("duration", 0),
            "status": summary.get("state", {}).get("lead_status", "COMPLETED"),
            "interest_level": summary.get("state", {}).get("interest_level", "WARM"),
            "demo_requested": summary.get("state", {}).get("demo_requested", False),
            "student_count": summary.get("state", {}).get("student_count"),
            "recording_url": f"https://storage.googleapis.com/skila-calls/{cid}.wav",
            "created_at": now,
            "ended_at": summary.get("ended_at", now),
            "provider_mode": "REAL" if is_real else "MOCK"
        }
        db.collection("calls").document(cid).set(call_record)

        # Save transcript
        db.collection("transcripts").document(cid).set({
            "call_id": cid,
            "school_id": sid,
            "transcript_lines": summary.get("transcript_lines", []),
            "full_text": summary.get("transcript_text", ""),
            "created_at": now
        })

        # Save AI analysis
        analysis = summary.get("analysis") or {}
        db.collection("ai_analyses").document(cid).set({
            "call_id": cid,
            "school_id": sid,
            "school_name": summary.get("school_name"),
            "analysis": analysis,
            "created_at": now
        })

        # If HOT lead or demo requested, create follow-up task
        interest = summary.get("state", {}).get("interest_level")
        if interest == "HOT" or summary.get("state", {}).get("demo_requested"):
            fid = f"fol_{uuid.uuid4().hex[:8]}"
            db.collection("followups").document(fid).set({
                "id": fid,
                "call_id": cid,
                "school_id": sid,
                "school_name": summary.get("school_name"),
                "district": summary.get("district"),
                "phone": payload.phone_number,
                "urgency": "High",
                "action": "BOOK_DEMO",
                "notes": analysis.get("interest_reason") or "Principal requested live Skila AI demo",
                "created_at": now,
                "completed": False
            })

            if summary.get("state", {}).get("demo_requested"):
                did = f"demo_{uuid.uuid4().hex[:8]}"
                db.collection("demos").document(did).set({
                    "id": did,
                    "call_id": cid,
                    "school_id": sid,
                    "school_name": summary.get("school_name"),
                    "district": summary.get("district"),
                    "scheduled_status": "Requested",
                    "student_count": summary.get("state", {}).get("student_count") or 500,
                    "created_at": now
                })

        # Update school record in database
        if payload.school_id:
            s_ref = db.collection("schools").document(payload.school_id)
            s_doc = s_ref.get()
            if s_doc.exists:
                s_data = s_doc.to_dict()
                sales = s_data.setdefault("sales", {})
                sales["last_contact_date"] = now[:10]
                sales["lead_status"] = "Contacted" if sales.get("lead_status") == "New" else sales.get("lead_status")
                s_data["ai_calling_status"] = summary.get("state", {}).get("lead_status")
                s_data["ai_interest_level"] = summary.get("state", {}).get("interest_level")
                s_data["updated_at"] = now
                s_ref.set(s_data)

    # Initialize Voice Pipeline Session
    session = CallSession(
        call_id=call_id,
        school_id=school_info["school_id"],
        school_info=school_info,
        telephony=telephony,
        voice=voice,
        llm=llm,
        on_complete_callback=save_completed_call
    )
    pipeline_mgr.register_session(session)

    # Trigger Telephony call
    tel_res = await telephony.create_call(
        to_number=payload.phone_number,
        webhook_url="/api/calling/plivo/webhook",
        extra_data={"call_id": call_id, "school_id": school_info["school_id"]}
    )

    # Generate initial greeting from Ananya
    greeting_turn = await session.start_call()

    # Save initial pending call record
    db.collection("calls").document(call_id).set({
        "call_id": call_id,
        "school_id": school_info["school_id"],
        "school_name": school_info["school_name"],
        "district": school_info["district"],
        "phone_number": payload.phone_number,
        "duration": 0,
        "status": "CALLING" if is_real else "CONNECTED",
        "interest_level": "WARM",
        "created_at": now,
        "provider_mode": "REAL" if is_real else "MOCK"
    })

    return {
        "status": "success",
        "call_id": call_id,
        "provider_mode": "REAL" if is_real else "MOCK",
        "telephony": tel_res,
        "initial_turn": greeting_turn["turn"],
        "audio_base64": greeting_turn["tts"].get("audio_base64", ""),
        "message": f"Outbound call initiated to {school_info['school_name']} in Telugu"
    }


@router.post("/speech-turn")
async def process_speech_turn(payload: TurnRequest):
    """
    Submits user utterance from either telephony stream or browser simulator.
    Returns Ananya's Telugu reply and audio bytes with low latency.
    """
    session = pipeline_mgr.get_session(payload.call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Active call session not found or already completed.")

    res = await session.handle_user_speech(payload.user_speech)
    return {
        "status": "success",
        "call_id": payload.call_id,
        "ai_turn": res.get("turn"),
        "audio_base64": res.get("tts", {}).get("audio_base64", ""),
        "state": res.get("state"),
        "is_closing": res.get("is_closing", False)
    }


@router.post("/end/{call_id}")
async def end_active_call(call_id: str):
    """Terminates active call, runs AI evaluation, and persists results."""
    session = pipeline_mgr.get_session(call_id)
    if not session:
        # Check if already saved in db
        doc = db.collection("calls").document(call_id).get()
        if doc.exists:
            return {"status": "success", "message": "Call already completed", "call": doc.to_dict()}
        raise HTTPException(status_code=404, detail="Call session not found")

    summary = await session.end_call()
    pipeline_mgr.remove_session(call_id)
    return {
        "status": "success",
        "message": "Call completed and evaluated by Skila AI",
        "summary": summary
    }


@router.get("/calls")
def get_call_history(
    interest: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Lists all call records with optional filtering."""
    calls_col = db.collection("calls")
    docs = [d.to_dict() for d in calls_col.stream()]
    docs.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    filtered = []
    for c in docs:
        if interest and interest != "All" and c.get("interest_level") != interest:
            continue
        if status and status != "All" and c.get("status") != status:
            continue
        if search:
            q = search.lower()
            name = (c.get("school_name") or "").lower()
            dist = (c.get("district") or "").lower()
            phone = (c.get("phone_number") or "").lower()
            if q not in name and q not in dist and q not in phone:
                continue
        filtered.append(c)

    return {"status": "success", "count": len(filtered), "calls": filtered}


@router.get("/calls/{call_id}")
def get_call_details(call_id: str):
    """Returns single call details including transcript and AI analysis."""
    call_doc = db.collection("calls").document(call_id).get()
    if not call_doc.exists:
        raise HTTPException(status_code=404, detail="Call not found")

    call_data = call_doc.to_dict()
    transcript_doc = db.collection("transcripts").document(call_id).get()
    analysis_doc = db.collection("ai_analyses").document(call_id).get()

    return {
        "status": "success",
        "call": call_data,
        "transcript": transcript_doc.to_dict() if transcript_doc.exists else {},
        "analysis": analysis_doc.to_dict() if analysis_doc.exists else {}
    }


@router.get("/hot-leads")
def get_hot_leads():
    """Returns schools classified as HOT leads requiring immediate human salesperson follow-up."""
    calls_col = db.collection("calls")
    docs = [d.to_dict() for d in calls_col.stream()]
    
    hot = [c for c in docs if c.get("interest_level") == "HOT" or c.get("demo_requested")]
    hot.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {"status": "success", "count": len(hot), "hot_leads": hot}


@router.get("/followups")
def get_followups():
    """Lists open sales follow-up tasks."""
    col = db.collection("followups")
    docs = [d.to_dict() for d in col.stream()]
    docs.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return {"status": "success", "count": len(docs), "followups": docs}


@router.post("/followups/{followup_id}/complete")
def mark_followup_complete(followup_id: str):
    """Marks a follow-up task as resolved."""
    ref = db.collection("followups").document(followup_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Follow-up task not found")
    data = doc.to_dict()
    data["completed"] = True
    data["completed_at"] = datetime.now(timezone.utc).isoformat()
    ref.set(data)
    return {"status": "success", "message": "Follow-up completed"}


@router.get("/demos")
def get_demos():
    """Lists booked and requested product demos."""
    col = db.collection("demos")
    docs = [d.to_dict() for d in col.stream()]
    docs.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return {"status": "success", "count": len(docs), "demos": docs}


@router.get("/campaigns")
def get_campaigns():
    """Lists outbound call campaigns."""
    col = db.collection("campaigns")
    docs = [d.to_dict() for d in col.stream()]
    if not docs:
        # Seed initial campaign
        init_camp = {
            "id": "camp_telangana_main",
            "name": "Telangana School Outreach 2026",
            "district": "All Telangana",
            "status": "RUNNING",
            "total_leads": 120,
            "calls_made": 42,
            "connected": 28,
            "interested": 14,
            "hot_leads": 8,
            "demos_requested": 6,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.collection("campaigns").document(init_camp["id"]).set(init_camp)
        docs = [init_camp]
    return {"status": "success", "campaigns": docs}


@router.post("/campaigns")
def create_campaign(payload: CampaignCreateRequest):
    """Creates a new calling campaign."""
    cid = f"camp_{uuid.uuid4().hex[:8]}"
    camp_data = {
        "id": cid,
        "name": payload.name,
        "district": payload.district,
        "status": "NEW",
        "total_leads": payload.target_count,
        "calls_made": 0,
        "connected": 0,
        "interested": 0,
        "hot_leads": 0,
        "demos_requested": 0,
        "daily_limit": payload.daily_call_limit,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.collection("campaigns").document(cid).set(camp_data)
    return {"status": "success", "campaign": camp_data}


@router.post("/campaigns/{campaign_id}/action")
def update_campaign_status(campaign_id: str, action: str = Query(...)):
    """Starts, pauses, resumes, or stops a calling campaign."""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")

    data = doc.to_dict()
    act = action.upper()
    if act == "START" or act == "RESUME":
        data["status"] = "RUNNING"
    elif act == "PAUSE":
        data["status"] = "PAUSED"
    elif act == "STOP":
        data["status"] = "COMPLETED"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use START, PAUSE, RESUME, STOP.")

    ref.set(data)
    return {"status": "success", "campaign": data}


@router.get("/analytics")
def get_calling_analytics():
    """Returns analytics covering call outcomes, interest levels, and Telangana districts."""
    calls = [d.to_dict() for d in db.collection("calls").stream()]

    districts_map = {}
    lead_status_map = {}
    interest_map = {"HOT": 0, "WARM": 0, "COLD": 0}

    for c in calls:
        dist = c.get("district") or "Hyderabad"
        districts_map[dist] = districts_map.get(dist, 0) + 1

        st = c.get("status") or "COMPLETED"
        lead_status_map[st] = lead_status_map.get(st, 0) + 1

        lvl = c.get("interest_level") or "WARM"
        interest_map[lvl] = interest_map.get(lvl, 0) + 1

    return {
        "status": "success",
        "total_calls": len(calls),
        "interest_distribution": interest_map,
        "status_distribution": lead_status_map,
        "district_distribution": [{"district": k, "count": v} for k, v in districts_map.items()]
    }


@router.get("/settings")
def get_calling_settings():
    """Returns active AI assistant configuration and vendor credentials status."""
    has_plivo = bool(os.environ.get("PLIVO_AUTH_ID") and os.environ.get("PLIVO_AUTH_TOKEN"))
    has_sarvam = bool(os.environ.get("SARVAM_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))

    doc = db.collection("settings").document("ai_calling").get()
    saved = doc.to_dict() if doc.exists else {}

    return {
        "status": "success",
        "settings": {
            "ai_persona_name": saved.get("ai_persona_name", "Ananya"),
            "ai_role_title": saved.get("ai_role_title", "Skila AI School Outreach Assistant"),
            "primary_language": saved.get("primary_language", "Telugu (te-IN) + English Code-switching"),
            "opening_greeting": (
                "Namaskaram sir/madam, nenu Skila AI nunchi automated AI assistant ni. "
                "Mee school kosam educational technology solution gurinchi short ga maatladataniki call chestunnanu. "
                "Ippudu maatladataniki convenient ga unda?"
            ),
            "target_pricing": "₹500 to ₹600 per student per year (Non-negotiable by AI)",
            "telephony_status": "Connected (Plivo)" if has_plivo else "Simulation Mode (Mock Plivo)",
            "voice_stt_tts_status": "Active (Sarvam AI Telugu)" if has_sarvam else "Simulation Mode (Mock Voice)",
            "brain_llm_status": "Active (OpenAI GPT-4o)" if has_openai else "Simulation Mode (Mock Brain)",
            "active_mode": "REAL TELEPHONY" if (has_plivo and has_sarvam and has_openai) else "MOCK SIMULATION"
        }
    }


@router.post("/settings")
def update_calling_settings(payload: SettingsUpdateRequest):
    """Updates AI assistant persona and language settings."""
    ref = db.collection("settings").document("ai_calling")
    data = payload.dict(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    ref.set(data)
    return {"status": "success", "message": "Calling settings updated successfully"}
