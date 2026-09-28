import sys
import os

# Add backend directory to sys.path so all imports in main.py work seamlessly
current_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(current_dir, "..", "backend"),
    os.path.join(current_dir, "backend"),
    os.path.join(os.getcwd(), "backend")
]
for c in candidates:
    abs_path = os.path.abspath(c)
    if os.path.isdir(abs_path) and abs_path not in sys.path:
        sys.path.insert(0, abs_path)

from main import app
from fastapi import Request
from fastapi.staticfiles import StaticFiles

# In Vercel serverless functions, internal rewrites route:
# - /api/(.*) -> /api/index.py?__path=$1
# - /(.*) -> /api/index.py?__static=$1
# This ASGI middleware normalizes the path so FastAPI routes and mounted static files match cleanly.
@app.middleware("http")
async def vercel_path_normalizer(request: Request, call_next):
    raw_path = request.query_params.get("__path")
    static_path = request.query_params.get("__static")
    if raw_path is not None:
        p = raw_path.lstrip("/")
        request.scope["path"] = f"/api/{p}"
    elif static_path is not None:
        p = static_path.lstrip("/")
        request.scope["path"] = f"/{p}"
    elif request.scope.get("path") in ["/api/index.py", "/index.py"]:
        request.scope["path"] = "/"
    return await call_next(request)

# Mount static frontend build so root and all client assets are served seamlessly
dist_candidates = [
    os.path.join(current_dir, "dist"),
    os.path.join(current_dir, "..", "dist"),
    os.path.join(os.getcwd(), "dist"),
    os.path.join(current_dir, "..", "frontend", "dist")
]
for d in dist_candidates:
    abs_d = os.path.abspath(d)
    if os.path.isdir(abs_d) and os.path.exists(os.path.join(abs_d, "index.html")):
        app.mount("/", StaticFiles(directory=abs_d, html=True), name="static")
        print(f"[Vercel] Successfully mounted static frontend from {abs_d}")
        break


