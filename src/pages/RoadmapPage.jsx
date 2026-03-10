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
        <div className="flex flex-col gap-8 max-w-5xl mx-auto h-full animated-fade-in pb-20">
            <header className="border-b border-gray-200 dark:border-gray-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-indigo-500" />
                        Implementation Roadmap
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">A phased approach integrating the NIST CSF 2.0 functions into an actionable timeline, prioritized by your current assessment gaps.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-100 dark:border-indigo-800"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
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
                            className={`card-pro transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
                            style={{
                                borderLeft: `4px solid ${item.color}`
                            }}>

                            <div
                                onClick={() => toggleFunction(item.id)}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                                        style={{ backgroundColor: `${item.color}10` }}>
                                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-extrabold uppercase tracking-tight" style={{ color: item.textOverride }}>{item.phase}: {item.name}</h3>
                                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                            {item.duration}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block mr-2">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</div>
                                        <div className="font-extrabold text-[10px] uppercase" style={{ color: item.textOverride }}>{item.status.replace('-', ' ')}</div>
                                    </div>
                                    <span className={`px-3 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest border ${item.status === 'in-progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800' :
                                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' :
                                            'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                        }`}
                                        style={item.status === 'in-progress' ? { backgroundColor: `${item.color}10`, color: item.textOverride, borderColor: `${item.color}25` } : {}}
                                    >
                                        {item.status.replace('-', ' ')}
                                    </span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-6 pb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="flex flex-col gap-4">
                                        {item.categories.length > 0 ? item.categories.map((cat, j) => {
                                            const catKey = `${item.id}-${cat.name}`;
                                            const isCatExpanded = expandedCategories[catKey];

                                            return (
                                                <div key={j} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                                                    <div
                                                        onClick={() => toggleCategory(item.id, cat.name)}
                                                        className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                                                <span className="text-[10px] font-extrabold" style={{ color: item.textOverride }}>{cat.tasks.length}</span>
                                                            </div>
                                                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{cat.name}</h4>
                                                        </div>
                                                        {isCatExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                    </div>

                                                    {isCatExpanded && (
                                                        <div className="px-3.5 pb-3.5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                            {cat.tasks.map((task, k) => (
                                                                <div key={k} className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest ${task.score === 0 ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                                                                            task.score === 1 ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                                                'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                                            }`}>
                                                                            Maturity: {task.score}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.label}: {task.name}</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line px-0.5">
                                                                        {task.guidance}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }) : (
                                            <div className="flex items-center gap-3 p-6 bg-green-50/50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/30">
                                                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                                <span className="text-green-800 dark:text-green-300 font-semibold">
                                                    Compliance Accomplished: Your assessment indicates all subcategories in this function meet maturity expectations.
                                                </span>
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
