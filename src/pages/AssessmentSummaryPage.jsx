import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { Activity, ArrowRight } from 'lucide-react';

export default function AssessmentSummaryPage() {
    const { projectId, funcId } = useParams();
    const { assessmentData } = useAssessment();
    const navigate = useNavigate();

    const functionsList = assessmentData && assessmentData.functions ? Object.keys(assessmentData.functions) : [];
    const activeFunc = funcId || (functionsList[0] ? functionsList[0].toLowerCase() : 'govern');

    const activeFuncName = useMemo(() => {
        return functionsList.find(f => f.toLowerCase() === activeFunc);
    }, [functionsList, activeFunc]);

    const activeFuncData = assessmentData?.functions[activeFuncName];

    const categoryEntries = activeFuncData?.categories 
        ? Object.entries(activeFuncData.categories) 
        : [];

    const functionColor = assessmentData?.nistColors?.[activeFuncName] || '#6366f1';

    if (!assessmentData || !activeFuncData) return (
         <div className="flex items-center justify-center h-full">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nist-primary"></div>
         </div>
    );

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto h-full px-4 animate-in">
            <header className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-display font-bold tracking-tight text-text-title flex items-center gap-3">
                        <Activity className="w-8 h-8 text-nist-primary" />
                        Audit Control Dashboard
                    </h2>
                    <p className="text-text-dim text-sm max-w-2xl leading-relaxed italic border-l-2 border-nist-primary pl-4">
                        Structured execution matrix. Adjust settings category-by-category for isolated, high-focus auditing.
                    </p>
                </div>
            </header>

            {/* Tabs de Funções */}
            <div className="flex items-center gap-2 border-b border-white/5 overflow-x-auto hidden-scrollbar">
                {functionsList.map(func => {
                    const isActive = func.toLowerCase() === activeFunc;
                    const color = assessmentData.nistColors?.[func] || '#3b82f6';
                    const score = assessmentData.functions[func].score || 0;
                    
                    return (
                        <button
                            key={func}
                            onClick={() => navigate(`/project/${projectId}/assessment/${func.toLowerCase()}`)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-black tracking-wider uppercase border-2 border-slate-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${
                                isActive 
                                ? 'bg-white text-slate-800 font-extrabold' 
                                : 'bg-white/90 text-slate-600'
                            }`}
                        >
                            <div className="w-2.5 h-2.5 rounded-full border border-slate-900" style={{ backgroundColor: color }} />
                            {func}
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-900 text-slate-800">
                                {score.toFixed(1)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Grid de Categorias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryEntries.map(([catName, catData]) => {
                    const score = catData.score || 0;
                    const scorePercentage = (score / 4) * 100;

                    return (
                        <div key={catName} className="bg-white border-2 border-slate-900 p-6 flex flex-col justify-between gap-5 relative overflow-hidden rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 transition-all group">
                            
                            <div className="flex flex-col gap-3 relative">
                                <h3 className="text-sm font-display font-bold text-text-title tracking-tight">{catName}</h3>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-display font-extrabold" style={{ color: functionColor }}>{score.toFixed(1)}</span>
                                    <span className="text-[10px] text-text-dim">/ 4.0</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-500 shadow-[0_0_8px_rgba(255,255,255,0.1)]" style={{ width: `${scorePercentage}%`, backgroundColor: functionColor }} />
                                </div>
                            </div>

                            <Link 
                                to={`/project/${projectId}/assessment/${activeFunc}/${catName.toLowerCase().replace(/\s+/g, '-')}`}
                                className="mt-4 flex items-center justify-between w-full py-2.5 px-4 rounded-xl border-2 border-slate-900 bg-white hover:bg-slate-50 text-xs font-black text-slate-800 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all group/btn"
                            >
                                <span>Adjust Controls</span>
                                <ArrowRight className="w-4 h-4 text-slate-800 group-hover/btn:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
