'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthCookie } from '@/app/lib/auth';

interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  createdAt: Date;
}

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        // Clear client-side cookie as well
        clearAuthCookie();
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
      // Still clear cookie and redirect even if logout fails
      clearAuthCookie();
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-indigo-100 rounded-full p-3">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user.name || user.username}
          </h2>
          <p className="text-gray-600">@{user.username}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Email:</span>
          <span className="font-medium">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Username:</span>
          <span className="font-medium">@{user.username}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Member since:</span>
          <span className="font-medium">
            {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
      >
        {loading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
}
