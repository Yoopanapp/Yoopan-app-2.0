import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { FlyToCartProvider } from './context/FlyToCartContext';
import FlyingOverlay from './components/FlyingOverlay';
// 1. IMPORT DU NOUVEAU PROVIDER GPS
import { UserLocationProvider } from './context/UserLocationContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YooPan - Comparateur Local',
  description: 'Vos courses au vrai prix.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* On enveloppe tout avec le FlyToCartProvider */}
        <FlyToCartProvider>
          {/* 2. ON AJOUTE LE GPS ICI POUR QU'IL SOIT DISPO PARTOUT */}
          <UserLocationProvider>
            <UserProvider>
              <CartProvider>
                
                {children}

                {/* L'overlay doit être ici, après children, pour être par-dessus tout */}
                <FlyingOverlay />
                
              </CartProvider>
            </UserProvider>
          </UserLocationProvider>
        </FlyToCartProvider>
      </body>
    </html>
  );
}