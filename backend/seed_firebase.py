"""
Helper script to push all seeded schools directly into a live Firebase Firestore project.
Usage:
1. Download your serviceAccountKey.json from Firebase Console:
   Project Settings -> Service accounts -> Generate new private key
2. Place serviceAccountKey.json in the backend/ folder.
3. Run: python seed_firebase.py
"""
import os
import sys

SERVICE_KEY = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not os.path.exists(SERVICE_KEY):
    print(f"Error: {SERVICE_KEY} not found.")
    print("Please download your serviceAccountKey.json from Firebase Console and place it in the backend folder.")
    sys.exit(1)

import json
import firebase_admin
from firebase_admin import credentials, firestore
from seed_data import generate_sample_schools

LOCAL_STORE = os.path.join(os.path.dirname(__file__), "local_firestore.json")

print(f"Connecting to live Firebase Firestore using {SERVICE_KEY}...")
cred = credentials.Certificate(SERVICE_KEY)
firebase_admin.initialize_app(cred)
live_db = firestore.client()

# Prefer loading all 79 enriched schools from local_firestore.json
schools_to_upload = []
if os.path.exists(LOCAL_STORE):
    try:
        with open(LOCAL_STORE, "r", encoding="utf-8") as f:
            data = json.load(f)
            schools_dict = data.get("schools", {})
            schools_to_upload = list(schools_dict.values())
            print(f"Loaded {len(schools_to_upload)} schools from local_firestore.json")
    except Exception as e:
        print(f"Could not load local_firestore.json: {e}")

if not schools_to_upload:
    schools_to_upload = generate_sample_schools()
    print(f"Using {len(schools_to_upload)} default generated sample schools")

col = live_db.collection("schools")
print(f"Uploading {len(schools_to_upload)} schools directly to live Firebase Firestore 'schools' collection...")
uploaded = 0
for s in schools_to_upload:
    doc_id = s.get("id")
    if doc_id:
        col.document(doc_id).set(s)
        uploaded += 1

print(f"✅ Successfully seeded {uploaded} schools to live Firebase Firestore!")
