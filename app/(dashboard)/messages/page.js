'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDate } from '@/context/DateContext';

export default function MessagesPage() {
    const { data: session } = useSession();
    const { date } = useDate(); // Context available if needed, but chat usually realtime
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // For Admin: List of contacts (Chefs)
    // For Chef: Contact is Admin
    const [contacts, setContacts] = useState([]);
    const [selectedContactId, setSelectedContactId] = useState(null);

    const scrollRef = useRef(null);

    // 1. Identify User Role & Load Contacts/Messages
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
            }, 10000); // 10s auto-refresh
        }
        return () => clearInterval(interval);
    }, [selectedContactId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadContacts = async () => {
        try {
            // We need an endpoint to get users for chat. 
            // Reuse existing or mock for now? Admin needs list of Chefs.
            // Let's assume we can fetch users. 
            // Creating a quick inline fetch or dedicated endpoint?
            // Let's use /api/users if exists, or just fetch known roles?
            // Wait, we don't have a standardized 'get all users' endpoint visible in recent context.
            // But we do have 'api/employes' which links to users.
            // Let's try to fetch active users via a new small logic or assume we just load messages and see who spoke?
            // BETTER: Admin sees list of CHEFS. Chef sees ADMIN.

            // I'll assume we can implement a quick fetch logic in `api/messages/contacts` or similar.
            // Or just hardcode for V1 if we don't have user management API ready?
            // Actually, we can just use the `api/messages` to get 'recent conversations'.
            // But if it's a new chat, we need a list.

            // Let's fetch "available chat partners". 
            // Logic: 
            // If Admin -> Fetch all users with role CHEF.
            // If Chef -> Fetch all users with role ADMIN.

            // I'll create `api/users/chat-contacts` quickly?
            // Or just fallback to a known endpoint. 
            // Let's add fetching logic here directly if possible? No, we need server side.
            // I will implement `api/users/chat-contacts/route.js` next.

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

                // Mark as read immediately if last message is from contact
                const unread = data.filter(m => m.senderId === contactId && !m.isRead);
                if (unread.length > 0) {
                    await markAsRead(contactId);
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
        // Trigger sidebar badge update? (Maybe global context or event?)
        // For distinct update, we might rely on SWR or next fetch cycle
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContactId) return;

        const tempId = Date.now();
        const content = newMessage;

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
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-400">CHARGEMENT MESSAGERIE...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
            {/* Sidebar Contacts List (Visible mostly for Admin, or list of Admins for Chef) */}
            <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-wider">Contacts</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {contacts.length === 0 ? (
                        <p className="p-4 text-xs text-slate-400 font-bold uppercase">Aucun contact disponible</p>
                    ) : (
                        contacts.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`w-full p-4 flex items-center gap-3 border-b border-slate-50 transition-colors ${selectedContactId === contact.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${selectedContactId === contact.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-200 text-slate-500'}`}>
                                    {contact.name?.charAt(0) || 'U'}
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-bold ${selectedContactId === contact.id ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {contact.name || contact.email}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                                        {contact.role}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {selectedContactId && contacts.find(c => c.id === selectedContactId) && (
                            <>
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                                    {contacts.find(c => c.id === selectedContactId)?.name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-wider">
                                        {contacts.find(c => c.id === selectedContactId)?.name}
                                    </h3>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> En ligne
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 scroll-smooth"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <User className="w-12 h-12 mb-2 opacity-50" />
                            <p className="font-bold uppercase text-xs tracking-widest">Aucun message</p>
                            <p className="text-[10px] mt-1">Démarrez la conversation</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === session.user.id;
                            return (
                                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] sm:max-w-[60%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`px-5 py-3 rounded-2xl shadow-sm border ${isMe
                                                ? 'bg-blue-600 text-white border-blue-500 rounded-br-none'
                                                : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 px-1">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <span title={msg.isRead ? "Lu" : "Envoyé"}>
                                                    {msg.isRead ? (
                                                        <div className="flex">
                                                            <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                                            <CheckCircle2 className="w-3 h-3 text-blue-500 -ml-2" />
                                                        </div>
                                                    ) : (
                                                        <CheckCircle2 className="w-3 h-3 text-slate-300" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:font-bold placeholder:uppercase placeholder:text-xs"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 active:scale-95 transform duration-100"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
