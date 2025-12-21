import sqlite3

def migrate():
    print("Starting migration...")
    conn = sqlite3.connect("accounting.db")
    cursor = conn.cursor()
    
    try:
        # Check if column exists to avoid errors if run multiple times
        cursor.execute("PRAGMA table_info(reglas_categorizacion)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "prioridad" not in columns:
            print("Adding 'prioridad' column...")
            cursor.execute("ALTER TABLE reglas_categorizacion ADD COLUMN prioridad INTEGER DEFAULT 1 NOT NULL")
            conn.commit()
            print("Migration successful: 'prioridad' column added.")
        else:
            print("Column 'prioridad' already exists. No changes needed.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
