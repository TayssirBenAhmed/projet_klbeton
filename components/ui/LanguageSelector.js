'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSelector() {
    const { language, changeLanguage, languages, isRTL } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const currentLang = languages.find(l => l.code === language);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 bg-white/90 hover:bg-white shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300"
            >
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-slate-700">{currentLang?.flag}</span>
                <span className="text-slate-900 hidden sm:inline">{currentLang?.name}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50`}
                        >
                            <div className="p-2">
                                <p className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Select Language
                                </p>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            changeLanguage(lang.code);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                                            language === lang.code
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{lang.flag}</span>
                                            <span className="font-bold text-sm">{lang.name}</span>
                                        </div>
                                        {language === lang.code && (
                                            <Check className="w-4 h-4 text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
