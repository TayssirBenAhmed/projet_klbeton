import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/auth-options';
import { redirect } from 'next/navigation';

export default async function Home() {
    const session = await getServerSession(authOptions);

    if (session) {
        if (session.user.role === 'ADMIN') {
            redirect('/admin/dashboard');
        } else if (session.user.role === 'CHEF') {
            redirect('/chef/pointage');
        } else {
            redirect('/user/profile');
        }
    }

    redirect('/login-admin');
}
