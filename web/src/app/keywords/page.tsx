'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { Bell, Plus, RefreshCw, Check, CheckCircle2, ChevronRight, MessageSquare, ExternalLink, X, Loader2 } from 'lucide-react';
import { getKeywords, addKeyword, markKeywordRead, KeywordStats, fetchKeywordMatches, KeywordMatch } from '../../lib/api';
import ThreadDetailView from '../../components/ThreadDetailView';
import { useSession } from 'next-auth/react';
import UpgradePrompt from '../../components/UpgradePrompt';

export default function KeywordsPage() {
    const [keywords, setKeywords] = useState<KeywordStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState<'none' | 'keyword' | 'audience'>('audience');

    const { data: session } = useSession();
    const isPro = (session?.user as any)?.plan_type === 'pro';

    // Add Keyword State
    const [showAdd, setShowAdd] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Detail View State
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
    const [matches, setMatches] = useState<KeywordMatch[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);

    // Context View (Thread Detail) State
    const [selectedContext, setSelectedContext] = useState<{ board: string, thread_id: number, post_id: number } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getKeywords();
            setKeywords(data.keywords);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;
        setSubmitting(true);
        try {
            await addKeyword(newKeyword, newLabel || undefined);
            await loadData();
            setNewKeyword('');
            setNewLabel('');
            setShowAdd(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkRead = async (keyword: string) => {
        try {
            // Optimistic update
            setKeywords(prev => prev.map(k => k.keyword === keyword ? { ...k, unread_count: 0 } : k));
            await markKeywordRead(keyword);
        } catch (e) {
            console.error(e);
            loadData(); // Revert on fail
        }
    };

    const handleKeywordClick = async (keyword: string) => {
        setSelectedKeyword(keyword);
        setLoadingMatches(true);
        setMatches([]);
        try {
            const data = await fetchKeywordMatches(keyword);
            setMatches(data.matches);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMatches(false);
        }
    };

    // Grouping Logic
    const groupedKeywords = () => {
        if (groupBy === 'audience') {
            const groups: { [key: string]: KeywordStats[] } = {};
            keywords.forEach(k => {
                const label = k.label || 'All Boards';
                if (!groups[label]) groups[label] = [];
                groups[label].push(k);
            });
            return Object.entries(groups).map(([label, items]) => ({ label, items }));
        }
        return [{ label: 'All Keywords', items: keywords }];
    };

    return (
        <div className="min-h-screen flex bg-[#050505] text-zinc-300 font-sans overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#050505]/80 backdrop-blur">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-white tracking-tight">Tracked Keywords</h1>
                        <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-white/10">
                            <span className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Group by</span>
                            {(['none', 'keyword', 'audience'] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGroupBy(g)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${groupBy === g ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-all"
                        >
                            <Plus className="w-4 h-4" /> Add Keyword
                        </button>
                    </div>
                </header>

                {/* Main Content Areas */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Keywords List */}
                    <main className={`overflow-y-auto px-8 py-8 no-scrollbar transition-all duration-300 ${selectedKeyword ? 'w-1/3 border-r border-white/5' : 'w-full'}`}>
                        {/* Add Modal/Form Inline */}
                        {showAdd && (
                            <div className="mb-8 p-6 bg-[#0A0A0B] border border-violet-500/20 rounded-xl animate-in slide-in-from-top-2">
                                {!isPro ? (
                                    <div className="flex flex-col items-center text-center p-4">
                                        <UpgradePrompt minimal description="Upgrade to Pro to track specific keywords and get notified of new opportunities." />
                                        <button
                                            onClick={() => setShowAdd(false)}
                                            className="mt-4 text-xs text-zinc-500 hover:text-white underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleAdd} className="flex flex-col gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Keyword</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newKeyword}
                                                onChange={e => setNewKeyword(e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all placeholder-zinc-700"
                                                placeholder='e.g. "Artificial Intelligence"'
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Audience Label</label>
                                            <input
                                                type="text"
                                                value={newLabel}
                                                onChange={e => setNewLabel(e.target.value)}
                                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition-all placeholder-zinc-700"
                                                placeholder='e.g. "Startup Founders" (Optional)'
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowAdd(false)}
                                                className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white text-sm font-medium transition-all"
                                            >Cancel</button>
                                            <button
                                                type="submit"
                                                disabled={!newKeyword.trim() || submitting}
                                                className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-all disabled:opacity-50"
                                            >
                                                {submitting ? 'Adding...' : 'Track'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-20 opacity-50">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-8 pb-20">
                                {groupedKeywords().map((group, idx) => (
                                    <div key={idx}>
                                        {groupBy !== 'none' && (
                                            <div className="flex items-center gap-3 mb-4">
                                                <GroupIcon label={group.label} />
                                                <h3 className="text-zinc-400 font-medium text-xs uppercase tracking-widest">{group.label}</h3>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {group.items.map((k) => (
                                                <button
                                                    key={k.keyword}
                                                    onClick={() => handleKeywordClick(k.keyword)}
                                                    className={`
                                                        w-full group text-left bg-[#0A0A0B] border rounded-xl p-4 flex items-center justify-between transition-all 
                                                        ${selectedKeyword === k.keyword
                                                            ? 'border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/5'
                                                            : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Bell className={`w-4 h-4 ${k.unread_count > 0 ? 'text-violet-400 fill-violet-400/20' : 'text-zinc-600'}`} />
                                                        <span className="font-bold text-white text-sm tracking-tight">"{k.keyword}"</span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {k.unread_count > 0 && (
                                                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
                                                                {k.unread_count} New
                                                            </span>
                                                        )}
                                                        <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform ${selectedKeyword === k.keyword ? 'rotate-90 text-violet-500' : ''}`} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Right: Matches & Context Area */}
                    <div className={`flex-1 flex flex-col bg-[#050505] transition-all duration-300 ${selectedKeyword ? 'translate-x-0' : 'translate-x-full absolute right-0'}`}>
                        {selectedKeyword ? (
                            <div className="flex flex-col h-full">
                                {/* Matches List Header */}
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0A0A0B]">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-4 h-4 text-violet-400" />
                                        <h2 className="text-sm font-bold text-white tracking-tight">Mentions for "{selectedKeyword}"</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleMarkRead(selectedKeyword)}
                                            className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/5 border border-emerald-400/10 px-3 py-1.5 rounded-lg"
                                        >
                                            Mark All Read
                                        </button>
                                        <button onClick={() => setSelectedKeyword(null)} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Results View */}
                                <div className="flex-1 flex overflow-hidden">
                                    {/* Matches List */}
                                    <div className={`flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar border-r border-white/5 transition-all duration-300 ${selectedContext ? 'w-1/2 shrink-0' : 'w-full'}`}>
                                        {loadingMatches ? (
                                            <div className="flex items-center justify-center py-20 opacity-30">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            </div>
                                        ) : matches.length === 0 ? (
                                            <div className="text-center py-20">
                                                <p className="text-zinc-500 text-sm">No matches found for this keyword yet.</p>
                                            </div>
                                        ) : (
                                            matches.map((match) => (
                                                <div
                                                    key={match.post_id}
                                                    className={`group p-4 bg-[#0A0A0B] border rounded-xl transition-all ${selectedContext?.post_id === match.post_id ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/5 hover:border-white/10'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">/{match.board}/</span>
                                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{new Date(match.found_at * 1000).toLocaleDateString()}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedContext({ board: match.board, thread_id: match.thread_id, post_id: match.post_id })}
                                                            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-violet-400 hover:text-violet-300 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            View Context
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: match.comment }}></p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Context View Side Panel */}
                                    {selectedContext && (
                                        <div className="w-1/2 flex flex-col bg-[#050505] animate-in slide-in-from-right duration-300">
                                            {isPro ? (
                                                <ThreadDetailView
                                                    board={selectedContext.board}
                                                    threadId={selectedContext.thread_id}
                                                    highlightPostId={selectedContext.post_id}
                                                    onClose={() => setSelectedContext(null)}
                                                />
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#050505]">
                                                    <div className="max-w-xs">
                                                        <UpgradePrompt title="Thread Locked" description="Upgrade to Pro to view the full discussion context and original thread." />
                                                        <button
                                                            onClick={() => setSelectedContext(null)}
                                                            className="mt-6 text-zinc-500 hover:text-white text-xs underline"
                                                        >
                                                            Close View
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 p-10">
                                <Bell className="w-16 h-16 mb-4 text-zinc-700" />
                                <h3 className="text-xl font-bold text-white mb-2 underline decoration-violet-500/50 underline-offset-8">Discovery Pulse</h3>
                                <p className="text-sm max-w-xs">Select a keyword to see specific mentions and explore the full discussion context.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function GroupIcon({ label }: { label: string }) {
    if (label === 'All Boards' || label === 'No Audience') return <span className="text-zinc-700 font-mono text-xs">#</span>;
    return (
        <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    )
}
