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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: set data-theme before paint based on saved preference or OS */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var s=localStorage.getItem('theme');var t=s||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var d=document.documentElement;if(d.getAttribute('data-theme')!==t){d.setAttribute('data-theme',t)}}catch(e){}}();`,
          }}
        />
        {/* Optional color-scheme hint for UA default widgets */}
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}