'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit2, Trash2, Save, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Map to avoid SSR issues
const GeofenceMap = dynamic(() => import('@/components/admin/GeofenceMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[600px] bg-slate-100 rounded-3xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )
});

export default function GeofencePage() {
    const [geofences, setGeofences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        centerLat: 33.8081, // Default to Polyclinique Arij Midoun
        centerLng: 10.9923,
        radiusMeters: 200,
        isActive: true
    });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchGeofences();
    }, []);

    const fetchGeofences = async () => {
        try {
            const res = await fetch('/api/geofence');
            const data = await res.json();
            setGeofences(data);
        } catch (error) {
            console.error('Error fetching geofences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingId ? '/api/geofence' : '/api/geofence';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: editingId ? 'Périmètre mis à jour' : 'Périmètre créé' });
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    nom: '',
                    description: '',
                    centerLat: 33.8081,
                    centerLng: 10.9923,
                    radiusMeters: 200,
                    isActive: true
                });
                fetchGeofences();
            } else {
                const error = await res.json();
                setMessage({ type: 'error', text: error.message || 'Erreur' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur serveur' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (geofence) => {
        setFormData({
            nom: geofence.nom,
            description: geofence.description || '',
            centerLat: geofence.centerLat,
            centerLng: geofence.centerLng,
            radiusMeters: geofence.radiusMeters,
            isActive: geofence.isActive
        });
        setEditingId(geofence.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Supprimer ce périmètre ?')) return;

        try {
            const res = await fetch(`/api/geofence?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Périmètre supprimé' });
                fetchGeofences();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
        }
    };

    const handleMapClick = (lat, lng) => {
        setFormData({ ...formData, centerLat: lat, centerLng: lng });
    };

    if (loading && geofences.length === 0) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-slate-900 pb-4">
                <div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
                        <MapPin className="w-12 h-12 text-blue-600" />
                        PÉRIMÈTRES GPS
                    </h1>
                    <p className="text-slate-600 font-black mt-2 uppercase tracking-wide">
                        Configuration des zones de pointage automatique
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({
                            nom: '',
                            description: '',
                            centerLat: 33.8081,
                            centerLng: 10.9923,
                            radiusMeters: 200,
                            isActive: true
                        });
                    }}
                    className="btn btn-primary px-8 py-4 text-lg"
                >
                    {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    {showForm ? 'ANNULER' : 'NOUVEAU PÉRIMÈTRE'}
                </button>
            </div>

            {/* Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-2 border-rose-200'
                        }`}
                >
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-bold">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {/* Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-3xl p-8 border-2 border-slate-200"
                >
                    <h3 className="text-2xl font-black text-slate-900 uppercase mb-6">
                        {editingId ? 'Modifier le périmètre' : 'Nouveau périmètre'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                    Nom du périmètre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none"
                                    placeholder="Ex: KL Beton Siège"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                    Rayon (mètres) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.radiusMeters || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, radiusMeters: val === '' ? '' : parseInt(val) });
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none"
                                    placeholder="200"
                                    required
                                    min="50"
                                    max="1000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none"
                                rows="3"
                                placeholder="Notes sur ce périmètre..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.centerLat || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, centerLat: val === '' ? '' : parseFloat(val) });
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={formData.centerLng || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, centerLng: val === '' ? '' : parseFloat(val) });
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5"
                            />
                            <label htmlFor="isActive" className="text-sm font-black text-slate-700 uppercase">
                                Périmètre actif
                            </label>
                        </div>

                        {/* Map */}
                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase mb-2">
                                Cliquez sur la carte pour définir le centre
                            </label>
                            <GeofenceMap
                                center={[formData.centerLat, formData.centerLng]}
                                radius={formData.radiusMeters}
                                onMapClick={handleMapClick}
                                geofences={[]}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button type="submit" className="btn btn-primary px-8 py-4 flex-1" disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                {editingId ? 'METTRE À JOUR' : 'CRÉER'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                                className="btn px-8 py-4 bg-slate-200 text-slate-900"
                            >
                                ANNULER
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Map View */}
            {!showForm && (
                <div className="bg-white rounded-3xl p-6 border-2 border-slate-200">
                    <h3 className="text-2xl font-black text-slate-900 uppercase mb-4">Carte des périmètres</h3>
                    <GeofenceMap
                        center={geofences.length > 0 ? [geofences[0].centerLat, geofences[0].centerLng] : [33.8081, 10.9923]}
                        radius={0}
                        geofences={geofences}
                    />
                </div>
            )}

            {/* Geofences List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {geofences.map((gf) => (
                    <motion.div
                        key={gf.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 border-2 border-slate-200"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h4 className="text-xl font-black text-slate-900 uppercase">{gf.nom}</h4>
                                {gf.description && (
                                    <p className="text-sm text-slate-600 mt-1">{gf.description}</p>
                                )}
                            </div>
                            <span
                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${gf.isActive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-500'
                                    }`}
                            >
                                {gf.isActive ? 'Actif' : 'Inactif'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase">Rayon</p>
                                <p className="text-lg font-black text-slate-900">{gf.radiusMeters}m</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase">Coordonnées</p>
                                <p className="text-xs font-mono text-slate-700">
                                    {gf.centerLat.toFixed(4)}, {gf.centerLng.toFixed(4)}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(gf)}
                                className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                            </button>
                            <button
                                onClick={() => handleDelete(gf.id)}
                                className="flex-1 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm uppercase hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {geofences.length === 0 && !showForm && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase">Aucun périmètre configuré</p>
                    <p className="text-slate-400 text-sm mt-2">Créez votre premier périmètre pour activer le pointage GPS</p>
                </div>
            )}
        </div>
    );
}
