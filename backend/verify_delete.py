import requests
import sys

BASE_URL = "http://localhost:8000"

def verify_delete():
    # 1. Create a dummy file or just use existing data?
    # Better: Ensure there is at least one transaction, pick its ID, delete it.
    
    print("Fetching transactions...")
    try:
        res = requests.get(f"{BASE_URL}/transactions")
        transactions = res.json()
    except Exception as e:
        print(f"Error connecting to API: {e}")
        sys.exit(1)
        
    if not transactions:
        print("No transactions found. Cannot verify delete.")
        # Try to upload one? Or just warn.
        # This assumes the previous verify_rules script left some data.
        return

    target = transactions[0]
    target_id = target['id']
    print(f"Targeting transaction ID {target_id} for deletion.")
    
    # 2. Delete it
    res = requests.delete(f"{BASE_URL}/transactions/{target_id}")
    if res.status_code != 200:
        print(f"Delete failed: {res.text}")
        sys.exit(1)
        
    print("Delete request successful.")
    
    # 3. Verify it's gone
    res = requests.get(f"{BASE_URL}/transactions")
    new_transactions = res.json()
    ids = [t['id'] for t in new_transactions]
    
    if target_id in ids:
        print(f"Error: Transaction {target_id} still exists!")
        sys.exit(1)
        
    print(f"Success: Transaction {target_id} was deleted.")

if __name__ == "__main__":
    verify_delete()
