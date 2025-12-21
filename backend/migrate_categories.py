import sqlite3

DB_PATH = "accounting.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Add 'tipo' column
        print("Adding 'tipo' column...")
        try:
            cursor.execute("ALTER TABLE categorias ADD COLUMN tipo TEXT DEFAULT 'GASTO'")
        except sqlite3.OperationalError:
            print("Column 'tipo' might already exist.")

        # 2. Update existing categories
        print("Updating category types...")
        ingreso_categories = ['JUNTA', 'ADEUDOS', 'CUOTAS', 'INGRESOS', 'INGRESO', 'DEVOLUCIONES']
        
        # Set all to GASTO first (as default)
        cursor.execute("UPDATE categorias SET tipo = 'GASTO'")
        
        # specific updates
        placeholders = ', '.join(['?'] * len(ingreso_categories))
        query = f"UPDATE categorias SET tipo = 'INGRESO' WHERE nombre IN ({placeholders})"
        cursor.execute(query, ingreso_categories)
        
        print(f"Updated {cursor.rowcount} categories to INGRESO.")
        
        conn.commit()
        print("Migration successful.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
