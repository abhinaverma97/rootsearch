import Link from "next/link";
import { Home, Layers, Search, Key, User, LogIn, Bookmark } from 'lucide-react';
import UserNav from './UserNav';

export default function Sidebar() {
    return (
        <div className="h-screen sticky top-0 w-20 flex flex-col items-center py-6 border-r border-white/10 bg-[#050505]/50 backdrop-blur-sm z-30">
            {/* Logo/Home Icon */}
            <Link href="/" className="mb-8 p-3 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                <span className="font-mono font-bold tracking-tighter text-xl">rs</span>
            </Link>

            <div className="flex flex-col gap-4 w-full px-4">
                <NavItem href="/boards">
                    <Layers className="w-5 h-5" />
                </NavItem>
                <NavItem href="/search" active={false}>
                    <Search className="w-5 h-5" />
                </NavItem>
                <NavItem href="/keywords">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                </NavItem>
                <NavItem href="/saved">
                    <Bookmark className="w-5 h-5" />
                </NavItem>
            </div>

            <div className="mt-auto flex flex-col gap-4 w-full px-4">
                <UserNav />
            </div>
        </div>
    );
}

function NavItem({ children, active = false, href }: { children: React.ReactNode; active?: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${active
                ? "bg-zinc-800 text-white shadow-inner border border-white/5"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
        >
            {children}
        </Link>
    )
}
