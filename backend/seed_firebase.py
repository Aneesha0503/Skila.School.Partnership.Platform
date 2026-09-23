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

import firebase_admin
from firebase_admin import credentials, firestore
from seed_data import generate_sample_schools

print("Connecting to live Firebase Firestore...")
cred = credentials.Certificate(SERVICE_KEY)
firebase_admin.initialize_app(cred)
live_db = firestore.client()

schools = generate_sample_schools()
col = live_db.collection("schools")
print(f"Uploading {len(schools)} schools to Firebase Firestore...")
for s in schools:
    col.document(s["id"]).set(s)
print(f"Successfully uploaded {len(schools)} schools to live Firebase Firestore!")
