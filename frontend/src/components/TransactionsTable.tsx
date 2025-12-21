import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Edit2, Check, Trash2, Calculator } from 'lucide-react';
import axios from 'axios';
import type { Transaction, Category } from '../types';
import { DataTable } from './common/DataTable';

interface TransactionsTableProps {
    transactions: Transaction[];
    categories: Category[];
    onUpdate: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, categories, onUpdate }) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempCategory, setTempCategory] = useState<string>('');
    const [tempConcept, setTempConcept] = useState<string>(''); // New State
    const [filters, setFilters] = useState({ category: 'ALL', concept: '' });

    // FILTER LOGIC

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesCategory = filters.category === 'ALL' || t.categoria === filters.category;
            const matchesConcept = t.concepto_original.toLowerCase().includes(filters.concept.toLowerCase());
            return matchesCategory && matchesConcept;
        });
    }, [transactions, filters]);

    // 2. Visible Total Logic including sign
    // Logic: Sum filtered transactions. If t.tipo == INGRESO add, else subtract?
    // Wait, 'Importe' is usually absolute in the file but signed in DB? 
    // In `models.py` or logic, usually Importe is positive float. and Tipo determines sign.
    // Let's look at `Dashboard.tsx`: total_ingresos = sum(t.importe if INGRESO), total_gastos = sum(t.importe if GASTO). Balance = Ing - Gastos.
    // So Importe is likely always positive.
    const visibleTotal = useMemo(() => {
        let total = 0;
        filteredTransactions.forEach(t => {
            if (t.tipo === 'INGRESO') {
                total += t.importe;
            } else {
                total -= t.importe; // Typically GASTO, subtract
            }
        });
        return total;
    }, [filteredTransactions]);

    const handleEditClick = (t: Transaction) => {
        setEditingId(t.id);
        setTempCategory(t.categoria);
        setTempConcept(t.concepto_original); // Init concept
    };

    const handleSave = async (id: number) => {
        try {
            // FIX: Using 'categoria' instead of 'category' to match Pydantic schema
            // Added 'concepto' to payload
            await axios.put(`/transactions/${id}`, {
                categoria: tempCategory,
                concepto: tempConcept
            });
            setEditingId(null);
            onUpdate();
        } catch (error) {
            console.error("Error updating transaction", error);
            alert("Error al actualizar la categoría.");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("¿Seguro que quieres eliminar esta transacción?")) {
            try {
                await axios.delete(`/transactions/${id}`);
                onUpdate();
            } catch (error) {
                console.error("Error deleting transaction", error);
            }
        }
    };

    // Columns Configuration
    const columns = [
        {
            header: 'Fecha',
            accessorKey: 'fecha' as keyof Transaction,
            cell: (t: Transaction) => format(new Date(t.fecha), 'dd/MM/yyyy'),
            sortable: true
        },
        {
            header: 'Concepto',
            accessorKey: 'concepto_original' as keyof Transaction,
            sortable: true,
            className: 'w-1/3',
            cell: (t: Transaction) => (
                editingId === t.id ? (
                    <input
                        type="text"
                        value={tempConcept}
                        onChange={(e) => setTempConcept(e.target.value)}
                        className="bg-[#121212] border border-indigo-500 rounded px-2 py-1 text-sm outline-none text-slate-200 w-full"
                    />
                ) : (
                    <div
                        className="max-w-xs truncate"
                        title={t.concepto_original}
                    >
                        {t.concepto_original}
                    </div>
                )
            )
        },
        {
            header: 'Importe',
            accessorKey: 'importe' as keyof Transaction,
            sortable: true,
            cell: (t: Transaction) => (
                <div className="flex items-center">
                    <span className={`font-medium ${t.tipo === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Math.abs(t.importe))}
                    </span>
                    {t.is_locked && (
                        <span title="Editado manualmente (Protegido)" className="ml-2 text-amber-500">
                            <Edit2 size={12} fill="currentColor" />
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Categoría',
            accessorKey: 'categoria' as keyof Transaction,
            sortable: true,
            cell: (t: Transaction) => (
                editingId === t.id ? (
                    <select
                        value={tempCategory}
                        onChange={(e) => setTempCategory(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded px-2 py-1 text-slate-200 text-sm"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                    </select>
                ) : (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(t.category_details?.tipo || 'GASTO') === 'INGRESO'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {t.category_details?.nombre || t.categoria || 'Sin Categoría'}
                    </span>
                )
            )
        },
        {
            header: 'Acciones',
            cell: (t: Transaction) => (
                <div className="flex items-center space-x-3">
                    {editingId === t.id ? (
                        <button
                            onClick={() => handleSave(t.id)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleEditClick(t)}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Eliminar transacción"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-4">
            {/* Filters & Counters Header */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[#1E1E1E] p-4 rounded-xl border border-[#333]">

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <input
                        type="text"
                        placeholder="Filtrar por concepto..."
                        value={filters.concept}
                        onChange={(e) => setFilters(prev => ({ ...prev, concept: e.target.value }))}
                        className="px-4 py-2 bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                    />

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="bg-[#121212] border border-[#333] rounded px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    >
                        <option value="ALL">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Visible Total Counter */}
                <div className="flex items-center gap-4 bg-[#121212] px-4 py-2 rounded-lg border border-[#333] w-full xl:w-auto justify-between xl:justify-start">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calculator className="w-4 h-4" />
                        <span>Total Visible:</span>
                    </div>
                    <span className={`text-lg font-bold ${visibleTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(visibleTotal)}
                    </span>
                </div>
            </div>

            {/* DataTable */}
            <DataTable
                data={filteredTransactions}
                columns={columns}
                hideSearch={true} // We use our own filter input above
                defaultPageSize={10}
            />
        </div>
    );
};
