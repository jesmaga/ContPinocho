import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import axios from 'axios';
import { usePeriod } from '../context/PeriodContext';
import { KPICard } from './KPICard';
import { ExpensesChart } from './ExpensesChart';
import { MonthlyBarChart } from './MonthlyBarChart';
import type { DashboardData } from '../types';

export const Dashboard: React.FC = () => {
    const { startDate, endDate } = usePeriod();
    const [categories, setCategories] = useState<string[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [stats, setStats] = useState<DashboardData | null>(null);
    const [monthlyData, setMonthlyData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Categories for Dropdown
        axios.get('/categories')
            .then(res => {
                if (Array.isArray(res.data)) {
                    setCategories(res.data.map((c: any) => c.nombre));
                } else {
                    console.error("Expected array for categories, got:", res.data);
                    // Fallback or alert? 
                    // If it's HTML, we're likely hitting the catch-all
                }
            })
            .catch(err => console.error("Category Fetch Error:", err));
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [kpiRes, monthlyRes] = await Promise.all([
                axios.get('/dashboard/kpis', {
                    params: { start_date: startDate, end_date: endDate }
                }),
                axios.get('/dashboard/monthly-stats', {
                    params: {
                        start_date: startDate,
                        end_date: endDate,
                        category: filterCategory // Pass filter
                    }
                })
            ]);
            setStats(kpiRes.data);
            setMonthlyData(monthlyRes.data);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, filterCategory]); // Re-fetch when filter changes

    if (loading && !stats) return <div className="p-8 text-center text-slate-400">Cargando datos...</div>;

    return (
        <div className="p-8 space-y-8">
            {stats && stats.kpis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICard
                        title="Total Ingresos"
                        amount={stats.kpis.ingresos || 0}
                        icon={TrendingUp}
                        color="bg-green-500/20 text-green-400"
                    />
                    <KPICard
                        title="Total Gastos"
                        amount={stats.kpis.gastos || 0}
                        icon={TrendingDown}
                        color="bg-red-500/20 text-red-400"
                    />
                    <KPICard
                        title="Balance Neto"
                        amount={stats.kpis.balance || 0}
                        icon={Wallet}
                        color="bg-indigo-500/20 text-indigo-400"
                    />
                </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Monthly Bar Chart */}
                <div className="lg:col-span-2 bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-slate-200">Evolución Mensual</h3>

                        {/* CATEGORY DROPDOWN */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Filtrar:</span>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-[#121212] border border-[#333] text-slate-200 text-sm rounded px-2 py-1 outline-none focus:border-indigo-500"
                            >
                                <option value="ALL">Todas las Categorías</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {monthlyData && <MonthlyBarChart data={monthlyData} />}
                </div>

                {/* Pie Chart */}
                <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333]">
                    <h3 className="font-semibold text-slate-200 mb-6">Distribución de Gastos</h3>
                    {stats && <ExpensesChart data={stats.chart_data} />}
                </div>
            </div>
        </div>
    );
};
