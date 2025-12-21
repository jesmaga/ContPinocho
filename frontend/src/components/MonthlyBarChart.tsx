import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { usePeriod } from '../context/PeriodContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface MonthlyData {
    [key: string]: {
        ingreso: number;
        gasto: number;
    }
}

interface BarChartProps {
    data: MonthlyData;
}

export const MonthlyBarChart: React.FC<BarChartProps> = ({ data }) => {
    const { mode, year } = usePeriod();

    // Generate labels based on mode
    // Natural: Jan -> Dec of year
    // School: Sep of year -> Aug of year+1
    const labels: string[] = [];
    const months = mode === 'NATURAL'
        ? Array.from({ length: 12 }, (_, i) => i + 1) // 1..12
        : Array.from({ length: 12 }, (_, i) => (i + 8) % 12 + 1); // 9..12, 1..8

    const orderedKeys: string[] = [];
    const safeData = data || {};

    months.forEach((m) => {
        let y = year;
        if (mode === 'SCHOOL') {
            // If month is Sep(9) to Dec(12), year is 'year'
            // If month is Jan(1) to Aug(8), year is 'year + 1'
            if (m < 9) y = year + 1;
        }
        const key = `${y}-${String(m).padStart(2, '0')}`;
        orderedKeys.push(key);

        const date = new Date(y, m - 1, 1);
        labels.push(date.toLocaleString('es-ES', { month: 'short' }).toUpperCase());
    });

    const incomeData = orderedKeys.map(k => safeData[k]?.ingreso || 0);
    const expenseData = orderedKeys.map(k => safeData[k]?.gasto || 0);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Ingresos',
                data: incomeData,
                backgroundColor: 'rgba(34, 197, 94, 0.5)', // Green
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
            },
            {
                label: 'Gastos',
                data: expenseData,
                backgroundColor: 'rgba(239, 68, 68, 0.5)', // Red
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#e2e8f0' // slate-200
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: '#94a3b8' // slate-400
                }
            },
            y: {
                grid: {
                    color: '#333333',
                    drawBorder: false
                },
                ticks: {
                    color: '#94a3b8' // slate-400
                }
            }
        },
        borderRadius: 4,
        barThickness: 30
    };

    return <Bar options={options} data={chartData} />;
};
