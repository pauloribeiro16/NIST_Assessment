import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { Bar } from 'react-chartjs-2';
import {
    ShieldAlert, CheckCircle, Activity, Info, ChevronRight,
    ShieldCheck, Fingerprint, Crosshair, ServerCrash, Siren, Share2, CalendarPlus, ArrowLeft
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function CategoryPage() {
    const { funcId, categoryId, projectId } = useParams();
    const navigate = useNavigate();
    const { assessmentData, updateSubCategoryScore, updateSubCategoryComment, updateActionPlan } = useAssessment();
    const [localInputs, setLocalInputs] = useState({});
    const [expandedStrategy, setExpandedStrategy] = useState(null);

    // Find the correct function name
    const functionName = Object.keys(assessmentData.functions).find(
        f => f.toLowerCase() === funcId
    );

    const funcData = assessmentData?.functions[functionName];

    // Find the correct category name
    const categoryName = funcData ? Object.keys(funcData.categories).find(
        cat => cat.toLowerCase().replace(/\s+/g, '-') === categoryId
    ) : null;

    const data = funcData?.categories[categoryName];
    const subLabels = Object.keys(data?.subcategories || {});

    // Keep local inputs synced with external state changes (e.g. Copilot updates or project switch)
    useEffect(() => {
        if (data?.subcategories) {
            setLocalInputs(data.subcategories);
        }
    }, [data?.subcategories]);

    if (!data) {
            <div className="flex flex-col items-center justify-center h-full text-center animate-in">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center mb-6 glow-accent">
                    <Info className="w-10 h-10 text-text-dim" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-3 tracking-tight text-text-title">{categoryName || 'Control Entity Not Found'}</h2>
                <p className="text-text-dim max-w-md mx-auto leading-relaxed">The requested NIST CSF 2.0 control category is uninitialized or outside the current assessment domain.</p>
            </div>
    }

    // Derive colors AFTER the guard so functionName and nistColors are guaranteed available
    const functionColor = (assessmentData.nistColors?.[functionName]) || '#3b82f6';
    const isLight = functionName === 'Govern';
    const textColor = isLight ? '#1f2937' : '#ffffff';
    const textOverride = isLight ? '#92400e' : functionColor; // Use dark amber for text if yellow

    const subScores = subLabels.map(label => data.subcategories[label] || 0);

    const iconMap = {
        'Govern': <ShieldAlert className="w-8 h-8" style={{ color: functionColor }} />,
        'Identify': <Fingerprint className="w-8 h-8" style={{ color: functionColor }} />,
        'Protect': <ShieldCheck className="w-8 h-8" style={{ color: functionColor }} />,
        'Detect': <Crosshair className="w-8 h-8" style={{ color: functionColor }} />,
        'Respond': <Siren className="w-8 h-8" style={{ color: functionColor }} />,
        'Recover': <ServerCrash className="w-8 h-8" style={{ color: functionColor }} />
    };

    const FunctionIcon = iconMap[functionName] || <Activity className="w-8 h-8" style={{ color: functionColor }} />;

    const barData = {
        labels: subLabels,
        datasets: [
            {
                label: 'Score',
                data: subScores,
                backgroundColor: functionColor,
                borderColor: '#0f172a',
                borderWidth: 2,
                borderRadius: 4
            }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 4,
                ticks: { stepSize: 1, color: '#0f172a', font: { size: 10, family: 'Inter', weight: '800' } },
                grid: { color: 'rgba(15, 23, 42, 0.12)' },
                border: { color: '#0f172a', width: 2 }

            },
            x: {
                ticks: { color: '#0f172a', font: { size: 9, weight: '800', family: 'Outfit' } },
                grid: { display: false },
                border: { color: '#0f172a', width: 2 }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    const handleSliderChange = (label, newScore) => {
        if (newScore === '') {
            updateSubCategoryScore(functionName, categoryName, label, 0);
            return;
        }
        const val = parseInt(newScore, 10);
        if (isNaN(val) || val < 0 || val > 4) return;
        updateSubCategoryScore(functionName, categoryName, label, val);
        setLocalInputs(prev => ({ ...prev, [label]: val })); // Also update local input for consistency
    };

    const handleInputChange = (label, newScore) => {
        setLocalInputs(prev => ({ ...prev, [label]: newScore }));
    };

    const handleInputBlur = (label) => {
        let val = parseInt(localInputs[label], 10);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > 4) val = 4;
        updateSubCategoryScore(functionName, categoryName, label, val);
        setLocalInputs(prev => ({ ...prev, [label]: val }));
    };

    const handleAddToGantt = (label) => {
        const guidance = assessmentData.nistGuidance[label]?.guidance || '';
        const name = assessmentData.nistGuidance[label]?.name || label;
        
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        
        const newItem = {
            id: label,
            name: name,
            startDate: today.toISOString().split('T')[0],
            endDate: nextMonth.toISOString().split('T')[0],
            customGuidance: guidance
        };

        updateActionPlan(prev => {
            if (prev.find(item => item.id === label)) return prev; 
            return [...prev, newItem];
        });
    };

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto h-full px-4 pb-24 animate-in">
            <header className="flex flex-col gap-4">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-white text-[10px] font-black text-slate-800 hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] transition-all uppercase tracking-widest cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-900" />
                        Back
                    </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-900 pb-8">

                    <div className="flex items-center gap-6">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                        >
                            {FunctionIcon}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-4xl font-display font-bold tracking-tight text-text-title">{categoryName}</h1>
                            <p className="text-text-dim text-sm max-w-xl leading-relaxed italic border-l-2 pl-4" style={{ borderColor: functionColor }}>
                                <span style={{ color: functionColor }} className="font-bold uppercase tracking-widest text-[10px] mr-2">{functionName} Segment</span>
                                • {data.completionRate}% Strategic Alignment Reached
                            </p>
                        </div>
                    </div>

                    <Link to={`/project/${projectId}/visualizer`}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] text-xs font-bold text-text-title transition-all uppercase tracking-widest"
                    >
                        <Share2 className="w-4 h-4 text-nist-primary" />
                        Infrastructure Graph
                    </Link>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-8 flex flex-col min-h-[480px] animate-in delay-200">
                    <div className="flex items-center justify-between mb-10 border-b-2 border-slate-900 pb-6">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Control Performance Distribution</h3>
                            <p className="text-[10px] text-text-dim font-medium italic">High-fidelity maturity assessment results</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            <Activity className="w-3.5 h-3.5 text-nist-primary" />
                            <span className="text-[10px] font-extrabold text-slate-900 tracking-widest uppercase">Benchmark data</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-6 animate-in delay-300">
                    <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-6 flex flex-col gap-5 h-full max-h-[480px] overflow-hidden">

                        <div className="flex flex-col gap-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Maturity Configuration</h4>
                            <p className="text-[9px] text-text-dim/60 italic">Real-time control calibration</p>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2 hidden-scrollbar">
                             {subLabels.map(label => {
                                 const isInGantt = assessmentData?.actionPlan?.some(item => item.id === label);
                                 return (
                                     <div 
                                         key={label} 
                                         className="flex flex-col gap-4 p-5 rounded-xl border-2 border-slate-900 bg-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all duration-300 group"
                                     >

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] font-black font-mono tracking-widest uppercase mb-1" style={{ color: textOverride }}>{label}</span>
                                            <span className="text-xs font-display font-black text-slate-800 tracking-tight truncate">
                                                {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                            </span>
                                        </div>
                                        <div className="relative group/val flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="4"
                                                step="1"
                                                value={localInputs[label] !== undefined ? localInputs[label] : (data.subcategories[label] || 0)}
                                                onChange={(e) => handleInputChange(label, e.target.value)}
                                                onBlur={() => handleInputBlur(label)}
                                                className="w-12 h-10 text-center text-sm font-display font-black bg-white border-2 border-slate-900 rounded-lg text-slate-800 outline-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:translate-y-[-1px] transition-all"
                                            />
                                             <button 
                                                 onClick={() => handleAddToGantt(label)}
                                                 disabled={isInGantt}
                                                 className={`h-10 w-10 flex items-center justify-center border-2 rounded-lg transition-all duration-300 ${
                                                     isInGantt 
                                                     ? 'bg-emerald-100 border-emerald-900 text-emerald-600 cursor-default shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' 
                                                     : 'bg-white border-slate-900 text-slate-800 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px]'
                                                 }`}
                                                 title={isInGantt ? "Adicionado ao Cronograma" : "Adicionar ao Cronograma (Gantt)"}
                                             >
                                                 {isInGantt ? <CheckCircle className="w-5 h-5" /> : <CalendarPlus className="w-4 h-4" />}
                                             </button>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="4"
                                        step="1"
                                        value={data.subcategories[label] || 0}
                                        onChange={(e) => handleSliderChange(label, e.target.value)}
                                        className="w-full h-1.5 cursor-pointer rounded-full bg-slate-200 accent-nist-primary appearance-none transition-all hover:bg-slate-300"
                                        style={{ accentColor: functionColor }}
                                    />
                                 </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-10 flex flex-col gap-8 animate-in delay-400">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                Implementation Strategy
                            </h3>
                            <p className="text-[10px] text-text-dim italic">Continuous improvement and strategic evidence</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-6">
                        {subLabels.map(label => {
                            const isExpanded = expandedStrategy === label;
                            return (
                                <div 
                                    key={label} 
                                    className="p-8 border-2 border-slate-900 bg-white rounded-xl relative group transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-1"
                                >
                                    <span
                                        className="text-[10px] font-black font-mono py-1.5 px-3 rounded-lg mb-5 inline-block tracking-widest uppercase border shadow-sm"
                                        style={{ 
                                            color: textOverride,
                                            backgroundColor: `${functionColor}08`,
                                            borderColor: `${functionColor}15`
                                        }}
                                    >
                                        {label}: {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                    </span>
                                    <div className="text-[14px] text-slate-800 font-bold leading-[1.8] border-l-4 pl-6 mb-8 border-slate-900">
                                        {assessmentData.nistGuidance[label]?.guidance || assessmentData.nistGuidance[label.trim()]?.guidance || "Documentation and implementation steps for this control are currently being compiled."}
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t font-bold border-slate-200 flex items-center justify-between">
                                        <button 
                                            onClick={() => setExpandedStrategy(isExpanded ? null : label)}
                                            className={`px-4 py-2 rounded-lg border-2 border-slate-900 uppercase font-black text-xs transition-transform shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${isExpanded ? 'bg-indigo-100 text-slate-900' : 'bg-white text-slate-800'}`}
                                        >
                                            {isExpanded ? 'CLOSE EDITOR' : 'EDIT STRATEGY'}
                                        </button>
                                        {isExpanded && <span className="text-[10px] font-mono text-slate-400 animate-pulse">Auto-saving...</span>}
                                    </div>

                                    {/* Sub-animado Accordion */}
                                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-slate-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden mt-0 pt-0 border-t-0'}`}>
                                        <div className="overflow-hidden">
                                            <label className="text-[11px] font-mono font-black text-slate-400 uppercase tracking-widest mb-3 block">institutional_context.txt</label>
                                            <textarea
                                                className="w-full text-sm font-mono p-4 border-2 border-slate-900 rounded-xl bg-white text-slate-800 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] outline-none focus:-translate-y-0.5 focus:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] min-h-[140px] transition-all"
                                                placeholder="> Enter strategic implementation evidence, audit tracking, or gaps here..."
                                                value={data.subcategoryComments?.[label] || ''}
                                                onChange={(e) => updateSubCategoryComment(functionName, categoryName, label, e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-10 flex flex-col gap-8 animate-in delay-500 self-start sticky top-10">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title flex items-center gap-3">
                                <ShieldAlert className="w-4 h-4 text-nist-primary" />
                                Maturity Definitions
                            </h3>
                            <p className="text-[10px] text-text-dim italic">NIST standard tier classifications</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-5">
                        {[1, 2, 3, 4].map(tier => (
                            <div 
                                key={tier} 
                                className="flex gap-6 p-6 rounded-2xl border-2 border-slate-900 bg-white hover:-translate-y-1 transition-all duration-300 group shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]"
                            >

                                <div className="flex-shrink-0 w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-display font-black text-xl shadow-sm hover:scale-110 transition-transform duration-300" style={{ color: textOverride }}>
                                    {tier}
                                </div>
                                <div className="flex flex-col gap-2 min-w-0 mt-1">
                                    <h5 className="font-display font-black text-sm text-slate-800 tracking-tight">{assessmentData.nistTiers[tier].name}</h5>
                                    <p className="text-[11px] text-text-dim leading-relaxed font-medium opacity-80">{assessmentData.nistTiers[tier].description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
