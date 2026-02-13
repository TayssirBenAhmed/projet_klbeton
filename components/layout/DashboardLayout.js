'use client';

import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If no session, we don't render Sidebar/Header (for login pages if they fall under this layout)
    if (!session) {
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {children}
                </main>
            </div>
        </div>
    );
}
