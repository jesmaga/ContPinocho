from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from sqlalchemy.orm import relationship, foreign
from database import Base

class Transaction(Base):
    __tablename__ = "transacciones"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, index=True)
    concepto_original = Column(String, index=True)
    importe = Column(Float)
    categoria = Column(String, index=True)
    tipo = Column(String)  # "INGRESO" or "GASTO"
    curso_escolar = Column(String)
    hash_unico = Column(String, index=True)

    is_locked = Column(Boolean, default=False)

    # Dynamic relationship based on the 'categoria' string (Category.nombre)
    category_details = relationship(
        "Category",
        primaryjoin="foreign(Transaction.categoria) == Category.nombre",
        uselist=False,
        viewonly=True
    )

class CategorizationRule(Base):
    __tablename__ = "reglas_categorizacion"

    id = Column(Integer, primary_key=True, index=True)
    palabra_clave = Column(String, unique=True, index=True)
    categoria_asignada = Column(String)
    prioridad = Column(Integer, default=1)

class Category(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)
    tipo = Column(String, default="GASTO")

class SystemMetadata(Base):
    __tablename__ = "system_metadata"

    key = Column(String, primary_key=True, index=True)
    value = Column(String)
