import { getCurrentUser } from '@/app/lib/serverAuth';
import { prisma } from '@/app/lib/prisma';

async function getUserActivity() {
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

  return {
    expenses: userExpenses,
    stats: {
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      total: totalCount
    }
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export default async function ActivityPage() {
  const user = await getCurrentUser();
  const { expenses, stats } = await getUserActivity();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
        <p className="text-gray-600 mt-2">Track all your expense activities and recent changes</p>
      </div>

      {/* Activity Stats */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.today}</div>
            <div className="text-sm text-gray-500">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
            <div className="text-sm text-gray-500">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        
        {expenses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No recent activity.</p>
            <p className="text-sm mt-2">Your expense activities will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense) => {
              const userSplit = expense.splits.find(split => split.userId === user.id);
              const userAmount = userSplit?.amount || 0;
              const isUserPaidBy = expense.paidBy.id === user.id;
              
              return (
                <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{expense.title}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.group.name}
                        </span>
                      </div>
                      
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                      )}
                      
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Paid by:</span> {expense.paidBy.name || expense.paidBy.username}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Your share:</span> {formatCurrency(userAmount)}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Total:</span> {formatCurrency(expense.amount)}
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-400">
                        {formatDate(expense.createdAt)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${isUserPaidBy ? 'text-green-600' : 'text-red-600'}`}>
                        {isUserPaidBy ? '+' : '-'}{formatCurrency(userAmount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isUserPaidBy ? 'You paid' : 'You owe'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
