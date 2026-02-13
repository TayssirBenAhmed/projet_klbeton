'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Save,
    Loader2,
    Calendar,
    Search,
    Filter
} from 'lucide-react';

export default function QuickAttendancePage() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');
    const [attendanceData, setAttendanceData] = useState({}); // { employeId: { statut, heuresSupp } }

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchCurrentDayPointages();
    }, [date, employees]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employes');
            const data = await res.json();
            setEmployees(data.filter(e => e.statut === 'ACTIF'));
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchCurrentDayPointages = async () => {
        if (employees.length === 0) return;
        try {
            const res = await fetch(`/api/pointage?date=${date}`);
            const data = await res.json();

            const initialData = {};
            employees.forEach(emp => {
                const p = data.find(pointage => pointage.employeId === emp.id);
                initialData[emp.id] = {
                    statut: p?.statut || 'ABSENT',
                    heuresSupp: p?.heuresSupp || 0
                };
            });
            setAttendanceData(initialData);
        } catch (error) {
            console.error('Error fetching pointages:', error);
        }
    };

    const handleStatusChange = (empId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [empId]: { ...prev[empId], statut: status }
        }));
    };

    const handleOTChange = (empId, ot) => {
        setAttendanceData(prev => ({
            ...prev,
            [empId]: { ...prev[empId], heuresSupp: parseFloat(ot) || 0 }
        }));
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const pointages = Object.entries(attendanceData).map(([id, data]) => ({
                employeId: id,
                statut: data.statut,
                heuresSupp: data.heuresSupp
            }));

            const res = await fetch('/api/pointage/rapide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day: date, pointages })
            });

            if (res.ok) {
                alert('✅ Pointages enregistrés avec succès');
            } else {
                alert('❌ Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            alert('❌ Erreur serveur');
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = employees.filter(e =>
        `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
        (e.employeeId && e.employeeId.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-slate-900 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Saisie <span className="text-blue-600">Rapide</span></h1>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-2">Validation collective de la journée</p>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-white border-3 border-slate-900 px-6 py-3 rounded-2xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all outline-none"
                    />
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Enregistrer Tout
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-3 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-blue-600 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => {
                        const allPresent = {};
                        employees.forEach(e => allPresent[e.id] = { statut: 'PRESENT', heuresSupp: 0 });
                        setAttendanceData(prev => ({ ...prev, ...allPresent }));
                    }} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-xs uppercase hover:bg-emerald-200">Tout Présent</button>
                    <button onClick={() => {
                        const allAbsent = {};
                        employees.forEach(e => allAbsent[e.id] = { statut: 'ABSENT', heuresSupp: 0 });
                        setAttendanceData(prev => ({ ...prev, ...allAbsent }));
                    }} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-black text-xs uppercase hover:bg-rose-200">Tout Absent</button>
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-8 py-6 font-black uppercase tracking-widest text-xs">Employé</th>
                            <th className="px-8 py-6 font-black uppercase tracking-widest text-xs text-center">Statut</th>
                            <th className="px-8 py-6 font-black uppercase tracking-widest text-xs text-center">Heures Supp</th>
                            <th className="px-8 py-6 font-black uppercase tracking-widest text-xs text-right">Dernière Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                        {filteredEmployees.map((emp) => (
                            <motion.tr
                                layout
                                key={emp.id}
                                className="hover:bg-slate-50 transition-colors group"
                            >
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-black text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all">
                                            {emp.nom[0]}{emp.prenom[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase leading-none">{emp.nom} {emp.prenom}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                ID: {emp.employeeId || '---'} • {emp.poste}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center justify-center gap-2">
                                        {[
                                            { id: 'PRESENT', label: 'P', color: 'emerald' },
                                            { id: 'ABSENT', label: 'A', color: 'rose' },
                                            { id: 'CONGE', label: 'C', color: 'blue' },
                                            { id: 'FERIE', label: 'F', color: 'amber' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => handleStatusChange(emp.id, s.id)}
                                                className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${attendanceData[emp.id]?.statut === s.id
                                                        ? `bg-${s.color}-600 border-slate-900 text-white translate-x-1 translate-y-1 shadow-none`
                                                        : `bg-${s.color}-50 border-${s.color}-200 text-${s.color}-600 hover:border-${s.color}-400`
                                                    }`}
                                                title={s.id}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center">
                                        <div className="relative w-24">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={attendanceData[emp.id]?.heuresSupp || 0}
                                                onChange={(e) => handleOTChange(emp.id, e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-black text-center focus:border-blue-600 outline-none transition-all group-hover:bg-white"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                    {emp.pointages?.[0]?.updatedAt ? new Date(emp.pointages[0].updatedAt).toLocaleTimeString('fr-FR') : '---'}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
