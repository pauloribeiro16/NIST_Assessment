import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="min-h-screen bg-bg-obsidian flex flex-col items-center justify-center p-6 text-text-body font-sans selection:bg-nist-primary/30 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-nist-primary/10 blur-[150px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full animate-pulse-slow delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0,transparent_70%)]"></div>
            </div>

            <div className="w-full max-w-md relative animate-in">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-20 h-20 rounded-[2rem] glass-pro flex items-center justify-center mb-6 glow-accent !bg-white/5 border-white/10 group transition-all duration-700 hover:rotate-[360deg]">
                        <Shield className="w-10 h-10 text-text-title group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="text-4xl font-display font-bold tracking-tight text-text-title mb-2">
                        Antigravity Audit
                    </h1>
                    <p className="text-text-dim font-medium tracking-[0.2em] text-[10px] uppercase opacity-70">Sovereign NIST CSF 2.0 Intelligence</p>
                </div>

                {/* Login Card */}
                <div className="glass-pro !bg-white/5 border-white/5 p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nist-primary to-transparent opacity-50"></div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        {error && (
                            <div className="bg-nist-accent/10 border border-nist-accent/20 text-nist-accent p-4 rounded-2xl text-xs font-bold animate-in uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] ml-1 opacity-60">Identity</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-text-dim group-focus-within/field:text-nist-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-nist-primary/50 focus:bg-black/60 transition-all font-medium text-text-body placeholder:text-text-dim/30 shadow-inner"
                                    placeholder="Organizational UID"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] ml-1 opacity-60">Credentials</label>
                            <div className="relative group/field">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <Lock className="w-4 h-4 text-text-dim group-focus-within/field:text-nist-primary transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-nist-primary/50 focus:bg-black/60 transition-all font-medium text-text-body placeholder:text-text-dim/30 shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-nist-primary hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-3 group mt-4 overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span className="tracking-widest uppercase text-xs">Authorize Session</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 text-center">
                        <p className="text-[9px] text-text-dim/40 uppercase tracking-[0.3em] font-bold">
                            Level 3 Secure Access Gateway
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center animate-in delay-500">
                    <p className="text-text-dim text-xs font-medium tracking-wide uppercase opacity-50">
                        Enterprise Grade NIST Compliance Platform
                    </p>
                </div>
            </div>
        </div>
    );
}
