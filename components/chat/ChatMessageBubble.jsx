'use client';

import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * ChatMessageBubble - Modern, senior-friendly message bubble
 * 
 * Features:
 * - Large 20px font for senior readability
 * - Rounded-2xl corners for modern look
 * - Blue bubbles for sender (me), light gray for receiver
 * - Double check icon for read status
 * - RTL support
 * - Smooth animations
 */
export default function ChatMessageBubble({
    message,
    isMe,
    showAvatar = false,
    contactName,
    isUnread = false
}) {
    const { t, language, isRTL } = useLanguage();

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(
            language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR',
            { hour: '2-digit', minute: '2-digit' }
        );
    };

    // Get status icon and text
    const getStatus = () => {
        if (!isMe) return null;
        
        if (message.isRead) {
            return {
                icon: <CheckCheck className="w-4 h-4 text-blue-400" />,
                text: t('read')
            };
        } else if (message.isDelivered) {
            return {
                icon: <CheckCheck className="w-4 h-4 text-slate-400" />,
                text: t('delivered')
            };
        } else {
            return {
                icon: <Check className="w-4 h-4 text-slate-400" />,
                text: t('sent')
            };
        }
    };

    const status = getStatus();
    const time = formatTime(message.createdAt);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isRTL ? 'flex-row-reverse' : ''}`}
        >
            <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-3 max-w-[85%]`}>
                {/* Avatar (only for receiver messages) */}
                {!isMe && showAvatar && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm">
                        {contactName?.charAt(0).toUpperCase() || '?'}
                    </div>
                )}

                {/* Message bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                        className={`px-6 py-4 rounded-2xl shadow-sm ${
                            isMe
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : isUnread
                                    ? 'bg-slate-100 text-slate-800 rounded-bl-md border-4 border-rose-500 animate-pulse'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-md'
                        }`}
                    >
                        {/* Message content - 20px font for senior readability */}
                        <p className="text-xl font-bold leading-relaxed">
                            {message.content}
                        </p>
                    </div>

                    {/* Time and status */}
                    <div className={`flex items-center gap-2 mt-2 px-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs font-medium text-slate-400">
                            {time}
                        </span>
                        
                        {status && (
                            <div className="flex items-center gap-1" title={status.text}>
                                {status.icon}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
