import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Trash2, Shield } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:5001';

export default function ProjectSelectionPage() {
    const [projects, setProjects] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/projects`);
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
            const res = await fetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
            fetchProjects();
        } catch (e) { }
    };

    const selectProject = (id) => {
        navigate(`/project/${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] flex flex-col items-center py-20 px-6">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Shield className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Enterprise <span className="text-blue-500">Maturity</span> Assessment</h1>
            </div>

            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold">Select Company / Project</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> New Project
                    </button>
                </div>

                {isCreating && (
                    <div className="glass-panel p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 animated-fade-in">
                        <form onSubmit={handleCreateProject} className="flex gap-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Enter company or project name..."
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newProjectName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 text-white px-8 py-3 rounded-xl font-semibold transition-all active:scale-95"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsCreating(false); setNewProjectName(''); }}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-semibold transition-all"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {projects.map(p => (
                        <div
                            key={p.id}
                            onClick={() => selectProject(p.id)}
                            className="glass-panel p-6 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer group flex flex-col gap-5 border border-transparent"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-lg truncate pr-2">{p.name}</h3>
                                        <div className="text-xs text-gray-500 font-medium">Updated: {new Date(p.lastModified).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, p.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-5 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-8">
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Maturity</div>
                                        <div className="font-bold text-blue-600 dark:text-blue-400 flex items-baseline gap-1">
                                            {p.overallMaturity.toFixed(1)} <span className="text-xs text-gray-400 font-semibold">/ 4.0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Completion</div>
                                        <div className="font-bold text-green-600 dark:text-green-400">{p.completionRate}%</div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                    <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && !isCreating && (
                        <div className="col-span-full text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <Building2 className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300">No Projects Found</h3>
                            <p className="max-w-xs mx-auto mb-6">Create your first company assessment project to get started.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
