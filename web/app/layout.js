import './globals.css'
import ThemeToggle from './components/ThemeToggle'
import Script from 'next/script'

export const metadata = {
  title: 'Urzistaff',
  description: 'Virtual Assistant marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var t = localStorage.getItem('theme');
              if (!t && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
              document.documentElement.setAttribute('data-theme', t || 'light');
            } catch (e) { document.documentElement.setAttribute('data-theme', 'light'); }
          `}
        </Script>
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
