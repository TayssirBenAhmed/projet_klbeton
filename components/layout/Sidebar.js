import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Clock,
    FileBarChart,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Truck,
    Wallet,
    Calendar,
    UserCircle,
    User,
    CheckCircle2,
    X,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const role = session?.user?.role;

    // Poll for unread messages
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/messages/unread');
                const data = await res.json();
                setUnreadCount(data.count || 0);
            } catch (error) {
                console.error('Error fetching unread count', error);
            }
        };

        if (session) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 15000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const adminNavigation = [
        { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Gestion Employés", href: "/admin/dashboard/employes", icon: Users },
        { name: "Historique Pointages", href: "/admin/dashboard/historique", icon: Calendar },
        { name: "Finances", href: "/admin/dashboard/finances", icon: Wallet },
        { name: "Messages", href: "/messages", icon: MessageSquare, badge: true },
        { name: "Rapports & Exports", href: "/admin/dashboard/rapports", icon: FileBarChart },
        { name: "Paramètres", href: "/admin/dashboard/profile", icon: Settings },
    ];

    const chefNavigation = [
        { name: "Saisie du Jour", href: "/chef/pointage", icon: ClipboardList },
        { name: "Historique", href: "/chef/historique", icon: Calendar },
        { name: "Messages", href: "/messages", icon: MessageSquare, badge: true },
        { name: "Paramètres", href: "/chef/profile", icon: Settings },
    ];

    const employeeNavigation = [
        { name: "Mon Profil", href: "/user/profile", icon: UserCircle },
    ];

    let navigation = [];
    if (pathname.startsWith('/admin')) {
        navigation = adminNavigation;
    } else if (pathname.startsWith('/chef')) {
        navigation = chefNavigation;
    } else if (pathname.startsWith('/user')) {
        navigation = employeeNavigation;
    } else {
        if (role === 'ADMIN') navigation = adminNavigation;
        else if (role === 'CHEF') navigation = chefNavigation;
        else navigation = employeeNavigation;
    }

    const isActive = (href) => {
        if (href === '/admin/dashboard' || href === '/chef/pointage' || href === '/user/profile') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const displayUserName = pathname.startsWith('/admin') ? 'Admin' :
        pathname.startsWith('/chef') ? 'Chef' :
            (session?.user?.prenom && session?.user?.nom ? `${session.user.prenom} ${session.user.nom}` : "Utilisateur");

    const displayInitials = pathname.startsWith('/admin') ? 'A' :
        pathname.startsWith('/chef') ? 'C' :
            (session?.user?.prenom && session?.user?.nom ? `${session.user.prenom[0]}${session.user.nom[0]}`.toUpperCase() : "U");

    return (
        <aside
            className={`flex flex-col h-screen sticky top-0 transition-all duration-500 ease-in-out border-r border-slate-200 glass-card
            ${isCollapsed ? 'w-24' : 'w-72'}`}
        >
            {/* Logo Section */}
            <div className={`p-8 mb-4 flex items-center gap-4 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 border border-slate-800">
                    <Truck className="text-blue-500 w-6 h-6" />
                </div>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-black text-2xl tracking-tighter text-slate-900"
                    >
                        KL BETON<span className="text-blue-600">.</span>
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 relative group
                            ${active
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50/80'
                                }`}
                        >
                            {active && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 bg-slate-900 rounded-2xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className="relative">
                                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-blue-500' : ''}`} />
                                {item.badge && unreadCount > 0 && !isCollapsed && (
                                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-black shadow-sm ring-2 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>

                            {!isCollapsed && (
                                <motion.span
                                    initial={false}
                                    animate={{ opacity: 1 }}
                                    className="whitespace-nowrap flex-1"
                                >
                                    {item.name}
                                </motion.span>
                            )}

                            {/* Short badge if collapsed or active indicator */}
                            {active && !isCollapsed && !item.badge && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full"
                                />
                            )}
                            {item.badge && unreadCount > 0 && !isCollapsed && (
                                <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-100 space-y-4">
                {/* User Info Card */}
                {!isCollapsed && (
                    <div className="flex items-center gap-4 px-4 py-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                            {displayInitials}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-900 truncate">{displayUserName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{role}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => signOut({ callbackUrl: role === 'ADMIN' ? '/login-admin' : '/employee-login' })}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    {!isCollapsed && <span>Déconnexion</span>}
                </button>

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-4 top-32 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all z-50 lg:flex hidden"
                >
                    {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
                </button>
            </div>
        </aside>
    );
}


