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
    deal_closed: Optional[bool] = False
    deal_closed_at: Optional[str] = ""
    deal_closed_by: Optional[str] = ""
    sent_emails: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    sent_whatsapp: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    agent_notes: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    formalities: Optional[Dict[str, Any]] = None

class DealToggleRequest(BaseModel):
    deal_closed: bool

class LeadStatusUpdateRequest(BaseModel):
    lead_status: str

class FormalitiesData(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    status: Optional[str] = "In Progress"  # Drafting MOU, MOU Sent, Signed & Countersigned, Commercials Cleared, Onboarding Complete
    progress_pct: Optional[int] = 20
    formalities_completed: Optional[bool] = False
    formalities_completed_at: Optional[str] = ""
    # Stage 1: Commercials & Agreement Scope
    partnership_tier: Optional[str] = "Skila AI Pioneer Partner"
    academic_year: Optional[str] = "2026-2027"
    contract_value: Optional[str] = "₹2,50,000"
    payment_terms: Optional[str] = "Annual Upfront"  # Annual Upfront, 50-50 Split, Quarterly, Per Student
    # Stage 2: Legal & MOU
    mou_number: Optional[str] = ""
    mou_date: Optional[str] = ""
    mou_validity: Optional[str] = "June 2026 - May 2027"
    mou_signatory_name: Optional[str] = ""
    mou_signatory_designation: Optional[str] = "Principal"
    mou_status: Optional[str] = "Drafting"  # Drafting, Sent for Signing, Signed by School, Fully Executed
    mou_signed_date: Optional[str] = ""
    # Stage 3: Billing & Invoicing
    invoice_number: Optional[str] = ""
    invoice_date: Optional[str] = ""
    invoice_status: Optional[str] = "Pending Invoice"  # Pending Invoice, Invoice Dispatched, Advance Paid, Fully Paid
    payment_ref_no: Optional[str] = ""
    payment_received_date: Optional[str] = ""
    # Stage 4: Academic SPOC & Roster
    school_spoc_name: Optional[str] = ""
    school_spoc_designation: Optional[str] = "AI Coordinator"
    school_spoc_phone: Optional[str] = ""
    school_spoc_email: Optional[str] = ""
    roster_status: Optional[str] = "Pending"  # Pending, Uploaded, Verified
    roster_total_students: Optional[int] = 0
    roster_verified_students: Optional[int] = 0
    roster_classes_breakdown: Optional[Dict[str, int]] = {}
    roster_file_name: Optional[str] = ""
    roster_uploaded_at: Optional[str] = ""
    accounts_provisioned: Optional[bool] = False
    accounts_provisioned_count: Optional[int] = 0
    welcome_kit_dispatched: Optional[bool] = False
    welcome_kit_dispatched_at: Optional[str] = ""
    welcome_kit_channels: Optional[List[str]] = []
    roster_students: Optional[List[Dict[str, Any]]] = []
    # Stage 5: Tech Lab Readiness & Training
    lab_readiness: Optional[str] = "Pending"  # Pending, Verified Ready
    teacher_training_date: Optional[str] = ""
    teacher_training_status: Optional[str] = "Scheduled"  # Scheduled, Completed, Pending
    rollout_target_date: Optional[str] = ""
    # Audit trail
    formalities_updated_by: Optional[str] = ""
    formalities_updated_at: Optional[str] = ""

class FormalitiesUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    status: Optional[str] = None
    progress_pct: Optional[int] = None
    formalities_completed: Optional[bool] = None
    partnership_tier: Optional[str] = None
    academic_year: Optional[str] = None
    contract_value: Optional[str] = None
    payment_terms: Optional[str] = None
    mou_number: Optional[str] = None
    mou_date: Optional[str] = None
    mou_validity: Optional[str] = None
    mou_signatory_name: Optional[str] = None
    mou_signatory_designation: Optional[str] = None
    mou_status: Optional[str] = None
    mou_signed_date: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    invoice_status: Optional[str] = None
    payment_ref_no: Optional[str] = None
    payment_received_date: Optional[str] = None
    school_spoc_name: Optional[str] = None
    school_spoc_designation: Optional[str] = None
    school_spoc_phone: Optional[str] = None
    school_spoc_email: Optional[str] = None
    roster_status: Optional[str] = None
    roster_total_students: Optional[int] = None
    roster_verified_students: Optional[int] = None
    roster_classes_breakdown: Optional[Dict[str, int]] = None
    roster_file_name: Optional[str] = None
    roster_uploaded_at: Optional[str] = None
    accounts_provisioned: Optional[bool] = None
    accounts_provisioned_count: Optional[int] = None
    welcome_kit_dispatched: Optional[bool] = None
    welcome_kit_dispatched_at: Optional[str] = None
    welcome_kit_channels: Optional[List[str]] = None
    roster_students: Optional[List[Dict[str, Any]]] = None
    lab_readiness: Optional[str] = None
    teacher_training_date: Optional[str] = None
    teacher_training_status: Optional[str] = None
    rollout_target_date: Optional[str] = None

class StudentRosterItem(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    roll_number: Optional[str] = ""
    student_name: str
    class_grade: str
    section: Optional[str] = "A"
    parent_name: Optional[str] = ""
    parent_phone: str
    parent_email: Optional[str] = ""
    lms_username: Optional[str] = ""
    temp_password: Optional[str] = ""
    provision_status: Optional[str] = "Pending"
    welcome_dispatched: Optional[bool] = False

class RosterUploadRequest(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    file_name: Optional[str] = "students_roster.csv"
    students: List[Dict[str, Any]] = []

class RosterProvisionRequest(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    channels: Optional[List[str]] = ["WhatsApp", "SMS"]
    custom_welcome_message: Optional[str] = ""

class AgentNoteCreate(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    agent_name: Optional[str] = "Field Agent"
    bucket: Optional[str] = "Campus Visits & Demos"
    category: Optional[str] = "School Visit"
    urgency: Optional[str] = "Normal"
    text: str
    action_required: Optional[str] = ""

class AgentNoteModel(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    id: Optional[str] = None
    school_id: Optional[str] = None
    school_name: Optional[str] = None
    agent_name: Optional[str] = "Field Agent"
    bucket: Optional[str] = "Campus Visits & Demos"
    author_role: Optional[str] = "agent"
    category: Optional[str] = "School Visit"
    urgency: Optional[str] = "Normal"
    text: str
    action_required: Optional[str] = ""
    timestamp: Optional[str] = None
    admin_notified: Optional[bool] = True
    admin_read: Optional[bool] = False

class SchoolModel(BaseModel):
    model_config = ConfigDict(extra="allow", coerce_numbers_to_str=True)
    id: Optional[str] = None
    hierarchy: Optional[SchoolHierarchy] = None
    info: Optional[SchoolInfo] = None
    technology: Optional[TechnologyUsage] = None
    sales: Optional[SalesCRM] = None
    formalities: Optional[Dict[str, Any]] = None
    agent_notes: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
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
    formalities: Optional[Dict[str, Any]] = None
    agent_notes: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

# ==========================================
# AUTHENTICATION & USER MANAGEMENT MODELS
# ==========================================
class UserRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    email: str
    password: str
    full_name: str
    role: Optional[str] = "agent"  # "admin" | "agent"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool = True
    created_at: Optional[str] = None
    last_login: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class AssignSchoolRequest(BaseModel):
    model_config = ConfigDict(extra="allow")
    school_id: str
    agent_name: str


