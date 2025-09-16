import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyAuthToken, authCookieOptions } from '@/app/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication using cookies
    const { name: cookieName } = authCookieOptions();
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { toUserId, amount, description } = await request.json();

    // Validate input
    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment data' },
        { status: 400 }
      );
    }

    // Check if both users are members of the group
    const memberships = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: [payload.sub, toUserId] },
      },
    });

    if (memberships.length !== 2) {
      return NextResponse.json(
        { error: 'One or both users are not members of this group' },
        { status: 403 }
      );
    }

    // Prevent self-payment
    if (payload.sub === toUserId) {
      return NextResponse.json(
        { error: 'Cannot make payment to yourself' },
        { status: 400 }
      );
    }

    // Create settlement record for the custom payment
    const settlement = await prisma.settlement.create({
      data: {
        fromUserId: payload.sub,
        toUserId: toUserId,
        groupId: groupId,
        amount: amount,
        status: 'COMPLETED',
        settledAt: new Date(),
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Payment completed successfully',
      settlement: settlement,
    });
  } catch (error) {
    console.error('Error creating custom payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
