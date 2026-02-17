'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const DateContext = createContext();

export function DateProvider({ children }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Default to today or URL param 'date'
    const getInitialDate = () => {
        const paramDate = searchParams.get('date');
        if (paramDate) return paramDate;
        return new Date().toISOString().split('T')[0];
    };

    const [date, setDate] = useState(getInitialDate);

    // Sync URL when date changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (params.get('date') !== date) {
            params.set('date', date);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [date, router, pathname, searchParams]);

    // Update state if URL changes externally (e.g. back button)
    useEffect(() => {
        const paramDate = searchParams.get('date');
        if (paramDate && paramDate !== date) {
            setDate(paramDate);
        }
    }, [searchParams]);

    return (
        <DateContext.Provider value={{ date, setDate }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    return useContext(DateContext);
}
