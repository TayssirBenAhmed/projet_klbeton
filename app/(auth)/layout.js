'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950">
            {children}
        </div>
    );
}
