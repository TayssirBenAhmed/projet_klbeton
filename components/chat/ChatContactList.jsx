'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * ChatContactList - Modern chat contacts sidebar with priority sorting
 * 
 * Features:
 * - Sorts contacts by lastMessageAt (most recent first)
 * - Shows last message preview and time
 * - Displays unread count badge
 * - Online status indicator
 * - Large avatars with initials (senior-friendly)
 * - RTL support
 */
export default function ChatContactList({
    contacts,
    selectedContactId,
    onSelectContact,
    currentUserId,
    userRole,
    isAdminContact = false
}) {
    const { t, language, isRTL } = useLanguage();

    // Filter contacts: Chef only sees ADMIN
    const filteredContacts = userRole === 'CHEF' 
        ? contacts.filter(c => c.role === 'ADMIN')
        : contacts;

    // Sort contacts by lastMessageAt (most recent first)
    const sortedContacts = [...filteredContacts].sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
        return dateB - dateA;
    });

    // Format time for display
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(
            language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR',
            { hour: '2-digit', minute: '2-digit' }
        );
    };

    // Truncate message preview
    const truncateMessage = (text, maxLength = 25) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Get avatar color based on name
    const getAvatarColor = (name) => {
        const colors = [
            'bg-blue-500',
            'bg-emerald-500',
            'bg-violet-500',
            'bg-amber-500',
            'bg-rose-500',
            'bg-cyan-500',
            'bg-indigo-500',
            'bg-pink-500'
        ];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    };

    return (
        <div className="w-full h-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase text-base tracking-wider">
                    {t('contacts')}
                </h3>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
                {sortedContacts.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-slate-400 font-bold uppercase text-sm">
                            {t('noContactAvailable')}
                        </p>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="divide-y divide-slate-50"
                    >
                        <AnimatePresence mode="popLayout">
                            {sortedContacts.map((contact) => {
                                const isSelected = selectedContactId === contact.id;
                                const hasUnread = contact.unreadCount > 0;
                                const isOnline = contact.isOnline || false;
                                const lastMessage = contact.lastMessage;
                                const lastMessageTime = formatTime(contact.lastMessageAt);
                                const avatarColor = getAvatarColor(contact.name);
                                
                                // Check if last message is from current user
                                const isLastMessageFromMe = contact.lastMessageSenderId === currentUserId;

                                return (
                                    <motion.button
                                        key={contact.id}
                                        layout
                                        variants={itemVariants}
                                        onClick={() => onSelectContact(contact.id)}
                                        className={`w-full p-4 flex items-center gap-4 transition-all duration-200 ${
                                            isSelected 
                                                ? 'bg-blue-50 border-r-4 border-blue-500' 
                                                : 'hover:bg-slate-50'
                                        } ${isRTL ? 'flex-row-reverse' : ''}`}
                                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                                    >
                                        {/* Avatar with online indicator - Larger for ADMIN */}
                                        <div className="relative flex-shrink-0">
                                            <div 
                                                className={`rounded-full flex items-center justify-center font-black text-white shadow-md ${
                                                    isSelected 
                                                        ? 'bg-blue-600 w-14 h-14 text-xl' 
                                                        : isAdminContact || contact.role === 'ADMIN'
                                                            ? 'bg-rose-600 w-16 h-16 text-2xl'
                                                            : `w-14 h-14 text-xl ${avatarColor}`
                                                }`}
                                            >
                                                {contact.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            {/* Online status dot */}
                                            <div 
                                                className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-4 h-4 rounded-full border-2 border-white ${
                                                    isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                            />
                                            {/* Large unread badge on avatar for ADMIN */}
                                            {hasUnread && (isAdminContact || contact.role === 'ADMIN') && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                                                >
                                                    <span className="text-white font-black text-base">
                                                        {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                                                    </span>
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Contact info */}
                                        <div className={`flex-1 min-w-0 text-left ${isRTL ? 'text-right' : ''}`}>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`font-bold text-lg truncate ${
                                                    isSelected 
                                                        ? 'text-blue-900' 
                                                        : hasUnread && (isAdminContact || contact.role === 'ADMIN')
                                                            ? 'text-rose-600'
                                                            : 'text-slate-800'
                                                }`}>
                                                    {/* Display real name for all contacts */}
                                                    {contact.name || contact.email}
                                                </p>
                                                {lastMessageTime && (
                                                    <span className="text-xs font-medium text-slate-400 flex-shrink-0">
                                                        {lastMessageTime}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Last message preview with real names */}
                                            <p className={`text-sm truncate mt-1 flex items-center gap-1 ${isLastMessageFromMe ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {lastMessage ? (
                                                    <>
                                                        {isLastMessageFromMe && (
                                                            <Send className={`w-3 h-3 ${isRTL ? '-scale-x-100' : ''}`} />
                                                        )}
                                                        <span className="font-semibold">
                                                            {isLastMessageFromMe 
                                                                ? t('me') 
                                                                : (contact.name?.split(' ')[0] || contact.name)
                                                            }: 
                                                        </span>
                                                        {truncateMessage(lastMessage)}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 italic">{t('startConversation')}</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Unread badge - Hidden for ADMIN (shown on avatar instead) */}
                                        {hasUnread && !(isAdminContact || contact.role === 'ADMIN') && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex-shrink-0 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center shadow-md"
                                            >
                                                <span className="text-white font-bold text-sm">
                                                    {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                                                </span>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
