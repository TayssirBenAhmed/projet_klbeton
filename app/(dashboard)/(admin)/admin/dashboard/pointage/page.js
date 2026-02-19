'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Plus,
    Search,
    Filter,
    Trash2,
    Calendar as CalendarIcon,
    User,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    ChevronDown,
    Save,
    RotateCcw,
    X
} from 'lucide-react';
import { getStatutConfig } from '@/lib/domain/value-objects/StatutPointage';

export default function PointagePage() {
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isBulkMode, setIsBulkMode] = useState(true); // Default to Bulk Sheet mode
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    // State for the bulk sheet entries
    const [sheetEntries, setSheetEntries] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pointagesRes, employesRes] = await Promise.all([
                fetch('/api/pointages'),
                fetch('/api/employes'),
            ]);

            const pointagesData = await pointagesRes.json();
            const employesData = await employesRes.json();

            setPointages(pointagesData);
            setEmployes(employesData);

            // Initialize sheet entries for current date
            initializeSheet(employesData, pointagesData, filterDate);
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeSheet = (allEmployes, currentPointages, date) => {
        const newEntries = {};
        const isDimanche = new Date(date).getDay() === 0;

        allEmployes.forEach(emp => {
            const existing = currentPointages.find(p => p.employeId === emp.id && p.date.startsWith(date));

            if (existing) {
                newEntries[emp.id] = {
                    statut: existing.statut,
                    heuresSupp: existing.heuresSupp,
                    joursTravailles: existing.joursTravailles,
                    notes: existing.notes || '',
                    isExisting: true,
                    id: existing.id
                };
            } else {
                newEntries[emp.id] = {
                    statut: isDimanche ? 'ABSENT' : 'PRESENT',
                    heuresSupp: 0,
                    joursTravailles: (isDimanche || isDimanche) ? 0 : 1, // Sunday always 0 days
                    notes: '',
                    isExisting: false
                };
            }
        });
        setSheetEntries(newEntries);
    };

    // Re-initialize when date changes
    useEffect(() => {
        if (employes.length > 0) {
            initializeSheet(employes, pointages, filterDate);
        }
    }, [filterDate, employes, pointages]);

    const handleSheetChange = (empId, field, value) => {
        const isDimanche = new Date(filterDate).getDay() === 0;

        setSheetEntries(prev => {
            const entry = { ...prev[empId], [field]: value };

            // Automatic Business Logic
            if (field === 'statut') {
                if (value === 'PRESENT') {
                    entry.joursTravailles = isDimanche ? 0 : 1;
                } else if (value === 'ABSENT' || value === 'MALADIE') {
                    entry.joursTravailles = 0;
                    entry.heuresSupp = 0;
                } else if (value === 'CONGE' || value === 'FERIE') {
                    entry.joursTravailles = isDimanche ? 0 : 1;
                    entry.heuresSupp = 0;
                }
            }

            return { ...prev, [empId]: entry };
        });
    };

    const handleSetAllPresent = () => {
        const isDimanche = new Date(filterDate).getDay() === 0;
        const newEntries = { ...sheetEntries };
        Object.keys(newEntries).forEach(id => {
            newEntries[id] = {
                ...newEntries[id],
                statut: 'PRESENT',
                joursTravailles: isDimanche ? 0 : 1,
                heuresSupp: 0
            };
        });
        setSheetEntries(newEntries);
    };

    const handleSaveSheet = async () => {
        try {
            setLoading(true);
            const entriesToSave = Object.entries(sheetEntries).map(([empId, data]) => ({
                employeId: empId,
                ...data
            }));

            const res = await fetch('/api/pointages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bulk: true,
                    date: filterDate,
                    pointages: entriesToSave
                }),
            });

            if (res.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
                fetchData();
            }
        } catch (error) {
            console.error('Erreur sauvegarde en masse:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Souhaitez-vous vraiment supprimer ce pointage ?')) return;

        try {
            await fetch(`/api/pointages?id=${id}`, { method: 'DELETE' });
            fetchData();
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const filteredEmployes = useMemo(() => {
        return employes.filter(emp =>
            `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employes, searchTerm]);

    const stats = useMemo(() => {
        const data = filteredEmployes.map(emp => sheetEntries[emp.id]).filter(Boolean);
        return {
            presences: data.filter(d => d.statut === 'PRESENT').length,
            absences: data.filter(d => d.statut === 'ABSENT').length,
            conges: data.filter(d => d.statut === 'CONGE' || d.statut === 'MALADIE').length,
            heuresSupp: data.reduce((sum, d) => sum + parseFloat(d.heuresSupp || 0), 0)
        };
    }, [filteredEmployes, sheetEntries]);

    if (loading && employes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Chargement...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12" data-testid="feuille-presence-page">
            {/* Success Toast */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-10 py-5 rounded-2xl shadow-2xl flex items-center gap-3 text-lg font-black uppercase tracking-wide"
                        data-testid="save-success"
                    >
                        <CheckCircle2 className="w-7 h-7" /> Présence enregistrée avec succès
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        FEUILLE DE <span className="text-blue-600">PRÉSENCE</span>
                    </h1>
                    <p className="text-slate-900 font-black mt-2 uppercase tracking-wide text-lg">Saisie rapide pour le {new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSetAllPresent}
                        className="btn bg-emerald-50 text-emerald-600 border-2 border-emerald-500 hover:bg-emerald-500 hover:text-white px-8 py-5 text-lg font-black uppercase flex items-center gap-3 shadow-lg"
                    >
                        <CheckCircle2 className="w-6 h-6" /> TOUT PRÉSENT
                    </button>
                    <button
                        onClick={handleSaveSheet}
                        disabled={loading}
                        className="btn btn-primary px-10 py-5 text-xl shadow-2xl flex items-center gap-3"
                    >
                        <Save className="w-7 h-7" /> {loading ? 'SAUVEGARDE...' : 'ENREGISTRER LA JOURNÉE'}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Présents', value: stats.presences, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Heures Sup.', value: `+${stats.heuresSupp}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Absents', value: stats.absences, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Congés/Autre', value: stats.conges, icon: CalendarIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="bg-white rounded-3xl p-6 shadow-xl flex items-center gap-5"
                    >
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border-2 border-current hover:rotate-12 transition-transform`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Controls Overlay */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 sticky top-4 z-40 bg-white/95 backdrop-blur-md">
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block pointer-events-none">1. DATE DU POINTAGE :</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:border-blue-700 outline-none transition-all focus:bg-white"
                    />
                </div>
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block pointer-events-none">2. CHERCHER UN EMPLOYÉ :</label>
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-8 h-8" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-20 pr-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black placeholder:text-slate-300 focus:border-blue-700 outline-none transition-all focus:bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Attendance Spreadsheet */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-slate-200">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-10 py-8 text-left text-sm font-black uppercase tracking-[0.2em]">Employé</th>
                                <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-[0.2em]">Statut</th>
                                <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-[0.2em]">Heurs Sup</th>
                                <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-[0.2em]">Jours Travaillés</th>
                                <th className="px-10 py-8 text-center text-sm font-black uppercase tracking-[0.2em]">État</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredEmployes.map((emp) => {
                                const entry = sheetEntries[emp.id] || {};
                                const isSunday = new Date(filterDate).getDay() === 0;

                                return (
                                    <tr key={emp.id} className={`hover:bg-slate-50/80 transition-colors ${entry.statut === 'ABSENT' ? 'bg-rose-50/30' : ''}`}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-2xl ${entry.statut === 'PRESENT' ? 'bg-emerald-600' : 'bg-slate-900'} flex items-center justify-center text-white text-xl font-black uppercase shadow-lg`}>
                                                    {emp.nom[0]}{emp.prenom[0]}
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900 uppercase leading-none">{emp.nom} {emp.prenom}</p>
                                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mt-2 bg-blue-50 w-fit px-2 py-1 rounded-md">{emp.poste}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="flex justify-center gap-2">
                                                {/* Status buttons in order: PRÉSENT | ABSENT | FÉRIÉ | CONGÉ | MALADIE */}
                                                {[
                                                    { id: 'PRESENT', label: 'PRÉSENT', color: 'emerald', bg: 'bg-emerald-600', border: 'border-emerald-700' },
                                                    { id: 'ABSENT', label: 'ABSENT', color: 'rose', bg: 'bg-rose-600', border: 'border-rose-700' },
                                                    { id: 'FERIE', label: 'FÉRIÉ', color: 'blue', bg: 'bg-blue-600', border: 'border-blue-700' },
                                                    { id: 'CONGE', label: 'CONGÉ', color: 'amber', bg: 'bg-amber-500', border: 'border-amber-600' },
                                                    { id: 'MALADIE', label: 'MALADIE', color: 'purple', bg: 'bg-purple-600', border: 'border-purple-700' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleSheetChange(emp.id, 'statut', opt.id)}
                                                        data-testid={`status-btn-${emp.id}-${opt.id}`}
                                                        className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase transition-all border-2 ${entry.statut === opt.id
                                                            ? `${opt.bg} text-white ${opt.border} shadow-lg scale-110 ring-2 ring-white/50`
                                                            : `bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-white`
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            {/* MALADIE and CONGE status disable overtime hours and set to 0 */}
                                            <div className={`flex items-center justify-center gap-4 ${entry.statut === 'MALADIE' || entry.statut === 'CONGE' ? 'opacity-30 pointer-events-none' : ''}`}>
                                                <button
                                                    disabled={entry.statut === 'MALADIE' || entry.statut === 'CONGE'}
                                                    onClick={() => handleSheetChange(emp.id, 'heuresSupp', Math.max(0, (entry.heuresSupp || 0) - 0.5))}
                                                    className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg font-black border-2 border-blue-200 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={(entry.statut === 'MALADIE' || entry.statut === 'CONGE') ? 0 : entry.heuresSupp}
                                                    disabled={entry.statut === 'MALADIE' || entry.statut === 'CONGE'}
                                                    onChange={(e) => handleSheetChange(emp.id, 'heuresSupp', parseFloat(e.target.value) || 0)}
                                                    data-testid={`hs-input-${emp.id}`}
                                                    className="w-24 text-center text-2xl font-black bg-blue-50 border-3 border-blue-200 rounded-xl py-2 focus:border-blue-700 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                                />
                                                <button
                                                    disabled={entry.statut === 'MALADIE' || entry.statut === 'CONGE'}
                                                    onClick={() => handleSheetChange(emp.id, 'heuresSupp', (entry.heuresSupp || 0) + 0.5)}
                                                    className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg font-black border-2 border-blue-200 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center border-l-2 border-slate-100">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-2xl font-black ${entry.statut === 'ABSENT' ? 'text-rose-600' : 'text-slate-900'}`}>
                                                    {entry.joursTravailles} J
                                                </span>
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${isSunday ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isSunday ? 'DIMANCHE' : 'NORMAL'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {entry.isExisting ? (
                                                <div className="flex items-center justify-end gap-2 text-emerald-600 font-black text-xs uppercase bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                                                    <CheckCircle2 className="w-4 h-4" /> Enregistré
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2 text-blue-600 font-black text-xs uppercase bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                                                    <Clock className="w-4 h-4" /> En attente
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer Controls */}
                <div className="p-10 bg-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 rounded-b-3xl">
                    <div className="text-white">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Employés filtrés :</p>
                        <p className="text-4xl font-black">{filteredEmployes.length} Collaborateurs</p>
                    </div>
                    <div className="flex gap-6 w-full md:w-auto">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 md:flex-none px-8 py-5 border-2 border-white/20 text-white font-black rounded-2xl hover:bg-white hover:text-slate-900 transition-all uppercase flex items-center justify-center gap-3"
                        >
                            <RotateCcw className="w-6 h-6" /> Réinitialiser
                        </button>
                        <button
                            onClick={handleSaveSheet}
                            disabled={loading}
                            data-testid="save-sheet-btn"
                            className="flex-[2] md:flex-none btn btn-primary px-16 py-6 text-2xl shadow-blue-500/40 flex items-center justify-center gap-4"
                        >
                            <Save className="w-8 h-8" /> {loading ? 'SAUVEGARDE...' : 'VALIDER TOUTE LA JOURNÉE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Legacy Modal (kept for fallback) */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-10 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-3xl font-black text-slate-900 uppercase">NOUVEAU POINTAGE</h3>
                                <button onClick={() => setShowModal(false)} className="w-16 h-16 flex items-center justify-center bg-rose-600 text-white rounded-2xl hover:bg-black font-black text-2xl">
                                    X
                                </button>
                            </div>
                            <div className="p-10 text-center space-y-6">
                                <p className="text-2xl font-black text-slate-500 uppercase">Utilisez la feuille de présence pour une saisie rapide</p>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-primary px-10 py-6 text-xl"
                                >
                                    COMPRIS !
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

