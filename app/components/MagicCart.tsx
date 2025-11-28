'use client';

import { useCart } from '../context/CartContext';
import { useFlyToCart } from '../context/FlyToCartContext';
import { useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function MagicCart() {
  const { items } = useCart();
  // On récupère la ref pour l'animation de vol
  const { cartRef } = useFlyToCart();

  // --- L'ALGORITHME DE COMPARAISON (Ton code original) ---
  const comparison = useMemo(() => {
    if (items.length === 0) return null;

    const allStores = new Set<string>();
    items.forEach(item => item.offers.forEach((o: any) => allStores.add(o.magasin)));
    const totals: { magasin: string; total: number; missing: number }[] = [];

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

      totals.push({ magasin: store, total: storeTotal, missing: missingCount });
    });

    totals.sort((a, b) => a.total - b.total);
    const winner = totals[0];
    const loser = totals[totals.length - 1];
    const savings = loser.total - winner.total;

    return { totals, winner, loser, savings };
  }, [items]);

  const winner = comparison?.winner;
  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

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
          {/* LA BARRE FLOTTANTE */}
          {/* C'est ICI qu'on attache la ref pour l'atterrissage des images */}
          <div 
            ref={cartRef}
            className="pointer-events-auto bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-blue-900/20 dark:shadow-black/80 p-1 pr-2 flex items-center gap-4 max-w-2xl w-full border border-white/10 dark:border-slate-600 backdrop-blur-xl"
          >
            
            {/* Cercle compteur */}
            <div className="bg-blue-600 dark:bg-blue-500 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold shadow-lg">
              <span className="text-lg leading-none">{totalItemsCount}</span>
              <span className="text-[9px] uppercase opacity-80">Art.</span>
            </div>

            {/* Info Principale */}
            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 dark:text-slate-300 text-xs uppercase font-bold tracking-wider">MEILLEUR CHOIX :</span>
                <span className="font-bold text-emerald-400 dark:text-emerald-300 truncate text-sm">{winner?.magasin}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold leading-none">{winner?.total.toFixed(2)} €</span>
                {comparison && comparison.savings > 0 && (
                  <span className="text-xs text-slate-300 mb-0.5">
                    (Éco : <span className="text-emerald-400 font-bold">{comparison.savings.toFixed(2)} €</span>)
                  </span>
                )}
              </div>
            </div>

            {/* Bouton Action */}
            <Link 
                href="/cart"
                className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex-shrink-0"
            >
              Voir
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}