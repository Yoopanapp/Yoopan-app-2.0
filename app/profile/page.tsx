'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Logo } from '../components/logo';
import Link from 'next/link';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { registerUser } from '../actions/register';
import { 
    Wallet, TrendingUp, History, Crown, Settings, 
    LogOut, Loader2, ShieldCheck, Leaf 
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { xp, level, diet, updateDiet, budget, setBudgetLimit, history } = useUser();

  // États pour le formulaire de connexion/inscription
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Calcul progression niveau (Gamification)
  const xpForNextLevel = level * 100;
  const currentLevelXp = xp - (level - 1) * 100;
  const progress = Math.min(100, Math.max(0, (currentLevelXp / 100) * 100));

  // --- FONCTIONS D'AUTHENTIFICATION ---

  // 1. Gérer l'inscription
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoadingAuth(true);
      const formData = new FormData(e.currentTarget);
      const res = await registerUser(formData);
      
      if (res?.error) {
          alert(res.error);
      } else {
          alert("Compte créé avec succès ! Connectez-vous maintenant.");
          setIsLoginMode(true);
      }
      setLoadingAuth(false);
  };

  // 2. Gérer la connexion
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoadingAuth(true);
      const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
      const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;

      const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
      });

      if (res?.error) {
          alert("Email ou mot de passe incorrect.");
          setLoadingAuth(false);
      } else {
          window.location.reload(); 
      }
  };


  // --- ÉTAT 1 : CHARGEMENT ---
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Chargement sécurisé...</p>
      </div>
    );
  }

  // --- ÉTAT 2 : NON CONNECTÉ (LOGIN / INSCRIPTION) ---
  if (!session) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans flex flex-col transition-colors duration-300">
            <nav className="p-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-black text-xl">Mon Profil</span></Link>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600">Retour</Link>
                    <ThemeToggle />
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} />
                    </div>
                    
                    <h1 className="text-3xl font-black mb-2">{isLoginMode ? 'Bon retour !' : 'Créer un compte'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        {isLoginMode ? 'Connectez-vous pour accéder à vos favoris.' : 'Rejoignez YooPan pour faire des économies.'}
                    </p>

                    <button 
                        onClick={() => signIn('google')}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-3 transition-all mb-6 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continuer avec Google
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Ou par email</span></div>
                    </div>

                    <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-4 text-left">
                        {!isLoginMode && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Prénom</label>
                                <input name="name" type="text" required placeholder="Votre prénom" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:ring-0 text-sm font-bold" />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email</label>
                            <input name="email" type="email" required placeholder="exemple@mail.com" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:ring-0 text-sm font-bold" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Mot de passe</label>
                            <input name="password" type="password" required placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:border-blue-500 focus:ring-0 text-sm font-bold" />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loadingAuth}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10"
                        >
                            {loadingAuth && <Loader2 size={16} className="animate-spin" />}
                            {isLoginMode ? 'Se connecter' : "S'inscrire"}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-slate-500">
                        {isLoginMode ? "Pas encore de compte ?" : "Déjà un compte ?"}
                        <button onClick={() => setIsLoginMode(!isLoginMode)} className="ml-2 font-bold text-blue-600 hover:underline">
                            {isLoginMode ? "S'inscrire" : "Se connecter"}
                        </button>
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  // --- ÉTAT 3 : CONNECTÉ (TABLEAU DE BORD GAMIFIÉ) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors text-sm">
            ← Accueil
          </Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-black text-xl tracking-tight">Mon Profil</span></div>
          <div className="w-20 flex justify-end"><ThemeToggle /></div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 space-y-8 animate-fade-in-up">
        
        {/* 1. CARTE GAMIFICATION (HEADER) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20">
            {/* Effets de fond */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
                <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-400/30 overflow-hidden">
                        {session.user?.image ? (
                            <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            // Initiale si pas d'image
                            <div className="text-4xl font-black text-blue-600">{session.user?.name?.charAt(0).toUpperCase() || "U"}</div>
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 p-2 rounded-full shadow-lg">
                        <Crown size={20} fill="currentColor" />
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                    <h2 className="text-3xl font-black mb-1">{session.user?.name || "Utilisateur"}</h2>
                    <p className="text-blue-100 text-sm mb-4 font-medium flex items-center justify-center sm:justify-start gap-2">
                        <span className="bg-blue-500/30 px-2 py-0.5 rounded text-xs">{xp} XP Totaux</span>
                        <span>•</span>
                        <span>{session.user?.email}</span>
                    </p>
                    
                    {/* Barre de progression */}
                    <div className="relative h-4 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                        <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-blue-200 mt-1 text-right">Niveau {level+1} dans {Math.round(100 - currentLevelXp)} XP</p>
                </div>
            </div>
        </div>

        {/* 2. STATISTIQUES (GRID NETTOYÉE) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-3"><Wallet size={20} /></div>
                {/* ZERO par défaut pour le clean up */}
                <div className="text-2xl font-black text-slate-800 dark:text-white">0€</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Économisés</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-3"><TrendingUp size={20} /></div>
                {/* ZERO par défaut pour le clean up */}
                <div className="text-2xl font-black text-slate-800 dark:text-white">0</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Scans</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-3"><History size={20} /></div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{history.length}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vus</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mb-3"><Crown size={20} /></div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{level}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rang</div>
            </div>
        </div>

        {/* 3. PARAMÈTRES AVANCÉS */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center">
                <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings size={20} className="text-slate-400" /> Paramètres
                </h3>
                <button 
                    onClick={() => signOut({ callbackUrl: '/' })} 
                    className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <LogOut size={14} /> Déconnexion
                </button>
            </div>
            
            <div className="p-8 space-y-8">
                {/* BUDGET */}
                <div>
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Budget Mensuel Cible</label>
                        <span className="text-2xl font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">{budget} €</span>
                    </div>
                    <input 
                        type="range" 
                        min="50" max="1000" step="10" 
                        value={budget} 
                        onChange={(e) => setBudgetLimit(Number(e.target.value))}
                        className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-bold">
                        <span>50€</span>
                        <span>1000€</span>
                    </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* RÉGIME */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Leaf size={16} /> Préférences Alimentaires
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'aucun', label: 'Aucun', icon: '🥩' },
                            { id: 'vegetarien', label: 'Végétarien', icon: '🥦' },
                            { id: 'vegan', label: 'Vegan', icon: '🌱' },
                            { id: 'sans-gluten', label: 'Sans Gluten', icon: '🍞' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => updateDiet(opt.id as any)}
                                className={`p-4 rounded-2xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                    diet === opt.id 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md transform scale-105' 
                                    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-blue-200 dark:hover:border-slate-600'
                                }`}
                            >
                                <span className="text-2xl">{opt.icon}</span>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}