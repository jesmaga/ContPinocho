import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Edit2, X, Check } from 'lucide-react';
import type { CategorizationRule, Category } from '../types';

export const AdminRules: React.FC = () => {
    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // New Rule State
    const [newKeyword, setNewKeyword] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newPriority, setNewPriority] = useState(1);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editKeyword, setEditKeyword] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editPriority, setEditPriority] = useState(1);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rulesRes, catsRes] = await Promise.all([
                axios.get('/rules', { params: { skip: (page - 1) * limit, limit } }),
                axios.get('/categories') // Cats are small list, maybe notpaginated yet or separate component
            ]);

            // Handle Paginated Response
            if (rulesRes.data.items) {
                setRules(rulesRes.data.items);
                setTotal(rulesRes.data.total);
            } else {
                // Fallback
                setRules(rulesRes.data);
            }

            setCategories(catsRes.data);
            if (catsRes.data.length > 0 && !newCategory) {
                setNewCategory(catsRes.data[0].nombre);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newKeyword.trim() || !newCategory) return;
        try {
            await axios.post('/rules', {
                palabra_clave: newKeyword,
                categoria_asignada: newCategory,
                prioridad: newPriority
            });
            setNewKeyword('');
            setNewPriority(1);
            fetchData();
        } catch (error) {
            alert("Error creando regla (posiblemente ya existe)");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar regla?")) return;
        try {
            await axios.delete(`/rules/${id}`);
            fetchData();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const startEdit = (rule: CategorizationRule) => {
        setEditingId(rule.id);
        setEditKeyword(rule.palabra_clave);
        setEditCategory(rule.categoria_asignada);
        setEditPriority(rule.prioridad);
    };

    const handleUpdate = async () => {
        if (!editingId || !editKeyword.trim()) return;
        try {
            await axios.put(`/rules/${editingId}`, {
                palabra_clave: editKeyword,
                categoria_asignada: editCategory,
                prioridad: editPriority
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            alert("Error actualizando regla");
        }
    };

    const handleRecategorize = async () => {
        if (!confirm("¿Re-aplicar todas las reglas a las transacciones existentes? Esto puede tardar unos segundos.")) return;
        setLoading(true);
        try {
            const res = await axios.post('/recategorize');
            alert(`Proceso completado. ${res.data.updated_count} transacciones actualizadas.`);
        } catch (error) {
            console.error(error);
            alert("Error al re-categorizar.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page]); // Re-fetch on page change

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 space-y-8 text-slate-200">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Administración de Reglas</h1>
                    <p className="text-slate-400">Automatiza la categorización de tus movimientos</p>
                </div>
                <button
                    onClick={handleRecategorize}
                    className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/50 px-4 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors text-sm font-medium"
                >
                    Ejecutar Reglas en Todo
                </button>
            </header>

            {/* Create Form */}
            <div className="bg-[#1E1E1E] p-4 rounded-xl border border-[#333] flex items-end gap-4 flex-wrap">
                <div className="flex-[2] min-w-[200px]">
                    <label className="block text-xs text-slate-500 mb-1">Contiene la palabra...</label>
                    <input
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                        placeholder="Ej: MERCADONA"
                    />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs text-slate-500 mb-1">Asignar Categoría</label>
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="w-24">
                    <label className="block text-xs text-slate-500 mb-1">Prioridad</label>
                    <input
                        type="number"
                        value={newPriority}
                        onChange={e => setNewPriority(parseInt(e.target.value))}
                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                        min="1"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    <span>Añadir</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#333] overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#252525] text-slate-400 border-b border-[#333]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Palabra Clave (Contiene)</th>
                                <th className="px-6 py-4 font-medium">Categoría Asignada</th>
                                <th className="px-6 py-4 font-medium">Prioridad</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-[#252525] transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200">
                                        {editingId === rule.id ? (
                                            <input
                                                value={editKeyword}
                                                onChange={e => setEditKeyword(e.target.value)}
                                                className="bg-[#121212] border border-[#333] rounded px-2 py-1 w-full"
                                            />
                                        ) : rule.palabra_clave}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === rule.id ? (
                                            <select
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value)}
                                                className="bg-[#121212] border border-[#333] rounded px-2 py-1 w-full"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">
                                                {rule.categoria_asignada}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {editingId === rule.id ? (
                                            <input
                                                type="number"
                                                value={editPriority}
                                                onChange={e => setEditPriority(parseInt(e.target.value))}
                                                className="bg-[#121212] border border-[#333] rounded px-2 py-1 w-20"
                                            />
                                        ) : rule.prioridad}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {editingId === rule.id ? (
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
                                                <button onClick={() => startEdit(rule)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded">
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
                {rules.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">No hay reglas definidas.</div>
                )}

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-[#333]">
                    <div className="text-sm text-slate-500">
                        Mostrando {rules.length} de {total} reglas
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
