import { SessionProvider } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { DateProvider } from '@/context/DateContext';
import { NotificationProvider } from '@/context/NotificationContext';

export default function DashboardRootLayout({ children }) {
    return (
        <DateProvider>
            <NotificationProvider>
                <DashboardLayout>{children}</DashboardLayout>
            </NotificationProvider>
        </DateProvider>
    );
}
