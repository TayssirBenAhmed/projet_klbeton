'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Plus,
    Search,
    Briefcase,
    Calendar,
    Wallet,
    ChevronRight,
    X,
    User,
    Mail,
    Lock,
    Shield,
    TrendingUp,
    LayoutGrid,
    LayoutList,
    Clock,
    ArrowRight,
    CheckCircle2,
    Download,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// ---- Fuzzy Search utility ----
function fuzzyMatch(text, query) {
    if (!query) return true;
    const t = text.toLowerCase().replace(/\s+/g, '');
    const q = query.toLowerCase().replace(/\s+/g, '');
    if (t.includes(q)) return true;

    // Levenshtein distance with threshold
    const maxDist = Math.max(1, Math.floor(q.length * 0.35));
    return levenshtein(t, q) <= maxDist || subsequenceMatch(t, q);
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 3) return 999;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return dp[m][n];
}

function subsequenceMatch(text, query) {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) qi++;
    }
    return qi >= query.length * 0.8;
}

export default function EmployesPage() {
    const { t } = useLanguage();
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [drawerLoading, setDrawerLoading] = useState(false);

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        poste: '',
        employeeId: '',
        dateEmbauche: new Date().toISOString().split('T')[0],
        salaireBase: 0,
        email: '',
        password: '',
        role: 'EMPLOYE',
        soldeConges: 18,
        soldeMaladie: 10,
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchEmployes();
    }, []);

    const fetchEmployes = async () => {
        try {
            const res = await fetch('/api/employes?includeStats=true');
            const data = await res.json();
            setEmployes(data);
        } catch (error) {
            console.error('Erreur chargement employés:', error);
        } finally {
            setLoading(false);
        }
    };

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const url = isEditing ? `/api/employes/${selectedEmployee.id}` : '/api/employes';
            const method = isEditing ? 'PATCH' : 'POST';

            // Clean data before sending
            const payload = {
                ...formData,
                salaireBase: parseFloat(formData.salaireBase) || 0,
                soldeConges: parseFloat(formData.soldeConges) || 0,
                soldeMaladie: parseFloat(formData.soldeMaladie) || 0,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (res.ok) {
                setShowModal(false);
                setIsEditing(false);
                fetchEmployes();
                setFormData({
                    nom: '', prenom: '', poste: '', employeeId: '',
                    dateEmbauche: new Date().toISOString().split('T')[0],
                    salaireBase: 0, email: '', password: '', role: 'EMPLOYE',
                    soldeConges: 18, soldeMaladie: 10,
                });
            } else {
                setError(result.details || result.error || "Une erreur est survenue");
            }
        } catch (error) {
            console.error('Erreur soumission:', error);
            setError("Erreur de connexion au serveur");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (emp) => {
        setFormData({
            nom: emp.nom,
            prenom: emp.prenom,
            poste: emp.poste,
            employeeId: emp.employeeId,
            dateEmbauche: emp.dateEmbauche.split('T')[0],
            salaireBase: emp.salaireBase,
            email: emp.user?.email || '',
            password: '', // On ne préremplit pas le mot de passe
            role: emp.user?.role || 'EMPLOYE',
            soldeConges: emp.soldeConges,
            soldeMaladie: emp.soldeMaladie,
        });
        setIsEditing(true);
        setShowModal(true);
    };

    const openDrawer = async (emp) => {
        setSelectedEmployee(emp);
        // If employee has detailed stats, use them, otherwise fetch
        if (!emp.recapMensuel) {
            setDrawerLoading(true);
            try {
                const res = await fetch(`/api/employes/${emp.id}`);
                const data = await res.json();
                setSelectedEmployee(data);
            } catch (e) {
                console.error('Erreur chargement détail:', e);
            } finally {
                setDrawerLoading(false);
            }
        }
    };

    const filteredEmployes = useMemo(() => {
        return employes.filter(emp => {
            const searchable = `${emp.nom} ${emp.prenom} ${emp.poste} ${emp.employeeId || ''}`;
            return fuzzyMatch(searchable, searchTerm);
        });
    }, [employes, searchTerm]);

    if (loading && employes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-16 h-16 border-8 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="mt-6 text-slate-900 font-black uppercase tracking-widest text-lg">{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b-4 border-slate-900">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                        {t('employeeManagement')}
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.3em] text-xs">
                        {filteredEmployes.length} {filteredEmployes.length > 1 ? t('employees').toLowerCase() : t('employee').toLowerCase()} {t('found') || 'trouvé'}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* SENIOR-FRIENDLY: Massive Delete All button */}
                    <button
                        onClick={() => setShowDeleteAllModal(true)}
                        className="bg-red-600 text-white px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-red-700 transition-all flex items-center gap-3"
                    >
                        <Trash2 className="w-6 h-6" />
                        {t('deleteAllEmployees')}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3"
                    >
                        <Plus className="w-6 h-6" />
                        + {t('addEmployee')}
                    </button>
                </div>
            </div>

            {/* Search + View Toggle */}
            <div className="bg-white p-6 rounded-[32px] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-3 border-transparent rounded-2xl text-xl font-bold placeholder:text-slate-300 focus:border-blue-600 outline-none transition-all"
                        />
                    </div>
                    <div className="flex bg-slate-100 rounded-2xl p-1.5 border-2 border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
                            title={t('gridView')}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700'}`}
                            title={t('tableView')}
                        >
                            <LayoutList className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== GRID VIEW ===== */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredEmployes.length === 0 ? (
                        <div className="col-span-full text-center py-24 bg-white rounded-[40px] border-4 border-slate-900 border-dashed">
                            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">{t('noEmployeesFound')}</p>
                        </div>
                    ) : (
                        filteredEmployes.map((employe, idx) => (
                            <motion.div
                                key={employe.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div
                                    onClick={() => openDrawer(employe)}
                                    className="group cursor-pointer bg-white rounded-[40px] p-8 border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
                                >
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-black uppercase">
                                            {employe.nom[0]}{employe.prenom[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase leading-none">
                                                {employe.nom} {employe.prenom}
                                            </h3>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-2">
                                                {employe.poste} • {t('matricule')}: {employe.employeeId || '---'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 items-center justify-center flex flex-col">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Présence</p>
                                            <p className="text-2xl font-black text-blue-600">
                                                {employe.statsMensuelles?.presence || 0} <span className="text-xs uppercase">J</span>
                                            </p>
                                        </div>
                                        <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 items-center justify-center flex flex-col">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('overtimeShort')}</p>
                                            <p className="text-2xl font-black text-slate-900">
                                                +{employe.statsMensuelles?.heuresSupp || 0} <span className="text-xs uppercase">H</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t-2 border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${employe.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <span className="text-[10px] font-black uppercase text-slate-400">{employe.statut === 'ACTIF' ? t('active') : t('inactive')}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* ===== TABLE VIEW ===== */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-[40px] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y-4 divide-slate-900">
                            <thead className="bg-slate-900 text-white">
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em]">{t('employee')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('position')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('matricule')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('presence')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('overtimeShort')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('status')}</th>
                                    <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em]">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16 text-slate-400 font-black uppercase text-xs">
                                            {t('noEmployeesFound')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployes.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openDrawer(emp)}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black uppercase">
                                                        {emp.nom[0]}{emp.prenom[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-black text-slate-900 uppercase">{emp.nom} {emp.prenom}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg uppercase">{emp.poste}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-xs font-black text-slate-500">{emp.employeeId || '---'}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-lg font-black text-blue-600">{emp.statsMensuelles?.presence || 0}</span>
                                                <span className="text-[10px] text-slate-400 font-bold ml-1">J</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-lg font-black text-slate-900">+{emp.statsMensuelles?.heuresSupp || 0}</span>
                                                <span className="text-[10px] text-slate-400 font-bold ml-1">H</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${emp.statut === 'ACTIF' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{emp.statut === 'ACTIF' ? t('active') : t('inactive')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mx-auto group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== EMPLOYEE DRAWER ===== */}
            <AnimatePresence>
                {selectedEmployee && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEmployee(null)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[100] overflow-y-auto"
                        >
                            {/* Drawer Header */}
                            <div className="sticky top-0 z-10 bg-slate-900 text-white p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Fiche Collaborateur</p>
                                    <button
                                        onClick={() => setSelectedEmployee(null)}
                                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl font-black flex-shrink-0">
                                        {selectedEmployee.nom?.[0]}{selectedEmployee.prenom?.[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black uppercase leading-none">
                                            {selectedEmployee.nom} {selectedEmployee.prenom}
                                        </h2>
                                        <p className="text-blue-400 text-sm font-bold mt-2 uppercase tracking-widest">
                                            {selectedEmployee.poste} • {selectedEmployee.employeeId || '---'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {drawerLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="p-8 space-y-8">
                                    {/* Progress Bar X/26 */}
                                    <div className="bg-slate-900 rounded-3xl p-6 text-white">
                                        <div className="flex items-end gap-2 mb-1">
                                            <span className="text-4xl font-black">
                                                {selectedEmployee.recapMensuel?.salaire?.totalJoursPayes || selectedEmployee.statsMensuelles?.presence || 0}
                                            </span>
                                            <span className="text-lg font-bold text-slate-400 mb-1">/ 26 jours</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Progression mensuelle</p>
                                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${Math.min(100, (((selectedEmployee.recapMensuel?.salaire?.totalJoursPayes || selectedEmployee.statsMensuelles?.presence || 0) / 26) * 100))}%`
                                                }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                            />
                                        </div>
                                        <p className="text-right text-blue-400 text-[10px] font-black mt-2 uppercase">
                                            {Math.min(100, Math.round(((selectedEmployee.recapMensuel?.salaire?.totalJoursPayes || selectedEmployee.statsMensuelles?.presence || 0) / 26) * 100))}%
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-100 text-center">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Présence</p>
                                            <p className="text-2xl font-black text-blue-600">
                                                {selectedEmployee.statsMensuelles?.presence || selectedEmployee.recapMensuel?.pointages?.presence || 0} <span className="text-xs">J</span>
                                            </p>
                                        </div>
                                        <div className="p-5 bg-amber-50 rounded-2xl border-2 border-amber-100 text-center">
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">H. Supp</p>
                                            <p className="text-2xl font-black text-amber-600">
                                                +{selectedEmployee.statsMensuelles?.heuresSupp || selectedEmployee.recapMensuel?.pointages?.heuresSupp || 0} <span className="text-xs">H</span>
                                            </p>
                                        </div>
                                        <div className="p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-100 text-center">
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net à Payer</p>
                                            <p className="text-xl font-black text-emerald-600">
                                                {(selectedEmployee.recapMensuel?.salaire?.salaireNet || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                                <span className="text-xs ml-1">DT</span>
                                            </p>
                                        </div>
                                        <div className="p-5 bg-rose-50 rounded-2xl border-2 border-rose-100 text-center">
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Avances</p>
                                            <p className="text-xl font-black text-rose-600">
                                                {(selectedEmployee.recapMensuel?.salaire?.totalAvances || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                                                <span className="text-xs ml-1">DT</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Informations</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Embauche', value: selectedEmployee.dateEmbauche ? new Date(selectedEmployee.dateEmbauche).toLocaleDateString('fr-FR') : 'N/A', icon: Calendar },
                                                { label: 'Salaire Base', value: `${selectedEmployee.salaireBase || 0} TND`, icon: Wallet },
                                                { label: 'Statut', value: selectedEmployee.statut, icon: CheckCircle2 },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100">
                                                        <item.icon className="w-5 h-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                                        <p className="text-sm font-bold text-slate-900">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleEdit(selectedEmployee)}
                                            className="bg-slate-900 text-white text-center py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                        >
                                            Modifier
                                        </button>
                                        <Link
                                            href={`/admin/dashboard/employes/${selectedEmployee.id}`}
                                            className="bg-blue-600 text-white text-center py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                        >
                                            Profil →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ===== CREATE MODAL ===== */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-4xl rounded-[48px] overflow-hidden shadow-2xl relative z-10 border-4 border-slate-900"
                        >
                            <div className="p-10 border-b-4 border-slate-900 flex flex-col bg-white text-slate-900">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-4xl font-black uppercase tracking-tighter">
                                        {isEditing ? t('editEmployee') : t('create')} <span className="text-blue-600">{t('employee')}</span>
                                    </h3>
                                    <button onClick={() => { setShowModal(false); setIsEditing(false); setError(null); }} className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-rose-600 hover:text-white transition-all">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5" />
                                        {error}
                                    </motion.div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Infos de Base */}
                                    <div className="col-span-full mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-8 h-px bg-slate-200" /> {t('personalInfo')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('lastName')}</label>
                                        <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value.toUpperCase() })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('firstName')}</label>
                                        <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('matricule')}</label>
                                        <input type="text" value={formData.employeeId} placeholder="Ex: KL-042" onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-100 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" required />
                                    </div>

                                    {/* Contrat */}
                                    <div className="col-span-full mt-4 mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-8 h-px bg-slate-200" /> {t('professionalInfo')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('position')}</label>
                                        <input type="text" value={formData.poste} onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('hireDate')}</label>
                                        <input type="date" value={formData.dateEmbauche} onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('monthlySalary')} (TND)</label>
                                        <input type="number" value={formData.salaireBase || ''} onChange={(e) => setFormData({ ...formData, salaireBase: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            className="w-full px-6 py-4 bg-emerald-50 border-3 border-transparent rounded-2xl text-xl font-black text-emerald-700 focus:border-emerald-600 outline-none transition-all" required />
                                    </div>

                                    {/* Soldes initiaux */}
                                    <div className="col-span-full mt-4 mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-8 h-px bg-slate-200" /> {t('vacationBalance')} & {t('sickBalance')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('vacationBalance')} ({t('days')})</label>
                                        <input type="number" step="0.5" value={formData.soldeConges ?? ''} onChange={(e) => setFormData({ ...formData, soldeConges: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            className="w-full px-6 py-4 bg-blue-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('sickBalance')} ({t('days')})</label>
                                        <input type="number" step="0.5" value={formData.soldeMaladie ?? ''} onChange={(e) => setFormData({ ...formData, soldeMaladie: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            className="w-full px-6 py-4 bg-rose-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-rose-600 outline-none transition-all" />
                                    </div>

                                    {/* Accès */}
                                    <div className="col-span-full mt-4 mb-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-8 h-px bg-slate-200" /> {t('accessPlatform')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('role')}</label>
                                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all">
                                            <option value="EMPLOYE">EMPLOYÉ</option>
                                            <option value="CHEF">CHEF</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="col-span-full md:col-span-1 space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('email')}</label>
                                        <input type="email" value={formData.email} placeholder="nom.prenom@klbeton.tn" onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">{t('password')}</label>
                                        <input type="password" value={formData.password} placeholder="********" onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border-3 border-transparent rounded-2xl text-lg font-bold focus:border-blue-600 outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="flex gap-6 mt-12">
                                    <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); }} className="flex-1 py-5 text-sm font-black uppercase text-slate-400 hover:text-slate-900 transition-all">
                                        {t('cancelAction')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-lg tracking-widest shadow-[6px_6px_0px_0px_rgba(37,99,235,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {submitting ? t('processing') : (isEditing ? t('saveChanges') : t('createProfile'))}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== DELETE ALL CONFIRMATION MODAL (SENIOR-FRIENDLY) ===== */}
            <AnimatePresence>
                {showDeleteAllModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                            onClick={() => !isDeleting && setShowDeleteAllModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl border-4 border-red-600"
                        >
                            {/* Warning Header */}
                            <div className="text-center mb-8">
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertTriangle className="w-12 h-12 text-red-600" />
                                </div>
                                <h2 className="text-4xl font-black text-red-600 uppercase tracking-tight mb-4">
                                    {t('deleteAllConfirmTitle')}
                                </h2>
                                <p className="text-xl text-slate-600 font-bold leading-relaxed">
                                    {t('deleteAllConfirmMessage')}
                                </p>
                            </div>

                            {/* Type to Confirm */}
                            <div className="bg-red-50 rounded-2xl p-6 mb-8 border-2 border-red-200">
                                <label className="block text-sm font-black text-red-700 uppercase tracking-widest mb-4">
                                    {t('typeToConfirm')}
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="SUPPRIMER"
                                    disabled={isDeleting}
                                    className="w-full px-6 py-5 bg-white border-3 border-red-300 rounded-2xl text-2xl font-black text-red-700 uppercase tracking-widest placeholder:text-red-300 focus:border-red-600 outline-none transition-all text-center"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteAllModal(false);
                                        setDeleteConfirmText('');
                                    }}
                                    disabled={isDeleting}
                                    className="flex-1 py-5 rounded-2xl font-black text-lg uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        if (deleteConfirmText !== 'SUPPRIMER') {
                                            alert('Vous devez taper exactement "SUPPRIMER" pour confirmer');
                                            return;
                                        }
                                        setIsDeleting(true);
                                        try {
                                            const res = await fetch('/api/employes/delete-all', {
                                                method: 'DELETE',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ confirmation: 'SUPPRIMER' })
                                            });
                                            const result = await res.json();
                                            if (res.ok) {
                                                alert(`${t('deleteSuccess')}\n\nEmployés: ${result.deleted.employes}\nPointages: ${result.deleted.pointages}\nAvances: ${result.deleted.avances}\nUtilisateurs: ${result.deleted.users}`);
                                                setShowDeleteAllModal(false);
                                                setDeleteConfirmText('');
                                                fetchEmployes();
                                            } else {
                                                alert(result.error || 'Erreur lors de la suppression');
                                            }
                                        } catch (error) {
                                            alert('Erreur de connexion');
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                                    className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isDeleting ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t('deleting')}
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-6 h-6" />
                                            {t('yesDeleteAll')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
