import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// NextAuth App Router handlers
export { handler as GET, handler as POST };
