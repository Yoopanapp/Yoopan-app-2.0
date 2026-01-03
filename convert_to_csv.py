import json
import csv
import os
import glob
import time

# ================= CONFIGURATION =================
DOSSIER_PRODUITS = 'donnees_leclerc_light' 
FICHIER_STORES_INFO = os.path.join('app', 'data', 'leclerc_stores.json')
FICHIER_MENU = os.path.join(DOSSIER_PRODUITS, '_MENU_SITE.json')
FICHIER_SORTIE = 'IMPORT_SUPABASE.csv'
# =================================================

def charger_menu_categories():
    print(f"📚 Chargement du menu des catégories...")
    categories_map = {}
    if os.path.exists(FICHIER_MENU):
        try:
            with open(FICHIER_MENU, 'r', encoding='utf-8') as f:
                menu = json.load(f)
            def explorer(items):
                for item in items:
                    cat_id = str(item.get('id'))
                    cat_nom = item.get('nom') or item.get('libelle')
                    if cat_id and cat_nom:
                        categories_map[cat_id] = cat_nom
                    if 'familles' in item: explorer(item['familles'])
                    if 'sous_familles' in item: explorer(item['sous_familles'])
            explorer(menu)
            print(f"   -> {len(categories_map)} catégories trouvées.")
        except Exception: pass
    return categories_map

def charger_infos_magasins():
    print(f"📍 Chargement des infos magasins...")
    stores_map = {}
    if os.path.exists(FICHIER_STORES_INFO):
        try:
            with open(FICHIER_STORES_INFO, 'r', encoding='utf-8') as f:
                stores_list = json.load(f)
            for s in stores_list:
                key = s.get('noPL') or s.get('id')
                if key:
                    stores_map[key] = {
                        'ville': s.get('city') or s.get('ville') or s.get('name'),
                        'cp': s.get('postalCode') or s.get('zipCode'),
                        'lat': s.get('latitude') or s.get('lat'),
                        'lng': s.get('longitude') or s.get('lng')
                    }
        except Exception: pass
    return stores_map

def main():
    print("\n" + "="*50)
    print("🚀 DÉMARRAGE DE LA CONVERSION CSV")
    print("="*50)

    categories_map = charger_menu_categories()
    infos_magasins = charger_infos_magasins()
    
    # Récupération de la liste des fichiers
    files = glob.glob(os.path.join(DOSSIER_PRODUITS, '*.json'))
    total_files = len(files)
    
    print(f"📂 {total_files} fichiers JSON trouvés à traiter.")
    print(f"📝 Écriture dans : {FICHIER_SORTIE}...\n")
    
    with open(FICHIER_SORTIE, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'product_id', 'nom', 'prix', 'promo', 'unit_price', 'image', 
            'category_id', 'category_nom', 
            'store_noPL', 'store_noPR', 'store_nom', 'store_ville', 'store_cp', 'store_lat', 'store_lng'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        total_lines = 0
        files_processed = 0
        start_time = time.time()

        for i, file_path in enumerate(files, 1):
            if "_MENU" in file_path: continue

            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                full_id = data.get('id', '0-0')
                if '-' in full_id: noPL, noPR = full_id.split('-')
                else: noPL = noPR = full_id

                info_geo = infos_magasins.get(noPL, {})
                ville = info_geo.get('ville', 'Inconnu')
                nom_magasin = f"Leclerc {ville}" if ville != 'Inconnu' else f"Leclerc {noPL}"
                
                products_in_file = 0

                for p in data.get('p', []):
                    if not p.get('p'): continue

                    cat_id = str(p.get('cat', ''))
                    cat_nom = categories_map.get(cat_id, "Autre")

                    writer.writerow({
                        'product_id': str(p.get('id')),
                        'nom': p.get('n'),
                        'prix': p.get('p'),
                        'promo': p.get('pp', ''),
                        'unit_price': p.get('u', ''),
                        'image': p.get('img', ''),
                        'category_id': cat_id,
                        'category_nom': cat_nom,
                        'store_noPL': noPL,
                        'store_noPR': noPR,
                        'store_nom': nom_magasin,
                        'store_ville': ville,
                        'store_cp': info_geo.get('cp', ''),
                        'store_lat': info_geo.get('lat', ''),
                        'store_lng': info_geo.get('lng', '')
                    })
                    total_lines += 1
                    products_in_file += 1
                
                files_processed += 1
                
                # AFFICHE LA PROGRESSION TOUS LES 10 FICHIERS (pour pas spammer)
                # OU pour chaque fichier si tu préfères
                print(f"✅ [{i}/{total_files}] {nom_magasin} : +{products_in_file} produits")

            except Exception as e: 
                print(f"❌ Erreur sur {file_path}: {e}")

    duration = time.time() - start_time
    print("\n" + "="*50)
    print(f"🎉 TERMINÉ en {int(duration)} secondes !")
    print(f"📦 Total : {total_lines:,} lignes générées dans le CSV.")
    print("="*50)

if __name__ == "__main__":
    main()