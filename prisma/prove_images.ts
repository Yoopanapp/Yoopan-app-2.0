// prisma/prove_images.ts
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import path from 'path';

const INPUT_FILE = 'openfoodfacts-products.jsonl.gz';

async function proveIt() {
  const inputPath = path.join(process.cwd(), INPUT_FILE);
  console.log(`🕵️‍♂️ Recherche d'une preuve d'image dans ${INPUT_FILE}...`);

  // Vérif fichier source
  if (!fs.existsSync(inputPath)) {
      console.error("❌ ERREUR : Le fichier .gz n'est pas à la racine !");
      process.exit(1);
  }

  const fileStream = fs.createReadStream(inputPath);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

  let count = 0;

  for await (const line of rl) {
    count++;
    // On affiche un point tous les 1000 produits pour montrer que ça bosse
    if (count % 1000 === 0) process.stdout.write('.');

    try {
      const p = JSON.parse(line);

      // On cherche un produit FR avec une image explicite
      if (p.countries_tags && p.countries_tags.includes('en:france')) {
        const url = p.image_front_small_url || p.image_url;

        if (url) {
          console.log('\n\n✨ EUREKA ! J\'ai trouvé une preuve ! ✨');
          console.log(`📦 Produit : ${p.product_name_fr || p.product_name}`);
          console.log(`🖼️ URL     : ${url}`);
          process.exit(0); // On s'arrête dès qu'on a trouvé
        }
      }
    } catch (e) {}
  }
}

proveIt().catch(console.error);