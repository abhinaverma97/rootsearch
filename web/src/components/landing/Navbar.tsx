"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const scrollToSection = (id: string) => {
        setIsMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="fixed top-6 left-0 right-0 z-50 px-6 md:px-0 flex justify-center">
            <nav className="relative flex items-center justify-between gap-6 pr-8 pl-6 py-2 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full shadow-2xl w-full max-w-[500px] md:w-auto md:max-w-none">

                {/* Logo / Icon */}
                <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors pl-2">
                    <span className="font-mono font-bold tracking-tighter text-lg">rootsearch</span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-zinc-400 hover:text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">
                        Features
                    </button>
                    <button onClick={() => scrollToSection('search')} className="hover:text-white transition-colors">
                        Search
                    </button>
                    <button onClick={() => scrollToSection('tracking')} className="hover:text-white transition-colors">
                        Alerts
                    </button>
                    <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">
                        Plans
                    </button>
                </div>

                {/* Mobile Slide-over Menu */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-zinc-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 md:hidden shadow-2xl">
                        <button onClick={() => scrollToSection('features')} className="text-left text-zinc-400 hover:text-white transition-colors py-2 px-2 hover:bg-white/5 rounded-lg">
                            Features
                        </button>
                        <button onClick={() => scrollToSection('search')} className="text-left text-zinc-400 hover:text-white transition-colors py-2 px-2 hover:bg-white/5 rounded-lg">
                            Search
                        </button>
                        <button onClick={() => scrollToSection('tracking')} className="text-left text-zinc-400 hover:text-white transition-colors py-2 px-2 hover:bg-white/5 rounded-lg">
                            Alerts
                        </button>
                        <button onClick={() => scrollToSection('pricing')} className="text-left text-zinc-400 hover:text-white transition-colors py-2 px-2 hover:bg-white/5 rounded-lg">
                            Plans
                        </button>
                    </div>
                )}
            </nav>
        </div>
    );
}
