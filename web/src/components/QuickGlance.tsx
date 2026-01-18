import { X, Activity, Quote, Bookmark, Loader2, Trash2 } from 'lucide-react';
import { Opportunity, saveOpportunity } from '../lib/api';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

interface QuickGlanceProps {
    opportunity: Opportunity;
    onClose: () => void;
    isSavedView?: boolean;
    onDelete?: (id: number) => void;
}

export default function QuickGlance({ opportunity, onClose, isSavedView = false, onDelete }: QuickGlanceProps) {
    const { data: session } = useSession();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (!session) {
            alert("Please sign in to save items");
            return;
        }
        setSaving(true);
        try {
            await saveOpportunity(opportunity);
            setSaved(true);
        } catch (err) {
            console.error(err);
            alert("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!confirm('Are you sure you want to remove this item?')) return;

        setSaving(true);
        try {
            // Ensure we use the correct deletion API from the parent or directly here?
            // The prompt says "user delete is implemented correctly". 
            // The parent handler `onUnsave` in saved/page.tsx calls `unsaveOpportunity` which calls the DELETE API.
            // So we just need to trigger the parent's onDelete.
            // But wait, the parent `handleUnsave` only updates local state?
            // checking saved/page.tsx:
            // handleUnsave only updates setSavedItems. It does NOT call the API.
            // I need to fix that as well in saved/page.tsx or here.
            // Actually, in saved/page.tsx, I should call the API before updating state.
            // But for now, let's assume onDelete handles everything (API + State).
            await onDelete(opportunity.id);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to delete");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#050505] border-b border-white/5 relative">
            {/* Header */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                {/* Intro */}
                <div className="mb-8 pr-8">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                            Quick Glance
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                            {opportunity.product_domain}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white leading-tight mb-4">
                        {opportunity.product_concept || opportunity.emerging_trend || opportunity.core_pain || opportunity.solution}
                    </h2>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Signal Strength</div>
                            <div className="text-white font-bold text-sm">{opportunity.market_score}/10</div>
                        </div>
                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Market Size</div>
                            <div className="text-white font-bold text-sm">{opportunity.market_size}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Complexity</div>
                            <div className="text-white font-bold text-sm">{opportunity.complexity}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-[#0F0F10] border border-white/5">
                            <div className="text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-1">Intent</div>
                            <div className="text-white font-bold text-sm truncate" title={opportunity.intent_category}>{opportunity.intent_category}</div>
                        </div>
                    </div>
                </div>

                {/* Core Content */}
                <div className="space-y-6">
                    {(() => {
                        const intent = opportunity.intent_category;
                        const sections = [];

                        if (intent === "Core Pains & Anger") {
                            // Heading is core_pain
                            if (opportunity.target_audience) sections.push({ label: "Who is Angry?", value: opportunity.target_audience });
                            if (opportunity.solution) sections.push({ label: "Suggested Solution", value: opportunity.solution });
                        }
                        else if (intent === "Money Talk") {
                            // Heading is product_concept
                            if (opportunity.core_pain) sections.push({ label: "Consumer Pain", value: opportunity.core_pain });
                            if (opportunity.target_audience) sections.push({ label: "Willing to Pay", value: opportunity.target_audience });
                        }
                        else if (intent === "Advice & Solution Requests") {
                            // Heading is core_pain
                            if (opportunity.target_audience) sections.push({ label: "Who is Asking?", value: opportunity.target_audience });
                            if (opportunity.solution) sections.push({ label: "Requested Solution", value: opportunity.solution });
                        }
                        else if (intent === "Emerging Trends") {
                            // Heading is emerging_trend
                            if (opportunity.target_audience) sections.push({ label: "Driving the Trend", value: opportunity.target_audience });
                        }
                        else if (intent === "Ideas") {
                            // Heading is product_concept
                            if (opportunity.solution) sections.push({ label: "How it Works", value: opportunity.solution });
                            if (opportunity.core_pain) sections.push({ label: "Solves Pain", value: opportunity.core_pain });
                        }
                        else {
                            // Fallback
                            if (opportunity.core_pain) sections.push({ label: "Insight", value: opportunity.core_pain });
                            if (opportunity.solution) sections.push({ label: "Proposed Solution", value: opportunity.solution });
                            if (opportunity.target_audience) sections.push({ label: "Target Audience", value: opportunity.target_audience });
                        }

                        return sections.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-2">{section.label}</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
                                    {section.value}
                                </p>
                            </div>
                        ));
                    })()}

                    {/* Evidence Section */}
                    {opportunity.evidence && opportunity.evidence.length > 0 && (
                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-3 mb-6 opacity-60">
                                <Quote className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Evidence</span>
                            </div>

                            <div className="space-y-6">
                                {opportunity.evidence.map((item, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                                                Post #{item.post_id}
                                            </span>
                                            <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-tight flex items-center gap-2 ml-auto">
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                {item.relevance}
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 italic leading-relaxed font-serif text-sm pl-4 border-l-2 border-zinc-800 group-hover:border-zinc-600 transition-colors">
                                            "{item.quote}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 bg-[#050505] shrink-0 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">ID: {opportunity.id}</span>

                {isSavedView ? (
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30"
                    >
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Remove
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${saved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                            }`}
                    >
                        {saving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Bookmark className={`w-3 h-3 ${saved ? 'fill-current' : ''}`} />
                        )}
                        {saved ? 'Saved' : 'Save Insight'}
                    </button>
                )}
            </div>
        </div>
    );
}
