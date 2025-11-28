// app/cart/page.tsx
'use client';

import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { Logo } from '../components/logo';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import ProductImage from '../components/ProductImage';
import MissingItemsTooltip from '../components/MissingItemsTooltip';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart } = useCart();
  const { budget, setBudgetLimit } = useUser();
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // --- ANALYSE ---
  const analysis = useMemo(() => {
    if (items.length === 0) return null;
    const allStores = new Set<string>();
    items.forEach(item => item.offers.forEach(o => allStores.add(o.magasin)));
    const totals: { magasin: string; total: number; missingItems: { nom: string; image: string }[] }[] = [];

    allStores.forEach(store => {
      let storeTotal = 0;
      const missing: { nom: string; image: string }[] = [];
      items.forEach(item => {
        const offer = item.offers.find(o => o.magasin === store);
        if (offer) storeTotal += offer.prix * item.quantity;
        else {
          const avgPrice = item.offers.reduce((acc, curr) => acc + curr.prix, 0) / item.offers.length;
          storeTotal += avgPrice * item.quantity;
          missing.push({ nom: item.nom, image: item.image });
        }
      });
      totals.push({ magasin: store, total: storeTotal, missingItems: missing });
    });

    totals.sort((a, b) => a.total - b.total);
    const cheapest = totals[0];
    
    // Calcul économie vs le plus cher
    const mostExpensive = totals[totals.length - 1];
    const savings = mostExpensive && cheapest ? mostExpensive.total - cheapest.total : 0;

    const alternatives = totals.filter(t => t.missingItems.length < cheapest.missingItems.length);
    alternatives.sort((a, b) => a.total - b.total);
    const bestAlternative = alternatives.length > 0 ? alternatives[0] : null;

    return { totals, cheapest, bestAlternative, savings };
  }, [items]);

  // Initialisation sélection par défaut (Le moins cher)
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

  // --- COMPOSANT JAUGE ---
  const AvailabilityGauge = ({ totalItems, missingItems }: { totalItems: number, missingItems: { nom: string, image: string }[] }) => {
    const foundCount = totalItems - missingItems.length;
    const percentage = Math.round((foundCount / totalItems) * 100);
    const isFull = percentage === 100;
    
    const colorClass = isFull ? 'bg-emerald-500' : (percentage > 50 ? 'bg-orange-400' : 'bg-red-400');
    const textColor = isFull ? 'text-emerald-600 dark:text-emerald-400' : (percentage > 50 ? 'text-orange-500' : 'text-red-500');

    return (
      <div className="mb-6 group/tooltip relative cursor-help">
        <div className="flex justify-between items-center mb-1.5 px-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disponibilité</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner border border-slate-200 dark:border-slate-600">
                <div className={`h-full ${colorClass} transition-all duration-700 ease-out`} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className={`text-sm font-black whitespace-nowrap ${textColor} flex items-center gap-1`}>
                {isFull ? (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 01-1.127-1.127l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        100%
                    </>
                ) : (
                    <span>{foundCount} / {totalItems}</span>
                )}
            </div>
        </div>
        <MissingItemsTooltip items={missingItems} />
      </div>
    );
  };

  // --- SÉCURITÉ CRITIQUE ---
  if (items.length === 0 || !analysis || !analysis.cheapest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex flex-col items-center justify-center text-center px-4">
        <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl">🛒</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Votre panier est vide</h1>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all mt-6">Retourner au magasin</Link>
      </div>
    );
  }

  const { totals, cheapest, bestAlternative, savings } = analysis;
  
  // Le magasin sélectionné (ou le moins cher par défaut)
  const currentStore = selectedStore || cheapest.magasin;
  // Les données du magasin affiché en grand
  const currentStoreData = totals.find(t => t.magasin === currentStore) || cheapest;
  
  // Est-ce que le magasin affiché est le "Champion" (le moins cher) ?
  const isSelectedCheapest = currentStoreData.magasin === cheapest.magasin;
  
  let secondaryStoreData = isSelectedCheapest ? bestAlternative : cheapest;
  if (secondaryStoreData && secondaryStoreData.magasin === currentStoreData.magasin) {
      secondaryStoreData = null;
  }

  const sortedItems = [...items].sort((a, b) => {
      const aIsAvailable = a.offers.some(o => o.magasin === currentStore);
      const bIsAvailable = b.offers.some(o => o.magasin === currentStore);
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      return 0;
  });

  const budgetPercent = Math.min(100, (currentStoreData.total / budget) * 100);
  const isOverBudget = currentStoreData.total > budget;

  // MODE MAGASIN
  if (isShoppingMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans pb-20">
        <div className="sticky top-0 z-50 bg-blue-600 text-white px-6 py-4 shadow-md flex items-center justify-between">
          <button onClick={() => setIsShoppingMode(false)} className="font-bold flex items-center gap-2">← Retour</button>
          <div className="font-bold text-lg">Mode Rayon</div>
          <div className="text-xs bg-blue-700 px-3 py-1 rounded-full">{checkedItems.length}/{items.length} fait</div>
        </div>
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {Object.entries(itemsByAisle).map(([rayon, rayonItems]) => (
            <div key={rayon}>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 sticky top-16 bg-white dark:bg-slate-900 z-10">{rayon}</h3>
              <div className="space-y-3">
                {rayonItems.map((item) => {
                  const isChecked = checkedItems.includes(item.ean);
                  return (
                    <div key={item.ean} onClick={() => toggleCheck(item.ean)} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${isChecked ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-50' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:border-blue-200'}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>{isChecked && <span className="text-white font-bold">✓</span>}</div>
                      <div className="w-12 h-12 flex-shrink-0"><ProductImage src={item.image} alt={item.nom} /></div>
                      <div className="flex-1"><p className={`font-bold text-lg leading-tight ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{item.nom}</p><p className="text-sm text-slate-500">Qté : {item.quantity}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {checkedItems.length === items.length && (
            <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-900 animate-bounce-in">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400">Courses terminées !</h2>
              <button onClick={clearCart} className="mt-4 text-sm text-green-600 dark:text-green-400 underline">Vider le panier</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MODE NORMAL
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">← Continuer</Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-bold text-xl">Mon Panier</span></div>
          
          {/* BOUTON VIDER */}
          <button 
              onClick={() => { if(window.confirm('Vider tout ?')) clearCart(); }} 
              className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full transition-all active:scale-95"
          >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 group-hover:rotate-12 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wide">Vider</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* BUDGET */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all">
                <div className="flex justify-between items-end mb-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Objectif Budget ({currentStore})</p>
                    <div className="text-right flex items-center gap-1">
                        <input type="number" value={budget} onChange={(e) => setBudgetLimit(Number(e.target.value))} className="w-16 text-right font-bold bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500 dark:text-white" />
                        <span className="text-sm font-bold text-slate-500">€</span>
                    </div>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <div className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                </div>
                <p className={`text-xs mt-2 font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>{isOverBudget ? `⚠️ Dépassement de ${(currentStoreData.total - budget).toFixed(2)}€` : `👍 Reste ${(budget - currentStoreData.total).toFixed(2)}€`}</p>
            </div>

            {/* RÉSUMÉ */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Résumé</p><h2 className="text-xl font-black text-slate-800 dark:text-white">{items.reduce((acc, i) => acc + i.quantity, 0)} articles</h2></div>
                <button onClick={() => setIsShoppingMode(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"><span>🛒</span> Je pars au magasin</button>
            </div>

            {/* LISTE ARTICLES */}
            <div className="space-y-4">
                {sortedItems.map((item) => {
                    const offerInSelected = item.offers.find(o => o.magasin === currentStore);
                    const isAvailable = !!offerInSelected;
                    const isExpensive = item.offers[0].prix > 3;

                    return (
                    <div 
                        key={item.ean} 
                        className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4 group transition-all duration-500 ${isAvailable ? 'opacity-100' : 'opacity-60 bg-slate-50 dark:bg-slate-800/80'}`}
                    >
                        <div className={`w-16 h-16 bg-white rounded-xl border border-slate-50 flex-shrink-0 p-1 flex items-center justify-center relative transition-all ${!isAvailable ? 'grayscale contrast-75' : ''}`}>{(item as any).nutriscore && (<span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] flex items-center justify-center font-bold border-2 border-white uppercase">{(item as any).nutriscore}</span>)}<ProductImage src={item.image} alt={item.nom} /></div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-full">{item.nom}</h3>
                            
                            {!isAvailable && (<div className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 w-fit px-2 py-0.5 rounded mt-1 mb-1">⚠️ Indisponible chez {currentStore}</div>)}

                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 mb-2">
                                <div className="flex items-center bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"><button onClick={() => updateQuantity(item.ean, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-l-lg">-</button><span className="w-8 text-center font-bold text-sm">{item.quantity}</span><button onClick={() => updateQuantity(item.ean, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-r-lg">+</button></div><span className="text-xs text-slate-400">unité(s)</span>
                            </div>
                            
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center sm:justify-start">
                                {item.offers.slice(0, 4).map(o => {
                                    const isSelected = o.magasin === currentStore;
                                    return (<span key={o.magasin} className={`text-[10px] px-2 py-1 rounded border whitespace-nowrap transition-all ${isSelected ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold scale-105 shadow-sm ring-1 ring-emerald-200' : 'bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-500 dark:text-slate-300'}`}>{o.magasin}: {o.prix.toFixed(2)}€</span>);
                                })}
                            </div>
                            {isExpensive && (item as any).categorie && (<Link href={`/?q=${(item as any).categorie}`} className="mt-2 text-[10px] text-blue-500 hover:underline flex items-center gap-1 sm:justify-start justify-center">💡 Moins cher dans "{(item as any).categorie}" ?</Link>)}
                        </div>
                        <button onClick={() => removeFromCart(item.ean)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">✕</button>
                    </div>
                )})}
            </div>
          </div>

          {/* DROITE : LE VERDICT */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h2 className="font-bold text-xl text-slate-800 dark:text-white">🏆 Le Verdict</h2>

              {/* CARTE PRINCIPALE (CELLE SÉLECTIONNÉE) */}
              <div 
                // Le onClick ne sert techniquement à rien ici car c'est déjà sélectionné, mais on le laisse pour la forme
                onClick={() => setSelectedStore(currentStoreData.magasin)}
                className={`rounded-3xl p-6 shadow-lg border-2 relative overflow-visible z-20 cursor-pointer transition-all duration-300 ${isSelectedCheapest ? 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900' : 'bg-slate-900 text-white border-slate-700 scale-[1.02]'}`}
              >
                <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm ${isSelectedCheapest ? 'bg-emerald-500' : 'bg-blue-500'}`}>{isSelectedCheapest ? 'MOINS CHER' : 'SÉLECTIONNÉ'}</div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelectedCheapest ? 'text-slate-400' : 'text-slate-400'}`}>{isSelectedCheapest ? 'Option Économique' : 'Votre Choix'}</p>
                <h3 className={`text-2xl font-black mb-2 ${isSelectedCheapest ? 'text-slate-800 dark:text-white' : 'text-white'}`}>{currentStoreData.magasin}</h3>
                
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <span className={`text-3xl font-bold ${isSelectedCheapest ? 'text-emerald-600' : 'text-blue-400'}`}>{currentStoreData.total.toFixed(2)} €</span>
                    
                    {isSelectedCheapest && savings > 0 && (
                      <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 pl-2 pr-3 py-1 rounded-full mb-1 animate-pulse-slow">
                         <span className="text-lg">🤑</span>
                         <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Économie : -{savings.toFixed(2)}€</span>
                      </div>
                    )}

                    {!isSelectedCheapest && (<span className="text-xs font-bold text-red-400 mb-1">+{ (currentStoreData.total - cheapest.total).toFixed(2) }€</span>)}
                </div>
                
                <AvailabilityGauge totalItems={items.length} missingItems={currentStoreData.missingItems} />
                
                {/* BOUTON ÉTAT : SÉLECTIONNÉ (ET NON PLUS "CHOISIR") */}
                <button className={`w-full font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-default ${isSelectedCheapest ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border border-emerald-100 dark:border-emerald-900' : 'bg-blue-800 text-white border border-blue-700'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    Magasin sélectionné
                </button>

                {/* --- TODO: BOUTON DRIVE FUTUR --- 
                    Pour plus tard, insérer ici le bouton pour créer le panier sur le site Drive du magasin.
                    Exemple :
                    <button className="w-full mt-2 text-sm text-slate-400 font-medium hover:text-emerald-600 transition-colors">
                        🛒 Transférer le panier sur {currentStoreData.magasin}
                    </button>
                */}

              </div>

              {/* SECONDAIRE */}
              {secondaryStoreData && (
                <div 
                    onClick={() => setSelectedStore(secondaryStoreData.magasin)}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-blue-100 dark:border-blue-900 relative overflow-visible z-10 opacity-90 hover:opacity-100 transition-opacity cursor-pointer hover:scale-[1.01]"
                >
                    <div className={`absolute top-0 right-0 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm ${secondaryStoreData.magasin === cheapest.magasin ? 'bg-emerald-500' : 'bg-blue-500'}`}>{secondaryStoreData.magasin === cheapest.magasin ? 'LE MOINS CHER' : 'OPTION CONFORT'}</div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Alternative</p>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{secondaryStoreData.magasin}</h3>
                    <div className="flex items-end gap-2 mb-3"><span className="text-2xl font-bold text-blue-600">{secondaryStoreData.total.toFixed(2)} €</span><span className="text-xs text-slate-400 mb-1 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">+{ (secondaryStoreData.total - cheapest.total).toFixed(2) }€</span></div>
                    
                    <AvailabilityGauge totalItems={items.length} missingItems={secondaryStoreData.missingItems} />
                    
                    <button className="w-full bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 font-bold py-3 rounded-xl transition-colors">Choisir {secondaryStoreData.magasin}</button>
                </div>
              )}

              {/* LISTE DES AUTRES */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">Comparer avec les autres</h3>
                <div className="space-y-3">
                  {totals.map((store) => {
                    if (store.magasin === currentStoreData.magasin) return null;
                    if (secondaryStoreData && store.magasin === secondaryStoreData.magasin) return null;
                    
                    const diff = store.total - cheapest.total;
                    const isWinner = store.magasin === cheapest.magasin;
                    
                    const foundCount = items.length - store.missingItems.length;
                    const pct = Math.round((foundCount / items.length) * 100);
                    const gaugeColor = pct === 100 ? 'bg-emerald-500' : (pct > 50 ? 'bg-orange-400' : 'bg-red-400');

                    return (
                      <div key={store.magasin} onClick={() => setSelectedStore(store.magasin)} className={`flex items-start justify-between text-sm p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${isWinner ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                        
                        <div className="flex flex-col flex-1 mr-4">
                            <span className={`font-medium ${isWinner ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{store.magasin} {isWinner && '🏆'}</span>
                            
                            {/* MINI JAUGE */}
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                                <div className={`h-full ${gaugeColor} rounded-full`} style={{width: `${pct}%`}}></div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">{foundCount}/{items.length} dispo</span>
                        </div>

                        <div className="text-right">
                            <span className={`block font-bold ${isWinner ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>{store.total.toFixed(2)}€</span>
                            <span className={`text-[10px] ${isWinner ? 'text-emerald-500' : 'text-red-400'}`}>{diff === 0 ? 'Top' : `+${diff.toFixed(2)}€`}</span>
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