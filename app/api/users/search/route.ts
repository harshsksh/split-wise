import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ],
        NOT: {
          id: user.id // Exclude current user from search results
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true
      },
      take: 10, // Limit results
      orderBy: {
        username: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
