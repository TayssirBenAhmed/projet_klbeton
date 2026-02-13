'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Clock,
    Loader2,
    CheckCircle2,
    XCircle,
    FileText,
    Users
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function FinancesPage() {
    const [stats, setStats] = useState({
        totalAvancesApproved: 0,
        totalAvancesPending: 0,
        resteAPayerMois: 0,
    });
    const [avances, setAvances] = useState([]);
    const [weeklyChart, setWeeklyChart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchFinances = async () => {
        try {
            const res = await fetch('/api/dashboard/finances');
            if (!res.ok) throw new Error('Erreur API');
            const data = await res.json();

            setStats(data.stats);
            setAvances(data.avances || []);
            setWeeklyChart(data.weeklyChart || []);
        } catch (error) {
            console.error('Erreur finances:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinances();
    }, []);

    const handleAction = async (id, statut) => {
        const target = avances.find(a => a.id === id);
        try {
            setActionLoading(id);
            const res = await fetch(`/api/avances/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statut })
            });

            if (!res.ok) throw new Error('Erreur');

            // Optimistic UI update — remove from list with animation
            setAvances(prev => prev.map(a => a.id === id ? { ...a, statut } : a));

            showToast(
                `Avance de ${target.employe.prenom} ${statut === 'APPROVED' ? 'approuvée' : 'rejetée'} avec succès`,
                statut === 'APPROVED' ? 'success' : 'error'
            );

            // Refresh stats after a slight delay for animation
            setTimeout(() => {
                fetchFinances();
            }, 600);
        } catch (error) {
            showToast('Erreur lors de la validation', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const pendingAvances = avances.filter(a => a.statut === 'PENDING');
    const recentActions = avances
        .filter(a => a.statut === 'APPROVED' || a.statut === 'REJECTED')
        .sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date))
        .slice(0, 50); // Increased slice limit for scrolling

    const chartData = {
        labels: weeklyChart.map(w => w.week),
        datasets: [{
            label: 'Avances Approuvées (DT)',
            data: weeklyChart.map(w => w.total),
            backgroundColor: '#2563eb',
            borderRadius: 12,
            borderSkipped: false,
        }]
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                titleFont: { weight: 'bold', size: 12 },
                bodyFont: { size: 14 },
                padding: 12,
                cornerRadius: 12,
                callbacks: {
                    label: (ctx) => `${ctx.parsed.y.toFixed(3)} DT`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { display: false },
                ticks: {
                    font: { weight: 'bold', size: 11 },
                    callback: (v) => `${v.toFixed(3)} DT`
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: 'bold', size: 12 } }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-16 h-16 border-8 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-6 text-slate-900 font-black uppercase tracking-widest text-lg">CHARGEMENT...</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-10 pb-12">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl border-2 flex items-center gap-3 font-black text-sm uppercase tracking-wide
                            ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'}`}
                    >
                        {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header */}
            <div className="flex justify-between items-center border-b-4 border-slate-900 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <Wallet className="w-7 h-7" />
                        </div>
                        Contrôle des Finances
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Validation des dettes et avances — Mois en cours</p>
                </div>
                {pendingAvances.length > 0 && (
                    <div className="bg-amber-50 text-amber-700 px-5 py-3 rounded-2xl border-2 border-amber-400 font-black text-xs uppercase flex items-center gap-2 animate-pulse">
                        <Clock className="w-4 h-4" />
                        {pendingAvances.length} en attente
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Avances Approuvées (Mois)', value: `${stats.totalAvancesApproved.toFixed(3)} DT`, color: 'text-emerald-600', bgIcon: 'bg-emerald-50', icon: TrendingUp },
                    // Si dette existe, on l'affiche en priorité ou en plus
                    ...(stats.totalDetteMois > 0 ? [{
                        label: 'Dette Totale (Employés)',
                        value: `${stats.totalDetteMois.toFixed(3)} DT`,
                        color: 'text-rose-600',
                        bgIcon: 'bg-rose-50',
                        icon: XCircle
                    }] : [{
                        label: 'En attente de validation',
                        value: `${stats.totalAvancesPending.toFixed(3)} DT`,
                        color: 'text-amber-600',
                        bgIcon: 'bg-amber-50',
                        icon: Clock
                    }]),
                    { label: 'Masse Salariale (Net Payé)', value: `${stats.resteAPayerMois.toFixed(3)} DT`, color: 'text-blue-600', bgIcon: 'bg-blue-50', icon: Wallet },
                ].map((s, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-white p-8 rounded-[32px] border-3 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] ${s.color === 'text-rose-600' ? 'border-rose-600' : 'border-slate-900'}`}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 ${s.bgIcon} rounded-xl flex items-center justify-center`}>
                                <s.icon className={`w-6 h-6 ${s.color}`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Pending Avances */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weekly Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-[40px] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)]"
                >
                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
                        <TrendingUp className="text-blue-600" /> Flux Hebdomadaire
                    </h3>
                    <div className="h-[300px]">
                        {weeklyChart.length > 0 ? (
                            <Bar data={chartData} options={chartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-300">
                                <p className="font-black uppercase tracking-widest text-xs">Aucune donnée</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Pending Avances — Scrollable */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-[40px] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(37,99,235,1)] overflow-hidden flex flex-col"
                >
                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
                        <Clock className="text-amber-500" /> Avances à Valider
                        {pendingAvances.length > 0 && (
                            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-full">
                                {pendingAvances.length}
                            </span>
                        )}
                    </h3>

                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 flex-1" style={{ scrollbarWidth: 'thin' }}>
                        <AnimatePresence mode="popLayout">
                            {pendingAvances.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Toutes les avances sont traitées ✓</p>
                                </motion.div>
                            ) : (
                                pendingAvances.map((av) => (
                                    <motion.div
                                        key={av.id}
                                        layout
                                        initial={{ opacity: 0, x: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 300, scale: 0.8 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                        className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-900 uppercase truncate">
                                                    {av.employe.prenom} {av.employe.nom}
                                                </p>
                                                <p className="text-2xl font-black text-blue-600">{av.montant.toFixed(3)} DT</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                        {new Date(av.date).toLocaleDateString('fr-FR')}
                                                    </p>
                                                    {av.note && (
                                                        <p className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]" title={av.note}>
                                                            💬 {av.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button
                                                    onClick={() => handleAction(av.id, 'APPROVED')}
                                                    disabled={actionLoading === av.id}
                                                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-emerald-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                                                </button>
                                                <button
                                                    onClick={() => handleAction(av.id, 'REJECTED')}
                                                    disabled={actionLoading === av.id}
                                                    className="bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase hover:bg-rose-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Rejeter
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            {/* Recent Actions Log */}
            {recentActions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[40px] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
                >
                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-3">
                        <FileText className="text-slate-600" /> Historique Récent
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {recentActions.map((av) => (
                            <div key={av.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${av.statut === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {av.statut === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 uppercase text-sm">{av.employe.prenom} {av.employe.nom}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(av.date).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg font-black text-slate-900">{av.montant.toFixed(3)} DT</p>
                                    <span className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase ${av.statut === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {av.statut === 'APPROVED' ? 'APPROUVÉE' : 'REJETÉE'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
