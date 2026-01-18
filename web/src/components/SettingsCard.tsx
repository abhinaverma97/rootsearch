import React from 'react';

interface SettingsCardProps {
    title: string;
    children: React.ReactNode;
    className?: string; // Allow custom classes
}

export default function SettingsCard({ title, children, className = '' }: SettingsCardProps) {
    return (
        <div className={`p-6 bg-[#0A0A0B]/50 backdrop-blur-sm border border-white/5 rounded-2xl shadow-sm ${className}`}>
            <h2 className="text-sm uppercase font-bold text-zinc-500 mb-6 tracking-wider">{title}</h2>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
