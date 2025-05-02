import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // Import the separated authOptions
import CredentialsProvider from 'next-auth/providers/credentials';
//import GoogleProvider from 'next-auth/providers/google'; // Example: Add Google Provider
//import { PrismaAdapter } from '@auth/prisma-adapter';
// Use the generated Prisma client path
import { PrismaClient, User } from '@/generated/prisma'; 
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// export const authOptions: NextAuthOptions = { ... }; // Remove the entire inline authOptions object definition

const handler = NextAuth(authOptions); // Use the imported authOptions

export { handler as GET, handler as POST }; 