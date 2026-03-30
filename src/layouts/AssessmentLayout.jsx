import { Outlet, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import { useEffect } from 'react';

export default function AssessmentLayout() {
    const { projectId } = useParams();
    const { assessmentData, setActiveProject } = useAssessment();

    useEffect(() => {
        if (projectId) setActiveProject(projectId);
    }, [projectId, setActiveProject]);

    return (
        <div className="flex h-screen flex-col bg-bg-base overflow-hidden text-text-body font-sans">
            {/* Top Navigation Navbar */}
            <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-white/5 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-nist-primary flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-display font-bold text-lg tracking-tight">NIST <span className="text-nist-primary font-extrabold uppercase italic">CSF</span></h1>
                    <span className="mx-3 text-white/20">|</span>
                    <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Assessment Workplace</span>
                    {assessmentData?.name && (
                        <>
                            <span className="mx-3 text-white/20">|</span>
                            <span className="text-xs font-extrabold text-nist-primary flex items-center gap-1.5 bg-nist-primary/10 px-2.5 py-1 rounded-lg">
                                <span className="w-1 h-1 rounded-full bg-nist-primary animate-pulse" />
                                {assessmentData.name}
                            </span>
                        </>
                    )}
                </div>

                <Link 
                    to={`/project/${projectId}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold text-text-title shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4 text-nist-primary" />
                    Back to Dashboard
                </Link>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 animate-in">
                <Outlet />
            </main>
        </div>
    );
}
