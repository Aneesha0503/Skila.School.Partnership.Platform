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
    
    with urllib.request.urlopen(req, timeout=90) as response:
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

def scrape_district_batch(
    state: str,
    district: str,
    count: int = 20,
    exclude_names: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Scrapes a single batch of schools for a district.
    """
    sys_prompt = (
        "You are an Indian Educational Directory Expert for Skila AI. "
        "Given a State and District, research and return a JSON object with key 'schools' "
        f"containing a comprehensive list of {count} real/prominent schools across different mandals, "
        "revenue divisions, nagarpalikas, and gram panchayats in that district.\n"
        "CRITICAL REQUIREMENT - Order schools strictly from High to Low:\n"
        "1. High Range schools (International, Cambridge, IB, CBSE, ICSE)\n"
        "2. State Board High Strength schools (student strength 1,200+)\n"
        "3. State Board Mid Strength schools (student strength 500 to 1,200)\n"
        "4. State Board Low Strength schools (student strength under 500)\n\n"
        "Each school object MUST have:\n"
        "- school_name: Official name of the school\n"
        "- board: CBSE, ICSE, Cambridge / IB, or State Board\n"
        "- student_strength: Integer (e.g. 2500, 1400, 800, 350)\n"
        "- school_category: Higher Secondary, Secondary, Primary, or K-12\n"
        "- management_type: Private Unaided, Government, Aided, or International\n"
        "- revenue_division: Name of the Revenue Division in this district\n"
        "- mandal: Specific Mandal name in this district\n"
        "- local_body_type: Municipality, Municipal Corporation, Nagar Panchayat, or Gram Panchayat\n"
        "- local_body_name: Name of the local body\n"
        "- village_locality_ward: Ward number, locality, or village name\n"
        "Only return valid JSON with key 'schools'."
    )

    user_prompt = f"List {count} schools across different mandals in District: {district}, State: {state}, ordered strictly from High to Low."
    if exclude_names and len(exclude_names) > 0:
        user_prompt += f"\nCRITICAL: Do NOT duplicate any of these already listed schools: {json.dumps(exclude_names[:80])}."

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = call_mistral(messages, json_mode=True)
        raw_schools = response.get("schools", [])
        now = datetime.now(timezone.utc).isoformat()
        
        cleaned = []
        seen_names = set(n.lower() for n in (exclude_names or []))

        for s in raw_schools:
            name = s.get("school_name", "").strip()
            if not name or name.lower() in seen_names:
                continue
            seen_names.add(name.lower())

            doc_id = str(uuid.uuid4())
            school_record = {
                "id": doc_id,
                "details_fetched": False,
                "hierarchy": {
                    "state": state,
                    "district": district,
                    "revenue_division": s.get("revenue_division") or district,
                    "mandal": s.get("mandal") or "Headquarters",
                    "local_body_type": s.get("local_body_type") or "Municipality",
                    "local_body_name": s.get("local_body_name") or f"{district} Local Body",
                    "village_locality_ward": s.get("village_locality_ward") or "Town Area"
                },
                "info": {
                    "udise_code": s.get("udise_code") or f"36{abs(hash(name)) % 100000000:09d}",
                    "school_name": name,
                    "school_category": s.get("school_category", "Secondary"),
                    "management_type": s.get("management_type", "Private"),
                    "school_type": "Co-educational",
                    "board": s.get("board", "State Board"),
                    "classes_from": "Grade 1",
                    "classes_to": "Grade 10",
                    "student_strength": int(s.get("student_strength") or 500),
                    "teacher_strength": max(5, int(int(s.get("student_strength") or 500) / 25)),
                    "principal_name": "",
                    "correspondent_name": "",
                    "mobile": "",
                    "email": "",
                    "website": "",
                    "full_address": f"{s.get('village_locality_ward', '')}, {district}, {state}",
                    "pincode": ""
                },
                "technology": {
                    "erp_used": "Not Analyzed", "erp_vendor": "",
                    "lms_used": "Not Analyzed", "lms_vendor": "",
                    "coding_used": "Not Analyzed", "coding_vendor": "",
                    "robotics_used": "Not Analyzed", "robotics_vendor": "",
                    "ai_used": "Not Analyzed", "ai_vendor": "",
                    "stem_program": "Not Analyzed", "atl_lab": "Not Analyzed",
                    "smart_classroom": "Not Analyzed", "smart_classroom_count": 0,
                    "computer_lab": "Not Analyzed", "computer_lab_count": 0,
                    "internet": "", "parent_app": "No", "school_app": "No"
                },
                "sales": {
                    "decision_maker": "", "decision_maker_designation": "", "decision_maker_contact": "",
                    "annual_fee_range": "", "existing_edtech_partners": "",
                    "technology_adoption_level": "Unassessed",
                    "skila_ai_potential": "Unassessed",
                    "lead_status": "New", "interest_level": "Pending",
                    "demo_done": "No", "proposal_shared": "No", "pilot_started": "No",
                    "last_contact_date": "", "next_follow_up_date": "", "sales_owner": "",
                    "remarks": "District school listed. Click 'Run School Details' to fetch complete 49-field profile."
                },
                "created_at": now,
                "updated_at": now,
                "scraped_by": "Skila AI Engine"
            }
            school_record["tier"] = get_school_tier(school_record)
            cleaned.append(school_record)
        
        return cleaned
    except Exception as e:
        print(f"[Mistral District Batch Scraper Error] {e}")
        return []

def scrape_district_schools_ai(
    state: str,
    district: str,
    count: int = 20,
    exclude_names: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Step 1: Lightweight district listing scraper.
    Quickly lists prominent schools for the selected State and District,
    strictly ordered from High to Low.
    Can scale up to 50+ schools across multiple batches.
    """
    if count <= 25:
        results = scrape_district_batch(state, district, count=count, exclude_names=exclude_names)
    else:
        # Fetch first batch of 25
        results = scrape_district_batch(state, district, count=25, exclude_names=exclude_names)
        existing_now = list(exclude_names or []) + [s["info"]["school_name"] for s in results]
        
        # Fetch second batch for remaining
        remaining = min(25, count - len(results))
        if remaining > 0:
            batch2 = scrape_district_batch(state, district, count=remaining, exclude_names=existing_now)
            results.extend(batch2)

    # Sort strictly from High to Low
    results.sort(key=lambda x: (
        x.get("tier", {}).get("rank", 99),
        -int(x.get("info", {}).get("student_strength") or 0)
    ))
    return results

def scrape_single_school_details_ai(school_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Step 2: Deep-dive single school intelligence scraper.
    When user approves or selects a specific school from the list,
    runs Skila AI specifically for THAT school to populate all 16 Info,
    17 Technology, and 16 Sales CRM fields.
    """
    school_name = school_data.get("info", {}).get("school_name", "")
    board = school_data.get("info", {}).get("board", "")
    strength = school_data.get("info", {}).get("student_strength", 1000)
    hierarchy = school_data.get("hierarchy", {})
    state = hierarchy.get("state", "")
    district = hierarchy.get("district", "")
    mandal = hierarchy.get("mandal", "")
    locality = hierarchy.get("village_locality_ward", "")

    sys_prompt = (
        "You are an expert Indian Educational Intelligence & EdTech Partnership Analyst for Skila AI. "
        "For the given Indian school, research and provide a realistic, comprehensive 49-field profile. "
        "Return a JSON object with keys: 'info', 'technology', 'sales'.\n\n"
        "Key 'info' (16 fields):\n"
        "udise_code (11 digits), school_name, school_category, management_type, school_type (Co-educational/Boys/Girls), "
        "board, classes_from, classes_to, student_strength (int), teacher_strength (int), "
        "principal_name, correspondent_name, mobile, email, website, full_address, pincode.\n\n"
        "Key 'technology' (17 fields):\n"
        "erp_used (Yes/No), erp_vendor, lms_used (Yes/No), lms_vendor, coding_used (Yes/No), coding_vendor, "
        "robotics_used (Yes/No), robotics_vendor, ai_used (Yes/No), ai_vendor, stem_program (Yes/No), "
        "atl_lab (Yes/No), smart_classroom (Yes/No), smart_classroom_count (int), "
        "computer_lab (Yes/No), computer_lab_count (int), internet (e.g. Fiber 200 Mbps), "
        "parent_app (Yes/No), school_app (Yes/No).\n\n"
        "Key 'sales' (16 fields):\n"
        "decision_maker, decision_maker_designation, decision_maker_contact, annual_fee_range, "
        "existing_edtech_partners, technology_adoption_level (Low/Medium/High/Advanced), "
        "skila_ai_potential (High/Medium/Low), lead_status (New/Contacted/Demo Scheduled/Qualified), "
        "interest_level (High/Medium/Low), demo_done (Yes/No), proposal_shared (Yes/No), "
        "pilot_started (Yes/No), last_contact_date (YYYY-MM-DD), next_follow_up_date (YYYY-MM-DD), "
        "sales_owner, remarks (actionable partnership pitch and recommendations for Skila AI)."
    )

    user_prompt = (
        f"Provide the complete 49-field profile for this school:\n"
        f"School Name: {school_name}\n"
        f"Board: {board}\n"
        f"Location: {locality}, {mandal} Mandal, {district} District, {state}\n"
        f"Approx Student Strength: {strength}"
    )

    messages = [
        {"role": "system", "content": sys_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = call_mistral(messages, json_mode=True)
        
        info = response.get("info", {})
        technology = response.get("technology", {})
        sales = response.get("sales", {})

        # Merge with existing
        existing_info = school_data.get("info", {})
        existing_info.update(info)
        if not existing_info.get("school_name"):
            existing_info["school_name"] = school_name
        if not existing_info.get("board"):
            existing_info["board"] = board
        school_data["info"] = existing_info

        existing_tech = school_data.get("technology", {})
        existing_tech.update(technology)
        school_data["technology"] = existing_tech

        existing_sales = school_data.get("sales", {})
        existing_sales.update(sales)

        partners = existing_sales.get("existing_edtech_partners")
        if isinstance(partners, list):
            existing_sales["existing_edtech_partners"] = ", ".join(str(p) for p in partners)

        rem = existing_sales.get("remarks")
        if isinstance(rem, dict):
            parts = []
            for k, v in rem.items():
                title = k.replace("_", " ").title()
                if isinstance(v, dict):
                    subparts = [f"  • {sk.replace('_', ' ').title()}: {sv}" for sk, sv in v.items()]
                    parts.append(f"{title}:\n" + "\n".join(subparts))
                elif isinstance(v, list):
                    subparts = [f"  • {item}" if isinstance(item, str) else f"  • {json.dumps(item)}" for item in v]
                    parts.append(f"{title}:\n" + "\n".join(subparts))
                else:
                    parts.append(f"{title}: {v}")
            existing_sales["remarks"] = "\n\n".join(parts)
        elif isinstance(rem, list):
            existing_sales["remarks"] = "\n".join(f"• {r}" for r in rem)

        school_data["sales"] = existing_sales

        school_data["details_fetched"] = True
        school_data["tier"] = get_school_tier(school_data)
        school_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        return school_data
    except Exception as e:
        print(f"[Mistral Single School Scraper Error] {e}")
        return school_data

def enrich_school_with_ai(school_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Uses Skila AI to evaluate an existing school and enrich its tech usage
    and sales pitch remarks for Skila AI.
    """
    sys_prompt = (
        "You are an AI EdTech Consultant for Skila AI. Given an Indian school's details, "
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

scrape_schools_ai = scrape_district_schools_ai
