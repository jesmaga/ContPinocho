from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models, schemas, logic, reports
import io
from fastapi.responses import StreamingResponse
from datetime import date
from database import engine, get_db
import os
import sys
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

models.Base.metadata.create_all(bind=engine)

# ... (Top of file)
import sys
from contextlib import asynccontextmanager

# --- INITIAL DATA ---
INITIAL_CATEGORIES = [
    ("NOMINA", "INGRESO"),
    ("RENTAS", "INGRESO"), 
    ("INTERESES", "INGRESO"),
    ("HIPOTECA", "GASTO"),
    ("LUZ", "GASTO"),
    ("AGUA", "GASTO"),
    ("COMUNIDAD", "GASTO"),
    ("SEGURO", "GASTO"),
    ("ALIMENTACION", "GASTO"),
    ("GASOLINERA", "GASTO"),
    ("TALLER", "GASTO"),
    ("FARMACIA", "GASTO"),
    ("RESTAURANTES", "GASTO"),
    ("OCIO", "GASTO"),
    ("ROPA", "GASTO"),
    ("MATERIAL ESCOLAR", "GASTO"),
    ("COMEDOR", "GASTO"),
    ("EXTRAESCOLARES", "GASTO"),
    ("REGALOS", "GASTO"),
    ("VACACIONES", "GASTO"),
    ("OTROS", "GASTO")
]

INITIAL_RULES = [
    ("NOMINA", "NOMINA", 10),
    ("SALARIO", "NOMINA", 10),
    ("MERCADONA", "ALIMENTACION", 5),
    ("CARREFOUR", "ALIMENTACION", 5),
    ("LIDL", "ALIMENTACION", 5),
    ("REPSOL", "GASOLINERA", 5),
    ("CEPSA", "GASOLINERA", 5),
    ("BP", "GASOLINERA", 5),
    ("AMAZON", "OTROS", 1)
]

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed Data
    db = next(get_db())
    
    # Seed Categories
    if not db.query(models.Category).first():
        print("Seeding initial categories...")
        for cat_name, cat_type in INITIAL_CATEGORIES:
            try:
                db.add(models.Category(nombre=cat_name, tipo=cat_type))
            except Exception:
                pass 
        db.commit()

    # Check if rules exist
    if not db.query(models.CategorizationRule).first():
        print("Seeding initial rules...")
        for keyword, category, priority in INITIAL_RULES:
            rule = models.CategorizationRule(
                palabra_clave=keyword, 
                categoria_asignada=category,
                prioridad=priority
            )
            db.add(rule)
        db.commit()
        db.commit()
        print("Seeding complete.")
        
    # MIGRATION: Check for is_locked column
    try:
        # This is a SQLite specific check
        from sqlalchemy import text
        result = db.execute(text("PRAGMA table_info(transacciones)"))
        columns = [row[1] for row in result]
        if columns and 'is_locked' not in columns:
            print("Migrating: Adding is_locked column...")
            db.execute(text("ALTER TABLE transacciones ADD COLUMN is_locked BOOLEAN DEFAULT 0"))
            db.commit()
    except Exception as e:
        print(f"Migration check failed: {e}")

    
    yield
    # Shutdown logic (if any)

app = FastAPI(title="Accounting App API", lifespan=lifespan)

# ... (Existing middleware and routes)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, cambia "*" por la URL de tu frontend en Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (Static files moved to end of file)

# (Previous Main Block Removed)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        result = logic.process_file(content, file.filename, db)
        
        # Update Last Update Timestamp
        from datetime import datetime
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        meta = db.query(models.SystemMetadata).filter(models.SystemMetadata.key == "last_import").first()
        if not meta:
            meta = models.SystemMetadata(key="last_import", value=now_str)
            db.add(meta)
        else:
            meta.value = now_str
        db.commit()

        return {
            "message": "File processed successfully",
            "processed": result["processed"],
            "skipped": result["skipped"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/last-update", response_model=schemas.SystemMetadata)
def get_last_update(db: Session = Depends(get_db)):
    meta = db.query(models.SystemMetadata).filter(models.SystemMetadata.key == "last_import").first()
    if not meta:
        return {"key": "last_import", "value": "Nunca"}
    return meta

@app.get("/transactions", response_model=List[schemas.Transaction])
def get_transactions(
    start_date: Optional[str] = None, # YYYY-MM-DD
    end_date: Optional[str] = None,   # YYYY-MM-DD
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)
    
    if start_date:
        query = query.filter(models.Transaction.fecha >= start_date)
    if end_date:
        query = query.filter(models.Transaction.fecha <= end_date)
        
    if category:
        query = query.filter(models.Transaction.categoria == category)
        
    return query.options(joinedload(models.Transaction.category_details)).order_by(models.Transaction.fecha.desc()).all()

@app.put("/transactions/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int, 
    update_data: schemas.TransactionUpdateCategory, 
    db: Session = Depends(get_db)
):
    db_trans = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_trans:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    
    # 1. Update Concept if provided
    current_concept = db_trans.concepto_original
    if update_data.concepto and update_data.concepto != db_trans.concepto_original:
        db_trans.concepto_original = update_data.concepto
        current_concept = update_data.concepto
        
        # TRIGGER AUTO-RECATEGORIZATION
        # If concept changed, check if it matches any existing rule to AUTO-ASSIGN category
        db_rules = db.query(models.CategorizationRule).all()
        sorted_rules = sorted(db_rules, key=lambda r: (r.prioridad, len(r.palabra_clave)), reverse=True)
        
        suggested_category = logic.categorize_concept(current_concept, sorted_rules)
        
        # If the categorizer found a match (not OTROS), we override the user's manual category
        # UNLESS the user explicitly sent a category different from the old one in this same request.
        # But typically if user edits concept, they might expect auto-update.
        # Let's prioritize the specific rule match if new concept triggers it.
        
        if suggested_category != "OTROS":
            update_data.categoria = suggested_category # Override payload for next step
            
    # 2. Update Category and Type
    db_trans.categoria = update_data.categoria
    
    # LOCKING LOGIC: Mark as locked
    db_trans.is_locked = True
    
    if update_data.tipo:
        db_trans.tipo = update_data.tipo
    else:
        # Fetch type from Category table
        category_obj = db.query(models.Category).filter(models.Category.nombre == update_data.categoria).first()
        db_trans.tipo = category_obj.tipo if category_obj else "GASTO"
        
    db.commit()
    db.refresh(db_trans)
    return db_trans

@app.post("/transactions", response_model=schemas.Transaction)
def create_manual_transaction(trans: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # Calculate School Year and Hash
    school_year = logic.calculate_school_year(trans.fecha)
    unique_hash = logic.generate_hash(trans.fecha, trans.concepto, trans.importe)
    
    # Check duplicate (Optional, but good practice. For manual, maybe we allow?)
    # Let's allow manual duplicates if user insists, but generally logic.generate_hash handles it.
    
    new_trans = models.Transaction(
        fecha=trans.fecha,
        concepto_original=trans.concepto,
        importe=trans.importe,
        categoria=trans.categoria,
        tipo=trans.tipo,
        curso_escolar=school_year,
        hash_unico=unique_hash,
        is_locked=True # ALWAYS TRUE for manual creation
    )
    
    try:
        db.add(new_trans)
        db.commit()
        db.refresh(new_trans)
        return new_trans
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    db_trans = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_trans:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    db.delete(db_trans)
    db.commit()
    return {"message": "Movimiento eliminado"}

@app.post("/transactions/remove-duplicates")
def remove_duplicate_transactions(db: Session = Depends(get_db)):
    try:
        count = logic.remove_duplicates(db)
        return {"message": "Duplicate removal complete", "deleted_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dashboard/kpis")
def get_dashboard_kpis(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)
    if start_date:
        query = query.filter(models.Transaction.fecha >= start_date)
    if end_date:
        query = query.filter(models.Transaction.fecha <= end_date)
        
    transactions = query.all()
    
    # STRICT LOGIC:
    # Ingresos = Sum of amounts where Type == "INGRESO"
    # Gastos = Sum of ABS(amount) where Type == "GASTO"
    # Balance = Ingresos - Gastos
    
    total_ingresos = sum(t.importe for t in transactions if t.tipo == "INGRESO")
    total_gastos = sum(abs(t.importe) for t in transactions if t.tipo == "GASTO")
    balance = total_ingresos - total_gastos
    
    cat_expenses = {}
    for t in transactions:
        if t.tipo == "GASTO":
            cat_expenses[t.categoria] = cat_expenses.get(t.categoria, 0) + abs(t.importe)
            
    return {
        "kpis": {
            "ingresos": total_ingresos,
            "gastos": total_gastos,
            "balance": balance
        },
        "chart_data": cat_expenses
    }

from fastapi.encoders import jsonable_encoder

@app.get("/dashboard/monthly-stats")
def get_monthly_stats(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Transaction)
    if start_date:
        query = query.filter(models.Transaction.fecha >= start_date)
    if end_date:
        query = query.filter(models.Transaction.fecha <= end_date)
    if category and category != "ALL":
        query = query.filter(models.Transaction.categoria == category)
        
    transactions = query.all()
    
    # Structure: {'YYYY-MM': {'ingreso': 0, 'gasto': 0}}
    monthly_data = {}
    
    for t in transactions:
        # t.fecha is a date object
        key = t.fecha.strftime("%Y-%m")
        if key not in monthly_data:
            monthly_data[key] = {"ingreso": 0, "gasto": 0}
            
        if t.tipo == "INGRESO":
            monthly_data[key]["ingreso"] += t.importe
        elif t.tipo == "GASTO":
            # Store expenses as POSITIVE magnitude for visualization
            monthly_data[key]["gasto"] += abs(t.importe)
            
    return monthly_data

# --- RULES CRUD ---

@app.get("/rules", response_model=List[schemas.Rule])
def get_rules(db: Session = Depends(get_db)):
    return db.query(models.CategorizationRule).order_by(models.CategorizationRule.prioridad.desc()).all()

@app.post("/rules", response_model=schemas.Rule)
def create_rule(rule: schemas.RuleCreate, db: Session = Depends(get_db)):
    db_rule = models.CategorizationRule(
        palabra_clave=rule.palabra_clave,
        categoria_asignada=rule.categoria_asignada,
        prioridad=rule.prioridad
    )
    try:
        db.add(db_rule)
        db.commit()
        db.refresh(db_rule)
        return db_rule
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Rule already exists")

@app.put("/rules/{rule_id}", response_model=schemas.Rule)
def update_rule(rule_id: int, rule_update: schemas.RuleUpdate, db: Session = Depends(get_db)):
    db_rule = db.query(models.CategorizationRule).filter(models.CategorizationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    if rule_update.palabra_clave:
        db_rule.palabra_clave = rule_update.palabra_clave
    if rule_update.categoria_asignada:
        db_rule.categoria_asignada = rule_update.categoria_asignada
    if rule_update.prioridad is not None:
        db_rule.prioridad = rule_update.prioridad
        
    try:
        db.commit()
        db.refresh(db_rule)
        return db_rule
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error updating rule")

@app.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    db_rule = db.query(models.CategorizationRule).filter(models.CategorizationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    db.delete(db_rule)
    db.commit()
    return {"detail": "Rule deleted"}

@app.post("/recategorize")
def recategorize_all(db: Session = Depends(get_db)):
    try:
        count = logic.reapply_rules(db)
        return {"message": "Recategorization complete", "updated_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- CATEGORIES CRUD ---

@app.get("/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.nombre).all()

@app.post("/categories", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = models.Category(nombre=category.nombre, tipo=category.tipo)
    try:
        db.add(db_cat)
        db.commit()
        db.refresh(db_cat)
        return db_cat
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category already exists")

@app.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_cat)
    db.commit()
    return {"detail": "Category deleted"}

# --- EXPORTS ---

# --- BACKUP & RESTORE ---

@app.get("/backup/full")
def backup_full(db: Session = Depends(get_db)):
    try:
        transactions = db.query(models.Transaction).all()
        rules = db.query(models.CategorizationRule).all()
        categories = db.query(models.Category).all()
        
        # Serialize Data using jsonable_encoder for robustness
        from fastapi.encoders import jsonable_encoder
        data = {
            "timestamp": date.today().isoformat(),
            "transactions": jsonable_encoder([schemas.Transaction.from_orm(t) for t in transactions]),
            "rules": jsonable_encoder([schemas.Rule.from_orm(r) for r in rules]),
            "categories": jsonable_encoder([schemas.Category.from_orm(c) for c in categories])
        }
        
        # Return as JSON file
        import json
        json_str = json.dumps(data, indent=4)
        filename = f"Backup_Full_{date.today()}.json"
        
        return StreamingResponse(
            io.BytesIO(json_str.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"BACKUP ERROR: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/backup/restore")
async def restore_backup(
    file: UploadFile = File(...), 
    mode: str = Form(...), # "merge" or "replace"
    db: Session = Depends(get_db)
):
    import json
    content = await file.read()
    try:
        data = json.loads(content)
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid JSON file")
         
    # Validate structure
    if "transactions" not in data or "rules" not in data or "categories" not in data:
         raise HTTPException(status_code=400, detail="Invalid Backup Format")
         
    try:
        # REPLACE MODE: Wipe DB first
        if mode == "replace":
            db.query(models.Transaction).delete()
            db.query(models.CategorizationRule).delete()
            db.query(models.Category).delete()
            db.commit()
            
        # RESTORE CATEGORIES
        existing_cats = {c.nombre for c in db.query(models.Category).all()}
        for c_data in data["categories"]:
            if c_data["nombre"] not in existing_cats:
                new_c = models.Category(
                    nombre=c_data["nombre"],
                    tipo=c_data.get("tipo", "GASTO")
                )
                db.add(new_c)
                existing_cats.add(c_data["nombre"])
        db.commit()
        
        # RESTORE RULES
        existing_rules_keys = {r.palabra_clave for r in db.query(models.CategorizationRule).all()}
        for r_data in data["rules"]:
            if r_data["palabra_clave"] not in existing_rules_keys:
                new_r = models.CategorizationRule(
                    palabra_clave=r_data["palabra_clave"],
                    categoria_asignada=r_data["categoria_asignada"],
                    prioridad=r_data.get("prioridad", 1)
                )
                db.add(new_r)
                existing_rules_keys.add(r_data["palabra_clave"])
        db.commit()
        
        # RESTORE TRANSACTIONS
        # Use Hash for merging
        existing_hashes = {t.hash_unico for t in db.query(models.Transaction).all()}
        
        # Pre-fetch cat types just in case type is missing in backup or logic changed
        # But usually backup contains type. We will trust backup type OR default to DB logic if missing.
        
        added_count = 0
        for t_data in data["transactions"]:
            if t_data["hash_unico"] not in existing_hashes:
                # Parse Date
                if isinstance(t_data["fecha"], str):
                     t_date = date.fromisoformat(t_data["fecha"])
                else:
                     t_date = t_data["fecha"] # unlikely from json
                     
                # Mapping old is_manually_edited to new is_locked
                locked_state = t_data.get("is_locked", t_data.get("is_manually_edited", False))
                
                new_t = models.Transaction(
                    fecha=t_date,
                    concepto_original=t_data["concepto_original"],
                    importe=t_data["importe"],
                    categoria=t_data["categoria"],
                    tipo=t_data.get("tipo", "GASTO"), # fallback
                    curso_escolar=t_data.get("curso_escolar", "General"),
                    hash_unico=t_data["hash_unico"],
                    is_locked=locked_state
                )
                db.add(new_t)
                added_count += 1
                
        db.commit()
    except Exception as e:
        print(f"RESTORE ERROR: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
        
    return {"message": "Restoration Complete", "mode": mode, "items_added": added_count}

@app.delete("/database/wipe")
def wipe_database(db: Session = Depends(get_db)):
    """
    DANGER: Deletes ALL Transactions. Keeps Categories and Rules to avoid breaking the app structure.
    """
    try:
        db.query(models.Transaction).delete()
        db.commit()
        return {"message": "All transactions deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/export/excel")
def export_excel_endpoint(start_date: date, end_date: date, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.fecha >= start_date,
        models.Transaction.fecha <= end_date
    ).all()
    
    file_stream = reports.generate_excel(transactions)
    
    filename = f"Transactions_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# ... (Existing exports)

@app.get("/export/pdf")
def export_pdf_endpoint(start_date: date, end_date: date, db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.fecha >= start_date,
        models.Transaction.fecha <= end_date
    ).all()
    
    file_stream = reports.generate_pdf(transactions, start_date, end_date)
    
    filename = f"Report_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        file_stream, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def get_static_path():
    """ Devuelve la ruta correcta de 'static' tanto en dev como en exe """
    # Si estamos ejecutando desde el ejecutable (PyInstaller)
    if getattr(sys, 'frozen', False):
        # En Mac/Linux con --onedir, los archivos están en sys._MEIPASS
        base_path = sys._MEIPASS
    else:
        # En desarrollo, están en la carpeta actual
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    static_path = os.path.join(base_path, "static")
    
    print(f"DEBUG: Buscando static en: {static_path}")
    return static_path

static_directory = get_static_path()

# Solo montamos si la carpeta existe
if os.path.exists(static_directory):
    # 1. Montar assets (imágenes, JS, CSS)
    # Importante: Montamos la subcarpeta 'assets'
    assets_dir = os.path.join(static_directory, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # 2. Servir el index.html y manejar rutas de React
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(static_directory, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Si piden un archivo específico (ej: logo.png o manifest.json)
        file_path = os.path.join(static_directory, full_path)
        if "." in full_path and os.path.exists(file_path):
            return FileResponse(file_path)
        
        # Para todo lo demás (rutas de la app), devolver index.html
        return FileResponse(os.path.join(static_directory, "index.html"))
else:
    print("WARNING: No se encontró la carpeta 'static'. La web no se cargará.")


# -------------------------------------------------------------------------
# ARRANQUE DEL SERVIDOR + APERTURA AUTOMÁTICA DEL NAVEGADOR
# -------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    import webbrowser
    import threading
    import time

    # Función para abrir el navegador después de esperar un poco
    def open_browser():
        time.sleep(1.5) # Espera 1.5 segundos a que el servidor arranque
        print("INFO: Abriendo navegador automáticamente...")
        webbrowser.open("http://127.0.0.1:8000")

    # Lanzamos el navegador en un hilo paralelo (segundo plano)
    threading.Thread(target=open_browser, daemon=True).start()

    # Arrancamos el servidor (esto bloquea el proceso, por eso lanzamos el navegador antes)
    uvicorn.run(app, host="127.0.0.1", port=8000)