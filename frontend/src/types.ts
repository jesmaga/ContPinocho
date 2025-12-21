export interface Transaction {
    id: number;
    fecha: string;
    concepto_original: string;
    importe: number;
    categoria: string;
    tipo: 'INGRESO' | 'GASTO';
    curso_escolar: string;
    hash_unico: string;
    category_details?: Category;
    is_locked?: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
}

export interface KPIData {
    ingresos: number;
    gastos: number;
    balance: number;
}

export interface Category {
    id: number;
    nombre: string;
    tipo: 'INGRESO' | 'GASTO';
}

export interface CategorizationRule {
    id: number;
    palabra_clave: string;
    categoria_asignada: string;
    prioridad: number;
}

export interface SystemMetadata {
    key: string;
    value: string;
}

export interface DashboardData {
    kpis: KPIData;
    chart_data: { [key: string]: number };
}
