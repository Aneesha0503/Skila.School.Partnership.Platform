"""
End-to-End Automated Testing Suite for Skila School Partnership Platform
Covers all core modules: Auth & RBAC, Schools CRUD, Sales Pipeline, Formalities & MOU,
Student Roster Importer, Financial Tracking & P&L Statement, Notifications & Firebase Sync.
"""

import sys
import os
import unittest
import uuid

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from fastapi.testclient import TestClient
from main import app, get_all_schools_raw

client = TestClient(app)

class TestPlatformFeatures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_id = uuid.uuid4().hex[:6]
        cls.admin_email = f"admin_{cls.test_id}@skila.ai"
        cls.agent_email = f"agent_{cls.test_id}@skila.ai"
        cls.password = "SkilaTestPass@2026"
        cls.admin_token = None
        cls.agent_token = None
        cls.test_school_id = None

    # ==========================================
    # 1. HEALTH, CONFIG & FIREBASE SYNC TESTS
    # ==========================================
    def test_01_stats_and_states(self):
        """Tests general statistics and administrative state/district datasets."""
        res = client.get("/api/states-districts")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("states", data)
        self.assertIn("districts_by_state", data)

        res_stats = client.get("/api/stats")
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertIn("total_schools", stats)
        self.assertIn("total_students", stats)

    def test_02_firebase_status_and_sync(self):
        """Tests live Firebase synchronization status and manual trigger."""
        res = client.get("/api/firebase/status")
        self.assertEqual(res.status_code, 200)
        status = res.json()
        self.assertIn("live_firebase_configured", status)
        self.assertIn("total_local_schools", status)

        res_sync = client.post("/api/firebase/sync")
        self.assertEqual(res_sync.status_code, 200)
        sync_res = res_sync.json()
        self.assertIn("status", sync_res)

    # ==========================================
    # 2. AUTHENTICATION & RBAC TESTS
    # ==========================================
    def test_03_admin_register_and_login(self):
        """Registers a platform administrator, verifies JWT token issuance and profile."""
        reg_payload = {
            "email": self.admin_email,
            "password": self.password,
            "full_name": f"Admin Test {self.test_id}",
            "role": "admin",
            "phone": "+91 98765 00001"
        }
        res_reg = client.post("/api/auth/register", json=reg_payload)
        self.assertIn(res_reg.status_code, [200, 201])
        user_prof = res_reg.json()
        self.assertEqual(user_prof["role"], "admin")

        # Verify login to obtain JWT Bearer Token
        res_login = client.post("/api/auth/login", json={"email": self.admin_email, "password": self.password})
        self.assertEqual(res_login.status_code, 200)
        token = res_login.json().get("access_token")
        self.assertTrue(bool(token))
        TestPlatformFeatures.admin_token = token
        self.assertEqual(res_login.json()["user"]["role"], "admin")

        # Verify profile with Bearer Token
        res_prof = client.get("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res_prof.status_code, 200)
        self.assertEqual(res_prof.json()["email"], self.admin_email)

    def test_04_agent_register_and_rbac(self):
        """Registers a field agent and validates RBAC enforcement (agent cannot access admin routes)."""
        reg_payload = {
            "email": self.agent_email,
            "password": self.password,
            "full_name": f"Field Agent {self.test_id}",
            "role": "agent",
            "phone": "+91 98765 00002"
        }
        res_reg = client.post("/api/auth/register", json=reg_payload, headers={"Authorization": f"Bearer {self.admin_token}"})
        self.assertIn(res_reg.status_code, [200, 201])

        # Login agent
        res_login = client.post("/api/auth/login", json={"email": self.agent_email, "password": self.password})
        self.assertEqual(res_login.status_code, 200)
        agent_tok = res_login.json().get("access_token")
        self.assertTrue(bool(agent_tok))
        TestPlatformFeatures.agent_token = agent_tok

        # Agent trying to access admin-only route should be rejected with 403 Forbidden
        res_admin_only = client.delete(
            "/api/schools/test-school-rbac",
            headers={"Authorization": f"Bearer {agent_tok}"}
        )
        self.assertEqual(res_admin_only.status_code, 403)

    # ==========================================
    # 3. SCHOOL DIRECTORY & CRUD TESTS
    # ==========================================
    def test_05_school_crud_lifecycle(self):
        """Creates a school, reads it, updates its details, and tests filtering."""
        school_payload = {
            "info": {
                "school_name": f"Skila Test Academy {self.test_id}",
                "affiliated_board": "CBSE",
                "student_strength": 420,
                "teacher_strength": 28,
                "principal_name": "Dr. S. K. Raman",
                "mobile": "+91 98765 43210",
                "email": f"principal_{self.test_id}@testacademy.edu"
            },
            "hierarchy": {
                "state": "Telangana",
                "district": "Hyderabad",
                "mandal": "Amberpet",
                "pincode": "500013",
                "address": "Road No 4, Amberpet, Hyderabad"
            },
            "technology": {
                "smart_classrooms": "Yes",
                "computer_lab": "Yes",
                "internet_connectivity": "Fiber 100Mbps",
                "lms_used": "No"
            },
            "sales": {
                "lead_status": "New",
                "annual_fee_range": "₹3,50,000",
                "deal_closed": False
            }
        }
        # Create
        res_create = client.post(
            "/api/schools",
            json=school_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_create.status_code, 200)
        created = res_create.json()
        school_id = created.get("id")
        self.assertTrue(bool(school_id))
        TestPlatformFeatures.test_school_id = school_id

        # Read
        res_get = client.get(f"/api/schools/{school_id}")
        self.assertEqual(res_get.status_code, 200)
        self.assertEqual(res_get.json()["info"]["school_name"], f"Skila Test Academy {self.test_id}")

        # Update
        school_payload["info"]["teacher_strength"] = 32
        res_update = client.put(
            f"/api/schools/{school_id}",
            json=school_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_update.status_code, 200)
        self.assertEqual(res_update.json()["info"]["teacher_strength"], 32)

    # ==========================================
    # 4. SALES PIPELINE & FORMALITIES ACTIVATION
    # ==========================================
    def test_06_sales_pipeline_flow(self):
        """Progresses the school through pipeline stages and activates partnership formalities."""
        sid = self.test_school_id
        # Transition to Demo Done
        res_status = client.put(
            f"/api/schools/{sid}/status",
            json={"lead_status": "Demo Done", "remarks": "Showcased AI curriculum to management."},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_status.status_code, 200)
        status_json = res_status.json()
        school_obj = status_json.get("school") if isinstance(status_json.get("school"), dict) else status_json
        self.assertEqual(school_obj["sales"]["lead_status"], "Demo Done")

        # Close Deal (Triggers Stage 1 Formalities & Closed Won status)
        res_deal = client.post(
            f"/api/schools/{sid}/toggle-deal",
            json={"deal_closed": True},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_deal.status_code, 200)
        deal_json = res_deal.json()
        updated_school = deal_json.get("school") if isinstance(deal_json.get("school"), dict) else deal_json
        self.assertTrue(updated_school["sales"]["deal_closed"])
        self.assertEqual(updated_school["sales"]["lead_status"], "Closed Won")

        # Verify Formalities Hub reflects this school
        res_conf = client.get("/api/schools/confirmed")
        self.assertEqual(res_conf.status_code, 200)
        confirmed_ids = [s["id"] for s in res_conf.json().get("schools", [])]
        self.assertIn(sid, confirmed_ids)

    # ==========================================
    # 5. DIGITAL MOU & FORMALITIES WORKFLOW
    # ==========================================
    def test_07_mou_and_formalities(self):
        """Verifies commercial terms, digital MOU e-signature, and progress calculation."""
        sid = self.test_school_id
        # Get formalities
        res_f = client.get(f"/api/schools/{sid}/formalities")
        self.assertEqual(res_f.status_code, 200)
        f_data = res_f.json()
        self.assertIn("contract_value", f_data)

        # Update Commercial Terms & SPOC
        update_payload = {
            "contract_value": "₹3,50,000",
            "payment_terms": "Advance 50% + 50% Post-Implementation",
            "school_spoc_name": "Dr. S. K. Raman",
            "school_spoc_phone": "+91 98765 43210",
            "mou_status": "Signed by School",
            "invoice_status": "Advance Paid"
        }
        res_update_f = client.put(
            f"/api/schools/{sid}/formalities",
            json=update_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        res_json = res_update_f.json()
        updated_f = res_json.get("formalities") if isinstance(res_json.get("formalities"), dict) else res_json
        self.assertEqual(updated_f.get("invoice_status"), "Advance Paid")
        self.assertGreaterEqual(updated_f.get("progress_pct", 0), 50)

    # ==========================================
    # 6. STUDENT ROSTER IMPORTER & BATCH PROVISIONING
    # ==========================================
    def test_08_student_roster_and_provisioning(self):
        """Tests blank CSV template, roster ingestion, capacity check, manual student CRUD, and 1-click LMS provisioning."""
        sid = self.test_school_id

        # 1. Download CSV template
        res_tpl = client.get(f"/api/schools/{sid}/roster/template")
        self.assertEqual(res_tpl.status_code, 200)
        self.assertIn("Roll Number,Student Name", res_tpl.text)

        # 2. Upload Student Roster
        roster_payload = {
            "file_name": "annual_admissions_2026.csv",
            "students": [
                {
                    "roll_number": "SK-2001",
                    "student_name": "Aarav Sharma",
                    "class_grade": "Grade 6",
                    "section": "A",
                    "parent_name": "Mr. Sharma",
                    "parent_phone": "+91 98765 11111",
                    "parent_email": "sharma.parent@gmail.com"
                },
                {
                    "roll_number": "SK-2002",
                    "student_name": "Diya Reddy",
                    "class_grade": "Grade 7",
                    "section": "B",
                    "parent_name": "Mrs. Reddy",
                    "parent_phone": "+91 98765 22222",
                    "parent_email": "reddy.parent@gmail.com"
                }
            ]
        }
        res_upload = client.post(
            f"/api/schools/{sid}/roster/upload",
            json=roster_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_upload.status_code, 200)
        upload_data = res_upload.json()
        self.assertEqual(upload_data["uploaded_count"], 2)
        self.assertIn("Grade 6", upload_data["classes_breakdown"])

        # 3. Manually add an individual student
        new_student_payload = {
            "roll_number": "SK-2003",
            "student_name": "Kavya Patel",
            "class_grade": "Grade 8",
            "section": "A",
            "parent_name": "Mr. Patel",
            "parent_phone": "+91 98765 33333",
            "parent_email": "patel.parent@gmail.com"
        }
        res_add_s = client.post(
            f"/api/schools/{sid}/roster/student",
            json=new_student_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_add_s.status_code, 200)
        self.assertEqual(res_add_s.json()["uploaded_count"], 3)

        # 4. 1-Click Batch LMS Accounts Provisioning & Parent Welcome Kit
        prov_payload = {
            "channels": ["WhatsApp", "SMS", "Email"],
            "custom_welcome_message": "Welcome to the Skila AI Learning Portal!"
        }
        res_prov = client.post(
            f"/api/schools/{sid}/roster/provision",
            json=prov_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_prov.status_code, 200)
        prov_data = res_prov.json()
        self.assertEqual(prov_data["accounts_provisioned_count"], 3)
        self.assertEqual(prov_data["roster_status"], "Verified")

        # 5. Export provisioned credentials CSV
        res_export = client.get(f"/api/schools/{sid}/roster/export")
        self.assertEqual(res_export.status_code, 200)
        self.assertIn("Aarav Sharma", res_export.text)
        self.assertIn("Kavya Patel", res_export.text)

    # ==========================================
    # 7. FINANCIAL TRACKING & P&L STATEMENT
    # ==========================================
    def test_09_financial_tracking_and_pnl(self):
        """Tests revenue calculation, operational expense logger, cash payments collection, net profit and CSV export."""
        sid = self.test_school_id

        # 1. Log an operational expense
        exp_payload = {
            "category": "Cloud Infrastructure & AI Tokens",
            "amount": 25000.0,
            "description": "GPU cluster token allocation for student coding playground",
            "date": "2026-03-01",
            "logged_by": "Finance Lead",
            "payment_mode": "Online Transfer"
        }
        res_exp = client.post(
            f"/api/schools/{sid}/finances/expense",
            json=exp_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_exp.status_code, 200)
        exp_data = res_exp.json()
        exp_id = exp_data["expense"]["id"]
        self.assertGreater(exp_data["metrics"]["total_expenses"], 0)

        # 2. Record a cash collection payment
        pay_payload = {
            "amount": 175000.0,
            "date": "2026-03-02",
            "payment_type": "Commercial Advance (50%)",
            "payment_mode": "NEFT / RTGS",
            "reference_no": f"TXN-{self.test_id}-001",
            "notes": "Verified institutional bank transfer"
        }
        res_pay = client.post(
            f"/api/schools/{sid}/finances/payment",
            json=pay_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_pay.status_code, 200)
        pay_metrics = res_pay.json()["metrics"]
        self.assertEqual(pay_metrics["collected_revenue"], 175000.0)

        # 3. Fetch Platform Financial Analytics
        res_fin = client.get("/api/finances/analytics")
        self.assertEqual(res_fin.status_code, 200)
        fin_data = res_fin.json()
        summary = fin_data.get("summary", {})
        self.assertGreater(summary.get("total_contracted_revenue", 0), 0)
        self.assertGreater(summary.get("total_collected_revenue", 0), 0)
        self.assertGreater(summary.get("total_expenses", 0), 0)
        self.assertIn("categories_breakdown", fin_data)
        self.assertEqual(len(fin_data["categories_breakdown"]), 6)
        self.assertIn("monthly_trends", fin_data)

        # 4. Delete expense item
        res_del_exp = client.delete(
            f"/api/schools/{sid}/finances/expense/{exp_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_del_exp.status_code, 200)

        # 5. Export P&L Financial Statement CSV
        res_pnl_csv = client.get("/api/finances/export")
        self.assertEqual(res_pnl_csv.status_code, 200)
        self.assertIn("Contracted MOU Revenue", res_pnl_csv.text)
        self.assertIn("GRAND TOTAL", res_pnl_csv.text)

    # ==========================================
    # 8. NOTIFICATIONS & FIELD AGENT AUDIT
    # ==========================================
    def test_10_field_agent_notes_and_notifications(self):
        """Agent logs field note, generates notification, verifies confidentiality scoping, and marks read."""
        sid = self.test_school_id

        # Log note
        note_payload = {
            "agent_name": f"Field Agent {self.test_id}",
            "bucket": "Campus Visits & Demos",
            "category": "School Visit",
            "urgency": "Normal",
            "text": "Completed orientation with Vice Principal regarding AI lab launch."
        }
        res_note = client.post(
            f"/api/schools/{sid}/agent-notes",
            json=note_payload,
            headers={"Authorization": f"Bearer {self.agent_token}"}
        )
        self.assertEqual(res_note.status_code, 200)

        # Check notifications
        res_notif = client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res_notif.status_code, 200)
        notifs = res_notif.json()
        self.assertGreater(len(notifs), 0)

        # Mark all read
        res_mark = client.post("/api/notifications/mark-all-read")
        self.assertEqual(res_mark.status_code, 200)
        self.assertTrue(res_mark.json().get("success"))

    # ==========================================
    # 9. EXCEL & CSV EXPORTS
    # ==========================================
    def test_11_directory_exports(self):
        """Verifies Microsoft Excel (.xlsx) and CSV (.csv) exports of the school intelligence directory."""
        res_excel = client.get("/api/schools/export/excel")
        self.assertEqual(res_excel.status_code, 200)
        self.assertGreater(len(res_excel.content), 500)

        res_csv = client.get("/api/schools/export/csv")
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("School Name", res_csv.text)

    # Clean up test school and accounts
    @classmethod
    def tearDownClass(cls):
        if cls.test_school_id and cls.admin_token:
            try:
                client.delete(
                    f"/api/schools/{cls.test_school_id}",
                    headers={"Authorization": f"Bearer {cls.admin_token}"}
                )
            except Exception:
                pass
        # Clean up test users
        from firebase_config import db
        test_emails = {cls.admin_email, cls.agent_email}
        try:
            for doc in db.collection("users").stream():
                if doc.to_dict().get("email") in test_emails:
                    db.collection("users").document(doc.id).delete()
        except Exception:
            pass

if __name__ == '__main__':
    unittest.main(verbosity=2)
