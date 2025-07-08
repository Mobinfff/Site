import Link from 'next/link';
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/Button'; // Assuming Button component is created

// TODO: Add icons (e.g., from lucide-react or heroicons)
// import { Search, UserCircle, Sun, Moon, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, loading } = useAuth(); // Use AuthContext
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  // const [isClient, setIsClient] = React.useState(false); // For handling hydration mismatch if theme is from localStorage initially

  // useEffect(() => {
  //   setIsClient(true);
  //   // Initialize theme based on localStorage or system preference
  //   const savedTheme = localStorage.getItem('theme');
  //   if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  //     document.documentElement.classList.add('dark');
  //     setIsDarkMode(true);
  //   } else {
  //     document.documentElement.classList.remove('dark');
  //     setIsDarkMode(false);
  //   }
  // }, []);


  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    // localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    if (newIsDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Avoid rendering theme-dependent UI on server or during first client render if theme is from localStorage
  // if (!isClient && !loading) { // Also check auth loading to avoid flicker
  //   return <nav className="h-16 bg-gray-200 dark:bg-gray-900"></nav>; // Placeholder or skeleton
  // }


  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Branding */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary dark:text-primary-light">
              فیت‌کلاب
            </Link>
          </div>

          {/* Search Bar (Placeholder) - Can be a separate component */}
          <div className="hidden md:flex flex-grow max-w-md mx-4 lg:max-w-xl">
            <div className="relative w-full group">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary dark:group-focus-within:text-primary-light">
                {/* <Search size={18} /> */}
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="جستجوی باشگاه، ورزش و..."
                className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation Links and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse"> {/* space-x-reverse for RTL */}
            <Link href="/clubs/search" className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
              باشگاه‌ها
            </Link>

            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light"
            >
              {isDarkMode ? (
                // <Sun size={22} />
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                // <Moon size={22} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </Button>

            {loading ? (
              <div className="w-28 h-9 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div> // Skeleton loader for auth button
            ) : isAuthenticated && user ? (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2 space-x-reverse">
                  {/* <UserCircle size={24} className="text-gray-700 dark:text-gray-300" /> */}
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700 dark:text-gray-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{user.first_name || user.phone_number}</span>
                </Button>
                {/* Dropdown Menu - Simple version */}
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 invisible group-hover:visible transition-all duration-150 ease-in-out origin-top-left">
                  <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">داشبورد</Link>
                  <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">پروفایل</Link>
                  {user.role === 'CLUB_OWNER' && <Link href="/club-owner/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">پنل باشگاه‌دار</Link>}
                  {user.role === 'ADMIN' && <Link href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">پنل ادمین</Link>}
                  <button
                    onClick={logout}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700/30"
                  >
                    {/* <LogOut size={16} className="inline ml-1" /> */}
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline ml-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                    </svg>
                    خروج
                  </button>
                </div>
              </div>
            ) : (
              <Button href="/login" variant="primary" size="md">
                ورود / ثبت‌نام
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
