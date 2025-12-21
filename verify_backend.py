import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

import pandas as pd
import io
from backend.database import SessionLocal, engine, Base
from backend import models, logic
from sqlalchemy.orm import Session

# Setup clean DB
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def create_dummy_excel():
    data = [
        {"Fecha": "2023-01-01", "Concepto": "Pago LUZ Endesa", "Importe": 50.0}, # LUZ -> GASTO
        {"Fecha": "2023-01-02", "Concepto": "Ingreso NOMINA", "Importe": 2000.0}, # NOMINA -> GASTO (Wait, NOMINAS is category, default type GASTO? User said JUNTA, ADEUDOS, CUOTAS = INGRESO. NOMINA is not in that list, so GASTO? Usually Payroll is income but per rules "Para cualquier otra categoría -> Asigna el Tipo como GASTO". The user rules are strict: only JUNTA, ADEUDOS, CUOTAS are INGRESO. Maybe "NOMINAS" implies paying employees? If it's a business accounting app, paying payroll is expense. Correct.)
        {"Fecha": "2023-01-03", "Concepto": "Cuota Comunidad", "Importe": 100.0}, # COMUNIDAD -> GASTO
        {"Fecha": "2023-01-04", "Concepto": "Ingreso JUNTA Andalucia", "Importe": 500.0}, # JUNTA -> INGRESO
        {"Fecha": "2023-01-05", "Concepto": "Compra Papeleria", "Importe": 20.0}, # Unknown -> OTROS -> GASTO
        {"Fecha": "2023-01-01", "Concepto": "Pago LUZ Endesa", "Importe": 50.0}, # Duplicate of row 1
    ]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    return output.getvalue()

def verify():
    db = SessionLocal()
    content = create_dummy_excel()
    
    print("Processing file...")
    stats = logic.process_file(content, "test.xlsx", db)
    print(f"Stats: {stats}")
    
    # Assertions
    assert stats["processed"] == 5, f"Expected 5 processed, got {stats['processed']}"
    assert stats["skipped"] == 1, f"Expected 1 skipped (duplicate), got {stats['skipped']}"
    
    # Check Categories and Types
    t_luz = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%LUZ%")).first()
    assert t_luz.categoria == "LUZ", f"Expected LUZ, got {t_luz.categoria}"
    assert t_luz.tipo == "GASTO", f"Expected GASTO for LUZ, got {t_luz.tipo}"
    
    t_nomina = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%NOMINA%")).first()
    assert t_nomina.categoria == "NOMINAS", f"Expected NOMINAS, got {t_nomina.categoria}"
    
    t_junta = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%JUNTA%")).first()
    assert t_junta.categoria == "JUNTA", f"Expected JUNTA, got {t_junta.categoria}"
    assert t_junta.tipo == "INGRESO", f"Expected INGRESO for JUNTA, got {t_junta.tipo}"
    
    t_other = db.query(models.Transaction).filter(models.Transaction.concepto_original.like("%Papeleria%")).first()
    assert t_other.categoria == "OTROS", f"Expected OTROS, got {t_other.categoria}"
    
    print("All verification checks passed!")

if __name__ == "__main__":
    verify()
