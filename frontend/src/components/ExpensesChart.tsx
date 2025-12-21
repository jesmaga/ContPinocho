import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ExpensesChartProps {
    data: { [key: string]: number };
}

export const ExpensesChart: React.FC<ExpensesChartProps> = ({ data }) => {
    const safeData = data || {};
    const chartData = {
        labels: Object.keys(safeData),
        datasets: [
            {
                label: 'Gastos por Categoría',
                data: Object.values(safeData),
                backgroundColor: [
                    '#6366f1', // Indigo 500
                    '#a855f7', // Purple 500
                    '#ec4899', // Pink 500
                    '#ef4444', // Red 500
                    '#f59e0b', // Amber 500
                    '#10b981', // Emerald 500
                    '#06b6d4', // Cyan 500
                    '#3b82f6', // Blue 500
                ],
                borderWidth: 0,
                hoverOffset: 4
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: '#e2e8f0', // slate-200
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    },
                    padding: 20
                }
            }
        },
        layout: {
            padding: 20
        }
    };

    // @ts-ignore
    return <Pie data={chartData} options={options} />;
};
