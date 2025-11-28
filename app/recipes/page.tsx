// app/recipes/page.tsx
import { prisma } from '@/lib/prisma';
import { Logo } from '@/app/components/logo';
import Footer from '@/app/components/Footer';
import MagicCart from '@/app/components/MagicCart';
import RecipeCard from '@/app/components/RecipeCard';
import { RECIPES_DATA } from '@/app/data/recipes';
import Link from 'next/link';

// Fonction helper pour récupérer les produits (nécessaire pour le matching)
async function getProductsForMatching() {
  // On récupère tout, mais juste les champs nécessaires pour être léger
  const products = await prisma.product.findMany({
    select: { ean: true, nom: true, image: true, prix: true, magasin: true, nutriscore: true, categorie: true }
  });
  
  // On doit regrouper par EAN pour avoir le format attendu par le panier
  const grouped = new Map();
  products.forEach((p: any) => {
      const existing = grouped.get(p.ean);
      const offer = { magasin: p.magasin, prix: p.prix };
      if (existing) existing.offers.push(offer);
      else grouped.set(p.ean, { ...p, offers: [offer] });
  });
  return Array.from(grouped.values());
}

export default async function RecipesPage() {
  const allProducts = await getProductsForMatching();

  return (
    <main className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-white font-sans pb-20 transition-colors duration-300">
      
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">← Retour</Link>
          <div className="flex items-center gap-2"><Logo className="w-8 h-8" /><span className="font-bold text-xl">Livre de Recettes</span></div>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Qu'est-ce qu'on mange ce soir ?</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Des idées simples, rapides et économiques.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {RECIPES_DATA.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} allProducts={allProducts} />
            ))}
        </div>
      </div>

      <Footer />
      <MagicCart />
    </main>
  );
}