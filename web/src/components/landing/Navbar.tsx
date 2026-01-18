"use client";

import React from "react";
import Link from "next/link";
import { Command } from "lucide-react";

export default function Navbar() {
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="flex items-center gap-6 pr-8 pl-6 py-2 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">

                {/* Logo / Icon */}
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors pl-2">
                    <span className="font-mono font-bold tracking-tighter text-lg">rootsearch</span>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                        Features
                    </button>
                    <button onClick={() => document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                        Search
                    </button>
                    <button onClick={() => document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                        Alerts
                    </button>
                    <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">
                        Plans
                    </button>
                </div>
            </nav>
        </div>
    );
}
