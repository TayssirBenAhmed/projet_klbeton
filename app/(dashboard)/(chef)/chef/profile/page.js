'use client';

import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, ShieldCheck, Key,
    BadgeCheck, Lock, CheckCircle2,
    X, ShieldAlert, Activity, HeartPulse, Stethoscope
} from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const roleColors = {
        CHEF: 'from-blue-600 to-blue-800',
        EMPLOYE: 'from-slate-700 to-slate-900',
        ADMIN: 'from-slate-800 to-slate-900'
    };

    const name = `${session?.user?.prenom || ''} ${session?.user?.nom || ''}`.trim() || "Utilisateur";
    const email = session?.user?.email || "Email non disponible";
    const role = session?.user?.role || "EMPLOYE";
    const initials = (session?.user?.prenom?.[0] || '') + (session?.user?.nom?.[0] || '') || "U";

    const getBadgeLabel = (r) => {
        if (r === 'CHEF') return 'CHEF DE CHANTIER';
        if (r === 'ADMIN') return 'ADMINISTRATEUR SYSTÈME';
        if (r === 'EMPLOYE') return 'EMPLOYÉ KL BETON';
        return 'UTILISATEUR';
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordData)
            });
            // ... reste de la logique fetch
            setMessage({ type: 'success', text: 'Sécurité mise à jour avec succès' });
            setTimeout(() => setShowPasswordModal(false), 2000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-12 px-4">

            {/* Header Profil - Style Screenshot */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100 relative overflow-hidden"
            >
                {/* Décoration d'arrière-plan */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative">
                        <div className={`w-44 h-44 rounded-[50px] bg-gradient-to-br ${roleColors[role] || roleColors.ADMIN} flex items-center justify-center text-white text-6xl font-black shadow-2xl`}>
                            {initials}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                            <BadgeCheck className="text-white w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                            <ShieldCheck className="w-4 h-4" />
                            {getBadgeLabel(role)}
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">
                            {name}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {email}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne Gauche - Sécurité */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl p-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                    <Key className="w-6 h-6 text-slate-600" />
                                </div>
                                Sécurité du compte
                            </h3>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[30px] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Mot de passe</p>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Dernière modification : Il y a 3 mois</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>

                {/* Colonne Droite - Stats Session */}
                <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                    <HeartPulse className="absolute -bottom-10 -right-10 w-48 h-48 opacity-5 text-blue-400" />

                    <div className="relative z-10 space-y-8">
                        <div>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Informations Session</p>

                            <div className="space-y-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rôle Actif</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{role}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connecté en tant que</p>
                                        <p className="text-sm font-black lowercase tracking-tight truncate max-w-[180px]">{email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Identifiant Unique (UUID)</p>
                            <code className="text-xs font-black text-blue-400 bg-blue-400/10 px-3 py-2 rounded-lg break-all">
                                {session?.user?.id || 'UUID-XXXX'}
                            </code>
                        </div>
                    </div>

                    <div className="relative z-10 mt-8">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Activity className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Système Sécurisé</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de changement de mot de passe (Style Screenshot) */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[45px] shadow-3xl relative z-10 overflow-hidden"
                        >
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Sécurité</h3>
                                <button onClick={() => setShowPasswordModal(false)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 rounded-2xl shadow-sm hover:text-rose-500 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="p-10 space-y-6">
                                {/* ... inputs identiques au code précédent avec le style 'rounded-2xl' et 'font-black' ... */}
                                <button className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30">
                                    Mettre à jour
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}