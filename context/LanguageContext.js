'use client';

import { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import translations from '@/lib/i18n/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    return (
        <Suspense fallback={null}>
            <LanguageProviderContent>{children}</LanguageProviderContent>
        </Suspense>
    );
}

function LanguageProviderContent({ children }) {
    const pathname = usePathname();
    
    // Initialize language from localStorage or default to French
    const [language, setLanguage] = useState('fr');
    const [isRTL, setIsRTL] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedLang = localStorage.getItem('klbeton-language');
        if (savedLang && ['ar', 'fr', 'en'].includes(savedLang)) {
            setLanguage(savedLang);
            setIsRTL(savedLang === 'ar');
            // Update HTML dir attribute
            document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = savedLang;
        }
    }, []);

    const changeLanguage = (lang) => {
        if (['ar', 'fr', 'en'].includes(lang)) {
            setLanguage(lang);
            setIsRTL(lang === 'ar');
            localStorage.setItem('klbeton-language', lang);
            // Update HTML dir attribute for RTL support
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        }
    };

    // Translation function
    const t = (key) => {
        if (!mounted) return translations['fr'][key] || key;
        return translations[language][key] || translations['fr'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ 
            language, 
            changeLanguage, 
            t, 
            isRTL,
            languages: [
                { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'en', name: 'English', flag: '🇬🇧' }
            ]
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
