from pydantic import BaseModel
from datetime import date
from typing import Optional, List

# --- Categories (Defined first to be used in Transaction) ---
class CategoryBase(BaseModel):
    nombre: str
    tipo: str = "GASTO"

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class CategoryUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[str] = None

class RuleUpdate(BaseModel):
    palabra_clave: Optional[str] = None
    categoria_asignada: Optional[str] = None
    prioridad: Optional[int] = None

class SystemMetadata(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True

# --- Rules ---
class RuleBase(BaseModel):
    palabra_clave: str
    categoria_asignada: str
    prioridad: int = 1

class RuleCreate(RuleBase):
    pass

class Rule(RuleBase):
    id: int

    class Config:
        from_attributes = True

# --- Transactions ---
class TransactionBase(BaseModel):
    fecha: date
    concepto_original: str
    importe: float
    categoria: str
    tipo: str
    hash_unico: Optional[str] = None
    is_locked: bool = False

class TransactionCreate(BaseModel):
    fecha: date
    concepto: str
    importe: float
    categoria: str
    tipo: str

class Transaction(TransactionBase):
    id: int
    category_details: Optional[Category] = None

    class Config:
        from_attributes = True

class TransactionUpdateCategory(BaseModel):
    categoria: str
    concepto: Optional[str] = None
    tipo: Optional[str] = None

from typing import TypeVar, Generic
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    role: str = "user"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True

