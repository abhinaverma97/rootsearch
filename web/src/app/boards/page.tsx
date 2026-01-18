"use client";

import Link from "next/link";
import Sidebar from "../../components/Sidebar";
import BoardCard from "../../components/BoardCard";
import { BOARD_CATEGORIES, BOARD_NAMES, BoardCategory } from "../../lib/categories";
import { useState, useRef, useEffect, useMemo } from "react";
import { fetchCollections, saveCollection, deleteCollectionApi, fetchAllBoardStats } from "../../lib/api";
import { useSession } from "next-auth/react";
import UpgradePrompt from "../../components/UpgradePrompt";
import { Loader2 } from 'lucide-react';

// Helper to get stats for a category
function getCategoryStats(categoryBoards: string[], statsData: any) {
    let threads = 0;
    let replies = 0;
    let prevRepliesTotal = 0;
    let hasGrowthData = false;

    // statsData passed as arg now


    categoryBoards.forEach(board => {
        const boardData = statsData[board];
        if (boardData) {
            threads += boardData.threads || 0;
            const currentReplies = boardData.replies || 0;
            replies += currentReplies;

            if (boardData.growth !== undefined) {
                const boardPrevReplies = currentReplies / (1 + (boardData.growth / 100));
                prevRepliesTotal += boardPrevReplies;
                hasGrowthData = true;
            } else {
                prevRepliesTotal += currentReplies;
            }
        }
    });

    let catGrowth = 0;
    if (hasGrowthData && prevRepliesTotal > 0) {
        catGrowth = ((replies - prevRepliesTotal) / prevRepliesTotal) * 100;
    }

    return {
        threads,
        replies,
        boardCount: categoryBoards.length,
        growth: Number(catGrowth.toFixed(1))
    };
}

export default function BoardsPage() {
    const { data: session } = useSession();
    const isPro = (session?.user as any)?.plan_type === 'pro';
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"replies" | "threads" | "alpha">("replies");
    const [activeTab, setActiveTab] = useState("categories");

    // Data State
    const [allBoardStats, setAllBoardStats] = useState<Record<string, any>>({});
    const [loadingStats, setLoadingStats] = useState(true);

    // Filters
    const [minReplies, setMinReplies] = useState(0);
    const [minThreads, setMinThreads] = useState(0);

    // Curated Stats
    const [curatedCategories, setCuratedCategories] = useState<BoardCategory[]>([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
    const [newCollectionName, setNewCollectionName] = useState("");

    // Section Refs for scrolling
    const categoriesRef = useRef<HTMLDivElement>(null);
    const allBoardsRef = useRef<HTMLDivElement>(null);
    const curatedRef = useRef<HTMLDivElement>(null);

    // Persistence
    useEffect(() => {
        const loadCollections = async () => {
            try {
                const data = await fetchCollections();
                setCuratedCategories(data);
            } catch (err) {
                console.error("Failed to load collections:", err);
            }
        };

        const loadStats = async () => {
            try {
                setLoadingStats(true);
                const stats = await fetchAllBoardStats();
                setAllBoardStats(stats);
            } catch (err) {
                console.error("Failed to load board stats:", err);
            } finally {
                setLoadingStats(false);
            }
        };

        loadCollections();
        loadStats();
    }, []);

    const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, tab: string) => {
        setActiveTab(tab);
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const toggleBoardSelection = (code: string) => {
        if (selectedBoards.includes(code)) {
            setSelectedBoards(selectedBoards.filter(b => b !== code));
        } else {
            setSelectedBoards([...selectedBoards, code]);
        }
    };

    const saveNewCollection = async () => {
        if (!newCollectionName || selectedBoards.length === 0) return;

        try {
            await saveCollection(newCollectionName, selectedBoards);
            const data = await fetchCollections();
            setCuratedCategories(data);

            // Reset
            setIsSelecting(false);
            setSelectedBoards([]);
            setNewCollectionName("");
        } catch (err) {
            console.error("Failed to save collection:", err);
            alert("Failed to save collection");
        }
    };

    const deleteCurated = async (name: string) => {
        try {
            await deleteCollectionApi(name);
            const data = await fetchCollections();
            setCuratedCategories(data);
        } catch (err) {
            console.error("Failed to delete collection:", err);
            alert("Failed to delete collection");
        }
    };

    // Filter Logic
    const term = search.toLowerCase();

    const filteredCategories = BOARD_CATEGORIES.filter(cat => {
        const nameMatch = cat.name.toLowerCase().includes(term);
        const boardMatch = cat.boards.some(b =>
            b.toLowerCase().includes(term) ||
            (BOARD_NAMES[b] || "").toLowerCase().includes(term)
        );
        return nameMatch || boardMatch;
    });

    // 2. Filter All Boards
    const filteredAllBoards = Object.entries(allBoardStats)
        .filter(([code, data]) => {
            const name = BOARD_NAMES[code] || "";
            const d = data as any;
            const matchesSearch = code.toLowerCase().includes(term) || name.toLowerCase().includes(term);
            const matchesReplies = (d.replies || 0) >= minReplies;
            const matchesThreads = (d.threads || 0) >= minThreads;
            return matchesSearch && matchesReplies && matchesThreads;
        })
        .sort(([codeA, dataA], [codeB, dataB]) => {
            const a = dataA as any;
            const b = dataB as any;
            if (sortBy === "replies") return (b.replies || 0) - (a.replies || 0);
            if (sortBy === "threads") return (b.threads || 0) - (a.threads || 0);
            if (sortBy === "alpha") return codeA.localeCompare(codeB);
            return 0;
        });

    return (
        <div className="min-h-screen flex bg-[#050505] text-white font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar">
                {/* Top Navigation */}
                <header className="sticky top-0 z-20 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <h1 className="text-xl font-bold tracking-tight">4chan Boards</h1>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => handleScroll(categoriesRef, "categories")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "categories" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Categories
                            </button>
                            <button
                                onClick={() => handleScroll(allBoardsRef, "all")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "all" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                All Boards
                            </button>
                            <button
                                onClick={() => handleScroll(curatedRef, "curated")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "curated" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                            >
                                Curated
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search boards..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-[#0A0A0A] border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 w-64 transition-all"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>
                </header>

                <div className="p-8 pb-32">
                    {/* Section: Categories */}
                    <div ref={categoriesRef} className="mb-12 scroll-mt-24">
                        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6 px-1">Board Categories</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredCategories.map((cat) => {
                                const stats = getCategoryStats(cat.boards, allBoardStats);
                                return (
                                    <BoardCard
                                        key={cat.name}
                                        title={cat.name}
                                        subTitle={`${(stats.replies / 1000).toFixed(1)}k+ active replies`}
                                        stats={{ boards: stats.boardCount, threads: stats.threads }}
                                        growth={stats.growth}
                                        iconRow={cat.boards}
                                        link={`/results/${encodeURIComponent(cat.name)}`}
                                    />
                                )
                            })}
                        </div>
                    </div>

                    {/* Section: Curated */}
                    <div ref={curatedRef} className="mb-12 scroll-mt-24">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Curated Collections</h2>
                            <button
                                onClick={() => {
                                    if (!isPro && curatedCategories.length >= 1) {
                                        alert("Free Plan limited to 1 collection. Upgrade to Pro!");
                                        return;
                                    }
                                    setIsSelecting(true);
                                    handleScroll(allBoardsRef, "all");
                                }}
                                className={`text-xs flex items-center gap-1 font-bold ${!isPro && curatedCategories.length >= 1 ? 'text-zinc-600 hover:text-zinc-500' : 'text-violet-400 hover:text-violet-300'}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7v14" /></svg>
                                Create Collection
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {curatedCategories.map((cat) => {
                                const stats = getCategoryStats(cat.boards, allBoardStats);
                                return (
                                    <div key={cat.name} className="relative group">
                                        <BoardCard
                                            title={cat.name}
                                            subTitle={`${(stats.replies / 1000).toFixed(1)}k+ active replies`}
                                            stats={{ boards: stats.boardCount, threads: stats.threads }}
                                            growth={stats.growth}
                                            iconRow={cat.boards}
                                            link={isSelecting ? undefined : `/results/${encodeURIComponent(cat.name)}`}
                                        />
                                        <button
                                            onClick={() => deleteCurated(cat.name)}
                                            className="absolute bottom-3 right-3 p-1.5 bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all z-20"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                )
                            })}
                            {curatedCategories.length === 0 && !isSelecting && (
                                <div className="col-span-full py-8 border-2 border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center text-zinc-600">
                                    <p className="text-sm">No curated collections yet.</p>
                                </div>
                            )}
                            {!isPro && curatedCategories.length >= 1 && (
                                <div className="mt-8">
                                    <UpgradePrompt minimal title="Unlock Unlimited Collections" description="Organize your research with unlimited custom board collections." />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: All Boards */}
                    <div ref={allBoardsRef} className="scroll-mt-24">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 px-1">
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">
                                    {isSelecting ? "Select Boards for Collection" : "All Boards"}
                                </h2>

                                {/* Advanced Filter Bar */}
                                <div className="flex flex-wrap items-center gap-4 bg-[#0A0A0B] border border-white/5 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 min-w-max">Min Replies</span>
                                        <input
                                            type="number"
                                            value={minReplies || ""}
                                            onChange={(e) => setMinReplies(Number(e.target.value))}
                                            placeholder="0"
                                            className="w-20 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 min-w-max">Min Threads</span>
                                        <input
                                            type="number"
                                            value={minThreads || ""}
                                            onChange={(e) => setMinThreads(Number(e.target.value))}
                                            placeholder="0"
                                            className="w-20 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-violet-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => { setMinReplies(0); setMinThreads(0); setSearch(""); }}
                                        className="text-[10px] uppercase font-bold text-zinc-600 hover:text-zinc-400 ml-2"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-mono mb-1">
                                <span className="text-zinc-600">Sort by:</span>
                                <button onClick={() => setSortBy("replies")} className={`transition-colors ${sortBy === "replies" ? "text-violet-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>Activity</button>
                                <button onClick={() => setSortBy("threads")} className={`transition-colors ${sortBy === "threads" ? "text-violet-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>Threads</button>
                                <button onClick={() => setSortBy("alpha")} className={`transition-colors ${sortBy === "alpha" ? "text-violet-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>A-Z</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {filteredAllBoards.map(([code, Data]) => {
                                const data = Data as any;
                                const isSelected = selectedBoards.includes(code);
                                return (
                                    <div
                                        key={code}
                                        onClick={() => isSelecting && toggleBoardSelection(code)}
                                        className={`group border rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between min-h-[100px] relative ${isSelected
                                            ? "bg-violet-500/10 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                                            : "bg-[#0F0F10] border-white/5 hover:border-violet-500/30 hover:bg-[#131314]"
                                            }`}
                                    >
                                        {!isSelecting && <Link href={`/results/${code}`} className="absolute inset-0 z-10" />}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className={`font-bold text-xl ${isSelected ? "text-violet-400" : "text-white"}`}>/{code}/</span>
                                                {isSelecting ? (
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? "bg-violet-500 border-violet-500" : "border-white/20"}`}>
                                                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </div>
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                                )}
                                            </div>
                                            <div className={`text-[11px] leading-tight mb-3 transition-colors ${isSelected ? "text-violet-300/70" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                                                {BOARD_NAMES[code] || "4chan Board"}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-0.5">Replies</span>
                                                <span className={`text-xs font-mono font-bold ${isSelected ? "text-violet-300" : "text-zinc-300"}`}>{data.replies?.toLocaleString()}</span>
                                            </div>
                                            <div className="w-px h-6 bg-white/5" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-0.5">Threads</span>
                                                <span className={`text-xs font-mono font-bold ${isSelected ? "text-violet-300" : "text-zinc-300"}`}>{data.threads?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {filteredAllBoards.length === 0 && (
                                <div className="col-span-full text-center py-20 bg-[#0A0A0B] border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-zinc-500 text-sm mb-1">No boards match your filters.</p>
                                    <button onClick={() => { setMinReplies(0); setMinThreads(0); setSearch(""); }} className="text-xs text-violet-400 font-bold hover:underline">Reset search and filters</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Selection Bar */}
                {isSelecting && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-[#111112] border border-white/10 rounded-2xl shadow-2xl p-2 pl-4 flex items-center gap-4 min-w-[400px] backdrop-blur-xl">
                            <div className="text-xs font-medium text-zinc-400">
                                <span className="text-violet-400 font-bold">{selectedBoards.length}</span> boards selected
                            </div>
                            <div className="h-6 w-px bg-white/10" />
                            <input
                                type="text"
                                placeholder="Collection name..."
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-white placeholder-zinc-600 flex-1"
                                autoFocus
                            />
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { setIsSelecting(false); setSelectedBoards([]); }}
                                    className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveNewCollection}
                                    disabled={!newCollectionName || selectedBoards.length === 0}
                                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
                                >
                                    Save Collection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
