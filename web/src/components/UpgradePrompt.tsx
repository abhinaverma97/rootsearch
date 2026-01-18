
import React from 'react';
import { Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
    title?: string;
    description?: string;
    minimal?: boolean;
}

export default function UpgradePrompt({ title = "Unlock Full Access", description = "Upgrade to Pro to see all opportunities and insights.", minimal = false }: UpgradePromptProps) {
    if (minimal) {
        return (
            <div className="p-4 bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-zinc-900/40 transition-all shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-tight">Pro Feature</span>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{description}</span>
                    </div>
                </div>
                <Link href="/#pricing" className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold rounded uppercase tracking-wider transition-all">
                    Upgrade
                </Link>
            </div>
        );
    }

    return (
        <div className="relative p-8 rounded-2xl border border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl overflow-hidden group text-center shadow-2xl">
            {/* Background Glow - Subtle White */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/5 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Lock className="w-5 h-5 text-zinc-300" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
                <p className="text-zinc-500 text-xs mb-6 max-w-xs mx-auto leading-relaxed font-medium">
                    {description}
                </p>

                <Link
                    href="/#pricing"
                    className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-[10px] font-black uppercase tracking-widest rounded-lg transition-all transform hover:-translate-y-0.5"
                >
                    <Zap className="w-3 h-3 fill-current" />
                    Get Pro Access
                </Link>
            </div>
        </div>
    );
}
