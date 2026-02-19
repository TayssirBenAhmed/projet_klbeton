// Rebuild-Tag: 2026-02-07T13:55:00Z - STABLE_RELATIVE
import NextAuth from 'next-auth';
import { authOptions } from './auth-options';

export const dynamic = 'force-dynamic';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
