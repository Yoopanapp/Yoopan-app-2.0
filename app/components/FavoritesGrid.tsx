// app/components/FavoritesGrid.tsx
'use client';

import { useUser } from '../context/UserContext';
import ProductCard from './ProductCard';
import Link from 'next/link';

export default function FavoritesGrid({ allProducts }: { allProducts: any[] }) {
  const { favorites } = useUser();

  // On filtre les produits pour ne garder que les favoris
  const favoriteProducts = allProducts.filter(p => favorites.includes(p.ean));

  if (favoriteProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 grayscale opacity-30">❤️</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Aucun favori pour l'instant</h2>
        <p className="text-slate-500 mb-8">Cliquez sur le cœur des produits pour les retrouver ici.</p>
        <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all">
          Explorer les rayons
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {favoriteProducts.map((product) => (
        <ProductCard key={product.ean} product={product} />
      ))}
    </div>
  );
}