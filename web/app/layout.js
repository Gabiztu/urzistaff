import './globals.css'

export const metadata = {
  title: 'Urzistaff',
  description: 'Virtual Assistant marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: '#0B0A10', color: '#E5E7EB' }}>{children}</body>
    </html>
  )
}
