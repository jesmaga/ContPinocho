import pandas as pd
import hashlib
import io
from datetime import datetime, date
from sqlalchemy.orm import Session
from models import Transaction, CategorizationRule, Category

def generate_hash(fecha, concepto, importe):
    """
    Generates a unique hash based on Date + Concept + Amount.
    """
    raw_str = f"{fecha}{concepto}{importe}"
    return hashlib.md5(raw_str.encode("utf-8")).hexdigest()

def get_category_type_map(db: Session):
    categories = db.query(Category).all()
    return {c.nombre: c.tipo for c in categories}

def calculate_school_year(date_obj):
    """
    Calculates the academic year (September to August).
    If date is >= Sept 1, it belongs to Year-Year+1.
    Else, it belongs to Year-1-Year.
    """
    year = date_obj.year
    month = date_obj.month
    if month >= 9:
        return f"{year}-{year+1}"
    else:
        return f"{year-1}-{year}"

def categorize_concept(concept_original, rules):
    """
    Analyzes the concept string and assigns a category based on dynamic rules.
    rules: List of CategorizationRule objects or similar objects with .palabra_clave and .categoria_asignada
    """
    if not isinstance(concept_original, str):
        return "OTROS"
    
    concept_upper = concept_original.upper()
    
    # Sort rules by length of keyword descending to match longest first
    # Optimization: Sort should be done once before calling this in a loop, but for safety we do it here 
    # or assume caller provides sorted list. 
    # Let's sort here for robustness, performance penalty is small for small rule sets.
    # Actually, allow caller to pass sorted tuples for speed.
    
    for rule in rules:
        if rule.palabra_clave.upper() in concept_upper:
            return rule.categoria_asignada
            
    return "OTROS"



def process_file(file_contents: bytes, filename: str, db: Session):
    """
    Reads an Excel or CSV file, processes rows, and saves new transactions to DB.
    """
    # Fetch rules once
    db_rules = db.query(CategorizationRule).all()
    # Sort by Priority DESC, then Length DESC (as secondary metric for specificity)
    sorted_rules = sorted(db_rules, key=lambda r: (r.prioridad, len(r.palabra_clave)), reverse=True)

    raw_dfs = []
    if filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.BytesIO(file_contents))
            raw_dfs.append(df)
        except Exception as e:
            raise ValueError(f"Error reading CSV: {e}")
    else:
        try:
            # sheet_name=None reads all sheets as a dict {sheet_name: df}
            xls_data = pd.read_excel(io.BytesIO(file_contents), sheet_name=None)
            for sheet_name, sheet_df in xls_data.items():
                if not sheet_df.empty:
                    # Optional: Add sheet_name logic if needed, for now just append
                    raw_dfs.append(sheet_df)
        except Exception as e:
            raise ValueError(f"Error reading Excel: {e}")

    if not raw_dfs:
         raise ValueError("File is empty or no valid sheets found.")

    processed_count = 0
    skipped_count = 0

    # DEBUG LOGGING SETUP
    debug_file = open("import_debug_log.txt", "w", encoding="utf-8")
    def log_debug(msg):
        try:
            debug_file.write(f"{datetime.now()}: {msg}\n")
        except:
            pass

    log_debug(f"Starting process for file: {filename}")

    # Process each dataframe
    for df in raw_dfs:
        log_debug(f"Processing sheet with columns: {list(df.columns)}")
        
        # Normalize columns
        df.columns = df.columns.astype(str).str.lower()
        
        col_map = {}
        for col in df.columns:
            if "fecha" in col or "date" in col:
                col_map["fecha"] = col
            elif "concepto" in col or "concept" in col or "descripcion" in col:
                col_map["concepto"] = col
            elif "importe" in col or "amount" in col or "cantidad" in col:
                col_map["importe"] = col
                
                
        # If a sheet doesn't have the columns, skip it (it might be a summary sheet)
        if not all(k in col_map for k in ["fecha", "concepto", "importe"]):
            log_debug(f"Skipping sheet/df due to missing columns. Found: {col_map}")
            continue 
            
        # STRICT COLUMN FILTERING: Keep only essential columns
        # This prevents "extra" columns from causing issues
        df = df[[col_map["fecha"], col_map["concepto"], col_map["importe"]]] 

        # FORCE ABSOLUTE VALUES FOR AMOUNT
        try:
             df[col_map["importe"]] = pd.to_numeric(df[col_map["importe"]], errors='coerce').abs()
        except Exception:
             pass # Will be handled in row loop

        for i, row in df.iterrows():
            raw_date = row[col_map["fecha"]]
            concept = str(row[col_map["concepto"]])
            
            # Amount Parsing
            try:
                amount = float(row[col_map["importe"]])
            except ValueError:
                 log_debug(f"Row {i}: Invalid Amount '{row[col_map['importe']]}'")
                 continue 
            
            # Basic NaN check
            if pd.isna(raw_date) or pd.isna(amount):
                log_debug(f"Row {i}: NaN found (Date: {raw_date}, Amount: {amount})")
                continue

            try:
                # Robust Date Parsing Strategy
                # 1. Try dayfirst=True (European)
                dt_obj = pd.to_datetime(raw_date, dayfirst=True, errors='coerce')
                
                # 2. Try format='mixed' if failed
                if pd.isna(dt_obj):
                    dt_obj = pd.to_datetime(raw_date, start_day_first=True, format='mixed', errors='coerce')
                    
                # 3. Last resort: Standard parsing (ISO/US)
                if pd.isna(dt_obj):
                    dt_obj = pd.to_datetime(raw_date, errors='coerce')
                         
                if pd.isna(dt_obj):
                     skipped_count += 1
                     log_debug(f"Row {i}: Date Parsing Failed completely for '{raw_date}'")
                     continue
                
                parsed_date = dt_obj.date()
                if not isinstance(parsed_date, date):
                     skipped_count += 1
                     log_debug(f"Row {i}: Parsed date is not a date object '{parsed_date}'")
                     continue
                     
            except Exception as e:
                skipped_count += 1
                log_debug(f"Row {i}: Exception during Date Parsing '{raw_date}' -> {e}")
                continue

            unique_hash = generate_hash(parsed_date, concept, amount)

            if db.query(Transaction).filter(Transaction.hash_unico == unique_hash).first():
                skipped_count += 1
                log_debug(f"Row {i}: Duplicate Hash found")
                continue

            # Logic with dynamic rules
            category = categorize_concept(concept, sorted_rules)
            
            # Dynamic Type Determination
            cat_map = get_category_type_map(db)
            trans_type = cat_map.get(category, "GASTO")
            
            school_year = calculate_school_year(parsed_date)

            new_trans = Transaction(
                fecha=parsed_date,
                concepto_original=concept,
                importe=amount,
                categoria=category,
                tipo=trans_type,
                curso_escolar=school_year,
                hash_unico=unique_hash
            )
            db.add(new_trans)
            processed_count += 1

    db.commit()
    debug_file.close()
    return {"processed": processed_count, "skipped": skipped_count}

def reapply_rules(db: Session):
    """
    Recategorizes all existing transactions based on current rules.
    """
    transactions = db.query(Transaction).all()
    # Fetch rules once
    db_rules = db.query(CategorizationRule).all()
    # Sort by Priority DESC, then Length DESC
    # Sort by Priority DESC, then Length DESC
    sorted_rules = sorted(db_rules, key=lambda r: (r.prioridad, len(r.palabra_clave)), reverse=True)
    cat_map = get_category_type_map(db)
    
    count = 0
    for t in transactions:
        # LOCKING LOGIC: Skip if locked
        if t.is_locked:
            continue

        new_category = categorize_concept(t.concepto_original, sorted_rules)
        new_type = cat_map.get(new_category, "GASTO")
        
        # Only update if changed
        if t.categoria != new_category or t.tipo != new_type:
            t.categoria = new_category
            t.tipo = new_type
            count += 1
            
    db.commit()
    return count       
def remove_duplicates(db: Session):
    """
    Finds transactions with duplicate hash_unico and keeps only the one with the lowest ID.
    Returns the number of deleted transactions.
    """
    from sqlalchemy import func
    
    # query to find duplicates
    duplicates = db.query(Transaction.hash_unico, func.count(Transaction.id))\
        .group_by(Transaction.hash_unico)\
        .having(func.count(Transaction.id) > 1)\
        .all()
        
    deleted_count = 0
    
    for hash_val, count in duplicates:
        # Get all transactions with this hash
        txs = db.query(Transaction).filter(Transaction.hash_unico == hash_val).order_by(Transaction.id).all()
        
        # Keep the first one (lowest ID), delete the rest
        # txs[0] is kept
        for tx in txs[1:]:
            db.delete(tx)
            deleted_count += 1
            
    db.commit()
    return deleted_count
