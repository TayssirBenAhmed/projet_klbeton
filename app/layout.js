import './globals.css';
import Providers from './providers';

export const metadata = {
    title: 'KL Beton - Système de Pointage',
    description: 'Gestion des pointages et des employés',
};

export default function RootLayout({ children }) {
    // Default to French LTR, will be updated dynamically for Arabic (RTL)
    return (
        <html lang="fr" dir="ltr" className="scroll-smooth">
            <body className="min-h-screen bg-klbeton-gradient antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
