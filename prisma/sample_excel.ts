// prisma/sample_excel.ts
import fs from 'fs';
import zlib from 'zlib';
import readline from 'readline';
import path from 'path';

const INPUT_FILE = 'openfoodfacts-products.jsonl.gz';
const OUTPUT_FILE = 'VISUAL_TEST.csv';

async function generateSample() {
  const inputPath = path.join(process.cwd(), INPUT_FILE);
  const outputPath = path.join(process.cwd(), OUTPUT_FILE);

  console.log(`📊 Génération d'un fichier Excel pour inspection...`);

  const fileStream = fs.createReadStream(inputPath);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

  // On prépare le fichier de sortie
  const output = fs.createWriteStream(outputPath);
  
  // En-têtes des colonnes pour Excel (avec ; pour séparateur car Excel français préfère souvent ça)
  output.write('NOM;CODE_BARRE;PAYS;CATEGORIES;IMAGE_URL\n');

  let count = 0;

  for await (const line of rl) {
    try {
      const p = JSON.parse(line);
      
      // On récupère les infos
      const nom = (p.product_name_fr || p.product_name || 'INCONNU').replace(/;/g, ','); // On enlève les point-virgules pour pas casser le CSV
      const code = p.code || 'VIDE';
      const pays = (p.countries_tags || []).join(', ');
      const cats = (p.categories_tags || []).join(', ');
      const img = p.image_front_small_url || p.image_url || 'PAS D\'IMAGE';

      // On écrit une ligne
      output.write(`${nom};${code};${pays};${cats};${img}\n`);

      count++;
      if (count >= 100) break; // On s'arrête à 100 produits pour que ce soit léger

    } catch (e) {
      continue;
    }
  }

  console.log(`✅ Fichier ${OUTPUT_FILE} créé !`);
  console.log(`👉 Tu peux maintenant l'ouvrir avec Excel.`);
}

generateSample().catch(console.error);