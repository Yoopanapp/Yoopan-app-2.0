import { prisma } from '@/lib/prisma';
import { Logo } from '@/app/components/logo';
import Footer from '@/app/components/Footer';
import MagicCart from '@/app/components/MagicCart';
import RecipeCard from '@/app/components/RecipeCard';
import { RECIPES_DATA } from '@/app/data/recipes';
import Link from 'next/link';

// Fonction helper pour récupérer les produits (ADAPTÉE NOUVELLE BDD)
async function getProductsForMatching() {
  
  // 1. On récupère les produits AVEC leurs prix (relation)
  const products = await prisma.product.findMany({
    // On sélectionne les champs de base + la relation prices
    select: { 
      ean: true, 
      nom: true, 
      image: true, 
      // magasin: true, // <--- SUPPRIMÉ CAR N'EXISTE PLUS DANS LA TABLE PRODUCT
      nutriscore: true, 
      categorie: true,
      prices: {
        select: { magasin: true, valeur: true }, // On prend les infos de la table Price
        orderBy: { valeur: 'asc' } // On trie pour avoir le meilleur prix en premier
      }
    }
  });
  
  // 2. Transformation pour retrouver le format "à plat" que ton code attend
  // On crée une ligne par offre (comme si on avait plusieurs produits identiques avec des prix différents)
  const flattenedProducts: any[] = [];

  products.forEach((p: any) => {
      const prices = p.prices || [];
      
      // Si le produit a des prix, on crée une entrée pour chaque prix
      if (prices.length > 0) {
          prices.forEach((price: any) => {
              flattenedProducts.push({
                  ...p,
                  prix: price.valeur,      // On remet 'prix' à la racine
                  magasin: price.magasin,  // On remet 'magasin' à la racine
                  offers: prices.map((o: any) => ({ magasin: o.magasin, prix: o.valeur })) // On garde la liste complète
              });
          });
      } else {
          // Si pas de prix, on garde le produit quand même (avec prix 0)
          flattenedProducts.push({
              ...p,
              prix: 0,
              magasin: "Indisponible",
              offers: []
          });
      }
  });

  // 3. Regroupement par EAN (Ta logique originale, conservée)
  const grouped = new Map();
  flattenedProducts.forEach((p: any) => {
      const existing = grouped.get(p.ean);
      // Comme on a déjà aplati, 'p' contient déjà le prix et le magasin d'une offre spécifique
      // Mais pour ton matching de recette, on veut souvent juste la liste des produits uniques avec leurs offres
      
      if (!existing) {
          grouped.set(p.ean, p);
      } else {
          // Si le produit existe déjà, on s'assure juste que la liste des offres est complète
          // (Note: avec la logique ci-dessus, chaque 'p' a déjà la liste complète 'offers', donc c'est bon)
      }
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