from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

class SchoolHierarchy(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    state: Optional[str] = ""
    district: Optional[str] = ""
    revenue_division: Optional[str] = ""
    mandal: Optional[str] = ""
    local_body_type: Optional[str] = "Municipality"  # Municipality, Municipal Corporation, Nagar Panchayat, Gram Panchayat
    local_body_name: Optional[str] = ""
    village_locality_ward: Optional[str] = ""

class SchoolInfo(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    udise_code: Optional[str] = ""
    school_name: Optional[str] = ""
    school_category: Optional[str] = "Secondary"  # Primary, Upper Primary, Secondary, Higher Secondary, K-12
    management_type: Optional[str] = "Private Unaided"  # Private Unaided, Government, Aided, International
    school_type: Optional[str] = "Co-educational"  # Co-educational, Boys, Girls
    board: Optional[str] = "CBSE"  # CBSE, ICSE, State Board, IB, Cambridge
    classes_from: Optional[Union[str, int]] = "Grade 1"
    classes_to: Optional[Union[str, int]] = "Grade 10"
    student_strength: Optional[Union[int, str]] = 0
    teacher_strength: Optional[Union[int, str]] = 0
    principal_name: Optional[str] = ""
    correspondent_name: Optional[str] = ""
    mobile: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    full_address: Optional[str] = ""
    pincode: Optional[Union[str, int]] = ""

class TechnologyUsage(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    erp_used: Optional[str] = "No"  # Yes / No
    erp_vendor: Optional[str] = ""
    lms_used: Optional[str] = "No"
    lms_vendor: Optional[str] = ""
    coding_used: Optional[str] = "No"
    coding_vendor: Optional[str] = ""
    robotics_used: Optional[str] = "No"
    robotics_vendor: Optional[str] = ""
    ai_used: Optional[str] = "No"
    ai_vendor: Optional[str] = ""
    stem_program: Optional[str] = "No"
    atl_lab: Optional[str] = "No"
    smart_classroom: Optional[str] = "No"
    smart_classroom_count: Optional[Union[int, str]] = 0
    computer_lab: Optional[str] = "No"
    computer_lab_count: Optional[Union[int, str]] = 0
    internet: Optional[str] = "Broadband"  # Fiber, Broadband, Leased Line, None
    parent_app: Optional[str] = "No"
    school_app: Optional[str] = "No"

class SalesCRM(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    decision_maker: Optional[str] = ""
    decision_maker_designation: Optional[str] = ""  # Correspondent, Chairman, Director, Principal
    decision_maker_contact: Optional[str] = ""
    annual_fee_range: Optional[str] = "₹40,000 - ₹80,000"
    existing_edtech_partners: Optional[Union[str, List[Any], Dict[str, Any]]] = ""
    technology_adoption_level: Optional[str] = "Medium"  # Low, Medium, High, Advanced
    skila_ai_potential: Optional[str] = "High"  # High, Medium, Low
    lead_status: Optional[str] = "New"  # New, Contacted, Demo Scheduled, Proposal Shared, Pilot Started, Closed Won, Closed Lost
    interest_level: Optional[str] = "High"  # High, Medium, Low, Not Interested
    demo_done: Optional[str] = "No"  # Yes / No
    proposal_shared: Optional[str] = "No"  # Yes / No
    pilot_started: Optional[str] = "No"  # Yes / No
    last_contact_date: Optional[str] = ""
    next_follow_up_date: Optional[str] = ""
    sales_owner: Optional[str] = "Unassigned"
    remarks: Optional[Union[str, Dict[str, Any], List[Any]]] = ""
    sent_emails: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    sent_whatsapp: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class SchoolModel(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    id: Optional[str] = None
    hierarchy: Optional[SchoolHierarchy] = None
    info: Optional[SchoolInfo] = None
    technology: Optional[TechnologyUsage] = None
    sales: Optional[SalesCRM] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    scraped_by: Optional[str] = None
    details_fetched: Optional[bool] = None

class SchoolCreateUpdate(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    hierarchy: Optional[SchoolHierarchy] = None
    info: Optional[SchoolInfo] = None
    technology: Optional[TechnologyUsage] = None
    sales: Optional[SalesCRM] = None
