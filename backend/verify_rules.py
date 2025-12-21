import pandas as pd
import io
import os
import sys

sys.path.append(os.getcwd())

from database import SessionLocal, engine, Base
import models
import logic
from main import startup_event

# Reset DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def create_excel():
    data = [
        {"Fecha": "2023-01-01", "Concepto": "Recibo Iberdrola", "Importe": 50.0}, # Should match "Iberdrola" -> LUZ
        {"Fecha": "2023-01-02", "Concepto": "Pago Custom", "Importe": 100.0}, # Should match custom rule
    ]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    return output.getvalue()

def verify():
    # 1. Seed
    print("Seeding DB...")
    startup_event()
    
    db = SessionLocal()
    
    # Check Seed matches
    rule = db.query(models.CategorizationRule).filter(models.CategorizationRule.palabra_clave == "Iberdrola").first()
    assert rule is not None, "Seeding failed for Iberdrola"
    assert rule.categoria_asignada == "LUZ"
    
    # 2. Add Custom Rule
    print("Adding custom rule...")
    custom_rule = models.CategorizationRule(palabra_clave="Custom", categoria_asignada="TEST_CAT")
    db.add(custom_rule)
    db.commit()
    
    # 3. Process File
    print("Processing file...")
    content = create_excel()
    stats = logic.process_file(content, "rules_test.xlsx", db)
    
    # 4. Verify Transactions
    t_iber = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%Iberdrola%")).first()
    assert t_iber.categoria == "LUZ", f"Expected LUZ for Iberdrola, got {t_iber.categoria}"
    # Verify School Year: 2023-01-01 is in 2022-2023
    assert t_iber.curso_escolar == "2022-2023", f"Expected 2022-2023 for Jan 2023, got {t_iber.curso_escolar}"
    
    t_custom = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%Custom%")).first()
    assert t_custom.categoria == "TEST_CAT", f"Expected TEST_CAT for Custom, got {t_custom.categoria}"
    
    print("Dynamic Rules & School Year Verification Passed!")

if __name__ == "__main__":
    verify()
