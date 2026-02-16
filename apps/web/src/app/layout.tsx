import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'MYL Platform',
  description: 'Construye mazos validos. Decide con datos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
