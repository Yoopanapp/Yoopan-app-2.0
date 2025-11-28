// app/components/MobileMenu.tsx
'use client';

import Link from 'next/link';
import { useCart } from '../context/CartContext';

export default function MobileMenu() {
  const { items } = useCart();
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe md:hidden">
      <div className="flex justify-around items-center h-16">
        
        {/* ACCUEIL */}
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 dark:text-slate-400">
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">Accueil</span>
        </Link>

        {/* FAVORIS */}
        <Link href="/favorites" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 dark:text-slate-400">
          <span className="text-xl">❤️</span>
          <span className="text-[10px] font-medium">Favoris</span>
        </Link>

        {/* PANIER (Avec Badge) */}
        <Link href="/cart" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 dark:text-slate-400 relative">
          <div className="relative">
            <span className="text-xl">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Panier</span>
        </Link>

        {/* PROFIL */}
        <Link href="/profile" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-blue-600 dark:text-slate-400">
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-medium">Profil</span>
        </Link>

      </div>
    </div>
  );
}