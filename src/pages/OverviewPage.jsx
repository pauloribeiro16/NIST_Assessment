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
            <div className="flex flex-col items-center justify-center h-full text-center animate-in">
                <div className="w-20 h-20 rounded-2xl glass-pro flex items-center justify-center mb-6 glow-accent">
                    <Activity className="w-10 h-10 text-nist-primary" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">No Active Assessment</h2>
                <p className="text-text-dim max-w-md mx-auto leading-relaxed">System initialization required. Please activate a NIST CSF 2.0 workflow via the Copilot to generate your strategic maturity radar.</p>
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
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderColor: '#6366f1',
                borderWidth: 3,
                pointBackgroundColor: functionColors,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: functionColors,
                pointRadius: 6,
                pointHoverRadius: 9,
                tension: 0.2
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
                    color: '#64748b',
                    callback: (v) => v.toFixed(1),
                    font: { size: 10, family: 'Inter', weight: '600' }
                },
                angleLines: { color: 'rgba(0, 0, 0, 0.08)' },
                grid: { color: 'rgba(0, 0, 0, 0.07)' },
                pointLabels: {
                    color: '#334155',
                    font: { size: 12, weight: '700', family: 'Outfit' }
                },

            }
        },
        plugins: {
            legend: { display: false },
        },
        maintainAspectRatio: false,
    };


    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto h-full px-4">
            <header className="animate-in delay-100">
                <h2 className="text-4xl font-display font-bold tracking-tight mb-2 text-text-title">Executive Overview</h2>
                <p className="text-text-dim text-sm max-w-2xl leading-relaxed italic border-l-2 border-nist-primary pl-4">A high-fidelity analysis of organizational resilience and compliance maturity mapped across the six core functions of the NIST Cybersecurity Framework 2.0.</p>
            </header>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-pro p-6 flex flex-col gap-2 relative overflow-hidden group animate-in delay-200">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-nist-primary" />
                    </div>
                    <div className="text-text-dim text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Organizational Maturity</div>
                    <div className="text-4xl font-display font-bold text-text-title flex items-baseline gap-2">
                        {(assessmentData.overallMaturity || 0).toFixed(1)}
                        <span className="text-xs font-bold text-text-dim uppercase tracking-wider">/ 4.0</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-nist-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: `${(assessmentData.overallMaturity || 0) / 4 * 100}%` }} />
                    </div>
                </div>

                <div className="glass-pro p-6 flex flex-col gap-2 relative overflow-hidden group animate-in delay-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldCheck className="w-12 h-12 text-nist-success" />
                    </div>
                    <div className="text-text-dim text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Assessment Integrity</div>
                    <div className="text-4xl font-display font-bold text-text-title flex items-baseline gap-2">
                        {assessmentData.completionRate || 0}%
                        <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Progress</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-nist-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${assessmentData.completionRate || 0}%` }} />
                    </div>
                </div>

                <div className="glass-pro p-6 flex flex-col gap-2 relative overflow-hidden group animate-in delay-400">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="w-12 h-12 text-nist-danger" />
                    </div>
                    <div className="text-text-dim text-[10px] font-bold uppercase tracking-[0.15em] mb-1">Critical Exposure</div>
                    <div className="text-4xl font-display font-bold text-text-title flex items-baseline gap-2">
                        {assessmentData.highRiskCount || 0}
                        <span className="text-xs font-bold text-text-dim uppercase tracking-wider">Gap items</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-nist-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ width: `${(assessmentData.highRiskCount || 0) > 0 ? '60%' : '0%'}` }} />
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="flex-1 min-h-[480px] glass-pro p-8 flex flex-col animate-in delay-500">
                <div className="flex items-center justify-between mb-10 border-b border-slate-100 pb-6">

                    <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Governance Maturity Radar</h3>
                        <p className="text-[10px] text-text-dim font-medium italic">Multivariate assessment of framework alignment</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-nist-primary/5 border border-nist-primary/15 text-[10px] font-extrabold text-nist-primary uppercase tracking-widest">
                        NIST CSF 2.0 Standard
                    </div>
                </div>
                <div className="w-full h-full relative flex-1 px-4">
                    <Radar data={radarData} options={radarOptions} plugins={[alwaysShowLabels]} />
                </div>
            </div>
        </div>
    );
}
