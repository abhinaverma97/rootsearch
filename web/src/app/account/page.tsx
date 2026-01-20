'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Sidebar from '../../components/Sidebar';
import { User, LogOut, Check } from 'lucide-react';
import { plans } from '../../lib/plans';
import { processPayment } from '../../lib/razorpay';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    if (!session) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505] text-zinc-300">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Account</h1>
                    <p className="mb-4">Please sign in to view your account.</p>
                </div>
            </div>
        );
    }

    const user = session.user as any;
    const isPro = user.plan_type === 'pro';
    const currentPlan = isPro ? plans.find(p => p.id === 'pro') : plans.find(p => p.id === 'free');
    const proPlan = plans.find(p => p.id === 'pro');

    const handleUpgrade = () => {
        processPayment(
            { name: user.name, email: user.email, id: user.id },
            async () => {
                await update(); // Force session refresh to get new plan_type
                router.refresh();
            }
        );
    };

    return (
        <div className="flex min-h-screen bg-[#050505] font-sans text-zinc-300">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
                        <p className="text-zinc-500 mt-2">Manage your profile and subscription.</p>
                    </div>

                    {/* Profile Section */}
                    <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                    {user.image ? <img src={user.image} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-zinc-500" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <p className="text-zinc-500">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-zinc-500">ID: {user.id?.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Section */}
                    <div className="bg-[#0A0A0B] border border-white/5 rounded-2xl p-8 relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        Subscription Plan
                                        {isPro ?
                                            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-[10px] uppercase font-bold rounded-full border border-violet-500/20">Pro Active</span>
                                            : <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold rounded-full border border-white/10">Free Plan</span>
                                        }
                                    </h2>
                                    <p className="text-zinc-500 mt-1">
                                        {isPro ? "You have full access to all RootSearch features." : "You are currently on the Free plan."}
                                    </p>

                                    {/* Show deadline for Pro users */}
                                    {isPro && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="text-xs text-zinc-600">Plan expires:</span>
                                            <span className="text-xs font-bold text-emerald-400">Never (Admin Access)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isPro && proPlan && (
                                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-violet-900/20 to-transparent border border-violet-500/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className='flex-1'>
                                            <h4 className="text-lg font-bold text-white mb-2">Unlock Full Access</h4>
                                            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                                                Get everything in Free, plus:
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                                {proPlan.features.filter(f => !currentPlan?.features.includes(f)).map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></div>
                                                        <span className="text-xs text-zinc-300">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <a
                                            href="/#pricing"
                                            className="shrink-0 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 whitespace-nowrap block text-center"
                                        >
                                            Upgrade now - ${proPlan?.price}/mo
                                        </a>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Sign Out */}
                    <div className="flex justify-end pt-8 border-t border-white/5">
                        <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
