'use client';

import { SessionProvider } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function DashboardRootLayout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
