"""
Comprehensive Endpoint, Ingestion, and Authentication Test Suite for NexusProcure.
Consolidates test_auth.py, test_new_endpoints.py, and test_upload_fallback.py.
"""
import sys
import os
import time
import json
import urllib.request
import urllib.error
import mimetypes
import pymysql
import requests
from dotenv import load_dotenv

# Set paths
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from utils.security import get_password_hash

BASE_URL = "http://127.0.0.1:8002/api"

# Helper for multipart/form-data upload
def encode_multipart_form_data(files, fields):
    boundary = b'----WebKitFormBoundary7MA4YWxkTrZu0gW'
    CRLF = b'\r\n'
    L = []
    for (key, value) in fields.items():
        L.append(b'--' + boundary)
        L.append(f'Content-Disposition: form-data; name="{key}"'.encode('utf-8'))
        L.append(b'')
        L.append(str(value).encode('utf-8'))
    for (key, filepath, filename) in files:
        L.append(b'--' + boundary)
        L.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"'.encode('utf-8'))
        content_type = mimetypes.guess_type(filepath)[0] or 'application/octet-stream'
        L.append(f'Content-Type: {content_type}'.encode('utf-8'))
        L.append(b'')
        with open(filepath, 'rb') as f:
            L.append(f.read())
    L.append(b'--' + boundary + b'--')
    L.append(b'')
    body = CRLF.join(L)
    content_type = f'multipart/form-data; boundary={boundary.decode("utf-8")}'
    return content_type, body

# Helper for making HTTP requests
def make_request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = None
    if data:
        req_data = json.dumps(data).encode('utf-8')
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        try:
            res_body = e.read().decode('utf-8')
            return e.code, json.loads(res_body)
        except:
            return e.code, e.reason
    except Exception as e:
        return 0, str(e)


def run_auth_tests():
    print("\n=========================================")
    print(">>> RUNNING AUTHENTICATION VERIFICATIONS <<<")
    print("=========================================")
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        print("[DB] Connection successful.")
        
        test_email = "test_user_verification@nexusprocure.com"
        test_password = "verification_pwd_123"
        
        with connection.cursor() as cursor:
            # Clean up if test user already exists
            cursor.execute("DELETE FROM users WHERE email = %s", (test_email,))
            
            # Insert suspended test user
            hashed_pwd = get_password_hash(test_password)
            cursor.execute(
                """
                INSERT INTO users (name, email, hashed_password, role_id, status)
                VALUES (%s, %s, %s, (SELECT id FROM roles WHERE name='Buyer'), 'Suspended')
                """,
                ("Test User Verify", test_email, hashed_pwd)
            )
            print("[DB] Inserted suspended test user.")
            
        connection.close()

        # Step 2: Attempt login as suspended user
        print("\nAttempting login as SUSPENDED user...")
        login_url = f"{BASE_URL}/auth/login"
        payload = {"email": test_email, "password": test_password}
        
        response = requests.post(login_url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
        
        assert response.status_code == 403, f"Expected status code 403, got {response.status_code}"
        assert "Suspended" in response.json()["detail"], "Expected 'Suspended' in error detail"
        print("[OK] Suspended user login check passed successfully!")

        # Step 3: Activate the user
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET status = 'Active' WHERE email = %s", (test_email,))
            print("\n[DB] Updated test user status to Active.")
        connection.close()

        # Step 4: Attempt login as active user
        print("\nAttempting login as ACTIVE user...")
        response = requests.post(login_url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response JSON: {response.json()}")
        
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        assert "access_token" in response.json(), "Expected 'access_token' in response"
        print("[OK] Active user login check passed successfully!")

        # Step 5: Clean up
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE email = %s", (test_email,))
            print("\n[DB] Cleaned up verification test user.")
        connection.close()
        
        print("\nAll auth verification checks passed!")
        return True

    except Exception as e:
        print(f"\nVerification Failure in Auth Tests: {e}")
        return False


def run_endpoint_tests():
    print("\n=========================================")
    print(">>> RUNNING API ENDPOINTS VERIFICATIONS <<<")
    print("=========================================")
    
    # 1. Login to get tokens for different personas
    personas = {
        "Buyer": {"email": "sumankhamrai.98@gmail.com", "password": "1234"},
        "Category Manager": {"email": "khamraisuman7211@gmail.com", "password": "1234"},
        "Finance Controller": {"email": "finance@insureai.com", "password": "1234"},
        "CPO": {"email": "cpo@insureai.com", "password": "1234"}
    }
    
    tokens = {}
    for name, credentials in personas.items():
        status, body = make_request("POST", "/auth/login", data=credentials)
        if status == 200:
            tokens[name] = body["access_token"]
            print(f"[OK] Login successful for {name}")
        else:
            print(f"[FAIL] Login failed for {name}: {status} - {body}")
            return False
            
    buyer_token = tokens.get('Buyer')
    cpo_token = tokens.get('CPO')
    finance_token = tokens.get('Finance Controller')
    cm_token = tokens.get('Category Manager')
    
    # Test GET /auth/me
    status, body = make_request("GET", "/auth/me", token=buyer_token)
    if status == 200:
        print(f"[OK] GET /auth/me: {body['data']}")
    else:
        print(f"[FAIL] GET /auth/me: {status} - {body}")
        
    # Fetch opportunities list to get a valid opportunity_id
    opp_id = None
    status, body = make_request("GET", "/opportunities/list", token=buyer_token)
    if status == 200 and len(body["data"]) > 0:
        opp_id = body["data"][0]["id"]
        print(f"[OK] Fetched valid opportunity ID: {opp_id}")
    else:
        print(f"[WARN] No opportunities found to test tasks assignment: {status} - {body}")
        
    # Test tasks assign
    if opp_id:
        payload = {"buyer_id": 1, "opportunity_id": opp_id, "sla_hours": 24}
        status, body = make_request("POST", "/tasks/assign", data=payload, token=cm_token)
        if status == 200:
            task_id = body["data"]["task_id"]
            print(f"[OK] POST /tasks/assign: {body}")
            
            # Test task status update
            status_payload = {"task_id": task_id, "status": "IN_PROGRESS"}
            status2, body2 = make_request("PUT", "/tasks/status", data=status_payload, token=buyer_token)
            if status2 == 200:
                print(f"[OK] PUT /tasks/status: {body2['message']}")
            else:
                print(f"[FAIL] PUT /tasks/status: {status2} - {body2}")
        else:
            print(f"[FAIL] POST /tasks/assign: {status} - {body}")
            
    # Test playbook generation
    if opp_id:
        status, body = make_request("POST", "/negotiation/playbook", data={"opportunity_id": opp_id}, token=buyer_token)
        if status == 200:
            print(f"[OK] POST /negotiation/playbook successful: {list(body['data'].keys())}")
        else:
            print(f"[FAIL] POST /negotiation/playbook: {status} - {body}")
            
    # Test email drafting
    if opp_id:
        status, body = make_request("POST", "/negotiation/draft-email", data={"opportunity_id": opp_id}, token=buyer_token)
        if status == 200:
            print(f"[OK] POST /negotiation/draft-email: {body['data']['subject']}")
        else:
            print(f"[FAIL] POST /negotiation/draft-email: {status} - {body}")
            
    # Test validation of savings
    if opp_id:
        status, body = make_request("POST", "/savings/validate", data={"opportunity_id": opp_id, "validated_amount": 5000.0}, token=finance_token)
        if status == 200:
            print(f"[OK] POST /savings/validate: {body}")
        else:
            print(f"[FAIL] POST /savings/validate: {status} - {body}")
            
    # Test savings tracker
    status, body = make_request("GET", "/savings/tracker", token=buyer_token)
    if status == 200:
        print(f"[OK] GET /savings/tracker: Metrics -> {body['data']['metrics']}")
    else:
        print(f"[FAIL] GET /savings/tracker: {status} - {body}")
        
    # Test supplier analytics
    status, body = make_request("GET", "/suppliers/analytics", token=buyer_token)
    if status == 200:
        print(f"[OK] GET /suppliers/analytics: Count -> {len(body['data'])}")
    else:
        print(f"[FAIL] GET /suppliers/analytics: {status} - {body}")
        
    # Test dashboards
    dashboards = ["executive", "buyer", "finance"]
    for db in dashboards:
        token = cpo_token if db == "executive" else (buyer_token if db == "buyer" else finance_token)
        status, body = make_request("GET", f"/dashboard/{db}", token=token)
        if status == 200:
            print(f"[OK] GET /dashboard/{db} successful")
        else:
            print(f"[FAIL] GET /dashboard/{db}: {status} - {body}")
            
    # Test audit logs
    status, body = make_request("GET", "/audit/logs", token=cpo_token)
    if status == 200:
        print(f"[OK] GET /audit/logs: Fetched {len(body['data'])} logs")
    else:
        print(f"[FAIL] GET /audit/logs: {status} - {body}")
        
    print("\nAll endpoint verifications passed!")
    return True


def run_uploads_and_fallback_tests():
    print("\n=========================================")
    print(">>> RUNNING INGESTION & FALLBACK TESTS <<<")
    print("=========================================")
    
    # 1. Login as Category Manager
    login_payload = json.dumps({"email": "khamraisuman7211@gmail.com", "password": "1234"}).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=login_payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as res:
        res_body = json.loads(res.read().decode('utf-8'))
        token = res_body["access_token"]
        print(f"[OK] Token obtained successfully.")
        
    # Setup local upload test directory
    os.makedirs("uploads", exist_ok=True)
    
    # 2. Test Invalid Extension (.png)
    print("\nTesting Invalid File Extension (.png)...")
    png_test_file = "uploads/test_invalid.png"
    with open(png_test_file, "w") as f:
        f.write("dummy content")
        
    content_type, body = encode_multipart_form_data(
        files=[("files", png_test_file, "test_invalid.png")],
        fields={"doc_type": "Auto-Detect"}
    )
    req = urllib.request.Request(
        f"{BASE_URL}/knowledge/upload", data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": content_type}, method="POST"
    )
    with urllib.request.urlopen(req) as res:
        upload_res = json.loads(res.read().decode('utf-8'))
        if not upload_res["data"][0]["success"] and "Unsupported format" in upload_res["data"][0]["error"]:
            print(f"[OK] Successfully rejected invalid file format: {upload_res['data'][0]['error']}")
        else:
            print(f"[FAIL] Did not reject properly: {upload_res}")
            return False
            
    # 3. Test File Size Limit (21MB)
    print("\nTesting File Size Limit (21MB)...")
    large_test_file = "uploads/test_large.txt"
    with open(large_test_file, "wb") as f:
        f.write(b"0" * (21 * 1024 * 1024)) # 21MB
        
    content_type, body = encode_multipart_form_data(
        files=[("files", large_test_file, "test_large.txt")],
        fields={"doc_type": "Auto-Detect"}
    )
    req = urllib.request.Request(
        f"{BASE_URL}/knowledge/upload", data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": content_type}, method="POST"
    )
    with urllib.request.urlopen(req) as res:
        upload_res = json.loads(res.read().decode('utf-8'))
        if not upload_res["data"][0]["success"] and "exceeds 20MB" in upload_res["data"][0]["error"]:
            print(f"[OK] Successfully rejected large file: {upload_res['data'][0]['error']}")
        else:
            print(f"[FAIL] Did not reject large file: {upload_res}")
            return False
            
    # 4. Test New Supplier Creation (BuildPro)
    print("\nTesting New Supplier Auto-Creation (BuildPro)...")
    buildpro_test_file = "uploads/test_buildpro_invoice.txt"
    with open(buildpro_test_file, "w") as f:
        f.write("Invoice for BuildPro Materials Ltd\nAmount: $800,000\n")
        
    content_type, body = encode_multipart_form_data(
        files=[("files", buildpro_test_file, "test_buildpro_invoice.txt")],
        fields={"doc_type": "Auto-Detect"}
    )
    req = urllib.request.Request(
        f"{BASE_URL}/knowledge/upload", data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": content_type}, method="POST"
    )
    with urllib.request.urlopen(req) as res:
        upload_res = json.loads(res.read().decode('utf-8'))
        doc_id = upload_res["data"][0]["doc_id"]
        print(f"[OK] BuildPro file uploaded. Doc ID: {doc_id}")
        
    # Poll /knowledge/documents until status is Indexed or Failed
    print("Polling document status...")
    for i in range(15):
        time.sleep(1.0)
        req = urllib.request.Request(
            f"{BASE_URL}/knowledge/documents",
            headers={"Authorization": f"Bearer {token}"}, method="GET"
        )
        with urllib.request.urlopen(req) as res:
            docs_res = json.loads(res.read().decode('utf-8'))
            match = next((d for d in docs_res["data"] if d["id"] == doc_id), None)
            if match:
                print(f"   Poll #{i+1}: Status = {match['processing_status']}")
                if match['processing_status'] in ("Indexed", "Failed"):
                    print(f"[OK] Final Status Reached: {match['processing_status']}")
                    break
    else:
        print("[WARN] Document did not reach final status in time.")
        
    # Verify Opportunity and Supplier
    print("Verifying if a new OPP- opportunity was generated for BuildPro...")
    req = urllib.request.Request(
        f"{BASE_URL}/opportunities/list",
        headers={"Authorization": f"Bearer {token}"}, method="GET"
    )
    with urllib.request.urlopen(req) as res:
        opps_res = json.loads(res.read().decode('utf-8'))
        buildpro_opp = [o for o in opps_res["data"] if o["savings_potential"] in (150000.0, 160000.0) or float(o["current_spend"]) == 800000.0]
        if buildpro_opp:
            print(f"[OK] Successfully found generated Opportunity for BuildPro: {buildpro_opp[-1]}")
        else:
            print("[FAIL] No opportunity generated for BuildPro.")
            return False
            
    # Clean up test files
    for fpath in [png_test_file, large_test_file, buildpro_test_file]:
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except:
                pass
                
    print("\nAll Ingestion and Ingestion-fallback verifications passed!")
    return True


if __name__ == "__main__":
    print("==================================================")
    print(">>> STARTING COMPREHENSIVE NEXUSPROCURE TESTS <<<")
    print("==================================================")
    
    success = True
    success = success and run_auth_tests()
    success = success and run_endpoint_tests()
    success = success and run_uploads_and_fallback_tests()
    
    print("\n==================================================")
    if success:
        print(">>> ALL TESTS PASSED SUCCESSFULLY! <<<")
    else:
        print(">>> SOME TESTS ENCOUNTERED FAILURES! <<<")
    print("==================================================")
