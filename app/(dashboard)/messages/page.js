'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import ChatContactList from '@/components/chat/ChatContactList';
import ChatMessageBubble from '@/components/chat/ChatMessageBubble';
import ChatInput from '@/components/chat/ChatInput';

/**
 * MessagesPage - Modern chat interface with RTL support
 * 
 * Features:
 * - Contact list sorted by last message (most recent first)
 * - Senior-friendly message bubbles (20px font, rounded-2xl)
 * - Modern input with paper plane button
 * - Full RTL support for Arabic
 * - Auto-scroll to new messages
 * - Clean slate-50 background (no dot pattern)
 */
export default function MessagesPage() {
    const { data: session } = useSession();
    const { t, language, isRTL } = useLanguage();
    const { markAllAsRead } = useNotifications();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Track unread message IDs for highlighting
    const [unreadMessageIds, setUnreadMessageIds] = useState(new Set());

    // Contacts list
    const [contacts, setContacts] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState(null);

    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);

    // 1. Load contacts on mount
    useEffect(() => {
        if (session?.user) {
            loadContacts();
        }
    }, [session]);

    // 2. Poll for messages every 10 seconds
    useEffect(() => {
        let interval;
        if (selectedContactId) {
            fetchMessages(selectedContactId);
            interval = setInterval(() => {
                fetchMessages(selectedContactId);
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [selectedContactId]);

    // 3. Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadContacts = async () => {
        try {
            const res = await fetch('/api/users/chat-contacts');
            const data = await res.json();

            if (data && data.length > 0) {
                setContacts(data);
                // Auto-select first contact
                setSelectedContactId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const res = await fetch(`/api/messages?contactId=${contactId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);

                // Update last message sender info in contacts
                if (data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    setContacts(prev => prev.map(c => 
                        c.id === contactId 
                            ? { ...c, lastMessageSenderId: lastMsg.senderId }
                            : c
                    ));
                }

                // Track unread messages for highlighting
                const unreadMsgs = data.filter(m => m.senderId === contactId && !m.isRead);
                setUnreadMessageIds(new Set(unreadMsgs.map(m => m.id)));
                
                // Mark as read immediately if last message is from contact
                if (unreadMsgs.length > 0) {
                    await markAsRead(contactId);
                    // Clear notifications when entering chat
                    markAllAsRead();
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const markAsRead = async (senderId) => {
        await fetch('/api/messages/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId })
        });
        
        // Update unread count in contacts list
        setContacts(prev => prev.map(c => 
            c.id === senderId ? { ...c, unreadCount: 0 } : c
        ));
    };

    const handleSendMessage = async (content) => {
        if (!content.trim() || !selectedContactId) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    receiverId: selectedContactId
                })
            });
            const savedMessage = await res.json();

            setMessages(prev => [...prev, savedMessage]);
            
            // Update contact's last message info with sender ID
            setContacts(prev => prev.map(c => 
                c.id === selectedContactId 
                    ? { 
                        ...c, 
                        lastMessage: content, 
                        lastMessageAt: new Date().toISOString(),
                        lastMessageSenderId: session?.user?.id
                    }
                    : c
            ));
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // Get selected contact info
    const selectedContact = contacts.find(c => c.id === selectedContactId);

    if (loading) {
        return (
            <div className="p-10 text-center font-bold text-slate-400 text-xl">
                {t('loading')}
            </div>
        );
    }

    return (
        <div 
            className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
        >
            {/* Sidebar Contacts List */}
            <div className="w-1/3 min-w-[320px]">
                <ChatContactList
                    contacts={contacts}
                    selectedContactId={selectedContactId}
                    onSelectContact={setSelectedContactId}
                    currentUserId={session?.user?.id}
                    userRole={session?.user?.role}
                    isAdminContact={true}
                />
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {selectedContact && (
                            <>
                                {/* Contact avatar */}
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                                        {selectedContact.name?.charAt(0).toUpperCase() || 'C'}
                                    </div>
                                    {/* Online indicator */}
                                    <div className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white`} />
                                </div>
                                
                                {/* Contact info */}
                                <div className={isRTL ? 'text-right' : ''}>
                                    <h3 className="font-black text-slate-900 text-lg">
                                        {selectedContact.role === 'ADMIN' ? t('centralAdmin') : selectedContact.name}
                                    </h3>
                                    <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        {t('online')}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages Area - Clean slate-50 background, no dot pattern */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <User className="w-10 h-10 opacity-50" />
                            </div>
                            <p className="font-bold uppercase text-lg tracking-wider text-slate-500">
                                {t('noMessages')}
                            </p>
                            <p className="text-base mt-2 text-slate-400">
                                {t('startConversation')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === session?.user?.id;
                                // Show avatar only for first message in a sequence from the same sender
                                const showAvatar = !isMe && (
                                    idx === 0 || messages[idx - 1].senderId !== msg.senderId
                                );
                                
                                return (
                                    <ChatMessageBubble
                                        key={msg.id || idx}
                                        message={msg}
                                        isMe={isMe}
                                        showAvatar={showAvatar}
                                        contactName={selectedContact?.name}
                                        isUnread={unreadMessageIds.has(msg.id)}
                                    />
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <ChatInput
                    onSend={handleSendMessage}
                    disabled={sending || !selectedContactId}
                    autoFocus={true}
                />
            </div>
        </div>
    );
}
