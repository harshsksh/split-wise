import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken, authCookieOptions } from '@/app/lib/auth';
import Link from 'next/link';

export default async function Home() {
  const { name: cookieName } = authCookieOptions();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const payload = verifyAuthToken(token);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to ExpenseSplitter
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                The easiest way to split expenses with roommates and groups
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Go to Dashboard
              </Link>
              
              <Link
                href="/login"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Switch Account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Logged in as: {payload.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    redirect('/login');
  }
}
