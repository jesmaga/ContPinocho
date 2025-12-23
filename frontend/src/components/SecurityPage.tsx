import React, { useState, useRef, useEffect } from 'react';
import { Shield, Download, Upload, AlertTriangle, FileText, Calendar, Trash2, Users, UserPlus, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface User {
    id: number;
    username: string;
    role: string;
}
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
        } catch (error: any) {
            console.error("Error restoring backup", error);
            const msg = error.response?.data?.detail || "Error al restaurar la copia de seguridad.";
            alert(`Fallo en la restauración: ${msg}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // User Management State
    const [users, setUsers] = useState<User[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [newUserUsername, setNewUserUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const { user: currentUser } = useAuth(); // rename to avoid conflict with User interface

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get<User[]>('/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Error fetching users", error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/users', {
                username: newUserUsername,
                password: newUserPassword,
                role: newUserRole
            });
            alert("Usuario creado con éxito");
            setIsUserModalOpen(false);
            setNewUserUsername('');
            setNewUserPassword('');
            setNewUserRole('user');
            fetchUsers();
        } catch (error) {
            console.error("Error creating user", error);
            alert("Error al crear usuario. El email puede estar duplicado o tener un formato inválido.");
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
        try {
            await axios.delete(`/users/${userId}`);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user", error);
            alert("Error al eliminar usuario.");
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-500" />
                Seguridad y Gestión de Usuarios
            </h1>

            {/* USER MANAGEMENT SECTION */}
            <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Gestión de Usuarios
                        </h2>
                        <p className="text-slate-400 text-sm">Administra quién tiene acceso a la aplicación.</p>
                    </div>
                    <button
                        onClick={() => setIsUserModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Nuevo Usuario
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#333] text-slate-400 text-sm">
                                <th className="p-3">ID</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Rol</th>
                                <th className="p-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-[#333]/50 hover:bg-[#2A2A2A] transition-colors text-slate-200">
                                    <td className="p-3 text-slate-500 text-sm">#{u.id}</td>
                                    <td className="p-3 font-medium">{u.username}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        {u.username !== 'admin' && u.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create User */}
            {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E1E1E] border border-[#333] rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                        <button
                            onClick={() => setIsUserModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-500" />
                            Crear Nuevo Usuario
                        </h3>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserUsername}
                                    onChange={e => setNewUserUsername(e.target.value)}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Rol</label>
                                <select
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value)}
                                    className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none"
                                >
                                    <option value="user">Usuario (Solo Consulta/Edición básica)</option>
                                    <option value="admin">Administrador (Acceso Total)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUserModalOpen(false)}
                                    className="flex-1 py-2 bg-[#333] hover:bg-[#444] text-slate-200 rounded font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
                                >
                                    Crear Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
