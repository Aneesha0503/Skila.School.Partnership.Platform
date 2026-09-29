import os
import json
import uuid
from typing import List, Dict, Any, Optional

FIREBASE_ACTIVE = False
db = None

SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

# Try to initialize live Firebase
try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        if os.path.exists(SERVICE_ACCOUNT_FILE):
            cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            FIREBASE_ACTIVE = True
            print(f"[Firebase] Successfully initialized live Firebase Firestore from {SERVICE_ACCOUNT_FILE}")
        elif "FIREBASE_SERVICE_ACCOUNT" in os.environ and os.environ["FIREBASE_SERVICE_ACCOUNT"].strip():
            raw_val = os.environ["FIREBASE_SERVICE_ACCOUNT"].strip()
            try:
                key_dict = json.loads(raw_val)
            except Exception:
                import base64
                key_dict = json.loads(base64.b64decode(raw_val).decode("utf-8"))
            cred = credentials.Certificate(key_dict)
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            FIREBASE_ACTIVE = True
            print("[Firebase] Successfully initialized live Firebase Firestore from FIREBASE_SERVICE_ACCOUNT env var")
        elif "GOOGLE_APPLICATION_CREDENTIALS" in os.environ and os.path.exists(os.environ["GOOGLE_APPLICATION_CREDENTIALS"]):
            cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
            firebase_admin.initialize_app(cred)
            db = firestore.client()
            FIREBASE_ACTIVE = True
            print(f"[Firebase] Successfully initialized live Firebase Firestore from GOOGLE_APPLICATION_CREDENTIALS")
        else:
            print("[Firebase] serviceAccountKey.json not found. Operating in Local Firestore-compatible mode.")
    else:
        db = firestore.client()
        FIREBASE_ACTIVE = True
except Exception as e:
    print(f"[Firebase] Live Firebase initialization failed ({e}). Falling back to Local Firestore-compatible mode.")

# Local Firestore fallback store
LOCAL_STORE_PATH = os.path.join(os.path.dirname(__file__), "local_firestore.json")

# In serverless environments like Vercel (AWS Lambda), root filesystem is read-only.
# We copy/initialize to /tmp if running under Vercel/Lambda.
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_path = "/tmp/local_firestore.json"
    if not os.path.exists(tmp_path) and os.path.exists(LOCAL_STORE_PATH):
        try:
            import shutil
            shutil.copyfile(LOCAL_STORE_PATH, tmp_path)
        except Exception:
            pass
    LOCAL_STORE_PATH = tmp_path

class LocalDocumentRef:
    def __init__(self, doc_id: str, collection_store: dict, file_save_cb):
        self.id = doc_id
        self._store = collection_store
        self._save = file_save_cb

    def get(self):
        data = self._store.get(self.id)
        return LocalDocumentSnapshot(self.id, data)

    def set(self, data: dict, merge: bool = False):
        if merge and self.id in self._store:
            self._store[self.id].update(data)
        else:
            self._store[self.id] = data
        self._save()
        return self

    def update(self, data: dict):
        if self.id in self._store:
            self._store[self.id].update(data)
            self._save()

    def delete(self):
        if self.id in self._store:
            del self._store[self.id]
            self._save()

class LocalDocumentSnapshot:
    def __init__(self, doc_id: str, data: Optional[dict]):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data.copy() if self._data else {}

class LocalCollectionRef:
    def __init__(self, col_name: str, root_store: dict, file_save_cb):
        self.name = col_name
        self._root = root_store
        self._save = file_save_cb
        if col_name not in self._root:
            self._root[col_name] = {}

    def document(self, doc_id: Optional[str] = None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return LocalDocumentRef(doc_id, self._root[self.name], self._save)

    def stream(self):
        for doc_id, doc_data in list(self._root[self.name].items()):
            yield LocalDocumentSnapshot(doc_id, doc_data)

class LocalFirestoreDB:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self._data = {}
        self.load()

    def load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    self._data = json.load(f)
            except Exception:
                self._data = {}
        else:
            self._data = {}

    def save(self):
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[LocalFirestore] Notice: could not persist to disk ({e})")

    def collection(self, col_name: str):
        return LocalCollectionRef(col_name, self._data, self.save)

class ResilientDocumentRef:
    def __init__(self, parent, col_name: str, doc_id: Optional[str]):
        self.parent = parent
        self.col_name = col_name
        self.id = doc_id
        self.doc_id = doc_id

    def get(self):
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                return self.parent.live.collection(self.col_name).document(self.doc_id).get()
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    print(f"[Firebase] Live Firestore quota exceeded: {e}. Switching to Local Firestore mode.")
                    self.parent.quota_exhausted = True
                else:
                    self.parent.quota_exhausted = True
        return self.parent.local.collection(self.col_name).document(self.doc_id).get()

    def set(self, data: dict, merge: bool = False):
        self.parent.local.collection(self.col_name).document(self.doc_id).set(data, merge=merge)
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).set(data, merge=merge)
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.quota_exhausted = True
        return self

    def update(self, data: dict):
        self.parent.local.collection(self.col_name).document(self.doc_id).update(data)
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).update(data)
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.quota_exhausted = True

    def delete(self):
        self.parent.local.collection(self.col_name).document(self.doc_id).delete()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).delete()
            except Exception:
                pass

class ResilientCollectionRef:
    def __init__(self, parent, col_name: str):
        self.parent = parent
        self.col_name = col_name

    def document(self, doc_id: Optional[str] = None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return ResilientDocumentRef(self.parent, self.col_name, doc_id)

    def stream(self):
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                for doc in self.parent.live.collection(self.col_name).stream():
                    yield doc
                return
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    print(f"[Firebase] Live Firestore quota exceeded: {e}. Switching to Local Firestore mode.")
                    self.parent.quota_exhausted = True
                else:
                    self.parent.quota_exhausted = True
        for doc in self.parent.local.collection(self.col_name).stream():
            yield doc

class ResilientFirestoreClient:
    def __init__(self, live_client, local_client):
        self.live = live_client
        self.local = local_client
        self.quota_exhausted = False

    def collection(self, col_name: str):
        return ResilientCollectionRef(self, col_name)

local_client = LocalFirestoreDB(LOCAL_STORE_PATH)

if FIREBASE_ACTIVE and db:
    db = ResilientFirestoreClient(db, local_client)
else:
    db = local_client

def get_db():
    return db

def is_live_firebase():
    return FIREBASE_ACTIVE and (not getattr(db, "quota_exhausted", False))

