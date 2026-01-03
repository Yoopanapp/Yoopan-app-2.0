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
        {/* On enveloppe TOUT avec la Session pour que l'auth marche partout */}
        <SessionWrapper>
            
            <FlyToCartProvider>
              <UserLocationProvider>
                <UserProvider>
                  <CartProvider>
                    
                    {/* Le gardien de l'URL */}
                    <StorePersistence />

                    {children}

                    <FlyingOverlay />
                    
                  </CartProvider>
                </UserProvider>
              </UserLocationProvider>
            </FlyToCartProvider>

        </SessionWrapper>
      </body>
    </html>
  );
}