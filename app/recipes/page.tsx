import { PrismaClient } from '@prisma/client';
import { Logo } from '@/app/components/logo';
import Footer from '@/app/components/Footer';
import MagicCart from '@/app/components/MagicCart';
import RecipeCard from '@/app/components/RecipeCard';
import { RECIPES_DATA } from '@/app/data/recipes';
import Link from 'next/link';

// On instancie Prisma directement ici
const prisma = new PrismaClient();

// Force le rendu dynamique pour éviter le cache Vercel
export const dynamic = 'force-dynamic';

// Fonction helper adaptée pour la nouvelle base de données
async function getProductsForMatching() {
  
  // 1. On récupère les produits AVEC leurs prix (relation prices)
  const products = await prisma.product.findMany({
    select: { 
      ean: true, 
      nom: true, 
      image: true, 
      nutriscore: true, 
      categorie: true,
      // On va chercher les infos dans la table Price liée
      prices: {
        select: { magasin: true, valeur: true }, 
        orderBy: { valeur: 'asc' } // Le moins cher en premier
      }
    }
  });
  
  // 2. Transformation pour l'affichage
  // On convertit le format Prisma (Product -> prices[]) en format UI (Product avec prix + offers[])
  const formattedProducts = products.map((p: any) => {
      const prices = p.prices || [];
      const bestOffer = prices.length > 0 ? prices[0] : { magasin: "Indisponible", valeur: 0 };

      return {
          ...p,
          // On recrée les champs que ton UI attend
          prix: bestOffer.valeur,
          magasin: bestOffer.magasin,
          // On crée la liste des offres
          offers: prices.map((o: any) => ({ 
              magasin: o.magasin, 
              prix: o.valeur 
          }))
      };
  });
  
  return formattedProducts;
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