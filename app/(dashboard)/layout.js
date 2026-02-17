import { SessionProvider } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DateProvider } from '@/context/DateContext';

export default function DashboardRootLayout({ children }) {
    return (
        <DateProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </DateProvider>
    );
}
