import { useParams, Link } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { Bar } from 'react-chartjs-2';
import { Activity, Info, ArrowRight, ChevronRight, ShieldAlert, Fingerprint, ShieldCheck, Crosshair, Siren, ServerCrash } from 'lucide-react';
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

export default function FunctionPage() {
    const { funcId, projectId } = useParams(); // e.g., 'govern', 'identify'
    const { assessmentData } = useAssessment();

    // Find the correct function name (case-insensitive search)
    const functionName = Object.keys(assessmentData.functions).find(
        f => f.toLowerCase() === funcId
    );

    const data = assessmentData?.functions[functionName];

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                    <Info className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{functionName || 'Function Not Found'}</h2>
                <p className="text-gray-500 dark:text-gray-400">No data available for {funcId}.</p>
            </div>
        );
    }

    const categoryLabels = Object.keys(data.categories || {});
    const categoryScores = categoryLabels.map(label => parseFloat((data.categories[label].score || 0).toFixed(1)));

    const functionColor = assessmentData.nistColors?.[functionName] || '#6366f1';

    const isLight = functionName === 'Govern';
    const textColor = isLight ? '#1f2937' : '#ffffff';
    const textOverride = isLight ? '#92400e' : functionColor;

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
        labels: categoryLabels,
        datasets: [
            {
                label: 'Category Maturity',
                data: categoryScores,
                backgroundColor: functionColor + '99',
                borderColor: functionColor,
                borderWidth: 1,
                borderRadius: 8
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
                ticks: { color: '#64748b', font: { weight: '600', size: 10 } },
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full animated-fade-in pb-20">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-wider">
                    <Link to={`/project/${projectId}`} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Overview</Link>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span
                        className="font-extrabold"
                        style={{ color: textOverride }}
                    >
                        {functionName}
                    </span>
                </nav>

                <div className="flex items-center gap-4 mb-2">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${functionColor}15` }}
                    >
                        {FunctionIcon}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <span style={{ color: textOverride }}>{functionName} Function</span>
                        <span
                            className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
                            style={{
                                backgroundColor: functionColor,
                                color: textColor
                            }}
                        >
                            Avg Score: {(data.score || 0).toFixed(1)}
                        </span>
                    </h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aggregate maturity and category-level outcomes for the {functionName} function.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card-pro p-6 flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category Maturity Breakdown</h3>
                        <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-400">BENCHMARK DATA</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Functional Components</h4>
                    <div className="flex flex-col gap-2">
                        {categoryLabels.map(cat => (
                            <Link
                                key={cat}
                                to={`/project/${projectId}/category/${funcId}/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all group shadow-sm"
                                style={{
                                    borderLeft: `3px solid ${functionColor}`
                                }}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span
                                        className="text-xs font-bold truncate pr-2"
                                        style={{ color: textOverride }}
                                    >
                                        {cat}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                        {Object.keys(data.categories[cat].subcategories || {}).length} Controls Identified
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex flex-col items-end">
                                        <div className="text-[10px] font-extrabold text-slate-900 dark:text-slate-200">{(data.categories[cat].score).toFixed(1)}</div>
                                        <div className="w-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{
                                                    width: `${(data.categories[cat].score / 4) * 100}%`,
                                                    backgroundColor: functionColor
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
