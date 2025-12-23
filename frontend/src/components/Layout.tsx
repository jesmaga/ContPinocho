import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Wallet, Settings, List, FileText, Shield, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PeriodSelector } from './PeriodSelector';
import type { SystemMetadata } from '../types';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchLastUpdate = async () => {
            try {
                const res = await axios.get<SystemMetadata>('/api/last-update');
                if (res.data && res.data.value) {
                    setLastUpdate(res.data.value);
                }
            } catch (error) {
                console.error("Error fetching last update", error);
            }
        };
        fetchLastUpdate();
    }, []);

    return (
        <div className="min-h-screen bg-[#121212] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1E1E1E] border-r border-[#333] hidden md:flex flex-col sticky top-0 h-screen z-10">
                <div className="p-6">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xl">
                        <Wallet className="w-8 h-8" />
                        <span>Contabilidad</span>
                    </div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/transactions"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                            }`
                        }
                    >
                        <List className="w-5 h-5" />
                        <span>Movimientos</span>
                    </NavLink>

                    {user?.role === 'admin' && (
                        <>
                            <NavLink
                                to="/rules"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                                    }`
                                }
                            >
                                <Settings className="w-5 h-5" />
                                <span>Reglas</span>
                            </NavLink>
                            <NavLink
                                to="/categories-admin"
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                                    }`
                                }
                            >
                                <List className="w-5 h-5" />
                                <span>Categorías</span>
                            </NavLink>
                        </>
                    )}
                    <NavLink
                        to="/reports"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                            }`
                        }
                    >
                        <FileText className="w-5 h-5" />
                        <span>Informes</span>
                    </NavLink>

                    {user?.role === 'admin' && (
                        <NavLink
                            to="/security"
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                                }`
                            }
                        >
                            <Shield className="w-5 h-5" />
                            <span>Seguridad</span>
                        </NavLink>
                    )}

                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors text-red-400 hover:bg-[#2A2A2A] hover:text-red-300 mt-auto mb-4"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header with Period Selector */}
                <header className="bg-[#1E1E1E] border-b border-[#333] px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="font-semibold text-slate-100">Panel de Gestión</h2>
                        {lastUpdate && (
                            <p className="text-xs text-slate-500 mt-1">Última act: {lastUpdate}</p>
                        )}
                    </div>
                    <PeriodSelector />
                </header>

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
