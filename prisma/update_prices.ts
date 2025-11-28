import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// L'API Open Prices (Projet collaboratif gratuit)
const OPEN_PRICES_API = 'https://prices.openfoodfacts.org/api/v1/prices';

async function updatePrices() {
  console.log('🕵️‍♂️ Démarrage de la recherche de VRAIS PRIX (Open Prices)...');
  
  // 1. On charge d'abord NOS magasins locaux pour avoir leurs IDs
  const myStores = await prisma.store.findMany();
  console.log(`📍 ${myStores.length} magasins locaux chargés pour le mapping.`);

  // 2. On récupère tous nos produits
  const products = await prisma.product.findMany({
    select: { id: true, ean: true, nom: true }
  });

  console.log(`📦 ${products.length} produits à vérifier.`);

  let updatedCount = 0;

  for (const product of products) {
    try {
      // 3. On interroge l'API Open Prices pour cet EAN
      const response = await fetch(`${OPEN_PRICES_API}?product_code=${product.ean}&size=10`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        
        for (const item of data.items) {
          // L'API renvoie des noms sales (ex: "Leclerc Vannes").
          // On nettoie pour trouver l'enseigne générique.
          let targetBrand = '';
          const sourceStore = (item.location_name || '').toLowerCase();

          if (sourceStore.includes('leclerc')) targetBrand = 'Leclerc';
          else if (sourceStore.includes('carrefour')) targetBrand = 'Carrefour';
          else if (sourceStore.includes('auchan')) targetBrand = 'Auchan';
          else if (sourceStore.includes('intermarché') || sourceStore.includes('intermarche')) targetBrand = 'Intermarché';
          else if (sourceStore.includes('u') || sourceStore.includes('super u')) targetBrand = 'Super U';
          else if (sourceStore.includes('monoprix')) targetBrand = 'Monoprix';

          // 4. MAPPING : On cherche si on a un magasin correspondant à cette enseigne dans NOTRE base
          if (targetBrand) {
            // On cherche le premier magasin de notre base qui a cette enseigne
            // (Ex: Si l'API donne un prix Leclerc Brest, on l'applique à notre Leclerc Vigneux pour la démo)
            const matchedStore = myStores.find(s => s.enseigne === targetBrand || s.nom.includes(targetBrand));

            if (matchedStore && item.price) {
              
              // 5. MISE À JOUR OU CRÉATION (Upsert logic)
              const existingPrice = await prisma.price.findFirst({
                where: { 
                  productId: product.id,
                  storeId: matchedStore.id // <--- CORRECTION : On utilise storeId
                }
              });

              if (existingPrice) {
                // Mise à jour
                await prisma.price.update({
                  where: { id: existingPrice.id },
                  data: { valeur: item.price }
                });
              } else {
                // Création
                await prisma.price.create({
                  data: {
                    valeur: item.price,
                    productId: product.id,
                    storeId: matchedStore.id // <--- CORRECTION : On utilise storeId
                  }
                });
              }
              
              updatedCount++;
              // On arrête de chercher pour ce produit si on a trouvé un prix pour cette enseigne
              // (Optionnel, dépend si tu veux plusieurs prix par enseigne)
            }
          }
        }
        process.stdout.write('✅'); // Succès visuel
      } else {
        process.stdout.write('.'); // Pas de prix trouvé
      }

      // Petite pause pour ne pas se faire bloquer par l'API
      await new Promise(r => setTimeout(r, 50));

    } catch (e) {
      // On ignore les erreurs individuelles pour continuer la boucle
      process.stdout.write('x');
    }
  }

  console.log(`\n\n🎉 FINI ! ${updatedCount} prix mis à jour via Open Prices.`);
}

updatePrices()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());