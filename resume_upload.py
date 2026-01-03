import psycopg2
import csv
import io
import time
import os

# ================= CONFIGURATION =================
CSV_FILE = 'IMPORT_SUPABASE.csv'

# 🐢 ON RALENTIT FORTEMENT POUR CALMER SUPABASE
BATCH_SIZE = 5000  

# Ton URL
DB_URL = "postgresql://postgres.fwqlybthyegaakblnrgx:salemdu94190@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# 🚨 METS ICI LE CHIFFRE OÙ TU T'ES ARRÊTÉ (Regarde tes derniers logs)
# Si tu étais à 8,500,000, mets 8500000
LIGNES_A_SAUTER = 7750000 
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
    
    cur.execute("TRUNCATE TABLE raw_import;")
    cur.copy_expert("COPY raw_import FROM STDIN WITH CSV", csv_io)
    
    # 1. Catégories
    cur.execute("""
        INSERT INTO "Category" (id, nom)
        SELECT DISTINCT category_id, category_nom FROM raw_import 
        WHERE category_id IS NOT NULL AND category_id != ''
        ON CONFLICT (id) DO NOTHING;
    """)

    # 2. Magasins
    cur.execute("""
        INSERT INTO "Store" (id, nom, enseigne, "noPL", "noPR", ville, cp, lat, lng, "lastScrapedAt")
        SELECT DISTINCT ON (store_noPL)
            store_noPL, store_nom, 'Leclerc', store_noPL, store_noPR, 
            store_ville, store_cp, NULLIF(store_lat, '')::float, NULLIF(store_lng, '')::float, NOW()
        FROM raw_import 
        ON CONFLICT (id) DO NOTHING;
    """)
    
    # 3. Produits
    cur.execute("""
        INSERT INTO "Product" (id, nom, image, "categoryId")
        SELECT DISTINCT ON (product_id)
            product_id, nom, image, category_id 
        FROM raw_import
        ON CONFLICT (id) DO NOTHING; 
    """)
    
    # 4. Prix
    cur.execute("""
        INSERT INTO "Price" (id, valeur, promo, "unitPrice", "productId", "storeId", "updatedAt")
        SELECT DISTINCT ON (r.product_id, r.store_noPL)
            gen_random_uuid(),
            NULLIF(r.prix, '')::float, NULLIF(r.promo, '')::float, r.unit_price,
            r.product_id, r.store_noPL, NOW()
        FROM raw_import r
        ON CONFLICT ("productId", "storeId") 
        DO UPDATE SET valeur = EXCLUDED.valeur, promo = EXCLUDED.promo, "updatedAt" = NOW();
    """)

def main():
    print(f"🐢 DÉMARRAGE DU MODE DOUCEUR...")
    print(f"⏭️  On saute les {LIGNES_A_SAUTER:,} lignes déjà faites.")

    conn = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("SET statement_timeout = 0;") 
        
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
        
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            
            if LIGNES_A_SAUTER > 0:
                print("⏳ Avance rapide... (Patience)")
                count = 0
                for _ in range(LIGNES_A_SAUTER):
                    next(reader, None)
                    count += 1
                    if count % 1000000 == 0:
                        print(f"   -> {count:,} lignes passées...")
                print("📍 Reprise !")

            batch = []
            processed = LIGNES_A_SAUTER
            start = time.time()
            
            for row in reader:
                batch.append(row)
                if len(batch) >= BATCH_SIZE:
                    process_batch(cur, batch)
                    conn.commit()
                    processed += len(batch)
                    batch = []
                    
                    elapsed = time.time() - start
                    speed = BATCH_SIZE / elapsed if elapsed > 0 else 0
                    print(f"✅ {processed:,}/{total_lines:,} - {int(speed)} lig/s (Mode Doux)")
                    
                    # 😴 LA PAUSE QUI SAUVE LA VIE
                    # On dort 0.5 seconde pour laisser le serveur refroidir
                    time.sleep(0.5) 
                    start = time.time() # On reset le timer pour ne pas fausser le calcul

            if batch:
                process_batch(cur, batch)
                conn.commit()

        print("\n🎉 TERMINÉ ! (Enfin)")

    except Exception as e:
        print(f"\n❌ ERREUR : {e}")
        if conn: conn.rollback()
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    main()