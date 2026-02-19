'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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
import { useDate } from '@/context/DateContext';
import { useLanguage } from '@/context/LanguageContext';
import { generateDailyReportPDF } from '@/lib/services/pdfService';
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

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}

function AdminDashboardContent() {
    const { t, language } = useLanguage();
    const { date } = useDate();
    const router = useRouter();

    // We can rely on context, no local date state init needed
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (date) fetchStats();
    }, [date]);

    // Format display date based on language
    const getLocale = () => {
        switch(language) {
            case 'ar': return 'ar-SA';
            case 'en': return 'en-US';
            default: return 'fr-FR';
        }
    };
    const formattedDate = new Date(date).toLocaleDateString(getLocale(), {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase();

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/stats?date=${date}`);
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        setGeneratingPDF(true);
        try {
            generateDailyReportPDF(stats, date);
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
                <p className="mt-6 text-slate-900 font-black uppercase tracking-widest text-lg">{t('loading')}</p>
            </div>
        );
    }

    if (!stats) return null;

    // Palette de couleurs professionnelles
    const getEmployeeColor = (index) => {
        const colors = ['#2563eb', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
        return colors[index % colors.length];
    };

    // 1. Doughnut: État du Jour
    const doughnutData = {
        labels: [t('present'), t('absent'), t('conge'), t('maladie'), t('ferie')],
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

    // 2. Bar: Avances
    const barData = {
        labels: stats.advancesByWeek?.map((w, i) => `${t('week')} ${i + 1}`) || [],
        datasets: [{
            label: `${t('advances')} (TND)`,
            data: stats.advancesByWeek?.map(w => w.total) || [],
            backgroundColor: '#0f172a',
            borderRadius: 12,
        }]
    };

    // 3. Line: Heures Supplémentaires
    const hsLineData = {
        labels: [`${t('week')} 1`, `${t('week')} 2`, `${t('week')} 3`, `${t('week')} 4`],
        datasets: (stats.hsWeeklyByEmployee || []).map((emp, idx) => {
            const color = getEmployeeColor(idx);
            return {
                label: emp.name,
                data: emp.data,
                borderColor: color,
                backgroundColor: 'transparent',
                tension: 0.4,
                borderWidth: 4,
                pointRadius: 6,
                pointHoverRadius: 8,
            };
        })
    };

    const hsLineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'black', size: 10 } }
            }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    const statCards = [
        { label: t('monthPresenceRate'), value: `${stats.stats?.tauxPresenceJour || 0}%`, icon: Activity, color: 'blue' },
        { label: t('activeEmployees'), value: stats.stats?.totalEmployes || 0, icon: Users, color: 'slate' },
        { label: t('totalAdvances'), value: `${(stats.stats?.totalAvances || 0).toFixed(3)} TND`, icon: Wallet, color: 'rose' },
        { label: t('monthOvertime'), value: `${(stats.stats?.totalHeuresSupp || 0).toFixed(0)}h`, icon: Clock, color: 'indigo' },
    ];

    return (
        <div className={`space-y-10 pb-12 animate-fade-in ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-200">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                        {t('overview')}
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.3em] text-[10px]">
                        {t('asOf')} <span className="text-blue-600">{formattedDate}</span>
                    </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {stats.isJournalValide ? (
                        <div className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-500/30 font-bold text-xs uppercase flex items-center gap-3 shadow-sm">
                            <CheckCircle2 className="w-5 h-5 shadow-sm" /> {t('dayValidated')}
                        </div>
                    ) : (
                        <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl border border-rose-500/30 font-bold text-xs uppercase flex items-center gap-3 shadow-sm animate-pulse">
                            <AlertCircle className="w-5 h-5" /> {t('entryPending')}
                        </div>
                    )}
                    <button onClick={handleGenerateReport} disabled={generatingPDF} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-lg shadow-slate-900/10">
                        {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                        {t('printReport')}
                    </button>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {statCards.map((stat, idx) => (
                    <motion.div key={idx} whileHover={{ y: -4 }} className={`bento-card col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-between ${language === 'ar' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center mb-4 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 border border-${stat.color}-100`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter font-mono-numbers">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}

                {/* Doughnut Chart */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-2 lg:row-span-2">
                    <h3 className="text-sm font-black uppercase mb-8 flex items-center gap-3 text-slate-900">
                        <Activity className="w-4 h-4 text-blue-600" /> {t('dailyStatus')}
                    </h3>
                    <div className="h-[280px] relative">
                        <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-slate-900 font-mono-numbers">
                                {Math.round(((stats.repartitionAujourdhui?.PRESENT || 0) / (stats.stats?.totalEmployes || 1)) * 100) || 0}%
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t('presenceRate')}</span>
                        </div>
                    </div>
                    {/* Distribution details */}
                    <div className="mt-8 grid grid-cols-5 gap-1">
                        {['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'FERIE'].map((key) => (
                            <div key={key} className={`text-center ${language === 'ar' ? 'rtl-text' : ''}`}>
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-1 truncate">{t(key.toLowerCase()).slice(0, 6)}</p>
                                <div className={`h-1.5 rounded-full mb-1 ${key === 'PRESENT' ? 'bg-emerald-500' : key === 'ABSENT' ? 'bg-rose-500' : key === 'CONGE' ? 'bg-amber-500' : key === 'MALADIE' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                                <p className="text-[10px] font-black font-mono-numbers">{stats.repartitionAujourdhui?.[key] || 0}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Finance Chart */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-4 lg:row-span-1">
                    <h3 className="text-sm font-black uppercase flex items-center gap-3 mb-8 text-slate-900">
                        <Wallet className="w-4 h-4 text-rose-600" /> {t('advanceFlow')}
                    </h3>
                    <div className="h-[200px]">
                        <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>

                {/* HS Evolution */}
                <div className="bento-card col-span-1 md:col-span-4 lg:col-span-4 lg:row-span-1">
                    <h3 className="text-sm font-black uppercase flex items-center gap-3 mb-8 text-slate-900">
                        <Clock className="w-4 h-4 text-indigo-600" /> {t('overtimeEvolution')}
                    </h3>
                    <div className="h-[200px]">
                        <Line data={hsLineData} options={hsLineOptions} />
                    </div>
                </div>

                {/* Absences List */}
                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase text-slate-900">{t('alarmingAbsences')}</h3>
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.absencesJour?.map((a, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <p className="font-bold text-slate-900 uppercase text-xs">{a.nom} {a.prenom}</p>
                                <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase">{a.statut}</span>
                            </div>
                        ))}
                        {(!stats.absencesJour || stats.absencesJour.length === 0) && (
                            <div className="text-center py-12 text-slate-400 font-bold uppercase text-[9px]">{t('fullStaff')}</div>
                        )}
                    </div>
                </div>

                {/* Presences List */}
                <div className="bento-card col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black uppercase text-slate-900">{t('latestAttendance')}</h3>
                        <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats.presencesJour?.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div>
                                    <p className="font-bold text-slate-900 uppercase text-xs leading-none">{p.nom} {p.prenom}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t('validatedAt')} {new Date(p.heureValidation).toLocaleTimeString(getLocale())}</p>
                                </div>
                                <span className="text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">{p.statut}</span>
                            </div>
                        ))}
                        {(!stats.presencesJour || stats.presencesJour.length === 0) && (
                            <div className="text-center py-12">
                                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">{t('noActivityToday')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title={t('reportGenerated')} message={t('reportSuccessMessage')} />
        </div>
    );
}
