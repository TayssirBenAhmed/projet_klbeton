'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Clock, TrendingUp, Download, Save, X, Check, AlertCircle } from 'lucide-react';

export default function AttendanceAdminPage() {
    const [employees, setEmployees] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pointages, setPointages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            fetchPointages(selectedEmployee, selectedMonth, selectedYear);
        }
    }, [selectedEmployee, selectedMonth, selectedYear]);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employes');
            const data = await res.json();
            setEmployees(data);
            if (data.length > 0) setSelectedEmployee(data[0].id);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPointages = async (employeId, mois, annee) => {
        try {
            const res = await fetch(`/api/pointages?employeId=${employeId}&mois=${mois}&annee=${annee}`);
            const data = await res.json();
            setPointages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdatePointage = async (pointageId, newData) => {
        try {
            await fetch('/api/pointages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pointageId, ...newData })
            });
            fetchPointages(selectedEmployee, selectedMonth, selectedYear);
            setEditMode(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePointage = async (employeId, date, statut) => {
        try {
            await fetch('/api/pointages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeId,
                    date: date.toISOString(),
                    statut,
                    joursTravailles: statut === 'ABSENT' ? 0 : 1,
                    heuresSupp: 0
                })
            });
            fetchPointages(selectedEmployee, selectedMonth, selectedYear);
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate summary for selected employee
    const calculateSummary = () => {
        const total = {
            present: 0,
            absent: 0,
            conge: 0,
            maladie: 0,
            ferie: 0,
            heuresSupp: 0,
            totalJoursPayes: 0
        };

        pointages.forEach(p => {
            const isDimanche = new Date(p.date).getDay() === 0;

            if (p.statut === 'ABSENT') {
                total.absent += 1;
            } else if (p.statut === 'PRESENT') {
                if (isDimanche) {
                    // Option B: Dimanche = 0 jours, heures en HS
                    const heuresDim = p.heuresSupp > 0 ? p.heuresSupp : 8;
                    total.heuresSupp += heuresDim;
                } else {
                    total.present += p.joursTravailles || 1;
                    total.heuresSupp += p.heuresSupp || 0;
                    total.totalJoursPayes += p.joursTravailles || 1;
                }
            } else if (p.statut === 'CONGE') {
                total.conge += p.joursTravailles || 1;
                total.totalJoursPayes += p.joursTravailles || 1;
            } else if (p.statut === 'MALADIE') {
                total.maladie += p.joursTravailles || 1;
                total.totalJoursPayes += p.joursTravailles || 1;
            } else if (p.statut === 'FERIE') {
                total.ferie += p.joursTravailles || 1;
                total.totalJoursPayes += p.joursTravailles || 1;
            }
        });

        return total;
    };

    const summary = calculateSummary();
    const progression = Math.min(100, Math.round((summary.totalJoursPayes / 26) * 100));

    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
        const days = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, selectedMonth - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const pointage = pointages.find(p => p.date.split('T')[0] === dateStr);
            const isDimanche = date.getDay() === 0;

            days.push(
                <div
                    key={day}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${pointage?.statut === 'PRESENT' ? 'bg-emerald-50 border-emerald-500' :
                        pointage?.statut === 'ABSENT' ? 'bg-rose-50 border-rose-500' :
                            pointage?.statut === 'CONGE' ? 'bg-amber-50 border-amber-500' :
                                pointage?.statut === 'MALADIE' ? 'bg-red-50 border-red-500' :
                                    pointage?.statut === 'FERIE' ? 'bg-blue-50 border-blue-500' :
                                        isDimanche ? 'bg-slate-100 border-slate-300' :
                                            'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                    onClick={() => !pointage && handleCreatePointage(selectedEmployee, date, 'PRESENT')}
                >
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-black text-slate-900">{day}</div>
                    {pointage && (
                        <div className="mt-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${pointage.statut === 'PRESENT' ? 'text-emerald-700' :
                                pointage.statut === 'ABSENT' ? 'text-rose-700' :
                                    'text-slate-700'
                                }`}>
                                {pointage.statut}
                            </span>
                            {pointage.heuresSupp > 0 && (
                                <div className="text-[10px] text-blue-600 font-bold">+{pointage.heuresSupp}h</div>
                            )}
                        </div>
                    )}
                    {isDimanche && !pointage && (
                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-2">Repos</div>
                    )}
                </div>
            );
        }

        return days;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-bold uppercase">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Gestion des Pointages</h1>
                    <p className="text-slate-500 font-bold mt-2">Système 26 Jours</p>
                </div>
                <button className="btn btn-primary gap-2">
                    <Download className="w-4 h-4" />
                    Exporter PDF
                </button>
            </div>

            {/* Employee & Date Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Employé</label>
                    <select
                        value={selectedEmployee || ''}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 font-bold"
                    >
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenom}</option>
                        ))}
                    </select>
                </div>
                <div className="card">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mois</label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 font-bold"
                    >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>
                                {new Date(2024, m - 1).toLocaleDateString('fr-FR', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="card">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Année</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 font-bold"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Check className="w-8 h-8 text-emerald-600" />
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase">Présent</p>
                            <p className="text-3xl font-black text-emerald-900">{summary.present}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-rose-50 border-rose-200">
                    <div className="flex items-center gap-3 mb-2">
                        <X className="w-8 h-8 text-rose-600" />
                        <div>
                            <p className="text-[10px] font-black text-rose-600 uppercase">Absent</p>
                            <p className="text-3xl font-black text-rose-900">{summary.absent}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-amber-50 border-amber-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-8 h-8 text-amber-600" />
                        <div>
                            <p className="text-[10px] font-black text-amber-600 uppercase">Congés</p>
                            <p className="text-3xl font-black text-amber-900">{summary.conge}</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-[10px] font-black text-blue-600 uppercase">H. Supp</p>
                            <p className="text-3xl font-black text-blue-900">{summary.heuresSupp}h</p>
                        </div>
                    </div>
                </div>
                <div className="card bg-slate-900">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-white">{summary.totalJoursPayes}</span>
                            <span className="text-lg font-bold text-slate-400 mb-1">/ 26</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${progression >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${progression}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Progression</p>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="card">
                <h3 className="text-xl font-black text-slate-900 uppercase mb-6">Calendrier du Mois</h3>
                <div className="grid grid-cols-7 gap-3">
                    {renderCalendar()}
                </div>
                <div className="mt-6 flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500" />
                        <span className="font-bold text-slate-600">Présent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-rose-500" />
                        <span className="font-bold text-slate-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500" />
                        <span className="font-bold text-slate-600">Congé</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-slate-300" />
                        <span className="font-bold text-slate-600">Dimanche</span>
                    </div>
                </div>
            </div>

            {/* Info Alert */}
            <div className="card bg-blue-50 border-blue-200">
                <div className="flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-black text-blue-900 uppercase text-sm mb-2">Règles des 26 Jours</h4>
                        <ul className="text-sm text-blue-800 space-y-1 font-medium">
                            <li>• <strong>Absence</strong> : 0 jour travaillé, 0 heures sup</li>
                            <li>• <strong>Dimanche (Option B)</strong> : Ne compte pas dans les 26 jours, heures ajoutées en HS</li>
                            <li>• <strong>Total Payé</strong> : Présent (Lun-Sam) + Congés + Fériés + Maladie</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
