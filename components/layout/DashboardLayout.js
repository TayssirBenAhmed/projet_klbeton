'use client';

import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import Header from './Header';
import AlertBanner from '@/components/chat/AlertBanner';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardLayout({ children }) {
    const { data: session, status } = useSession();
    const { isRTL } = useLanguage();

    if (status === 'loading') {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-klbeton-gradient">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If no session, we don't render Sidebar/Header (for login pages if they fall under this layout)
    if (!session) {
        return <>{children}</>;
    }

    return (
        <div className={`flex h-screen overflow-hidden font-sans bg-klbeton-gradient ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AlertBanner />
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
