'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginEmployeePage() {
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
                setError('Identifiants incorrects');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/auth/session');
            const session = await res.json();

            if (session?.user?.role !== 'EMPLOYE' && session?.user?.role !== 'CHEF') {
                setError("Accès refusé. Veuillez utiliser le portail admin.");
                await signIn('credentials', { redirect: false, action: 'signout' });
                setLoading(false);
                return;
            }

            if (session?.user?.role === 'CHEF') {
                router.push('/chef/pointage');
            } else {
                router.push('/user/profile');
            }
            router.refresh();

        } catch (err) {
            setError('Erreur de connexion serveur');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-950">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md px-6"
            >
                <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-slate-900 border-b-[20px]">
                    <div className="p-12">
                        <div className="flex flex-col items-center mb-10 text-center">
                            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">PORTAIL</h1>
                            <p className="text-slate-400 text-[10px] font-black mt-3 uppercase tracking-[0.4em]">Espace Employé • KL Beton</p>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-8 bg-rose-50 border-2 border-rose-100 text-rose-600 p-5 rounded-2xl text-xs font-bold flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Professionnel</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 border-3 border-transparent rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                                    placeholder="nom.prenom@klbeton.tn"
                                    required
                                    data-testid="employee-email-input"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Code d'accès</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-8 py-5 bg-slate-50 border-3 border-transparent rounded-2xl font-bold text-slate-900 outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-inner"
                                    placeholder="••••••••"
                                    required
                                    data-testid="employee-password-input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="employee-login-submit"
                                className="w-full py-6 mt-4 bg-slate-900 text-white rounded-[24px] text-lg font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "ACCÉDER AU PORTAIL"}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-8 flex items-center justify-center gap-3 text-slate-600 font-bold uppercase text-[9px] tracking-[0.2em]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Authentification Sécurisée • KL Beton
                </div>
            </motion.div>
        </div>
    );
}
