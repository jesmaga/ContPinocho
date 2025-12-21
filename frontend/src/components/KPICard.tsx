import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    amount: number;
    icon: LucideIcon;
    color: string;
}

export const KPICard: React.FC<KPICardProps> = ({ title, amount, icon: Icon, color }) => {
    return (
        <div className="bg-[#1E1E1E] p-6 rounded-xl shadow-sm border border-[#333] flex items-center justify-between">
            <div>
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">
                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)}
                </h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
};
