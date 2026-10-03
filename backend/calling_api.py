import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, Body, Header, Request, Response
from pydantic import BaseModel
from dotenv import load_dotenv, set_key

load_dotenv()
ENV_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

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
    school_name: Optional[str] = None
    phone_number: Optional[str] = None
    district: Optional[str] = None
    principal_name: Optional[str] = None
    force_mock: Optional[bool] = False

class TurnRequest(BaseModel):
    call_id: str
    user_speech: str

class CampaignCreateRequest(BaseModel):
    name: str
    district: Optional[str] = None
    target_count: Optional[int] = 50
    daily_call_limit: Optional[int] = 20

class SettingsUpdateRequest(BaseModel):
    ai_persona_name: Optional[str] = "Ananya"
    ai_role_title: Optional[str] = "Skila AI School Outreach Assistant"
    primary_language: Optional[str] = "te-IN"
    force_mock_mode: Optional[bool] = False

class CredentialsUpdateRequest(BaseModel):
    plivo_auth_id: Optional[str] = None
    plivo_auth_token: Optional[str] = None
    plivo_phone_number: Optional[str] = None
    sarvam_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    public_webhook_url: Optional[str] = None

class TestPlivoRequest(BaseModel):
    auth_id: Optional[str] = None
    auth_token: Optional[str] = None



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

    # Resolve school profile dynamically from DB or payload
    school_name = (payload.school_name or "").strip()
    phone_number = (payload.phone_number or "").strip()
    district = (payload.district or "").strip()
    principal_name = (payload.principal_name or "").strip()
    student_count = None

    if payload.school_id:
        doc = db.collection("schools").document(payload.school_id).get()
        if doc.exists:
            s_dict = doc.to_dict()
            info = s_dict.get("info") or {}
            contact = s_dict.get("contact") or {}
            sales = s_dict.get("sales") or {}
            hierarchy = s_dict.get("hierarchy") or {}
            metrics = s_dict.get("metrics") or {}

            if not info.get("mobile") and hasattr(db, "local"):
                loc_doc = db.local.collection("schools").document(payload.school_id).get()
                if loc_doc.exists:
                    loc_d = loc_doc.to_dict()
                    loc_info = loc_d.get("info") or {}
                    loc_sales = loc_d.get("sales") or {}
                    for k in ["mobile", "principal_name", "correspondent_name", "email", "website", "student_strength"]:
                        if not info.get(k) and loc_info.get(k):
                            info[k] = loc_info[k]
                    if not sales.get("decision_maker_contact") and loc_sales.get("decision_maker_contact"):
                        sales["decision_maker_contact"] = loc_sales["decision_maker_contact"]

            school_name = info.get("school_name") or s_dict.get("name") or school_name
            phone_number = (
                phone_number or 
                info.get("mobile") or 
                info.get("phone") or 
                sales.get("decision_maker_contact") or 
                contact.get("phone") or 
                contact.get("mobile") or 
                s_dict.get("phone") or 
                ""
            )
            district = hierarchy.get("district") or district
            principal_name = info.get("principal_name") or contact.get("principal") or principal_name
            student_count = info.get("student_strength") or metrics.get("total_students")

            # If a phone number was passed in payload and wasn't in DB, persist it
            if payload.phone_number and (not info.get("mobile") or not sales.get("decision_maker_contact")):
                info["mobile"] = payload.phone_number
                sales["decision_maker_contact"] = payload.phone_number
                s_dict["info"] = info
                s_dict["sales"] = sales
                try:
                    db.collection("schools").document(payload.school_id).set(s_dict)
                except Exception as ex:
                    print(f"[Calling DB Update Warning] {ex}")

    if not phone_number:
        raise HTTPException(status_code=400, detail="A valid phone number is required to initiate an AI call.")

    school_info = {
        "school_id": payload.school_id or f"sch_{uuid.uuid4().hex[:6]}",
        "school_name": school_name or "School Lead",
        "phone_number": phone_number,
        "district": district or "Telangana",
        "principal_name": principal_name or "Principal",
        "student_count": student_count
    }

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
            "phone_number": school_info["phone_number"],
            "duration": summary.get("duration", 0),
            "status": summary.get("state", {}).get("lead_status", "COMPLETED"),
            "interest_level": summary.get("state", {}).get("interest_level", "WARM"),
            "demo_requested": summary.get("state", {}).get("demo_requested", False),
            "student_count": summary.get("state", {}).get("student_count") or school_info.get("student_count"),
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
                "phone": school_info["phone_number"],
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
                    "student_count": summary.get("state", {}).get("student_count") or school_info.get("student_count") or 0,
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
    public_url = (os.environ.get("PUBLIC_APP_URL") or "").strip().rstrip("/")
    webhook_url = f"{public_url}/api/calling/plivo/webhook" if public_url else "/api/calling/plivo/webhook"

    tel_res = await telephony.create_call(
        to_number=school_info["phone_number"],
        webhook_url=webhook_url,
        extra_data={"call_id": call_id, "school_id": school_info["school_id"]}
    )

    if is_real and not tel_res.get("success"):
        pipeline_mgr.remove_session(call_id)
        carrier_err = tel_res.get("error") or "Failed to place outbound call via Plivo"
        raise HTTPException(
            status_code=400,
            detail=f"{carrier_err}. Please verify your Plivo credentials and balance in Calling Settings."
        )

    # Generate initial greeting from Ananya
    greeting_turn = await session.start_call()

    # Save initial pending call record
    db.collection("calls").document(call_id).set({
        "call_id": call_id,
        "school_id": school_info["school_id"],
        "school_name": school_info["school_name"],
        "district": school_info["district"],
        "phone_number": school_info["phone_number"],
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
        "is_real_telephony": is_real,
        "phone_number": school_info["phone_number"],
        "telephony": tel_res,
        "initial_turn": greeting_turn["turn"],
        "audio_base64": greeting_turn["tts"].get("audio_base64", ""),
        "message": (
            f"Carrier phone call ringing {school_info['phone_number']} via Plivo"
            if is_real
            else f"In-Browser Telugu voice call started for {school_info['school_name']}"
        ),
        "simulation_notice": None if is_real else (
            "Simulation Mode: Plivo carrier credentials not configured in Settings/.env. "
            "Your mobile phone will not ring. Audio will play through browser speakers."
        )
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
    docs.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return {"status": "success", "campaigns": docs}


@router.post("/campaigns")
def create_campaign(payload: CampaignCreateRequest):
    """Creates a new calling campaign."""
    cid = f"camp_{uuid.uuid4().hex[:8]}"
    camp_data = {
        "id": cid,
        "name": payload.name,
        "district": payload.district or "All Telangana",
        "status": "NEW",
        "total_leads": payload.target_count or 50,
        "calls_made": 0,
        "connected": 0,
        "interested": 0,
        "hot_leads": 0,
        "demos_requested": 0,
        "daily_limit": payload.daily_call_limit or 20,
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
    """Returns dynamic analytics covering call outcomes, interest levels, objections, and districts."""
    calls = [d.to_dict() for d in db.collection("calls").stream()]

    districts_map = {}
    lead_status_map = {}
    interest_map = {"HOT": 0, "WARM": 0, "COLD": 0}

    for c in calls:
        dist = c.get("district")
        if dist:
            districts_map[dist] = districts_map.get(dist, 0) + 1

        st = c.get("status") or "COMPLETED"
        lead_status_map[st] = lead_status_map.get(st, 0) + 1

        lvl = c.get("interest_level") or "WARM"
        if lvl in interest_map:
            interest_map[lvl] += 1
        else:
            interest_map[lvl] = 1

    # Extract dynamic objections from actual AI analyses
    analyses = [d.to_dict() for d in db.collection("ai_analyses").stream()]
    objections_count = {}
    total_objections = 0
    for a in analyses:
        analysis_data = a.get("analysis") or {}
        for obj in analysis_data.get("objections", []):
            if obj and isinstance(obj, str):
                cleaned = obj.strip()
                objections_count[cleaned] = objections_count.get(cleaned, 0) + 1
                total_objections += 1

    objections_dist = []
    for k, v in sorted(objections_count.items(), key=lambda x: x[1], reverse=True):
        pct = round((v / total_objections * 100)) if total_objections > 0 else 0
        objections_dist.append({"title": k, "count": v, "pct": pct})

    return {
        "status": "success",
        "total_calls": len(calls),
        "interest_distribution": interest_map,
        "status_distribution": lead_status_map,
        "district_distribution": [{"district": k, "count": v} for k, v in sorted(districts_map.items(), key=lambda x: x[1], reverse=True)],
        "objections_distribution": objections_dist
    }


def mask_key(k: Optional[str]) -> str:
    if not k:
        return ""
    clean = k.strip()
    if len(clean) <= 6:
        return "***"
    return clean[:4] + "..." + clean[-4:]


@router.get("/settings")
def get_calling_settings():
    """Returns active AI assistant configuration and vendor credentials status."""
    has_plivo = bool(os.environ.get("PLIVO_AUTH_ID") and os.environ.get("PLIVO_AUTH_TOKEN"))
    has_sarvam = bool(os.environ.get("SARVAM_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))

    doc = db.collection("settings").document("ai_calling").get()
    saved = doc.to_dict() if doc.exists else {}

    plivo_id = os.environ.get("PLIVO_AUTH_ID", "").strip()
    plivo_token = os.environ.get("PLIVO_AUTH_TOKEN", "").strip()
    plivo_phone = os.environ.get("PLIVO_PHONE_NUMBER", "").strip()
    sarvam_key = os.environ.get("SARVAM_API_KEY", "").strip()
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    public_url = os.environ.get("PUBLIC_APP_URL", "").strip()

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
            "telephony_status": "Connected (Plivo Carrier Telephony)" if has_plivo else "In-Browser Simulation (No Plivo Keys)",
            "voice_stt_tts_status": "Active (Sarvam AI Telugu)" if has_sarvam else "Simulation / Browser Speech Synthesis",
            "brain_llm_status": "Active (OpenAI GPT-4o)" if has_openai else "Simulation / Heuristic LLM",
            "active_mode": "REAL TELEPHONY" if (has_plivo and has_sarvam and has_openai) else "MOCK SIMULATION",
            "has_plivo": has_plivo,
            "has_sarvam": has_sarvam,
            "has_openai": has_openai,
            "credentials": {
                "plivo_auth_id_masked": mask_key(plivo_id),
                "plivo_auth_token_set": bool(plivo_token),
                "plivo_phone_number": plivo_phone or "+91...",
                "sarvam_api_key_masked": mask_key(sarvam_key),
                "openai_api_key_masked": mask_key(openai_key),
                "public_webhook_url": public_url
            }
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


@router.post("/settings/credentials")
def update_credentials(payload: CredentialsUpdateRequest):
    """
    Securely saves vendor API credentials to backend/.env and updates active os.environ.
    Allows real-time activation of Plivo carrier phone calls and Sarvam speech models.
    """
    updates = {}
    if payload.plivo_auth_id is not None:
        v = payload.plivo_auth_id.strip()
        os.environ["PLIVO_AUTH_ID"] = v
        set_key(ENV_FILE_PATH, "PLIVO_AUTH_ID", v)
        updates["plivo_auth_id"] = bool(v)

    if payload.plivo_auth_token is not None:
        v = payload.plivo_auth_token.strip()
        os.environ["PLIVO_AUTH_TOKEN"] = v
        set_key(ENV_FILE_PATH, "PLIVO_AUTH_TOKEN", v)
        updates["plivo_auth_token"] = bool(v)

    if payload.plivo_phone_number is not None:
        v = payload.plivo_phone_number.strip()
        os.environ["PLIVO_PHONE_NUMBER"] = v
        set_key(ENV_FILE_PATH, "PLIVO_PHONE_NUMBER", v)
        updates["plivo_phone_number"] = bool(v)

    if payload.sarvam_api_key is not None:
        v = payload.sarvam_api_key.strip()
        os.environ["SARVAM_API_KEY"] = v
        set_key(ENV_FILE_PATH, "SARVAM_API_KEY", v)
        updates["sarvam_api_key"] = bool(v)

    if payload.openai_api_key is not None:
        v = payload.openai_api_key.strip()
        os.environ["OPENAI_API_KEY"] = v
        set_key(ENV_FILE_PATH, "OPENAI_API_KEY", v)
        updates["openai_api_key"] = bool(v)

    if payload.public_webhook_url is not None:
        v = payload.public_webhook_url.strip().rstrip("/")
        os.environ["PUBLIC_APP_URL"] = v
        set_key(ENV_FILE_PATH, "PUBLIC_APP_URL", v)
        updates["public_webhook_url"] = bool(v)

    has_plivo = bool(os.environ.get("PLIVO_AUTH_ID") and os.environ.get("PLIVO_AUTH_TOKEN"))
    has_sarvam = bool(os.environ.get("SARVAM_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))

    active_mode = "REAL TELEPHONY" if (has_plivo and has_sarvam and has_openai) else "MOCK SIMULATION"

    return {
        "status": "success",
        "message": "Credentials saved to .env and active runtime successfully!",
        "updates": updates,
        "active_mode": active_mode,
        "has_plivo": has_plivo,
        "has_sarvam": has_sarvam,
        "has_openai": has_openai
    }


@router.post("/settings/test-plivo")
async def test_plivo_credentials(payload: Optional[TestPlivoRequest] = None):
    """
    Validates Plivo credentials against the live Plivo REST API.
    Returns account balance and carrier status, or exact error.
    """
    auth_id = (payload.auth_id if payload and payload.auth_id else os.environ.get("PLIVO_AUTH_ID", "")).strip()
    auth_token = (payload.auth_token if payload and payload.auth_token else os.environ.get("PLIVO_AUTH_TOKEN", "")).strip()

    if not auth_id or not auth_token:
        return {
            "success": False,
            "error": "Plivo Auth ID and Auth Token are required. Please enter and save them in AI Settings."
        }

    provider = PlivoTelephonyProvider(auth_id=auth_id, auth_token=auth_token)
    res = await provider.test_connection()
    return res


@router.api_route("/plivo/webhook", methods=["GET", "POST"])
async def plivo_answer_webhook(
    request: Request,
    CallUUID: Optional[str] = Query(None),
    From: Optional[str] = Query(None),
    To: Optional[str] = Query(None)
):
    """
    Plivo executes this webhook when callee answers their physical phone.
    Returns Plivo XML with speech greeting or audio stream.
    """
    greeting = (
        "Namaskaram andi! Nenu Skila AI nunchi Ananya ni maatladatunnanu. "
        "Mee school kosam artificial intelligence educational solution gurinchi maatladataniki call chesamu. "
        "Ippudu maatladadaniki convenient ga unda?"
    )
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Speak language="te-IN" voice="Polly.Aditi">{greeting}</Speak>
    <Wait length="2" />
</Response>"""
    return Response(content=xml_content, media_type="application/xml")


@router.api_route("/plivo/hangup", methods=["GET", "POST"])
async def plivo_hangup_webhook(request: Request):
    """Plivo webhook when the phone call is terminated."""
    return {"status": "success", "message": "Call completed"}
