'use client';

import { useState, useEffect } from 'react';

interface DebtInfo {
  userId: string;
  userName: string;
  amount: number;
  type: 'debt' | 'credit';
}

interface DebtData {
  debts: DebtInfo[];
  credits: DebtInfo[];
  totalDebt: number;
  totalCredit: number;
  netBalance: number;
  currentUserId: string;
}

interface DebtTrackerProps {
  groupId: string;
  currentUserId: string;
}

export default function DebtTracker({ groupId, currentUserId }: DebtTrackerProps) {
  const [debtData, setDebtData] = useState<DebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebtData();
  }, [groupId]);

  const fetchDebtData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/debts`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebtData(data);
      } else {
        setError('Failed to fetch debt information');
      }
    } catch (error) {
      console.error('Error fetching debt data:', error);
      setError('Error loading debt information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Balance</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Balance</h3>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchDebtData}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!debtData) {
    return null;
  }

  const { debts, credits, totalDebt, totalCredit, netBalance } = debtData;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Balance</h3>
      </div>
      
      <div className="p-6">
        {/* Net Balance Summary */}
        <div className="mb-6">
          <div className={`text-center p-4 rounded-lg ${
            netBalance > 0 
              ? 'bg-green-50 border border-green-200' 
              : netBalance < 0 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className="text-sm text-gray-600 mb-1">Net Balance</div>
            <div className={`text-2xl font-bold ${
              netBalance > 0 
                ? 'text-green-600' 
                : netBalance < 0 
                  ? 'text-red-600' 
                  : 'text-gray-600'
            }`}>
              {netBalance > 0 ? '+' : ''}₹{netBalance.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {netBalance > 0 
                ? 'You are owed money overall' 
                : netBalance < 0 
                  ? 'You owe money overall' 
                  : 'You are all settled up!'
              }
            </div>
          </div>
        </div>

        {/* Debts - What you owe */}
        {debts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-red-600 mb-3">
              You Owe ({debts.length} {debts.length === 1 ? 'person' : 'people'})
            </h4>
            <div className="space-y-2">
              {debts.map((debt) => (
                <div key={debt.userId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm font-medium">
                        {debt.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{debt.userName}</div>
                      <div className="text-xs text-gray-500">You owe them</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">
                      ₹{debt.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-red-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total you owe:</span>
                <span className="font-bold text-red-600">₹{totalDebt.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Credits - What you are owed */}
        {credits.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-green-600 mb-3">
              You Are Owed ({credits.length} {credits.length === 1 ? 'person' : 'people'})
            </h4>
            <div className="space-y-2">
              {credits.map((credit) => (
                <div key={credit.userId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">
                        {credit.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{credit.userName}</div>
                      <div className="text-xs text-gray-500">They owe you</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">
                      ₹{credit.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total you are owed:</span>
                <span className="font-bold text-green-600">₹{totalCredit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* No debts or credits */}
        {debts.length === 0 && credits.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">💰</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h4>
            <p className="text-gray-500">You don&apos;t owe anyone and no one owes you anything in this group.</p>
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={fetchDebtData}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Balance
          </button>
        </div>
      </div>
    </div>
  );
}
