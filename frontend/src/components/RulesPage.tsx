import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import type { CategorizationRule, Category } from '../types';
import { DataTable } from './common/DataTable';

export const RulesPage: React.FC = () => {
    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newPriority, setNewPriority] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // New Category State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState<'INGRESO' | 'GASTO'>('GASTO');

    useEffect(() => {
        fetchRules();
        fetchCategories();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await axios.get('/rules');
            setRules(response.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/categories');
            setCategories(response.data);
            if (response.data.length > 0 && !newCategory) {
                setNewCategory(response.data[0].nombre);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/rules', {
                palabra_clave: newKeyword,
                categoria_asignada: newCategory,
                prioridad: newPriority
            });
            setNewKeyword('');
            setNewPriority(1);
            fetchRules();
        } catch (error) {
            alert('Error al añadir regla (posible duplicado)');
        }
    };

    const handleDeleteRule = async (id: number) => {
        try {
            await axios.delete(`/rules/${id}`);
            fetchRules();
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await axios.post('/categories', {
                nombre: newCatName.toUpperCase(),
                tipo: newCatType
            });
            setNewCatName('');
            setNewCatType('GASTO');
            fetchCategories();
        } catch (error) {
            alert('Error al crear categoría');
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('¿Eliminar categoría?')) return;
        try {
            await axios.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const handleRecategorize = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await axios.post('/recategorize');
            setMessage({ type: 'success', text: `Proceso completado. ${res.data.updated_count} transacciones actualizadas.` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al recategorizar.' });
        } finally {
            setLoading(false);
        }
    };

    const categoryColumns = [
        { header: 'Nombre', accessorKey: 'nombre' as keyof Category, sortable: true },
        {
            header: 'Tipo',
            accessorKey: 'tipo' as keyof Category,
            sortable: true,
            cell: (cat: Category) => (
                <span className={`px-2 py-1 rounded text-xs font-bold ${(cat as any).tipo === 'INGRESO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                    {(cat as any).tipo || 'GASTO'}
                </span>
            )
        },
        {
            header: '',
            cell: (cat: Category) => (
                <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        }
    ];

    const ruleColumns = [
        {
            header: 'Prioridad',
            accessorKey: 'prioridad' as keyof CategorizationRule,
            sortable: true,
            cell: (rule: CategorizationRule) => (
                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.prioridad >= 5 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                    {rule.prioridad}
                </span>
            )
        },
        { header: 'Palabra Clave', accessorKey: 'palabra_clave' as keyof CategorizationRule, sortable: true },
        {
            header: 'Categoría Asignada',
            accessorKey: 'categoria_asignada' as keyof CategorizationRule,
            sortable: true,
            cell: (rule: CategorizationRule) => (
                <span className="px-2 py-1 bg-[#333] rounded-md border border-[#444] text-xs">
                    {rule.categoria_asignada}
                </span>
            )
        },
        {
            header: 'Acciones',
            className: 'text-right',
            cell: (rule: CategorizationRule) => (
                <div className="text-right">
                    <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Reglas y Categorías</h1>
                    <p className="text-slate-400">Gestiona tus categorías y reglas automáticas</p>
                </div>

                <div className="flex items-center space-x-4">
                    {message && (
                        <span className={`font-medium animate-pulse ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {message.text}
                        </span>
                    )}
                    <button
                        onClick={handleRecategorize}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>{loading ? 'Procesando...' : 'Aplicar Reglas a Todo'}</span>
                    </button>
                </div>
            </header>

            {/* Category Management */}
            <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333]">
                <h3 className="font-semibold text-slate-200 mb-4">Gestión de Categorías</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <form onSubmit={handleAddCategory} className="flex-1 flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="Nueva Categoría..."
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-[#121212] border border-[#333] rounded-lg text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex items-center space-x-3 bg-[#121212] px-3 py-2 rounded-lg border border-[#333]">
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="GASTO"
                                    checked={newCatType === 'GASTO'}
                                    onChange={() => setNewCatType('GASTO')}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs text-slate-300 font-medium">Gasto</span>
                            </label>
                            <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="INGRESO"
                                    checked={newCatType === 'INGRESO'}
                                    onChange={() => setNewCatType('INGRESO')}
                                    className="text-green-500 focus:ring-green-500"
                                />
                                <span className="text-xs text-slate-300 font-medium">Ingreso</span>
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Añadir
                        </button>
                    </form>
                </div>

                <DataTable
                    data={categories}
                    columns={categoryColumns}
                    pageSizeOptions={[5, 10, 20]}
                    defaultPageSize={10}
                    searchPlaceholder="Buscar categorías..."
                    searchKeys={['nombre']}
                />
            </div>

            {/* Rules Management */}
            <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333]">
                <h3 className="font-semibold text-slate-200 mb-6 flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-indigo-400" />
                    <span>Añadir Nueva Regla</span>
                </h3>

                <form onSubmit={handleAddRule} className="flex gap-4 items-end mb-8">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Palabra Clave</label>
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Ej: MERCADONA"
                            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Categoría</label>
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Prioridad</label>
                        <input
                            type="number"
                            value={newPriority}
                            onChange={(e) => setNewPriority(Number(e.target.value))}
                            min={1}
                            max={100}
                            className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Añadir Regla
                    </button>
                </form>

                <h3 className="font-semibold text-slate-200 mb-4">Reglas Existentes</h3>
                <DataTable
                    data={rules}
                    columns={ruleColumns}
                    defaultPageSize={10}
                    searchPlaceholder="Buscar reglas..."
                    searchKeys={['palabra_clave', 'categoria_asignada']}
                />
            </div>
        </div>
    );
};
