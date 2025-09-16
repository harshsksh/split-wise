import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

// GET - Get current user's friends
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

    return NextResponse.json({
      friends: friends.map(friend => ({
        id: friend.id,
        friend: friend.friend,
        createdAt: friend.createdAt
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add friend by username
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Find the user by username
    const friendUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!friendUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (friendUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 });
    }

    // Check if already friends
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: user.id,
          friendId: friendUser.id
        }
      }
    });

    if (existingFriend) {
      return NextResponse.json({ error: 'Already friends with this user' }, { status: 400 });
    }

    // Add friend
    const friend = await prisma.friend.create({
      data: {
        userId: user.id,
        friendId: friendUser.id
      },
      include: {
        friend: {
          select: { id: true, name: true, username: true, email: true }
        }
      }
    });

    return NextResponse.json(friend);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adding friend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove friend
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
    }

    // Remove friend
    await prisma.friend.deleteMany({
      where: {
        userId: user.id,
        friendId: friendId
      }
    });

    return NextResponse.json({ message: 'Friend removed successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error removing friend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
