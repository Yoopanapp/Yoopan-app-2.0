import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import path from 'path';

const prisma = new PrismaClient();

// CONFIGURATION
const INPUT_FILE = 'openfoodfacts-products.jsonl.gz';
const TARGET_PRODUCTS = 2000; // Nombre de produits à importer

// LES MAGASINS (Avec leurs modificateurs de prix pour le réalisme)
const STORES = [
  { name: 'Leclerc', priceMod: 1.0 },       // Base
  { name: 'Intermarché', priceMod: 1.04 },  // +4%
  { name: 'Carrefour', priceMod: 1.06 },    // +6%
  { name: 'Auchan', priceMod: 1.07 },       // +7%
  { name: 'Super U', priceMod: 1.08 },      // +8%
  { name: 'Monoprix', priceMod: 1.18 },     // +18%
];

const AWS_BASE_URL = "https://openfoodfacts-images.s3.eu-west-3.amazonaws.com/data";

// --- TES FONCTIONS UTILITAIRES (GARDÉES TELLES QUELLES) ---

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
    console.error(`❌ Fichier introuvable : ${INPUT_FILE}`);
    process.exit(1);
  }

  try {
    // 1. Nettoyage de la base existante
    console.log('🧹 Nettoyage de la base de données...');
    await prisma.price.deleteMany();
    await prisma.product.deleteMany();

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

        // --- FILTRES (Ta logique) ---
        if (!p.countries_tags || !p.countries_tags.includes('en:france')) continue;
        const name = p.product_name_fr || p.product_name;
        if (!name) continue;

        const image = getAwsImageUrl(p); // On utilise ta fonction AWS
        if (!image) continue;
        if (!p.code) continue;

        const nutriscore = p.nutrition_grade_fr || 'e'; // Valeur par défaut si manquant

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
        // On crée le produit ET ses prix en une seule requête (Transaction implicite)
        await prisma.product.create({
          data: {
            ean: p.code,
            nom: safeName,
            image: image,
            categorie: category,
            nutriscore: nutriscore,
            // On crée les prix liés directement
            prices: {
              create: STORES.map(store => {
                // Ta logique de variation de prix
                const variation = basePrice * 0.05; // Variation légère pour simuler la réalité
                const randomVar = (Math.random() * variation * 2) - variation;
                const finalPrice = (basePrice * store.priceMod) + randomVar;
                
                return {
                  magasin: store.name,
                  valeur: parseFloat(finalPrice.toFixed(2))
                };
              })
            }
          }
        });

        foundCount++;
        if (foundCount >= TARGET_PRODUCTS) break;

      } catch (e) { 
        // Ignorer les lignes JSON malformées
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