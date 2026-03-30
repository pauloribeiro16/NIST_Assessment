import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, ArrowLeft, Activity, Share2, Menu, ChevronLeft, User } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';


export default function DashboardLayout() {
    const { assessmentData, activeWorkflowId, authState, logout, setActiveProject } = useAssessment();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const scrollContainerRef = useRef(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


    // Register active project in context so data is fetched from the backend.
    useEffect(() => {
        if (projectId) setActiveProject(projectId);
    }, [projectId, setActiveProject]);

    // Scroll container to top when route changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo(0, 0);
        }
    }, [pathname]);


    const [expandedFunc, setExpandedFunc] = useState('Identify');


    const functions = assessmentData ? Object.keys(assessmentData.functions) : [];

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden text-text-body font-sans">
            {/* Sidebar Navigation */}
            <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-white m-4 mr-0 border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col shrink-0 z-20 transition-all duration-300 overflow-hidden`}>
                <div className={`h-16 flex items-center relative ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'} border-b-2 border-slate-900 shrink-0`}>
                    {!isSidebarCollapsed && (
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-nist-primary rounded-xl flex items-center justify-center mr-3 shadow-md shadow-indigo-500/10 border-2 border-slate-900">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="font-display font-black text-lg tracking-tight text-slate-800">NIST <span className="text-nist-primary uppercase italic">CSF</span></h1>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className={`p-1.5 rounded-lg bg-white border-2 border-slate-900 text-slate-800 hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-y-[1px] ${isSidebarCollapsed ? 'mx-auto' : ''}`}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto hidden-scrollbar flex flex-col items-center">
                    <Link to="/" className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-8' : 'gap-2 w-full px-3'} mb-8 text-[11px] font-bold text-slate-500 hover:text-nist-primary transition-all uppercase tracking-[0.1em]`}>
                        <ArrowLeft className="w-3.5 h-3.5" /> 
                        {!isSidebarCollapsed && <span>Back to Workspace</span>}
                    </Link>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3 w-full">Strategic Dashboard</div>}
                    <nav className="flex flex-col gap-1.5 w-full">
                        <NavLink
                            to="."
                            end
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                }`
                            }
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            {!isSidebarCollapsed && <span>Executive Overview</span>}
                        </NavLink>
                    </nav>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8 w-full">Audit & Assessment</div>}
                    <nav className="flex flex-col gap-1.5 w-full">
                        <NavLink 
                            to={`/project/${projectId}/assessment`} 
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                }`
                            }
                        >
                            <Shield className="w-4 h-4" />
                            {!isSidebarCollapsed && <span>Continuar Assessment</span>}
                        </NavLink>
                    </nav>

                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8 w-full">Organization</div>}
                    <nav className="flex flex-col gap-1.5 w-full">
                        <NavLink 
                            to={`/project/${projectId}/visualizer`} 
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                }`
                            }
                        >
                            <Share2 className="w-4 h-4" /> 
                            {!isSidebarCollapsed && <span>Relationship Map</span>}
                        </NavLink>
                        <NavLink 
                            to={`/project/${projectId}/roadmap`} 
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                }`
                            }
                        >
                            <Activity className="w-4 h-4" /> 
                            {!isSidebarCollapsed && <span>Implementation View</span>}
                        </NavLink>
                    </nav>

                    {/* 🔧 Definições & Administraçao */}
                    {!isSidebarCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3 mt-8 w-full">Definições</div>}
                    <nav className="flex flex-col gap-1.5 w-full">
                        <NavLink 
                            to={`/project/${projectId}/profile`} 
                            className={({ isActive }) =>
                                `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                    ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                }`
                            }
                        >
                            <User className="w-4 h-4" /> 
                            {!isSidebarCollapsed && <span>O Meu Perfil</span>}
                        </NavLink>

                        {authState?.user?.role === 'admin' && (
                            <NavLink 
                                to={`/project/${projectId}/users`} 
                                className={({ isActive }) =>
                                    `flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4'} py-2.5 rounded-xl text-xs font-black border-2 transition-all ${isActive
                                        ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : 'border-transparent text-slate-600 hover:bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:text-slate-800'
                                    }`
                                }
                            >
                                <Shield className="w-4 h-4" /> 
                                {!isSidebarCollapsed && <span>Utilizadores</span>}
                            </NavLink>
                        )}
                    </nav>
                </div>

                {/* Bottom Actions & Status */}
                <div className="p-6 border-t-2 border-slate-900 flex flex-col gap-3">
                    {!isSidebarCollapsed ? (
                        <div className="bg-white rounded-xl border-2 border-slate-900 p-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">System Status</div>
                            <div className="text-[11px] font-semibold flex items-center gap-2.5">
                                <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className={activeWorkflowId ? 'text-slate-800' : 'text-slate-500'}>
                                    {activeWorkflowId || "Standby Mode"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className={`w-2 h-2 rounded-full ${activeWorkflowId ? 'bg-emerald-500' : 'bg-slate-300'}`} title={activeWorkflowId || "Standby Mode"} />
                        </div>
                    )}

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-2'} w-full py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-slate-100 hover:shadow-sm`}
                        title={`Authenticated as: ${authState.user?.username}`}
                    >
                        {isSidebarCollapsed ? (
                            <div className="w-5 h-5 rounded-md bg-nist-primary flex items-center justify-center font-bold text-[10px] text-white">
                                {authState.user?.username?.substring(0, 1).toUpperCase()}
                            </div>
                        ) : (
                            <><span className="opacity-60 text-slate-400">Auth:</span> <span className="truncate text-slate-600">{authState.user?.username}</span></>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Top Header with Project Name */}
                <header className="h-16 flex items-center justify-between px-8 bg-white border-b-2 border-slate-900 shrink-0 z-10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-nist-primary rounded-full shadow-sm shadow-indigo-500/20" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-0.5">Workspace</span>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                                {assessmentData?.name || projectId || "..."}
                            </h2>
                        </div>
                    </div>
                </header>

                {/* Route Pages Render Here */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-12 animate-in">
                    <Outlet />
                </div>
            </main>

        </div>
    );
}
