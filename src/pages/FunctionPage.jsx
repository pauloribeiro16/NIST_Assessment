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
            <div className="flex flex-col items-center justify-center h-full text-center animate-in">
                <div className="w-20 h-20 rounded-2xl glass-pro flex items-center justify-center mb-6 glow-accent">
                    <Info className="w-10 h-10 text-text-dim" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-3 tracking-tight text-text-title">{functionName || 'Functional Entity Not Found'}</h2>
                <p className="text-text-dim max-w-md mx-auto leading-relaxed">The requested NIST CSF 2.0 functional domain is either uninitialized or outside the current assessment scope.</p>
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
                ticks: { stepSize: 1, color: '#64748b', font: { size: 10, family: 'Inter', weight: '600' } },
                grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
                ticks: { color: '#94a3b8', font: { weight: '700', size: 10, family: 'Outfit' } },
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto h-full px-4 pb-24 animate-in">
            <header className="flex flex-col gap-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-3 text-[10px] font-bold text-text-dim mb-2 uppercase tracking-[0.2em]">
                    <Link to={`/project/${projectId}`} className="hover:text-nist-primary transition-all">Strategic Overview</Link>
                    <ChevronRight className="w-3 h-3 opacity-30" />
                    <span className="text-text-title font-extrabold tracking-widest">{functionName} DOMAIN</span>
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
                            <h2 className="text-4xl font-display font-bold tracking-tight text-text-title">{functionName} Domain</h2>
                            <p className="text-text-dim text-sm max-w-xl leading-relaxed italic border-l-2 pl-4" style={{ borderColor: functionColor }}>Aggregate maturity and category-level outcomes for the institutional {functionName} capability.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 px-6 py-4 glass-pro">

                        <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.2em]">Aggregate Maturity</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-display font-bold text-text-title">{(data.score || 0).toFixed(1)}</span>
                            <span className="text-xs font-bold text-text-dim uppercase">/ 4.0</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">

                            <div className="h-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ width: `${(data.score / 4) * 100}%`, backgroundColor: functionColor }} />
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 glass-pro p-8 flex flex-col min-h-[480px] animate-in delay-200">
                    <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Category Distribution</h3>
                            <p className="text-[10px] text-text-dim font-medium italic">Relative maturity density across {categoryLabels.length} categories</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">

                            <Activity className="w-3.5 h-3.5 text-nist-primary" />
                            <span className="text-[10px] font-extrabold text-text-dim tracking-widest uppercase">Benchmark Analysis</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>

                <div className="flex flex-col gap-6 animate-in delay-300">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-dim px-2">Sub-Domain Components</h4>
                    <div className="flex flex-col gap-3">
                        {categoryLabels.map(cat => (
                            <Link
                                key={cat}
                                to={`/project/${projectId}/category/${funcId}/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                                className="flex items-center justify-between p-5 rounded-2xl glass-pro hover:border-nist-primary/30 transition-all group"
                                style={{
                                    borderLeft: `4px solid ${functionColor}`
                                }}
                            >
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span
                                        className="font-display font-bold text-sm tracking-tight text-text-title truncate group-hover:text-nist-primary transition-colors pr-2"
                                    >
                                        {cat}
                                    </span>
                                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest opacity-60">
                                        {Object.keys(data.categories[cat].subcategories || {}).length} CORE CONTROLS
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 px-2">
                                    <div className="flex flex-col items-end">
                                        <div className="text-xs font-display font-bold text-text-title">{(data.categories[cat].score).toFixed(1)}</div>
                                        <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">

                                            <div
                                                className="h-full transition-all duration-500 shadow-[0_0_5px_rgba(255,255,255,0.2)]"
                                                style={{
                                                    width: `${(data.categories[cat].score / 4) * 100}%`,
                                                    backgroundColor: functionColor
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-nist-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
