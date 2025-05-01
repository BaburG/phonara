import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google'; // Example: Add Google Provider
import { PrismaAdapter } from '@auth/prisma-adapter';
// Use the generated Prisma client path
import { PrismaClient, User } from '@/generated/prisma'; 
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Example: Google Provider (Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env)
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          // User not found or doesn't have a password (e.g., signed up via OAuth)
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        // Return user object without password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for session strategy
  },
  callbacks: {
    // Include user id and role in the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Include user id and role in the session object
    async session({ session, token }) {
      if (session.user && token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Create this page
    // error: '/auth/error', // Optional error page
    // newUser: '/auth/new-user' // Optional: Redirect new users
  },
  secret: process.env.NEXTAUTH_SECRET, // Crucial for production
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 