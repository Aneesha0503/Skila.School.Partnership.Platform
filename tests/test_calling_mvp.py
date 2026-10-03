import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, os.path.abspath(backend_dir))

os.environ["FORCE_LOCAL_FIRESTORE"] = "1"

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== Testing Skila AI Outbound Calling Platform ===")
    
    # 1. Initiate Call
    init_res = client.post('/api/calling/initiate', json={
        'phone_number': '+919876543210',
        'school_name': 'ZPHS Ghatkesar',
        'district': 'Medchal-Malkajgiri',
        'force_mock': True
    })
    assert init_res.status_code == 200, f"Failed initiate: {init_res.text}"
    init_data = init_res.json()
    call_id = init_data['call_id']
    print("[OK] Call Initiated:", call_id)
    print("  Initial Greeting:", init_data['initial_turn']['text'])

    # 2. Turn 1 (Principal shares student strength and LMS pain)
    turn1 = client.post('/api/calling/speech-turn', json={
        'call_id': call_id,
        'user_speech': 'Namaskaram andi, maa school lo 750 students unnaru, kani digital tools sarigga levu.'
    })
    assert turn1.status_code == 200, f"Failed turn 1: {turn1.text}"
    t1_data = turn1.json()
    print("[OK] Turn 1 Response:", t1_data.get('ai_turn', {}).get('text'))
    assert t1_data.get('state', {}).get('student_count') == 750

    # 3. Turn 2 (Demo request)
    turn2 = client.post('/api/calling/speech-turn', json={
        'call_id': call_id,
        'user_speech': 'Sure demo arrange cheyyandi, weekend chudam.'
    })
    assert turn2.status_code == 200, f"Failed turn 2: {turn2.text}"
    t2_data = turn2.json()
    print("[OK] Turn 2 Response:", t2_data.get('ai_turn', {}).get('text'))
    assert t2_data.get('state', {}).get('demo_requested') is True

    # 4. End Call
    end_res = client.post(f'/api/calling/end/{call_id}')
    assert end_res.status_code == 200, f"Failed end call: {end_res.text}"
    summary = end_res.json().get('summary', {})
    print("[OK] Call Ended Successfully. Duration:", summary.get('duration'), "seconds")
    analysis = summary.get('analysis', {})
    print("[OK] AI Analysis Interest Level:", analysis.get('interest_level'))
    print("  AI Analysis Status:", analysis.get('lead_status'))
    print("  AI Analysis Summary:", analysis.get('summary'))
    assert analysis.get('interest_level') == "HOT"

    # 5. Verify HOT Leads list
    hot_res = client.get('/api/calling/hot-leads')
    assert hot_res.status_code == 200
    hot_count = hot_res.json().get('count', 0)
    print("[OK] HOT Leads Endpoint Count:", hot_count)
    assert hot_count >= 1

    # 6. Verify Demos list
    demos_res = client.get('/api/calling/demos')
    assert demos_res.status_code == 200
    demos_count = demos_res.json().get('count', 0)
    print("[OK] Demos Booked Endpoint Count:", demos_count)
    assert demos_count >= 1

    # 7. Verify Dashboard KPIs
    dash_res = client.get('/api/calling/dashboard')
    assert dash_res.status_code == 200
    metrics = dash_res.json().get('metrics', {})
    print("[OK] Dashboard Metrics:", metrics)
    assert metrics.get('calls_made', 0) >= 1
    assert metrics.get('hot_leads', 0) >= 1

    # 8. Verify Calling Settings
    settings_res = client.get('/api/calling/settings')
    assert settings_res.status_code == 200
    s_data = settings_res.json().get('settings', {})
    print("[OK] Calling Settings retrieved. Telephony status:", s_data.get('telephony_status'))
    assert 'telephony_status' in s_data
    assert 'credentials' in s_data

    # 9. Verify Plivo Webhook XML Response
    webhook_res = client.post('/api/calling/plivo/webhook')
    assert webhook_res.status_code == 200
    assert 'application/xml' in webhook_res.headers.get('content-type', '')
    assert '<Response>' in webhook_res.text
    assert '<Speak' in webhook_res.text
    print("[OK] Plivo Webhook XML Endpoint Verified:", webhook_res.text[:60], "...")

    # 10. Verify Credentials Update API
    cred_res = client.post('/api/calling/settings/credentials', json={
        'public_webhook_url': 'https://skila-demo.ngrok-free.app'
    })
    assert cred_res.status_code == 200
    assert cred_res.json().get('status') == 'success'
    print("[OK] Credentials Endpoint Verified")

    # 11. Verify Test Plivo Endpoint with empty/invalid keys
    test_plivo_res = client.post('/api/calling/settings/test-plivo', json={
        'auth_id': 'TEST_AUTH_ID',
        'auth_token': 'TEST_AUTH_TOKEN'
    })
    assert test_plivo_res.status_code == 200
    # Plivo API will reject fake keys with success: False
    print("[OK] Test Plivo Endpoint response:", test_plivo_res.json())

    print("\n[SUCCESS] ALL SKILA AI CALLING BACKEND TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
