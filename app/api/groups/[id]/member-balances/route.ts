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
        splits: true,
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
      
      if (debts[fromUser] && debts[fromUser][toUser] !== undefined) {
        debts[fromUser][toUser] = debts[fromUser][toUser] - amount;
      }
    });

    // Calculate net balance for each member with the rest of the group
    const memberBalances = groupMembers.map(member => {
      const memberId = member.userId;
      
      // Calculate what this member owes to others
      const memberOwes = Object.values(debts[memberId] || {}).reduce((sum, amount) => sum + amount, 0);
      
      // Calculate what others owe to this member
      const memberOwed = Object.keys(debts).reduce((sum, debtorId) => {
        if (debtorId !== memberId && debts[debtorId] && debts[debtorId][memberId]) {
          return sum + debts[debtorId][memberId];
        }
        return sum;
      }, 0);
      
      const netBalance = memberOwed - memberOwes;
      
      return {
        userId: memberId,
        userName: member.user.name || member.user.username || 'Unknown',
        netBalance: netBalance,
        owes: memberOwes,
        owed: memberOwed,
      };
    });

    return NextResponse.json({
      memberBalances,
    });
  } catch (error) {
    console.error('Error calculating member balances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
