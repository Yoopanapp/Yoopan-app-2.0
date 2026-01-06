import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// --- TES IMPORTS EXISTANTS ---
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { FlyToCartProvider } from './context/FlyToCartContext';
import FlyingOverlay from './components/FlyingOverlay';
import { UserLocationProvider } from './context/UserLocationContext';
import StorePersistence from './components/StorePersistence';

// --- NOUVEL IMPORT AUTH ---
import { SessionWrapper } from './components/SessionWrapper'; 

// 👇 1. AJOUTE L'IMPORT ICI 👇
import MobileMenu from './components/MobileMenu'; 

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
        <SessionWrapper>
            
            <FlyToCartProvider>
              <UserLocationProvider>
                <UserProvider>
                  <CartProvider>
                    
                    {/* Le gardien de l'URL */}
                    <StorePersistence />

                    {children}

                    <FlyingOverlay />

                    {/* 👇 2. AJOUTE LE COMPOSANT ICI 👇 */}
                    {/* Il doit être DANS le CartProvider pour lire le nombre d'articles */}
                    <MobileMenu /> 
                    
                  </CartProvider>
                </UserProvider>
              </UserLocationProvider>
            </FlyToCartProvider>

        </SessionWrapper>
      </body>
    </html>
  );
}