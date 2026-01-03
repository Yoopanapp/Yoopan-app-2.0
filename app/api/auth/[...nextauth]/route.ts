import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Obligatoire pour utiliser Credentials + Google ensemble
  },
  providers: [
    // 1. Connexion Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
    // 2. Connexion Email / Mot de passe
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        // On cherche l'utilisateur
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Si pas d'utilisateur ou pas de mot de passe (ex: compte Google)
        if (!user || !user.password) {
          throw new Error("Utilisateur introuvable ou mot de passe incorrect");
        }

        // On vérifie le mot de passe
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Mot de passe incorrect");
        }

        return user;
      }
    })
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        // @ts-ignore
        session.user.id = token.sub; // On récupère l'ID via le token JWT
      }
      return session;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };