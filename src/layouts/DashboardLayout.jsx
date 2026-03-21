import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, ArrowLeft, Activity, Share2, Menu, ChevronLeft } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';


export default function DashboardLayout() {
    const { assessmentData, activeWorkflowId, authState, logout, setActiveProject } = useAssessment();
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


    // Register active project in context so data is fetched from the backend.
    // This is necessary because AssessmentProvider sits above <Routes> in App.jsx
    // and cannot use useParams() itself.
    useEffect(() => {
        if (projectId) setActiveProject(projectId);
    }, [projectId, setActiveProject]);


    const [expandedFunc, setExpandedFunc] = useState('Identify');


    const functions = assessmentData ? Object.keys(assessmentData.functions) : [];

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden text-text-body font-sans">
            {/* Sidebar Navigation */}
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} glass-pro m-4 mr-0 border-r-0 flex flex-col shrink-0 shadow-2xl z-20 transition-all duration-300 overflow-hidden`}>
                <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'} border-b border-border-subtle shrink-0`}>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-lg bg-nist-primary flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="font-display font-bold text-lg tracking-tight">NIST <span className="text-nist-primary font-extrabold uppercase italic">CSF</span></h1>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-text-dim hover:text-nist-primary"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto hidden-scrollbar flex flex-col items-center">
                    <Link to="/" className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-8' : 'gap-2 w-full px-3'} mb-8 text-[11px] font-bold text-text-dim hover:text-nist-primary transition-all uppercase tracking-[0.1em]`}>
                        <ArrowLeft className="w-3.5 h-3.5" /> 
                        {!isSidebarCollapsed && <span>Back to Workspace</span>}
                    </Link>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest mb-3 px-3 w-full">Strategic Dashboard</div>}
                    <nav className="flex flex-col gap-1.5 w-full">
                        <NavLink
                            to="."
                            end
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-semibold transition-all group ${isActive
                                    ? 'bg-nist-primary/10 text-nist-primary border border-nist-primary/20 shadow-sm'
                                    : 'text-text-body hover:bg-slate-100 hover:text-text-title'
                                }`
                            }
                        >
                            <LayoutDashboard className={`w-4 h-4 transition-colors group-[.active]:text-nist-primary`} />
                            {!isSidebarCollapsed && <span>Executive Overview</span>}
                        </NavLink>
                    </nav>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8 w-full">Audit & Assessment</div>}
                    <nav className="flex flex-col gap-1 w-full">
                        <NavLink 
                            to={`/project/${projectId}/assessment`} 
                            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 px-4'} py-3 rounded-xl text-xs font-bold bg-nist-primary text-white shadow-lg shadow-nist-primary/20 hover:bg-indigo-600 transition-all group`}
                        >
                            <Shield className="w-4 h-4 text-white" />
                            {!isSidebarCollapsed && <span>Continuar Assessment</span>}
                        </NavLink>
                    </nav>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8 w-full">Organization</div>}
                    <nav className="flex flex-col gap-1 w-full">
                        <NavLink to={`/project/${projectId}/visualizer`} className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 px-3'} py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            <Share2 className="w-4 h-4 text-indigo-500" /> 
                            {!isSidebarCollapsed && <span>Relationship Map</span>}
                        </NavLink>
                        <NavLink to={`/project/${projectId}/roadmap`} className={({ isActive }) => `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2.5 px-3'} py-2 rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                            <Activity className="w-4 h-4 text-emerald-500" /> 
                            {!isSidebarCollapsed && <span>Implementation View</span>}
                        </NavLink>
                    </nav>
                </div>

                {/* Bottom Actions & Status */}
                <div className="p-6 border-t border-border-subtle flex flex-col gap-3">
                    {!isSidebarCollapsed ? (
                        <div className="glass-pro p-3 !bg-slate-50">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">System Status</div>
                            <div className="text-[11px] font-semibold flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-nist-success' : 'bg-slate-300'}`} />
                                <span className={activeWorkflowId ? 'text-text-title' : 'text-text-dim'}>
                                    {activeWorkflowId || "Standby Mode"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-nist-success' : 'bg-slate-300'}`} title={activeWorkflowId || "Standby Mode"} />
                        </div>
                    )}

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} w-full py-2.5 px-4 text-xs font-bold text-text-dim hover:text-white hover:bg-white/5 rounded-xl transition-all border border-border-subtle`}
                        title={`Authenticated as: ${authState.user?.username}`}
                    >
                        {isSidebarCollapsed ? (
                            <div className="w-5 h-5 rounded-md bg-nist-primary flex items-center justify-center font-bold text-[10px] text-white">
                                {authState.user?.username?.substring(0, 1).toUpperCase()}
                            </div>
                        ) : (
                            <><span className="opacity-70">Auth:</span> {authState.user?.username}</>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header with Project Name */}
                <header className="h-16 flex items-center justify-between px-8 bg-white/40 backdrop-blur-md border-b border-border-subtle shrink-0 shadow-sm z-10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-nist-primary rounded-full" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.1em] leading-none mb-0.5">Workspace</span>
                            <h2 className="text-lg font-black text-text-title tracking-tight leading-none">
                                {assessmentData?.name || "Loading Project..."}
                            </h2>
                        </div>
                    </div>
                </header>

                {/* Route Pages Render Here */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 animate-in">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}
