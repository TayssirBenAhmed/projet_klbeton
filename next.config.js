/** @type {import('next').NextConfig} */
// Force server restart for Prisma schema update
const nextConfig = {
    env: {
        DATABASE_URL: process.env.DATABASE_URL,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/chef/feuille-presence',
                destination: '/chef/pointage',
                permanent: true,
            },
            {
                source: '/user/dashboard/profile',
                destination: '/user/profile',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
