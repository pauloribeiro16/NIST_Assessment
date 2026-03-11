import { useMemo, useState } from 'react';
import { Activity, Clock, CheckCircle2, ChevronRight, ChevronDown, Crosshair, Fingerprint, ShieldCheck, ActivitySquare, Siren, ServerCrash } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function RoadmapPage() {
    const { assessmentData } = useAssessment();

    const renderRoadmap = useMemo(() => {
        if (!assessmentData || !assessmentData.functions) return [];

        const functionTimeline = [
            { id: 'Govern', icon: Crosshair, duration: 'Months 1-2', phase: 'Phase 1' },
            { id: 'Identify', icon: Fingerprint, duration: 'Months 3-4', phase: 'Phase 2' },
            { id: 'Protect', icon: ShieldCheck, duration: 'Months 5-7', phase: 'Phase 3' },
            { id: 'Detect', icon: ActivitySquare, duration: 'Months 8-9', phase: 'Phase 4' },
            { id: 'Respond', icon: Siren, duration: 'Months 10-11', phase: 'Phase 5' },
            { id: 'Recover', icon: ServerCrash, duration: 'Month 12', phase: 'Phase 6' }
        ];

        return functionTimeline.map(timelineItem => {
            const funcData = assessmentData.functions[timelineItem.id];
            if (!funcData) return null;

            const funcColor = assessmentData.nistColors?.[timelineItem.id] || '#6366f1';

            // Determine status based on function score
            let status = 'planned';
            if (funcData.score >= 4) status = 'completed';
            else if (funcData.score > 0) status = 'in-progress';

            // Group missing tasks by category
            const categories = funcData.categories || {};
            const organizedCategories = [];

            Object.entries(categories).forEach(([catName, catData]) => {
                const subs = catData.subcategories || {};
                const missingSubs = [];

                Object.entries(subs).forEach(([label, score]) => {
                    if (score < 3) {
                        const name = assessmentData.nistGuidance?.[label]?.name ||
                            assessmentData.nistGuidance?.[label.trim()]?.name || label;
                        const guidance = assessmentData.nistGuidance?.[label]?.guidance ||
                            assessmentData.nistGuidance?.[label.trim()]?.guidance || "No guidance available.";
                        missingSubs.push({ label, name, score, guidance });
                    }
                });

                if (missingSubs.length > 0) {
                    missingSubs.sort((a, b) => a.score - b.score);
                    organizedCategories.push({
                        name: catName,
                        tasks: missingSubs
                    });
                }
            });

            const isLight = timelineItem.id === 'Govern';
            const textOverride = isLight ? '#92400e' : funcColor;

            return {
                ...timelineItem,
                name: timelineItem.id,
                color: funcColor,
                textOverride,
                status,
                categories: organizedCategories
            };
        }).filter(Boolean);

    }, [assessmentData]);

    const [expandedFunctions, setExpandedFunctions] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleFunction = (id) => {
        setExpandedFunctions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleCategory = (funcId, catName) => {
        const key = `${funcId}-${catName}`;
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        const allFuncs = {};
        const allCats = {};
        renderRoadmap.forEach(item => {
            allFuncs[item.id] = true;
            item.categories.forEach(cat => {
                allCats[`${item.id}-${cat.name}`] = true;
            });
        });
        setExpandedFunctions(allFuncs);
        setExpandedCategories(allCats);
    };

    const collapseAll = () => {
        setExpandedFunctions({});
        setExpandedCategories({});
    };

    return (
        <div className="flex flex-col gap-10 max-w-6xl mx-auto h-full px-4 pb-24 animate-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex flex-col gap-3">
                    <h2 className="text-4xl font-display font-bold tracking-tight text-text-title flex items-center gap-4">
                        <Activity className="w-10 h-10 text-nist-primary" />
                        Implementation Strategy
                    </h2>
                    <p className="text-text-dim text-sm max-w-2xl leading-relaxed italic border-l-2 border-nist-primary pl-4">
                        A prioritized strategic timeline integrating NIST CSF 2.0 functional requirements into an actionable multi-phase deployment roadmap, synchronized with institutional resource allocation.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={expandAll}
                        className="px-5 py-2.5 rounded-xl bg-nist-primary/10 text-nist-primary text-xs font-bold hover:bg-nist-primary/20 transition-all border border-nist-primary/20 uppercase tracking-widest"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-5 py-2.5 rounded-xl bg-white/5 text-text-dim text-xs font-bold hover:bg-white/10 transition-all border border-white/10 uppercase tracking-widest"
                    >
                        Collapse All
                    </button>
                </div>
            </header>

            <div className="flex flex-col gap-6">
                {renderRoadmap.map((item, i) => {
                    const Icon = item.icon;
                    const isExpanded = expandedFunctions[item.id];

                    return (
                        <div key={i}
                            className={`glass-pro transition-all duration-500 overflow-hidden relative group ${isExpanded ? 'border-nist-primary/40 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'hover:border-white/10 hover:bg-white/5'}`}
                            style={{
                                borderLeft: `6px solid ${item.color}`
                            }}>
                            {isExpanded && <div className="absolute inset-0 bg-gradient-to-br from-nist-primary/5 to-transparent pointer-events-none" />}

                            <div
                                onClick={() => toggleFunction(item.id)}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 cursor-pointer relative z-10"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                                        <Icon className="w-7 h-7" style={{ color: item.color }} />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-display font-bold tracking-tight text-text-title">{item.id} Function</h3>
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold uppercase tracking-widest text-text-dim border border-white/10">{item.phase}</span>
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-nist-primary" /> : <ChevronRight className="w-4 h-4 text-text-dim" />}
                                        </div>
                                        <div className="text-[10px] text-text-dim font-bold uppercase tracking-[0.2em]">
                                            Deploy Window: {item.duration}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-[9px] font-bold text-text-dim uppercase tracking-[0.2em] mb-1">Maturity Status</div>
                                        <div className="font-display font-bold text-xs uppercase tracking-tight" style={{ color: item.color }}>{item.status.replace('-', ' ')}</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] ${item.status === 'in-progress' ? 'bg-nist-primary shadow-[0_0_12px_rgba(99,102,241,0.5)]' :
                                        item.status === 'completed' ? 'bg-nist-success shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                                            'bg-gray-700'
                                        }`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-8 pb-10 relative z-10 animate-in delay-100">
                                    <div className="flex flex-col gap-6">
                                        {item.categories.length > 0 ? (
                                            <div className="flex flex-col gap-5 border-l border-white/5 pl-8 ml-7">
                                                {item.categories.map((cat, j) => {
                                                    const catKey = `${item.id}-${cat.name}`;
                                                    const isCatExpanded = expandedCategories[catKey];

                                                    return (
                                                        <div key={j} className="glass-pro !bg-white/5 border-white/5 overflow-hidden transition-all hover:border-white/10">
                                                            <div
                                                                onClick={() => toggleCategory(item.id, cat.name)}
                                                                className="flex items-center justify-between p-5 cursor-pointer relative"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                                                                        <span className="text-[11px] font-display font-bold text-text-title">{cat.tasks.length}</span>
                                                                    </div>
                                                                    <h4 className="font-display font-bold text-sm text-text-title tracking-tight">{cat.name}</h4>
                                                                </div>
                                                                {isCatExpanded ? <ChevronDown className="w-4 h-4 text-nist-primary" /> : <ChevronRight className="w-4 h-4 text-text-dim" />}
                                                            </div>

                                                            {isCatExpanded && (
                                                                <div className="px-5 pb-6 flex flex-col gap-4 animate-in">
                                                                    {cat.tasks.map((task, k) => (
                                                                        <div key={k} className="flex flex-col gap-3 bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-widest ${task.score === 0 ? 'text-text-dim' :
                                                                                        task.score === 1 ? 'text-nist-danger border-nist-danger/20 bg-nist-danger/5' :
                                                                                            'text-nist-warning border-nist-warning/20 bg-nist-warning/5'
                                                                                        }`}>
                                                                                        Maturity: {task.score}.0
                                                                                    </span>
                                                                                    <span className="text-xs font-display font-bold text-text-title tracking-tight">{task.label}: {task.name}</span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-[11px] text-text-dim leading-relaxed whitespace-pre-line border-t border-white/5 pt-3">
                                                                                {task.guidance}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-5 p-8 glass-pro !bg-nist-success/5 border-nist-success/20 ml-7 animate-in">
                                                <div className="w-12 h-12 rounded-full bg-nist-success/10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                                    <CheckCircle2 className="w-6 h-6 text-nist-success" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h4 className="font-display font-bold text-nist-success text-sm tracking-tight">Compliance Threshold Reached</h4>
                                                    <p className="text-nist-success/70 text-xs leading-relaxed">System diagnostics confirm all subcategories in this function meet institutional maturity expectations. No active gaps detected.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
