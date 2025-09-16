import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Get user's friends
    const friends = await prisma.friend.findMany({
      where: {
        userId: user.id
      },
      include: {
        friend: {
          select: { id: true, name: true, username: true, email: true }
        }
      }
    });

    // Transform friends data to show friend info
    const friendsList = friends.map(friend => ({
      id: friend.friend.id, // Use the friend's user ID, not the Friend record ID
      name: friend.friend.name,
      username: friend.friend.username,
      email: friend.friend.email
    }));

    return NextResponse.json(friendsList);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
