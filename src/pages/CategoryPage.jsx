import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { Bar } from 'react-chartjs-2';
import {
    ShieldAlert, CheckCircle, Activity, Info, ChevronRight,
    ShieldCheck, Fingerprint, Crosshair, ServerCrash, Siren, Share2
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
    const { assessmentData, updateSubCategoryScore, updateSubCategoryComment } = useAssessment();
    const [localInputs, setLocalInputs] = useState({});

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
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in">
                <div className="w-20 h-20 rounded-2xl glass-pro flex items-center justify-center mb-6 glow-accent">
                    <Info className="w-10 h-10 text-text-dim" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-3 tracking-tight text-text-title">{categoryName || 'Control Entity Not Found'}</h2>
                <p className="text-text-dim max-w-md mx-auto leading-relaxed">The requested NIST CSF 2.0 control category is uninitialized or outside the current assessment domain.</p>
            </div>
        );
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
                backgroundColor: functionColor + 'cc',
                borderColor: functionColor,
                borderWidth: 1,
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
                ticks: { stepSize: 1, color: '#64748b', font: { size: 10, family: 'Inter', weight: '600' } },
                grid: { color: 'rgba(0, 0, 0, 0.06)' }

            },
            x: {
                ticks: { color: '#94a3b8', font: { size: 9, weight: '700', family: 'Outfit' } },
                grid: { display: false }
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

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto h-full px-4 pb-24 animate-in">
            <header className="flex flex-col gap-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-3 text-[10px] font-bold text-text-dim mb-2 uppercase tracking-[0.2em]">
                    <Link to={`/project/${projectId}`} className="hover:text-nist-primary transition-all">Strategic Overview</Link>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <Link
                        to={`/project/${projectId}/function/${funcId}`}
                        className="hover:text-nist-primary transition-all"
                        style={{ color: functionColor }}
                    >
                        {functionName} DOMAIN
                    </Link>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className="text-text-title font-extrabold tracking-widest">{categoryName}</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">

                    <div className="flex items-center gap-6">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
                            style={{ backgroundColor: `${functionColor}15`, border: `1px solid ${functionColor}30` }}
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
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl glass-pro text-xs font-bold text-text-title hover:border-nist-primary/30 transition-all uppercase tracking-widest"
                    >
                        <Share2 className="w-4 h-4 text-nist-primary" />
                        Infrastructure Graph
                    </Link>
                </div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 glass-pro p-8 flex flex-col min-h-[480px] animate-in delay-200 shadow-inner">
                    <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Control Performance Distribution</h3>
                            <p className="text-[10px] text-text-dim font-medium italic">High-fidelity maturity assessment results</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">

                            <Activity className="w-3.5 h-3.5 text-nist-primary" />
                            <span className="text-[10px] font-extrabold text-text-dim tracking-widest uppercase">Benchmark data</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-6 animate-in delay-300">
                    <div className="glass-pro p-6 flex flex-col gap-5 h-full max-h-[480px] overflow-hidden shadow-inner">

                        <div className="flex flex-col gap-1">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim">Maturity Configuration</h4>
                            <p className="text-[9px] text-text-dim/60 italic">Real-time control calibration</p>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto pr-2 hidden-scrollbar">
                            {subLabels.map(label => (
                                <div key={label} className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 transition-all hover:bg-slate-100 hover:border-slate-300 group">

                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] font-bold font-mono text-nist-primary tracking-widest uppercase mb-1 opacity-70">{label}</span>
                                            <span className="text-xs font-display font-bold text-text-title tracking-tight truncate">
                                                {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                            </span>
                                        </div>
                                        <div className="relative group/val">
                                            <input
                                                type="number"
                                                min="0"
                                                max="4"
                                                step="1"
                                                value={localInputs[label] !== undefined ? localInputs[label] : (data.subcategories[label] || 0)}
                                                onChange={(e) => handleInputChange(label, e.target.value)}
                                                onBlur={() => handleInputBlur(label)}
                                                className="w-12 h-10 text-center text-sm font-display font-bold bg-white border border-slate-200 rounded-xl text-text-title outline-none focus:border-nist-primary/50 transition-all shadow-sm"
                                            />
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
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass-pro p-10 flex flex-col gap-8 animate-in delay-400">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-nist-success" />
                                Implementation Strategy
                            </h3>
                            <p className="text-[10px] text-text-dim italic">Continuous improvement and strategic evidence</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-8">
                        {subLabels.map(label => (
                            <div key={label} className="p-8 rounded-3xl bg-slate-50 border border-slate-200 relative group transition-all hover:bg-slate-100">
                                <span
                                    className="text-[9px] font-bold font-mono py-1.5 px-3 rounded-xl bg-white border border-slate-200 mb-5 inline-block tracking-widest uppercase shadow-sm"
                                    style={{ color: functionColor }}
                                >
                                    {label}: {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                </span>
                                <div className="text-[13px] text-text-dim font-medium leading-[1.8] italic border-l-2 pl-6 mb-8 group-hover:text-text-body transition-colors" style={{ borderColor: functionColor }}>
                                    {assessmentData.nistGuidance[label]?.guidance || assessmentData.nistGuidance[label.trim()]?.guidance || "Documentation and implementation steps for this control are currently being compiled."}
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em] mb-4 block">Institutional Implementation Context</label>
                                    <textarea
                                        className="w-full text-xs p-5 rounded-2xl border border-slate-200 bg-white text-text-body placeholder:text-text-dim focus:border-nist-primary/50 outline-none resize-y min-h-[100px] font-medium leading-relaxed transition-all shadow-sm"
                                        placeholder="Record strategic implementation status, audit evidence, or organizational gaps..."
                                        value={data.subcategoryComments?.[label] || ''}
                                        onChange={(e) => updateSubCategoryComment(functionName, categoryName, label, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-pro p-10 flex flex-col gap-8 animate-in delay-500 self-start sticky top-10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8">

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
                            <div key={tier} className="flex gap-6 p-6 rounded-3xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all group">

                                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-nist-primary/10 border border-nist-primary/20 flex items-center justify-center text-nist-primary font-display font-bold text-lg shadow-inner group-hover:scale-110 transition-transform">
                                    {tier}
                                </div>
                                <div className="flex flex-col gap-2 min-w-0">
                                    <h5 className="font-display font-bold text-sm text-text-title tracking-tight">{assessmentData.nistTiers[tier].name}</h5>
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
