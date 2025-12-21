from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import date
from logic import reapply_rules, categorize_concept
from models import Transaction, CategorizationRule, Category, Base

# Setup temporary in-memory DB for testing logic
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_reapply.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_reapply_logic():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Create a Transaction
    t1 = Transaction(
        fecha=date(2024, 1, 1),
        concepto_original="COMPRA MERCADONA 123",
        importe=50.0,
        categoria="OTROS", # Initial category
        tipo="GASTO",
        hash_unico="abc",
        curso_escolar="2023-2024"
    )
    db.add(t1)
    
    # 2. Create a Rule
    rule = CategorizationRule(
        palabra_clave="MERCADONA",
        categoria_asignada="ALIMENTACION",
        prioridad=10
    )
    db.add(rule)
    
    # 3. Create Category (just for consistency, logic uses string from rule)
    cat = Category(nombre="ALIMENTACION", tipo="GASTO")
    db.add(cat)
    
    db.commit()
    
    print(f"Before Reapply: {t1.categoria}")
    
    # 4. Run Reapply
    count = reapply_rules(db)
    
    db.refresh(t1)
    print(f"After Reapply: {t1.categoria}")
    print(f"Updated Count: {count}")
    
    assert t1.categoria == "ALIMENTACION", "Category should be updated to ALIMENTACION"
    assert count == 1, "Should count 1 update"
    
    print("SUCCESS: Logic verification passed.")
    db.close()

if __name__ == "__main__":
    test_reapply_logic()
