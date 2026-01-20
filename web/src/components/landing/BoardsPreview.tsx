"use client";

import React from "react";
import BoardCard from "../BoardCard";
import Link from "next/link";

export default function BoardsPreview() {
    const boards = [
        {
            name: "Technology",
            boards: ["g", "sci", "p"],
            replies: 15420,
            growth: 12.5,
            count: 3
        },
        {
            name: "Business",
            boards: ["biz", "adv"],
            replies: 8930,
            growth: 8.2,
            count: 2
        },
        {
            name: "Creative",
            boards: ["gd", "diy", "ic"],
            replies: 12100,
            growth: -2.1,
            count: 3
        },
        {
            name: "News",
            boards: ["pol", "news"],
            replies: 45200,
            growth: 24.8,
            count: 2
        },
        {
            name: "Crypto",
            boards: ["biz", "x"],
            replies: 18400,
            growth: 42.1,
            count: 2
        },
        {
            name: "Lifestyle",
            boards: ["ck", "fit", "fa"],
            replies: 9200,
            growth: 5.4,
            count: 3
        },
        {
            name: "Gaming",
            boards: ["v", "vg", "vr"],
            replies: 32100,
            growth: 15.2,
            count: 3
        },
        {
            name: "Hobbies",
            boards: ["o", "p", "trv"],
            replies: 4500,
            growth: 1.2,
            count: 3
        }
    ];

    return (
        <section id="features" className="py-24 px-6 border-b border-white/5 relative bg-[#050505] overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none opacity-20" />

            <div className="max-w-[1600px] mx-auto relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Coverage</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                            Explore Communities
                        </h2>
                        <p className="text-zinc-500 max-w-xl text-lg">
                            RootSearch continuously monitors 70+ active boards.
                            Browse by category or create your own curated collections.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {boards.map((cat, idx) => (
                        <div key={idx} className="pointer-events-none select-none">
                            <BoardCard
                                title={cat.name}
                                subTitle={`${(cat.replies / 1000).toFixed(1)}k+ active replies`}
                                stats={{ boards: cat.count, threads: Math.floor(cat.replies / 10) }}
                                growth={cat.growth}
                                iconRow={cat.boards}
                                link="#"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
