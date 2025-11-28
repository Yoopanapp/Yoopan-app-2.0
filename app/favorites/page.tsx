// app/favorites/page.tsx
import { prisma } from '@/lib/prisma';
import { Logo } from '@/app/components/logo'; // Attention majuscule
import Footer from '@/app/components/Footer';
import FavoritesGrid from '@/app/components/FavoritesGrid';
import MagicCart from '@/app/components/MagicCart';
import Link from 'next/link';

// Fonction pour regrouper les produits (même logique que l'accueil)
// (Idéalement on devrait mettre ça dans un fichier utils/helpers.ts pour éviter la duplication, mais on fait simple)
type Offer = { id: number; magasin: string; prix: number; };
type GroupedProduct = { ean: string; nom: string; image: string | null; categorie: string | null; nutriscore: string | null; offers: Offer[]; bestPrice: number; worstPrice: number; savings: number; savingsPercent: number; };

function groupProductsByEan(products: any[]): GroupedProduct[] {
  const map = new Map<string, GroupedProduct>();
  products.forEach((p) => {
    const existing = map.get(p.ean);
    const offer: Offer = { id: p.id, magasin: p.magasin, prix: p.prix };
    if (existing) { existing.offers.push(offer); if (p.prix < existing.bestPrice) existing.bestPrice = p.prix; if (p.prix > existing.worstPrice) existing.worstPrice = p.prix; } 
    else { map.set(p.ean, { ean: p.ean, nom: p.nom, image: p.image, categorie: p.categorie, nutriscore: p.nutriscore, offers: [offer], bestPrice: p.prix, worstPrice: p.prix, savings: 0, savingsPercent: 0 }); }
  });
  return Array.from(map.values()).map(product => { product.offers.sort((a, b) => a.prix - b.prix); product.savings = product.worstPrice - product.bestPrice; product.savingsPercent = product.worstPrice > 0 ? Math.round((product.savings / product.worstPrice) * 100) : 0; return product; });
}

export default async function FavoritesPage() {
  // On récupère tout (pour l'instant c'est ok car local, en prod on ferait une requête filtrée)
  const rawProducts = await prisma.product.findMany();
  const groupedProducts = groupProductsByEan(rawProducts);

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
        <FavoritesGrid allProducts={groupedProducts} />
      </div>

      <Footer />
      <MagicCart />
    </main>
  );
}