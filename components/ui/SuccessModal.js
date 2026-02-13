'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function SuccessModal({ isOpen, onClose, title, message }) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-[400px] rounded-[32px] overflow-hidden shadow-2xl relative z-10"
                >
                    {/* Green Header matching the user's image */}
                    <div className="bg-emerald-500 p-12 flex flex-col items-center justify-center relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-6 text-emerald-100 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center mb-0">
                            <Check className="text-white w-12 h-12 stroke-[4px]" />
                        </div>
                    </div>

                    <div className="p-10 pt-8 text-center bg-white">
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                            {title || 'Succès !'}
                        </h3>
                        <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">
                            {message || 'Votre opération a été effectuée avec succès.'}
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-full text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            Okay
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
