import { useState, useEffect } from 'react';
import { useAssessmentStore } from '../store/useAssessmentStore';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;

export default function UsersPage() {
    const { authState } = useAssessmentStore();
    const token = authState?.token;

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showAdd, setShowAdd] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', email: '', role: 'user' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API_BASE}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await r.json();
            if (r.ok) {
                setUsers(data);
            } else {
                setMsg({ type: 'error', text: data.detail || 'Falha ao carregar utilizadores.' });
            }
        } catch (_) {
            setMsg({ type: 'error', text: 'Erro de ligação ao servidor.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });
        try {
            const r = await fetch(`${API_BASE}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });
            const data = await r.json();
            if (r.ok) {
                setMsg({ type: 'success', text: 'Utilizador criado com sucesso!' });
                setShowAdd(false);
                setNewUser({ username: '', password: '', full_name: '', email: '', role: 'user' });
                fetchUsers();
            } else {
                setMsg({ type: 'error', text: data.detail || 'Falha ao criar utilizador.' });
            }
        } catch (_) {
            setMsg({ type: 'error', text: 'Erro de ligação ao servidor.' });
        }
    };

    if (loading) return <div className="p-6 text-center text-xs font-bold text-slate-500">A carregar utilizadores...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">Gestor de Utilizadores</h1>
                    <p className="text-slate-500 text-xs">Lista e adiciona novos membros à equipa de auditoria.</p>
                </div>
                <button 
                    onClick={() => setShowAdd(!showAdd)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase px-4 py-2.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                >
                    {showAdd ? 'Cancelar' : 'Adicionar Membro'}
                </button>
            </div>

            {msg.text && (
                <div className={`p-4 border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {msg.text}
                </div>
            )}

            {showAdd && (
                <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                    <h3 className="text-xs font-black uppercase text-slate-800">Novo Utilizador</h3>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Username *</label>
                            <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Password *</label>
                            <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" required />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Nome Completo</label>
                            <input type="text" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Email</label>
                            <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Role</label>
                            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase px-5 py-2.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all">
                                Criar Utilizador
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#f8fafc] border-b-2 border-slate-900">
                        <tr>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Username</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Nome Completo</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Email</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {users.map(u => (
                            <tr key={u.username} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-xs font-bold text-slate-900">{u.username}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{u.full_name || '-'}</td>
                                <td className="px-4 py-3 text-xs text-slate-700">{u.email || '-'}</td>
                                <td className="px-4 py-3 text-xs">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                        {u.role}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
