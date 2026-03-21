import { useMemo, useState } from 'react';
import { useAssessment } from '../context/AssessmentContext';
import { Calendar, Trash2, Info, ChevronRight, Activity, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function RoadmapPage() {
    const { projectId } = useParams();
    const { assessmentData, updateActionPlan } = useAssessment();
    const actionPlan = assessmentData?.actionPlan || [];

    const FUNCTIONS = ['All', 'Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    const [activeFilter, setActiveFilter] = useState('All');

    // Auxiliary to fetch Function context from ID (e.g., ID.AM-01 -> Identify)
    const getFuncMeta = (id) => {
        if (id.startsWith('GV')) return { name: 'Govern', color: assessmentData.nistColors?.['Govern'] || '#FFB300' };
        if (id.startsWith('ID')) return { name: 'Identify', color: assessmentData.nistColors?.['Identify'] || '#4FB6E1' };
        if (id.startsWith('PR')) return { name: 'Protect', color: assessmentData.nistColors?.['Protect'] || '#9186E1' };
        if (id.startsWith('DE')) return { name: 'Detect', color: assessmentData.nistColors?.['Detect'] || '#FFB347' };
        if (id.startsWith('RS')) return { name: 'Respond', color: assessmentData.nistColors?.['Respond'] || '#EB7979' };
        if (id.startsWith('RC')) return { name: 'Recover', color: assessmentData.nistColors?.['Recover'] || '#82EEA2' };
        return { name: 'Core', color: '#3b82f6' };
    };

    const filteredPlan = useMemo(() => {
        if (activeFilter === 'All') return actionPlan;
        return actionPlan.filter(item => getFuncMeta(item.id).name === activeFilter);
    }, [actionPlan, activeFilter]);

    // Grouping by NIST Function for Sidebar layout
    const groupedPlan = useMemo(() => {
        const groups = {
            'Govern': [], 'Identify': [], 'Protect': [], 'Detect': [], 'Respond': [], 'Recover': []
        };
        filteredPlan.forEach(item => {
            const name = getFuncMeta(item.id).name;
            if (groups[name]) groups[name].push(item);
        });
        return groups;
    }, [filteredPlan, actionPlan]); // force recaches with actionPlan updates


    const countByFunction = useMemo(() => {
        const counts = { All: actionPlan.length };
        ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'].forEach(fn => {
            counts[fn] = actionPlan.filter(item => getFuncMeta(item.id).name === fn).length;
        });
        return counts;
    }, [actionPlan]);

    // 1. Calculate Timeline Boundaries for Canvas
    const { minDate, maxDate, months, totalDays } = useMemo(() => {
        if (actionPlan.length === 0) return { minDate: null, maxDate: null, months: [], totalDays: 0 };

        const dates = [];
        actionPlan.forEach(item => {
            if (item.startDate) dates.push(new Date(item.startDate));
            if (item.endDate) dates.push(new Date(item.endDate));
        });

        if (dates.length === 0) return { minDate: null, maxDate: null, months: [], totalDays: 0 };

        let min = new Date(Math.min(...dates));
        let max = new Date(Math.max(...dates));

        // Standardize headers
        min.setDate(1);
        max.setMonth(max.getMonth() + 1);
        max.setDate(0); 

        const monthList = [];
        let current = new Date(min);
        while (current <= max) {
            monthList.push({
                label: current.toLocaleString('default', { month: 'short', year: 'numeric' }),
                timestamp: current.getTime()
            });
            current.setMonth(current.getMonth() + 1);
        }

        const span = (max - min) / (1000 * 60 * 60 * 24);

        return { minDate: min, maxDate: max, months: monthList, totalDays: span };
    }, [actionPlan]);

    const getPercentage = (date) => {
        if (!date || !minDate || totalDays === 0) return 0;
        const d = new Date(date);
        const diff = (d - minDate) / (1000 * 60 * 60 * 24);
        return Math.min(100, Math.max(0, (diff / totalDays) * 100));
    };

    const handleUpdateItem = (id, field, value) => {
        updateActionPlan(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (id) => {
        updateActionPlan(prev => prev.filter(item => item.id !== id));
    };

    if (actionPlan.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] text-center animate-in px-4">
                <div className="w-20 h-20 rounded-2xl glass-pro flex items-center justify-center mb-6 glow-accent">
                    <Calendar className="w-10 h-10 text-nist-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 tracking-tight text-text-title">Empty Implementation Roadmap</h2>
                <p className="text-text-dim max-w-md mx-auto leading-relaxed text-sm mb-6">
                    You haven't added any controls to your roadmap yet. Go to your active projects categories and use the <Plus className="inline w-3.5 h-3.5 mx-1" /> button to trigger scheduling.
                </p>
                <Link to={`/project/${projectId}`} className="px-6 py-3 rounded-xl bg-nist-primary/10 text-nist-primary text-xs font-bold hover:bg-nist-primary/20 transition-all border border-nist-primary/20 uppercase tracking-widest">
                    Back to Assessment
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 max-w-7xl mx-auto h-full px-4 pb-24 animate-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="flex flex-col gap-3">
                    <h2 className="text-4xl font-display font-bold tracking-tight text-text-title flex items-center gap-4">
                        <Activity className="w-10 h-10 text-nist-primary" />
                        Implementation Strategy
                    </h2>
                    <p className="text-text-dim text-sm max-w-2xl leading-relaxed italic border-l-2 border-nist-primary pl-4">
                        Dynamic scheduling and customization suite. Reshape Guidance frameworks into actionable intervals supporting institutional security priorities.
                    </p>
                </div>
            </header>

            {/* Function Filter Tabs */}
            <div className="flex flex-wrap gap-2 pb-2">
                {FUNCTIONS.map(fn => {
                    const colorMap = {
                        All: '#6b7280', Govern: '#FFB300', Identify: '#4FB6E1',
                        Protect: '#9186E1', Detect: '#FFB347', Respond: '#EB7979', Recover: '#82EEA2'
                    };
                    const color = colorMap[fn];
                    const isActive = activeFilter === fn;
                    const count = countByFunction[fn] || 0;
                    return (
                        <button
                            key={fn}
                            onClick={() => setActiveFilter(fn)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border cursor-pointer ${
                                isActive
                                    ? 'text-white border-transparent shadow-md'
                                    : 'text-text-dim border-white/10 hover:border-white/20 bg-white/5'
                            }`}
                            style={isActive ? { backgroundColor: color, boxShadow: `0 0 12px ${color}40` } : {}}
                        >
                            {fn}
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* 🔧 Panel 1: Settings & Cards */}
                <div className="flex flex-col gap-5 overflow-y-auto max-h-[700px] pr-2 hidden-scrollbar">
                    <div className="flex flex-col gap-1 mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Configuration Board</h3>
                        <p className="text-[10px] text-text-dim/60 italic">Customize targets and guidance details</p>
                    </div>
                    {filteredPlan.map(item => {
                        const meta = getFuncMeta(item.id);
                        return (
                            <div key={item.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 relative group transition-all hover:bg-white/10">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] font-bold font-mono tracking-widest uppercase mb-1" style={{ color: meta.color }}>{item.id} • {meta.name}</span>
                                        <span className="text-xs font-display font-bold text-text-title tracking-tight truncate">{item.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-text-dim hover:text-nist-danger transition-colors p-1"
                                        title="Remover"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Start Date</label>
                                        <input 
                                            type="date" 
                                            value={item.startDate || ''} 
                                            onChange={(e) => handleUpdateItem(item.id, 'startDate', e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-title outline-none focus:border-nist-primary/50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[8px] font-bold uppercase tracking-widest text-text-dim">End Date</label>
                                        <input 
                                            type="date" 
                                            value={item.endDate || ''} 
                                            onChange={(e) => handleUpdateItem(item.id, 'endDate', e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-title outline-none focus:border-nist-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-text-dim">Notes / Guidance</label>
                                    <textarea 
                                        value={item.customGuidance || ''} 
                                        onChange={(e) => handleUpdateItem(item.id, 'customGuidance', e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-text-body resize-y min-h-[60px] outline-none focus:border-nist-primary/50 leading-relaxed"
                                        placeholder="Add descriptive guidance notes..."
                                    />
                                </div>
                            </div>
                        );
                    })}
                    {filteredPlan.length === 0 && (
                        <div className="py-12 text-center text-text-dim text-[11px] opacity-50 bg-white/3 border border-dashed border-white/10 rounded-2xl">
                            No items scheduled for {activeFilter}
                        </div>
                    )}
                </div>

                {/* 📊 Panel 2: Gantt Chart View */}
                <div className="xl:col-span-2 glass-pro p-6 flex flex-col gap-5 min-h-[500px] overflow-x-auto shadow-inner relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-title">Visual Allocation timeline</h3>
                            <p className="text-[10px] text-text-dim/60 italic">Interactive Interval Spanning</p>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-w-[600px] relative">
                        {/* Headers with offset wrapper */}
                        <div className="flex">
                            <div className="w-24 shrink-0" /> {/* Sidebar Spacer */}
                            <div className="flex-1 grid border-b border-black/5 pb-3 mb-4" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                                {months.map((m, idx) => (
                                    <div key={idx} className="text-center text-[9px] font-bold text-text-dim uppercase tracking-wider border-r border-dashed border-slate-300 last:border-0">
                                        {m.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chart Body */}
                        <div className="flex-1 flex flex-col gap-4 relative">
                            {Object.entries(groupedPlan).map(([funcName, items]) => (
                                items.length > 0 && (
                                    <div key={funcName} className="flex border-b border-dashed border-slate-200/40 last:border-0 min-h-[44px]">
                                        {/* Sticky Left Sidebar Column */}
                                        <div className="w-24 shrink-0 flex items-center justify-center border-r border-slate-200 bg-slate-50/10 sticky left-0 z-20 backdrop-blur-sm">
                                            <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: getFuncMeta(items[0].id).color }}>
                                                {funcName === 'Govern' ? 'GV' : funcName.substring(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        
                                        {/* Right Chart Canvas */}
                                        <div className="flex-1 flex flex-col gap-2 p-2 relative">
                                            {/* Static vertical Grid Lines */}
                                            <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
                                                {months.map((_, idx) => (
                                                    <div key={idx} className="border-r border-dashed border-slate-300/40 h-full last:border-0" />
                                                ))}
                                            </div>

                                            {/* Dynamic range bars */}
                                            {items.map(item => {
                                                const meta = getFuncMeta(item.id);
                                                const startPct = getPercentage(item.startDate);
                                                const endPct = getPercentage(item.endDate);
                                                const widthPct = Math.max(2, endPct - startPct);

                                                return (
                                                    <div key={item.id} className="h-10 flex items-center relative group z-10 border-b border-dashed border-slate-200 last:border-0">
                                                        <div 
                                                            className="absolute h-6 rounded-xl flex items-center px-3 shadow-md transition-all group-hover:shadow-lg group-hover:brightness-110 cursor-pointer overflow-hidden border"
                                                            style={{ 
                                                                left: `${startPct}%`, 
                                                                width: `${widthPct}%`,
                                                                backgroundColor: `${meta.color}15`,
                                                                borderColor: `${meta.color}30`,
                                                            }}
                                                            title={`${item.id}: ${item.startDate} to ${item.endDate}`}
                                                        >
                                                            <div className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: meta.color }} />
                                                            <span className="text-[10px] font-bold text-text-title truncate">{item.id}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            ))}

                            {filteredPlan.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center relative z-10">
                                    <div className="text-text-dim text-xs font-bold opacity-50 mb-1">
                                        No controls for <span className="uppercase">{activeFilter}</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim/40">
                                        Adjust filters or execute roadmap assessments
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
