import { Opportunity, saveOpportunity } from '../lib/api';
import { Bookmark, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

interface SearchResultCardProps {
    data: any;
    mode: 'live' | 'analyzed';
    highlightQuery: string;
    onClick?: (data: any) => void;
    showSaveAction?: boolean;
    showDetails?: boolean;
}

function cleanText(text: string): string {
    if (!text) return "";
    // 1. Decode HTML entities
    const decoded = text
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#039;/g, "'")
        .replace(/<br\s*\/?>/gi, '\n'); // Replace <br> with newlines

    // 2. Strip HTML tags (like <span class="quote">)
    return decoded.replace(/<[^>]*>/g, '');
}

function Highlight({ text, query }: { text: string; query: string }) {
    if (!text) return null;

    // Clean text before highlighting if it looks like raw HTML (simple heuristic or just always clean for display)
    // For this specific issue in live mode, the parent component passes raw HTML-like content.
    // However, Highlight is generic. Let's clean it at the call site or just here.
    // Given the user report, we should clean it.
    const cleanedText = cleanText(text);

    if (!cleanedText || !query) return <>{cleanedText || ""}</>;

    // Simple case-insensitive split
    const parts = cleanedText.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="bg-violet-500/20 text-violet-300 font-bold px-0.5 rounded-sm border-b border-violet-500/40">{part}</span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export default function SearchResultCard({ data, mode, highlightQuery, onClick, showSaveAction = true, showDetails = true }: SearchResultCardProps) {
    const { data: session } = useSession();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    if (mode === 'analyzed') {
        const opp = data as Opportunity;

        const handleSave = async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!session) {
                alert("Please sign in to save items");
                return;
            }
            setSaving(true);
            try {
                await saveOpportunity(opp);
                setSaved(true);
            } catch (err) {
                console.error(err);
                alert("Failed to save");
            } finally {
                setSaving(false);
            }
        };

        const handleClick = () => {
            if (onClick) {
                onClick(opp);
            } else {
                window.location.href = `/results/${encodeURIComponent(opp.category)}`;
            }
        };

        return (
            <div className="group p-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer relative" onClick={handleClick}>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-zinc-600 text-[10px] uppercase font-black tracking-widest">{opp.product_domain}</span>
                    <div className="flex-1" />

                    {showSaveAction && (
                        <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            className={`p-1.5 rounded-lg transition-all ${saved ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />}
                        </button>
                    )}

                    <span className="text-zinc-700 text-[10px] uppercase tracking-wider">{opp.market_size}</span>
                </div>

                <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-white transition-colors leading-tight">
                    <Highlight text={opp.product_concept || opp.emerging_trend || opp.core_pain || opp.solution} query={highlightQuery} />
                </h3>

                {showDetails && opp.core_pain && (opp.core_pain !== (opp.product_concept || opp.emerging_trend || opp.core_pain || opp.solution)) && (
                    <div className="mb-3 text-sm text-zinc-400 leading-relaxed line-clamp-2">
                        <span className="text-zinc-600 uppercase text-[10px] tracking-widest font-black mr-2">Core Pain</span>
                        <Highlight text={opp.core_pain} query={highlightQuery} />
                    </div>
                )}

                {showDetails && opp.solution && (opp.solution !== (opp.product_concept || opp.emerging_trend || opp.core_pain || opp.solution)) && (
                    <div className="mb-3 text-sm text-zinc-400 leading-relaxed line-clamp-2">
                        <span className="text-zinc-600 uppercase text-[10px] tracking-widest font-black mr-2">Solution</span>
                        <Highlight text={opp.solution} query={highlightQuery} />
                    </div>
                )}

                <div className="flex items-center gap-2 mt-3">
                    {opp.intent_category && (
                        <span className="px-2 py-1 bg-zinc-900 border border-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-wider">
                            {opp.intent_category}
                        </span>
                    )}
                    {opp.flair_type && (
                        <span className="px-2 py-1 bg-zinc-900 border border-white/5 rounded text-[10px] text-zinc-500 uppercase tracking-wider">
                            {opp.flair_type}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (mode === 'live') {
        // Raw Post Interface structure from db_manager.search results
        // board, thread_id, post_id, comment, timestamp, subject
        const post = data;
        const date = new Date(post.timestamp * 1000).toLocaleDateString();

        return (
            <div className="group p-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5 text-[10px] font-mono">
                            /{post.board}/
                        </span>
                        <span className="text-zinc-600 text-[10px] font-mono">#{post.post_id}</span>
                    </div>
                    <span className="text-zinc-600 text-[10px] uppercase tracking-widest font-black">{date}</span>
                </div>

                {post.subject && (
                    <h4 className="text-sm font-bold text-zinc-300 mb-1">
                        <span className="text-zinc-500 mr-2">Subject:</span>
                        <Highlight text={cleanText(post.subject)} query={highlightQuery} />
                    </h4>
                )}

                <div className="text-sm text-zinc-400 font-serif leading-relaxed line-clamp-4 whitespace-pre-line opacity-90">
                    <Highlight text={cleanText(post.comment)} query={highlightQuery} />
                </div>

                <div className="mt-3 flex justify-end">
                    <a
                        href={`https://boards.4channel.org/${post.board}/thread/${post.thread_id}#p${post.post_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 hover:text-emerald-400 transition-colors flex items-center gap-1"
                    >
                        Original Thread <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                </div>
            </div>
        )
    }

    return null;
}
