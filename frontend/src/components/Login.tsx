import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            // Now using relative path leveraging Vite proxy
            const response = await fetch('/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            login(data.access_token);
            navigate('/');
        } catch (err) {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
            <div className="bg-[#1e293b] p-8 rounded-lg shadow-xl w-full max-w-md flex flex-col items-center border border-slate-700">
                <img src="/Logo.png" alt="Logo" className="h-32 w-auto mb-6 object-contain" />
                <h2 className="text-2xl font-bold mb-8 text-center text-white">Iniciar Sesión</h2>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6 w-full text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="mb-5">
                        <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="username">
                            Email
                        </label>
                        <input
                            className="bg-[#334155] border border-slate-600 rounded w-full py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            id="username"
                            type="text"
                            placeholder="user@example.com"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                            Contraseña
                        </label>
                        <input
                            className="bg-[#334155] border border-slate-600 rounded w-full py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            id="password"
                            type="password"
                            placeholder="******************"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full transition-colors duration-200"
                            type="submit"
                        >
                            Entrar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
