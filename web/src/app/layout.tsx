import '../styles/globals.css';
import type { ReactNode } from 'react';
import Providers from './providers';

export const metadata = {
    title: 'RootSearch',
    description: 'Archive · Analyze · Search',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="bg-[#050505] text-white min-h-screen font-sans">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
