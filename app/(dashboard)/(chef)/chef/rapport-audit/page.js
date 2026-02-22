'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileCheck,
    Calendar,
    Search,
    AlertCircle,
    CheckCircle2,
    X,
    Download,
    Users,
    Clock,
    Wallet,
    FileText
} from 'lucide-react';
import { generateChefAuditPDF } from '@/lib/services/chefAuditPdfService';
import { useLanguage } from '@/context/LanguageContext';

export default function ChefAuditReportPage() {
    const { t } = useLanguage();
    const { data: session } = useSession();
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        fetchData();
        checkValidationStatus();
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

    const checkValidationStatus = async () => {
        try {
            const res = await fetch(`/api/pointages/validate-chef?date=${filterDate}`);
            const data = await res.json();
            setIsValidated(data.isValidated);
        } catch (error) {
            console.error('Erreur vérification validation:', error);
        }
    };

    // Validation logic
    const validateEntry = (pointage) => {
        const errors = [];
        
        if (!pointage?.statut) {
            errors.push('Saisie incomplète');
        } else {
            if (pointage.statut === 'ABSENT' && (!pointage.notes || pointage.notes.trim() === '')) {
                errors.push('Justification obligatoire');
            }
            if (pointage.statut === 'MALADIE' && (pointage.heuresSupp > 0 || pointage.heureSupplementaire > 0)) {
                errors.push('Pas d\'HS en maladie');
            }
            if (pointage.statut === 'CONGE' && (pointage.heuresSupp > 0 || pointage.heureSupplementaire > 0)) {
                errors.push('Pas d\'HS en congé');
            }
        }
        
        return errors;
    };

    // Combine employes with their pointages
    const combinedData = useMemo(() => {
        return employes.map(emp => {
            const pointage = pointages.find(p => p.employeId === emp.id && p.date.startsWith(filterDate));
            const errors = validateEntry(pointage);
            return {
                ...emp,
                pointage,
                errors,
                hasErrors: errors.length > 0
            };
        });
    }, [employes, pointages, filterDate]);

    const filteredData = useMemo(() => {
        return combinedData.filter(item =>
            `${item.nom} ${item.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [combinedData, searchTerm]);

    // Statistics
    const stats = useMemo(() => {
        const data = combinedData;
        return {
            total: data.length,
            presents: data.filter(d => d.pointage?.statut === 'PRESENT').length,
            absents: data.filter(d => d.pointage?.statut === 'ABSENT').length,
            conges: data.filter(d => d.pointage?.statut === 'CONGE').length,
            maladies: data.filter(d => d.pointage?.statut === 'MALADIE').length,
            feries: data.filter(d => d.pointage?.statut === 'FERIE').length,
            nonSaisis: data.filter(d => !d.pointage?.statut).length,
            errors: data.filter(d => d.hasErrors).length
        };
    }, [combinedData]);

    const handleGeneratePDF = async () => {
        setPdfGenerating(true);
        
        // Collect all errors
        const allErrors = combinedData.filter(d => d.hasErrors).map(d => ({
            empId: d.id,
            message: d.errors.join(', ')
        }));
        setValidationErrors(allErrors);

        // Generate PDF
        const result = generateChefAuditPDF(
            pointages,
            employes,
            filterDate,
            session?.user?.prenom + ' ' + session?.user?.nom
        );

        // If no errors, mark as validated
        if (!result.hasErrors) {
            try {
                await fetch('/api/pointages/validate-chef', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: filterDate,
                        chefId: session?.user?.id,
                        validatedAt: new Date().toISOString()
                    })
                });
                setIsValidated(true);
            } catch (error) {
                console.error('Erreur validation:', error);
            }
        }

        setPdfGenerating(false);
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case 'PRESENT': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'ABSENT': return <X className="w-5 h-5 text-rose-500" />;
            case 'CONGE': return <Calendar className="w-5 h-5 text-orange-500" />;
            case 'MALADIE': return <AlertCircle className="w-5 h-5 text-purple-500" />;
            case 'FERIE': return <Calendar className="w-5 h-5 text-blue-500" />;
            default: return <span className="text-slate-400 text-sm">-</span>;
        }
    };

    const getStatusLabel = (statut) => {
        switch (statut) {
            case 'PRESENT': return 'PRÉSENT';
            case 'ABSENT': return 'ABSENT';
            case 'CONGE': return 'CONGÉ';
            case 'MALADIE': return 'MALADIE';
            case 'FERIE': return 'FÉRIÉ';
            default: return 'NON SAISI';
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        <FileCheck className="w-12 h-12 text-blue-600" />
                        RAPPORT DE <span className="text-blue-600">CONTRÔLE</span>
                    </h1>
                    <p className="text-slate-900 font-black mt-2 uppercase tracking-wide text-lg">
                        Vérification et audit - {new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-4">
                    {isValidated && (
                        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black uppercase">
                            <CheckCircle2 className="w-6 h-6" />
                            Validé
                        </div>
                    )}
                    <button
                        onClick={handleGeneratePDF}
                        disabled={pdfGenerating || employes.length === 0}
                        className="btn btn-primary px-8 py-5 text-xl shadow-2xl flex items-center gap-3 disabled:opacity-50"
                    >
                        <Download className="w-7 h-7" /> 
                        {pdfGenerating ? 'GÉNÉRATION...' : 'GÉNÉRER PDF'}
                    </button>
                </div>
            </div>

            {/* Validation Banner */}
            <AnimatePresence>
                {validationErrors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-rose-50 border-4 border-rose-200 p-6 rounded-[32px]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-rose-900 uppercase">
                                    {validationErrors.length} erreur(s) détectée(s)
                                </h3>
                                <p className="font-bold text-rose-700 uppercase text-sm">
                                    Corrigez les erreurs dans la feuille de présence avant de générer le PDF
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: Users, color: 'slate' },
                    { label: 'Présents', value: stats.presents, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Absents', value: stats.absents, icon: X, color: 'rose' },
                    { label: 'Congés', value: stats.conges, icon: Calendar, color: 'orange' },
                    { label: 'Maladies', value: stats.maladies, icon: AlertCircle, color: 'purple' },
                    { label: 'Fériés', value: stats.feries, icon: Calendar, color: 'blue' },
                    { label: 'Erreurs', value: stats.errors, icon: AlertCircle, color: 'rose' },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-white p-4 rounded-2xl shadow-lg border-2 ${stat.color === 'rose' && stat.value > 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-100'}`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon className={`w-5 h-5 ${
                                stat.color === 'emerald' ? 'text-emerald-500' :
                                stat.color === 'rose' ? 'text-rose-500' :
                                stat.color === 'orange' ? 'text-orange-500' :
                                stat.color === 'purple' ? 'text-purple-500' :
                                stat.color === 'blue' ? 'text-blue-500' :
                                'text-slate-500'
                            }`} />
                            <span className="text-xs font-black text-slate-400 uppercase">{stat.label}</span>
                        </div>
                        <p className={`text-3xl font-black ${
                            stat.color === 'rose' && stat.value > 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}>
                            {stat.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white/95 backdrop-blur-md p-6 border-b-2 border-slate-200 shadow-xl rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-black text-slate-500 uppercase mb-3 block">Date :</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-blue-700"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-black text-slate-500 uppercase mb-3 block">Recherche :</label>
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-8 h-8" />
                            <input
                                type="text"
                                placeholder="Nom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-20 pr-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black outline-none focus:border-blue-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-slate-200">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-6 py-5 text-left text-sm font-black uppercase">Collaborateur</th>
                                <th className="px-4 py-5 text-center text-sm font-black uppercase w-32">Statut</th>
                                <th className="px-4 py-5 text-center text-sm font-black uppercase w-28">Heures Sup</th>
                                <th className="px-4 py-5 text-center text-sm font-black uppercase w-28">Avance</th>
                                <th className="px-6 py-5 text-left text-sm font-black uppercase">Note / Observation</th>
                                <th className="px-4 py-5 text-center text-sm font-black uppercase w-40">Contrôle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-200">
                            {filteredData.map((item) => (
                                <tr 
                                    key={item.id} 
                                    className={`transition-all duration-300 ${
                                        item.hasErrors ? 'bg-rose-50 border-l-4 border-rose-500' : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg font-black uppercase">
                                                {item.nom?.charAt(0)}{item.prenom?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900 uppercase">
                                                    {item.nom} {item.prenom}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold uppercase">{item.poste}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            {getStatusIcon(item.pointage?.statut)}
                                            <span className={`text-xs font-black uppercase ${
                                                !item.pointage?.statut ? 'text-rose-500' : 'text-slate-600'
                                            }`}>
                                                {getStatusLabel(item.pointage?.statut)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="text-lg font-black font-mono-numbers">
                                            {item.pointage?.heuresSupp || item.pointage?.heureSupplementaire || 0}h
                                        </span>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <span className="text-lg font-black font-mono-numbers">
                                            {item.pointage?.avance || 0} DT
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className={`text-sm ${
                                            item.pointage?.notes ? 'text-slate-700' : 'text-slate-400 italic'
                                        }`}>
                                            {item.pointage?.notes || 'Aucune note'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        {item.hasErrors ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-2xl">❌</span>
                                                <span className="text-xs font-bold text-rose-600 uppercase">
                                                    {item.errors[0]}
                                                </span>
                                            </div>
                                        ) : item.pointage?.statut ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-2xl">✅</span>
                                                <span className="text-xs font-bold text-emerald-600 uppercase">OK</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-2xl">⚠️</span>
                                                <span className="text-xs font-bold text-amber-600 uppercase">Incomplet</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredData.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-xl font-black text-slate-400 uppercase">Aucune donnée trouvée</p>
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-2xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-blue-900 uppercase mb-2">Information</h3>
                        <p className="text-blue-700 text-sm font-medium">
                            Ce rapport est destiné à la vérification et l&apos;audit. Il ne contient aucun calcul financier.
                            Les erreurs détectées doivent être corrigées dans la <strong>Feuille de Présence</strong> avant de générer le PDF final.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
