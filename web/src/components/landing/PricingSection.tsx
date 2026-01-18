'use client';

import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { plans } from '../../lib/plans';

import { signIn, useSession } from 'next-auth/react';
import { processPayment } from '../../lib/razorpay';
import { useRouter } from 'next/navigation';

export default function PricingSection() {
    const { data: session } = useSession();
    const router = useRouter();
    const user = session?.user as any;
    const isPro = user?.plan_type === 'pro';

    const handleProUpgrade = (user: any) => {
        if (!user) {
            signIn('google', { callbackUrl: '/account' }); // Login if not authed
            return;
        }
        if (isPro) {
            router.push('/account');
            return;
        }

        processPayment(
            { name: user.name, email: user.email, id: user.id },
            async () => {
                alert('Payment Successful! You are now a Pro member.');
                window.location.reload();
            }
        );
    };

    return (
        <section className="py-24 px-8 relative overflow-hidden" id="pricing">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-[10px] uppercase font-black tracking-[0.3em] text-violet-500">Subscription Plans</h2>
                    <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">Scale your discovery.</h3>
                    <p className="text-zinc-500 max-w-xl mx-auto text-lg leading-relaxed">
                        Start for free to browse the signals, or go full access to unlock the complete AI research engine.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`
                                relative p-8 rounded-3xl border transition-all duration-500 group flex flex-col h-full
                                ${plan.highlight
                                    ? 'bg-gradient-to-b from-white/[0.08] to-transparent border-violet-500/30 shadow-2xl shadow-violet-500/10'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-violet-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                    Recommended
                                </div>
                            )}

                            <div className="mb-8">
                                <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-white tracking-tight">${plan.price}</span>
                                    {plan.originalPrice && (
                                        <span className="text-xl text-zinc-600 line-through decoration-zinc-600 decoration-2">${plan.originalPrice}</span>
                                    )}
                                    <span className="text-zinc-500 text-sm">/month</span>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="space-y-4 mb-10">
                                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600">Features</span>
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-violet-500/20' : 'bg-white/5'}`}>
                                            <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-violet-400' : 'text-zinc-500'}`} />
                                        </div>
                                        <span className="text-sm text-zinc-300 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button Logic */}
                            {plan.name === "Free" ? (
                                // FREE PLAN LOGIC
                                session ? (
                                    <Link
                                        href="/boards"
                                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 mt-auto"
                                    >
                                        Resume Exploring
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => signIn('google', { callbackUrl: '/boards' })}
                                        className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 mt-auto"
                                    >
                                        Start Exploring
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                )
                            ) : (
                                // PRO PLAN LOGIC (Full Access)
                                <button
                                    onClick={() => handleProUpgrade(session?.user)}
                                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5 mt-auto"
                                >
                                    {isPro ? "Manage Subscription" : "Go Full Access"}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-zinc-600 text-xs">
                        Secure payments processed via Razor pay. Cancel anytime.
                    </p>
                </div>
            </div>
        </section>
    );
}
