'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginEmployeePage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-klbeton-gradient">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md px-6"
            >
                {/* Glassmorphism Card */}
                <div className="glass-card-enhanced rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="p-12">
                        {/* Branding */}
                        <div className="flex flex-col items-center mb-10 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">PORTAIL</h1>
                            <p className="text-slate-600 text-sm font-black mt-3 uppercase tracking-[0.3em]">Espace Employé • KL Beton</p>
                            <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full mt-4"></div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-8 bg-rose-50 border-2 border-rose-200 text-rose-600 p-5 rounded-2xl text-sm font-bold flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-600 uppercase tracking-widest ml-4">Email Professionnel</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-8 py-5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="nom.prenom@klbeton.tn"
                                    required
                                    data-testid="employee-email-input"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-600 uppercase tracking-widest ml-4">Code d'accès</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-8 pr-16 py-5 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                                        placeholder="••••••••"
                                        required
                                        data-testid="employee-password-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-6 h-6" />
                                        ) : (
                                            <Eye className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="employee-login-submit"
                                className="w-full py-6 mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[24px] text-lg font-black uppercase tracking-widest hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "ACCÉDER AU PORTAIL"}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="mt-8 flex items-center justify-center gap-3 text-white/80 font-bold uppercase text-sm tracking-[0.2em]">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Authentification Sécurisée • KL Beton
                </div>
            </motion.div>
        </div>
    );
}
