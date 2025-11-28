'use client';

import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';
import { useUserLocation } from '../context/UserLocationContext'; // IMPORT
import { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagicCart() {
  const { items } = useCart();
  const { cartRef } = useFlyToCart();
  // ON RECUPERE LA FONCTION MAGIQUE DU CONTEXTE
  const { calculateDistance } = useUserLocation(); 

  const comparison = useMemo(() => {
    if (items.length === 0) return null;

    const allStores = new Set<string>();
    const storeCoords = new Map<string, { lat: number, lng: number }>();

    items.forEach(item => {
        item.offers.forEach((o: any) => {
            allStores.add(o.magasin);
            if(o.lat && o.lng) storeCoords.set(o.magasin, { lat: o.lat, lng: o.lng });
        });
    });

    const totals: { magasin: string; total: number; missing: number; distance: string | null }[] = [];

    allStores.forEach(store => {
      let storeTotal = 0;
      let missingCount = 0;

      items.forEach(item => {
        const offer = item.offers.find((o: any) => o.magasin === store);
        if (offer) {
          storeTotal += offer.prix * item.quantity;
        } else {
          const avgPrice = item.offers.reduce((acc: number, curr: any) => acc + curr.prix, 0) / item.offers.length;
          storeTotal += avgPrice * item.quantity;
          missingCount++;
        }
      });

      const coords = storeCoords.get(store);
      // ON UTILISE LA FONCTION DU CONTEXTE
      const dist = coords ? calculateDistance(coords.lat, coords.lng) : null;

      totals.push({ magasin: store, total: storeTotal, missing: missingCount, distance: dist });
    });

    totals.sort((a, b) => a.total - b.total);
    return { totals, winner: totals[0], loser: totals[totals.length - 1], savings: totals[totals.length - 1].total - totals[0].total };
  }, [items, calculateDistance]); // On ajoute calculateDistance aux dépendances

  const winner = comparison?.winner;
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const formatStoreName = (name: string) => {
      if(name.includes('Leclerc')) return 'Leclerc';
      if(name.includes('Intermarché')) return 'Intermarché';
      if(name.includes('Carrefour')) return 'Carrefour';
      if(name.includes('Auchan')) return 'Auchan';
      if(name.includes('Monoprix')) return 'Monoprix';
      if(name.includes('Super U')) return 'Super U';
      return name.split(' ')[0];
  };

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 md:bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div ref={cartRef} className="pointer-events-auto bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-blue-900/20 dark:shadow-black/80 p-1 pr-2 flex items-center gap-4 max-w-2xl w-full border border-white/10 dark:border-slate-600 backdrop-blur-xl">
            <div className="bg-blue-600 dark:bg-blue-500 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold shadow-lg">
              <span className="text-lg leading-none">{totalItemsCount}</span>
              <span className="text-[9px] uppercase opacity-80">Art.</span>
            </div>
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 dark:text-slate-300 text-xs uppercase font-bold tracking-wider hidden sm:inline">MEILLEUR CHOIX :</span>
                <span className="font-bold text-emerald-400 dark:text-emerald-300 truncate text-sm">
                    {winner ? formatStoreName(winner.magasin) : 'Calcul...'}
                </span>
                {winner?.distance && (<span className="text-[10px] text-slate-400 font-normal">({winner.distance})</span>)}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold leading-none">{winner?.total.toFixed(2)} €</span>
                {comparison && comparison.savings > 0 && (<span className="text-xs text-slate-300 mb-0.5">(Éco : <span className="text-emerald-400 font-bold">{comparison.savings.toFixed(2)} €</span>)</span>)}
              </div>
            </div>
            <Link href="/cart" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex-shrink-0">Voir</Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}