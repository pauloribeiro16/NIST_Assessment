import { useState } from 'react';
import { Outlet, NavLink, Link, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, ArrowLeft, Activity, MessageSquarePlus, Share2, Trash2 } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function DashboardLayout() {
    const { assessmentData, activeWorkflowId } = useAssessment();
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [expandedFunc, setExpandedFunc] = useState('Identify');

    const handleDeleteProject = async () => {
        if (!window.confirm("Are you sure you want to delete this company's assessment project? This action cannot be undone.")) return;

        try {
            const API_BASE = window.location.port === '3001' ? 'http://127.0.0.1:5001' : window.location.origin;
            await fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
            navigate('/');
        } catch (e) {
            console.error(e);
        }
    };

    const functions = assessmentData ? Object.keys(assessmentData.functions) : [];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-dark-bg overflow-hidden text-slate-900 dark:text-slate-100 font-inter">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col shrink-0 shadow-sm z-10">
                <div className="h-14 flex items-center px-5 border-b border-slate-100 dark:border-dark-border shrink-0">
                    <div className="w-7 h-7 rounded bg-slate-900 dark:bg-blue-600 flex items-center justify-center mr-2.5 shadow-sm">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="font-bold text-sm tracking-tight">NIST <span className="text-blue-600 dark:text-blue-500 font-extrabold">CSF</span></h1>
                </div>

                <div className="p-3 flex-1 overflow-y-auto hidden-scrollbar">
                    <Link to="/" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 px-3 uppercase tracking-wider">
                        <ArrowLeft className="w-3 h-3" /> All Projects
                    </Link>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">Main</div>
                    <nav className="flex flex-col gap-1">
                        <NavLink
                            to="."
                            end
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`
                            }
                        >
                            <LayoutDashboard className="w-4 h-4 text-blue-500" />
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
                <div className="p-4 border-t border-slate-100 dark:border-dark-border flex flex-col gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                        <div className="text-[11px] font-bold truncate flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                            {activeWorkflowId || "Standby"}
                        </div>
                    </div>

                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-bold text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-600 dark:hover:border-rose-500"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Project
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Topbar removed */}

                {/* Route Pages Render Here */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}
