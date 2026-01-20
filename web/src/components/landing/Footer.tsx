import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-white/5 bg-[#050505] py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <h3 className="font-mono font-bold text-lg text-white mb-3">rootsearch</h3>
                        <p className="text-sm text-zinc-500 mb-4 max-w-sm">
                            Market intelligence from 4chan. Turn chaotic threads into actionable insights.
                        </p>
                        <div className="flex items-center gap-2 text-zinc-600 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                            <span>Not affiliated with 4chan</span>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Product</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
                            </li>
                            <li>
                                <a href="/#pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</a>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Contact</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="mailto:rootsearch247@gmail.com"
                                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Mail className="w-3 h-3" />
                                    Email
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://x.com/abhinaverma97"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    X (Twitter)
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-6 border-t border-white/5 text-center text-xs text-zinc-600">
                    © {new Date().getFullYear()} RootSearch. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
