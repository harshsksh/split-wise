import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const { fromUserId, toUserId, groupId, amount } = await request.json();

    if (!fromUserId || !toUserId || !groupId || !amount) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Verify user is member of the group
    const groupMember = await prisma.groupMember.findFirst({
      where: {
        userId: user.id,
        groupId: groupId
      }
    });

    if (!groupMember) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Create the settlement
    const settlement = await prisma.settlement.create({
      data: {
        fromUserId,
        toUserId,
        groupId,
        amount: parseFloat(amount),
        status: 'PENDING'
      },
      include: {
        fromUser: {
          select: { id: true, name: true, username: true }
        },
        toUser: {
          select: { id: true, name: true, username: true }
        },
        group: {
          select: { id: true, name: true }
        }
      }
    });

    // Validate the created settlement has all required relationships
    if (!settlement.fromUser || !settlement.toUser || !settlement.group) {
      console.error('Created settlement missing relationships:', settlement);
      return NextResponse.json({ error: 'Failed to create settlement with proper relationships' }, { status: 500 });
    }

    // Validate the updated settlement has all required relationships
    if (!settlement.fromUser || !settlement.toUser || !settlement.group) {
      console.error('Updated settlement missing relationships:', settlement);
      return NextResponse.json({ error: 'Failed to update settlement with proper relationships' }, { status: 500 });
    }

    return NextResponse.json(settlement);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating settlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    const whereClause: Prisma.SettlementWhereInput = {
      OR: [
        { fromUserId: user.id },
        { toUserId: user.id }
      ]
    };

    if (groupId) {
      whereClause.groupId = groupId;
    }

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: {
        fromUser: {
          select: { id: true, name: true, username: true }
        },
        toUser: {
          select: { id: true, name: true, username: true }
        },
        group: {
          select: { id: true, name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter out settlements with missing relationships (data integrity check)
    const validSettlements = settlements.filter(settlement => 
      settlement.fromUser && settlement.toUser && settlement.group
    );

    // Log any invalid settlements for debugging
    if (settlements.length !== validSettlements.length) {
      console.warn(`Found ${settlements.length - validSettlements.length} invalid settlements`);
    }

    return NextResponse.json(validSettlements);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Settlement ID and status are required' }, { status: 400 });
    }

    // Update the settlement
    const settlement = await prisma.settlement.update({
      where: { id },
      data: {
        status,
        settledAt: status === 'COMPLETED' ? new Date() : null
      },
      include: {
        fromUser: {
          select: { id: true, name: true, username: true }
        },
        toUser: {
          select: { id: true, name: true, username: true }
        },
        group: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(settlement);
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
