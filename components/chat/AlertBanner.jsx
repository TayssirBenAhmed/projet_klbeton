'use client';

import { motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';

/**
 * AlertBanner - Red alert banner for new messages from Admin
 * 
 * Features:
 * - Blinking red banner at top of page
 * - Shows for CHEF when new message from ADMIN
 * - Dismissible
 * - Links to messages page
 * - Full RTL support
 */
export default function AlertBanner() {
    const { t, isRTL } = useLanguage();
    const { hasNewMessage, unreadCount, lastMessageFrom, dismissAlert } = useNotifications();

    if (!hasNewMessage && unreadCount === 0) return null;

    // Dynamic message based on who sent the message
    const bannerText = lastMessageFrom 
        ? `⚠️ NOUVEAU MESSAGE DE : ${lastMessageFrom.toUpperCase()}`
        : t('newMessageFromAdmin');

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="relative w-full bg-rose-600 text-white shadow-lg z-50"
        >
            {/* Blinking animation overlay */}
            <div className="absolute inset-0 bg-rose-500 animate-pulse opacity-50" />
            
            <div className="relative max-w-7xl mx-auto px-4 py-3">
                <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* Alert content */}
                    <Link 
                        href="/messages"
                        className={`flex items-center gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        >
                            <Bell className="w-6 h-6" />
                        </motion.div>
                        
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="font-black text-lg uppercase tracking-wide">
                                {bannerText}
                            </span>
                            {unreadCount > 0 && (
                                <span className="bg-white text-rose-600 font-black text-sm px-2 py-0.5 rounded-full min-w-[24px] text-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Dismiss button */}
                    <button
                        onClick={dismissAlert}
                        className="p-1 hover:bg-rose-700 rounded-full transition-colors"
                        title={t('close')}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
