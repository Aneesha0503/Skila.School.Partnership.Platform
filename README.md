# Skila School Partnership Platform

A comprehensive school intelligence and EdTech partnership platform designed for **Skila AI**. Built with a **React.js** frontend and **Python FastAPI** backend powered by **Firebase Firestore**.

---

## 🌟 Key Features

### 1. Multi-Tier Administrative Hierarchy Drill-Down
Navigate schools hierarchically from top-level state down to the exact ward or village:
- **State** (e.g., Telangana, Andhra Pradesh)
- **District** (e.g., Hyderabad, Rangareddy, Medchal-Malkajgiri, Visakhapatnam, Krishna)
- **Revenue Division / Sub-Division** (e.g., Hyderabad North, Rajendranagar, Malkajgiri)
- **Mandal** (e.g., Shaikpet, Serilingampally, Gandipet, Quthbullapur, Gajuwaka)
- **Local Body** (Municipality / Municipal Corporation / Nagar Panchayat / Gram Panchayat)
- **Village / Locality / Ward** (e.g., Ward 95 - Jubilee Hills, Narsingi Village, Kokapet GP)

### 2. Comprehensive 3-Dimensional School Details
When clicking on any school card or table row, an interactive 3-tab drawer/modal displays:

#### 📋 Tab 1: School Information (16 Fields)
- UDISE Code (11-digit national code)
- School Category (Primary, Secondary, Higher Secondary, K-12)
- Management Type (Private Unaided, Government, Aided, International)
- School Type (Co-educational, Boys, Girls)
- Board (CBSE, ICSE, IB, Cambridge, State Board)
- Classes From & Classes To
- Student Strength & Teacher Strength
- Principal Name & Correspondent Name
- Mobile, Email, Website
- Full Address & Pincode

#### 💻 Tab 2: Technology Usage & Infrastructure (17 Fields)
- ERP Used & ERP Vendor (Next Education, Fedena, Entab, etc.)
- LMS Used & LMS Vendor (Google Classroom, Canvas, Toddle, etc.)
- Coding Curriculum & Vendor (CodeVidya, Stemrobo, etc.)
- Robotics Program & Vendor (Lego Education, SP Robotics, etc.)
- AI Used & AI Vendor
- STEM Program (Active / Inactive)
- ATL Lab (Atal Tinkering Lab - Established / Not Set Up)
- Smart Classrooms (Count & Status)
- Computer Labs (Count & Status)
- Internet Connectivity (Fiber / Broadband / Speed)
- Parent Mobile App (Yes / No)
- School Mobile App (Yes / No)

#### 💼 Tab 3: Sales CRM & Skila AI Pipeline (16 Fields)
- Key Decision Maker & Designation & Contact
- Annual Fee Range
- Existing EdTech Partners
- Technology Adoption Level (Low, Medium, High, Advanced)
- Skila AI Potential (High, Medium, Low)
- Lead Status (New, Contacted, Demo Scheduled, Proposal Shared, Pilot Started, Closed Won)
- Interest Level (High, Medium, Low)
- Milestone Badges: Demo Done, Proposal Shared, Pilot Started
- Last Contact Date & Next Follow-up Date
- Sales Owner Assignment
- Remarks & Interaction Timeline (Editable & saveable directly inside the modal)

### 3. 🤖 Mistral AI Auto-Scraper & School Intelligence
Powered by `ministral-14b-latest`:
- **AI School Discovery**: Click **"Mistral AI Scraper"** in the top navigation, configure State/District/Mandal or provide search prompts (e.g. *"Top CBSE schools with coding and ATL labs in Kokapet"*), and Mistral AI automatically scrapes the entire 6-tier administrative hierarchy, 16 info fields, 17 tech fields, and 16 sales fields.
- **1-Click Bulk Import**: Review discovered schools, select the ones you want, and import them directly into the database with 1 click.
- **AI School Enrichment**: Inside any school's detail view, click **"AI Pitch & Tech Insights"** to analyze tech infrastructure gaps, predict Skila AI potential, and generate a customized sales pitch tailored to the decision maker.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Lucide React Icons
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2
- **Database**: **Firebase Firestore** (`firebase-admin`) with automatic local Firestore document store fallback when running offline or prior to adding service credentials.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Running the Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000`
Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`

### 3. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`

---

## 🔥 Firebase Setup (Optional / Production)
By default, the platform runs in a local Firestore-compatible mode with realistic pre-seeded schools.
To connect to your live Firebase project:
1. Open your **Firebase Console** -> Project Settings -> **Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Rename the file to `serviceAccountKey.json` and place it in the `backend/` directory.
4. Run `python backend/seed_firebase.py` to seed all schools directly into your live Firebase Firestore collection.
5. Restart the backend — it will automatically detect the key and switch to live Firebase mode!
