import './globals.css'

export const metadata = {
  title: 'متجر كروت الواي فاي',
  description: 'شراء كروت الواي فاي أونلاين',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-100 min-h-screen text-gray-900">
        {children}
      </body>
    </html>
  )
}
