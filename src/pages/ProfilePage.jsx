import { useState, useEffect } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;

export default function ProfilePage() {
    const { authState } = useAssessmentStore();
    const token = authState?.token;
    const username = authState?.user?.username;

    const [profile, setProfile] = useState({ full_name: '', email: '', role: 'user' });
    const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            setProfile({
                full_name: data.full_name || '',
                email: data.email || '',
                role: data.role || 'user'
            });
        })
        .catch(() => {});
    }, [token]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        try {
            const r = await fetch(`${API_BASE}/api/users/${username}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: profile.full_name,
                    email: profile.email
                })
            });
            const data = await r.json();
            if (r.ok) {
                setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            } else {
                setMsg({ type: 'error', text: data.detail || 'Falha ao atualizar perfil.' });
            }
        } catch (_) {
            setMsg({ type: 'error', text: 'Erro de ligação ao servidor.' });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (pwdForm.new_password !== pwdForm.confirm_password) {
            setMsg({ type: 'error', text: 'As novas passwords não coincidem.' });
            return;
        }

        try {
            const r = await fetch(`${API_BASE}/api/users/${username}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: pwdForm.current_password,
                    new_password: pwdForm.new_password
                })
            });
            const data = await r.json();
            if (r.ok) {
                setMsg({ type: 'success', text: 'Password atualizada com sucesso!' });
                setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                setMsg({ type: 'error', text: data.detail || 'Falha ao alterar password.' });
            }
        } catch (_) {
            setMsg({ type: 'error', text: 'Erro de ligação ao servidor.' });
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">Gestão de Conta</h1>
                <p className="text-slate-500 text-xs">Edita o teu perfil e altera a tua password de acesso.</p>
            </div>

            {msg.text && (
                <div className={`p-4 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 📝 Card 1: Perfil */}
                <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
                    <h2 className="text-sm font-black uppercase text-slate-800 border-b border-slate-100 pb-2">Detalhes do Perfil</h2>
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Username</label>
                            <input type="text" value={username || ''} disabled className="bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 font-bold outline-none cursor-not-allowed" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Role</label>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md self-start border border-indigo-200 uppercase tracking-wider">{profile.role}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nome Completo</label>
                            <input 
                                type="text" 
                                value={profile.full_name} 
                                onChange={e => setProfile({...profile, full_name: e.target.value})}
                                className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Email</label>
                            <input 
                                type="email" 
                                value={profile.email} 
                                onChange={e => setProfile({...profile, email: e.target.value})}
                                className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                            />
                        </div>
                        <button type="submit" className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase py-3 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Guardar Alterações
                        </button>
                    </form>
                </div>

                {/* 🔒 Card 2: Password */}
                <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
                    <h2 className="text-sm font-black uppercase text-slate-800 border-b border-slate-100 pb-2">Alterar Password</h2>
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Password Atual</label>
                            <input 
                                type="password" 
                                value={pwdForm.current_password} 
                                onChange={e => setPwdForm({...pwdForm, current_password: e.target.value})}
                                className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Nova Password</label>
                            <input 
                                type="password" 
                                value={pwdForm.new_password} 
                                onChange={e => setPwdForm({...pwdForm, new_password: e.target.value})}
                                className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                                required
                            />
                            <p className="text-[9px] text-slate-400">Mínimo 12 chars, 1 Maiúscula, 1 Número.</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Confirmar Nova Password</label>
                            <input 
                                type="password" 
                                value={pwdForm.confirm_password} 
                                onChange={e => setPwdForm({...pwdForm, confirm_password: e.target.value})}
                                className="bg-slate-50 border-2 border-slate-900 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" 
                                required
                            />
                        </div>
                        <button type="submit" className="mt-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase py-3 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                            Alterar Password
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
