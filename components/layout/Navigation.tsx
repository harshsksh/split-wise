'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { clearAuthCookie } from '@/app/lib/auth';
import Logo from './Logo';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Groups' },
    { href: '/dashboard/friends', label: 'Friends' },
    { href: '/dashboard/activity', label: 'Activity' },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear client-side cookie as well
        clearAuthCookie();
        // Redirect to login page after successful logout
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
        // Still redirect to login page even if logout fails
        clearAuthCookie();
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Redirect to login page even if there's an error
      clearAuthCookie();
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* App Logo */}
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/profile"
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
