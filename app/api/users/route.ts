import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
