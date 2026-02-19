'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Briefcase,
    Calendar,
    Mail,
    Wallet,
    History,
    Palmtree,
    Stethoscope,
    Trash2,
    ArrowLeft,
    TrendingUp,
    Clock,
    CheckCircle2,
    Download,
    ShieldCheck,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import AvancesTab from './AvancesTab';

export default function EmployeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [employe, setEmploye] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        fetchEmploye();
    }, [params.id]);

    const fetchEmploye = async () => {
        try {
            const res = await fetch(`/api/employes/${params.id}`);
            const data = await res.json();
            setEmploye(data);
        } catch (error) {
            console.error('Erreur chargement employé:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;

        try {
            await fetch(`/api/employes/${params.id}`, { method: 'DELETE' });
            router.push('/admin/dashboard/employes');
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Chargement du profil...</p>
            </div>
        );
    }

    if (!employe) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    <User className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Employé non trouvé</h3>
                <p className="text-slate-500 mt-2">Le profil que vous recherchez n'existe pas ou a été supprimé.</p>
                <button onClick={() => router.back()} className="mt-6 btn btn-outline gap-2">
                    <ArrowLeft className="w-4 h-4" /> Retour à la liste
                </button>
            </div>
        );
    }

    // Fix for the error reporting: ensure initials are generated safely
    const initials = `${employe?.nom?.[0] || ''}${employe?.prenom?.[0] || ''}`.toUpperCase();

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold uppercase tracking-widest text-[10px] transition-colors"
                >
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Retour aux employés
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open(`/api/rapports?employeId=${params.id}`, '_blank')}
                        className="btn btn-outline gap-2 text-[10px] uppercase font-bold tracking-widest shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Rapport Mensuel
                    </button>
                    <button onClick={handleDelete} className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 gap-2 text-[10px] uppercase font-bold tracking-widest shadow-sm">
                        <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/30">
                            {initials}
                        </div>
                        <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg ${employe?.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}>
                            <CheckCircle2 className="text-white w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
                                {employe?.nom} {employe?.prenom}
                            </h1>
                            <span className={`badge ${employe?.statut === 'ACTIF' ? 'badge-success' : 'badge-info'}`}>
                                {employe?.statut || 'INCONNU'}
                            </span>
                        </div>
                        <p className="text-lg text-slate-500 font-semibold mb-6 flex items-center justify-center md:justify-start gap-2">
                            <Briefcase className="w-5 h-5 text-blue-500" />
                            {employe?.poste || 'Poste non défini'}
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">ID: {employe?.employeeId || '---'}</span>
                        </p>

                        <div className="grid grid-cols-2 md:flex gap-8 md:gap-12">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date d'embauche</p>
                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {employe?.dateEmbauche ? new Date(employe.dateEmbauche).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : 'N/A'}
                                </p>
                            </div>
                            {/* Fixed: Show Monthly Salary and Daily Salary separately */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salaire Mensuel</p>
                                <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
                                    <Wallet className="w-4 h-4" />
                                    {(employe?.salaireBase || 0).toFixed(3)} TND
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salaire Journalier</p>
                                <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {((employe?.salaireBase || 0) / 26).toFixed(3)} TND
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Salaire Horaire</p>
                                <p className="text-sm font-bold text-purple-600 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    {(employe?.recapMensuel?.salaire?.tauxHoraire || ((employe?.salaireBase || 0) / 26 / 8)).toFixed(2)} TND
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs & Content */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                    {[
                        { id: 'info', label: 'Informations', icon: User },
                        { id: 'pointages', label: 'Historique', icon: History },
                        { id: 'conges', label: 'Congés', icon: Palmtree },
                        { id: 'avances', label: 'Avances', icon: Wallet },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active
                                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'info' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="card">
                                        <div className="flex items-center gap-3 mb-8 border-l-4 border-blue-600 pl-4">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Statistiques Individuelles</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                                    <TrendingUp className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Présence (Mois)</p>
                                                <p className="text-2xl font-black text-slate-900">{employe?.recapMensuel?.pointages?.presence || 0} jours</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">H. Supp (Mois)</p>
                                                <p className="text-2xl font-black text-slate-900">+{employe?.recapMensuel?.pointages?.heuresSupp || 0}h</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                                                    <Wallet className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net à payer</p>
                                                <p className="text-2xl font-black text-slate-900">{(employe?.recapMensuel?.salaire?.salaireNet || 0).toLocaleString()} TND</p>
                                                {(employe?.recapMensuel?.salaire?.resteARembourser > 0) && (
                                                    <p className="text-rose-600 text-[10px] font-bold mt-1 uppercase animate-pulse">
                                                        Dette actuelle : {employe.recapMensuel.salaire.resteARembourser.toFixed(3)} TND
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-8">
                                    <div className="card h-fit">
                                        <div className="flex items-center gap-3 mb-8 border-l-4 border-blue-600 pl-4">
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Soldes Actuels</h3>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-6 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                                                <Palmtree className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Congés Payés</p>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-5xl font-black leading-none">{employe?.soldeConges ?? 0}</span>
                                                    <span className="text-sm font-bold opacity-80 mb-1 tracking-tight">Jours restants</span>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-gradient-to-br from-rose-600 to-rose-800 rounded-3xl text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
                                                <Stethoscope className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12" />
                                                <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Congés Maladie</p>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-5xl font-black leading-none">{employe?.soldeMaladie ?? 0}</span>
                                                    <span className="text-sm font-bold opacity-80 mb-1 tracking-tight">Jours restants</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pointages' && (
                            <div className="card">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Historique Complet</h3>
                                    </div>
                                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                                        Tout exporter <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>

                                {employe.pointages && employe.pointages.length > 0 ? (
                                    <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date du pointage</th>
                                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                                    <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps (Jours)</th>
                                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Heures Supp.</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {employe.pointages.map((p) => (
                                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td className="px-8 py-5 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                                                                    {new Date(p.date).getDate()}
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-700">
                                                                    {new Date(p.date).toLocaleDateString('fr-FR', {
                                                                        weekday: 'short',
                                                                        day: 'numeric',
                                                                        month: 'long',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center whitespace-nowrap">
                                                            <span className={`badge ${p.statut === 'PRESENT' ? 'badge-success' :
                                                                p.statut === 'ABSENT' ? 'badge-danger' :
                                                                    p.statut === 'CONGE' ? 'badge-warning' : 'badge-info'
                                                                }`}>
                                                                {p.statut}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-center whitespace-nowrap text-sm font-black text-slate-900 lowercase tracking-tighter">
                                                            {p.joursTravailles === 1 ? '01 jour' : '00 jour'}
                                                        </td>
                                                        <td className="px-8 py-5 text-right whitespace-nowrap">
                                                            <span className={`text-sm font-bold ${p.heuresSupp > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                                {p.heuresSupp > 0 ? `+${p.heuresSupp}h` : '—'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                        <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucun historique disponible</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'conges' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="card">
                                    <div className="flex items-center gap-3 mb-10 border-l-4 border-blue-600 pl-4">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Historique des Absences</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {employe.pointages?.filter(p => p.statut !== 'PRESENT').slice(0, 5).map((abs, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${abs.statut === 'ABSENT' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        {abs.statut === 'ABSENT' ? <Trash2 className="w-5 h-5" /> : <Palmtree className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{abs.statut}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                            {new Date(abs.date).toLocaleDateString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">1 jour</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card bg-slate-900 text-white border-none shadow-blue-900/40">
                                    <div className="flex items-center gap-3 mb-10 border-l-4 border-blue-500 pl-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Objectif Mensuel</h3>
                                    </div>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-5xl font-black">{employe?.recapMensuel?.salaire?.totalJoursPayes || 0}</span>
                                        <span className="text-xl font-bold text-slate-400 mb-2">/ 26 jours</span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-8 font-medium">
                                        Total jours validés (Présence + Congés + Fériés) pour ce mois.
                                    </p>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                                                <span>Progression</span>
                                                <span className="text-blue-400">
                                                    {Math.min(100, Math.round(((employe?.recapMensuel?.salaire?.totalJoursPayes || 0) / 26) * 100))}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, ((employe?.recapMensuel?.salaire?.totalJoursPayes || 0) / 26) * 100)}%` }}
                                                    className={`h-full shadow-[0_0_15px_rgba(59,130,246,0.5)] ${(employe?.recapMensuel?.salaire?.totalJoursPayes || 0) >= 26 ? 'bg-emerald-500' : 'bg-blue-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'avances' && (
                            <AvancesTab employeId={params.id} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
