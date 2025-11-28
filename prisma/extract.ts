import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import path from 'path';

const prisma = new PrismaClient();

// CONFIGURATION
const INPUT_FILE = 'openfoodfacts-products.jsonl.gz';
const TARGET_PRODUCTS = 2000; // Nombre de produits à importer

// LES MAGASINS (Mis à jour avec GPS Vigneux pour que ça marche avec la géolocalisation)
const STORES_CONFIG = [
  { name: 'Leclerc Vigneux-sur-Seine', enseigne: 'Leclerc', priceMod: 1.0, lat: 48.7105, lng: 2.4168 },
  { name: 'Intermarché Super Vigneux', enseigne: 'Intermarché', priceMod: 1.04, lat: 48.7050, lng: 2.4200 },
  { name: 'Carrefour Market', enseigne: 'Carrefour', priceMod: 1.06, lat: 48.7080, lng: 2.4100 },
  { name: 'Auchan Vigneux', enseigne: 'Auchan', priceMod: 1.07, lat: 48.7120, lng: 2.4300 },
  { name: 'Super U Montgeron', enseigne: 'Super U', priceMod: 1.08, lat: 48.7020, lng: 2.4600 },
  { name: 'Monoprix Juvisy', enseigne: 'Monoprix', priceMod: 1.18, lat: 48.6900, lng: 2.3750 },
];

const AWS_BASE_URL = "https://openfoodfacts-images.s3.eu-west-3.amazonaws.com/data";

// --- TES FONCTIONS UTILITAIRES ---

function getSplitCode(code: string): string | null {
  if (!code || code.length < 8) return null;
  const cleanCode = code.trim();
  if (cleanCode.length <= 9) return null;
  const p1 = cleanCode.substring(0, 3);
  const p2 = cleanCode.substring(3, 6);
  const p3 = cleanCode.substring(6, 9);
  const p4 = cleanCode.substring(9);
  return `${p1}/${p2}/${p3}/${p4}`;
}

function getAwsImageUrl(p: any): string {
  const splitCode = getSplitCode(p.code);
  if (!splitCode) return '';
  let imageId = '1';
  if (p.images) {
    const numericKeys = Object.keys(p.images).filter(k => !isNaN(Number(k)));
    if (numericKeys.length > 0) imageId = numericKeys[numericKeys.length - 1];
  }
  return `${AWS_BASE_URL}/${splitCode}/${imageId}.400.jpg`;
}

function estimateBasePrice(category: string, name: string): number {
  const t = (category + ' ' + name).toLowerCase();
  if (t.includes('vin') || t.includes('champagne')) return 12.50;
  if (t.includes('café') || t.includes('coffee')) return 4.50;
  if (t.includes('viande') || t.includes('boeuf') || t.includes('poulet')) return 8.00;
  if (t.includes('fromage') || t.includes('cheese')) return 3.50;
  if (t.includes('bio')) return 3.80;
  if (t.includes('chocolat')) return 3.50;
  if (t.includes('pâtes') || t.includes('riz')) return 1.20;
  if (t.includes('eau')) return 0.50;
  return 2.90;
}

// --- LA FONCTION PRINCIPALE ---

async function extract() {
  const inputPath = path.join(process.cwd(), INPUT_FILE);

  console.log(`🚀 Démarrage de l'importation REAL DATA vers PRISMA...`);
  
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠️ Fichier ${INPUT_FILE} introuvable. Le script s'arrête mais le BUILD EST VALIDE.`);
    return; // On return proprement pour ne pas faire échouer le build Vercel si le fichier n'est pas là
  }

  try {
    // 1. Nettoyage de la base existante
    console.log('🧹 Nettoyage de la base de données...');
    // Attention à l'ordre de suppression à cause des clés étrangères
    await prisma.price.deleteMany();
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();

    // 2. CRÉATION DES MAGASINS (Étape obligatoire pour avoir des IDs)
    console.log('📍 Création des magasins...');
    const dbStores: any[] = [];
    
    for (const storeConfig of STORES_CONFIG) {
        const store = await prisma.store.create({
            data: {
                nom: storeConfig.name,
                enseigne: storeConfig.enseigne,
                lat: storeConfig.lat,
                lng: storeConfig.lng,
                adresse: "Adresse simulée"
            }
        });
        // On attache le modificateur de prix à l'objet store pour l'utiliser plus tard
        dbStores.push({ ...store, priceMod: storeConfig.priceMod });
    }

    const fileStream = fs.createReadStream(inputPath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

    let foundCount = 0;
    let scannedLines = 0;

    console.log('⏳ Lecture du fichier en cours...');

    for await (const line of rl) {
      scannedLines++;
      if (scannedLines % 5000 === 0) process.stdout.write(`🔍 Scan: ${scannedLines} | ✅ IMPORTÉS: ${foundCount}\r`);

      try {
        const p = JSON.parse(line);

        // --- FILTRES ---
        if (!p.countries_tags || !p.countries_tags.includes('en:france')) continue;
        const name = p.product_name_fr || p.product_name;
        if (!name) continue;

        const image = getAwsImageUrl(p);
        if (!image) continue;
        if (!p.code) continue;

        const nutriscore = p.nutrition_grade_fr || 'e';

        // Nettoyage Catégorie
        let category = 'Épicerie';
        if (p.categories_tags && p.categories_tags.length > 0) {
          const raw = p.categories_tags.find((t: string) => t.includes('fr:')) || p.categories_tags[0];
          if (raw) {
              category = raw.replace(/^[a-z]{2}:/, '').split('-').join(' ');
              category = category.charAt(0).toUpperCase() + category.slice(1);
              if (category.length > 25) category = category.split(',')[0];
          }
        }

        // Estimation du prix de base
        const basePrice = estimateBasePrice(category, name);
        const safeName = name.replace(/,/g, ' ').replace(/"/g, '').replace(/;/g, ' ').trim();

        // --- INSERTION EN BASE DE DONNÉES ---
        await prisma.product.create({
          data: {
            ean: p.code,
            nom: safeName,
            image: image,
            categorie: category,
            nutriscore: nutriscore,
            // C'EST ICI LA CORRECTION PRINCIPALE :
            prices: {
              create: dbStores.map(store => {
                const variation = basePrice * 0.05;
                const randomVar = (Math.random() * variation * 2) - variation;
                const finalPrice = (basePrice * store.priceMod) + randomVar;
                
                return {
                  // On n'utilise PLUS 'magasin' (string) mais 'storeId' (relation)
                  storeId: store.id, 
                  valeur: parseFloat(finalPrice.toFixed(2))
                };
              })
            }
          }
        });

        foundCount++;
        if (foundCount >= TARGET_PRODUCTS) break;

      } catch (e) { 
        continue; 
      }
    }

    console.log(`\n\n🎉 SUCCÈS ! ${foundCount} produits réels importés dans la base.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extract();