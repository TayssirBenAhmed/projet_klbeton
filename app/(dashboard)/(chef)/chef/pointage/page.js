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
    X,
    Wallet
} from 'lucide-react';

export default function ChefPointagePage() {
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
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

    useEffect(() => {
        if (employes.length > 0) {
            initializeSheet(employes, pointages, filterDate);
        }
    }, [filterDate, employes, pointages]);

    const handleSheetChange = (empId, field, value) => {
        setSheetEntries(prev => {
            const entry = { ...prev[empId], [field]: value };
            if (field === 'statut') {
                const isDimanche = new Date(filterDate).getDay() === 0;
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
                alert('Journée et avances enregistrées avec succès !');
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

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-slate-900 pb-8">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        FEUILLE DE <span className="text-blue-600">PRÉSENCE</span>
                    </h1>
                    <p className="text-slate-900 font-black mt-2 uppercase tracking-wide text-lg">
                        Saisie quotidienne - {new Date(filterDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSaveSheet}
                        disabled={loading}
                        className="btn btn-primary px-10 py-5 text-xl shadow-2xl flex items-center gap-3"
                    >
                        <Save className="w-7 h-7" /> {loading ? 'EN COURS...' : 'VALIDER LA JOURNÉE'}
                    </button>
                </div>
            </div>

            {/* Stats section removed as per request for Chef cleanup */}

            <div className="bg-white p-8 rounded-[32px] border-3 border-slate-900 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 sticky top-4 z-40">
                <div className="relative">
                    <label className="text-sm font-black text-slate-500 uppercase mb-3 block">Date :</label>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full px-8 py-6 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none focus:border-blue-700"
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
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y-4 divide-slate-900">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-10 py-8 text-left text-sm font-black uppercase">Employé</th>
                                <th className="px-8 py-8 text-center text-sm font-black uppercase">Statut</th>
                                <th className="px-6 py-8 text-center text-sm font-black uppercase w-40">Heures Supp</th>
                                <th className="px-6 py-8 text-center text-sm font-black uppercase w-32">Avance (DT)</th>
                                <th className="px-8 py-8 text-left text-sm font-black uppercase">Note/Observation</th>
                                <th className="px-6 py-8 text-center text-sm font-black uppercase">État</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredEmployes.map((emp) => {
                                const entry = sheetEntries[emp.id] || {};
                                const isAbsent = entry.statut === 'ABSENT' || entry.statut === 'MALADIE';

                                const configs = {
                                    PRESENT: {
                                        active: 'bg-emerald-600 text-white border-emerald-700 status-glow-emerald',
                                        inactive: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
                                        icon: <CheckCircle2 className="w-3.5 h-3.5" />
                                    },
                                    ABSENT: {
                                        active: 'bg-rose-600 text-white border-rose-700 status-glow-rose',
                                        inactive: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
                                        icon: <X className="w-3.5 h-3.5" />
                                    },
                                    CONGE: {
                                        active: 'bg-amber-500 text-white border-amber-600 status-glow-amber',
                                        inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                                        icon: <CalendarIcon className="w-3.5 h-3.5" />
                                    },
                                    MALADIE: {
                                        active: 'bg-orange-600 text-white border-orange-700 status-glow-amber',
                                        inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                                        icon: <AlertCircle className="w-3.5 h-3.5" />
                                    },
                                    FERIE: {
                                        active: 'bg-blue-600 text-white border-blue-700 status-glow-blue',
                                        inactive: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
                                        icon: <CalendarIcon className="w-3.5 h-3.5" />
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
                                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-lg font-black uppercase shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                                    {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-slate-900 uppercase truncate leading-none">{emp.nom} {emp.prenom}</p>
                                                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mt-2">{emp.poste}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-1.5">
                                                {['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'FERIE'].map((s) => (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleSheetChange(emp.id, 'statut', s)}
                                                        className={`btn-pill border-2 text-[9px] font-black uppercase tracking-tighter ${getStatusStyle(s, entry.statut)}`}
                                                    >
                                                        {configs[s].icon}
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`flex items-center justify-center gap-2 ${isAbsent ? 'opacity-30 pointer-events-none' : ''}`}>
                                                <button onClick={() => handleSheetChange(emp.id, 'heuresSupp', Math.max(0, (entry.heuresSupp || 0) - 0.5))} className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm font-bold flex items-center justify-center">-</button>
                                                <span className="text-lg font-black w-8 text-slate-900 font-mono-numbers">{entry.heuresSupp || 0}</span>
                                                <button onClick={() => handleSheetChange(emp.id, 'heuresSupp', (entry.heuresSupp || 0) + 0.5)} className="w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm font-bold flex items-center justify-center">+</button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="relative group/input">
                                                <input
                                                    type="number"
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
                                                value={entry.notes || ''}
                                                onChange={(e) => handleSheetChange(emp.id, 'notes', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 focus:border-blue-300 focus:bg-white outline-none transition-all"
                                                placeholder="Observation..."
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
                        <tfoot className="bg-slate-50 border-t-2 border-slate-100 font-bold uppercase text-[10px]">
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
