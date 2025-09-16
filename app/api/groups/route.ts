import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const { name, description, memberIds } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Create the group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        creatorId: user.id,
        members: {
          create: [
            // Add creator as first member
            {
              userId: user.id,
              isAdmin: true
            },
            // Add other members
            ...(memberIds?.filter((id: string) => id !== user.id).map((id: string) => ({
              userId: id,
              isAdmin: false
            })) || [])
          ]
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        },
        _count: {
          select: {
            expenses: true,
            members: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
