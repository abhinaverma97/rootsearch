import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterDropdownProps {
    label?: string; // Optional label prefix (e.g. "Score:")
    options: string[] | { label: string, value: string | number | null }[];
    value: string | number | null;
    onChange: (value: any) => void;
    placeholder?: string;
    className?: string; // For wrapper
}

export default function FilterDropdown({ label, options, value, onChange, placeholder = 'Any', className = '' }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);

    // Normalize options to {label, value}
    const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string') {
            return { label: opt, value: opt === 'Any' ? null : opt };
        }
        return opt;
    });

    const currentLabel = normalizedOptions.find(o => o.value === value)?.label || placeholder;

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 text-xs text-zinc-300 hover:text-white font-bold transition-colors focus:outline-none"
            >
                {label && <span className="text-zinc-500 font-medium">{label}</span>}
                <span className="truncate max-w-[150px]">{currentLabel}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-[#111113] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="py-1 max-h-60 overflow-y-auto no-scrollbar">
                            {normalizedOptions.map((opt, idx) => {
                                const isSelected = opt.value === value;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between group ${isSelected ? 'bg-violet-500/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                                    >
                                        <span className={`font-medium ${isSelected ? 'text-violet-400' : ''}`}>{opt.label}</span>
                                        {isSelected && <Check className="w-3 h-3 text-violet-400" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
