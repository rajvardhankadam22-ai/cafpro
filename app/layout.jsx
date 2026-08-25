import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata = {
  title: 'CaféPulse - Specialty Coffee Inventory & B2B Procurement Platform',
  description:
    'Real-time inventory management, staff floor PIN access, automated PAR reorders, and wholesale supplier procurement platform for specialty cafés.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('cafepulse_theme');
                if (theme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans bg-cafe-50 dark:bg-espresso-950 text-espresso-900 dark:text-cafe-50 antialiased selection:bg-caramel-500 selection:text-white transition-colors duration-200">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
