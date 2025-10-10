// web/app/layout.js

import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Configure the fonts from your index.html
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});


export const metadata = {
  // This is from your index.html <title> tag
  title: 'Urzistaff — The Art of Assistance',
  // This is from your index.html <meta name="description"> tag
  description: 'Find your perfect virtual partner. A curated marketplace for elite, vetted Virtual Assistants.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/*
        The className here applies the 'Inter' font to your whole page.
        Next.js also makes sure the 'Space Grotesk' font is loaded, so your CSS can use it.
      */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}