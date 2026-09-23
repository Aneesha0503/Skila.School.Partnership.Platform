from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SchoolHierarchy(BaseModel):
    state: str
    district: str
    revenue_division: str
    mandal: str
    local_body_type: str = "Municipality"  # Municipality, Municipal Corporation, Nagar Panchayat, Gram Panchayat
    local_body_name: str
    village_locality_ward: str

class SchoolInfo(BaseModel):
    udise_code: str
    school_name: str
    school_category: str = "Secondary"  # Primary, Upper Primary, Secondary, Higher Secondary, K-12
    management_type: str = "Private Unaided"  # Private Unaided, Government, Aided, International
    school_type: str = "Co-educational"  # Co-educational, Boys, Girls
    board: str = "CBSE"  # CBSE, ICSE, State Board, IB, Cambridge
    classes_from: str = "Grade 1"
    classes_to: str = "Grade 10"
    student_strength: int = 0
    teacher_strength: int = 0
    principal_name: str = ""
    correspondent_name: str = ""
    mobile: str = ""
    email: str = ""
    website: str = ""
    full_address: str = ""
    pincode: str = ""

class TechnologyUsage(BaseModel):
    erp_used: str = "No"  # Yes / No
    erp_vendor: str = ""
    lms_used: str = "No"
    lms_vendor: str = ""
    coding_used: str = "No"
    coding_vendor: str = ""
    robotics_used: str = "No"
    robotics_vendor: str = ""
    ai_used: str = "No"
    ai_vendor: str = ""
    stem_program: str = "No"
    atl_lab: str = "No"
    smart_classroom: str = "No"
    smart_classroom_count: int = 0
    computer_lab: str = "No"
    computer_lab_count: int = 0
    internet: str = "Broadband"  # Fiber, Broadband, Leased Line, None
    parent_app: str = "No"
    school_app: str = "No"

class SalesCRM(BaseModel):
    decision_maker: str = ""
    decision_maker_designation: str = ""  # Correspondent, Chairman, Director, Principal
    decision_maker_contact: str = ""
    annual_fee_range: str = "₹40,000 - ₹80,000"
    existing_edtech_partners: str = ""
    technology_adoption_level: str = "Medium"  # Low, Medium, High, Advanced
    skila_ai_potential: str = "High"  # High, Medium, Low
    lead_status: str = "New"  # New, Contacted, Demo Scheduled, Proposal Shared, Pilot Started, Closed Won, Closed Lost
    interest_level: str = "High"  # High, Medium, Low, Not Interested
    demo_done: str = "No"  # Yes / No
    proposal_shared: str = "No"  # Yes / No
    pilot_started: str = "No"  # Yes / No
    last_contact_date: str = ""
    next_follow_up_date: str = ""
    sales_owner: str = "Unassigned"
    remarks: str = ""

class SchoolModel(BaseModel):
    id: Optional[str] = None
    hierarchy: SchoolHierarchy
    info: SchoolInfo
    technology: TechnologyUsage
    sales: SalesCRM
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class SchoolCreateUpdate(BaseModel):
    hierarchy: SchoolHierarchy
    info: SchoolInfo
    technology: TechnologyUsage
    sales: SalesCRM
