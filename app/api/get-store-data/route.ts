import { prisma } from '@/lib/prisma';
import storesData from '../../data/leclerc_stores.json';

export const dynamic = 'force-dynamic';

// --- 1. FONCTION D'EXTRACTION (On garde celle-ci, elle est robuste) ---
function extractProducts(data: any, products: any[] = []) {
  if (!data) return products;

  if (data.Produits && Array.isArray(data.Produits)) {
    data.Produits.forEach((p: any) => {
      if (p.Id && p.Libelle1) {
        products.push({
          ean: String(p.Id),
          nom: `${p.Libelle1} ${p.Libelle2 || ''}`.trim(),
          prix: p.Prix || 0,
          promo: p.PrixPromo && p.PrixPromo < p.Prix ? p.PrixPromo : null,
          unitPrice: p.InfoPrix || null,
          rating: p.NoteAvisClient || null,
          image: p.URLPhotoListe || p.URLPhotoDetail || null,
          categorie: "Rayon"
        });
      }
    });
    return products;
  }

  // Récursivité pour chercher partout dans le JSON
  if (Array.isArray(data)) {
    data.forEach(item => extractProducts(item, products));
  } else if (typeof data === 'object') {
    if (data.iId && data.sLibelle) {
      products.push({
        ean: String(data.iId),
        nom: data.sLibelle,
        prix: data.rPV || 0,
        promo: null, unitPrice: null, rating: null,
        image: data.sImgUrl || null,
        categorie: data.sLibelleRayon || "Autre"
      });
    }
    ['familles', 'rayons', 'produits', 'objets', 'd', 'data'].forEach(key => {
      if (data[key]) extractProducts(data[key], products);
    });
  }
  return products;
}

// --- 2. LA LOGIQUE DE RÉCUPÉRATION (RETOUR AUX BASES) ---
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const noPL = searchParams.get('noPL');
  const noPR = searchParams.get('noPR');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (msg: string) => {
        try { controller.enqueue(encoder.encode(msg + "\n")); } catch(e) {}
      };

      try {
        const cookie = process.env.LECLERC_COOKIE || "";
        console.log(`🍪 Cookie présent : ${cookie ? "OUI" : "NON"}`);

        if (!noPL || !noPR) throw new Error("Paramètres noPL/noPR manquants");

        sendLog(`🚀 Démarrage pour le magasin ${noPL}...`);

        // Info magasin (Cosmétique)
        const localStoreInfo = (storesData as any[]).find((s: any) => s.noPL === noPL);
        const storeName = localStoreInfo ? `Leclerc ${localStoreInfo.name}` : `Leclerc-${noPL}`;
        sendLog(`📍 Magasin : ${storeName}`);

        // Vérification Cache
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const store = await prisma.store.findFirst({ where: { noPL, noPR } });

        if (store && store.lastScrapedAt && store.lastScrapedAt > oneDayAgo) {
          sendLog("⚡ Cache valide trouvé !");
          sendLog("✅ TERMINÉ (Cache)");
          controller.close();
          return;
        }

        sendLog("🌍 Connexion au serveur Leclerc...");

        // --- C'EST ICI QU'ON SIMPLIFIE ---
        // On construit l'URL proprement sans la signature compliquée
        // On garde juste les paramètres techniques de base (DeviceId, Terminal, etc.) qui semblent constants
        const baseUrl = `https://fd14-m.leclercdrive.fr/${noPL}-${noPR}/assortiment.ashz`;
        const params = new URLSearchParams({
            DeviceId: "e383e88a-68e7-3574-8e27-a08dc6e84cfb",
            Terminal: "13",
            Model: "SONY XQ-AQ52",
            OS: "9",
            Ver: "27.2.1",
            Build: "2027020101",
            Config: "FRANCE",
            Lang: "fr",
            Locale: "fr-FR",
            Accessible: "0",
            visiteur: "1",
            AppTheme: "Light"
            // PAS DE SIGNATURE
        });

        const apiUrl = `${baseUrl}?${params.toString()}`;

        // HEADERS SIMPLES (Comme au début)
        const SIMPLE_HEADERS = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
          "Cookie": cookie,
          "Accept": "*/*", // On accepte tout, comme une brute
          "Connection": "keep-alive"
        };

        const response = await fetch(apiUrl, { headers: SIMPLE_HEADERS });

        if (response.status === 403) throw new Error("⛔ 403 Forbidden : Le cookie ne fonctionne pas pour ce magasin.");
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);

        sendLog("📥 Téléchargement réussi !");
        
        const jsonData = await response.json();
        const rawProducts = extractProducts(jsonData);

        if (rawProducts.length === 0) throw new Error("JSON reçu mais vide (0 produits).");

        sendLog(`📦 ${rawProducts.length} produits trouvés. Sauvegarde...`);

        // --- SAUVEGARDE (On garde la version sécurisée pour ta BDD) ---
        const dbStore = await prisma.store.upsert({
          where: { nom: storeName },
          update: { 
            lastScrapedAt: new Date(),
            ville: localStoreInfo?.name, 
            cp: localStoreInfo?.postalCode,
            lat: localStoreInfo?.latitude, 
            lng: localStoreInfo?.longitude
          },
          create: { 
            nom: storeName, enseigne: "Leclerc", noPL, noPR, lastScrapedAt: new Date(),
            ville: localStoreInfo?.name, cp: localStoreInfo?.postalCode,
            lat: localStoreInfo?.latitude, lng: localStoreInfo?.longitude
          }
        });

        // Batch size 10 pour Supabase
        const BATCH_SIZE = 10; 
        let count = 0;
        const total = rawProducts.length;
        const startTime = Date.now();

        for (let i = 0; i < total; i += BATCH_SIZE) {
          const batch = rawProducts.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async (p) => {
            if (!p.prix && p.prix !== 0) return;
            
            const product = await prisma.product.upsert({
              where: { ean: p.ean },
              update: { nom: p.nom, image: p.image, rating: p.rating ? parseFloat(p.rating) : null },
              create: { ean: p.ean, nom: p.nom, image: p.image, categorie: p.categorie, rating: p.rating ? parseFloat(p.rating) : null }
            });

            await prisma.price.upsert({
              where: { productId_storeId: { productId: product.id, storeId: dbStore.id } },
              update: { 
                valeur: parseFloat(String(p.prix)),
                promo: p.promo ? parseFloat(String(p.promo)) : null,
                unitPrice: p.unitPrice 
              },
              create: { 
                valeur: parseFloat(String(p.prix)), promo: p.promo ? parseFloat(String(p.promo)) : null,
                unitPrice: p.unitPrice, productId: product.id, storeId: dbStore.id 
              }
            });
          }));
          count += batch.length;
          if (count % 50 === 0 || count === total) {
             const pct = Math.round((count / total) * 100);
             sendLog(`💾 Sauvegarde : ${pct}% (${count}/${total})`);
          }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        sendLog(`✨ SUCCÈS : ${count} produits importés en ${duration}s.`);
        sendLog("✅ TERMINÉ"); 

      } catch (error: any) {
        sendLog(`❌ ERREUR : ${error.message}`);
        console.error(error);
      } finally {
        try { controller.close(); } catch(e) {}
      }
    }
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}