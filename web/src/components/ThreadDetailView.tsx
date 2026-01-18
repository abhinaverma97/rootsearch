import { useEffect, useState, useMemo } from 'react';
import { fetchThread, ThreadDetail, ThreadPost } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface ThreadDetailViewProps {
    board: string;
    threadId: number;
    highlightPostId: number;
    className?: string;
    onClose?: () => void;
}

function cleanText(text: string): string {
    if (!text) return "";
    const decoded = text
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#039;/g, "'")
        .replace(/<br\s*\/?>/gi, '\n');
    return decoded.replace(/<[^>]*>/g, '');
}

function Highlight({ text, query }: { text: string; query: string }) {
    // Note: We don't have the search query here easily unless passed down. 
    // We can highlight the *entire post* as the "target" instead of text tokens for now.
    return <>{text}</>;
}

export default function ThreadDetailView({ board, threadId, highlightPostId, className, onClose }: ThreadDetailViewProps) {
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!board || !threadId) return;

        setLoading(true);
        setError('');
        fetchThread(board, threadId)
            .then(data => {
                if (data) setThread(data);
                else setError('Failed to load thread.');
            })
            .catch(() => setError('Error loading thread.'))
            .finally(() => setLoading(false));
    }, [board, threadId]);

    // Derived State: Find critical posts
    const { op, targetPost, replies } = useMemo(() => {
        if (!thread) return { op: null, targetPost: null, replies: [] };

        const posts = thread.posts || [];
        const op = posts.find(p => p.is_op) || posts[0];
        const targetPost = posts.find(p => p.no === highlightPostId);

        // Find simple "replies" (posts that happened after target). 
        // True reply chaining parsing is complex (parsing >>123).
        // For this view "Cascading style", let's show:
        // 1. OP
        // 2. ...(if gap)...
        // 3. Target Post
        // 4. Next 3 posts (context)

        let contextPosts: ThreadPost[] = [];
        if (targetPost) {
            const targetIndex = posts.indexOf(targetPost);
            if (targetIndex > -1) {
                contextPosts = posts.slice(targetIndex + 1, targetIndex + 4);
            }
        }

        return { op, targetPost, replies: contextPosts };
    }, [thread, highlightPostId]);

    if (loading) return <div className={`flex items-center justify-center h-full text-zinc-500 ${className}`}><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Thread...</div>;
    if (error) return <div className={`flex items-center justify-center h-full text-red-400 ${className}`}>{error}</div>;
    if (!thread || !op) return <div className={`flex items-center justify-center h-full text-zinc-600 ${className}`}>Select a result to view thread context</div>;

    const opDate = new Date(op.time * 1000).toLocaleString();

    return (
        <div className={`flex flex-col h-full bg-[#0A0A0B] border-l border-white/5 overflow-hidden ${className}`}>
            {/* Fixed Header */}
            <div className="flex-none px-6 py-6 border-b border-white/5 bg-[#0A0A0B] z-10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Context View <span className="text-zinc-500 font-normal text-sm font-mono">/{board}/{threadId}</span>
                </h3>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
                {/* OP Post */}
                <div className="relative pl-4 border-l-2 border-zinc-700 mb-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-800 border-2 border-zinc-600"></div>
                    <div className="text-xs text-zinc-500 mb-1 flex items-center gap-2">
                        <span className="font-bold text-emerald-500">OP</span>
                        <span>{op.no}</span>
                        <span>{opDate}</span>
                    </div>
                    {thread.subject && <div className="text-sm font-bold text-zinc-300 mb-2">{thread.subject}</div>}
                    <div className="text-sm text-zinc-400 font-serif whitespace-pre-line leading-relaxed">
                        {cleanText(op.com)}
                    </div>
                </div>

                {/* Dashed Connector if gap */}
                {targetPost && targetPost.no !== op.no && (
                    <div className="ml-4 border-l-2 border-dashed border-zinc-800 h-8 mb-4"></div>
                )}

                {/* Target Post */}
                {targetPost && targetPost.no !== op.no && (
                    <div className="relative pl-4 border-l-2 border-violet-500 mb-4 bg-violet-500/5 -mx-4 py-4 pr-4 rounded-r-lg">
                        <div className="absolute left-0 top-6 w-4 h-0.5 bg-violet-500"></div>
                        <div className="text-xs text-violet-300 mb-1 flex items-center gap-2">
                            <span className="font-bold bg-violet-500 text-white px-1 rounded-[2px]">SELECTED</span>
                            <span>{targetPost.no}</span>
                            <span>{new Date(targetPost.time * 1000).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-zinc-200 font-serif whitespace-pre-line leading-relaxed">
                            {cleanText(targetPost.com)}
                        </div>
                    </div>
                )}

                {/* Replies / Context */}
                {replies.length > 0 && (
                    <div className="ml-8 space-y-4">
                        {replies.map(p => (
                            <div key={p.no} className="relative pl-4 border-l border-zinc-800">
                                <div className="text-[10px] text-zinc-600 mb-1">
                                    {p.no} • {new Date(p.time * 1000).toLocaleTimeString()}
                                </div>
                                <div className="text-xs text-zinc-500 whitespace-pre-line line-clamp-3 hover:line-clamp-none cursor-help transition-all">
                                    {cleanText(p.com)}
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 text-[10px] text-zinc-600 italic">
                            ... and more in full thread
                        </div>
                    </div>
                )}

                <a
                    href={`https://boards.4channel.org/${board}/thread/${threadId}#p${highlightPostId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-8 block text-center py-3 border border-white/10 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    View on 4chan <span className="ml-1">↗</span>
                </a>
            </div>
        </div>
    );
}
