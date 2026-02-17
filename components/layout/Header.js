'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Calendar, UserCircle, LogOut, ShieldCheck, User as UserIcon, ChevronDown } from 'lucide-react';

import { useDate } from '@/context/DateContext';

export default function Header() {
    return (
        <Suspense fallback={null}>
            <HeaderContent />
        </Suspense>
    );
}

function HeaderContent() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { date, setDate } = useDate(); // Global Date
    const role = session?.user?.role;

    const isAdmin = role === 'ADMIN';

    const displayFullName = session?.user?.name ||
        (session?.user?.prenom && session?.user?.nom ? `${session.user.prenom} ${session.user.nom}` : null) ||
        session?.user?.email?.split('@')[0] ||
        "Utilisateur";

    const initials = session?.user?.name?.charAt(0) ||
        session?.user?.prenom?.charAt(0) ||
        session?.user?.nom?.charAt(0) ||
        "U";

    const welcomeLabel = pathname.startsWith('/admin') ? 'ADMIN' :
        pathname.startsWith('/chef') ? 'CHEF' :
            (session?.user?.prenom || 'MEMBRE');

    return (
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-10 py-5 sticky top-0 z-40">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">
                            Bienvenue, <span className="text-blue-600">{welcomeLabel}</span>
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-100 shadow-sm shadow-blue-500/5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>
                                    {role === 'ADMIN' ? 'Accès Administrateur' :
                                        role === 'CHEF' ? 'Portail Chef' : 'Espace Employé'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10">
                    {/* Admin Global Date Picker */}
                    {isAdmin && (
                        <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-800">
                            <div className="flex items-center bg-slate-800 rounded-xl px-4 py-2 border border-slate-700/50">
                                <Calendar className="w-4 h-4 text-blue-400 mr-3" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    <div className="hidden lg:flex items-center gap-3 text-slate-500 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 shadow-inner">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {new Date().toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-5 border-l border-slate-100 pl-10">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{displayFullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{session?.user?.email}</p>
                        </div>
                        <div className="relative group cursor-pointer">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-[3px] shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
                                <div className="w-full h-full bg-white rounded-[13px] flex items-center justify-center text-blue-800 font-black text-sm">
                                    {initials.toUpperCase()}
                                </div>
                            </div>

                            <div className="absolute right-0 mt-4 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 text-slate-900 font-bold">
                                <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-50">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{displayFullName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{session?.user?.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const profileUrl = role === 'ADMIN' ? '/admin/dashboard/profile' :
                                            role === 'CHEF' ? '/chef/profile' : '/user/profile';
                                        window.location.href = profileUrl;
                                    }}
                                    className="w-full flex items-center gap-3 p-4 text-slate-700 hover:bg-slate-50 rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest mb-1"
                                >
                                    <UserCircle className="w-4 h-4 text-blue-500" /> Mon Profil
                                </button>
                                <button
                                    onClick={() => signOut({
                                        callbackUrl: role === 'ADMIN' ? '/login-admin' : '/employee-login'
                                    })}
                                    className="w-full flex items-center gap-3 p-4 text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors text-[10px] font-black uppercase tracking-widest"
                                >
                                    <LogOut className="w-4 h-4" /> Se déconnecter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
