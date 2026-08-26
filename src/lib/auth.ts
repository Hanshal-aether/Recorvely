import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

// Dashboard auth is deliberately separate from API key auth (apiKey.ts).
// A human gets a session by logging in here; a merchant's backend
// authenticates to /api/ingest with an API key. Never the same mechanism.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          merchantId: user.merchantId,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.merchantId = (user as any).merchantId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).merchantId = token.merchantId;
      (session.user as any).role = token.role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
