"use client";

import React from "react";
import Image from "next/image";

export default function UpcomingIntegrations() {
    return (
        <section className="py-24 px-8 border-t border-white/5 bg-[#050505] relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10 text-center">
                <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500 mb-6">Roadmap</h2>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                    Expanding our horizon.
                </h3>
                <p className="text-zinc-500 text-lg mb-2 max-w-xl mx-auto">
                    We are actively building integrations for the world's most vibrant communities.
                </p>
                <p className="text-zinc-400 text-sm mb-12 max-w-lg mx-auto">
                    All integrations will be included in your Pro account when launched.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <IntegrationCard
                        name="Reddit"
                        status="Coming Soon"
                        color="bg-[#FF4500]"
                        icon={
                            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                        }
                    />
                    <IntegrationCard
                        name="Bluesky"
                        status="Coming Soon"
                        color="bg-[#0085ff]"
                        icon={
                            <svg className="w-8 h-8 text-white" viewBox="0 0 16 16" fill="currentColor"><path d="M3.468 1.948C5.303 3.325 7.276 6.118 8 7.616c.725-1.498 2.698-4.29 4.532-5.668C13.855.955 16 .186 16 2.632c0 .489-.28 4.105-.444 4.692-.572 2.04-2.653 2.561-4.504 2.246 3.236.551 4.06 2.375 2.281 4.2-3.376 3.464-4.852-.87-5.23-1.98-.07-.204-.103-.3-.103-.218 0-.081-.033.014-.102.218-.379 1.11-1.855 5.444-5.231 1.98-1.778-1.825-.955-3.65 2.28-4.2-1.85.315-3.932-.205-4.503-2.246C.28 6.737 0 3.12 0 2.632 0 .186 2.145.955 3.468 1.948" /></svg>
                        }
                    />
                    <IntegrationCard
                        name="X (Twitter)"
                        status="Coming Soon"
                        color="bg-black"
                        icon={
                            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                        }
                    />
                </div>
            </div>
        </section>
    );
}

function IntegrationCard({ name, status, icon, color }: { name: string, status: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all flex flex-col items-center gap-4 hover:-translate-y-1">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-1">{name}</h4>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{status}</span>
                </div>
            </div>
        </div>
    )
}
