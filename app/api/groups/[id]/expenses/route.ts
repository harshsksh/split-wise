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

    // Fetch expenses for the group
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { title, description, amount, splits } = await request.json();

    // Validate input
    if (!title || !amount || !splits || splits.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

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

    // Validate that all split users are members of the group
    const splitUserIds = splits.map((split: { userId: string }) => split.userId);
    const validMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: splitUserIds },
      },
    });

    if (validMembers.length !== splitUserIds.length) {
      return NextResponse.json(
        { error: 'One or more split users are not members of this group' },
        { status: 400 }
      );
    }

    // Validate that split amounts equal total amount
    const totalSplitAmount = splits.reduce((sum: number, split: { amount: number }) => sum + split.amount, 0);
    if (Math.abs(totalSplitAmount - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Split amounts must equal total expense amount' },
        { status: 400 }
      );
    }

    // Create the expense and splits in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the expense
      const expense = await tx.expense.create({
        data: {
          title,
          description,
          amount: parseFloat(amount),
          groupId,
          paidById: payload.sub, // Always the logged-in user
        },
        include: {
          paidBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      });

      // Create expense splits
      const expenseSplits = await Promise.all(
        splits.map(async (split: { userId: string; amount: number; percentage?: number }) => {
          const expenseSplit = await tx.expenseSplit.create({
            data: {
              expenseId: expense.id,
              userId: split.userId,
              amount: split.amount,
              percentage: split.percentage || (split.amount / amount) * 100,
            },
          });
          return expenseSplit;
        })
      );

      return { expense, splits: expenseSplits };
    });

    return NextResponse.json(result.expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
