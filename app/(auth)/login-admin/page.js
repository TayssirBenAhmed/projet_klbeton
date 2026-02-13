'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Info, Truck, ShieldCheck } from 'lucide-react';

export default function LoginAdminPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Identifiants incorrects. Veuillez réessayer.');
            } else {
                const res = await fetch('/api/auth/session');
                const session = await res.json();

                if (session?.user?.role === 'ADMIN') {
                    router.push('/admin/dashboard');
                } else {
                    setError('Accès réservé aux administrateurs.');
                    await signIn('credentials', { redirect: false, action: 'signout' });
                }
                router.refresh();
            }
        } catch (err) {
            setError('Erreur de connexion serveur.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950 font-sans">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-[480px] px-6"
            >
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="p-8 md:p-10">
                        <div className="flex flex-col items-center mb-10 text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
                                <Truck className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">KL BETON</h1>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Espace Administrateur</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium flex items-center gap-2"
                                    >
                                        <Info className="w-4 h-4" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Email Administrateur</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/5 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:bg-slate-900 focus:border-blue-600/50 outline-none transition-all"
                                            placeholder="admin@klbeton.tn"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Mot de passe</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/5 rounded-xl text-sm font-medium text-white placeholder:text-slate-600 focus:bg-slate-900 focus:border-blue-600/50 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all shadow-lg ${loading
                                    ? 'bg-slate-800 text-slate-500 cursor-wait'
                                    : 'bg-blue-600 text-white hover:bg-blue-500'
                                    }`}
                            >
                                {loading ? 'Identification...' : 'Connexion Administrateur'}
                            </button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-white/5 text-center">
                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Accès Sécurisé • KL Beton Administration</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
