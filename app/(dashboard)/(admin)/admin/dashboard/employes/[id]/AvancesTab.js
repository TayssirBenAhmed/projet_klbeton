'use client';

import { useState, useEffect } from 'react';
import { Wallet, Trash2, Calendar, AlertCircle } from 'lucide-react';

export default function AvancesTab({ employeId }) {
    const [avances, setAvances] = useState([]);
    const [montant, setMontant] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAvances();
    }, [employeId]);

    const fetchAvances = async () => {
        try {
            const res = await fetch(`/api/avances?employeId=${employeId}`);
            if (res.ok) {
                const data = await res.json();
                setAvances(data);
            }
        } catch (error) {
            console.error('Erreur chargement avances:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAvance = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/avances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeId,
                    montant: parseFloat(montant),
                    date,
                    note: 'Avance sur salaire'
                })
            });

            if (res.ok) {
                setMontant('');
                fetchAvances();
            }
        } catch (error) {
            console.error('Erreur création avance:', error);
        }
    };

    const handleDeleteAvance = async (id) => {
        if (!confirm('Supprimer cette avance ?')) return;
        try {
            await fetch(`/api/avances/${id}`, { method: 'DELETE' });
            fetchAvances();
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    // Calcul du total
    const totalAvances = avances.reduce((sum, a) => sum + a.montant, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Liste historique - Occupes now full width or 2 columns if sidebar desired */}
            <div className="md:col-span-3 space-y-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-slate-900 p-8 rounded-[32px] border-3 border-slate-900 flex items-center justify-between text-white shadow-2xl">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Avances (Mois)</p>
                            <p className="text-4xl font-black text-white">{totalAvances.toFixed(3)} TND</p>
                        </div>
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                            <Wallet className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[32px] border-3 border-slate-900 shadow-xl">
                    <div className="flex items-center gap-3 mb-8 border-l-4 border-blue-600 pl-4">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Historique des Avances</h3>
                    </div>
                    {avances.length > 0 ? (
                        <div className="space-y-4">
                            {avances.map((avance) => (
                                <div key={avance.id} className="flex items-center justify-between p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl group hover:border-blue-500 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white border-2 border-slate-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm font-black">
                                            $
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">{avance.montant.toFixed(3)} TND</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(avance.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteAvance(avance.id)}
                                        className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-white hover:bg-rose-600 rounded-xl transition-all border-2 border-transparent hover:border-rose-700"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-[40px] border-3 border-dashed border-slate-200">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Aucune avance enregistrée ce mois-ci</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

