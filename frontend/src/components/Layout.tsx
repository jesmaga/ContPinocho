import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Settings, List, FileText, Shield, LogOut, User, Menu, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { PeriodSelector } from './PeriodSelector';
import type { SystemMetadata } from '../types';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

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
        <div className="min-h-screen bg-[#121212] flex flex-col md:flex-row">
            {/* Mobile Header with Hamburger */}
            <div className="md:hidden bg-[#1E1E1E] border-b border-[#333] p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center space-x-2">
                    <img src="/Logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-200 p-2 hover:bg-[#2A2A2A] rounded-lg"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky md:top-0 h-screen z-30
                w-64 bg-[#1E1E1E] border-r border-[#333] 
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:flex flex-col
            `}>
                <div className="p-6 hidden md:block">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/Logo.png" alt="Logo" className="h-40 w-auto object-contain" />
                    </div>
                </div>

                {/* Mobile specific header inside sidebar to show logo there too if needed, or close button */}
                <div className="md:hidden p-6 flex justify-between items-center bg-[#1E1E1E]">
                    <img src="/Logo.png" alt="Logo" className="h-12 w-auto object-contain" />
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
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
                        to="/profile"
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-[#2A2A2A] hover:text-slate-200'
                            }`
                        }
                    >
                        <User className="w-5 h-5" />
                        <span>Mi Perfil</span>
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
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header with Period Selector */}
                <header className="bg-[#1E1E1E] border-b border-[#333] px-4 md:px-8 py-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center sticky top-0 z-10 w-full">
                    <div>
                        <h2 className="font-semibold text-slate-100">Panel de Gestión</h2>
                        {lastUpdate && (
                            <p className="text-xs text-slate-500 mt-1">Última act: {lastUpdate}</p>
                        )}
                    </div>
                    <div className="w-full md:w-auto">
                        <PeriodSelector />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
