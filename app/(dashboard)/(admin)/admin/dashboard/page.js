'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    Users,
    Clock,
    AlertCircle,
    CheckCircle2,
    Activity,
    Calendar,
    ChevronRight,
    ArrowUpRight,
    Loader2,
    Wallet,
    ArrowRight
} from 'lucide-react';
import { generateProfessionalPDF } from '@/lib/services/pdfService';
import SuccessModal from '@/components/ui/SuccessModal';
import Link from 'next/link';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingPDF(true);
        try {
            const mois = new Date().getMonth() + 1;
            const annee = new Date().getFullYear();
            const res = await fetch(`/api/rapports?mois=${mois}&annee=${annee}&t=${Date.now()}`);
            const data = await res.json();

            generateProfessionalPDF(data, mois, annee);
            setShowSuccess(true);
        } catch (error) {
            console.error('Erreur génération rapport dashboard:', error);
        } finally {
            setGeneratingPDF(false);
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

    if (!stats) return null;

    // Palette de couleurs professionnelles pour les employés
    const getEmployeeColor = (index) => {
        const colors = [
            '#2563eb', // Blue 600
            '#f43f5e', // Rose 500
            '#10b981', // Emerald 500
            '#f59e0b', // Amber 500
            '#8b5cf6', // Violet 500
            '#06b6d4', // Cyan 500
            '#ec4899', // Pink 500
            '#6366f1', // Indigo 500
            '#14b8a6', // Teal 500
            '#f97316', // Orange 500
        ];
        return colors[index % colors.length];
    };

    // 1. Doughnut: État du Jour (5 catégories)
    const doughnutData = {
        labels: ['Présents', 'Absents', 'Congés', 'Maladie', 'Fériés'],
        datasets: [{
            data: [
                stats.repartitionAujourdhui?.PRESENT || 0,
                stats.repartitionAujourdhui?.ABSENT || 0,
                stats.repartitionAujourdhui?.CONGE || 0,
                stats.repartitionAujourdhui?.MALADIE || 0,
                stats.repartitionAujourdhui?.FERIE || 0,
            ],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#ec4899', '#3b82f6'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    // 2. Bar: Avances sous-salaire versées sur le mois
    const barData = {
        labels: stats.advancesByWeek?.map(w => w.week) || [],
        datasets: [{
            label: 'Avances (TND)',
            data: stats.advancesByWeek?.map(w => w.total) || [],
            backgroundColor: '#0f172a',
            borderRadius: 12,
        }]
    };

    // 3. Line: Heures Supplémentaires par employé (Évolution)
    const hsLineData = {
        labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
        datasets: (stats.hsWeeklyByEmployee || []).map((emp, idx) => {
            const color = getEmployeeColor(idx);
            return {
                label: emp.name,
                data: emp.data,
                borderColor: color,
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: color,
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#ffffff',
            };
        })
    };

    const hsLineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                onClick: (e, legendItem, legend) => {
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    if (ci.isDatasetVisible(index)) {
                        ci.hide(index);
                        legendItem.hidden = true;
                    } else {
                        ci.show(index);
                        legendItem.hidden = false;
                    }
                },
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: { weight: 'black', size: 10, family: 'Inter' },
                    color: '#64748b'
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y || 0;
                        const name = context.dataset.label || '';
                        return `${name} : ${value} heures`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
                ticks: { font: { weight: 'bold' } }
            },
            x: {
                grid: { display: false }
            }
        }
    };

    const statCards = [
        { label: 'Taux Présence (Mois)', value: `${stats.stats?.tauxPresenceJour || 0}%`, icon: Activity, color: 'blue' },
        { label: 'Employés Actifs', value: stats.stats?.totalEmployes || 0, icon: Users, color: 'slate' },
        { label: 'Total Avances', value: `${(stats.stats?.totalAvances || 0).toFixed(3)} TND`, icon: Wallet, color: 'rose' },
        { label: 'H. Supp (Mois)', value: `${(stats.stats?.totalHeuresSupp || 0).toFixed(0)}h`, icon: Clock, color: 'indigo' },
    ];

    return (
        <div className="space-y-10 pb-12 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                        VUE <span className="text-blue-600">D'ENSEMBLE</span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">Tableau de bord administrateur</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {stats.isJournalValide ? (
                        <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-500/30 font-bold text-xs uppercase flex items-center gap-3 shadow-sm">
                            <CheckCircle2 className="w-5 h-5" /> Journée Validée par le Chef
                        </div>
                    ) : (
                        <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl border border-rose-500/30 font-bold text-xs uppercase flex items-center gap-3 shadow-sm animate-pulse">
                            <AlertCircle className="w-5 h-5" /> Saisie du jour en attente
                        </div>
                    )}
                    <button onClick={handleGenerateReport} disabled={generatingPDF} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-lg shadow-slate-900/10">
                        {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                        Générer la Paie
                    </button>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {/* Stats Bento Cards */}
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -4, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        className="bento-card col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <Activity className="w-4 h-4 text-slate-200" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter font-mono-numbers">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}

                {/* Main Distribution Chart - Bento Spanning */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-2 lg:row-span-2">
                    <h3 className="text-sm font-black uppercase mb-8 flex items-center gap-3 text-slate-900">
                        <Activity className="w-4 h-4 text-blue-600" /> État du Jour
                    </h3>
                    <div className="h-[280px] relative">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-slate-900 font-mono-numbers">
                                {Math.round(((stats.repartitionAujourdhui?.PRESENT || 0) / (stats.stats?.totalEmployes || 1)) * 100) || 0}%
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Taux Présence</span>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-5 gap-1">
                        {[
                            { label: 'Prés.', key: 'PRESENT', color: 'bg-emerald-500' },
                            { label: 'Abs.', key: 'ABSENT', color: 'bg-rose-500' },
                            { label: 'Congé', key: 'CONGE', color: 'bg-amber-500' },
                            { label: 'Malad.', key: 'MALADIE', color: 'bg-pink-500' },
                            { label: 'Férié', key: 'FERIE', color: 'bg-blue-500' }
                        ].map((item, i) => (
                            <div key={i} className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-1 truncate">{item.label}</p>
                                <div className={`h-1.5 rounded-full mb-1 ${item.color}`} />
                                <p className="text-[10px] font-black font-mono-numbers">{stats.repartitionAujourdhui?.[item.key] || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Finance Chart - Bento Spanning */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-4 lg:row-span-1">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black uppercase flex items-center gap-3 text-slate-900">
                            <Wallet className="w-4 h-4 text-rose-600" /> Flux des Avances
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 border border-slate-100 px-2 py-1 rounded-md uppercase tracking-widest">Mensuel</span>
                    </div>
                    <div className="h-[200px]">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { beginAtZero: true, grid: { borderDash: [4, 4], color: '#f1f5f9' }, ticks: { font: { family: 'JetBrains Mono', size: 10 } } },
                                    x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 10 } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* HS Evolution - Bento Spanning */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-4 lg:row-span-1">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black uppercase flex items-center gap-3 text-slate-900">
                            <Clock className="w-4 h-4 text-indigo-600" /> Évolution des HS
                        </h3>
                        <div className="flex gap-2">
                            {['Sélection'].map(l => (
                                <span key={l} className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">{l}</span>
                            ))}
                        </div>
                    </div>
                    <div className="h-[200px]">
                        <Line
                            data={hsLineData}
                            options={{
                                ...hsLineOptions,
                                scales: {
                                    y: { ...hsLineOptions.scales.y, ticks: { ...hsLineOptions.scales.y.ticks, font: { family: 'JetBrains Mono' } } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Lists Section - Bento Spanning */}
                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase text-slate-900">Absences Alarmantes</h3>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.absencesJour?.map((a, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:text-rose-500 transition-colors">
                                        {a.nom[0]}{a.prenom[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs">{a.nom} {a.prenom}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{a.reprise || 'Non spécifié'}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-rose-100">
                                    {a.statut}
                                </span>
                            </div>
                        ))}
                        {(stats.absencesJour?.length === 0 || !stats.absencesJour) && (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Effectif au complet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase text-slate-900">Derniers Pointages</h3>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.presencesJour?.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-100 flex items-center justify-center font-bold text-white text-xs uppercase">
                                        {p.nom[0]}{p.prenom[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs leading-none">{p.nom} {p.prenom}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1.5">
                                            Validé à {new Date(p.heureValidation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border ${p.statut === 'PRESENT' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                            p.statut === 'ABSENT' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                p.statut === 'CONGE' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                    p.statut === 'MALADIE' ? 'text-pink-600 bg-pink-50 border-pink-100' :
                                                        'text-blue-600 bg-blue-50 border-blue-100'
                                        }`}>
                                        {p.statut}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(stats.presencesJour?.length === 0 || !stats.presencesJour) && (
                            <div className="text-center py-12">
                                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Aucun pointage enregistré pour le {new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        )}
                    </div>
                    <Link
                        href="/admin/dashboard/pointages"
                        className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:gap-4 transition-all"
                    >
                        Voir tout l'historique <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Rapport Généré"
                message={`Le récapitulatif a été traité avec succès.`}
            />
        </div>
    );
}
