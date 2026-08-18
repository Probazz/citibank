import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {                                    
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { account: true },
        });
        if (!user) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
        
        if (user.account?.status === 'SUSPENDED') {
          throw new Error('ACCOUNT_SUSPENDED');
        }

        try {
          const { sendLoginNotification } = await import('@/lib/email');
          await sendLoginNotification(user.email, user.firstName);
        } catch (error) {
          console.error('Login notification email failed:', error);
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          accountStatus: user.account?.status || 'ACTIVE',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.accountStatus = (user as any).accountStatus;
      }
      return token;
    },
        async session({ session, token }) {
      if (token && session.user) {
        const userPayload = session.user as any;
        userPayload.id = token.id as string;
        userPayload.role = token.role as string;
        userPayload.firstName = token.firstName as string;
        userPayload.lastName = token.lastName as string;
        userPayload.accountStatus = token.accountStatus as string;
      }
      return session;
    },

  },
  pages: { signIn: '/auth/login', error: '/auth/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
