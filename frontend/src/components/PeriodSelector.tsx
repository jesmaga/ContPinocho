import React from 'react';
import { usePeriod } from '../context/PeriodContext';
import { Calendar, School } from 'lucide-react';

export const PeriodSelector: React.FC = () => {
    const { mode, year, setMode, setYear } = usePeriod();

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <div className="bg-[#2A2A2A] p-2 rounded-lg shadow-sm border border-[#333] flex items-center space-x-4">
            <div className="flex bg-[#121212] rounded p-1">
                <button
                    onClick={() => setMode('NATURAL')}
                    className={`px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-2 transition-colors ${mode === 'NATURAL' ? 'bg-[#333] text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Año Natural</span>
                </button>
                <button
                    onClick={() => setMode('SCHOOL')}
                    className={`px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-2 transition-colors ${mode === 'SCHOOL' ? 'bg-[#333] text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'
                        }`}
                >
                    <School className="w-4 h-4" />
                    <span>Curso Escolar</span>
                </button>
            </div>

            <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-400 font-medium">
                    {mode === 'NATURAL' ? 'Año:' : 'Inicio Curso:'}
                </span>
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="bg-[#121212] border border-[#333] rounded px-2 py-1.5 text-sm font-semibold text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {years.map(y => (
                        <option key={y} value={y}>
                            {mode === 'NATURAL' ? y : `${y}-${y + 1}`}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
