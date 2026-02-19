'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Info, Truck, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function LoginAdminPage() {
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
        <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden font-sans bg-klbeton-gradient">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-[520px] px-6"
            >
                {/* Glassmorphism Card */}
                <div className="glass-card-enhanced shadow-2xl rounded-3xl overflow-hidden">
                    <div className="p-10 md:p-12">
                        {/* Branding */}
                        <div className="flex flex-col items-center mb-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-rose-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/30">
                                <Truck className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3 uppercase">KL BETON</h1>
                            <p className="text-slate-600 text-lg font-bold uppercase tracking-[0.15em]">CONSTRUCTION</p>
                            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-rose-500 rounded-full mt-4"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-rose-50 border-2 border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3"
                                    >
                                        <Info className="w-4 h-4" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Email Administrateur</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-14 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white outline-none transition-all shadow-sm"
                                            placeholder="admin@klbeton.tn"
                                            required
                                            data-testid="admin-email-input"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider ml-1">Mot de passe</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-14 pr-14 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white outline-none transition-all shadow-sm"
                                            placeholder="••••••••"
                                            required
                                            data-testid="admin-password-input"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
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
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="admin-login-submit"
                                className={`w-full py-5 rounded-xl text-lg font-bold uppercase tracking-wide transition-all shadow-xl ${loading
                                    ? 'bg-slate-300 text-slate-500 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:-translate-y-0.5'
                                    }`}
                            >
                                {loading ? 'Identification...' : 'Connexion Administrateur'}
                            </button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <span>Accès Sécurisé • KL Beton Administration</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
