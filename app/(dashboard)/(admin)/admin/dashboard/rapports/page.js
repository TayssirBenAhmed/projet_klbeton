'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileBarChart,
    Calendar,
    Download,
    FileText,
    Wallet,
    TrendingUp,
    AlertCircle,
    Clock,
    User,
    ChevronRight,
    Search
} from 'lucide-react';
import { generateProfessionalPDF } from '@/lib/services/pdfService';
import { genererPdfGlobal } from '@/lib/services/globalPdfService';
import SuccessModal from '@/components/ui/SuccessModal';

export default function RapportsPage() {
    const [mois, setMois] = useState(new Date().getMonth() + 1);
    const [annee, setAnnee] = useState(new Date().getFullYear());
    const [rapport, setRapport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const genererRapport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/rapports?mois=${mois}&annee=${annee}&t=${Date.now()}`);
            const data = await res.json();
            setRapport(data);
        } catch (error) {
            console.error('Erreur génération rapport:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        if (!rapport) return;
        generateProfessionalPDF(rapport[0] || rapport, mois, annee);
        setShowSuccess(true);
    };

    const exportGlobalPDF = () => {
        if (!Array.isArray(rapport)) return;
        genererPdfGlobal(rapport, mois, annee);
        setShowSuccess(true);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <FileBarChart className="w-7 h-7" />
                        </div>
                        Rapports & Paie
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Analyse des performances et consolidation financière mensuelle</p>
                </div>
                {rapport && (
                    <div className="flex gap-4">
                        <button
                            onClick={exportGlobalPDF}
                            className="btn bg-blue-700 hover:bg-blue-800 text-white gap-2 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-700/20"
                        >
                            <FileText className="w-4 h-4" /> Exporter le Rapport Global (PDF)
                        </button>
                    </div>
                )}
            </div>

            {/* Selection Panel */}
            <div className="card border-none shadow-2xl shadow-slate-200/60 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mois de référence</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={mois}
                                onChange={(e) => setMois(parseInt(e.target.value))}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>
                                        {new Date(2024, m - 1).toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année fiscale</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                value={annee}
                                onChange={(e) => setAnnee(parseInt(e.target.value))}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <button
                        onClick={genererRapport}
                        disabled={loading}
                        className="btn bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            'Générer Rapport'
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            <AnimatePresence mode="wait">
                {rapport ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Présences</p>
                                <p className="text-3xl font-black text-slate-900">
                                    {Array.isArray(rapport) ? rapport.reduce((sum, emp) => sum + (emp.pointages?.presence || 0), 0).toFixed(1) : (rapport.pointages?.presence || 0).toFixed(1)} <span className="text-xs font-bold text-slate-400">jours</span>
                                </p>
                            </div>

                            {/* Dette à recouvrir (si existante) */}
                            {((Array.isArray(rapport) ? rapport.reduce((sum, emp) => sum + (emp.salaire?.resteARembourser || 0), 0) : (rapport.salaire?.resteARembourser || 0)) > 0) ? (
                                <div className="bg-rose-50 p-6 rounded-[32px] border-2 border-rose-200 shadow-xl shadow-rose-100/40">
                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2">Dette à Recouvrer</p>
                                    <p className="text-3xl font-black text-rose-600">
                                        {(Array.isArray(rapport)
                                            ? rapport.reduce((sum, emp) => sum + (emp.salaire?.resteARembourser || 0), 0)
                                            : (rapport.salaire?.resteARembourser || 0)).toFixed(3)} <span className="text-xs font-bold opacity-60">DT</span>
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total H. Supp</p>
                                    <p className="text-3xl font-black text-blue-600">
                                        +{Array.isArray(rapport) ? rapport.reduce((sum, emp) => sum + (emp.pointages?.heuresSupp || 0), 0).toFixed(1) : (rapport.pointages?.heuresSupp || 0).toFixed(1)} <span className="text-xs font-bold text-slate-400">heures</span>
                                    </p>
                                </div>
                            )}

                            <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl shadow-slate-900/20">
                                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-2">Masse Salariale Net</p>
                                <p className="text-3xl font-black text-emerald-400">
                                    {(Array.isArray(rapport)
                                        ? rapport.reduce((sum, emp) => sum + (emp.salaire?.salaireNet || 0), 0)
                                        : (rapport.salaire?.salaireNet || 0)).toFixed(3)} <span className="text-xs font-bold opacity-60">DT</span>
                                </p>
                            </div>
                        </div>

                        {Array.isArray(rapport) ? (
                            <div className="grid grid-cols-1 gap-8">
                                {rapport.map((emp, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        key={emp.employe.id}
                                        className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group hover:border-blue-200 transition-all"
                                    >
                                        <div className="p-8 flex flex-col lg:flex-row items-start lg:items-center gap-8">
                                            {/* Employee Info */}
                                            <div className="flex items-center gap-5 min-w-[300px]">
                                                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20 uppercase">
                                                    {emp.employe.nom[0]}{emp.employe.prenom[0]}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1">
                                                        {emp.employe.nom} {emp.employe.prenom}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.employe.poste}</p>
                                                </div>
                                            </div>

                                            {/* Quick Stats Row */}
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                                                <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100/50 relative overflow-hidden">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Présences</p>
                                                    <p className={`text-lg font-black ${emp.pointages.presence > 26 ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                        {emp.pointages.presence}j
                                                    </p>
                                                    {emp.pointages.presence > 26 && (
                                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase">
                                                            Surplus
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Absences</p>
                                                    <p className="text-lg font-black text-rose-600">{emp.pointages.absence}j</p>
                                                </div>
                                                <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Congés</p>
                                                    <p className="text-lg font-black text-amber-600">{emp.pointages.conge}j</p>
                                                </div>
                                                <div className="px-6 py-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">H. Supp</p>
                                                    <p className="text-lg font-black text-blue-600">+{emp.pointages.heuresSupp}h</p>
                                                </div>
                                            </div>

                                            {/* Salary Summary */}
                                            <div className="lg:text-right min-w-[200px] bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden group-hover:bg-blue-900 transition-colors">
                                                <Wallet className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10 -rotate-12" />
                                                <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Salaire Net Mensuel</p>
                                                <p className="text-2xl font-black">{emp.salaire.salaireNet.toLocaleString()} <span className="text-xs font-bold text-blue-400">TND</span></p>
                                            </div>
                                        </div>

                                        {/* Expandable Breakdown Details */}
                                        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-x-12 gap-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base: {emp.salaire.joursBaseCalcul}j (26 + {emp.salaire.joursExtraTravailles} extra)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Journalier: {emp.salaire.tauxJournalier.toFixed(2)} TND</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horaire: {emp.salaire.tauxHoraire.toFixed(2)} TND</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <TrendingUp className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">H. Supp: +{emp.salaire.montantHeuresSupp.toLocaleString()} TND</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-rose-500 font-black">
                                                <AlertCircle className="w-3 h-3" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Absences: -{emp.salaire.deductionAbsences.toLocaleString()} TND</span>
                                            </div>
                                            {emp.salaire.resteARembourser > 0 && (
                                                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Dette à recouvrir: {emp.salaire.resteARembourser.toFixed(3)} DT</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-20">
                                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-black text-slate-900 uppercase">Paramètres Invalides</h3>
                                <p className="text-slate-500">Une erreur est survenue lors de la récupération des données.</p>
                            </div>
                        )}
                    </motion.div>
                ) : !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200"
                    >
                        <Clock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">En attente de calculs</h3>
                        <p className="text-slate-400 font-medium text-sm mt-2">Sélectionnez une période pour générer les fiches de paie</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Rapport Généré"
                message={`Le récapitulatif mensuel pour ${new Date(annee, mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} a été créé avec succès.`}
            />
        </div>
    );
}
