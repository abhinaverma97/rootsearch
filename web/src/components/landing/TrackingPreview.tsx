"use client";

import React from "react";
import { Bell, Check, Bookmark, Folder } from "lucide-react";
import Link from "next/link";

export default function TrackingPreview() {
    return (
        <section id="tracking" className="py-24 px-6 bg-[#080808]">
            <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-24">

                {/* Content */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        Curate & Track.
                        <br />
                        <span className="text-zinc-600">Never miss a beat.</span>
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 max-w-md leading-relaxed">
                        Build your personal evidence vault. Save promising leads and set up keyword monitors to get alerted when new trends emerge.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 mt-1">
                                <Bookmark className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Collections</h4>
                                <p className="text-zinc-500 text-sm">Organize insights into project-specific collections.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 text-zinc-300 mt-1">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-1">Real-time Alerts</h4>
                                <p className="text-zinc-500 text-sm">Get notified when tracked keywords are mentioned in high-signal posts.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visuals */}
                <div className="lg:col-span-7 grid md:grid-cols-2 gap-6 items-center">

                    {/* Card 1: Saved Items */}
                    <div className="bg-[#0A0A0B] border border-white/10 rounded-2xl p-6 shadow-2xl relative translate-y-8 md:translate-y-12 z-10">
                        <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Folder className="w-5 h-5 text-white" />
                                <span className="text-sm font-bold text-white">SaaS Ideas</span>
                            </div>
                            <span className="text-xs text-zinc-500">12 items</span>
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-zinc-900/50 border border-white/5 p-3 rounded-lg flex items-center gap-3 opacity-60">
                                    <div className="w-8 h-8 rounded bg-zinc-800" />
                                    <div className="h-1.5 w-24 bg-zinc-700 rounded-full" />
                                </div>
                            ))}
                            <div className="bg-zinc-800/50 border border-white/10 p-3 rounded-lg flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                    <div className="h-1.5 w-32 bg-zinc-500 rounded-full mb-2" />
                                    <div className="h-1.5 w-20 bg-zinc-600 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Notifications */}
                    <div className="bg-[#0F0F10] border border-white/10 rounded-2xl p-6 shadow-2xl md:-translate-y-8">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Updates</span>
                            <span className="w-2 h-2 rounded-full bg-violet-500/50 animate-pulse" />
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex gap-3">
                                <div className="shrink-0 mt-1">
                                    <Bell className="w-4 h-4 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-300 font-medium leading-relaxed mb-1">
                                        New mention for <strong className="text-white">"AI Agent"</strong> in /g/
                                    </p>
                                    <span className="text-[10px] text-zinc-500">2 mins ago</span>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 flex gap-3 opacity-50">
                                <div className="shrink-0 mt-1">
                                    <Bell className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-300 font-medium leading-relaxed mb-1">
                                        New mention for <strong className="text-white">"No Code"</strong> in /biz/
                                    </p>
                                    <span className="text-[10px] text-zinc-500">1 hour ago</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <Link href="/keywords" className="text-xs font-bold text-white hover:underline">Manage Keywords</Link>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
