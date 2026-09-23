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
from seed_data import seed_database

app = FastAPI(title="Skila School Partnership Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = get_db()
seed_database(db)

def get_all_schools_raw() -> List[Dict[str, Any]]:
    col = db.collection("schools")
    docs = col.stream()
    schools = []
    for d in docs:
        data = d.to_dict()
        if not data.get("id"):
            data["id"] = d.id
        schools.append(data)
    return schools

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
    technology_adoption_level: Optional[str] = None
):
    schools = get_all_schools_raw()
    filtered = []
    
    search_lower = search.strip().lower() if search else None
    
    for s in schools:
        h = s.get("hierarchy", {})
        info = s.get("info", {})
        tech = s.get("technology", {})
        sales = s.get("sales", {})
        
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
