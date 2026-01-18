"use client";

import React from "react";
import { Quote, CheckCircle2, Bookmark, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function InsightsPreview() {
    return (
        <section className="py-32 px-6 border-b border-white/5 bg-[#050505] overflow-hidden">
            <div className="max-w-[1600px] mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        Deep Dive Analysis
                    </h2>
                    <p className="text-zinc-500 max-w-2xl mx-auto text-lg">
                        Every opportunity is analyzed for market conditions, complexity, and target audience.
                        We backup every claim with <span className="text-zinc-300">verifiable evidence</span>.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none opacity-20" />

                    {/* The Card */}
                    <div className="relative bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12 overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
                        {/* Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Productivity
                                </span>
                                <span className="text-zinc-600 text-[10px]">•</span>
                                <span className="px-3 py-1 rounded bg-zinc-900 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    SaaS
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] uppercase font-black tracking-widest text-zinc-600">Market Score</span>
                                    <span className="text-xl font-bold text-emerald-400">9.4/10</span>
                                </div>
                                <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 flex items-center justify-center bg-zinc-900">
                                    <span className="text-[10px] font-bold text-white">HI</span>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">Core Pain Point</div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                        "I waste 2 hours a day manually copying data between Notion and Google Sheets because Zapier is too expensive."
                                    </h3>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Target Audience</div>
                                        <div className="text-zinc-200 font-medium text-sm">Operations Managers, Freelancers</div>
                                    </div>
                                    <div className="flex-1 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                                        <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Complexity</div>
                                        <div className="text-zinc-200 font-medium text-sm">Low (API Wrapper)</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">
                                        <Quote className="w-3 h-3" />
                                        Evidence
                                    </div>
                                    <div className="space-y-4">
                                        <div className="pl-4 border-l-2 border-zinc-800 italic text-zinc-400 text-sm leading-relaxed">
                                            "I've tried Make and Zapier but the entry tiers are useless. I just need a simple sync that runs every hour..."
                                        </div>
                                        <div className="pl-4 border-l-2 border-zinc-800 italic text-zinc-400 text-sm leading-relaxed">
                                            "Is there a self-hosted alternative? I'm tired of paying $30/mo for basic webhooks."
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button className="flex-1 bg-white text-black hover:bg-zinc-200 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                        View Full Analysis
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                    <button className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
                                        <Bookmark className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
