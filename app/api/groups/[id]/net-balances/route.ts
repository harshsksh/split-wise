import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyAuthToken, authCookieOptions } from '@/app/lib/auth';

export async function GET(
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

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId: groupId,
        userId: payload.sub,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // Get all expenses for the group with their splits
    const expenses = await prisma.expense.findMany({
      where: { groupId: groupId },
      include: {
        paidBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        splits: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Calculate debts between all members
    const debts: { [key: string]: { [key: string]: number } } = {};

    // Initialize debt matrix
    groupMembers.forEach(member => {
      debts[member.userId] = {};
      groupMembers.forEach(otherMember => {
        if (member.userId !== otherMember.userId) {
          debts[member.userId][otherMember.userId] = 0;
        }
      });
    });

    // Process each expense to calculate debts
    expenses.forEach(expense => {
      const paidBy = expense.paidById;
      
      expense.splits.forEach(split => {
        const owesTo = split.userId;
        const amount = split.amount;
        
        // If someone paid and someone else owes, create a debt
        if (paidBy !== owesTo) {
          debts[owesTo][paidBy] += amount;
        }
      });
    });

    // Get settlements to adjust debts
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: groupId,
        status: 'COMPLETED',
      },
    });

    // Apply settlements to reduce debts
    settlements.forEach(settlement => {
      const fromUser = settlement.fromUserId;
      const toUser = settlement.toUserId;
      const amount = settlement.amount;
      
      // When fromUser pays toUser, reduce the debt fromUser owes toUser
      if (debts[fromUser] && debts[fromUser][toUser] !== undefined) {
        debts[fromUser][toUser] = Math.max(0, debts[fromUser][toUser] - amount);
      }
    });

    // Calculate net balances for the current user with each other member
    const currentUserId = payload.sub;
    const netBalancesList = [];

    for (const member of groupMembers) {
      if (member.userId === currentUserId) continue;

      const currentUserOwes = debts[currentUserId]?.[member.userId] || 0;
      const memberOwes = debts[member.userId]?.[currentUserId] || 0;
      const netAmount = memberOwes - currentUserOwes;

      // Only include if there's a net balance (positive or negative)
      if (Math.abs(netAmount) > 0.01) { // Small threshold to avoid floating point issues
        netBalancesList.push({
          userId: member.userId,
          userName: member.user.name || member.user.username || 'Unknown',
          netAmount: netAmount,
          type: netAmount > 0 ? 'owed' : 'owes', // owed = they owe me, owes = I owe them
        });
      }
    }

    // Sort by absolute amount (highest first)
    netBalancesList.sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount));

    return NextResponse.json({
      netBalances: netBalancesList,
      currentUserId,
    });
  } catch (error) {
    console.error('Error calculating net balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
