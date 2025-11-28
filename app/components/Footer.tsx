// app/components/Footer.tsx
import { Logo } from './logo';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Colonne Marque */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold text-slate-900">Yoo<span className="text-blue-600">Pan</span></span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Le premier comparateur de supermarché 100% indépendant et open-source.
            Arrêtez de payer le marketing, payez le produit.
          </p>
        </div>

        {/* Colonnes Liens */}
        <div>
          <h4 className="font-bold text-slate-900 mb-4">Produits</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/?q=Bio" className="hover:text-blue-600">Bio & Écologie</Link></li>
            <li><Link href="/?q=Bébé" className="hover:text-blue-600">Bébé</Link></li>
            <li><Link href="/?q=Boissons" className="hover:text-blue-600">Boissons</Link></li>
            <li><Link href="/?q=Hygiène" className="hover:text-blue-600">Hygiène</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4">Légal</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="#" className="hover:text-blue-600">Mentions Légales</Link></li>
            <li><Link href="#" className="hover:text-blue-600">Confidentialité</Link></li>
            <li><Link href="#" className="hover:text-blue-600">Source des données</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4">Crédits</h4>
          <p className="text-xs text-slate-400">
            Données produits fournies par <a href="https://fr.openfoodfacts.org/" target="_blank" className="underline hover:text-blue-600">Open Food Facts</a> sous licence ODbL.
          </p>
          <div className="mt-4 flex gap-4">
            {/* Fake Social Icons */}
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer">𝕏</div>
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition-colors cursor-pointer">In</div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-slate-50 text-center text-slate-400 text-sm">
        © 2025 YooPan Inc. Fait avec ❤️ à Paris.
      </div>
    </footer>
  );
}