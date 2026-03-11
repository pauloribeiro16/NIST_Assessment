import { useState, useEffect } from 'react';

import { Outlet, NavLink, Link, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, ArrowLeft, Activity, MessageSquarePlus, Share2, Trash2 } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function DashboardLayout() {
    const { assessmentData, activeWorkflowId, authState, logout, setActiveProject } = useAssessment();
    const { projectId } = useParams();
    const navigate = useNavigate();

    // Register active project in context so data is fetched from the backend.
    // This is necessary because AssessmentProvider sits above <Routes> in App.jsx
    // and cannot use useParams() itself.
    useEffect(() => {
        if (projectId) setActiveProject(projectId);
    }, [projectId, setActiveProject]);


    const [expandedFunc, setExpandedFunc] = useState('Identify');

    const handleDeleteProject = async () => {
        if (!window.confirm("Are you sure you want to delete this company's assessment project? This action cannot be undone.")) return;

        try {
            const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://127.0.0.1:5001'
                : window.location.origin;
            const headers = authState.token ? { 'Authorization': `Bearer ${authState.token}` } : {};
            await fetch(`${API_BASE}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers
            });
            navigate('/');
        } catch (e) {
            console.error(e);
        }
    };

    const functions = assessmentData ? Object.keys(assessmentData.functions) : [];

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden text-text-body font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-72 glass-pro m-4 mr-0 border-r-0 flex flex-col shrink-0 shadow-2xl z-20">
                <div className="h-16 flex items-center px-6 border-b border-border-subtle shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-nist-primary flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-display font-bold text-lg tracking-tight">NIST <span className="text-nist-primary font-extrabold uppercase italic">CSF</span></h1>
                </div>

                <div className="p-4 flex-1 overflow-y-auto hidden-scrollbar">
                    <Link to="/" className="flex items-center gap-2 mb-8 px-3 text-[11px] font-bold text-text-dim hover:text-nist-primary transition-all uppercase tracking-[0.1em]">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Workspace
                    </Link>

                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3 px-3">Strategic Dashboard</div>
                    <nav className="flex flex-col gap-1.5">
                        <NavLink
                            to="."
                            end
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all group ${isActive
                                    ? 'bg-nist-primary/10 text-nist-primary border border-nist-primary/20 shadow-sm'
                                    : 'text-text-body hover:bg-slate-100 hover:text-text-title'

                                }`
                            }
                        >
                            <LayoutDashboard className={`w-4 h-4 transition-colors group-[.active]:text-nist-primary`} />
                            Executive Overview
                        </NavLink>
                    </nav>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8">Framework Functions</div>
                    <div className="flex flex-col gap-2">
                        {functions.map((func) => {
                            const functionColor = assessmentData.nistColors?.[func] || '#3b82f6';
                            const isExpanded = expandedFunc === func;

                            return (
                                <div key={func} className="flex flex-col gap-1 px-1">
                                    <div className={`flex items-center justify-between rounded-lg transition-all ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/40' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                                        <NavLink
                                            to={`/project/${projectId}/function/${func.toLowerCase()}`}
                                            className={({ isActive }) =>
                                                `flex-1 flex items-center gap-2.5 px-3 py-1.5 text-xs font-bold transition-all ${isActive ? '' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`
                                            }
                                            style={({ isActive }) => isActive ? { color: functionColor } : {}}
                                        >
                                            <div
                                                className={`w-1 h-3 rounded-full transition-all duration-300`}
                                                style={{
                                                    backgroundColor: isExpanded ? functionColor : '#cbd5e1',
                                                }}
                                            />
                                            {func}
                                        </NavLink>
                                        <button
                                            onClick={() => setExpandedFunc(isExpanded ? null : func)}
                                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        >
                                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div
                                            className="flex flex-col gap-0.5 ml-5 border-l border-slate-100 dark:border-slate-800 pl-2 my-1"
                                        >
                                            {Object.keys(assessmentData.functions[func].categories).map(cat => (
                                                <NavLink
                                                    key={cat}
                                                    to={`/project/${projectId}/category/${func.toLowerCase()}/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                                                    className={({ isActive }) =>
                                                        `px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${isActive
                                                            ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50/50'
                                                        }`
                                                    }
                                                >
                                                    {cat}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8">Organization</div>
                    <nav className="flex flex-col gap-1">
                        <NavLink to={`/project/${projectId}/visualizer`} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            <Share2 className="w-4 h-4 text-indigo-500" /> Relationship Map
                        </NavLink>
                        <NavLink to={`/project/${projectId}/roadmap`} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            <Activity className="w-4 h-4 text-emerald-500" /> Implementation View
                        </NavLink>
                    </nav>
                </div>

                {/* Bottom Actions & Status */}
                <div className="p-6 border-t border-border-subtle flex flex-col gap-3">
                    <div className="glass-pro p-3 !bg-slate-50">

                        <div className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">System Status</div>
                        <div className="text-[11px] font-semibold flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-nist-success' : 'bg-slate-300'}`} />

                            <span className={activeWorkflowId ? 'text-text-title' : 'text-text-dim'}>
                                {activeWorkflowId || "Standby Mode"}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/10 hover:border-rose-500/30"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Purge Project
                    </button>

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold text-text-dim hover:text-white hover:bg-white/5 rounded-xl transition-all border border-border-subtle"
                    >
                        <span className="opacity-70">Authenticated as:</span> {authState.user?.username}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Route Pages Render Here */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 animate-in">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}
