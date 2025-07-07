import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Default font, can be replaced
import localFont from 'next/font/local' // For local fonts like Vazirmatn
import '../styles/globals.css'; // Import global styles (including Tailwind)
import Navbar from '@/components/layout/Navbar'; // Assuming @ is configured for src or root
import Footer from '@/components/layout/Footer';
// import ThemeProvider from '@/contexts/ThemeProvider'; // Example for a theme provider context

// Configure a local font (e.g., Vazirmatn)
// Download Vazirmatn fonts and place them in `public/fonts` or `app/fonts`
const vazirmatn = localFont({
  src: [
    {
      path: '../public/fonts/Vazirmatn-Thin.woff2', // Adjust path as needed
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-vazirmatn', // CSS variable name
  display: 'swap', // Ensures text is visible while font loads
});


export const metadata: Metadata = {
  title: {
    default: 'فیت‌کلاب | رزرو آنلاین باشگاه‌های ورزشی',
    template: '%s | فیت‌کلاب',
  },
  description: 'فیت‌کلاب، پلتفرم جامع جستجو، مقایسه و رزرو آنلاین باشگاه‌ها و سانس‌های ورزشی در ایران.',
  keywords: ['باشگاه ورزشی', 'رزرو آنلاین', 'فیتنس', 'بدنسازی', 'یوگا', 'پیلاتس', 'فیت‌کلاب'],
  // Add other metadata like openGraph, twitter, etc.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}> {/* Set lang, dir, and font variable */}
      <body className="font-sans antialiased"> {/* Use font-sans which can be configured in tailwind.config.ts */}
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}

// In tailwind.config.ts, you would then use this variable:
// theme: {
//   extend: {
//     fontFamily: {
//       sans: ['var(--font-vazirmatn)', 'system-ui', 'sans-serif'],
//     },
//   },
// },

// Note: For the localFont to work, you need to have the font files (.woff2)
// in the specified path (e.g., `frontend/public/fonts/`).
// I cannot create these font files, so this setup assumes they exist.
// If they don't, Next.js will throw an error during build or dev.
// As a fallback, you can use a Google Font or system fonts.
// For example, using Inter font from next/font/google:
// const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
// And then use `className={inter.variable}` and configure `fontFamily.sans` accordingly.
// For Persian UI, Vazirmatn is a good choice.
// I have configured it assuming the files will be added.
// If not, please instruct to switch to a web font like Inter or a system font stack.
