import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const checkPasswordStrength = (pwd: string) => {
        return pwd.length >= 8; // Simple check for now
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
            return;
        }

        if (!checkPasswordStrength(newPassword)) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        try {
            await axios.put('/users/me/password', {
                old_password: oldPassword,
                new_password: newPassword
            });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Password change error", error);
            const msg = error.response?.data?.detail || "Error al cambiar la contraseña";
            setMessage({ type: 'error', text: msg });
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                <User className="w-8 h-8 text-indigo-500" />
                Mi Perfil
            </h1>

            <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333]">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#333]">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-2xl font-bold">
                        {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">{user?.username}</h2>
                        <span className="text-sm text-slate-400 bg-[#333] px-2 py-0.5 rounded">
                            {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                    </div>
                </div>

                <div className="max-w-md">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-400" />
                        Cambiar Contraseña
                    </h3>

                    {message && (
                        <div className={`p-4 rounded-lg mb-4 flex items-start gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                            <div>{message.text}</div>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Contraseña Actual</label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-[#121212] border border-[#333] rounded px-3 py-2 text-slate-100 focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto"
                        >
                            Actualizar Contraseña
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
