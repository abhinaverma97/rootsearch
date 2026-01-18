
import { useMemo } from 'react';
import { Opportunity } from '../lib/api';

// Update Props Interface
interface SearchVisualizationsProps {
    data: any[];
    mode: 'live' | 'analyzed';
    total: number;
    aggregations?: any; // New prop
}

function BarChart({ title, data, className, colorClass = "bg-zinc-700" }: { title: string, data: { label: string, value: number, percent: number }[], className?: string, colorClass?: string }) {
    if (!data || data.length === 0) return null;
    const maxVal = Math.max(...data.map(d => d.value)); // Normalize bar width relative to max in set, or total?
    // Percent prop is already calculated relative to total, which effectively is what we want for "distribution".
    // But for visual bar length, scaling against the max value in the set often looks better than against total if one category dominates.
    // However, existing implementation passed 'percent' as % of total. Let's stick to that for consistency or check logic.
    // Logic below uses style={{ width: `${d.percent}%` }}.

    return (
        <div className={`mb-8 ${className}`}>
            <div className="flex items-center justify-between mb-3 px-1">
                <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{title}</h4>
                <span className="text-[10px] text-zinc-600 font-mono">{data.reduce((a, b) => a + b.value, 0)}</span>
            </div>
            <div className="space-y-2">
                {data.map((d, i) => (
                    <div key={i} className="group flex items-center gap-3 text-xs">
                        <div className="w-24 shrink-0 truncate text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors text-[10px]">{d.label}</div>
                        <div className="flex-1 h-3 bg-zinc-800/30 rounded-sm overflow-hidden relative">
                            {/* Glassmorphic Hollow Bar */}
                            <div
                                className="h-full rounded-sm bg-violet-500/20 border border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                                style={{ width: `${d.percent}%` }}
                            />
                        </div>
                        <div className="w-6 text-right text-[10px] font-mono text-zinc-600">{d.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SearchVisualizations({ data, mode, total, aggregations }: SearchVisualizationsProps) {

    const stats = useMemo(() => {
        if (mode === 'analyzed') {
            const opps = data as Opportunity[];

            // 1. Categories (Fallback to local if no aggregation)
            let categories = [];
            if (aggregations?.intent_counts) {
                // Actually intent_counts maps to "User Intent". 
            }

            // Calculate local stats for Categories & Flair (since backend doesn't provide them yet)
            const catCounts: Record<string, number> = {};
            opps.forEach(o => {
                if (o.category) catCounts[o.category] = (catCounts[o.category] || 0) + 1;
            });
            categories = Object.entries(catCounts)
                .map(([k, v]) => ({ label: k, value: v, percent: (v / opps.length) * 100 }))
                .sort((a, b) => b.value - a.value).slice(0, 5);

            // 2. Intent (Use Backend if available)
            let intents = [];
            if (aggregations?.intent_counts) {
                const totalIntents = Object.values(aggregations.intent_counts).reduce((a: number, b: any) => a + b, 0);
                intents = Object.entries(aggregations.intent_counts)
                    .map(([k, v]) => ({ label: k, value: v as number, percent: ((v as number) / totalIntents) * 100 }))
                    .sort((a, b) => b.value - a.value);
            } else {
                // Fallback local
                const intentCounts: Record<string, number> = {};
                opps.forEach(o => {
                    if (o.intent_category) intentCounts[o.intent_category] = (intentCounts[o.intent_category] || 0) + 1;
                });
                intents = Object.entries(intentCounts)
                    .map(([k, v]) => ({ label: k, value: v, percent: (v / opps.length) * 100 }))
                    .sort((a, b) => b.value - a.value);
            }

            // 3. Score Distribution (New - Backend Only)
            let scores: { label: string, value: number, percent: number }[] = [];
            if (aggregations?.score_distribution) {
                const totalScores = Object.values(aggregations.score_distribution).reduce((a: number, b: any) => a + b, 0);
                // Order purposefully: Low, Medium, High, Elite
                const order = ["Low (1-3)", "Medium (4-6)", "High (7-8)", "Elite (9-10)"];
                scores = order.map(k => {
                    const dim = aggregations.score_distribution as Record<string, number>;
                    const v = dim[k] || 0;
                    return { label: k, value: v, percent: totalScores ? (v / totalScores) * 100 : 0 };
                });
            }

            // 4. Flair (Local Fallback)
            const flairCounts: Record<string, number> = {};
            opps.forEach(o => {
                if (o.flair_type) flairCounts[o.flair_type] = (flairCounts[o.flair_type] || 0) + 1;
            });
            const flairs = Object.entries(flairCounts)
                .map(([k, v]) => ({ label: k, value: v, percent: (v / opps.length) * 100 }))
                .sort((a, b) => b.value - a.value).slice(0, 6);

            return { categories, intents, flairs, scores };
        } else {
            // Live Mode Stats
            const posts = data;

            // 1. Boards
            const boardCounts: Record<string, number> = {};
            posts.forEach((p: any) => {
                if (p.board) boardCounts[p.board] = (boardCounts[p.board] || 0) + 1;
            });
            const boards = Object.entries(boardCounts)
                .map(([k, v]) => ({ label: `/${k}/`, value: v, percent: (v / posts.length) * 100 }))
                .sort((a, b) => b.value - a.value).slice(0, 8);

            return { boards };
        }
    }, [data, mode, aggregations]);

    return (
        <div className="h-full overflow-y-auto px-8 py-10 bg-[#0A0A0B] border-l border-white/5 no-scrollbar">
            <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-1">Search Analytics</h3>
                <p className="text-zinc-500 text-xs">{total} results found in {mode} archive</p>
            </div>

            {mode === 'analyzed' && (
                <>
                    <BarChart title="Market Scores" data={stats.scores || []} />
                    <BarChart title="User Intent" data={stats.intents || []} />
                    <BarChart title="Top Categories" data={stats.categories || []} />
                    <BarChart title="Post Flair" data={stats.flairs || []} />
                </>
            )}

            {mode === 'live' && (
                <>
                    <BarChart title="Active Boards" data={stats.boards || []} />

                </>
            )}

            {data.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">No Metadata Available</span>
                </div>
            )}
        </div>
    );
}
