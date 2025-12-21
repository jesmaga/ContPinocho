import React, { useState, useRef } from 'react';
import { Shield, Download, Upload, AlertTriangle, FileText, Calendar, Trash2 } from 'lucide-react';
import axios from 'axios';
// import { usePeriod } from '../context/PeriodContext'; 

export const SecurityPage: React.FC = () => {
    // Partial Export State
    // const { startDate, endDate, setPeriod } = usePeriod(); // REMOVED: Unused and caused type error
    // User requested "Selector para elegir 'Curso Escolar' o 'Año Natural'".
    // PeriodSelector in Layout already does this globally. 
    // But for this specific card, maybe we want a local selector for the EXPORT ONLY?
    // Let's use a local selector for the "Partial Export" card to avoid changing global dashboard state.
    const [exportType, setExportType] = useState<'school' | 'year'>('school');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    // Restore State
    const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    // Helpers for Partial Export
    const handlePartialExport = () => {
        // Calculate dates based on selection
        let start = '';
        let end = '';

        if (exportType === 'school') {
            // School Year: Sept 1 of selectedYear -> Aug 31 of selectedYear+1
            start = `${selectedYear}-09-01`;
            end = `${parseInt(selectedYear) + 1}-08-31`;
        } else {
            // Calendar Year: Jan 1 -> Dec 31
            start = `${selectedYear}-01-01`;
            end = `${selectedYear}-12-31`;
        }

        // Trigger download
        window.open(`/export/excel?start_date=${start}&end_date=${end}`, '_blank');
    };

    const handleFullBackup = () => {
        window.open('/backup/full', '_blank');
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (restoreMode === 'replace') {
            const confirm = window.confirm("⚠️ ¿Estás seguro de que quieres REEMPLAZAR todo? Se borrarán los datos actuales.");
            if (!confirm) {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', restoreMode);

        setUploading(true);
        try {
            await axios.post('/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Restauración completada con éxito.");
            window.location.reload(); // Reload to show new data
        } catch (error) {
            console.error("Error restoring backup", error);
            alert("Error al restaurar la copia de seguridad.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-500" />
                Seguridad y Copias de Seguridad
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* CARD A: Full Backup */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333] flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
                            <Download className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">Exportación Completa</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Descarga una copia de seguridad total del sistema. Incluye todos los movimientos, categorías y reglas en formato JSON.
                        </p>
                    </div>
                    <button
                        onClick={handleFullBackup}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Descargar Backup (.json)
                    </button>
                </div>

                {/* CARD B: Partial Export */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333] flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">Exportación Parcial</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Exporta movimientos de un periodo específico a Excel.
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex bg-[#121212] rounded-lg p-1 border border-[#333]">
                                <button
                                    onClick={() => setExportType('school')}
                                    className={`flex-1 py-1 text-xs font-medium rounded ${exportType === 'school' ? 'bg-[#333] text-white' : 'text-slate-400'}`}
                                >
                                    Curso Escolar
                                </button>
                                <button
                                    onClick={() => setExportType('year')}
                                    className={`flex-1 py-1 text-xs font-medium rounded ${exportType === 'year' ? 'bg-[#333] text-white' : 'text-slate-400'}`}
                                >
                                    Año Natural
                                </button>
                            </div>

                            <div className="flex items-center gap-2 bg-[#121212] px-3 py-2 rounded border border-[#333]">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="bg-transparent text-slate-200 text-sm outline-none w-full appearance-none"
                                >
                                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                        <option key={year} value={year}>
                                            {exportType === 'school' ? `Curso ${year}-${year + 1}` : `Año ${year}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handlePartialExport}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Exportar Excel
                    </button>
                </div>

                {/* CARD C: Restore */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333] flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">Restaurar Copia</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Importa un archivo .json de respaldo.
                        </p>

                        <div className="space-y-2 mb-6">
                            <label className="flex items-center gap-3 p-3 bg-[#121212] border border-[#333] rounded-lg cursor-pointer hover:border-[#444] transition-colors">
                                <input
                                    type="radio"
                                    name="restoreMode"
                                    value="merge"
                                    checked={restoreMode === 'merge'}
                                    onChange={() => setRestoreMode('merge')}
                                    className="text-indigo-500 focus:ring-indigo-500"
                                />
                                <div>
                                    <div className="text-sm font-medium text-slate-200">Fusionar (Recomendado)</div>
                                    <div className="text-xs text-slate-500">Evita duplicados, añade solo lo nuevo.</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-[#450a0a] border border-red-900/50 rounded-lg cursor-pointer hover:border-red-800 transition-colors">
                                <input
                                    type="radio"
                                    name="restoreMode"
                                    value="replace"
                                    checked={restoreMode === 'replace'}
                                    onChange={() => setRestoreMode('replace')}
                                    className="text-red-500 focus:ring-red-500"
                                />
                                <div>
                                    <div className="text-sm font-medium text-red-200 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Reemplazar Todo
                                    </div>
                                    <div className="text-xs text-red-300/70">BORRA toda la base de datos actual.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleRestore}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <span>Restaurando...</span>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Subir Archivo .json
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* CARD D: DANGER ZONE - WIPE DATA */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl border border-red-900/30 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-900"></div>
                    <div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-red-500 mb-2">Borrar Todo</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Elimina <strong>TODAS</strong> las transacciones de la base de datos.
                            Esta acción es irreversible. Se mantendrán tus Categorías y Reglas.
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            if (confirm("⚠️ ¿REALMENTE QUIERES BORRAR TODOS LOS MOVIMIENTOS?\n\nEsta acción no se puede deshacer.")) {
                                if (confirm("Confirma por segunda vez: ¿Borrar todos los datos?")) {
                                    try {
                                        await axios.delete('/database/wipe');
                                        alert("Base de datos limpia.");
                                        window.location.reload();
                                    } catch (e) {
                                        alert("Error al borrar datos.");
                                    }
                                }
                            }
                        }}
                        className="w-full py-3 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 border border-red-600/20 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        BORRAR DATOS
                    </button>
                </div>

            </div>
        </div>
    );
};
