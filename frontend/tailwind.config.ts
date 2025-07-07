import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Next.js App Router
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Next.js Pages Router (if used)
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Or if using `src` directory:
    // "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // or 'media' if you prefer OS-level dark mode detection
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', "Segoe UI", 'Roboto', "Helvetica Neue", 'Arial', "Noto Sans", 'sans-serif', "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"],
      },
      colors: {
        // Define your color palette here
        primary: {
          light: '#67e8f9', // Example: lighter cyan
          DEFAULT: '#06b6d4', // Example: cyan-600
          dark: '#0e7490',  // Example: darker cyan
        },
        secondary: {
          light: '#f9a8d4', // Example: lighter pink
          DEFAULT: '#ec4899', // Example: pink-500
          dark: '#be185d',  // Example: darker pink
        },
        // Add other colors like success, error, warning, info, background, text colors etc.
        background: {
          light: '#ffffff',
          dark: '#1a202c', // Example dark background
        },
        text: {
          light: '#1f2937', // Example light mode text
          dark: '#e2e8f0',  // Example dark mode text
        }
      },
      // You can extend other theme properties like spacing, borderRadius, etc.
      // Example for custom spacing for Persian UI (adjust as needed)
      // spacing: {
      //   '4.5': '1.125rem', // 18px
      // },
    },
  },
  plugins: [
    // require('@tailwindcss/forms'), // If you need form styling resets
    // require('@tailwindcss/typography'), // If you need prose styling
  ],
};
export default config;
