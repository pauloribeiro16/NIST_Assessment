import React from 'react';

export default function AgentRecommendationBanner({ title, description, agents = [] }) {
    if (!agents || agents.length === 0) return null;

    return (
        <div className="bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    <span className="text-xl">🤖</span>
                </div>
                <div className="flex flex-col">
                    <h4 className="text-sm font-black uppercase tracking-tight text-slate-900">{title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{description}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {agents.map((agent, idx) => {
                    const bgColors = {
                        orange: 'bg-orange-50 text-orange-700',
                        indigo: 'bg-indigo-50 text-indigo-700',
                        emerald: 'bg-emerald-50 text-emerald-700',
                        rose: 'bg-rose-50 text-rose-700',
                        purple: 'bg-purple-50 text-purple-700',
                        slate: 'bg-slate-50 text-slate-700'
                    };
                    const colorClass = bgColors[agent.color] || bgColors.indigo;

                    return (
                        <div key={idx} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${colorClass} text-[9px] font-black uppercase tracking-wider`}>
                            <span>{agent.icon}</span> {agent.name}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
