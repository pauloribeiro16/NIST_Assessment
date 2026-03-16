import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Trash2, Shield } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:5001'
    : window.location.origin;

export default function ProjectSelectionPage() {
    const [projects, setProjects] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();
    const { authState } = useAssessment();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const headers = authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {};
            const res = await fetch(`${API_BASE}/api/projects`, { headers });
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {})
            };
            const res = await fetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: newProjectName.trim() })
            });
            const data = await res.json();
            navigate(`/project/${data.id}`);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            const headers = authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {};
            await fetch(`${API_BASE}/api/projects/${id}`, {
                method: 'DELETE',
                headers
            });
            fetchProjects();
        } catch (e) { }
    };

    const selectProject = (id) => {
        navigate(`/project/${id}`);
    };

    return (
        <div className="min-h-screen bg-bg-obsidian flex flex-col items-center py-20 px-6 text-text-body font-sans selection:bg-nist-primary/30">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-nist-primary/10 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
            </div>

            <div className="flex flex-col items-center mb-16 text-center relative z-10 animate-in">
                <div className="w-16 h-16 rounded-2xl glass-pro flex items-center justify-center mb-6">

                    <Shield className="w-8 h-8 text-text-title" />
                </div>
                <h1 className="text-5xl font-display font-bold tracking-tight text-text-title mb-4">
                    Enterprise <span className="bg-gradient-to-r from-nist-primary to-nist-accent bg-clip-text text-transparent">Maturity</span> Assessment
                </h1>
                <p className="text-text-dim max-w-lg text-sm font-medium tracking-wide uppercase opacity-70">Strategic NIST CSF 2.0 Management Platform</p>
            </div>

            <div className="w-full max-w-5xl relative z-10">
                <div className="flex justify-between items-end mb-10 px-2 animate-in delay-100">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-text-title">Select Assessment Project</h2>
                        <p className="text-text-dim text-xs font-semibold mt-1">Active company assessments in registry</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-nist-primary hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
                        <span className="tracking-widest uppercase">New Assessment</span>
                    </button>
                </div>

                {isCreating && (
                    <div className="glass-pro p-10 mb-12 animate-in overflow-hidden relative">

                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nist-primary to-transparent opacity-50"></div>
                        <h3 className="text-xs font-bold text-text-dim uppercase tracking-[0.2em] mb-6">Initialize New Project</h3>
                        <form onSubmit={handleCreateProject} className="flex flex-col md:flex-row gap-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Organizational or Project Identifier..."
                                className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-nist-primary/50 transition-all font-medium text-text-body placeholder:text-text-dim/60 shadow-sm"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={!newProjectName.trim()}
                                    className="bg-nist-primary hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold transition-all text-xs tracking-widest uppercase bg-gradient-to-r from-nist-primary to-blue-600"
                                >
                                    Authorize
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setNewProjectName(''); }}
                                    className="bg-slate-100 border border-slate-200 hover:bg-slate-200 text-text-title px-6 py-4 rounded-2xl font-bold transition-all text-xs tracking-widest uppercase"
                                >
                                    Abort
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((p, idx) => (
                        <div
                            key={p.id}
                            onClick={() => selectProject(p.id)}
                            className="glass-pro p-8 group flex flex-col gap-8 transition-all duration-500 hover:translate-y-[-4px] animate-in overflow-hidden relative"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Decorative Accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-nist-primary/5 blur-[60px] rounded-full group-hover:bg-nist-primary/10 transition-colors"></div>
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 group-hover:border-nist-primary/30 flex items-center justify-center shrink-0 transition-all duration-500 overflow-hidden relative">

                                        <div className="absolute inset-0 bg-gradient-to-tr from-nist-primary/10 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
                                        <Building2 className="w-7 h-7 text-text-title group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-display font-bold text-xl text-text-title truncate pr-2 group-hover:text-nist-primary transition-colors">{p.name}</h3>
                                        <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">
                                            Registry: {new Date(p.lastModified).toLocaleDateString()}
                                        </div>
                                    </div>

                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, p.id)}
                                    className="text-text-dim hover:text-nist-danger transition-all p-3 hover:bg-nist-danger/10 rounded-xl shrink-0 invisible group-hover:visible animate-in"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-100 relative z-10">

                                <div className="grid grid-cols-2 gap-10">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-text-dim/80 font-bold mb-2">Maturity</div>
                                        <div className="font-display font-bold text-2xl text-nist-primary flex items-baseline gap-1.5">
                                            {p.overallMaturity.toFixed(1)} <span className="text-[10px] text-text-dim font-bold uppercase">Score</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-[0.2em] text-text-dim/80 font-bold mb-2">Integrity</div>
                                        <div className="font-display font-bold text-2xl text-nist-success">{p.completionRate}%</div>
                                    </div>
                                </div>

                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 group-hover:border-nist-primary/30 group-hover:bg-nist-primary/5">

                                    <ArrowRight className="w-5 h-5 text-text-title" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && !isCreating && (
                        <div className="col-span-full py-24 glass-pro border-dashed flex flex-col items-center animate-in">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">

                                <Building2 className="w-10 h-10 text-text-dim opacity-40" />
                            </div>
                            <h3 className="text-xl font-display font-bold mb-2 text-text-title">No Assessments Found</h3>
                            <p className="text-text-dim text-sm font-medium mb-8 max-w-xs text-center opacity-70">Initialize your first strategic company baseline to begin compliance orchestration.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-nist-primary hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg"
                            >
                                <Plus className="w-4 h-4" /> 
                                <span className="tracking-widest uppercase">Start First Assessment</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
