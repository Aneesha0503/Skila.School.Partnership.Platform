import os
import json
import uuid
import urllib.request
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

ENV_FILE = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(ENV_FILE)
load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY") or os.getenv("\ufeffMISTRAL_API_KEY", "")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "ministral-14b-latest")
MISTRAL_BASE_URL = os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai/v1")

def call_mistral(messages: List[Dict[str, str]], json_mode: bool = True) -> Dict[str, Any]:
    url = f"{MISTRAL_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MISTRAL_MODEL,
        "messages": messages,
        "temperature": 0.3
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    
    with urllib.request.urlopen(req, timeout=45) as response:
        res_json = json.loads(response.read().decode("utf-8"))
        content = res_json["choices"][0]["message"]["content"]
        if json_mode:
            return json.loads(content)
        return {"content": content}

def get_school_tier(s: Dict[str, Any]) -> Dict[str, Any]:
    info = s.get("info", {})
    board = (info.get("board") or "").upper()
    mgmt = (info.get("management_type") or "").upper()
    strength = int(info.get("student_strength") or 0)
    
    if any(k in board or k in mgmt for k in ["INTERNATIONAL", "IB", "CAMBRIDGE", "CBSE", "ICSE"]):
        return {
            "tier": "High Range",
            "tier_category": "International / CBSE / ICSE / Cambridge",
            "rank": 1
        }
    elif strength >= 1200:
        return {
            "tier": "State Board - High Strength",
            "tier_category": "State Board (1200+ Students)",
            "rank": 2
        }
    elif strength >= 500:
        return {
            "tier": "State Board - Mid Strength",
            "tier_category": "State Board (500-1200 Students)",
            "rank": 3
        }
    else:
        return {
            "tier": "State Board - Low Strength",
            "tier_category": "State Board (<500 Students)",
            "rank": 4
        }

def scrape_schools_ai(
    query: Optional[str] = None,
    state: Optional[str] = "Telangana",
    district: Optional[str] = "Hyderabad",
    mandal: Optional[str] = None,
    count: int = 4
) -> List[Dict[str, Any]]:
    """
    Uses Mistral AI to research and generate detailed, realistic school profiles
    matching the exact 6-tier administrative hierarchy, 16 info fields,
    17 technology usage fields, and 16 sales CRM fields.
    """
    sys_prompt = (
        "You are an expert Indian Educational Intelligence & EdTech Partnership Analyst for Skila AI. "
        "Your task is to research and extract accurate, realistic school profiles for Indian schools. "
        "Return a JSON object with a single key 'schools' containing a list of school records. "
        "Each school MUST strictly adhere to this JSON structure:\n"
        "{\n"
        "  \"schools\": [\n"
        "    {\n"
        "      \"hierarchy\": {\n"
        "        \"state\": \"State name\",\n"
        "        \"district\": \"District name\",\n"
        "        \"revenue_division\": \"Revenue Division / Sub-Division\",\n"
        "        \"mandal\": \"Mandal name\",\n"
        "        \"local_body_type\": \"Municipality or Municipal Corporation or Nagar Panchayat or Gram Panchayat\",\n"
        "        \"local_body_name\": \"e.g. GHMC or Narsingi Municipality or GP Name\",\n"
        "        \"village_locality_ward\": \"Ward number & Locality or Village\"\n"
        "      },\n"
        "      \"info\": {\n"
        "        \"udise_code\": \"11-digit UDISE code\",\n"
        "        \"school_name\": \"Full Official School Name\",\n"
        "        \"school_category\": \"Primary, Upper Primary, Secondary, Higher Secondary, or K-12\",\n"
        "        \"management_type\": \"Private Unaided, Government, Aided, or International\",\n"
        "        \"school_type\": \"Co-educational, Boys, or Girls\",\n"
        "        \"board\": \"CBSE, ICSE, IB / Cambridge, or State Board\",\n"
        "        \"classes_from\": \"e.g. Pre-Primary or Grade 1\",\n"
        "        \"classes_to\": \"e.g. Grade 10 or Grade 12\",\n"
        "        \"student_strength\": 1500,\n"
        "        \"teacher_strength\": 90,\n"
        "        \"principal_name\": \"Name of Principal\",\n"
        "        \"correspondent_name\": \"Name of Correspondent or Chairman\",\n"
        "        \"mobile\": \"Contact phone number\",\n"
        "        \"email\": \"official email\",\n"
        "        \"website\": \"official website url\",\n"
        "        \"full_address\": \"Complete postal address\",\n"
        "        \"pincode\": \"6 digit pincode\"\n"
        "      },\n"
        "      \"technology\": {\n"
        "        \"erp_used\": \"Yes or No\", \"erp_vendor\": \"e.g. Fedena, Next Education, Entab or empty\",\n"
        "        \"lms_used\": \"Yes or No\", \"lms_vendor\": \"e.g. Google Classroom, Canvas or empty\",\n"
        "        \"coding_used\": \"Yes or No\", \"coding_vendor\": \"e.g. CodeVidya, Stemrobo or empty\",\n"
        "        \"robotics_used\": \"Yes or No\", \"robotics_vendor\": \"e.g. Lego Academy, SP Robotics or empty\",\n"
        "        \"ai_used\": \"Yes or No\", \"ai_vendor\": \"e.g. Skila AI Pilot or empty\",\n"
        "        \"stem_program\": \"Yes or No\", \"atl_lab\": \"Yes or No\",\n"
        "        \"smart_classroom\": \"Yes or No\", \"smart_classroom_count\": 20,\n"
        "        \"computer_lab\": \"Yes or No\", \"computer_lab_count\": 2,\n"
        "        \"internet\": \"Fiber 300 Mbps or Broadband 100 Mbps\",\n"
        "        \"parent_app\": \"Yes or No\", \"school_app\": \"Yes or No\"\n"
        "      },\n"
        "      \"sales\": {\n"
        "        \"decision_maker\": \"Name of Leader\",\n"
        "        \"decision_maker_designation\": \"Correspondent, Principal, Chairman or Director\",\n"
        "        \"decision_maker_contact\": \"phone number\",\n"
        "        \"annual_fee_range\": \"e.g. ₹50,000 - ₹1,00,000\",\n"
        "        \"existing_edtech_partners\": \"e.g. Next Education, ExtraMarks\",\n"
        "        \"technology_adoption_level\": \"Low, Medium, High, or Advanced\",\n"
        "        \"skila_ai_potential\": \"High, Medium, or Low\",\n"
        "        \"lead_status\": \"New, Contacted, or Demo Scheduled\",\n"
        "        \"interest_level\": \"High or Medium\",\n"
        "        \"demo_done\": \"No\", \"proposal_shared\": \"No\", \"pilot_started\": \"No\",\n"
        "        \"last_contact_date\": \"2026-09-20\",\n"
        "        \"next_follow_up_date\": \"2026-09-30\",\n"
        "        \"sales_owner\": \"Rahul Verma\",\n"
        "        \"remarks\": \"Actionable notes on Skila AI partnership potential\"\n"
        "      }\n"
        "    }\n"
        "  ]\n"
        "}"
    )

    user_prompt = f"Please research and scrape {count} prominent schools"
    if query:
        user_prompt += f" matching: '{query}'"
    if state:
        user_prompt += f" in State: {state}"
    if district:
        user_prompt += f", District: {district}"
    if mandal:
        user_prompt += f", Mandal: {mandal}"

    user_prompt += (
        ". CRITICAL INSTRUCTION: You MUST return schools ordered from High to Low:\n"
        "1. First, High Range schools (International schools, Cambridge, IB, CBSE, ICSE) with modern infrastructure.\n"
        "2. Next, State Board schools representing:\n"
        "   - High strength State Board schools (student strength 1200+)\n"
        "   - Mid strength State Board schools (student strength 500 to 1200)\n"
        "   - Low strength State Board schools (student strength under 500)\n"
        "Ensure real local mandals, local bodies, wards/villages, realistic UDISE codes, and comprehensive technology & sales profiles."
    )

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = call_mistral(messages, json_mode=True)
        raw_schools = response.get("schools", [])
        now = datetime.now(timezone.utc).isoformat()
        
        cleaned = []
        for s in raw_schools:
            doc_id = str(uuid.uuid4())
            tier = get_school_tier(s)
            cleaned.append({
                "id": doc_id,
                "tier": tier,
                "hierarchy": s.get("hierarchy", {}),
                "info": s.get("info", {}),
                "technology": s.get("technology", {}),
                "sales": s.get("sales", {}),
                "created_at": now,
                "updated_at": now,
                "scraped_by": "Mistral AI (ministral-14b-latest)"
            })
        
        # Sort from High to Low
        cleaned.sort(key=lambda x: (x.get("tier", {}).get("rank", 99), -int(x.get("info", {}).get("student_strength") or 0)))
        return cleaned
    except Exception as e:
        print(f"[Mistral Scraper Error] {e}")
        return []

def enrich_school_with_ai(school_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses Mistral AI to evaluate an existing school and enrich its tech usage
    and sales pitch remarks for Skila AI.
    """
    sys_prompt = (
        "You are an AI EdTech Consultant for Skila AI. Given an Indian school's current details, "
        "analyze and predict: "
        "1. Recommended Technology improvements (LMS, ERP, Coding, ATL Lab, AI fit) "
        "2. Skila AI Potential (High/Medium/Low) "
        "3. Technology Adoption Level (Low/Medium/High/Advanced) "
        "4. A high-converting Sales pitch remark and recommended approach for the Decision Maker. "
        "Return a JSON object with keys: 'technology_adoption_level', 'skila_ai_potential', 'remarks', 'recommended_modules', 'pitch_summary'."
    )

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": f"School: {json.dumps(school_data, ensure_ascii=False)}"}
    ]

    try:
        return call_mistral(messages, json_mode=True)
    except Exception as e:
        print(f"[Mistral Enrichment Error] {e}")
        return {"error": str(e)}
