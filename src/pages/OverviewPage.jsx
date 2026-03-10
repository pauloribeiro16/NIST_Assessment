import { useAssessment } from '../context/AssessmentContext';
import { Radar } from 'react-chartjs-2';
import { Activity, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

export default function OverviewPage() {
    const { assessmentData } = useAssessment();

    // Handle empty state gracefully
    if (!assessmentData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Active Assessment</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">Open the Copilot to start a new NIST CSF 2.0 assessment workflow. Your maturity radar will appear here.</p>
            </div>
        );
    }

    // Generate Radar Data 
    const labels = Object.keys(assessmentData.functions || {});
    const scores = labels.map(label => parseFloat((assessmentData.functions[label]?.score || 0).toFixed(1)));
    const functionColors = labels.map(label => assessmentData.nistColors?.[label] || '#3b82f6');

    const radarData = {
        labels,
        datasets: [
            {
                label: 'Maturity Score',
                data: scores,
                backgroundColor: 'rgba(128, 128, 128, 0.1)',
                borderColor: 'rgba(59, 130, 246, 0.5)',
                borderWidth: 2,
                pointBackgroundColor: functionColors,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: functionColors,
                pointRadius: 6,
                pointHoverRadius: 9
            },
        ],
    };

    // Inline plugin: always draw score labels next to each radar point
    const alwaysShowLabels = {
        id: 'alwaysShowLabels',
        afterDatasetsDraw(chart) {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                meta.data.forEach((point, index) => {
                    const value = dataset.data[index];
                    const label = value.toFixed(1);
                    const color = functionColors[index] || '#374151';

                    // Offset label slightly outward from the point
                    const cx = chart.scales.r.xCenter;
                    const cy = chart.scales.r.yCenter;
                    const dx = point.x - cx;
                    const dy = point.y - cy;
                    const offset = 18;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const lx = point.x + (dx / len) * offset;
                    const ly = point.y + (dy / len) * offset;

                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.font = 'bold 12px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Small white halo for readability
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.strokeText(label, lx, ly);
                    ctx.fillText(label, lx, ly);
                    ctx.restore();
                });
            });
        }
    };

    const radarOptions = {
        scales: {
            r: {
                min: 0,
                max: 4,
                ticks: {
                    stepSize: 1,
                    backdropColor: 'transparent',
                    color: '#94a3b8',
                    callback: (v) => v.toFixed(1),
                    font: { size: 10 }
                },
                angleLines: { color: 'rgba(148, 163, 184, 0.4)' },
                grid: { color: 'rgba(148, 163, 184, 0.4)' },
                pointLabels: {
                    color: '#64748b',
                    font: { size: 11, weight: '700', family: 'Inter' }
                },
            }
        },
        plugins: {
            legend: { display: false },
        },
        maintainAspectRatio: false,
    };


    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full animated-fade-in">
            <header>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Executive Overview</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Overall organizational maturity across the six core NIST functions.</p>
            </header>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-pro p-5 flex flex-col gap-1 border-b-2 border-b-blue-500">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none mb-1">
                        <TrendingUp className="w-3 h-3 text-blue-500" /> Organizational Maturity
                    </div>
                    <div className="text-2xl font-extrabold tracking-tight">
                        {(assessmentData.overallMaturity || 0).toFixed(1)}
                        <span className="text-xs font-bold text-slate-400 ml-1">AVG SCORE</span>
                    </div>
                </div>

                <div className="card-pro p-5 flex flex-col gap-1 border-b-2 border-b-emerald-500">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none mb-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Progress Status
                    </div>
                    <div className="text-2xl font-extrabold tracking-tight">
                        {assessmentData.completionRate || 0}%
                        <span className="text-xs font-bold text-slate-400 ml-1">COMPLETED</span>
                    </div>
                </div>

                <div className="card-pro p-5 flex flex-col gap-1 border-b-2 border-b-rose-500">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none mb-1">
                        <AlertTriangle className="w-3 h-3 text-rose-500" /> Active Risks
                    </div>
                    <div className="text-2xl font-extrabold tracking-tight">
                        {assessmentData.highRiskCount || 0}
                        <span className="text-xs font-bold text-slate-400 ml-1">CRITICAL GAPS</span>
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="flex-1 min-h-[440px] card-pro p-6 flex flex-col">
                <div className="flex items-center justify-between mb-8 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Function Maturity Radar</h3>
                    <div className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">NIST CSF 2.0</div>
                </div>
                <div className="w-full h-full relative flex-1">
                    <Radar data={radarData} options={radarOptions} plugins={[alwaysShowLabels]} />
                </div>
            </div>
        </div>
    );
}
