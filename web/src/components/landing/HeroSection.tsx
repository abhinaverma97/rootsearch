"use client";

import React from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export default function HeroSection({ stats }: { stats: { posts: number, boards: number } | null }) {
    const { data: session } = useSession();
    const postCountDisplay = stats
        ? `${(stats.posts / 1000000).toFixed(1)} Million`
        : "1.3 Million";

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden border-b border-white/5">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-violet-600/15 rounded-[100%] blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
                {/* Headline */}
                <h1 className="text-4xl md:text-8xl font-bold tracking-tight mb-8 opacity-0 animate-[fadeIn_0.5s_ease-out_0.1s_forwards] leading-tight text-white">
                    Find What People <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-200 to-zinc-500">Actually Want.</span>
                </h1>

                {/* Subtext */}
                <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-12 opacity-0 animate-[fadeIn_0.5s_ease-out_0.2s_forwards] leading-relaxed">
                    Search, summarize, and gain insights from over <span className="text-zinc-200 font-bold">{postCountDisplay} 4chan</span> interactions.
                    Turn chaotic threads into actionable market intelligence.
                </p>

                {/* Buttons */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 opacity-0 animate-[fadeIn_0.5s_ease-out_0.3s_forwards] w-full md:w-auto">
                    {session ? (
                        <div className="flex flex-row items-center gap-4">
                            <div className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 text-sm">
                                Welcome back, <span className="text-white font-medium">{session.user?.name}</span>
                            </div>

                            <Link
                                href="/boards"
                                className="group flex items-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 px-8 py-3.5 rounded-full text-sm font-bold transition-all"
                            >
                                Boards
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => signIn('google', { callbackUrl: '/boards' })}
                                className="group flex items-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 px-8 py-3.5 rounded-full text-sm font-medium transition-all"
                            >
                                Create Account
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>

                            <button
                                onClick={() => signIn('google', { callbackUrl: '/boards' })}
                                className="px-8 py-3.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-all"
                            >
                                Login
                            </button>
                        </div>
                    )}
                </div>

                {/* Mock UI/Visual anchoring the bottom */}
                <div className="mt-20 w-full max-w-4xl opacity-0 animate-[fadeIn_0.5s_ease-out_0.5s_forwards] relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-zinc-800 to-zinc-800 rounded-xl blur opacity-20" />
                    <div className="relative bg-[#0A0A0B] ring-1 ring-white/10 rounded-xl p-2 flex items-center shadow-2xl">
                        <div className="w-full h-12 bg-black/50 rounded-lg flex items-center px-4 md:px-6 text-zinc-500 font-mono text-sm md:text-base">
                            <span className="mr-2 text-zinc-500">$</span> search "SaaS ideas needing validation" --mode=analyzed
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
