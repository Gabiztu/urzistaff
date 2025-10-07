import './globals.css'

export const metadata = {
  title: 'Urzistaff',
  description: 'Virtual Assistant marketplace',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
