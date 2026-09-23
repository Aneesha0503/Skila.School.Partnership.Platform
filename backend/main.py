import io
import csv
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from firebase_config import get_db, is_live_firebase
from models import SchoolModel, SchoolCreateUpdate

app = FastAPI(title="Skila School Partnership Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from india_data import get_states_and_districts
from mistral_scraper import get_school_tier

db = get_db()

def get_all_schools_raw() -> List[Dict[str, Any]]:
    col = db.collection("schools")
    docs = col.stream()
    schools = []
    for d in docs:
        data = d.to_dict()
        if not data.get("id"):
            data["id"] = d.id
        if not data.get("tier"):
            data["tier"] = get_school_tier(data)
        schools.append(data)
    return schools

@app.get("/api/states-districts")
def api_states_districts():
    """Returns official Indian states and their districts."""
    return get_states_and_districts()

@app.get("/api/status")
def get_status():
    schools = get_all_schools_raw()
    return {
        "status": "healthy",
        "firebase_live": is_live_firebase(),
        "total_schools": len(schools),
        "database_type": "Firebase Firestore Live" if is_live_firebase() else "Local Firestore Document Store"
    }

@app.get("/api/hierarchy")
def get_hierarchy(
    state: Optional[str] = None,
    district: Optional[str] = None,
    revenue_division: Optional[str] = None,
    mandal: Optional[str] = None,
    local_body_name: Optional[str] = None
):
    schools = get_all_schools_raw()
    
    states = sorted(list(set(s["hierarchy"]["state"] for s in schools if s.get("hierarchy", {}).get("state"))))
    
    dist_filtered = [s for s in schools if not state or s.get("hierarchy", {}).get("state") == state]
    districts = sorted(list(set(s["hierarchy"]["district"] for s in dist_filtered if s.get("hierarchy", {}).get("district"))))
    
    rev_filtered = [s for s in dist_filtered if not district or s.get("hierarchy", {}).get("district") == district]
    revenue_divisions = sorted(list(set(s["hierarchy"]["revenue_division"] for s in rev_filtered if s.get("hierarchy", {}).get("revenue_division"))))
    
    mandal_filtered = [s for s in rev_filtered if not revenue_division or s.get("hierarchy", {}).get("revenue_division") == revenue_division]
    mandals = sorted(list(set(s["hierarchy"]["mandal"] for s in mandal_filtered if s.get("hierarchy", {}).get("mandal"))))
    
    lb_filtered = [s for s in mandal_filtered if not mandal or s.get("hierarchy", {}).get("mandal") == mandal]
    local_bodies = []
    seen_lbs = set()
    for s in lb_filtered:
        h = s.get("hierarchy", {})
        lb_name = h.get("local_body_name")
        lb_type = h.get("local_body_type", "Municipality")
        if lb_name and (lb_type, lb_name) not in seen_lbs:
            seen_lbs.add((lb_type, lb_name))
            local_bodies.append({"type": lb_type, "name": lb_name})
    local_bodies.sort(key=lambda x: x["name"])
    
    ward_filtered = [s for s in lb_filtered if not local_body_name or s.get("hierarchy", {}).get("local_body_name") == local_body_name]
    wards_villages = sorted(list(set(s["hierarchy"]["village_locality_ward"] for s in ward_filtered if s.get("hierarchy", {}).get("village_locality_ward"))))
    
    return {
        "states": states,
        "districts": districts,
        "revenue_divisions": revenue_divisions,
        "mandals": mandals,
        "local_bodies": local_bodies,
        "wards_villages": wards_villages
    }

@app.get("/api/schools")
def list_schools(
    state: Optional[str] = None,
    district: Optional[str] = None,
    revenue_division: Optional[str] = None,
    mandal: Optional[str] = None,
    local_body_name: Optional[str] = None,
    village_locality_ward: Optional[str] = None,
    search: Optional[str] = None,
    board: Optional[str] = None,
    lead_status: Optional[str] = None,
    skila_ai_potential: Optional[str] = None,
    technology_adoption_level: Optional[str] = None,
    tier: Optional[str] = None
):
    schools = get_all_schools_raw()
    filtered = []
    
    search_lower = search.strip().lower() if search else None
    
    for s in schools:
        h = s.get("hierarchy", {})
        info = s.get("info", {})
        tech = s.get("technology", {})
        sales = s.get("sales", {})
        t_info = s.get("tier", {})
        
        if state and h.get("state") != state:
            continue
        if district and h.get("district") != district:
            continue
        if revenue_division and h.get("revenue_division") != revenue_division:
            continue
        if mandal and h.get("mandal") != mandal:
            continue
        if local_body_name and h.get("local_body_name") != local_body_name:
            continue
        if village_locality_ward and h.get("village_locality_ward") != village_locality_ward:
            continue
            
        if tier and tier != "All" and t_info.get("tier") != tier:
            continue
        if board and board != "All" and board.lower() not in info.get("board", "").lower():
            continue
        if lead_status and lead_status != "All" and sales.get("lead_status") != lead_status:
            continue
        if skila_ai_potential and skila_ai_potential != "All" and sales.get("skila_ai_potential") != skila_ai_potential:
            continue
        if technology_adoption_level and technology_adoption_level != "All" and sales.get("technology_adoption_level") != technology_adoption_level:
            continue
            
        if search_lower:
            text_corpus = f"{info.get('school_name', '')} {info.get('udise_code', '')} {info.get('principal_name', '')} {info.get('correspondent_name', '')} {h.get('district', '')} {h.get('mandal', '')} {h.get('village_locality_ward', '')}".lower()
            if search_lower not in text_corpus:
                continue
                
        filtered.append(s)
        
    # Sort from High to Low: High Range first, then State Board by strength descending
    filtered.sort(key=lambda x: (
        x.get("tier", {}).get("rank", 99),
        -int(x.get("info", {}).get("student_strength") or 0)
    ))
    return filtered

@app.get("/api/schools/{school_id}")
def get_school(school_id: str):
    doc = db.collection("schools").document(school_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="School not found")
    data = doc.to_dict()
    data["id"] = school_id
    return data

@app.post("/api/schools")
def create_school(payload: SchoolCreateUpdate):
    school_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": school_id,
        "hierarchy": payload.hierarchy.model_dump(),
        "info": payload.info.model_dump(),
        "technology": payload.technology.model_dump(),
        "sales": payload.sales.model_dump(),
        "created_at": now,
        "updated_at": now
    }
    db.collection("schools").document(school_id).set(record)
    return record

@app.put("/api/schools/{school_id}")
def update_school(school_id: str, payload: SchoolCreateUpdate):
    doc_ref = db.collection("schools").document(school_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="School not found")
    
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": school_id,
        "hierarchy": payload.hierarchy.model_dump(),
        "info": payload.info.model_dump(),
        "technology": payload.technology.model_dump(),
        "sales": payload.sales.model_dump(),
        "created_at": doc.to_dict().get("created_at", now),
        "updated_at": now
    }
    doc_ref.set(record)
    return record

@app.delete("/api/schools/clear-all")
def clear_all_schools():
    """Clears all schools from the database."""
    col = db.collection("schools")
    docs = list(col.stream())
    count = len(docs)
    for d in docs:
        col.document(d.id).delete()
    return {"message": f"Successfully deleted {count} schools", "deleted_count": count}

@app.delete("/api/schools/{school_id}")
def delete_school(school_id: str):
    doc_ref = db.collection("schools").document(school_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="School not found")
    doc_ref.delete()
    return {"message": "School successfully deleted", "id": school_id}

@app.get("/api/stats")
def get_stats():
    schools = get_all_schools_raw()
    total = len(schools)
    
    lead_stages = {}
    adoption_levels = {}
    high_potential = 0
    demos_done = 0
    proposals_shared = 0
    pilots_started = 0
    total_students = 0
    total_teachers = 0
    
    for s in schools:
        sales = s.get("sales", {})
        info = s.get("info", {})
        
        status = sales.get("lead_status", "New")
        lead_stages[status] = lead_stages.get(status, 0) + 1
        
        adopt = sales.get("technology_adoption_level", "Medium")
        adoption_levels[adopt] = adoption_levels.get(adopt, 0) + 1
        
        if sales.get("skila_ai_potential") == "High":
            high_potential += 1
        if sales.get("demo_done") == "Yes":
            demos_done += 1
        if sales.get("proposal_shared") == "Yes":
            proposals_shared += 1
        if sales.get("pilot_started") == "Yes":
            pilots_started += 1
            
        total_students += int(info.get("student_strength") or 0)
        total_teachers += int(info.get("teacher_strength") or 0)
        
    return {
        "total_schools": total,
        "high_ai_potential": high_potential,
        "demos_done": demos_done,
        "proposals_shared": proposals_shared,
        "pilots_started": pilots_started,
        "total_students": total_students,
        "total_teachers": total_teachers,
        "lead_stages": lead_stages,
        "adoption_levels": adoption_levels
    }

@app.get("/api/export")
def export_csv():
    schools = get_all_schools_raw()
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "UDISE Code", "School Name", "State", "District", "Mandal", "Ward/Village",
        "Category", "Management", "Board", "Students", "Teachers", "Principal",
        "Mobile", "Email", "ERP Used", "LMS Used", "Coding", "Robotics", "AI Used",
        "Decision Maker", "Designation", "Fee Range", "AI Potential", "Lead Status", "Remarks"
    ]
    writer.writerow(headers)
    
    for s in schools:
        h = s.get("hierarchy", {})
        info = s.get("info", {})
        tech = s.get("technology", {})
        sales = s.get("sales", {})
        writer.writerow([
            info.get("udise_code", ""), info.get("school_name", ""),
            h.get("state", ""), h.get("district", ""), h.get("mandal", ""), h.get("village_locality_ward", ""),
            info.get("school_category", ""), info.get("management_type", ""), info.get("board", ""),
            info.get("student_strength", 0), info.get("teacher_strength", 0), info.get("principal_name", ""),
            info.get("mobile", ""), info.get("email", ""),
            tech.get("erp_used", ""), tech.get("lms_used", ""), tech.get("coding_used", ""), tech.get("robotics_used", ""), tech.get("ai_used", ""),
            sales.get("decision_maker", ""), sales.get("decision_maker_designation", ""),
            sales.get("annual_fee_range", ""), sales.get("skila_ai_potential", ""),
            sales.get("lead_status", ""), sales.get("remarks", "")
        ])
        
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=skila_schools.csv"}
    )

from mistral_scraper import scrape_schools_ai, scrape_district_schools_ai, scrape_single_school_details_ai, enrich_school_with_ai

class AIScrapeRequest(BaseModel):
    query: Optional[str] = None
    state: Optional[str] = "Telangana"
    district: Optional[str] = "Hyderabad"
    mandal: Optional[str] = None
    count: int = 4
    auto_save: bool = False

class AISaveScrapedRequest(BaseModel):
    schools: List[Dict[str, Any]]

@app.post("/api/ai/scrape")
def api_scrape_schools(req: AIScrapeRequest):
    """
    Triggers Mistral AI (ministral-14b-latest) to research, extract, and scrape
    schools matching the region or search prompt.
    """
    scraped = scrape_schools_ai(
        query=req.query,
        state=req.state,
        district=req.district,
        mandal=req.mandal,
        count=req.count
    )
    if req.auto_save:
        col = db.collection("schools")
        for s in scraped:
            col.document(s["id"]).set(s)
    return {"schools": scraped, "count": len(scraped), "auto_saved": req.auto_save}

@app.post("/api/ai/save")
def api_save_scraped_schools(req: AISaveScrapedRequest):
    """
    Saves selected scraped schools into Firebase Firestore.
    """
    col = db.collection("schools")
    saved_count = 0
    now = datetime.now(timezone.utc).isoformat()
    for s in req.schools:
        doc_id = s.get("id") or str(uuid.uuid4())
        s["id"] = doc_id
        if not s.get("created_at"):
            s["created_at"] = now
        s["updated_at"] = now
        col.document(doc_id).set(s)
        saved_count += 1
    return {"message": f"Successfully imported {saved_count} schools", "count": saved_count}

@app.post("/api/ai/enrich/{school_id}")
def api_enrich_school(school_id: str):
    """
    Uses Mistral AI to evaluate an existing school and enrich its tech recommendations
    and sales strategy pitch.
    """
    doc_ref = db.collection("schools").document(school_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="School not found")
    school_data = doc.to_dict()
    school_data["id"] = school_id
    
    enriched = enrich_school_with_ai(school_data)
    
    if "remarks" in enriched and enriched["remarks"]:
        current_remarks = school_data.get("sales", {}).get("remarks", "")
        updated_remarks = f"{current_remarks}\n[Mistral AI Analysis]: {enriched['remarks']}".strip()
        school_data["sales"]["remarks"] = updated_remarks
        if "skila_ai_potential" in enriched:
            school_data["sales"]["skila_ai_potential"] = enriched["skila_ai_potential"]
        if "technology_adoption_level" in enriched:
            school_data["sales"]["technology_adoption_level"] = enriched["technology_adoption_level"]
        school_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        doc_ref.set(school_data)
        
    return {"school": school_data, "ai_insights": enriched}

class RunDistrictRequest(BaseModel):
    state: str
    district: str
    count: int = 8
    force_scrape: bool = False

@app.post("/api/run-district")
def api_run_district(req: RunDistrictRequest):
    """
    Step 1: Runs district school discovery for selected State and District.
    Returns schools strictly sorted High to Low:
    1. High Range (International, Cambridge, CBSE, ICSE)
    2. State Board High Strength (1200+)
    3. State Board Mid Strength (500-1200)
    4. State Board Low Strength (<500)
    Lightweight and fast (~5s). Deep 49-field details are fetched on demand when user runs a specific school.
    """
    state_clean = req.state.strip()
    district_clean = req.district.strip()
    
    existing = [
        s for s in get_all_schools_raw()
        if s.get("hierarchy", {}).get("state", "").lower() == state_clean.lower()
        and s.get("hierarchy", {}).get("district", "").lower() == district_clean.lower()
    ]
    
    existing.sort(key=lambda x: (
        x.get("tier", {}).get("rank", 99),
        -int(x.get("info", {}).get("student_strength") or 0)
    ))
    
    if len(existing) >= 3 and not req.force_scrape:
        return {
            "schools": existing,
            "count": len(existing),
            "source": "database",
            "state": state_clean,
            "district": district_clean,
            "scraped_new": 0
        }
        
    # Run lightweight Step 1 district scraper
    scraped = scrape_district_schools_ai(
        state=state_clean,
        district=district_clean,
        count=req.count or 8
    )
    
    col = db.collection("schools")
    for s in scraped:
        col.document(s["id"]).set(s)
        
    all_district_schools = [
        s for s in get_all_schools_raw()
        if s.get("hierarchy", {}).get("state", "").lower() == state_clean.lower()
        and s.get("hierarchy", {}).get("district", "").lower() == district_clean.lower()
    ]
    all_district_schools.sort(key=lambda x: (
        x.get("tier", {}).get("rank", 99),
        -int(x.get("info", {}).get("student_strength") or 0)
    ))
    
    return {
        "schools": all_district_schools,
        "count": len(all_district_schools),
        "source": "mistral_ai",
        "state": state_clean,
        "district": district_clean,
        "scraped_new": len(scraped)
    }

@app.post("/api/schools/{school_id}/run-details")
def api_run_school_details(school_id: str):
    """
    Step 2: On-demand single school intelligence runner.
    When user approves or selects a specific school from the district list,
    runs Mistral AI specifically for that school to populate all 16 Info,
    17 Technology, and 16 Sales CRM fields.
    """
    doc_ref = db.collection("schools").document(school_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="School not found")
    school_data = doc.to_dict()
    school_data["id"] = school_id
    
    enriched = scrape_single_school_details_ai(school_data)
    doc_ref.set(enriched)
    return enriched


