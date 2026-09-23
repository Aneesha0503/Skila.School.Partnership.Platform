Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Skila School Partnership Platform " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

# Start Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn main:app --reload --port 8000"
Write-Host "[1/2] Backend starting on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)" -ForegroundColor Yellow

# Start Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Write-Host "[2/2] Frontend starting on http://localhost:5173" -ForegroundColor Yellow

Write-Host "`nPlatform is launching! Check your browser at http://localhost:5173" -ForegroundColor Green
