import { PrismaClient } from '@prisma/client';
import { Logo } from '@/app/components/logo';
import Footer from '@/app/components/Footer';
import FavoritesGrid from '@/app/components/FavoritesGrid';
import MagicCart from '@/app/components/MagicCart';
import Link from 'next/link';

// On instancie Prisma directement pour éviter les problèmes de build Vercel
const prisma = new PrismaClient();

// Force le rendu dynamique pour éviter la mise en cache statique qui plante
export const dynamic = 'force-dynamic';

// On garde tes types pour l'UI
type Offer = { id: number; magasin: string; prix: number; };
type GroupedProduct = { ean: string; nom: string; image: string | null; categorie: string | null; nutriscore: string | null; offers: Offer[]; bestPrice: number; worstPrice: number; savings: number; savingsPercent: number; };

export default async function FavoritesPage() {
  
  // 1. On récupère les produits AVEC leurs prix triés
  const rawProducts = await prisma.product.findMany({
    include: {
      prices: {
        orderBy: { valeur: 'asc' }
      }
    }
  });

  // 2. Transformation des données (Mapping)
  // Prisma nous renvoie un format imbriqué (produit -> prices), 
  // mais tes composants UI attendent un format "GroupedProduct" spécifique.
  const groupedProducts: GroupedProduct[] = rawProducts.map((p) => {
    // On extrait les infos de prix depuis la relation 'prices'
    const prices = p.prices || [];
    
    // Calcul des statistiques de prix (meilleur, pire, économie)
    const bestPrice = prices.length > 0 ? prices[0].valeur : 0;
    const worstPrice = prices.length > 0 ? prices[prices.length - 1].valeur : 0;
    const savings = worstPrice - bestPrice;
    const savingsPercent = worstPrice > 0 ? Math.round((savings / worstPrice) * 100) : 0;

    // On transforme les prix Prisma en Offres pour ton UI
    const offers: Offer[] = prices.map(price => ({
      id: price.id,
      magasin: price.magasin,
      prix: price.valeur
    }));

    return {
      ean: p.ean,
      nom: p.nom,
      image: p.image,
      categorie: p.categorie,
      nutriscore: p.nutriscore || 'E',
      offers: offers,
      bestPrice: bestPrice,
      worstPrice: worstPrice,
      savings: savings,
      savingsPercent: savingsPercent
    };
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans relative flex flex-col transition-colors duration-300">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">← Retour</Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-bold text-xl">Mes Favoris</span></div>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 flex-grow w-full">
        {/* On passe les produits transformés à la grille des favoris */}
        <FavoritesGrid allProducts={groupedProducts} />
      </div>

      <Footer />
      <MagicCart />
    </main>
  );
}