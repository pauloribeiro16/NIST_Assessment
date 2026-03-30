import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, Loader2, Mail, BadgeCheck } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register, login } = useAssessment();

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('As passwords não coincidem.');
            setLoading(false);
            return;
        }

        try {
            const res = await register({
                username: formData.username,
                password: formData.password,
                full_name: formData.full_name,
                email: formData.email
            });

            if (res.success) {
                // Auto-login after successful registration
                const loginSuccess = await login(formData.username, formData.password);
                if (loginSuccess) {
                    navigate('/');
                } else {
                    navigate('/login');
                }
            } else {
                setError(res.error || 'Falha ao criar conta.');
            }
        } catch (err) {
            setError('Erro de ligação. Verifique o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-slate-900 font-sans selection:bg-nist-primary/30 overflow-hidden py-12">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-nist-primary/10 blur-[150px] rounded-full"></div>
            </div>
            
            <div className="w-full max-w-md relative animate-in">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white border-4 border-slate-900 flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
                        <Shield className="w-8 h-8 text-slate-900" />
                    </div>
                    <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 mb-1">
                        Pedir Acesso
                    </h1>
                    <p className="text-slate-600 font-bold tracking-[0.2em] text-[10px] uppercase">NIST Intelligence Platform</p>
                </div>

                {/* Register Card */}
                <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        {error && (
                            <div className="bg-red-500 border-2 border-slate-900 text-white p-3 rounded-xl text-xs font-bold animate-in uppercase tracking-wider text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider ml-1">Username *</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-slate-900" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                                    placeholder="Identificador único"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider ml-1">Nome Completo</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <BadgeCheck className="w-4 h-4 text-slate-900" />
                                </div>
                                <input
                                    type="text"
                                    name="full_name"
                                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                                    placeholder="Opcional"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider ml-1">Email Organizacional</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="w-4 h-4 text-slate-900" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-3 pl-12 pr-4 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                                    placeholder="Opcional"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider ml-1">Password *</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-900" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-3 pl-10 pr-3 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                                        placeholder="Min 12 Chars"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider ml-1">Confirmar *</label>
                                <div className="relative group/field">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-slate-900" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        required
                                        className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl py-3 pl-10 pr-3 outline-none focus:bg-white focus:ring-4 focus:ring-nist-primary/10 transition-all font-bold text-slate-900 placeholder:text-slate-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm"
                                        placeholder="Confirmar"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-nist-primary hover:bg-indigo-600 border-2 border-slate-900 text-white font-black py-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 mt-6"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="tracking-widest uppercase text-xs font-black">Criar Identidade</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-900 text-center flex flex-col gap-3">
                        <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-nist-primary transition-colors underline decoration-slate-300 underline-offset-4">
                            Já tens uma identidade? Clica para entrar.
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
