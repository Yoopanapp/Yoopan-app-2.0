import psycopg2
import csv
import io
import time
import os

# ================= CONFIGURATION =================
CSV_FILE = 'IMPORT_SUPABASE.csv'
# ON BAISSE LA TAILLE DU PAQUET POUR ÉVITER LE TIMEOUT
BATCH_SIZE = 50000  
# Ton URL (je l'ai laissée telle quelle)
DB_URL = "postgresql://postgres.fwqlybthyegaakblnrgx:salemdu94190@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
# =================================================

def count_file_lines(filename):
    try:
        with open(filename, "rb") as f:
            return sum(1 for _ in f) - 1
    except: return 0

def process_batch(cur, batch_data):
    csv_io = io.StringIO()
    writer = csv.writer(csv_io)
    writer.writerows(batch_data)
    csv_io.seek(0)
    
    # 1. On charge le paquet dans la table temporaire
    cur.execute("TRUNCATE TABLE raw_import;")
    cur.copy_expert("COPY raw_import FROM STDIN WITH CSV", csv_io)
    
    # 2. CATÉGORIES
    cur.execute("""
        INSERT INTO "Category" (id, nom)
        SELECT DISTINCT category_id, category_nom
        FROM raw_import 
        WHERE category_id IS NOT NULL AND category_id != ''
        ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom;
    """)

    # 3. MAGASINS
    cur.execute("""
        INSERT INTO "Store" (id, nom, enseigne, "noPL", "noPR", ville, cp, lat, lng, "lastScrapedAt")
        SELECT DISTINCT ON (store_noPL)
            store_noPL,   
            store_nom, 'Leclerc', store_noPL, store_noPR, 
            store_ville, store_cp, 
            NULLIF(store_lat, '')::float, NULLIF(store_lng, '')::float, 
            NOW()
        FROM raw_import 
        ON CONFLICT (id) DO UPDATE 
        SET ville = EXCLUDED.ville, cp = EXCLUDED.cp, nom = EXCLUDED.nom;
    """)
    
    # 4. PRODUITS
    cur.execute("""
        INSERT INTO "Product" (id, nom, image, "categoryId")
        SELECT DISTINCT ON (product_id)
            product_id, nom, image, category_id 
        FROM raw_import
        ON CONFLICT (id) DO UPDATE 
        SET nom = EXCLUDED.nom, image = EXCLUDED.image, "categoryId" = EXCLUDED."categoryId"; 
    """)
    
    # 5. PRIX
    cur.execute("""
        INSERT INTO "Price" (id, valeur, promo, "unitPrice", "productId", "storeId", "updatedAt")
        SELECT DISTINCT ON (r.product_id, r.store_noPL)
            gen_random_uuid(),
            NULLIF(r.prix, '')::float, NULLIF(r.promo, '')::float, r.unit_price,
            r.product_id, r.store_noPL, 
            NOW()
        FROM raw_import r
        ON CONFLICT ("productId", "storeId") 
        DO UPDATE SET valeur = EXCLUDED.valeur, promo = EXCLUDED.promo, "updatedAt" = NOW();
    """)

def main():
    print("🚀 Démarrage de l'import (Mode ANTI-TIMEOUT)...")

    conn = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        # === 🛑 CORRECTIF TIMEOUT IMPORTANT ===
        # On dit à Supabase : "Laisse-moi tout le temps qu'il faut" (0 = infini)
        print("🔓 Déverrouillage de la limite de temps (statement_timeout)...")
        cur.execute("SET statement_timeout = 0;") 
        # ======================================
        
        # Nettoyage initial (On repart de zéro pour être propre)
        print("🧹 Nettoyage de la base...")
        cur.execute('TRUNCATE TABLE "Price", "Product", "Store", "Category" RESTART IDENTITY CASCADE;')
        conn.commit()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS raw_import (
                product_id TEXT, nom TEXT, prix TEXT, promo TEXT, unit_price TEXT, 
                image TEXT, category_id TEXT, category_nom TEXT,
                store_noPL TEXT, store_noPR TEXT, store_nom TEXT, 
                store_ville TEXT, store_cp TEXT, store_lat TEXT, store_lng TEXT
            );
        """)
        conn.commit()

        total_lines = count_file_lines(CSV_FILE)
        print(f"📦 Total : {total_lines:,} lignes.")

        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            batch = []
            processed = 0
            start = time.time()
            
            for row in reader:
                batch.append(row)
                if len(batch) >= BATCH_SIZE:
                    process_batch(cur, batch)
                    conn.commit()
                    processed += len(batch)
                    batch = []
                    elapsed = time.time() - start
                    speed = processed / elapsed if elapsed > 0 else 0
                    # On affiche toutes les 5 secondes pour pas spammer la console
                    print(f"✅ {processed:,}/{total_lines:,} - {int(speed)} lig/s")

            if batch:
                process_batch(cur, batch)
                conn.commit()

        print("\n🎉 TERMINÉ ! Plus d'erreurs.")

    except Exception as e:
        print(f"\n❌ ERREUR : {e}")
        if conn: conn.rollback()
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    main()