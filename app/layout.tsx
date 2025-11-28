import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { FlyToCartProvider } from './context/FlyToCartContext'; // <--- IMPORT 1
import FlyingOverlay from './components/FlyingOverlay';         // <--- IMPORT 2

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
            <UserProvider>
              <CartProvider>
                
                {children}

                {/* L'overlay doit être ici, après children, pour être par-dessus tout */}
                <FlyingOverlay />
                
              </CartProvider>
            </UserProvider>
        </FlyToCartProvider>
      </body>
    </html>
  );
}