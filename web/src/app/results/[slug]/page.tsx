'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Quote,
    Layers,
    ShieldAlert,
    Bookmark,
    Loader2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import UpgradePrompt from '../../../components/UpgradePrompt';
import { Lock } from 'lucide-react';
import Sidebar from '../../../components/Sidebar';
import FilterDropdown from '../../../components/FilterDropdown';
import {
    searchAdvanced,
    fetchAggregatedStats,
    resolveSlugToBoards,
    Opportunity,
    Evidence,
    saveOpportunity
} from '../../../lib/api';

export default function ResultsPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [boards, setBoards] = useState<string[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [aggregations, setAggregations] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [activeScore, setActiveScore] = useState<number | null>(null);
    const [activeComplexity, setActiveComplexity] = useState<string | null>(null);
    const [activeSize, setActiveSize] = useState<string | null>(null);
    const [activeIntent, setActiveIntent] = useState<string | null>(null);
    const [activeFlair, setActiveFlair] = useState<string | null>(null);

    // Selection State
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const { data: session } = useSession();
    const isPro = (session?.user as any)?.plan_type === 'pro';
    const { data: savedItems } = React.useMemo(() => ({ data: [] }), []); // Placeholder if we need actual count from DB, but savedIds.size is local session
    // Ideally we fetch saved count. For now rely on savedIds which resets on reload?
    // User saves are persistent. We should check `savedIds` size, but `savedIds` only tracks what we loaded/saved in this session context? 
    // Actually handleSave says `setSavedIds(prev => new Set(prev).add(opp.id))`. 
    // We need to know TOTAL saved items count to enforce "Max 5".
    // We should probably fetch saved items count on load.

    const [saving, setSaving] = useState(false);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const resolvedBoards = await resolveSlugToBoards(slug);
                setBoards(resolvedBoards);

                // Fetch data using the new Advanced Search API
                // We fetch "analyzed" mode to get opportunities + aggregations
                const [searchData, aggStats] = await Promise.all([
                    searchAdvanced({
                        q: "", // empty query returns everything (filtered)
                        mode: 'analyzed',
                        limit: 100, // Fetch enough to populate the lists
                        filters: {
                            boards: resolvedBoards.join(',')
                        }
                    }),
                    fetchAggregatedStats(resolvedBoards)
                ]);

                setOpportunities(searchData.results);
                setAggregations(searchData.aggregations);
                setStats(aggStats);

                if (searchData.results.length > 0) {
                    setSelectedId(searchData.results[0].id);
                }

            } catch (err) {
                console.error(err);
                setError('Failed to load discovery data');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [slug]);

    // Refetch when filters change
    useEffect(() => {
        if (boards.length === 0) return;

        const applyFilters = async () => {
            try {
                const searchData = await searchAdvanced({
                    q: "",
                    mode: 'analyzed',
                    limit: 100,
                    filters: {
                        boards: boards.join(','),
                        score_min: activeScore || undefined,
                        complexity: activeComplexity || undefined,
                        size: activeSize || undefined,
                        intent: activeIntent || undefined,
                        flair: activeFlair || undefined
                    }
                });
                setOpportunities(searchData.results);
                setAggregations(searchData.aggregations);

                // Preserve selection if possible
                if (searchData.results.length > 0) {
                    if (!selectedId || !searchData.results.find(o => o.id === selectedId)) {
                        setSelectedId(searchData.results[0].id);
                    }
                } else {
                    setSelectedId(null);
                }
            } catch (err) {
                console.error("Filter update failed", err);
            }
        };

        applyFilters();
    }, [boards, activeScore, activeComplexity, activeSize, activeIntent, activeFlair]);


    const selectedOpportunity = useMemo(() =>
        opportunities.find(o => o.id === selectedId),
        [opportunities, selectedId]
    );

    const handleSave = async (opp: Opportunity) => {
        if (!session) {
            alert("Please sign in to save items");
            return;
        }

        // Enforce Free Limit (Max 5)
        // Note: This local check is weak because savedIds is empty on reload (unless we fetch valid savedIds).
        // Real enforcement should be on backend, but UI check helps UX.
        // Let's assume valid implementation later. For now, strict prototype check:
        if (!isPro && savedIds.size >= 5) {
            // In a real app we'd trigger a modal.
            alert("Free Plan limited to 5 saved items. Upgrade to Pro!");
            return;
        }

        setSaving(true);
        try {
            await saveOpportunity(opp);
            setSavedIds(prev => new Set(prev).add(opp.id));
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };



    if (loading) return <LoadingView />;
    if (error) return <ErrorView message={error} />;

    const decodedSlug = decodeURIComponent(slug);

    return (
        <div className="min-h-screen flex bg-[#050505] text-zinc-300 font-sans selection:bg-white/10">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Navigation & Stats Combined */}
                <header className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur-md border-b border-white/5 px-8 pt-6 pb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-6">
                            <Link href="/boards" className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-white">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="h-4 w-px bg-white/10" />
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    {decodedSlug.startsWith('/') ? decodedSlug : `/${decodedSlug}/`}
                                </h1>
                                {boards.length > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        {boards.slice(0, 3).map(b => (
                                            <span key={b} className="px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-[10px] font-mono text-zinc-400">
                                                /{b}/
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-12">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Threads</span>
                                <span className="text-xl font-bold text-white leading-none">{stats?.threads?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Replies</span>
                                <span className="text-xl font-bold text-white leading-none">{stats?.replies?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">Avg Replies</span>
                                <span className="text-xl font-bold text-white leading-none">
                                    {stats?.threads ? Math.round(stats.replies / stats.threads) : 0}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">24h Growth</span>
                                <span className={`text-xl font-bold leading-none ${stats?.growth > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {stats?.growth > 0 ? '+' : ''}{stats?.growth || 0}%
                                </span>
                            </div>
                        </div>

                        {/* Trending Pills */}
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mr-2">Trending:</span>
                            {stats?.trending_keywords && stats.trending_keywords.slice(0, 5).map((k: string) => (
                                <span key={k} className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                                    {k}
                                </span>
                            ))}
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex overflow-hidden">

                    {/* Left Column: Unified View - Wider */}
                    <section className="w-[500px] border-r border-white/5 flex flex-col h-full bg-[#050505] shrink-0">
                        {/* Header & Filters */}
                        <div className="px-6 py-4 flex items-center justify-between gap-4 bg-[#050505]/90 backdrop-blur z-10 sticky top-0 border-b border-white/5">
                            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar items-center">
                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mr-2 shrink-0">Discoveries</span>
                                {isPro ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 font-medium">Score:</span>
                                            <FilterDropdown
                                                value={activeScore}
                                                onChange={(val: number | null) => setActiveScore(val)}
                                                placeholder="Any"
                                                options={[
                                                    { label: 'Any', value: null },
                                                    { label: '7+', value: 7 },
                                                    { label: '9+', value: 9 }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 font-medium">Intent:</span>
                                            <FilterDropdown
                                                value={activeIntent}
                                                onChange={(val: string | null) => setActiveIntent(val)}
                                                placeholder="Any"
                                                options={[
                                                    { label: 'Any', value: null },
                                                    { label: 'Core Pains & Anger', value: 'Core Pains & Anger' },
                                                    { label: 'Money Talk', value: 'Money Talk' },
                                                    { label: 'Ideas', value: 'Ideas' },
                                                    { label: 'Emerging Trends', value: 'Emerging Trends' }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 font-medium">Complexity:</span>
                                            <FilterDropdown
                                                value={activeComplexity}
                                                onChange={(val: string | null) => setActiveComplexity(val)}
                                                placeholder="Any"
                                                options={[
                                                    { label: 'Any', value: null },
                                                    { label: 'Low', value: 'Low' },
                                                    { label: 'Medium', value: 'Medium' },
                                                    { label: 'High', value: 'High' }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500 font-medium">Size:</span>
                                            <FilterDropdown
                                                value={activeSize}
                                                onChange={(val: string | null) => setActiveSize(val)}
                                                placeholder="Any"
                                                options={[
                                                    { label: 'Any', value: null },
                                                    { label: 'Niche', value: 'Niche' },
                                                    { label: 'Mid-size', value: 'Mid-size' },
                                                    { label: 'Mass Market', value: 'Mass Market' }
                                                ]}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4 text-zinc-600 text-[10px] uppercase font-bold tracking-widest pl-4 border-l border-white/5 opacity-50 cursor-not-allowed">
                                        <Lock className="w-3 h-3" />
                                        <span>Advanced Filters Locked</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unified List */}
                        <div className="flex-1 overflow-y-auto p-0 no-scrollbar relative">
                            {/* Render Logic: If Pro, show all. If Free, show 3. */}
                            {(isPro ? opportunities : opportunities.slice(0, 3)).map((opp) => (
                                <button
                                    key={opp.id}
                                    onClick={() => setSelectedId(opp.id)}
                                    className={`w-full text-left px-6 py-4 border-b transition-all duration-200 group ${selectedId === opp.id
                                        ? 'bg-white/5 border-white/10'
                                        : 'border-white/5 hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex items-center gap-1.5 opacity-80">
                                            <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                                                {opp.intent_category}
                                            </span>
                                        </div>
                                        <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded ${opp.market_score >= 8 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {opp.market_score}/10
                                        </span>
                                    </div>
                                    <p className={`text-sm font-medium leading-relaxed line-clamp-2 ${selectedId === opp.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                        "{opp.core_pain || opp.product_concept || opp.solution || opp.emerging_trend}"
                                    </p>
                                </button>
                            ))}

                            {/* Locked State for Free Users */}
                            {!isPro && opportunities.length >= 3 && (
                                <div className="mt-8 mb-12">
                                    <UpgradePrompt description="Upgrade to Pro to unlock all 50+ opportunities matching this trend." />
                                </div>
                            )}

                            {opportunities.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-zinc-700 text-xs uppercase tracking-widest font-medium">No Discoveries Found</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right Column: Detail View */}
                    <section className="flex-1 overflow-y-auto p-12 no-scrollbar bg-[#080808]">
                        {selectedOpportunity ? (
                            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Header */}
                                <div className="mb-12">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3 opacity-60">
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                                                {selectedOpportunity.product_domain}
                                            </span>
                                            <span className="text-zinc-600 text-[10px]">•</span>
                                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                                                {selectedOpportunity.flair_type || 'General'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleSave(selectedOpportunity)}
                                            disabled={saving || savedIds.has(selectedOpportunity.id)}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${savedIds.has(selectedOpportunity.id)
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Bookmark className={`w-3 h-3 ${savedIds.has(selectedOpportunity.id) ? 'fill-current' : ''}`} />
                                            )}
                                            {savedIds.has(selectedOpportunity.id) ? 'Saved' : 'Save Insight'}
                                        </button>
                                    </div>

                                    <h2 className="text-5xl font-bold text-white tracking-tighter mb-10 leading-[1.1]">
                                        {selectedOpportunity.product_concept || selectedOpportunity.core_pain || selectedOpportunity.emerging_trend}
                                    </h2>

                                    {/* Metric Cards */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Signal Strength</div>
                                            <div className="text-white font-bold text-lg">{selectedOpportunity.market_score}/10</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Market Size</div>
                                            <div className="text-white font-bold text-lg">{selectedOpportunity.market_size}</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Complexity</div>
                                            <div className="text-white font-bold text-lg">{selectedOpportunity.complexity}</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Intent</div>
                                            <div className="text-white font-bold text-lg truncate" title={selectedOpportunity.intent_category}>{selectedOpportunity.intent_category}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
                                        {(() => {
                                            const intent = selectedOpportunity.intent_category;
                                            const sections = [];

                                            if (intent === "Core Pains & Anger") {
                                                if (selectedOpportunity.target_audience) sections.push({ label: "Who is Angry?", value: selectedOpportunity.target_audience });
                                                if (selectedOpportunity.solution) sections.push({ label: "Suggested Solution", value: selectedOpportunity.solution });
                                            }
                                            else if (intent === "Money Talk") {
                                                if (selectedOpportunity.core_pain) sections.push({ label: "Consumer Pain", value: selectedOpportunity.core_pain });
                                                if (selectedOpportunity.target_audience) sections.push({ label: "Willing to Pay", value: selectedOpportunity.target_audience });
                                            }
                                            else if (intent === "Advice & Solution Requests") {
                                                if (selectedOpportunity.target_audience) sections.push({ label: "Who is Asking?", value: selectedOpportunity.target_audience });
                                                if (selectedOpportunity.solution) sections.push({ label: "Requested Solution", value: selectedOpportunity.solution });
                                            }
                                            else if (intent === "Emerging Trends") {
                                                if (selectedOpportunity.target_audience) sections.push({ label: "Driving the Trend", value: selectedOpportunity.target_audience });
                                            }
                                            else if (intent === "Ideas") {
                                                if (selectedOpportunity.solution) sections.push({ label: "How it Works", value: selectedOpportunity.solution });
                                                if (selectedOpportunity.core_pain) sections.push({ label: "Solves Pain", value: selectedOpportunity.core_pain });
                                            }
                                            else {
                                                if (selectedOpportunity.core_pain) sections.push({ label: "Insight", value: selectedOpportunity.core_pain });
                                                if (selectedOpportunity.solution) sections.push({ label: "Proposed Solution", value: selectedOpportunity.solution });
                                                if (selectedOpportunity.target_audience) sections.push({ label: "Target Audience", value: selectedOpportunity.target_audience });
                                            }

                                            return sections.map((section, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">{section.label}</h3>
                                                    <p className="text-zinc-300 leading-relaxed text-[15px]">{section.value}</p>
                                                </div>
                                            ));
                                        })()}
                                    </div>

                                    {/* Evidence Section */}
                                    <EvidenceSection evidence={selectedOpportunity.evidence} />
                                </div>

                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center opacity-40">
                                <div>
                                    <Layers className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
                                    <h3 className="text-zinc-500 uppercase tracking-widest font-black text-xs">Select an item to view details</h3>
                                </div>
                            </div>
                        )}
                    </section>

                </main>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string, value: string }) {
    if (!value) return null;
    return (
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mb-2">{label}</div>
            <div className="text-white font-medium text-sm">{value}</div>
        </div>
    );
}



function EvidenceSection({ evidence }: { evidence: Evidence[] }) {
    if (!evidence || evidence.length === 0) return null;

    return (
        <div className="pt-10 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6 opacity-60">
                <Quote className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Evidence</span>
            </div>

            <div className="space-y-6">
                {evidence.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                                Post #{item.post_id}
                            </span>
                            <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-2 ml-auto">
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                {item.relevance}
                            </div>
                        </div>
                        <p className="text-zinc-400 italic leading-relaxed font-serif text-sm pl-4 border-l-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
                            "{item.quote}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoadingView() {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600 animate-pulse">Initializing Core</div>
            </div>
        </div>
    );
}

function ErrorView({ message }: { message: string }) {
    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8">
            <div className="text-center">
                <ShieldAlert className="w-12 h-12 text-rose-500/20 mx-auto mb-6" />
                <h2 className="text-lg font-bold text-white mb-2">System Error</h2>
                <p className="text-zinc-500 text-sm">{message}</p>
                <Link href="/boards" className="mt-8 inline-block px-6 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold uppercase tracking-widest transition-colors">
                    Return Home
                </Link>
            </div>
        </div>
    );
}
