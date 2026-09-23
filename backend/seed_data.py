import uuid
from datetime import datetime

HIERARCHIES = [
    ("Telangana", "Hyderabad", "Hyderabad North", "Shaikpet", "Municipal Corporation", "GHMC", "Ward 95 - Jubilee Hills"),
    ("Telangana", "Hyderabad", "Hyderabad North", "Shaikpet", "Municipal Corporation", "GHMC", "Ward 94 - Banjara Hills"),
    ("Telangana", "Hyderabad", "Hyderabad South", "Charminar", "Municipal Corporation", "GHMC", "Ward 52 - Moghalpura"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Serilingampally", "Municipal Corporation", "GHMC", "Ward 105 - Gachibowli"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Serilingampally", "Municipal Corporation", "GHMC", "Ward 106 - Kondapur"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Gandipet", "Municipality", "Narsingi Municipality", "Narsingi Village"),
    ("Telangana", "Rangareddy", "Rajendranagar", "Gandipet", "Gram Panchayat", "Kokapet Gram Panchayat", "Kokapet Locality"),
    ("Telangana", "Medchal-Malkajgiri", "Malkajgiri", "Quthbullapur", "Municipal Corporation", "GHMC", "Ward 125 - Quthbullapur"),
    ("Telangana", "Medchal-Malkajgiri", "Malkajgiri", "Alwal", "Municipal Corporation", "GHMC", "Ward 133 - Alwal"),
    ("Telangana", "Medchal-Malkajgiri", "Keesara", "Kapra", "Municipal Corporation", "GHMC", "Ward 1 - Kapra"),
    ("Telangana", "Sangareddy", "Sangareddy", "Patancheru", "Municipality", "Tellapur Municipality", "Osman Nagar"),
    ("Andhra Pradesh", "Visakhapatnam", "Visakhapatnam", "Gajuwaka", "Municipal Corporation", "GVMC", "Ward 65 - Gajuwaka"),
    ("Andhra Pradesh", "Visakhapatnam", "Bheemunipatnam", "Bheemili", "Municipal Corporation", "GVMC", "Ward 12 - Bheemili"),
    ("Andhra Pradesh", "Krishna", "Vijayawada", "Vijayawada Urban", "Municipal Corporation", "VMC", "Ward 32 - Moghalrajpuram"),
    ("Andhra Pradesh", "Krishna", "Vijayawada", "Penamaluru", "Gram Panchayat", "Poranki Gram Panchayat", "Poranki Village")
]

SCHOOL_NAMES = [
    ("Oakridge International School", "36010102401", "IB / Cambridge / CBSE", "Advanced", "Demo Scheduled", "High", "Rahul Verma"),
    ("Meridian School Banjara Hills", "36010101904", "CBSE", "High", "Proposal Shared", "High", "Priya Nair"),
    ("St. George Grammar School", "36010200843", "ICSE / State Board", "Low", "New", "Medium", "Ananya Sharma"),
    ("Chirec International School", "36020300812", "CBSE / IB / Cambridge", "Advanced", "Pilot Started", "High", "Rahul Verma"),
    ("Sancta Maria International School", "36020301120", "Cambridge / IB", "Advanced", "Contacted", "High", "Rahul Verma"),
    ("Delhi Public School Gandipet", "36020401509", "CBSE", "High", "Contacted", "High", "Ananya Sharma"),
    ("Rockwell International School", "36020401882", "CBSE / Cambridge", "Medium", "New", "High", "Ananya Sharma"),
    ("Silver Oaks International School", "36030501124", "IB / CBSE", "Advanced", "Closed Won", "High", "Rahul Verma"),
    ("St. Ann High School Secunderabad", "36030600914", "ICSE / State Board", "Low", "Contacted", "Medium", "Priya Nair"),
    ("Delhi Public School Nacharam", "36030700512", "CBSE", "High", "Demo Scheduled", "High", "Priya Nair"),
    ("The Gaudium School Kollur", "36040801231", "IB / Cambridge / CBSE", "Advanced", "Demo Scheduled", "High", "Rahul Verma"),
    ("DPS Visakhapatnam Steel Plant", "28130501103", "CBSE", "High", "Proposal Shared", "High", "Vikram Rao"),
    ("Timpany School Beach Road", "28130800452", "ICSE", "Medium", "Contacted", "Medium", "Vikram Rao"),
    ("Atkinson High School", "28160201455", "ICSE / State Board", "Low", "New", "Low", "Vikram Rao"),
    ("Delhi Public School Vijayawada", "28160400819", "CBSE", "High", "Proposal Shared", "High", "Vikram Rao")
]

def generate_sample_schools():
    formatted = []
    now = datetime.utcnow().isoformat()
    for idx, (s_name, udise, board, adopt, status, pot, owner) in enumerate(SCHOOL_NAMES):
        h = HIERARCHIES[idx % len(HIERARCHIES)]
        doc_id = str(uuid.uuid4())
        is_adv = adopt == "Advanced"
        is_high = adopt in ("Advanced", "High")
        item = {
            "id": doc_id,
            "hierarchy": {
                "state": h[0], "district": h[1], "revenue_division": h[2],
                "mandal": h[3], "local_body_type": h[4], "local_body_name": h[5],
                "village_locality_ward": h[6]
            },
            "info": {
                "udise_code": udise, "school_name": s_name,
                "school_category": "K-12" if "International" in s_name else "Secondary",
                "management_type": "International" if "International" in s_name else "Private Unaided",
                "school_type": "Girls" if "St. Ann" in s_name or "Atkinson" in s_name else "Co-educational",
                "board": board, "classes_from": "Pre-Primary" if is_high else "Grade 1",
                "classes_to": "Grade 12" if is_high else "Grade 10",
                "student_strength": 1200 + (idx * 160), "teacher_strength": 70 + (idx * 11),
                "principal_name": f"Dr. Principal {idx+1}", "correspondent_name": f"Mr. Correspondent {idx+1}",
                "mobile": f"+91 9849{idx} 12345", "email": f"info@{s_name.lower().replace(' ', '')[:12]}.edu.in",
                "website": f"https://www.{s_name.lower().replace(' ', '')[:12]}.edu.in",
                "full_address": f"{h[6]}, {h[5]}, {h[3]} Mandal, {h[1]} District, {h[0]}",
                "pincode": f"5000{30+idx}"
            },
            "technology": {
                "erp_used": "Yes" if is_high else "No", "erp_vendor": "Fedena / Next ERP" if is_high else "",
                "lms_used": "Yes" if is_high else "No", "lms_vendor": "Canvas / Google" if is_high else "",
                "coding_used": "Yes" if is_high else "No", "coding_vendor": "CodeVidya / Stemrobo" if is_high else "",
                "robotics_used": "Yes" if is_adv else "No", "robotics_vendor": "Lego Academy" if is_adv else "",
                "ai_used": "Yes" if status == "Pilot Started" else "No", "ai_vendor": "Skila AI Pilot" if status == "Pilot Started" else "",
                "stem_program": "Yes" if is_high else "No", "atl_lab": "Yes" if is_high else "No",
                "smart_classroom": "Yes", "smart_classroom_count": 25 + (idx * 3),
                "computer_lab": "Yes", "computer_lab_count": 2 + (idx % 3),
                "internet": "Fiber 1 Gbps" if is_adv else ("Fiber 300 Mbps" if is_high else "Broadband 100 Mbps"),
                "parent_app": "Yes" if is_high else "No", "school_app": "Yes" if is_high else "No"
            },
            "sales": {
                "decision_maker": f"Dr. Decision Maker {idx+1}",
                "decision_maker_designation": "Executive Director" if is_adv else ("Correspondent" if idx % 2 == 0 else "Principal"),
                "decision_maker_contact": f"+91 9849{idx} 12345",
                "annual_fee_range": "₹2,50,000 - ₹5,00,000" if is_adv else ("₹1,20,000 - ₹2,20,000" if is_high else "₹40,000 - ₹75,000"),
                "existing_edtech_partners": "Next Education, Google, Stemrobo" if is_high else "Local ERP",
                "technology_adoption_level": adopt, "skila_ai_potential": pot, "lead_status": status,
                "interest_level": "High" if pot == "High" else "Medium",
                "demo_done": "Yes" if status in ("Proposal Shared", "Pilot Started", "Closed Won") else "No",
                "proposal_shared": "Yes" if status in ("Proposal Shared", "Pilot Started", "Closed Won") else "No",
                "pilot_started": "Yes" if status in ("Pilot Started", "Closed Won") else "No",
                "last_contact_date": "2026-09-18", "next_follow_up_date": "2026-09-28",
                "sales_owner": owner,
                "remarks": f"Active engagement for Skila AI platform integration. Status: {status}."
            },
            "created_at": now, "updated_at": now
        }
        formatted.append(item)
    return formatted

def seed_database(db):
    col = db.collection("schools")
    existing = list(col.stream())
    if len(existing) > 0:
        print(f"Database already has {len(existing)} schools.")
        return len(existing)
    samples = generate_sample_schools()
    for s in samples:
        col.document(s["id"]).set(s)
    print(f"Successfully seeded {len(samples)} schools into database.")
    return len(samples)

if __name__ == "__main__":
    from firebase_config import get_db
    seed_database(get_db())
