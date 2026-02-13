'use client';

import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, ShieldCheck, Key, Calendar,
    Activity, BadgeCheck, Lock, AlertCircle,
    CheckCircle2, X, ShieldAlert, BadgeInfo
} from 'lucide-react';
import { useState } from 'react';

export default function EmployeeProfilePage() {
    const { data: session } = useSession();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const userName = session?.user?.prenom && session?.user?.nom
        ? `${session.user.prenom} ${session.user.nom}`
        : "Utilisateur";

    const initials = session?.user?.prenom && session?.user?.nom
        ? `${session.user.prenom[0]}${session.user.nom[0]}`.toUpperCase()
        : "U";

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
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Mot de passe mis à jour !' });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setMessage({ type: '', text: '' });
                }, 2000);
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Une erreur est survenue' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur de connexion' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-12">
            {/* Profile Header Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/60 p-12 border border-slate-100 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full -mr-24 -mt-24 pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative">
                        <div className="w-40 h-40 rounded-[48px] bg-slate-900 flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                            {initials}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
                            <BadgeInfo className="text-white w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest mb-4">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {session?.user?.role === 'CHEF' ? 'Portail Chef KL BETON' : 'Portail Employé KL BETON'}
                        </span>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none uppercase mb-2">
                            {userName}
                        </h1>
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" />
                            {session?.user?.email}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl p-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Key className="w-5 h-5 text-slate-600" />
                            </div>
                            Sécurité
                        </h3>

                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Mot de passe</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Dernière modification : Il y a 2 mois</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="btn btn-outline py-2 px-6 text-[10px] font-black uppercase tracking-widest"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[32px] p-8 space-y-8 text-white">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Infos Système</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <p className="text-xs font-bold text-slate-300">Statut Compte</p>
                                    <span className="text-[9px] font-black text-emerald-500 ml-auto">ACTIF</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                                    <p className="text-xs font-bold text-slate-300">Rôle</p>
                                    <span className="text-[9px] font-black text-slate-400 ml-auto uppercase">{session?.user?.role || 'EMPLOYÉ'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 uppercase">Changer mon mot de passe</h3>
                                <button onClick={() => setShowPasswordModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
                                {message.text && (
                                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        <p className="text-xs font-bold">{message.text}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ancien mot de passe</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nouveau mot de passe</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn btn-primary py-4 uppercase font-black text-xs tracking-widest"
                                >
                                    {loading ? 'Mise à jour...' : 'Mettre à jour'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
