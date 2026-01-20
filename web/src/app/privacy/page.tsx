'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                <p className="text-zinc-500 mb-12">Last updated: January 20, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            RootSearch ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            When you use RootSearch, we collect:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-300">Account Information:</strong> Email address, name, and profile picture (via Google OAuth)</li>
                            <li><strong className="text-zinc-300">Usage Data:</strong> Search queries, saved insights, and keyword tracking preferences</li>
                            <li><strong className="text-zinc-300">Technical Data:</strong> IP address, browser type, and device information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            We use your information to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Provide and improve our market intelligence service</li>
                            <li>Save your search preferences and insights</li>
                            <li>Process payments for Pro subscriptions</li>
                            <li>Send important service updates</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Data Storage</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Your data is stored securely on our servers. We implement industry-standard security measures to protect your information from unauthorized access.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            We use the following third-party services:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-300">Google OAuth:</strong> For authentication</li>
                            <li><strong className="text-zinc-300">Razorpay:</strong> For payment processing</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            You have the right to access, update, or delete your personal information. Contact us at{' '}
                            <a href="mailto:rootsearch247@gmail.com" className="text-violet-400 hover:text-violet-300">
                                rootsearch247@gmail.com
                            </a>{' '}
                            to exercise these rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            If you have questions about this Privacy Policy, contact us at{' '}
                            <a href="mailto:rootsearch247@gmail.com" className="text-violet-400 hover:text-violet-300">
                                rootsearch247@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
