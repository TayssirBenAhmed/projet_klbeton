'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
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
    X,
    Wallet,
    Lock
} from 'lucide-react';

export default function ChefPointagePage() {
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sheetEntries, setSheetEntries] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);
    const { data: session } = useSession();

    const isLocked = useMemo(() => {
        if (!session || session.user.role === 'ADMIN') return false;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-indexed

        const [selYear, selMonth] = filterDate.split('-').map(Number);
        const selectedYear = selYear;
        const selectedMonth = selMonth - 1; // 0-indexed

        return (selectedYear < currentYear) || (selectedYear === currentYear && selectedMonth < currentMonth);
    }, [filterDate, session]);

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
                    avance: 0, // Avances are usually distinct but we'll include it for the UI
                    isExisting: true,
                    id: existing.id
                };
            } else {
                newEntries[emp.id] = {
                    statut: isDimanche ? 'ABSENT' : 'PRESENT',
                    heuresSupp: 0,
                    joursTravailles: isDimanche ? 0 : 1,
                    notes: '',
                    avance: 0,
                    isExisting: false
                };
            }
        });
        setSheetEntries(newEntries);
    };

    // Removed redundant useEffect to avoid double initialization

    const handleSheetChange = (empId, field, value) => {
        setSheetEntries(prev => {
            const entry = { ...prev[empId], [field]: value };
            if (field === 'statut') {
                const isDimanche = new Date(filterDate).getDay() === 0;
                if (value === 'PRESENT') {
                    entry.joursTravailles = isDimanche ? 0 : 1;
                } else if (value === 'ABSENT' || value === 'MALADIE') {
                    entry.joursTravailles = 0;
                    // CRITICAL: Reset overtime hours to 0 for MALADIE status
                    entry.heuresSupp = 0;
                } else if (value === 'CONGE' || value === 'FERIE') {
                    entry.joursTravailles = isDimanche ? 0 : 1;
                    entry.heuresSupp = 0;
                }
            }
            return { ...prev, [empId]: entry };
        });
    };

    const handleSaveSheet = async () => {
        try {
            setLoading(true);
            const entriesToSave = Object.entries(sheetEntries).map(([empId, data]) => ({
                employeId: empId,
                ...data
            }));

            // Save Pointages
            const resPointage = await fetch('/api/pointages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bulk: true,
                    date: filterDate,
                    pointages: entriesToSave
                }),
            });

            // Save Avances (only those > 0)
            const avancesToSave = entriesToSave.filter(e => e.avance > 0);
            for (const av of avancesToSave) {
                await fetch('/api/avances', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeId: av.employeId,
                        montant: av.avance,
                        date: filterDate,
                        note: 'Saisie par le Chef'
                    }),
                });
            }

            if (resPointage.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
                fetchData();
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        } finally {
            setLoading(false);
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
            heuresSupp: data.reduce((sum, d) => sum + parseFloat(d.heuresSupp || 0), 0),
            avances: data.reduce((sum, d) => sum + parseFloat(d.avance || 0), 0)
        };
    }, [filteredEmployes, sheetEntries]);

    const statutLabels = {
        PRESENT: 'Présent',
        ABSENT: 'Absent',
        CONGE: 'Congé',
        MALADIE: 'Maladie',
        FERIE: 'Férié',
    };

    return (
        <div className="space-y-8 pb-12" data-testid="feuille-presence-page">
            {/* Success toast */}
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-10 py-5 rounded-2xl shadow-2xl flex items-center gap-3 text-lg font-black uppercase tracking-wide"
                        data-testid="save-success"
                    >
                        <CheckCircle2 className="w-7 h-7" /> Success — Journée enregistrée
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        FEUILLE DE <span className="text-blue-600">PRÉSENCE</span>
                    </h1>
                    <p className="text-slate-900 font-black mt-2 uppercase tracking-wide text-lg">
                        Saisie quotidienne - {new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-4">
                    {!isLocked && (
                        <button
                            onClick={handleSaveSheet}
                            disabled={loading}
                            className="btn btn-primary px-10 py-5 text-xl shadow-2xl flex items-center gap-3"
                            data-testid="save-btn"
                        >
                            <Save className="w-7 h-7" /> {loading ? 'EN COURS...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            {/* Locking Banner */}
            {isLocked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-amber-50 border-4 border-amber-200 p-6 rounded-[32px] flex items-center justify-between shadow-lg"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-amber-900 uppercase">Mois clôturé</h3>
                            <p className="font-bold text-amber-700 uppercase text-sm">🔒 Consultation uniquement - Modification impossible</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Stats section removed as per request for Chef cleanup */}

            {/* Toolbar (Sticky) */}
            <div className="bg-white/95 backdrop-blur-md p-6 border-b-2 border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 sticky top-0 z-50 mx-[-24px] px-8 rounded-2xl">
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block">Date :</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-blue-700"
                        data-testid="date-picker"
                    />
                </div>
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block">Recherche :</label>
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-8 h-8" />
                        <input
                            type="text"
                            placeholder="Nom..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-20 pr-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black outline-none focus:border-blue-700"
                            data-testid="search-input"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-2 divide-slate-200">
                        <thead className="bg-slate-800 text-white">
                            <tr>
                                <th className="px-10 py-6 text-left text-lg font-black uppercase">Employé</th>
                                <th className="px-4 py-6 text-center text-lg font-black uppercase w-[750px]">Statut</th>
                                <th className="px-6 py-6 text-center text-lg font-black uppercase w-48">Heures Sup</th>
                                <th className="px-6 py-6 text-center text-lg font-black uppercase w-40">Avance (DT)</th>
                                <th className="px-8 py-6 text-left text-lg font-black uppercase">Note</th>
                                <th className="px-6 py-6 text-center text-lg font-black uppercase w-32">État</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-4 divide-slate-200">
                            {filteredEmployes.map((emp) => {
                                const entry = sheetEntries[emp.id] || {};
                                const isAbsent = entry.statut === 'ABSENT' || entry.statut === 'MALADIE' || entry.statut === 'CONGE';

                                // SENIOR-FRIENDLY: Large, easily clickable status buttons
                                const configs = {
                                    PRESENT: {
                                        active: 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/30',
                                        inactive: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600',
                                        icon: <CheckCircle2 className="w-8 h-8" />,
                                        label: 'PRÉSENT',
                                        color: 'emerald'
                                    },
                                    ABSENT: {
                                        active: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30',
                                        inactive: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-rose-50 hover:text-rose-600',
                                        icon: <X className="w-8 h-8" />,
                                        label: 'ABSENT',
                                        color: 'rose'
                                    },
                                    FERIE: {
                                        active: 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/30',
                                        inactive: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-blue-50 hover:text-blue-600',
                                        icon: <CalendarIcon className="w-8 h-8" />,
                                        label: 'FÉRIÉ',
                                        color: 'blue'
                                    },
                                    CONGE: {
                                        active: 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/30',
                                        inactive: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-orange-50 hover:text-orange-600',
                                        icon: <CalendarIcon className="w-8 h-8" />,
                                        label: 'CONGÉ',
                                        color: 'orange'
                                    },
                                    MALADIE: {
                                        active: 'bg-purple-500 text-white border-purple-600 shadow-lg shadow-purple-500/30',
                                        inactive: 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-purple-50 hover:text-purple-600',
                                        icon: <AlertCircle className="w-8 h-8" />,
                                        label: 'MALADIE',
                                        color: 'purple'
                                    },
                                };

                                const getStatusStyle = (s, entryStatut) => {
                                    const active = s === entryStatut;
                                    const cfg = configs[s] || configs.PRESENT;
                                    if (active) {
                                        return `${cfg.active} scale-105 shadow-md`;
                                    }
                                    return cfg.inactive;
                                };

                                return (
                                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-all duration-300 group bg-white">
                                        {/* SENIOR-FRIENDLY: Larger employee info */}
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black uppercase shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                                    {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-2xl font-black text-slate-900 uppercase truncate leading-none">{emp.nom} {emp.prenom}</p>
                                                    <p className="text-sm text-blue-600 font-black uppercase tracking-wider mt-2 bg-blue-50 px-3 py-1 rounded-lg inline-block">{emp.poste}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* SENIOR-FRIENDLY: Large status column with massive buttons */}
                                        <td className="px-4 py-8">
                                            <div className={`grid grid-cols-5 gap-3 min-w-[700px] ${isLocked ? 'pointer-events-none' : ''}`}>
                                                {/* Status buttons in order: PRÉSENT | ABSENT | FÉRIÉ | CONGÉ | MALADIE */}
                                                {['PRESENT', 'ABSENT', 'FERIE', 'CONGE', 'MALADIE'].map((s) => {
                                                    const isActive = s === entry.statut;
                                                    const cfg = configs[s];
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleSheetChange(emp.id, 'statut', s)}
                                                            disabled={isLocked}
                                                            className={`
                                                                h-20 w-full rounded-xl border-3 font-black text-lg uppercase tracking-wide
                                                                flex flex-col items-center justify-center gap-2
                                                                transition-all duration-200
                                                                ${isActive 
                                                                    ? `${cfg.active} scale-105 ring-4 ring-white` 
                                                                    : `${cfg.inactive} hover:scale-102`
                                                                }
                                                                ${isLocked && !isActive ? 'opacity-40' : ''}
                                                            `}
                                                            data-testid={`status-btn-${s.toLowerCase()}-${emp.id}`}
                                                            aria-label={cfg.label}
                                                            title={cfg.label}
                                                        >
                                                            {cfg.icon}
                                                            <span>{cfg.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        {/* SENIOR-FRIENDLY: Large overtime control with lock indicator */}
                                        <td className="px-6 py-8 text-center">
                                            {(entry.statut === 'MALADIE' || entry.statut === 'CONGE' || entry.statut === 'ABSENT') ? (
                                                /* Locked state for MALADIE, CONGE, ABSENT */
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="flex items-center justify-center gap-2 bg-slate-100 rounded-xl px-6 py-4">
                                                        <Lock className="w-6 h-6 text-slate-400" />
                                                        <span className="text-2xl font-black text-slate-400 font-mono-numbers">0</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Verrouillé</span>
                                                </div>
                                            ) : (
                                                /* Active state for PRESENT and FERIE */
                                                <div className={`flex items-center justify-center gap-3 ${isLocked ? 'opacity-30 pointer-events-none' : ''}`}>
                                                    <button 
                                                        disabled={isLocked} 
                                                        onClick={() => handleSheetChange(emp.id, 'heuresSupp', Math.max(0, (entry.heuresSupp || 0) - 0.5))} 
                                                        className="w-12 h-12 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-md font-black text-xl flex items-center justify-center"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-3xl font-black w-16 text-slate-900 font-mono-numbers">{entry.heuresSupp || 0}</span>
                                                    <button 
                                                        disabled={isLocked} 
                                                        onClick={() => handleSheetChange(emp.id, 'heuresSupp', (entry.heuresSupp || 0) + 0.5)} 
                                                        className="w-12 h-12 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-md font-black text-xl flex items-center justify-center"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`relative group/input ${isLocked ? 'opacity-30 pointer-events-none' : ''}`}>
                                                <input
                                                    type="number"
                                                    disabled={isLocked}
                                                    value={entry.avance || ''}
                                                    onChange={(e) => handleSheetChange(emp.id, 'avance', parseFloat(e.target.value) || 0)}
                                                    className="w-24 text-center text-lg font-black bg-slate-50 border border-slate-200 rounded-xl py-2 focus:border-emerald-500 focus:bg-white outline-none transition-all font-mono-numbers"
                                                    placeholder="0"
                                                />
                                                <Wallet className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-hover/input:text-emerald-500 transition-colors" />
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="text"
                                                disabled={isLocked}
                                                value={entry.notes || ''}
                                                onChange={(e) => handleSheetChange(emp.id, 'notes', e.target.value)}
                                                className={`w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 focus:border-blue-300 focus:bg-white outline-none transition-all ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}
                                                placeholder={isLocked ? "Verrouillé" : "Observation..."}
                                            />
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {entry.isExisting ? (
                                                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-[9px] uppercase bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                                    <CheckCircle2 className="w-3 h-3" /> Validé
                                                </div>
                                            ) : (
                                                <div className="text-slate-300 font-bold text-[9px] uppercase tracking-widest">
                                                    En attente
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200 font-bold uppercase text-sm">
                            <tr>
                                <td colSpan="2" className="px-10 py-8 text-right text-slate-400 tracking-[0.2em]">Récapitulatif de la sélection</td>
                                <td className="px-6 py-8 text-center text-slate-900">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-blue-600/50 mb-1">Total HS</span>
                                        <span className="text-2xl font-black font-mono-numbers">{stats.heuresSupp}h</span>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-center text-slate-900">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-emerald-600/50 mb-1">Total Avances</span>
                                        <span className="text-2xl font-black font-mono-numbers text-scarlet">{stats.avances.toFixed(3)} DT</span>
                                    </div>
                                </td>
                                <td colSpan="2" className="px-10 py-8"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
