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
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                    <Info className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{categoryName || 'Category Not Found'}</h2>
                <p className="text-gray-500 dark:text-gray-400">No data available for {categoryId}.</p>
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
                ticks: { stepSize: 1, color: '#94a3b8', font: { size: 10 } },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
            },
            x: {
                ticks: { color: '#64748b', font: { size: 9, weight: '600' } },
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
        <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full animated-fade-in pb-20">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-4 flex-wrap">
                    <Link to={`/project/${projectId}`} className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Overview</Link>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <Link
                        className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium"
                        style={{ color: textOverride }}
                    >
                        {functionName}
                    </Link>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-200 font-semibold">{categoryName}</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${functionColor}15` }}
                        >
                            {FunctionIcon}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
                                {categoryName}
                                <span
                                    className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                                    style={{
                                        backgroundColor: functionColor,
                                        color: textColor
                                    }}
                                >
                                    Maturity: {(data.score || 0).toFixed(1)}
                                </span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                <span style={{ color: textOverride }}>{functionName} Function</span> • {data.completionRate}% Assessed
                            </p>
                        </div>
                    </div>

                    <Link to={`/project/${projectId}/visualizer`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm"
                    >
                        <Share2 className="w-4 h-4 text-indigo-500" />
                        View in Graph
                    </Link>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">Granular control implementation levels for {categoryName}.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card-pro p-6 flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Control Performance Distribution</h3>
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400">SUB-CATEGORY SCORES</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="card-pro p-5 flex flex-col gap-4 h-full max-h-[480px] overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Maturity Level Control</h4>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto pr-1 hidden-scrollbar">
                            {subLabels.map(label => (
                                <div key={label} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/60">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-extrabold font-mono text-slate-400 mb-0.5">{label}</span>
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                                                {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            max="4"
                                            step="1"
                                            value={localInputs[label] !== undefined ? localInputs[label] : (data.subcategories[label] || 0)}
                                            onChange={(e) => handleInputChange(label, e.target.value)}
                                            onBlur={() => handleInputBlur(label)}
                                            className="w-10 text-center text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 outline-none ring-1 ring-transparent focus:ring-blue-500/30"
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="4"
                                        step="1"
                                        value={data.subcategories[label] || 0}
                                        onChange={(e) => handleSliderChange(label, e.target.value)}
                                        className="w-full h-1 cursor-pointer rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600"
                                        style={{ accentColor: functionColor }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-pro p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Implementation Roadmap
                        </h3>
                    </div>
                    <div className="flex flex-col gap-5">
                        {subLabels.map(label => (
                            <div key={label} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                <span
                                    className="text-[10px] font-bold font-mono py-0.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-2 inline-block"
                                    style={{ color: textOverride }}
                                >
                                    {label}: {assessmentData.nistGuidance[label]?.name || assessmentData.nistGuidance[label.trim()]?.name || label}
                                </span>
                                <div className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-line mb-4 px-1">
                                    {assessmentData.nistGuidance[label]?.guidance || assessmentData.nistGuidance[label.trim()]?.guidance || "Documentation and implementation steps for this control are currently being compiled."}
                                </div>
                                <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Enterprise Implementation Notes</label>
                                    <textarea
                                        className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:ring-1 focus:ring-blue-500/50 outline-none resize-y min-h-[70px] font-medium"
                                        placeholder="Enter implementation status, evidence, or gaps..."
                                        value={data.subcategoryComments?.[label] || ''}
                                        onChange={(e) => updateSubCategoryComment(functionName, categoryName, label, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-pro p-6 bg-gradient-to-br from-white to-slate-50/50 dark:from-dark-card dark:to-slate-900/20 self-start">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-blue-500" /> Maturity Definitions
                        </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4].map(tier => (
                            <div key={tier} className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/50">
                                    {tier}
                                </div>
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{assessmentData.nistTiers[tier].name}</h5>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{assessmentData.nistTiers[tier].description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
