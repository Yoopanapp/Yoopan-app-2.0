import json
import time
import os
import re
import sys
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================
# 1. CONFIGURATION
# ==========================================
FICHIER_MAGASINS = 'id et nom magasin leclerc.txt'
DOSSIER_SORTIE = 'donnees_leclerc_light'
FICHIER_MENU = os.path.join(DOSSIER_SORTIE, '_MENU_SITE.json')
DELAI_EXPIRATION_HEURES = 24 

# ID DU BOSS FINAL (SAINT-MÉDARD)
REF_PL = "123311"
REF_PR = "123311"

if not os.path.exists(DOSSIER_SORTIE):
    os.makedirs(DOSSIER_SORTIE)

# URL API
URL_PRODUITS = (
    "https://fd2-m.leclercdrive.fr/{noPL}-{noPR}/assortiment.ashz"
    "?DeviceId=e383e88a-68e7-3574-8e27-a08dc6e84cfb"
    "&Terminal=13&Model=SONY+XQ-AQ52&OS=9&Ver=27.2.1"
    "&Build=2027020101&Config=FRANCE&Lang=fr&Locale=fr-FR"
    "&Accessible=0&visiteur=1&AppTheme=Light"
    "&Signature=LRKTJwEBuABGjg3T9nwZtJvnFTQGKD39v8btqOoTYms%3d"
)

URL_RAYONS = (
    "https://fd2-m.leclercdrive.fr/{noPL}-{noPR}/rayons.ashz"
    "?DeviceId=e383e88a-68e7-3574-8e27-a08dc6e84cfb"
    "&Terminal=13&Model=SONY+XQ-AQ52&OS=9&Ver=27.2.1"
    "&Build=2027020101&Config=FRANCE&Lang=fr&Locale=fr-FR"
    "&Accessible=0&visiteur=1&AppTheme=Light"
    "&Signature=ErQEKMQX3OCTvq9HrR8M1wz2OkEdjngIGbZikrNBwzM%3d"
)

# ==========================================
# 2. FONCTIONS
# ==========================================

def nettoyer_nom_fichier(texte):
    return re.sub(r'[^\w\s-]', '_', texte).strip()

def fichier_est_recent(chemin_fichier):
    if not os.path.exists(chemin_fichier): return False
    return (time.time() - os.path.getmtime(chemin_fichier)) / 3600 < DELAI_EXPIRATION_HEURES

def extraire_menu_propre(json_rayons):
    """
    Récupère TOUT : Rayons, Bons Plans, Promos, Autres.
    """
    menu = []
    
    # Liste des sections à aspirer dans le JSON source
    sections_a_traiter = ['Rayons', 'BonsPlans', 'Promos', 'Autres']
    
    for section in sections_a_traiter:
        liste_items = json_rayons.get(section, [])
        
        # On parcourt chaque élément de la section (ex: "Rayons" ou "Bons Plans")
        for item in liste_items:
            nom_item = item.get('Nom') or item.get('Libelle') or "Inconnu"
            
            # On ajoute un préfixe pour s'y retrouver dans le menu (Optionnel, tu peux l'enlever)
            # Ex: "PROMO - Toutes les promos"
            if section == 'Promos':
                nom_final = f"PROMO - {nom_item}"
            elif section == 'BonsPlans':
                nom_final = f"BON PLAN - {nom_item}"
            else:
                nom_final = nom_item

            r_obj = { 
                "id": item.get('Id'), 
                "nom": nom_final,
                "section": section, # On garde l'info de l'origine (Rayon/Promo...)
                "familles": [] 
            }
            
            # Niveau 2 : Familles
            liste_familles = item.get('Familles', [])
            for famille in liste_familles:
                nom_famille = famille.get('Nom') or famille.get('Libelle') or "Inconnu"
                
                f_obj = { 
                    "id": famille.get('Id'), 
                    "nom": nom_famille, 
                    "sous_familles": [] 
                }
                
                # Niveau 3 : Sous-Familles
                liste_sous_familles = famille.get('SousFamilles', [])
                for sf in liste_sous_familles:
                    nom_sf = sf.get('Nom') or sf.get('Libelle') or "Inconnu"
                    
                    f_obj["sous_familles"].append({ 
                        "id": sf.get('Id'), 
                        "nom": nom_sf 
                    })
                
                r_obj["familles"].append(f_obj)
            
            menu.append(r_obj)
            
    return menu

def extraire_produits_light(json_brut):
    liste_finale = []
    
    def trouver_produits(data):
        items = []
        if isinstance(data, dict):
            if 'Id' in data and ('Libelle1' in data or 'Libelle' in data):
                try:
                    prix = None
                    prix_promo = None
                    
                    if isinstance(data.get('Prix'), dict): prix = data['Prix'].get('Montant')
                    else: prix = data.get('Prix')
                        
                    if isinstance(data.get('PrixPromo'), dict): prix_promo = data['PrixPromo'].get('Montant')
                    else: prix_promo = data.get('PrixPromo')

                    if prix is not None:
                        produit_light = {
                            'id': data.get('Id'),
                            'n': f"{data.get('Libelle1', '')} {data.get('Libelle2', '')}".strip(),
                            'p': prix,
                            'pp': prix_promo if (prix_promo and prix_promo < prix) else None,
                            'u': data.get('InfoPrix'),
                            'img': data.get('URLPhotoListe'),
                            'cat': data.get('IdSousFamillePrincipale')
                        }
                        if produit_light['pp'] is None: del produit_light['pp']
                        if not produit_light['u']: del produit_light['u']
                        
                        items.append(produit_light)
                except: pass
            
            for key, value in data.items():
                items.extend(trouver_produits(value))
        elif isinstance(data, list):
            for item in data:
                items.extend(trouver_produits(item))
        return items

    return trouver_produits(json_brut)

# ==========================================
# 3. MOTEUR
# ==========================================

def lancer_scraper():
    print("\n" + "#"*60)
    print(f"   SCRAPER ULTIME - ST-MÉDARD ({REF_PL}) + PROMOS   ")
    print("#"*60)
    
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # --- ETAPE 1 : MENU COMPLET ---
        if not os.path.exists(FICHIER_MENU):
            URL_MENU_REF = URL_RAYONS.format(noPL=REF_PL, noPR=REF_PR)
            print(f"\n[PHASE 1] Téléchargement du Menu (Rayons + Promos)...")
            driver.get(URL_MENU_REF)
            
            print("\n>>> FAITES LE PUZZLE SI BESOIN <<<")
            while True:
                try:
                    body = driver.find_element(By.TAG_NAME, "body").text
                    if "{" in body and ("Rayons" in body or "rayons" in body):
                        print("-> Accès validé !")
                        break
                    time.sleep(1)
                except: pass

            try:
                json_complet = json.loads(driver.find_element(By.TAG_NAME, "body").text)
                menu_propre = extraire_menu_propre(json_complet)
                
                with open(FICHIER_MENU, 'w', encoding='utf-8') as f:
                    json.dump(menu_propre, f, ensure_ascii=False, separators=(',', ':'))
                
                print(f"[SUCCÈS] Menu enregistré : {len(menu_propre)} catégories (dont Promos).")
            except Exception as e:
                print(f"[ERREUR MENU] : {e}")
                sys.exit()
        else:
            print("\n[PHASE 1] Menu déjà présent.")

        # --- ETAPE 2 : MAGASINS ---
        with open(FICHIER_MAGASINS, 'r', encoding='utf-8') as f:
            liste_magasins = json.load(f)

        print(f"\n[PHASE 2] Scraping des {len(liste_magasins)} magasins...")

        for i, magasin in enumerate(liste_magasins):
            no_pl = magasin.get('noPL')
            no_pr = magasin.get('noPR')
            nom_brut = magasin.get('name', 'Inconnu')
            nom_fichier = nettoyer_nom_fichier(nom_brut)
            
            if not no_pl or not no_pr: continue

            chemin_final = f"{DOSSIER_SORTIE}/{nom_fichier}_{no_pl}_{no_pr}.json"
            
            if fichier_est_recent(chemin_final):
                print(f"[{i+1}/{len(liste_magasins)}] Déjà fait : {nom_brut}")
                continue

            url = URL_PRODUITS.format(noPL=no_pl, noPR=no_pr)
            print(f"[{i+1}/{len(liste_magasins)}] {nom_brut}...", end="\r")
            
            try:
                driver.get(url)
                
                if "Access Denied" in driver.title:
                    print(f"\n[PAUSE] Puzzle requis...")
                    while "{" not in driver.find_element(By.TAG_NAME, "body").text:
                        time.sleep(1)
                    print("-> Reprise.")

                content = driver.find_element(By.TAG_NAME, "body").text
                if "{" in content:
                    json_lourd = json.loads(content)
                    produits_light = extraire_produits_light(json_lourd)
                    
                    data_magasin = {
                        "id": f"{no_pl}-{no_pr}",
                        "dt": time.strftime("%Y-%m-%d"),
                        "p": produits_light
                    }
                    
                    with open(chemin_final, 'w', encoding='utf-8') as f:
                        json.dump(data_magasin, f, ensure_ascii=False, separators=(',', ':'))
                        
                    taille_mo = os.path.getsize(chemin_final) / (1024 * 1024)
                    print(f"[{i+1}/{len(liste_magasins)}] OK : {nom_brut} -> {len(produits_light)} pdts ({taille_mo:.2f} Mo)   ")
                else:
                    print(f"[{i+1}] Erreur JSON.")
            except Exception as e:
                print(f"[{i+1}] Erreur : {e}")
            time.sleep(random.uniform(2, 4))

    except Exception as e:
        print(f"Erreur : {e}")
    finally:
        try: driver.quit()
        except: pass

if __name__ == "__main__":
    lancer_scraper()