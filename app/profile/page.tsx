// app/profile/page.tsx
'use client';

import { useUser } from '../context/UserContext';
import { Logo } from '../components/logo';
import Link from 'next/link';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle'; // <--- NOUVEL IMPORT

export default function ProfilePage() {
  const { username, updateUsername, xp, level, diet, updateDiet } = useUser();

  // Calcul progression niveau
  const xpForNextLevel = level * 100;
  const currentLevelXp = xp - (level - 1) * 100;
  const progress = (currentLevelXp / 100) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">← Accueil</Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-bold text-xl">Mon Profil</span></div>
          <div className="w-20"></div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 space-y-8">
        
        {/* CARTE GAMIFICATION */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10 flex items-center gap-6">
                <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg border-4 border-blue-200">
                    {level}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">Niveau {level}</h2>
                    <p className="text-blue-100 text-sm mb-3">Expert des économies • {xp} XP au total</p>
                    <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-blue-200 mt-1 text-right">{Math.round(100 - currentLevelXp)} XP pour le niveau {level + 1}</p>
                </div>
            </div>
        </div>

        {/* PARAMÈTRES PERSO */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-white">Mes Préférences</h3>
            
            <div className="space-y-8">
                {/* PSEUDO */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Mon Pseudo</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => updateUsername(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* RÉGIME */}
                <div>
                    <label className="block text-sm font-bold text-slate-500 mb-2">Mon Régime Alimentaire</label>
                    <div className="grid grid-cols-2 gap-3">
                        {['aucun', 'vegetarien', 'vegan', 'sans-gluten'].map((d) => (
                            <button
                                key={d}
                                onClick={() => updateDiet(d as any)}
                                className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all capitalize ${
                                    diet === d 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                                    : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 text-slate-500'
                                }`}
                            >
                                {d === 'aucun' ? '🥗 Aucun' : d === 'vegetarien' ? '🥦 Végétarien' : d === 'vegan' ? '🌱 Vegan' : '🍞 Sans Gluten'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- NOUVEAU : SECTION APPARENCE --- */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 dark:text-white">Apparence</label>
                        <p className="text-xs text-slate-400">Basculer entre mode clair et sombre</p>
                    </div>
                    {/* On intègre le bouton ici */}
                    <div className="scale-125">
                        <ThemeToggle />
                    </div>
                </div>

            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}