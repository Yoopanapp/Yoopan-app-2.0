// app/context/UserContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserContextType = {
  favorites: string[];
  history: string[];
  budget: number;
  username: string;
  xp: number;
  level: number;
  diet: 'aucun' | 'vegetarien' | 'vegan' | 'sans-gluten';
  
  toggleFavorite: (ean: string) => void;
  addToHistory: (ean: string) => void;
  setBudgetLimit: (amount: number) => void;
  isFavorite: (ean: string) => boolean;
  updateUsername: (name: string) => void;
  updateDiet: (diet: 'aucun' | 'vegetarien' | 'vegan' | 'sans-gluten') => void;
  addXp: (amount: number) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(100);
  
  // Nouvelles données Utilisateur
  const [username, setUsername] = useState("Utilisateur");
  const [xp, setXp] = useState(0);
  const [diet, setDiet] = useState<'aucun' | 'vegetarien' | 'vegan' | 'sans-gluten'>('aucun');
  const [isInitialized, setIsInitialized] = useState(false);

  // Chargement
  useEffect(() => {
    const savedFavs = localStorage.getItem('yoopan_favs');
    const savedHist = localStorage.getItem('yoopan_hist');
    const savedBudget = localStorage.getItem('yoopan_budget');
    const savedUser = localStorage.getItem('yoopan_user_data');
    
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    if (savedHist) setHistory(JSON.parse(savedHist));
    if (savedBudget) setBudget(parseFloat(savedBudget));
    if (savedUser) {
        const data = JSON.parse(savedUser);
        setUsername(data.username || "Utilisateur");
        setXp(data.xp || 0);
        setDiet(data.diet || 'aucun');
    }
    setIsInitialized(true);
  }, []);

  // Sauvegarde
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('yoopan_favs', JSON.stringify(favorites));
      localStorage.setItem('yoopan_hist', JSON.stringify(history));
      localStorage.setItem('yoopan_budget', budget.toString());
      localStorage.setItem('yoopan_user_data', JSON.stringify({ username, xp, diet }));
    }
  }, [favorites, history, budget, username, xp, diet, isInitialized]);

  const toggleFavorite = (ean: string) => {
    setFavorites(prev => prev.includes(ean) ? prev.filter(id => id !== ean) : [...prev, ean]);
  };

  const addToHistory = (ean: string) => {
    if (!history.includes(ean)) setHistory(prev => [ean, ...prev].slice(0, 50));
  };

  const setBudgetLimit = (amount: number) => setBudget(amount);
  const isFavorite = (ean: string) => favorites.includes(ean);
  
  const updateUsername = (name: string) => setUsername(name);
  const updateDiet = (d: any) => setDiet(d);
  
  const addXp = (amount: number) => {
    setXp(prev => prev + amount);
  };

  // Calcul du niveau (1 niveau tous les 100 XP)
  const level = Math.floor(xp / 100) + 1;

  return (
    <UserContext.Provider value={{ 
        favorites, history, budget, username, xp, level, diet,
        toggleFavorite, addToHistory, setBudgetLimit, isFavorite, updateUsername, updateDiet, addXp 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}