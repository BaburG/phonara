import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import { UserRole } from "@/generated/prisma"; // Import UserRole from your generated types

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: UserRole; // Add your custom property
    } & DefaultSession["user"]; // Keep the default properties
  }

  /**
   * The shape of the user object returned in the OAuth providers' profile callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    role: UserRole; // Add your custom property
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole; // Add your custom property
  }
} 