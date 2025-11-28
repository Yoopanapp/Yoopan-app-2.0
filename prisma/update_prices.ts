// prisma/update_prices.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// L'API Open Prices (Projet collaboratif gratuit)
const OPEN_PRICES_API = 'https://prices.openfoodfacts.org/api/v1/prices';

async function updatePrices() {
  console.log('🕵️‍♂️ Démarrage de la recherche de VRAIS PRIX...');
  
  // 1. On récupère tous nos produits (groupés par EAN pour ne pas requêter 3 fois le même)
  const products = await prisma.product.findMany({
    distinct: ['ean'],
    select: { ean: true, nom: true }
  });

  console.log(`📦 ${products.length} produits à vérifier.`);

  let updatedCount = 0;

  for (const product of products) {
    try {
      // 2. On interroge l'API Open Prices pour cet EAN
      const response = await fetch(`${OPEN_PRICES_API}?product_code=${product.ean}&size=5`);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        // On a trouvé des prix !
        console.log(`✅ VRAI PRIX trouvé pour : ${product.nom}`);

        for (const item of data.items) {
          // L'API renvoie souvent des noms de magasins un peu sales (ex: "Leclerc Vannes").
          // On essaie de matcher avec nos enseignes principales.
          let targetStore = '';
          const sourceStore = (item.location_name || '').toLowerCase();

          if (sourceStore.includes('leclerc')) targetStore = 'Leclerc';
          else if (sourceStore.includes('carrefour')) targetStore = 'Carrefour';
          else if (sourceStore.includes('auchan')) targetStore = 'Auchan';
          else if (sourceStore.includes('intermarché') || sourceStore.includes('intermarche')) targetStore = 'Intermarché';
          else if (sourceStore.includes('u') || sourceStore.includes('super u')) targetStore = 'Super U';
          else if (sourceStore.includes('monoprix')) targetStore = 'Monoprix';

          if (targetStore && item.price) {
            // 3. MISE À JOUR DANS NOTRE BASE
            // On cherche si on a ce produit pour ce magasin dans notre base
            const existingProduct = await prisma.product.findFirst({
              where: { ean: product.ean, magasin: targetStore }
            });

            if (existingProduct) {
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: { prix: item.price } // ON REMPLACE PAR LE VRAI PRIX
              });
              console.log(`   -> Mise à jour ${targetStore} : ${item.price}€`);
              updatedCount++;
            }
          }
        }
      } else {
        // Pas de prix trouvé, on passe silencieusement (ou on met un petit point pour montrer que ça avance)
        process.stdout.write('.'); 
      }

      // Petite pause pour être poli avec l'API
      await new Promise(r => setTimeout(r, 100));

    } catch (e) {
      console.error(`Erreur sur ${product.ean}`);
    }
  }

  console.log(`\n\n🎉 FINI ! ${updatedCount} prix ont été mis à jour avec des données réelles.`);
}

updatePrices()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());