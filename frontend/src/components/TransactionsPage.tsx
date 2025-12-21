import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileUpload } from './FileUpload';
import { TransactionsTable } from './TransactionsTable';
import { usePeriod } from '../context/PeriodContext';
import { Trash2, Plus, X } from 'lucide-react';
import type { Transaction, Category } from '../types';

export const TransactionsPage: React.FC = () => {
    const { startDate, endDate } = usePeriod();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]); // New State
    const [loading, setLoading] = useState(false);

    // Manual Creation State
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        importe: '',
        categoria: '',
        tipo: 'GASTO'
    });

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/transactions', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    _t: Date.now() // Force fresh fetch
                }
            });
            setTransactions(res.data);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Categories for Dropdowns
    const fetchCategories = async () => {
        try {
            const res = await axios.get('/categories', { params: { all_items: true } });
            setCategories(res.data); // Expecting list when all_items=true
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    const handleRemoveDuplicates = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar las transacciones duplicadas?")) return;
        setLoading(true);
        try {
            const res = await axios.post('/transactions/remove-duplicates');
            alert(`Proceso completado.Se eliminaron ${res.data.deleted_count} duplicados.`);
            fetchTransactions();
        } catch (error) {
            console.error("Error removing duplicates", error);
            alert("Error al eliminar duplicados.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!manualForm.concepto || !manualForm.importe || !manualForm.categoria) {
            alert("Completa todos los campos");
            return;
        }

        try {
            await axios.post('/transactions', {
                fecha: manualForm.fecha,
                concepto: manualForm.concepto,
                importe: parseFloat(manualForm.importe),
                categoria: manualForm.categoria,
                tipo: manualForm.tipo
            });
            setShowManualModal(false);
            setManualForm({ ...manualForm, concepto: '', importe: '' });
            fetchTransactions(); // Refresh
        } catch (error) {
            console.error(error);
            alert("Error creando movimiento");
        }
    };

    useEffect(() => {
        fetchTransactions();
        fetchCategories(); // Fetch on mount
    }, [startDate, endDate]);

    return (
        <div className="p-8 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Movimientos</h1>
                    <p className="text-slate-400">Gestiona y revisa todas tus transacciones</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} />
                        <span>Añadir Movimiento</span>
                    </button>
                    <FileUpload onUploadSuccess={fetchTransactions} />
                    <button
                        onClick={handleRemoveDuplicates}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                        <span>Eliminar Duplicados</span>
                    </button>
                </div>
            </header>

            {/* Manual Creation Modal */}
            {showManualModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1E1E1E] border border-[#333] rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-[#333] pb-4">
                            <h3 className="text-lg font-bold text-slate-100">Nuevo Movimiento Manual</h3>
                            <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Fecha</label>
                                <input
                                    type="date"
                                    value={manualForm.fecha}
                                    onChange={e => setManualForm({ ...manualForm, fecha: e.target.value })}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Concepto</label>
                                <input
                                    value={manualForm.concepto}
                                    onChange={e => setManualForm({ ...manualForm, concepto: e.target.value })}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-200"
                                    placeholder="Ej: Pago en efectivo..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-500 mb-1">Importe (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={manualForm.importe}
                                        onChange={e => setManualForm({ ...manualForm, importe: e.target.value })}
                                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-200"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                                    <select
                                        value={manualForm.tipo}
                                        onChange={e => setManualForm({ ...manualForm, tipo: e.target.value as any })}
                                        className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-200"
                                    >
                                        <option value="GASTO">GASTO</option>
                                        <option value="INGRESO">INGRESO</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Categoría</label>
                                <select
                                    value={manualForm.categoria}
                                    onChange={e => setManualForm({ ...manualForm, categoria: e.target.value })}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-200"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button onClick={() => setShowManualModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handleManualSubmit} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#333] relative">
                {loading && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center rounded-xl backdrop-blur-sm">
                        <div className="text-slate-200 font-medium">Procesando...</div>
                    </div>
                )}
                <TransactionsTable
                    transactions={transactions}
                    categories={categories}
                    onUpdate={fetchTransactions}
                />
            </div>
        </div>
    );
};
