from database import SessionLocal, engine
from sqlalchemy import text
import models

def check_db():
    db = SessionLocal()
    try:
        # Check Schema
        print("--- Table Info: users ---")
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row for row in result]
        for col in columns:
            print(col)
        
        has_role = any(c[1] == 'role' for c in columns)
        print(f"Has 'role' column: {has_role}")

        # Check Admin User
        print("\n--- Users ---")
        users = db.query(models.User).all()
        for u in users:
            print(f"ID: {u.id}, Username: {u.username}, Role: {getattr(u, 'role', 'N/A')}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
