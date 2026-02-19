'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext();

/**
 * NotificationContext - Global notification state for unread messages
 * 
 * Features:
 * - Tracks unread message count globally
 * - Fetches unread count periodically
 * - Provides methods to mark messages as read
 * - Used by alert banners and badges throughout the app
 */
export function NotificationProvider({ children }) {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const [lastMessageFrom, setLastMessageFrom] = useState(null);
    const [contacts, setContacts] = useState([]);

    // Load contacts for name resolution
    const loadContacts = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/users/chat-contacts');
            const data = await res.json();
            setContacts(data);
        } catch (error) {
            console.error('Error loading contacts:', error);
        }
    }, [session]);

    // Get sender name from contacts
    const getSenderName = useCallback((senderId) => {
        const contact = contacts.find(c => c.id === senderId);
        return contact?.name || 'Admin';
    }, [contacts]);

    // Fetch unread messages count
    const fetchUnreadCount = useCallback(async () => {
        if (!session?.user) return;
        
        try {
            const res = await fetch('/api/messages/unread');
            const data = await res.json();
            
            if (typeof data.count === 'number') {
                // Check if new message arrived
                if (data.count > unreadCount && data.count > 0) {
                    setHasNewMessage(true);
                    // Use the sender name from API (real name of the person who sent the message)
                    const senderName = data.lastSenderName || getSenderName(data.lastSenderId) || 'Utilisateur';
                    setLastMessageFrom(senderName);
                    
                    // Show toast notification with the REAL sender name
                    toast.success(`🔔 ${senderName} a envoyé un message`, {
                        duration: 5000,
                        position: 'top-right',
                        style: {
                            background: '#10B981',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            padding: '16px 24px',
                            borderRadius: '12px',
                        },
                        icon: '💬',
                    });
                }
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, [session, unreadCount, getSenderName]);

    // Poll for new messages every 10 seconds
    useEffect(() => {
        if (!session?.user) return;
        
        loadContacts();
        fetchUnreadCount();
        
        const interval = setInterval(fetchUnreadCount, 10000);
        return () => clearInterval(interval);
    }, [session, fetchUnreadCount, loadContacts]);

    // Mark all messages as read
    const markAllAsRead = useCallback(async () => {
        if (!session?.user) return;
        
        try {
            await fetch('/api/messages/read-all', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            
            setUnreadCount(0);
            setHasNewMessage(false);
            setLastMessageFrom(null);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, [session]);

    // Dismiss the new message alert
    const dismissAlert = useCallback(() => {
        setHasNewMessage(false);
    }, []);

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            hasNewMessage,
            lastMessageFrom,
            fetchUnreadCount,
            markAllAsRead,
            dismissAlert,
            showNotification: (senderName) => {
                toast.success(`🔔 ${senderName} a envoyé un message`, {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        background: '#10B981',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        padding: '16px 24px',
                        borderRadius: '12px',
                    },
                    icon: '💬',
                });
            }
        }}>
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                }}
            />
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationContext;
