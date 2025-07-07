import Link from 'next/link';
import React from 'react';

// TODO: Add icons (e.g., from lucide-react or heroicons)
// import { Search, UserCircle, Sun, Moon } from 'lucide-react';

const Navbar: React.FC = () => {
  // Placeholder for theme toggle and auth status
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="bg-primary-light dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Branding */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-primary-dark dark:text-primary-light">
              FitClub
            </Link>
          </div>

          {/* Search Bar (Placeholder) - Can be a separate component */}
          <div className="hidden md:flex flex-grow max-w-xl mx-4">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="جستجوی باشگاه، ورزش..."
                className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light"
              />
              <button className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 dark:text-gray-400">
                {/* <Search size={20} /> */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Links and Actions */}
          <div className="flex items-center space-x-3 space-x-reverse"> {/* space-x-reverse for RTL */}
            <Link href="/clubs/search" className="text-gray-700 dark:text-gray-300 hover:text-primary-dark dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium">
              باشگاه‌ها
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                // <Sun size={20} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                // <Moon size={20} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <Link href="/dashboard" className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                {/* <UserCircle size={24} /> */}
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
              </Link>
            ) : (
              <Link href="/login" className="text-white bg-primary hover:bg-primary-dark dark:bg-primary-dark dark:hover:bg-primary focus:ring-4 focus:ring-primary-light font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                ورود / ثبت‌نام
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
