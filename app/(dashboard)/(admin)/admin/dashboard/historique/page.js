'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    FileText,
    User,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { generateDailyReportPDF } from '@/lib/services/pdfService';

export default function HistoriquePage() {
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatingPDF, setGeneratingPDF] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filterDate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pointagesRes, employesRes] = await Promise.all([
                fetch(`/api/pointages?dateDebut=${filterDate}&dateFin=${filterDate}`),
                fetch('/api/employes'),
            ]);

            const pointagesData = await pointagesRes.json();
            const employesData = await employesRes.json();

            setPointages(pointagesData);
            setEmployes(employesData);
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPointages = useMemo(() => {
        return pointages.filter(p => {
            const emp = employes.find(e => e.id === p.employeId);
            const name = emp ? `${emp.nom} ${emp.prenom}`.toLowerCase() : '';
            return name.includes(searchTerm.toLowerCase());
        });
    }, [pointages, employes, searchTerm]);

    const handleExportPDF = async () => {
        setGeneratingPDF(true);
        try {
            const pointagesComplets = filteredPointages.map(p => {
                const emp = employes.find(e => e.id === p.employeId);
                return {
                    ...p,
                    nom: emp?.nom,
                    prenom: emp?.prenom,
                    poste: emp?.poste
                };
            });

            const statsForPDF = {
                stats: { totalEmployes: employes.length },
                repartitionAujourdhui: {
                    PRESENT: pointagesComplets.filter(p => p.statut === 'PRESENT').length,
                    ABSENT: pointagesComplets.filter(p => p.statut === 'ABSENT').length,
                    CONGE: pointagesComplets.filter(p => p.statut === 'CONGE').length,
                    MALADIE: pointagesComplets.filter(p => p.statut === 'MALADIE').length,
                    FERIE: pointagesComplets.filter(p => p.statut === 'FERIE').length,
                },
                isJournalValide: true, // If it's in history, it's considered validated
                presencesJour: pointagesComplets.filter(p => p.statut === 'PRESENT'),
                absencesJour: pointagesComplets.filter(p => p.statut !== 'PRESENT')
            };

            generateDailyReportPDF(statsForPDF, filterDate);
        } catch (error) {
            console.error('Erreur PDF:', error);
        } finally {
            setGeneratingPDF(false);
        }
    };

    const getStatutBadge = (statut) => {
        const configs = {
            PRESENT: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 className="w-3 h-3" /> },
            ABSENT: { bg: 'bg-rose-50 text-rose-600 border-rose-100', icon: <AlertCircle className="w-3 h-3" /> },
            CONGE: { bg: 'bg-amber-50 text-amber-600 border-amber-100', icon: <CalendarIcon className="w-3 h-3" /> },
            MALADIE: { bg: 'bg-pink-50 text-pink-600 border-pink-100', icon: <AlertCircle className="w-3 h-3" /> },
            FERIE: { bg: 'bg-blue-50 text-blue-600 border-blue-100', icon: <CalendarIcon className="w-3 h-3" /> },
        };
        const cfg = configs[statut] || configs.PRESENT;
        return (
            <div className={`px-3 py-1.5 rounded-full border ${cfg.bg} flex items-center gap-2 text-[10px] font-black uppercase tracking-widest`}>
                {cfg.icon} {statut}
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header section with Date Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-slate-900 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        HISTORIQUE <span className="text-blue-600">JOURNALIER</span>
                    </h1>
                    <p className="text-slate-900 font-black mt-2 uppercase tracking-wide text-lg">Consultation pour le {new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleExportPDF}
                        disabled={generatingPDF || pointages.length === 0}
                        className="btn bg-slate-900 text-white hover:bg-blue-600 px-8 py-5 text-lg font-black uppercase flex items-center gap-3 shadow-lg disabled:opacity-30 transition-all"
                    >
                        {generatingPDF ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                        IMPRIMER RAPPORT
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-8 rounded-[32px] border-3 border-slate-900 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 sticky top-4 z-40 bg-white/95 backdrop-blur-md">
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block">1. CHOISIR LA DATE :</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:border-blue-700 outline-none transition-all focus:bg-white"
                    />
                </div>
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block">2. FILTRER PAR NOM :</label>
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-8 h-8" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-20 pr-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black placeholder:text-slate-300 focus:border-blue-700 outline-none transition-all focus:bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Chargement des données...</p>
                    </div>
                ) : filteredPointages.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y-4 divide-slate-900">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-10 py-8 text-left text-sm font-black uppercase tracking-widest">Employé</th>
                                    <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-widest">Statut</th>
                                    <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-widest">HS</th>
                                    <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-widest">Avance</th>
                                    <th className="px-10 py-8 text-left text-sm font-black uppercase tracking-widest">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredPointages.map((p) => {
                                    const emp = employes.find(e => e.id === p.employeId);
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-10 py-8 font-black text-slate-900 uppercase">
                                                {emp?.nom} {emp?.prenom}
                                                <p className="font-bold text-blue-600 text-[10px] mt-1">{emp?.poste}</p>
                                            </td>
                                            <td className="px-10 py-8 flex justify-center">
                                                {getStatutBadge(p.statut)}
                                            </td>
                                            <td className="px-10 py-8 text-center font-black text-lg text-indigo-600">
                                                {p.heuresSupp > 0 ? `+${p.heuresSupp}h` : '--'}
                                            </td>
                                            <td className="px-10 py-8 text-center font-black text-lg text-emerald-600">
                                                {p.avanceJour > 0 ? `${p.avanceJour.toFixed(3)}` : '--'}
                                            </td>
                                            <td className="px-10 py-8 font-bold text-slate-400 text-xs italic italic max-w-xs truncate">
                                                {p.notes || 'Aucune note'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center space-y-4">
                        <AlertCircle className="w-16 h-16 text-slate-200 mx-auto" />
                        <p className="text-2xl font-black text-slate-400 uppercase tracking-tight">Aucun pointage enregistré pour cette date</p>
                    </div>
                )}
            </div>
        </div>
    );
}
