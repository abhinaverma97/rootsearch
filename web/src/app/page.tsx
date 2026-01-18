"use client";

import { useState, useEffect } from "react";
import { fetchGlobalStats } from "../lib/api";
import HeroSection from "../components/landing/HeroSection";
import BoardsPreview from "../components/landing/BoardsPreview";
import SearchPreview from "../components/landing/SearchPreview";
import InsightsPreview from "../components/landing/InsightsPreview";
import TrackingPreview from "../components/landing/TrackingPreview";
import Navbar from "../components/landing/Navbar";
import PricingSection from "../components/landing/PricingSection";
import UpcomingIntegrations from "../components/landing/UpcomingIntegrations";

export default function Home() {
    const [stats, setStats] = useState<{ posts: number, boards: number } | null>(null);

    useEffect(() => {
        fetchGlobalStats().then(setStats).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />
            {/* 1. Hero */}
            <HeroSection stats={stats} />

            {/* 2. Boards Preview */}
            <BoardsPreview />

            {/* 3. Search Preview */}
            <SearchPreview />

            {/* 4. Insights Preview */}
            <InsightsPreview />

            {/* 5. Tracking & Saved Preview */}
            <TrackingPreview />

            {/* 6. Pricing */}
            <PricingSection />

            {/* 7. Upcoming Integrations */}
            <UpcomingIntegrations />

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-zinc-600 text-sm">
                <p>&copy; {new Date().getFullYear()} RootSearch. All rights reserved.</p>
            </footer>
        </div>
    );
}
