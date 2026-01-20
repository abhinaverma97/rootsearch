'use client';

// ... imports
import React, { useEffect, useState, useCallback, useRef } from 'react';
// ... other imports

// ... inside component

import { useSearchParams, useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import SearchResultCard from '../../components/SearchResultCard';
import SearchVisualizations from '../../components/SearchVisualizations';
import ThreadDetailView from '../../components/ThreadDetailView';
import { searchAdvanced, AdvancedSearchParams, Opportunity } from '../../lib/api';
import { Search, Filter, Database, Zap, Loader2, Info, Check, ChevronDown, X, ArrowLeft } from 'lucide-react';
import QuickGlance from '../../components/QuickGlance';
import FilterDropdown from '../../components/FilterDropdown';
import { BOARD_CATEGORIES } from '../../lib/categories';
import { useSession } from 'next-auth/react';
import UpgradePrompt from '../../components/UpgradePrompt';
import { Lock } from 'lucide-react';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const isPro = (session?.user as any)?.plan_type === 'pro';

    // URL State Sync
    const initialQuery = searchParams.get('q') || '';
    const initialMode = (searchParams.get('mode') as 'live' | 'analyzed') || 'analyzed';

    const [query, setQuery] = useState(initialQuery);
    const [mode, setMode] = useState<'live' | 'analyzed'>(initialMode);

    // Debounced query for API calls
    const debouncedQuery = useDebounce(query, 300);

    const [results, setResults] = useState<any[]>([]);
    const [aggregations, setAggregations] = useState<any>(null); // New state
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [showFilters, setShowFilters] = useState(true);
    const [scoreMin, setScoreMin] = useState<number>(0);
    const [complexity, setComplexity] = useState<string>('');
    const [intent, setIntent] = useState<string>(''); // New State
    const [category, setCategory] = useState<string>(''); // Industry State
    const [selectedBoards, setSelectedBoards] = useState<string[]>([]); // Board Filter

    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    // Sorting State
    const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Selection State for Live Mode
    const [selectedLiveItem, setSelectedLiveItem] = useState<{ board: string, thread_id: number, post_id: number } | null>(null);
    // Selection State for Analyzed Mode
    const [selectedAnalyzedItem, setSelectedAnalyzedItem] = useState<Opportunity | null>(null);

    const performSearch = useCallback(async (q: string, m: 'live' | 'analyzed', p: number = 1) => {
        if (m === 'live' && !q.trim()) {
            setResults([]);
            setTotal(0);
            setLoading(false);
            return;
        }

        if (p === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const params: AdvancedSearchParams = {
                q: q,
                mode: m,
                limit: 50,
                page: p,
                sort_by: sortBy,
                sort_order: sortOrder,
                filters: {
                    score_min: scoreMin || undefined,
                    complexity: complexity || undefined,
                    intent: intent || undefined,
                    category: category || undefined,
                    boards: selectedBoards.length > 0 ? selectedBoards.join(',') : undefined
                    // Add other filters here
                }
            };
            const data = await searchAdvanced(params);

            if (p === 1) {
                setResults(data.results);
                setAggregations(data.aggregations); // Update aggregations
            } else {
                setResults(prev => [...prev, ...data.results]);
                // Aggregations are global for the query, so technically they don't change on page 2, 
                // but usually you fetch them on initial search. Here we just update them again or keep same.
                if (data.aggregations) setAggregations(data.aggregations);
            }
            setTotal(data.meta.total);

            if (p === 1) {
                setSelectedLiveItem(null);
                setSelectedAnalyzedItem(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [scoreMin, complexity, intent, category, selectedBoards, sortBy, sortOrder]);

    // Effect: Trigger search when debounced query or mode changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set('q', debouncedQuery);
        params.set('mode', mode);
        if (category) params.set('category', category);
        if (intent) params.set('intent', intent);
        router.replace(`/search?${params.toString()}`, { scroll: false });

        setPage(1);
        performSearch(debouncedQuery, mode, 1);
    }, [debouncedQuery, mode, performSearch, router, sortBy, sortOrder, category, intent]); // Trigger on sort/filter change

    const handleLoadMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        performSearch(debouncedQuery, mode, nextPage);
    }, [page, debouncedQuery, mode, performSearch]);

    // Infinite Scroll Observer
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                // Allow free users unlimited results in live mode, limit to 3 in analyzed mode
                const canLoadMore = isPro || mode === 'live' || results.length < 3;
                if (entries[0].isIntersecting && !loadingMore && results.length < total && canLoadMore) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadingMore, results.length, total, handleLoadMore]);

    // Handle Result Click
    const handleResultClick = (item: any) => {
        if (mode === 'live') {
            setSelectedLiveItem({
                board: item.board,
                thread_id: item.thread_id,
                post_id: item.post_id
            });
        } else if (mode === 'analyzed') {
            setSelectedAnalyzedItem(item);
        }
        setShowMobileDetail(true);
    };

    // Mobile State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    return (
        <div className="min-h-screen flex bg-[#050505] text-zinc-300 font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-20 bg-[#050505] border-r border-white/10 h-full">
                        <Sidebar className="!flex !static h-full" />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col h-screen">
                {/* 1. Header (Unified Board-Style) */}
                <header className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 shrink-0">
                    <div className="w-full md:w-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {/* Mobile Hamburger */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-1 -ml-1 text-zinc-400 hover:text-white shrink-0"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
                            </button>
                            <h1 className="text-xl font-bold tracking-tight text-white shrink-0">Advanced Search</h1>
                        </div>

                        {/* Mobile: View Analytics Toggle (HIDDEN since we removed analytics on mobile) */}
                        {/* <button
                            onClick={() => setShowMobileDetail(!showMobileDetail)}
                            className="md:hidden text-xs font-bold uppercase tracking-wider text-violet-400 hover:text-violet-300"
                        >
                            {showMobileDetail ? "View Results" : "View Analytics"}
                        </button> */}
                    </div>

                    <div className="relative w-full md:flex-1 md:max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={mode === 'analyzed' ? "Search opportunities..." : "Search raw posts..."}
                            className="w-full bg-[#0A0A0B] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-all font-mono"
                            autoFocus
                        />
                        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />}
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 md:gap-4 overflow-x-auto no-scrollbar">
                        {/* Mode Toggle */}
                        <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-white/5 shrink-0">
                            <button
                                onClick={() => setMode('analyzed')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'analyzed' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <Zap className="w-3 h-3" />
                                Analyzed
                            </button>
                            <button
                                onClick={() => setMode('live')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'live' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <Database className="w-3 h-3" />
                                Live Archive
                            </button>
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-lg border transition-all shrink-0 ${showFilters ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10 text-zinc-500'}`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* 2. Filter Bar (Conditional) */}
                {showFilters && (
                    <div className="border-b border-white/5 bg-[#0A0A0B] px-6 py-3 flex items-center gap-6 animate-in slide-in-from-top-2 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 shrink-0">Filters</span>

                        {mode === 'analyzed' ? (
                            isPro ? (
                                <>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">Boards:</span>
                                        <BoardMultiSelect
                                            selected={selectedBoards}
                                            onChange={setSelectedBoards}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">Intent:</span>
                                        <FilterDropdown
                                            value={intent || null}
                                            onChange={(val: string | null) => setIntent(val || '')}
                                            options={[
                                                { label: 'Any', value: null },
                                                { label: 'Core Pains & Anger', value: 'Core Pains & Anger' },
                                                { label: 'Money Talk', value: 'Money Talk' },
                                                { label: 'Advice Requests', value: 'Advice Requests' },
                                                { label: 'Emerging Trends', value: 'Emerging Trends' },
                                                { label: 'Ideas', value: 'Ideas' }
                                            ]}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">Industry:</span>
                                        <FilterDropdown
                                            value={category || null}
                                            onChange={(val: string | null) => setCategory(val || '')}
                                            placeholder="All Industries"
                                            options={[
                                                { label: 'All', value: null },
                                                ...(aggregations?.category_counts ? Object.keys(aggregations.category_counts).map(k => ({ label: k, value: k })) : [])
                                            ]}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">Min Score:</span>
                                        <FilterDropdown
                                            value={scoreMin || 0}
                                            onChange={(val: number) => setScoreMin(val)}
                                            options={[
                                                { label: 'Any', value: 0 },
                                                { label: '5+', value: 5 },
                                                { label: '7+ (High)', value: 7 },
                                                { label: '9+ (Top)', value: 9 }
                                            ]}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-zinc-500">Complexity:</span>
                                        <FilterDropdown
                                            value={complexity || null}
                                            onChange={(val: string | null) => setComplexity(val || '')}
                                            options={[
                                                { label: 'Any', value: null },
                                                { label: 'Low', value: 'Low' },
                                                { label: 'Medium', value: 'Medium' },
                                                { label: 'High', value: 'High' }
                                            ]}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4 text-zinc-600 text-[10px] uppercase font-bold tracking-widest pl-4 border-l border-white/5 opacity-50 cursor-not-allowed shrink-0">
                                    <Lock className="w-3 h-3" />
                                    <span>Advanced Filters Locked</span>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-zinc-500 italic">Search Syntax:</span>
                                <div className="relative group">
                                    <Info className="w-4 h-4 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-72 p-4 bg-[#111113] border border-white/10 rounded-xl shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#111113] border-t border-l border-white/10 rotate-45"></div>
                                        <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Search Operators</h4>
                                        <ul className="space-y-2.5">
                                            <li className="flex items-start gap-2">
                                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] uppercase">Space</span>
                                                <span className="text-xs text-zinc-400 leading-tight">Acts as <strong className="text-violet-400">AND</strong>. Matches both terms.<br /><span className="text-[10px] opacity-50">"cat dog"</span></span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] uppercase">OR</span>
                                                <span className="text-xs text-zinc-400 leading-tight">Matches <strong className="text-violet-400">either</strong> term.<br /><span className="text-[10px] opacity-50">"cat OR dog"</span></span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">-</span>
                                                <span className="text-xs text-zinc-400 leading-tight">Acts as <strong className="text-red-400">NOT</strong>. Excludes term.<br /><span className="text-[10px] opacity-50">"cat -dog"</span></span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="h-4 w-px bg-white/10 mx-2 shrink-0"></div>

                        {/* Sorting UI */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-zinc-500">Sort:</span>
                            <FilterDropdown
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(val: string) => {
                                    const [s, o] = val.split('-');
                                    setSortBy(s as any);
                                    setSortOrder(o as any);
                                }}
                                options={[
                                    { label: 'Newest First', value: 'date-desc' },
                                    { label: 'Oldest First', value: 'date-asc' },
                                    ...(mode === 'analyzed' ? [
                                        { label: 'Highest Score', value: 'score-desc' },
                                        { label: 'Lowest Score', value: 'score-asc' }
                                    ] : [])
                                ]}
                            />
                        </div>


                        <div className="flex-1" />
                        <button
                            onClick={() => { setScoreMin(0); setComplexity(''); setIntent(''); setSelectedBoards([]); setSortBy('date'); setSortOrder('desc'); }}
                            className="text-[10px] uppercase font-bold text-zinc-600 hover:text-white shrink-0"
                        >Reset</button>
                    </div>
                )}

                {/* 3. Main Content (50/50 Split on Desktop, Toggle on Mobile) */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Left: Results List (Hidden on Mobile if Detail Open) */}
                    <div className={`
                        w-full md:w-1/2 overflow-y-auto no-scrollbar border-r border-white/5 bg-[#050505]
                        ${showMobileDetail ? 'hidden md:block' : 'block'}
                    `}>
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#050505]/95 backdrop-blur z-10">
                            <h2 className="text-sm font-bold text-zinc-300">Results</h2>
                            <span className="text-xs text-zinc-500 font-mono">{total} found</span>
                        </div>

                        <div className="min-h-[200px] pb-10">
                            {loading && results.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                    <span className="text-xs uppercase tracking-widest">Searching...</span>
                                </div>
                            ) : results.length > 0 ? (
                                <>
                                    {results.map((item, idx) => (
                                        <div key={item.id || item.post_id || idx} onClick={() => handleResultClick(item)}>
                                            <SearchResultCard
                                                data={item}
                                                mode={mode}
                                                highlightQuery={debouncedQuery}
                                                onClick={() => handleResultClick(item)}
                                            />
                                        </div>
                                    ))}

                                    {/* Infinite Scroll Trigger */}
                                    {results.length < total && (isPro || mode === 'live' || results.length < 3) && (
                                        <div ref={observerTarget} className="py-8 flex justify-center w-full">
                                            {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />}
                                        </div>
                                    )}

                                    {/* Locked State for Free Users in Analyzed Mode */}
                                    {!isPro && results.length > 0 && mode === 'analyzed' && (
                                        <div className="py-6 px-6">
                                            <UpgradePrompt minimal description="Upgrade to see all matching opportunities." />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-20">
                                    {mode === 'live' && !debouncedQuery ? (
                                        <p className="text-zinc-500 text-sm">Enter keywords to search the live archive</p>
                                    ) : (
                                        <p className="text-zinc-500 text-sm">No results found for "{debouncedQuery}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Visualizations & Detail Split (Hidden on Mobile unless Detail Open) */}
                    <div className={`
                        flex-1 h-full bg-[#0A0A0B] flex flex-col overflow-hidden
                        ${showMobileDetail ? 'flex w-full fixed md:static inset-0 z-30' : 'hidden md:flex md:w-1/2'}
                    `}>
                        {/* Mobile Back Button for Analytics/Details */}
                        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0A0A0B]">
                            <button
                                onClick={() => setShowMobileDetail(false)}
                                className="flex items-center gap-2 text-zinc-400 hover:text-white"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back to Results</span>
                            </button>
                        </div>

                        {/* Live Mode: Top = Context, Bottom = Analytics */}
                        {mode === 'live' ? (
                            <>
                                {/* Upper Half: Thread Context */}
                                <div className="h-full md:h-1/2 bg-[#050505] overflow-hidden border-b border-white/5">
                                    {selectedLiveItem ? (
                                        isPro ? (
                                            <ThreadDetailView
                                                board={selectedLiveItem.board}
                                                threadId={selectedLiveItem.thread_id}
                                                highlightPostId={selectedLiveItem.post_id}
                                                className="h-full"
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center p-8">
                                                <UpgradePrompt title="Thread Locked" description="Upgrade to Pro to view the full discussion context." />
                                            </div>
                                        )
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                            <Database className="w-8 h-8 mb-3 opacity-20" />
                                            <span className="text-xs uppercase tracking-widest font-bold">Select a post to view context</span>
                                        </div>
                                    )}
                                </div>

                                {/* Lower Half: Analytics */}
                                <div className="hidden md:block h-1/2 overflow-y-auto scroll-smooth">
                                    <SearchVisualizations data={results} mode={mode} total={total} aggregations={aggregations} />
                                </div>
                            </>
                        ) : (
                            /* Analyzed Mode: Split View if Selected, else Full Height Analytics */
                            <>
                                {selectedAnalyzedItem ? (
                                    <>
                                        {/* Top Half: Quick Glance */}
                                        <div className="h-full md:h-1/2 bg-[#050505] overflow-hidden border-b border-white/5">
                                            <QuickGlance
                                                opportunity={selectedAnalyzedItem}
                                                onClose={() => setSelectedAnalyzedItem(null)}
                                            />
                                        </div>
                                        {/* Lower Half: Analytics */}
                                        <div className="hidden md:block h-1/2 overflow-y-auto scroll-smooth">
                                            <SearchVisualizations data={results} mode={mode} total={total} aggregations={aggregations} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="hidden md:block h-full overflow-y-auto scroll-smooth">
                                        <SearchVisualizations data={results} mode={mode} total={total} aggregations={aggregations} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div >
        </div >
    );
}

function BoardMultiSelect({ selected, onChange }: { selected: string[], onChange: (b: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Flatten all boards
    const allBoards = React.useMemo(() => {
        return BOARD_CATEGORIES.flatMap(c => c.boards.map(b => ({ code: b, category: c.name })));
    }, []);

    const filtered = allBoards.filter(b => b.code.includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase()));

    const toggleBoard = (code: string) => {
        if (selected.includes(code)) {
            onChange(selected.filter(s => s !== code));
        } else {
            onChange([...selected, code]);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white font-bold transition-colors"
            >
                {selected.length === 0 ? 'Any' : `${selected.length} Selected`}
                <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-80 bg-[#111113] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b border-white/5">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search boards..."
                                className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
                            {filtered.length === 0 && <div className="text-center text-zinc-600 text-xs py-4">No boards found</div>}
                            {filtered.map(b => (
                                <button
                                    key={b.code}
                                    onClick={() => toggleBoard(b.code)}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${selected.includes(b.code) ? 'bg-violet-500/20 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                >
                                    <span className="font-mono">/{b.code}/</span>
                                    {selected.includes(b.code) && <Check className="w-3 h-3 text-violet-400" />}
                                </button>
                            ))}
                        </div>
                        {selected.length > 0 && (
                            <div className="p-2 border-t border-white/5 bg-[#0A0A0B]">
                                <button
                                    onClick={() => onChange([])}
                                    className="w-full py-1 text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300"
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
