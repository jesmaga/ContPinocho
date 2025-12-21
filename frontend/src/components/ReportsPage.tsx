import React, { useState } from 'react';
import { FileText, Table, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
    // We reuse the global PeriodContext for "Preset" logic if desired, 
    // or we can implement local state for custom report ranges distinct from the dashboard.
    // The requirement asks for specific presets in this page: "Año Natural", "Curso Escolar", "Personalizado".

    const [rangeType, setRangeType] = useState<'NATURAL' | 'SCHOOL' | 'CUSTOM'>('NATURAL');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const getDates = () => {
        const today = new Date();
        const year = today.getFullYear();

        if (rangeType === 'NATURAL') {
            return {
                start: `${year}-01-01`,
                end: `${year}-12-31`
            };
        } else if (rangeType === 'SCHOOL') {
            // If current month >= 9 (Sept), start is this year Sept, end is next year Aug
            // Else, start is last year Sept, end is this year Aug
            const month = today.getMonth() + 1; // 1-12
            if (month >= 9) {
                return {
                    start: `${year}-09-01`,
                    end: `${year + 1}-08-31`
                };
            } else {
                return {
                    start: `${year - 1}-09-01`,
                    end: `${year}-08-31`
                };
            }
        } else {
            return {
                start: customStart,
                end: customEnd
            };
        }
    };

    const handleDownload = (type: 'excel' | 'pdf') => {
        const { start, end } = getDates();
        if (!start || !end) {
            alert("Por favor selecciona un rango de fechas válido.");
            return;
        }

        // Trigger download
        // We use window.open or create a link element
        const url = `/export/${type}?start_date=${start}&end_date=${end}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-100">Informes y Exportaciones</h1>
                <p className="text-slate-400">Genera documentos detallados o resúmenes ejecutivos</p>
            </header>

            {/* Configuration Panel */}
            <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333]">
                <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Configuración del Periodo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={() => setRangeType('NATURAL')}
                        className={`p-4 rounded-lg border text-left transition-all ${rangeType === 'NATURAL'
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-[#2A2A2A] border-[#333] text-slate-300 hover:border-slate-500'
                            }`}
                    >
                        <div className="font-semibold mb-1">Año Natural</div>
                        <div className="text-xs opacity-75">1 Ene - 31 Dic</div>
                    </button>

                    <button
                        onClick={() => setRangeType('SCHOOL')}
                        className={`p-4 rounded-lg border text-left transition-all ${rangeType === 'SCHOOL'
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-[#2A2A2A] border-[#333] text-slate-300 hover:border-slate-500'
                            }`}
                    >
                        <div className="font-semibold mb-1">Curso Escolar</div>
                        <div className="text-xs opacity-75">1 Sep - 31 Ago</div>
                    </button>

                    <button
                        onClick={() => setRangeType('CUSTOM')}
                        className={`p-4 rounded-lg border text-left transition-all ${rangeType === 'CUSTOM'
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-[#2A2A2A] border-[#333] text-slate-300 hover:border-slate-500'
                            }`}
                    >
                        <div className="font-semibold mb-1">Personalizado</div>
                        <div className="text-xs opacity-75">Elige fechas</div>
                    </button>
                </div>

                {rangeType === 'CUSTOM' && (
                    <div className="flex gap-4 items-end mb-6 bg-[#121212] p-4 rounded-lg border border-[#333]">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Desde</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-[#2A2A2A] border border-[#333] text-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Hasta</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-[#2A2A2A] border border-[#333] text-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Excel Card */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-lg border border-[#333] hover:border-green-600/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <Table className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Exportar a Excel</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Descarga un archivo .xlsx con todos los movimientos detallados del periodo seleccionado. Ideal para análisis de datos crudos.
                    </p>
                    <button
                        onClick={() => handleDownload('excel')}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <Table className="w-4 h-4" /> Generar Excel
                    </button>
                </div>

                {/* PDF Card */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-lg border border-[#333] hover:border-red-600/50 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <FileText className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">Informe PDF</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Genera un documento profesional con resumen ejecutivo, balance y desglose por categorías. Perfecto para imprimir o enviar.
                    </p>
                    <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> Generar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
