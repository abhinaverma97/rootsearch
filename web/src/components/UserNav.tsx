'use client';

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { User, LogIn, Loader2 } from 'lucide-react';

export default function UserNav() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="w-full aspect-square flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            </div>
        );
    }

    if (status === "authenticated") {
        return (
            <Link
                href="/account"
                className="w-full aspect-square rounded-xl flex items-center justify-center transition-all bg-zinc-800 text-white shadow-inner border border-white/5 hover:bg-zinc-700"
                title="Account Settings"
            >
                {session?.user?.image ? (
                    <img src={session.user.image} alt="User" className="w-6 h-6 rounded-full" />
                ) : (
                    <User className="w-5 h-5" />
                )}
            </Link>
        );
    }

    return (
        <button
            onClick={() => signIn('google')}
            className="w-full aspect-square rounded-xl flex items-center justify-center transition-all text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
            title="Sign In"
        >
            <LogIn className="w-5 h-5" />
        </button>
    );
}
