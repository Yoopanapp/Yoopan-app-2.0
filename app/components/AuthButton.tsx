'use client';

import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, LogIn, Loader2 } from "lucide-react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  // 1. Chargement (pour éviter que le bouton saute)
  if (status === "loading") {
    return (
      <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-xs font-bold text-slate-400">...</span>
      </div>
    );
  }

  // 2. Connecté : On affiche l'Avatar + Mon Profil
  if (session) {
    return (
      <Link 
        href="/profile" 
        className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-blue-600 hover:scale-105 px-4 py-2 rounded-full transition-all shadow-lg shadow-blue-900/5"
      >
        {session.user?.image ? (
            <img src={session.user.image} alt="Avatar" className="w-5 h-5 rounded-full border border-white/20" />
        ) : (
            <User size={16} />
        )}
        Mon Profil
      </Link>
    );
  }

  // 3. Pas connecté : Bouton "Se connecter"
  return (
    <Link 
      href="/profile" 
      className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 px-4 py-2 rounded-full transition-all shadow-lg shadow-blue-600/20"
    >
      <LogIn size={16} />
      Se connecter
    </Link>
  );
}