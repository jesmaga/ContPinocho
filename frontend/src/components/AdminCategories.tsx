import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react';
import type { Category } from '../types';

export const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'INGRESO' | 'GASTO'>('GASTO');

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<'INGRESO' | 'GASTO'>('GASTO');

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/categories', { params: { skip: (page - 1) * limit, limit } });

            // Handle Paginated Response
            if (res.data.items) {
                setCategories(res.data.items);
                setTotal(res.data.total);
            } else {
                setCategories(res.data);
            }
        } catch (error) {
            console.error("Error fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCatName.trim()) return;
        try {
            await axios.post('/categories', { nombre: newCatName, tipo: newCatType });
            setNewCatName('');
            fetchCategories();
        } catch (error) {
            alert("Error creando categoría (posiblemente ya existe)");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar categoría?")) return;
        try {
            await axios.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.nombre);
        setEditType(cat.tipo);
    };

    const handleUpdate = async () => {
        if (!editingId || !editName.trim()) return;
        try {
            await axios.put(`/categories/${editingId}`, { nombre: editName, tipo: editType });
            setEditingId(null);
            fetchCategories();
        } catch (error) {
            alert("Error actualizando categoría");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [page]); // Re-fetch on page change

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 space-y-8 text-slate-200">
            <header>
                <h1 className="text-2xl font-bold text-slate-100">Administración de Categorías</h1>
                <p className="text-slate-400">Gestiona las categorías de tus ingresos y gastos</p>
            </header>

            {/* Create Form */}
            <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#333] flex items-end gap-4">
                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                    <input
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                        placeholder="Nueva Categoría..."
                    />
                </div>
                <div className="w-40">
                    <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                    <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as any)}
                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    >
                        <option value="GASTO">GASTO</option>
                        <option value="INGRESO">INGRESO</option>
                    </select>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    <span>Crear</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#252525] text-slate-400 border-b border-[#333]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Nombre</th>
                                <th className="px-6 py-4 font-medium">Tipo</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-[#252525] transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">
                                        {editingId === cat.id ? (
                                            <input
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                className="bg-[#121212] border border-[#333] rounded px-2 py-1 w-full"
                                            />
                                        ) : cat.nombre}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === cat.id ? (
                                            <select
                                                value={editType}
                                                onChange={(e) => setEditType(e.target.value as any)}
                                                className="bg-[#121212] border border-[#333] rounded px-2 py-1"
                                            >
                                                <option value="GASTO">GASTO</option>
                                                <option value="INGRESO">INGRESO</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${cat.tipo === 'INGRESO' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                                }`}>
                                                {cat.tipo}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {editingId === cat.id ? (
                                            <>
                                                <button onClick={handleUpdate} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-700 rounded">
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(cat)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {categories.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">No hay categorías.</div>
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-[#333]">
                    <div className="text-sm text-slate-500">
                        Mostrando {categories.length} de {total} categorías
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-[#252525] rounded hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        <span className="flex items-center px-2 text-sm text-slate-400">
                            Página {page} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 bg-[#252525] rounded hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
