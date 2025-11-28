import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Tes produits (INCHANGÉS)
const STARTER_PRODUCTS = [
  { 
    ean: '5449000000996', 
    nom: 'Coca-Cola Original 1.5L', 
    cat: 'Boissons', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/15-09-26-RalfR-WLC-0098.jpg/640px-15-09-26-RalfR-WLC-0098.jpg', 
    basePrice: 1.85, 
    nutri: 'e' 
  },
  { 
    ean: '3017620422003', 
    nom: 'Nutella 400g', 
    cat: 'Épicerie', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Nutella-1.jpg/600px-Nutella-1.jpg', 
    basePrice: 3.40, 
    nutri: 'e' 
  },
  { 
    ean: '8000500003787', 
    nom: 'Kinder Bueno x6', 
    cat: 'Épicerie', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Kinder-Bueno-Wrapper.jpg', 
    basePrice: 3.80, 
    nutri: 'e' 
  },
  { 
    ean: '3068320114257', 
    nom: 'Evian Eau Minérale 1.5L', 
    cat: 'Boissons', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Evian_Water_bottle.jpg/300px-Evian_Water_bottle.jpg', 
    basePrice: 0.75, 
    nutri: 'a' 
  },
  { 
    ean: '3228857000166', 
    nom: 'Panzani Coquillettes 500g', 
    cat: 'Épicerie', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Coquillettes_panzani_crues.jpg/640px-Coquillettes_panzani_crues.jpg', 
    basePrice: 1.15, 
    nutri: 'a' 
  },
  { 
    ean: '3083680085301', 
    nom: 'Barilla Spaghetti n.5 500g', 
    cat: 'Épicerie', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Barilla_Spaghetti_No_5_--_2020_--_3862.jpg/600px-Barilla_Spaghetti_No_5_--_2020_--_3862.jpg', 
    basePrice: 1.35, 
    nutri: 'a' 
  },
  { 
    ean: '3250390001095', 
    nom: 'Beurre Président Doux 250g', 
    cat: 'Frais', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Butter_President.jpg/640px-Butter_President.jpg', 
    basePrice: 2.95, 
    nutri: 'd' 
  },
  { 
    ean: '3560070048805', 
    nom: 'Lait Demi-Écrémé 1L', 
    cat: 'Frais', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Milk_carton.jpg/400px-Milk_carton.jpg', 
    basePrice: 1.20, 
    nutri: 'b' 
  },
  { 
    ean: '3033490004743', 
    nom: 'Danette Chocolat x4', 
    cat: 'Frais', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Chocolate_pudding.jpg/640px-Chocolate_pudding.jpg', 
    basePrice: 2.10, 
    nutri: 'c' 
  },
  { 
    ean: '8715700421360', 
    nom: 'Heinz Tomato Ketchup 460g', 
    cat: 'Épicerie', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Ketchup_Heinz.jpg/300px-Ketchup_Heinz.jpg', 
    basePrice: 2.70, 
    nutri: 'd' 
  },
  { 
    ean: '3017620425035', 
    nom: 'Ferrero Rocher x16', 
    cat: 'Plaisir', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Ferrero_Rocher_Akha.jpg/640px-Ferrero_Rocher_Akha.jpg', 
    basePrice: 6.50, 
    nutri: 'e' 
  },
  { 
    ean: '3175680010531', 
    nom: 'Compotes Pomme Andros x4', 
    cat: 'Frais', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Applesauce.jpg/640px-Applesauce.jpg', 
    basePrice: 2.30, 
    nutri: 'a' 
  },
  { 
    ean: '7613034626844', 
    nom: 'Cacao en Poudre 400g', 
    cat: 'Petit-Dèj', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Cocoa_powder.jpg/640px-Cocoa_powder.jpg', 
    basePrice: 3.10, 
    nutri: 'c' 
  },
  { 
    ean: '3229820794849', 
    nom: 'Emmental Râpé 200g', 
    cat: 'Frais', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Emmental_Cheese.jpg/640px-Emmental_Cheese.jpg', 
    basePrice: 2.60, 
    nutri: 'd' 
  },
  { 
    ean: '3270190207865', 
    nom: 'Jus Multivitaminé 2L', 
    cat: 'Boissons', 
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orange_juice_1.jpg/400px-Orange_juice_1.jpg', 
    basePrice: 2.45, 
    nutri: 'e' 
  },
];

// 2. Tes magasins (MIS A JOUR avec GPS Réel autour de Vigneux)
// J'ai gardé tes 'priceMod' pour conserver ta logique de prix
const STORES_CONFIG = [
  { 
    nom: 'Leclerc Vigneux-sur-Seine', 
    enseigne: 'Leclerc', 
    priceMod: 1.0, 
    adresse: 'Centre Commercial du Lac, 91270 Vigneux-sur-Seine',
    lat: 48.7105, 
    lng: 2.4168 
  },       
  { 
    nom: 'Intermarché Super Vigneux', 
    enseigne: 'Intermarché', 
    priceMod: 1.04, 
    adresse: '64 Avenue Henri Barbusse, 91270 Vigneux-sur-Seine',
    lat: 48.7050, 
    lng: 2.4200 
  },  
  { 
    nom: 'Carrefour Market', 
    enseigne: 'Carrefour', 
    priceMod: 1.06, 
    adresse: 'Rue du President Kennedy, 91270 Vigneux-sur-Seine',
    lat: 48.7080, 
    lng: 2.4100 
  },    
  { 
    nom: 'Auchan Vigneux', 
    enseigne: 'Auchan', 
    priceMod: 1.07, 
    adresse: 'Avenue de la Concorde, 91270 Vigneux-sur-Seine',
    lat: 48.7120, 
    lng: 2.4300 
  },       
  { 
    nom: 'Super U Montgeron', 
    enseigne: 'Super U', 
    priceMod: 1.08, 
    adresse: 'ZAC Maurice Garin, 91230 Montgeron',
    lat: 48.7020, 
    lng: 2.4600 
  },      
  { 
    nom: 'Monoprix Juvisy', 
    enseigne: 'Monoprix', 
    priceMod: 1.18, 
    adresse: '21 Rue Grande, 91260 Juvisy-sur-Orge',
    lat: 48.6900, 
    lng: 2.3750 
  },     
];

async function main() {
  console.log('🌱 Début du chargement des données Géolocalisées...');

  // 1. Nettoyage complet
  await prisma.price.deleteMany();
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();
  console.log('🧹 Base de données nettoyée.');

  // 2. Création des Magasins (Stores) en premier
  // On stocke les magasins créés dans une liste pour récupérer leurs IDs
  const createdStores = [];

  for (const storeConfig of STORES_CONFIG) {
    const store = await prisma.store.create({
      data: {
        nom: storeConfig.nom,
        enseigne: storeConfig.enseigne,
        adresse: storeConfig.adresse,
        lat: storeConfig.lat,
        lng: storeConfig.lng,
      }
    });
    // On garde l'objet complet (avec ID BDD + priceMod) pour la suite
    createdStores.push({ ...store, priceMod: storeConfig.priceMod });
  }
  console.log(`📍 ${createdStores.length} magasins créés.`);

  // 3. Création des Produits et des Prix
  for (const item of STARTER_PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        ean: item.ean,
        nom: item.nom,
        image: item.image,
        categorie: item.cat,
        nutriscore: item.nutri,
      },
    });

    // Pour chaque produit, on crée un prix dans CHAQUE magasin créé
    for (const store of createdStores) {
      const randomVar = 0.97 + Math.random() * 0.06; 
      const finalPrice = item.basePrice * store.priceMod * randomVar;
      
      await prisma.price.create({
        data: {
          valeur: parseFloat(finalPrice.toFixed(2)),
          productId: product.id,
          storeId: store.id, // C'EST ICI QUE CA CHANGE : On utilise l'ID du magasin
        },
      });
    }
  }

  console.log(`✅ ${STARTER_PRODUCTS.length} produits créés avec succès.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });