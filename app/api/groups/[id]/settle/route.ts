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
    const { toUserId, amount } = await request.json();

    // Validate input
    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid settlement data' },
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

    // Check if there's actually a debt to settle
    // Get all expenses for the group with their splits
    const expenses = await prisma.expense.findMany({
      where: { groupId: groupId },
      include: {
        splits: true,
      },
    });

    // Calculate current debt between users
    let currentDebt = 0;
    expenses.forEach(expense => {
      const paidBy = expense.paidById;
      
      expense.splits.forEach(split => {
        const owesTo = split.userId;
        const splitAmount = split.amount;
        
        // If current user paid and other user owes
        if (paidBy === payload.sub && owesTo === toUserId) {
          currentDebt += splitAmount;
        }
        // If other user paid and current user owes
        else if (paidBy === toUserId && owesTo === payload.sub) {
          currentDebt -= splitAmount;
        }
      });
    });

    // Get completed settlements to adjust debt
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: groupId,
        status: 'COMPLETED',
        OR: [
          { fromUserId: payload.sub, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: payload.sub },
        ],
      },
    });

    // Apply settlements
    settlements.forEach(settlement => {
      if (settlement.fromUserId === payload.sub) {
        currentDebt -= settlement.amount;
      } else {
        currentDebt += settlement.amount;
      }
    });

    // Validate settlement amount
    if (amount > Math.abs(currentDebt)) {
      return NextResponse.json(
        { error: 'Settlement amount exceeds outstanding debt' },
        { status: 400 }
      );
    }

    // Create settlement record
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
      message: 'Settlement completed successfully',
      settlement: settlement,
    });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
