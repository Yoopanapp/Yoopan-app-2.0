import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// 🔧 CONFIGURATION
const DATA_DIR = path.join(__dirname, 'data');
const BATCH_SIZE = 200; // Nombre de produits insérés à la fois par magasin

async function importStoreFile(fileName: string, fileIndex: number, totalFiles: number) {
  const filePath = path.join(DATA_DIR, fileName);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Ignorer les fichiers vides ou mal formés
  if (!fileContent) return;
  
  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (e) {
    console.error(`❌ Erreur JSON dans ${fileName}, on passe.`);
    return;
  }

  // Vérification de sécurité : est-ce bien un fichier magasin ?
  if (!jsonData.id || !jsonData.p) {
    console.warn(`⚠️ Fichier ignoré (format incorrect) : ${fileName}`);
    return;
  }

  // 1. Récupération des infos du magasin
  const [noPL, noPR] = jsonData.id.split('-');
  
  // On nettoie le nom du fichier pour en faire un nom de magasin joli
  // Ex: "Leclerc_Vigneux_sur_Seine_123_123.json" -> "Leclerc Vigneux sur Seine"
  let storeName = fileName.replace('.json', '').replace(/_\d+_\d+$/, '').replace(/_/g, ' ');

  console.log(`\n🏪 [${fileIndex}/${totalFiles}] Traitement de : ${storeName} (${noPL}-${noPR})`);

  // 2. Création / Mise à jour du Magasin en BDD
  const store = await prisma.store.upsert({
    where: { nom: storeName },
    update: { lastScrapedAt: new Date() }, // On met juste à jour la date
    create: {
      nom: storeName,
      enseigne: "Leclerc",
      noPL: noPL,
      noPR: noPR,
      // Coordonnées fictives pour l'instant (mise à jour possible via l'app plus tard)
      ville: storeName.replace("Leclerc ", ""),
      lat: 0,
      lng: 0,
      lastScrapedAt: new Date()
    }
  });

  // 3. Importation des produits
  const productsList = jsonData.p;
  if (!productsList || productsList.length === 0) {
    console.log("   -> Aucun produit, on passe.");
    return;
  }

  console.log(`   📦 ${productsList.length} produits à importer...`);

  // Fonction de normalisation (Format Light Python -> Format BDD)
  const normalize = (item: any) => ({
    ean: String(item.id),
    nom: item.n,
    prix: parseFloat(item.p),
    promo: item.pp ? parseFloat(item.pp) : null,
    unitPrice: item.u || null,
    image: item.img || null,
    categorie: String(item.cat)
  });

  let count = 0;
  
  // Boucle par paquets (Batch)
  for (let i = 0; i < productsList.length; i += BATCH_SIZE) {
    const batch = productsList.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (rawItem: any) => {
      const p = normalize(rawItem);
      
      // Sécurité anti-crash
      if (!p.prix || !p.ean) return;

      // Upsert Produit (Catalogue Global)
      const product = await prisma.product.upsert({
        where: { ean: p.ean },
        update: { 
          nom: p.nom, 
          image: p.image 
          // On ne touche pas à la catégorie existante pour ne pas écraser avec un ID
        },
        create: { 
          ean: p.ean, 
          nom: p.nom, 
          image: p.image, 
          categorie: p.categorie, 
          rating: null 
        }
      });

      // Upsert Prix (Lié au magasin)
      await prisma.price.upsert({
        where: { productId_storeId: { productId: product.id, storeId: store.id } },
        update: { valeur: p.prix, promo: p.promo, unitPrice: p.unitPrice },
        create: { 
          valeur: p.prix, 
          promo: p.promo, 
          unitPrice: p.unitPrice, 
          productId: product.id, 
          storeId: store.id 
        }
      });
    }));

    count += batch.length;
    // Petit point de progression pour ne pas s'endormir
    process.stdout.write(`\r   ⏳ Progression : ${Math.round((count / productsList.length) * 100)}%`);
  }
  process.stdout.write(`\n   ✅ Terminé pour ce magasin.\n`);
}

async function main() {
  console.log('🚀 DÉMARRAGE DE L\'IMPORTATION MASSIVE 🚀');
  console.log(`📂 Dossier source : ${DATA_DIR}`);

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Dossier ${DATA_DIR} introuvable ! Crée-le et mets tes JSON dedans.`);
    process.exit(1);
  }

  // On liste tous les fichiers JSON, sauf le menu ou les fichiers système
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('.'));

  console.log(`📄 ${files.length} fichiers trouvés.`);

  // Boucle sur chaque fichier
  for (let i = 0; i < files.length; i++) {
    await importStoreFile(files[i], i + 1, files.length);
  }

  console.log('\n🎉 TOUT EST TERMINÉ ! TA BASE EST REMPLIE ! 🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });