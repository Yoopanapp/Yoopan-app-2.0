'use client';

import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useUserLocation } from '../context/UserLocationContext';
import { Logo } from '../components/logo';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import ProductImage from '../components/ProductImage';
import MissingItemsTooltip from '../components/MissingItemsTooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, ArrowLeft, ShoppingBag, Wallet, MapPin, Store, Trophy, AlertTriangle } from 'lucide-react';

// Helper pour nettoyer le nom (reste local car c'est juste de l'affichage)
const formatStoreName = (name: string) => {
    return name.replace(' Vigneux-sur-Seine', '').replace(' Vigneux', '').replace(' Montgeron', '').replace(' Juvisy', '');
};

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { budget, setBudgetLimit, xp, level } = useUser();
  const { calculateDistance } = useUserLocation();
  
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // --- ANALYSE INTELLIGENTE ---
  const analysis = useMemo(() => {
    if (items.length === 0) return null;

    const allStores = new Set<string>();
    const storeCoords = new Map<string, { lat: number, lng: number }>();

    items.forEach(item => {
        item.offers.forEach((o: any) => {
            allStores.add(o.magasin);
            if(o.lat && o.lng) {
                storeCoords.set(o.magasin, { lat: o.lat, lng: o.lng });
            }
        });
    });

    const totals: { 
        magasin: string; 
        total: number; 
        missingItems: { nom: string; image: string }[];
        distance: string | null;
    }[] = [];

    allStores.forEach(store => {
      let storeTotal = 0;
      const missing: { nom: string; image: string }[] = [];
      
      items.forEach(item => {
        const offer = item.offers.find((o: any) => o.magasin === store);
        if (offer) {
            storeTotal += offer.prix * item.quantity;
        } else {
            // Prix moyen pénalité si manquant
            const avgPrice = item.offers.reduce((acc: number, curr: any) => acc + curr.prix, 0) / item.offers.length;
            storeTotal += avgPrice * item.quantity;
            missing.push({ nom: item.nom, image: item.image });
        }
      });

      const coords = storeCoords.get(store);
      const dist = coords ? calculateDistance(coords.lat, coords.lng) : null;

      totals.push({ magasin: store, total: storeTotal, missingItems: missing, distance: dist });
    });

    totals.sort((a, b) => a.total - b.total);
    const cheapest = totals[0];
    const mostExpensive = totals[totals.length - 1];
    const savings = mostExpensive && cheapest ? mostExpensive.total - cheapest.total : 0;

    const alternatives = totals.filter(t => t.missingItems.length < cheapest.missingItems.length);
    alternatives.sort((a, b) => a.total - b.total);
    const bestAlternative = alternatives.length > 0 ? alternatives[0] : null;

    return { totals, cheapest, bestAlternative, savings };
  }, [items, calculateDistance]);

  // Initialisation sélection par défaut
  useEffect(() => {
    if (analysis && analysis.cheapest && !selectedStore) {
      setSelectedStore(analysis.cheapest.magasin);
    }
  }, [analysis, selectedStore]);

  // Logique Tri Rayon
  const itemsByAisle = useMemo(() => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const rayon = item.categorie || 'Divers';
      if (!groups[rayon]) groups[rayon] = [];
      groups[rayon].push(item);
    });
    return groups;
  }, [items]);

  const toggleCheck = (ean: string) => {
    if (checkedItems.includes(ean)) setCheckedItems(prev => prev.filter(id => id !== ean));
    else setCheckedItems(prev => [...prev, ean]);
  };

  const AvailabilityGauge = ({ totalItems, missingItems }: { totalItems: number, missingItems: { nom: string, image: string }[] }) => {
    const foundCount = totalItems - missingItems.length;
    const percentage = Math.round((foundCount / totalItems) * 100);
    const isFull = percentage === 100;
    
    const colorClass = isFull ? 'bg-emerald-500' : (percentage > 50 ? 'bg-orange-400' : 'bg-red-400');
    const textColor = isFull ? 'text-emerald-600 dark:text-emerald-400' : (percentage > 50 ? 'text-orange-500' : 'text-red-500');

    return (
      <div className="mb-4 group/tooltip relative">
        <div className="flex justify-between items-center mb-1.5 px-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disponibilité</span>
            <span className={`text-xs font-black ${textColor}`}>{percentage}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${colorClass}`} 
            />
        </div>
        <div className="mt-1">
            <MissingItemsTooltip items={missingItems} />
        </div>
      </div>
    );
  };

  // --- RENDU : PANIER VIDE ---
  if (items.length === 0 || !analysis || !analysis.cheapest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Fond animé subtil */}
        <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-200 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-200 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="z-10 bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800"
        >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 mx-auto text-5xl shadow-inner">🛒</div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Votre panier est vide</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                Prêt à faire des économies ? Commencez par ajouter quelques produits ou explorez nos recettes.
            </p>
            <div className="flex flex-col gap-3">
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-2">
                    <ShoppingBag size={20} />
                    Retourner au magasin
                </Link>
                <Link href="/recipes" className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                    🍽️ Voir les idées recettes
                </Link>
            </div>
        </motion.div>
      </div>
    );
  }

  const { totals, cheapest, bestAlternative, savings } = analysis;
  const currentStore = selectedStore || cheapest.magasin;
  const currentStoreData = totals.find(t => t.magasin === currentStore) || cheapest;
  const isSelectedCheapest = currentStoreData.magasin === cheapest.magasin;
  
  let secondaryStoreData = isSelectedCheapest ? bestAlternative : cheapest;
  if (secondaryStoreData && secondaryStoreData.magasin === currentStoreData.magasin) {
      secondaryStoreData = null;
  }

  const sortedItems = [...items].sort((a, b) => {
      const aIsAvailable = a.offers.some((o: any) => o.magasin === currentStore);
      const bIsAvailable = b.offers.some((o: any) => o.magasin === currentStore);
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      return 0;
  });

  const budgetPercent = Math.min(100, (currentStoreData.total / budget) * 100);
  const isOverBudget = currentStoreData.total > budget;

  // --- RENDU : MODE SHOPPING (FOCUS) ---
  if (isShoppingMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-20">
        <div className="sticky top-0 z-50 bg-blue-600 text-white px-6 py-4 shadow-lg flex items-center justify-between">
          <button onClick={() => setIsShoppingMode(false)} className="font-bold flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <ArrowLeft size={18} /> Retour
          </button>
          <div className="text-center">
              <div className="font-black text-lg tracking-tight">Mode Rayon</div>
              <div className="text-[10px] font-medium opacity-80 uppercase tracking-widest">{formatStoreName(currentStore)}</div>
          </div>
          <div className="text-xs bg-white text-blue-700 font-bold px-3 py-1.5 rounded-full shadow-sm">
            {checkedItems.length}/{items.length}
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          <AnimatePresence>
          {Object.entries(itemsByAisle).map(([rayon, rayonItems], index) => (
            <motion.div 
                key={rayon}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {rayon}
              </h3>
              <div className="space-y-3">
                {rayonItems.map((item) => {
                  const isChecked = checkedItems.includes(item.ean);
                  return (
                    <motion.div 
                        layout
                        key={item.ean} 
                        onClick={() => toggleCheck(item.ean)} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98] ${isChecked ? 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-50 grayscale' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200'}`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isChecked ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`}>
                          {isChecked && <Check size={16} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="w-14 h-14 flex-shrink-0 p-1 bg-white rounded-lg border border-slate-100"><ProductImage src={item.image} alt={item.nom} /></div>
                      <div className="flex-1">
                          <p className={`font-bold text-lg leading-tight ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{item.nom}</p>
                          <p className="text-sm text-slate-500 font-medium">Quantité : {item.quantity}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {checkedItems.length === items.length && (
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-[2rem] border border-green-200 dark:border-green-800"
            >
              <div className="text-5xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-2xl font-black text-green-800 dark:text-green-300 mb-2">Courses terminées !</h2>
              <p className="text-green-700 dark:text-green-400 mb-6 font-medium">Vous avez assuré. +100 XP ajoutés à votre profil.</p>
              <button onClick={() => { if(window.confirm('Bravo ! Vider le panier ?')) clearCart(); }} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-transform active:scale-95">
                  Terminer et Vider
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDU : MODE COMPARATEUR (PAR DÉFAUT) ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white font-sans pb-32 transition-colors duration-300">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-slate-500 hover:text-slate-900 dark:text-slate-400 transition-colors">
            <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></div>
            <span className="font-bold text-sm hidden sm:inline">Continuer mes achats</span>
          </Link>
          <div className="flex items-center gap-2">
             <Logo className="w-8 h-8" />
             <span className="font-black text-xl tracking-tight">Mon Panier</span>
          </div>
          <button 
            onClick={() => { if(window.confirm('Vider tout le panier ?')) clearCart(); }} 
            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Vider le panier"
          >
              <Trash2 size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE : LISTE (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* JAUGE BUDGET */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Wallet size={18} /></div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Budget Cible</p>
                            <div className="flex items-baseline gap-1">
                                <input 
                                    type="number" 
                                    value={budget} 
                                    onChange={(e) => setBudgetLimit(Number(e.target.value))} 
                                    className="w-16 font-black text-xl bg-transparent border-b-2 border-slate-200 focus:border-blue-500 focus:outline-none dark:text-white transition-colors p-0" 
                                />
                                <span className="text-sm font-bold text-slate-400">€</span>
                            </div>
                        </div>
                    </div>
                    <div className={`text-right ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                        <p className="text-xs font-bold uppercase tracking-wider">{isOverBudget ? 'Dépassement' : 'Reste'}</p>
                        <p className="text-xl font-black">{Math.abs(budget - currentStoreData.total).toFixed(2)}€</p>
                    </div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div className={`h-full transition-all duration-700 ease-out rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                </div>
            </div>

            {/* HEADER LISTE */}
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    Articles <span className="text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                </h2>
                <span className="text-xs font-bold text-slate-400">Trié par disponibilité</span>
            </div>

            {/* LISTE DES ARTICLES */}
            <div className="space-y-3">
                <AnimatePresence>
                {sortedItems.map((item, i) => {
                    const offerInSelected = item.offers.find((o: any) => o.magasin === currentStore);
                    const isAvailable = !!offerInSelected;
                    return (
                    <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.05 }}
                        key={item.ean} 
                        className={`p-4 rounded-2xl flex items-center gap-4 group transition-all ${isAvailable ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900' : 'bg-slate-50 dark:bg-slate-900/50 border border-transparent opacity-70'}`}
                    >
                        <div className="w-16 h-16 bg-white p-2 rounded-xl border border-slate-50 flex-shrink-0 relative">
                            {!isAvailable && <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10"><AlertTriangle size={20} className="text-orange-500" /></div>}
                            <ProductImage src={item.image} alt={item.nom} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 dark:text-white truncate pr-4">{item.nom}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {isAvailable ? (
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{offerInSelected.prix.toFixed(2)}€ <span className="text-[10px] text-slate-400 font-normal">/unité</span></span>
                                ) : (
                                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">Indisponible ici</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 h-9">
                                <button onClick={() => updateQuantity(item.ean, -1)} className="w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-l-lg transition-colors">-</button>
                                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.ean, 1)} className="w-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-r-lg transition-colors">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.ean)} className="text-[10px] font-bold text-red-400 hover:text-red-600 hover:underline">Retirer</button>
                        </div>
                    </motion.div>
                )})}
                </AnimatePresence>
            </div>
          </div>

          {/* COLONNE DROITE : VERDICT & ACTION (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-6">
                
                {/* CARTE WINNER */}
                <div className={`rounded-[2.5rem] p-8 shadow-xl border-4 relative overflow-hidden transition-all duration-500 ${isSelectedCheapest ? 'bg-slate-900 text-white border-slate-800' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-white dark:border-slate-700'}`}>
                    {isSelectedCheapest && (
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white font-black text-xs px-4 py-2 rounded-bl-2xl shadow-lg">
                            MEILLEURE OFFRE
                        </div>
                    )}
                    
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">{isSelectedCheapest ? 'Le grand gagnant' : 'Votre sélection'}</p>
                    <h2 className="text-3xl font-black leading-none mb-1">{formatStoreName(currentStoreData.magasin)}</h2>
                    {currentStoreData.distance && <div className="flex items-center gap-1 opacity-70 text-sm font-bold mb-6"><MapPin size={14} /> {currentStoreData.distance}</div>}

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-black tracking-tighter">{currentStoreData.total.toFixed(2)}€</span>
                    </div>
                    
                    {isSelectedCheapest && savings > 0 ? (
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/30 mb-6">
                            <Trophy size={14} /> Économie : {savings.toFixed(2)}€
                        </div>
                    ) : (
                        <div className="text-sm font-bold text-red-400 mb-6">
                            +{ (currentStoreData.total - cheapest.total).toFixed(2) }€ par rapport au moins cher
                        </div>
                    )}

                    <AvailabilityGauge totalItems={items.length} missingItems={currentStoreData.missingItems} />

                    <button 
                        onClick={() => setIsShoppingMode(true)} 
                        className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isSelectedCheapest ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:to-blue-400 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'}`}
                    >
                        <span>🚀</span> Lancer les courses
                    </button>
                </div>

                {/* COMPARATEUR COMPACT */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-4">Comparatif rapide</h3>
                    <div className="space-y-3">
                        {totals.slice(0, 4).map(store => {
                            if (store.magasin === currentStore) return null;
                            const diff = store.total - cheapest.total;
                            return (
                                <div 
                                    key={store.magasin} 
                                    onClick={() => setSelectedStore(store.magasin)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all"><Store size={16} /></div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">{formatStoreName(store.magasin)}</p>
                                            {store.distance && <p className="text-[10px] text-slate-400">{store.distance}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-800 dark:text-white">{store.total.toFixed(2)}€</p>
                                        <p className={`text-[10px] font-bold ${diff === 0 ? 'text-emerald-500' : 'text-red-400'}`}>{diff === 0 ? 'Best' : `+${diff.toFixed(2)}€`}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}