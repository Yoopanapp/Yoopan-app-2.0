'use server';

import { prisma } from '@/lib/prisma';

export type IngredientMatch = {
  term: string;
  qty: number;
  matches: {
    ean: string;
    nom: string;
    image: string | null;
    prix: number;
    promo: number | null;
    hasPromo: boolean;
    brand: string;
  }[];
};

// Blacklist (Pour éviter le non-alimentaire)
const BLACKLIST = [
  'Pizza', 'Burger', 'Sandwich', 'Box', 'Salade composée', 'Taboulé', 'Plat', 'Micro-ondes', 'Poêlée',
  'Bébé', 'Blédichef', 'Nestlé', '12mois', '8mois', 'Assiette', 'Gourde', 'Pot',
  'Chat', 'Chien', 'Croquette', 'Terrine', 'Litière', 'Animal', 'Patée', 'Effiloché', 'Sachet', 'Felix', 'Gourmet', 'Sheba',
  'Soin', 'Visage', 'Corps', 'Main', 'Douche', 'Shampoing', 'Savon', 'Masque', 'Lotion', 'BB', 'CC', 'Démaquillant', 'Solaire', 'Cheveux', 'Dentifrice',
  'Glace', 'Bâtonnet', 'Sorbet', 'Cone', 'Bac', 'Vanille', 'Chocolat', 'Caramel', 'Mystère',
  'Biscuit', 'Gâteau', 'Madeleine', 'Brioche', 'Chocolat', 'Bonbon', 'Confiserie', 'Nappage', 'Dessert', 'Cookie',
  'Pâtes', 'Coquillette', 'Tagliatelle', 'Nouilles', 'Alsace' 
];

export async function matchRecipeIngredients(ingredients: { term: string; qty: number }[], storeId: string): Promise<IngredientMatch[]> {
  if (!storeId) return [];

  const cleanStoreId = storeId.length === 4 ? `0${storeId}` : storeId;

  // 1. On récupère le magasin
  const store = await prisma.store.findFirst({
    where: { OR: [{ id: cleanStoreId }, { noPL: cleanStoreId }, { noPR: cleanStoreId }] },
    select: { id: true }
  });

  if (!store) throw new Error("Magasin introuvable");

  const results = await Promise.all(
    ingredients.map(async (ing) => {
      
      // 2. SCAN MASSIF (500 produits)
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { nom: { contains: ing.term, mode: 'insensitive' } },
            {
              NOT: {
                OR: BLACKLIST.map(badWord => ({
                   nom: { contains: badWord, mode: 'insensitive' }
                }))
              }
            },
            { prices: { some: { storeId: store.id } } }
          ]
        },
        select: {
            id: true,
            nom: true,
            image: true,
            prices: {
                where: { storeId: store.id },
                select: { valeur: true, promo: true } 
            }
        },
        take: 500 // On prend large pour trouver la perle rare
      });

      // 3. SCORING
      const rankedProducts = products.map(p => {
        let score = 0;
        const lowerNom = p.nom.toLowerCase();
        const lowerTerm = ing.term.toLowerCase();
        const priceData = p.prices[0];

        // Détection Promo (Prix Barré)
        const hasPromo = (priceData.promo && priceData.promo > priceData.valeur) ? true : false;

        // Règle 1 : LA PROMO GAGNE TOUJOURS (+1 Million de points)
        if (hasPromo) score += 1000000;

        // Règle 2 : Pertinence du nom
        if (lowerNom.startsWith(lowerTerm)) score += 100;
        else if (lowerNom.includes(` ${lowerTerm} `)) score += 50;

        // Règle 3 : Nom court (Produit brut)
        score += Math.max(0, 100 - p.nom.length);

        return { 
            ...p, 
            score, 
            priceData,
            hasPromo 
        };
      });

      // 4. TRI
      const bestMatches = rankedProducts
        .sort((a, b) => {
            // Sécurité absolue : Promo d'abord
            if (a.hasPromo && !b.hasPromo) return -1;
            if (!a.hasPromo && b.hasPromo) return 1;

            // Ensuite le score
            if (b.score !== a.score) return b.score - a.score;

            // Enfin le prix
            return a.priceData.valeur - b.priceData.valeur;
        })
        .slice(0, 20); // Top 20

      return {
        term: ing.term,
        qty: ing.qty,
        matches: bestMatches.map(p => ({
          ean: p.id,
          nom: p.nom,
          image: p.image,
          brand: p.nom.split(' ')[0],
          prix: p.priceData.valeur,
          promo: p.priceData.promo,
          hasPromo: p.hasPromo
        }))
      };
    })
  );

  return results;
}