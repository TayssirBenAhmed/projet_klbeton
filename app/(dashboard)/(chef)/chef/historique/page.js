'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function ChefHistoriquePage() {
    const [pointages, setPointages] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
            const p = await pointagesRes.json();
            const e = await employesRes.json();
            setPointages(p);
            setEmployes(e);
            initializeSheet(e, p, selectedDate);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const initializeSheet = (allEmployes, currentPointages, date) => {
        const newEntries = {};
        allEmployes.forEach(emp => {
            const existing = currentPointages.find(p => p.employeId === emp.id && p.date.startsWith(date));
            if (existing) {
                newEntries[emp.id] = {
                    statut: existing.statut,
                    heuresSupp: existing.heuresSupp,
                    joursTravailles: existing.joursTravailles,
                    notes: existing.notes || '',
                };
            } else {
                newEntries[emp.id] = null;
            }
        });
        setSheetEntries(newEntries);
    };

    useEffect(() => {
        if (employes.length > 0) {
            initializeSheet(employes, pointages, selectedDate);
        }
    }, [selectedDate, employes, pointages]);

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const entriesToSave = Object.entries(sheetEntries)
                .filter(([_, data]) => data !== null)
                .map(([empId, data]) => ({
                    employeId: empId,
                    ...data
                }));

            const res = await fetch('/api/pointages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bulk: true,
                    date: selectedDate,
                    pointages: entriesToSave
                }),
            });

            if (res.ok) {
                alert('Historique mis à jour !');
                fetchData();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="border-b-4 border-slate-900 pb-8">
                <h1 className="text-5xl font-black text-slate-900 uppercase">Historique & <span className="text-blue-600">Modifications</span></h1>
                <p className="text-slate-500 font-bold uppercase mt-2 italic">Consulter et corriger les pointages passés</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] border-3 border-slate-900 shadow-xl flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 1);
                        setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all font-black">&lt;</button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-8 py-5 bg-slate-50 border-3 border-slate-200 rounded-2xl text-2xl font-black text-slate-900 outline-none"
                    />
                    <button onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        setSelectedDate(d.toISOString().split('T')[0]);
                    }} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all font-black">&gt;</button>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="btn btn-primary px-10 py-5 text-xl flex items-center gap-3"
                >
                    <Save className="w-6 h-6" /> METTRE À JOUR
                </button>
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
                            {employes.map(emp => {
                                const entry = sheetEntries[emp.id];
                                if (!entry) return (
                                    <tr key={emp.id} className="bg-slate-50/50 italic opacity-50">
                                        <td className="px-10 py-6 font-bold">{emp.nom} {emp.prenom}</td>
                                        <td colSpan="5" className="px-10 py-6 text-center text-xs font-black uppercase">Aucun pointage trouvé pour cette date</td>
                                    </tr>
                                );

                                const isAbsent = entry.statut === 'ABSENT' || entry.statut === 'MALADIE';

                                const getStatusStyles = (s, entryStatut) => {
                                    const active = s === entryStatut;
                                    const colors = {
                                        PRESENT: { active: 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-500/20', inactive: 'bg-emerald-50 text-emerald-400 border-emerald-100 hover:bg-emerald-100' },
                                        ABSENT: { active: 'bg-rose-600 text-white border-rose-700 shadow-lg shadow-rose-500/20', inactive: 'bg-rose-50 text-rose-400 border-rose-100 hover:bg-rose-100' },
                                        CONGE: { active: 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20', inactive: 'bg-amber-50 text-amber-400 border-amber-100 hover:bg-amber-100' },
                                        MALADIE: { active: 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/20', inactive: 'bg-orange-50 text-orange-400 border-orange-100 hover:bg-orange-100' },
                                        FERIE: { active: 'bg-sky-500 text-white border-sky-600 shadow-lg shadow-sky-500/20', inactive: 'bg-sky-50 text-sky-400 border-sky-100 hover:bg-sky-100' },
                                    };
                                    const cfg = colors[s] || { active: 'bg-slate-600 text-white', inactive: 'bg-slate-50 text-slate-300' };
                                    return active ? cfg.active : cfg.inactive;
                                };

                                return (
                                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg font-black uppercase shrink-0">
                                                    {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-slate-900 uppercase truncate">{emp.nom} {emp.prenom}</p>
                                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">{emp.poste}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center gap-1.5">
                                                {['PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'FERIE'].map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSheetEntries(prev => {
                                                            const e = { ...prev[emp.id], statut: s };
                                                            if (s === 'ABSENT' || s === 'MALADIE') e.heuresSupp = 0;
                                                            return { ...prev, [emp.id]: e };
                                                        })}
                                                        className={`px-3 py-2.5 rounded-xl text-[9px] font-black border-2 transition-all min-w-[75px] ${getStatusStyles(s, entry.statut)}`}
                                                    >
                                                        {s === 'MALADIE' ? 'SICK' : s}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`flex items-center justify-center gap-3 ${isAbsent ? 'opacity-30 pointer-events-none' : ''}`}>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={entry.heuresSupp}
                                                    onChange={(e) => setSheetEntries(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], heuresSupp: parseFloat(e.target.value) || 0 } }))}
                                                    className="w-20 text-center font-black bg-white border-2 border-slate-200 rounded-xl py-2 focus:border-blue-600 outline-none shadow-sm"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <input
                                                type="number"
                                                step="5"
                                                value={entry.avance || 0}
                                                onChange={(e) => setSheetEntries(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], avance: parseFloat(e.target.value) || 0 } }))}
                                                className="w-24 text-center text-lg font-black bg-white border-2 border-slate-200 rounded-xl py-2 focus:border-emerald-500 focus:bg-emerald-50 outline-none transition-all shadow-sm"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <input
                                                type="text"
                                                value={entry.notes || ''}
                                                onChange={(e) => setSheetEntries(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], notes: e.target.value } }))}
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-600 outline-none transition-all shadow-sm"
                                                placeholder="Observation..."
                                            />
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase bg-emerald-50 px-4 py-2 rounded-xl ring-1 ring-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Historique
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-4 border-slate-900 font-black uppercase text-xs">
                            <tr>
                                <td colSpan="2" className="px-10 py-6 text-right text-slate-500 tracking-widest">Totaux corrigés</td>
                                <td className="px-6 py-6 text-center text-slate-900 border-x-2 border-slate-200 bg-blue-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-blue-600 opacity-50">Total HS</span>
                                        <span className="text-2xl">{Object.values(sheetEntries).reduce((sum, e) => sum + (e?.heuresSupp || 0), 0)}h</span>
                                    </div>
                                </td>
                                <td className="px-6 py-6 text-center text-slate-900 border-r-2 border-slate-200 bg-emerald-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-emerald-600 opacity-50">Total Avances</span>
                                        <span className="text-2xl">{Object.values(sheetEntries).reduce((sum, e) => sum + (e?.avance || 0), 0).toFixed(3)} DT</span>
                                    </div>
                                </td>
                                <td colSpan="2" className="px-10 py-6"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
