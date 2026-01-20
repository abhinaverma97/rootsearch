'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { fetchSavedOpportunities, Opportunity, unsaveOpportunity } from '../../lib/api';
import QuickGlance from '../../components/QuickGlance';
import SearchResultCard from '../../components/SearchResultCard';
import { Bookmark, LayoutGrid, Loader2, Search, Trash2, ArrowUpRight, Menu, ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SavedPage() {
    const { status } = useSession();
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Mobile Specific State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showMobileDetail, setShowMobileDetail] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            loadSaved();
        }
    }, [status]);

    const loadSaved = async () => {
        try {
            setLoading(true);
            const data = await fetchSavedOpportunities();
            setSavedItems(data);
            if (data.length > 0 && !selectedId && window.innerWidth >= 768) {
                // Only auto-select on desktop
                setSelectedId(data[0].opportunity_id);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnsave = async (id: number) => {
        try {
            await unsaveOpportunity(id);
            setSavedItems(prev => {
                const updated = prev.filter(item => item.opportunity_id !== id);
                if (selectedId === id) {
                    setSelectedId(updated.length > 0 ? updated[0].opportunity_id : null);
                    if (updated.length === 0) setShowMobileDetail(false);
                }
                return updated;
            });
            if (savedItems.length <= 1) setShowMobileDetail(false);
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete item");
        }
    };

    const handleItemClick = (id: number) => {
        setSelectedId(id);
        setShowMobileDetail(true);
    };

    const selectedItem = savedItems.find(item => item.opportunity_id === selectedId)?.data as Opportunity;

    if (status === 'loading' || (status === 'authenticated' && loading)) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex bg-[#050505]">
                {/* Desktop Sidebar (Optional on auth page but good for structure) */}
                <div className="hidden md:block">
                    <Sidebar />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-white">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6">
                        <Bookmark className="w-10 h-10 text-zinc-700" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Sign in to view saved items</h1>
                    <p className="text-zinc-500 max-w-sm">Manage your collections, track insights, and build your product strategy based on curated data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#050505] text-zinc-300 font-sans selection:bg-white/10 overflow-hidden">
            <Sidebar />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-20 bg-[#050505] border-r border-white/10 h-full">
                        <Sidebar className="!flex !static h-full" />
                    </div>
                </div>
            )}

            <div className="flex-1 flex h-screen overflow-hidden relative">

                {/* Left Side: List/Grid */}
                <div className={`
                    absolute inset-0 md:static md:w-1/2 flex flex-col border-r border-white/5 bg-black/40 transition-transform duration-300 z-10
                    ${showMobileDetail ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}
                `}>
                    <header className="p-4 md:p-8 border-b border-white/5 bg-[#050505]/95 backdrop-blur shrink-0">
                        <div className="flex items-center justify-between mb-4 md:mb-8">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Saved Insights</h1>
                                    <p className="text-zinc-500 text-xs md:text-sm mt-0.5 md:mt-1">{savedItems.length} items collected</p>
                                </div>
                            </div>
                        </div>

                        {/* Local Search inside saved */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Filter saved items..."
                                className="w-full bg-[#111113] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-zinc-700"
                            />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-0 no-scrollbar pb-32 md:pb-0">
                        {savedItems.map((item) => {
                            const opp = item.data as Opportunity;
                            const isActive = selectedId === item.opportunity_id;

                            return (
                                <div key={item.opportunity_id} className={isActive ? "bg-white/[0.03]" : ""}>
                                    <SearchResultCard
                                        data={opp}
                                        mode="analyzed"
                                        highlightQuery=""
                                        onClick={() => handleItemClick(item.opportunity_id)}
                                        showSaveAction={false}
                                        showDetails={false}
                                    />
                                </div>
                            );
                        })}

                        {savedItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none pb-20 pt-20">
                                <Bookmark className="w-12 h-12 mb-4" />
                                <p className="text-sm font-medium uppercase tracking-[0.2em]">No saved items yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Detailed View (Slide-in on Mobile) */}
                <div className={`
                    absolute inset-0 md:static md:w-1/2 h-full bg-[#050505] transition-transform duration-300 z-20
                    ${showMobileDetail ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    {/* Mobile Detail Header */}
                    <div className="md:hidden flex items-center gap-3 p-4 border-b border-white/5 bg-[#050505] sticky top-0 z-30">
                        <button
                            onClick={() => setShowMobileDetail(false)}
                            className="p-2 -ml-2 text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-white">Insight Details</span>
                    </div>

                    {selectedItem ? (
                        <QuickGlance
                            opportunity={selectedItem}
                            onClose={() => {
                                setShowMobileDetail(false);
                                // Don't clear selectedId immediately on desktop to keep context
                                if (window.innerWidth < 768) setSelectedId(null);
                            }}
                            isSavedView={true}
                            onDelete={() => handleUnsave(selectedItem.id)}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-center opacity-40">
                            <div>
                                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-medium uppercase tracking-[0.2em]">Select an item to view intelligence</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
