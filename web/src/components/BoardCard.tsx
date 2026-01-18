import Link from "next/link";

interface BoardCardProps {
    title: string;
    subTitle?: string;
    description?: string;
    stats: {
        boards?: number;
        threads: number;
        images?: number;
    };
    growth?: number; // percent change
    iconRow?: string[];
    link?: string;
}

export default function BoardCard({ title, subTitle, stats, growth, iconRow, link }: BoardCardProps) {
    // Determine growth color and icon
    const isPositive = growth && growth > 0;
    const isNegative = growth && growth < 0;

    return (
        <div className="group relative bg-[#0F0F10] border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all hover:bg-[#131314] flex flex-col justify-between h-full">

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                    {subTitle && (
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500 font-mono">
                            {subTitle}
                        </div>
                    )}
                </div>
                {/* Growth Badge */}
                {growth !== undefined && growth !== 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${isPositive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}>
                        {isPositive ? "↑" : "↓"} {Math.abs(growth)}%
                    </span>
                )}
            </div>

            {/* Content Body */}
            <div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-zinc-400">
                    {/* Stats */}
                    <div className="flex items-center gap-1 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/5">
                        <svg className="text-violet-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><line x1="9" x2="9" y1="21" y2="9" /></svg>
                        {stats.boards} Boards
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/5">
                        <svg className="text-emerald-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        {stats.threads.toLocaleString()} Threads
                    </div>

                    {/* Board List (Inline) */}
                    {iconRow && iconRow.slice(0, 5).map((icon, i) => (
                        <div key={i} className="min-w-[1.5rem] w-fit px-1 h-6 rounded bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-400 border border-white/5 whitespace-nowrap">
                            /{icon}/
                        </div>
                    ))}
                    {iconRow && iconRow.length > 5 && (
                        <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-[9px] text-zinc-500 border border-white/5">
                            +{iconRow.length - 5}
                        </div>
                    )}
                </div>
            </div>

            {link && <Link href={link} className="absolute inset-0 z-10" />}
        </div>
    )
}
