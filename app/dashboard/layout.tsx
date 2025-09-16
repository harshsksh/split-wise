import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { verifyAuthToken, authCookieOptions } from '@/app/lib/auth';
import Navigation from '@/components/layout/Navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { name: cookieName } = authCookieOptions();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true, name: true, createdAt: true },
    });

    if (!user) {
      redirect('/login');
    }

    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 pt-16">
          {children}
        </div>
      </>
    );
  } catch {
    redirect('/login');
  }
}
