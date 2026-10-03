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
        if not os.environ.get("FORCE_LOCAL_FIRESTORE") and os.path.exists(SERVICE_ACCOUNT_FILE):
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
        self.parent.check_quota_retry()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                return self.parent.live.collection(self.col_name).document(self.doc_id).get()
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.mark_quota_exhausted(str(e))
                else:
                    self.parent.mark_quota_exhausted(str(e))
        return self.parent.local.collection(self.col_name).document(self.doc_id).get()

    def set(self, data: dict, merge: bool = False):
        self.parent.local.collection(self.col_name).document(self.doc_id).set(data, merge=merge)
        synced_live = False
        self.parent.check_quota_retry()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).set(data, merge=merge)
                synced_live = True
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.mark_quota_exhausted(str(e))
        if not synced_live:
            self.parent.queue_sync(self.col_name, self.doc_id, "set", data, merge)
        return self

    def update(self, data: dict):
        self.parent.local.collection(self.col_name).document(self.doc_id).update(data)
        synced_live = False
        self.parent.check_quota_retry()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).update(data)
                synced_live = True
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.mark_quota_exhausted(str(e))
        if not synced_live:
            self.parent.queue_sync(self.col_name, self.doc_id, "update", data)

    def delete(self):
        self.parent.local.collection(self.col_name).document(self.doc_id).delete()
        synced_live = False
        self.parent.check_quota_retry()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                self.parent.live.collection(self.col_name).document(self.doc_id).delete()
                synced_live = True
            except Exception:
                pass
        if not synced_live:
            self.parent.queue_sync(self.col_name, self.doc_id, "delete")

class ResilientCollectionRef:
    def __init__(self, parent, col_name: str):
        self.parent = parent
        self.col_name = col_name

    def document(self, doc_id: Optional[str] = None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return ResilientDocumentRef(self.parent, self.col_name, doc_id)

    def stream(self):
        self.parent.check_quota_retry()
        if not self.parent.quota_exhausted and self.parent.live:
            try:
                for doc in self.parent.live.collection(self.col_name).stream():
                    yield doc
                return
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.parent.mark_quota_exhausted(str(e))
                else:
                    self.parent.mark_quota_exhausted(str(e))
        for doc in self.parent.local.collection(self.col_name).stream():
            yield doc

class ResilientFirestoreClient:
    def __init__(self, live_client, local_client):
        self.live = live_client
        self.local = local_client
        self.quota_exhausted = False
        self.quota_exhausted_at = None
        self.sync_queue = []
        from datetime import datetime, timezone
        self.last_sync_time = datetime.now(timezone.utc).isoformat()

    def check_quota_retry(self):
        """Auto-resets quota limit state if 5 minutes have elapsed, giving live Firebase a fresh retry opportunity."""
        if self.quota_exhausted and self.quota_exhausted_at:
            from datetime import datetime, timezone
            elapsed = (datetime.now(timezone.utc) - self.quota_exhausted_at).total_seconds()
            if elapsed > 300:
                print(f"[Firebase Auto-Sync] {int(elapsed)}s passed since quota exhaustion. Attempting auto-reconnect.")
                self.quota_exhausted = False
                self.quota_exhausted_at = None

    def mark_quota_exhausted(self, reason: str = ""):
        from datetime import datetime, timezone
        self.quota_exhausted = True
        self.quota_exhausted_at = datetime.now(timezone.utc)
        if reason:
            print(f"[Firebase] Quota limit encountered ({reason}). Operating via Local Resilient Cache.")

    def collection(self, col_name: str):
        return ResilientCollectionRef(self, col_name)

    def queue_sync(self, col_name: str, doc_id: str, action: str, data: Optional[dict] = None, merge: bool = False):
        self.sync_queue = [q for q in self.sync_queue if not (q["col"] == col_name and q["id"] == doc_id)]
        self.sync_queue.append({
            "col": col_name,
            "id": doc_id,
            "action": action,
            "data": data,
            "merge": merge
        })

    def get_sync_status(self) -> dict:
        self.check_quota_retry()
        schools_count = len(self.local._data.get("schools", {}))
        notifs_count = len(self.local._data.get("notifications", {}))
        return {
            "live_firebase_configured": FIREBASE_ACTIVE,
            "live_active": bool(self.live and not self.quota_exhausted),
            "quota_exhausted": self.quota_exhausted,
            "pending_sync_count": len(self.sync_queue),
            "last_sync_time": self.last_sync_time,
            "total_local_schools": schools_count,
            "total_local_notifications": notifs_count,
            "mode": "Live Cloud Firestore" if (self.live and not self.quota_exhausted) else "Local Resilient Cache (Queued for Firebase)"
        }

    def sync_to_firebase(self) -> dict:
        if not self.live:
            return {"status": "skipped", "message": "Live Firebase is not configured.", "synced_count": 0}

        self.check_quota_retry()
        from datetime import datetime, timezone
        synced_count = 0
        failed_count = 0

        # Try to flush pending queue
        remaining_queue = []
        for item in self.sync_queue:
            try:
                col = item["col"]
                doc_id = item["id"]
                action = item["action"]
                doc_ref = self.live.collection(col).document(doc_id)
                if action == "delete":
                    doc_ref.delete()
                elif action == "update":
                    doc_ref.update(item.get("data") or {})
                else:
                    doc_ref.set(item.get("data") or {}, merge=item.get("merge", False))
                synced_count += 1
            except Exception as e:
                err_str = str(e).lower()
                if "quota exceeded" in err_str or "429" in err_str or "resource_exhausted" in err_str:
                    self.mark_quota_exhausted(str(e))
                    remaining_queue.append(item)
                    failed_count += 1
                    break
                remaining_queue.append(item)
                failed_count += 1

        self.sync_queue = remaining_queue

        # If live client succeeded, attempt full local data reconciliation
        if not self.quota_exhausted:
            self.last_sync_time = datetime.now(timezone.utc).isoformat()
            try:
                # Reconcile schools
                for s_id, s_data in list(self.local._data.get("schools", {}).items()):
                    try:
                        self.live.collection("schools").document(s_id).set(s_data, merge=True)
                        synced_count += 1
                    except Exception as ex:
                        if "quota" in str(ex).lower() or "429" in str(ex):
                            self.mark_quota_exhausted(str(ex))
                            break
            except Exception:
                pass

        return {
            "status": "success" if not self.quota_exhausted else "partial_quota_limited",
            "synced_count": synced_count,
            "pending_count": len(self.sync_queue),
            "quota_exhausted": self.quota_exhausted,
            "last_sync_time": self.last_sync_time,
            "message": f"Successfully synced {synced_count} items with Firebase." if not self.quota_exhausted else "Synced available items; remaining queued awaiting Cloud quota reset."
        }

local_client = LocalFirestoreDB(LOCAL_STORE_PATH)

if FIREBASE_ACTIVE and db:
    db = ResilientFirestoreClient(db, local_client)
else:
    db = local_client

def get_db():
    return db

def is_live_firebase():
    return FIREBASE_ACTIVE and (not getattr(db, "quota_exhausted", False))

def get_firebase_sync_status() -> dict:
    if hasattr(db, "get_sync_status"):
        return db.get_sync_status()
    return {
        "live_firebase_configured": FIREBASE_ACTIVE,
        "live_active": False,
        "quota_exhausted": False,
        "pending_sync_count": 0,
        "mode": "Local Firestore Mode"
    }

def trigger_firebase_sync() -> dict:
    if hasattr(db, "sync_to_firebase"):
        return db.sync_to_firebase()
    return {"status": "local_only", "message": "Operating in local Firestore store mode."}


