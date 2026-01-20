"use client";

import React from "react";
import { Search, Zap, Database, ArrowRight } from "lucide-react";
import SearchResultCard from "../SearchResultCard"; // Assuming this exists or will mock
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function SearchPreview() {
    const { data: session } = useSession();

    const mockResults = [
        {
            id: 101,
            market_score: 9.2,
            intent_category: "Money Talk",
            core_pain: "Subscriptions are too expensive for simple needs",
            solution: "Lifetime deal based micro-SaaS",
            product_domain: "SaaS",
            flair_type: "Pricing",
            complexity: "Low",
            target_audience: "Indie Hackers",
            timestamp: "2h ago",
            evidence: []
        },
        {
            id: 102,
            market_score: 8.5,
            intent_category: "Core Pains & Anger",
            core_pain: "Cannot find a reliable lawyer for crypto startups",
            solution: "Legal marketplace for web3",
            product_domain: "LegalTech",
            flair_type: "Service",
            complexity: "High",
            target_audience: "Web3 Founders",
            timestamp: "5h ago",
            evidence: []
        },
        {
            id: 103,
            market_score: 7.8,
            intent_category: "Advice Requests",
            core_pain: "How to market to developers without being annoying",
            solution: "Dev-first content marketing agency",
            product_domain: "Marketing",
            flair_type: "Strategy",
            complexity: "Medium",
            target_audience: "DevTools Founders",
            timestamp: "8h ago",
            evidence: []
        }
    ];

    return (
        <section id="search" className="py-20 md:py-32 px-6 border-b border-white/5 bg-[#080808] overflow-hidden relative">
            <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Left: Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-sm font-bold uppercase tracking-widest text-zinc-500">Intelligent Search</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Find the signal in the <span className="text-zinc-400">noise.</span>
                    </h2>

                    <p className="text-zinc-500 text-lg mb-10 max-w-xl leading-relaxed">
                        Don't just search for keywords. Search for <strong className="text-zinc-300">concepts, pains, and opportunities.</strong>
                        Our AI analyzes thousands of threads to surface high-value insights, scoring them by market potential.
                    </p>

                    <div className="flex items-center gap-4">
                        {session ? (
                            // Logged In: Try Advanced Search -> Go to Search Page
                            <Link
                                href="/search?mode=analyzed"
                                className="bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                            >
                                Try Advanced Search
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            // Logged Out: Login to try
                            <button
                                onClick={() => signIn('google', { callbackUrl: '/search?mode=analyzed' })}
                                className="bg-white hover:bg-zinc-200 text-black px-8 py-4 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                            >
                                Login to try Live Search
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}

                        {session ? (
                            // Logged In: Use Live Archive -> Go to Search Page (live mode)
                            <Link
                                href="/search?mode=live"
                                className="px-8 py-4 rounded-full text-sm font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" />
                                Use Live Archive
                            </Link>
                        ) : (
                            // Logged Out: Login to use
                            <button
                                onClick={() => signIn('google', { callbackUrl: '/search?mode=live' })}
                                className="px-8 py-4 rounded-full text-sm font-bold text-zinc-400 hover:text-white transition-all flex items-center gap-2"
                            >
                                <Database className="w-4 h-4" />
                                Use Live Archive
                            </button>
                        )}
                    </div>
                </div>

                {/* Right: Interactive Visual */}
                <div className="relative">
                    {/* Decorational Elements */}
                    <div className="absolute -inset-4 bg-zinc-800/20 rounded-3xl blur-2xl -z-10" />

                    <div className="bg-[#0F0F10] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Mock Header */}
                        <div className="px-6 py-4 border-b border-white/5 bg-[#141415] flex items-center gap-4">
                            <div className="flex items-center gap-1.5 opacity-50">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                            <div className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                <Search className="w-3 h-3 text-zinc-500" />
                                <span className="text-xs text-zinc-300 font-mono">"SaaS ideas for developers"</span>
                            </div>
                        </div>

                        {/* Mock Results */}
                        <div className="p-2 space-y-1">
                            {mockResults.map((res, i) => (
                                <div key={i} className="pointer-events-none select-none opacity-90 hover:opacity-100 transition-opacity">
                                    <SearchResultCard
                                        data={res as any}
                                        mode="analyzed"
                                        highlightQuery=""
                                        onClick={() => { }}
                                        showSaveAction={false}
                                    />
                                </div>
                            ))}
                            {/* Faded bottom */}
                            <div className="h-12 bg-linear-to-b from-transparent to-[#0F0F10]" />
                        </div>
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -bottom-8 -left-8 bg-[#111] border border-white/10 p-4 rounded-xl shadow-xl hidden md:flex items-center gap-4 transition-all">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Processed Today</span>
                            <span className="text-xl font-bold text-white font-mono">1.4M Posts</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-zinc-500">Insights Found</span>
                            <span className="text-xl font-bold text-emerald-400 font-mono">842</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
