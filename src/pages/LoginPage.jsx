import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAssessment();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const success = await login(username, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('Connection failed. Please check the backend.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-900 font-sans selection:bg-nist-primary/30 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-nist-primary/10 blur-[150px] rounded-full"></div>
            </div>
            <div className="w-full max-w-md relative animate-in">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white border-4 border-slate-900 flex items-center justify-center mb-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
                        <Shield className="w-10 h-10 text-slate-900" />
                    </div>
                    <h1 className="text-4xl font-display font-black tracking-tight text-slate-900 mb-1">
                        Antigravity Audit
                    </h1>
                    <p className="text-slate-600 font-bold tracking-[0.2em] text-[10px] uppercase">Sovereign NIST CSF 2.0 Intelligence</p>
                </div>

                {/* Login Card */}
                <div className="bg-white border-4 border-slate-900 rounded-3xl p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="bg-red-500 border-2 border-slate-900 text-white p-3 rounded-xl text-xs font-bold animate-in uppercase tracking-wider text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-900 uppercase tracking-wider ml-1">Identity</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-slate-900" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-4 pl-14 pr-6 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    placeholder="Organizational UID"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-900 uppercase tracking-wider ml-1">Credentials</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-slate-900" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-4 pl-14 pr-6 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-nist-primary hover:bg-indigo-600 border-2 border-slate-900 text-white font-black py-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="tracking-widest uppercase text-xs font-black">Authorize Session</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-900 text-center flex flex-col gap-3">
                        {/* Funcionalidade em Stand by:
                        <Link to="/register" className="text-xs font-bold text-slate-600 hover:text-nist-primary transition-colors underline decoration-slate-300 underline-offset-4">
                            Não tens acesso? Solicita uma nova identidade.
                        </Link>
                        */}
                    </div>
                </div>

                <div className="mt-10 text-center animate-in delay-500">
                    <p className="text-slate-500 text-xs font-bold tracking-wide uppercase">
                        Enterprise Grade NIST Compliance Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
