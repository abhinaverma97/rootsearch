'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans">
            <div className="max-w-4xl mx-auto px-6 py-16">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
                <p className="text-zinc-500 mb-12">Last updated: January 20, 2026</p>

                <div className="prose prose-invert prose-zinc max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            By accessing and using RootSearch, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Description of Service</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            RootSearch is a market intelligence platform that analyzes publicly available 4chan discussions to identify product opportunities, market trends, and user insights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            To use RootSearch, you must:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Create an account using Google OAuth</li>
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your account</li>
                            <li>Be at least 18 years old</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Subscription Plans</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            RootSearch offers Free and Pro subscription plans:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li><strong className="text-zinc-300">Free Plan:</strong> Limited access to features with usage restrictions</li>
                            <li><strong className="text-zinc-300">Pro Plan:</strong> $10/month for unlimited access to all features</li>
                        </ul>
                        <p className="text-zinc-400 leading-relaxed mt-4">
                            Pro subscriptions are billed monthly and can be cancelled at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Acceptable Use</h2>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            You agree NOT to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-400">
                            <li>Use the service for any illegal purposes</li>
                            <li>Scrape or extract data using automated tools</li>
                            <li>Share your account credentials with others</li>
                            <li>Reverse engineer or copy our service</li>
                            <li>Misuse or abuse the platform</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            RootSearch and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other laws. The analyzed insights are provided for informational purposes only.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Disclaimer</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            RootSearch is not affiliated with or endorsed by 4chan. All data is sourced from publicly available information. Insights are generated using AI and should be used as supplementary research, not as definitive market data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            RootSearch is provided "as is" without warranties of any kind. We are not liable for any decisions made based on insights from our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            For questions about these Terms, contact us at{' '}
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
