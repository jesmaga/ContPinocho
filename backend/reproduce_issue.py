import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def run():
    # 1. Login
    print("--- 1. Login ---")
    resp = requests.post(f"{BASE_URL}/token", data={"username": "admin", "password": "admin"})
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login success.")

    # 2. Backup
    print("\n--- 2. Download Backup ---")
    resp = requests.get(f"{BASE_URL}/backup/full", headers=headers)
    if resp.status_code != 200:
        print("Backup failed:", resp.text)
        return
    
    backup_data = resp.json()
    print(f"Backup size: {len(json.dumps(backup_data))} bytes")
    
    # Save to file to simulate real file upload
    with open("temp_test_backup.json", "w") as f:
        json.dump(backup_data, f)

    # 3. Restore
    print("\n--- 3. Restore Backup ---")
    files = {'file': ('temp_test_backup.json', open("temp_test_backup.json", 'rb'), 'application/json')}
    data = {'mode': 'merge'}
    
    resp = requests.post(f"{BASE_URL}/backup/restore", headers=headers, files=files, data=data)
    print(f"Restore Status: {resp.status_code}")
    print("Response:", resp.text)

if __name__ == "__main__":
    run()
