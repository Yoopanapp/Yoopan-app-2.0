// prisma/inspect.ts
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import path from 'path';

const INPUT_FILE = 'openfoodfacts-products.jsonl.gz';

async function inspect() {
  const inputPath = path.join(process.cwd(), INPUT_FILE);

  console.log(`🕵️‍♂️ Inspection du fichier : ${INPUT_FILE}`);

  // 1. Vérif taille fichier
  try {
    const stats = fs.statSync(inputPath);
    console.log(`📦 Taille du fichier : ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (e) {
    console.error("❌ ERREUR CRITIQUE : Le fichier est introuvable !");
    console.error("Vérifie qu'il est bien à la racine du dossier 'yoopan_app'.");
    process.exit(1);
  }

  // 2. Lecture des premières lignes
  const fileStream = fs.createReadStream(inputPath);
  const gunzip = zlib.createGunzip();
  
  const rl = readline.createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity,
  });

  let count = 0;

  console.log("\n--- DÉBUT DES DONNÉES BRUTES (5 premiers produits) ---");

  for await (const line of rl) {
    try {
      const p = JSON.parse(line);
      count++;

      console.log(`\n🔹 PRODUIT #${count}`);
      console.log(`   Nom (fr): ${p.product_name_fr || 'NON DÉFINI'}`);
      console.log(`   Nom (générique): ${p.product_name || 'NON DÉFINI'}`);
      console.log(`   Pays: ${p.countries_tags ? p.countries_tags.join(', ') : 'NON DÉFINI'}`);
      console.log(`   Code: ${p.code}`);
      console.log(`   Image: ${p.image_front_small_url ? 'OUI' : 'NON'}`);

      // On s'arrête après 5 lignes pour ne pas spammer
      if (count >= 5) break;

    } catch (e) {
      console.log("⚠️ Ligne illisible (erreur JSON)");
    }
  }

  console.log("\n--- FIN DE L'INSPECTION ---");
  process.exit(0);
}

inspect().catch(console.error);