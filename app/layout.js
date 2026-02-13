import './globals.css';
import Providers from './providers';

export const metadata = {
    title: 'KL Beton - Système de Pointage',
    description: 'Gestion des pointages et des employés',
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
