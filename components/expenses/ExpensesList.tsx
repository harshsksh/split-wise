'use client';

import { useState, useEffect } from 'react';
import CreateExpenseForm from './CreateExpenseForm';

interface User {
  id: string;
  name: string;
  username: string;
}

interface GroupMember {
  id: string;
  userId: string;
  user: User;
}

interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  user: User;
}

interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  date: string;
  paidBy: User;
  group: Group;
  splits: ExpenseSplit[];
  createdAt: string;
}

export default function ExpensesList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesResponse, groupsResponse] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/groups')
      ]);

      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData);
      }

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = selectedGroupId === 'all' 
    ? expenses 
    : expenses.filter(expense => expense.group.id === selectedGroupId);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600">Total: ₹{totalAmount.toFixed(2)}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Groups</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Expense
          </button>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-500 mb-4">
            {selectedGroupId === 'all' 
              ? 'Start adding expenses to your groups' 
              : 'Add your first expense to this group'
            }
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{expense.title}</h3>
                  {expense.description && (
                    <p className="text-gray-600 mt-1">{expense.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{expense.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Paid by:</span>
                  <span className="ml-2 text-gray-600">
                    {expense.paidBy.name || expense.paidBy.username}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Group:</span>
                  <span className="ml-2 text-gray-600">{expense.group.name}</span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Split among:</span>
                  <span className="ml-2 text-gray-600">
                    {expense.splits.length} people
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Split Details:</h4>
                <div className="space-y-2">
                  {expense.splits.map((split) => (
                    <div
                      key={split.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">
                          {split.user.name || split.user.username}
                        </span>
                        {split.isPaid && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Paid
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ₹{split.amount.toFixed(2)}
                        </div>
                        {split.percentage && (
                          <div className="text-xs text-gray-500">
                            {split.percentage.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateExpenseForm
          groups={groups}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}
