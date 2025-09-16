import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Get all expenses where the user is part of the split
    const userExpenses = await prisma.expense.findMany({
      where: {
        splits: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        paidBy: {
          select: { id: true, name: true, username: true }
        },
        group: {
          select: { id: true, name: true }
        },
        splits: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Latest transactions first
      }
    });

    // Calculate activity stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayCount = userExpenses.filter(expense => 
      new Date(expense.createdAt) >= today
    ).length;

    const weekCount = userExpenses.filter(expense => 
      new Date(expense.createdAt) >= weekAgo
    ).length;

    const monthCount = userExpenses.filter(expense => 
      new Date(expense.createdAt) >= monthAgo
    ).length;

    const totalCount = userExpenses.length;

    return NextResponse.json({
      expenses: userExpenses,
      stats: {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        total: totalCount
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
