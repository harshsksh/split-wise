import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyAuthToken, authCookieOptions } from '@/app/lib/auth';

interface SettlementTransaction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

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

    // Calculate net balances for each member
    const netBalances: { [key: string]: number } = {};
    
    // Initialize net balances
    groupMembers.forEach(member => {
      netBalances[member.userId] = 0;
    });

    // Process each expense to calculate net balances
    expenses.forEach(expense => {
      const paidBy = expense.paidById;
      
      expense.splits.forEach(split => {
        const owesTo = split.userId;
        const amount = split.amount;
        
        // If someone paid and someone else owes, adjust net balances
        if (paidBy !== owesTo) {
          netBalances[owesTo] -= amount; // They owe this amount
          netBalances[paidBy] += amount; // They are owed this amount
        }
      });
    });

    // Get settlements to adjust net balances
    const settlements = await prisma.settlement.findMany({
      where: {
        groupId: groupId,
        status: 'COMPLETED',
      },
    });

    // Apply settlements to net balances
    settlements.forEach(settlement => {
      const fromUser = settlement.fromUserId;
      const toUser = settlement.toUserId;
      const amount = settlement.amount;
      
      netBalances[fromUser] += amount; // They paid, so their balance increases
      netBalances[toUser] -= amount; // They received, so their balance decreases
    });

    // Create arrays of creditors (positive balance) and debtors (negative balance)
    const creditors: Array<{ userId: string; userName: string; amount: number }> = [];
    const debtors: Array<{ userId: string; userName: string; amount: number }> = [];

    groupMembers.forEach(member => {
      const balance = netBalances[member.userId];
      const userName = member.user.name || member.user.username || 'Unknown';
      
      if (balance > 0.01) { // Creditor (owed money)
        creditors.push({
          userId: member.userId,
          userName,
          amount: balance,
        });
      } else if (balance < -0.01) { // Debtor (owes money)
        debtors.push({
          userId: member.userId,
          userName,
          amount: Math.abs(balance),
        });
      }
    });

    // Sort creditors and debtors by amount (largest first)
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Greedy algorithm to minimize transactions
    const transactions: SettlementTransaction[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex];
      const debtor = debtors[debtorIndex];
      
      const settlementAmount = Math.min(creditor.amount, debtor.amount);
      
      if (settlementAmount > 0.01) { // Only create transaction if amount is significant
        transactions.push({
          fromUserId: debtor.userId,
          fromUserName: debtor.userName,
          toUserId: creditor.userId,
          toUserName: creditor.userName,
          amount: settlementAmount,
        });
        
        // Update remaining amounts
        creditor.amount -= settlementAmount;
        debtor.amount -= settlementAmount;
        
        // Move to next creditor/debtor if current one is settled
        if (creditor.amount < 0.01) {
          creditorIndex++;
        }
        if (debtor.amount < 0.01) {
          debtorIndex++;
        }
      } else {
        // Move to next if amounts are too small
        creditorIndex++;
        debtorIndex++;
      }
    }

    return NextResponse.json({
      transactions,
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      groupMembers: groupMembers.length,
      maxPossibleTransactions: groupMembers.length - 1,
    });
  } catch (error) {
    console.error('Error calculating optimal settlements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
