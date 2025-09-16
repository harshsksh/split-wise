'use client';

import { useState, useEffect } from 'react';

interface SettlementTransaction {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

interface OptimalSettlementsData {
  transactions: SettlementTransaction[];
  totalTransactions: number;
  totalAmount: number;
  groupMembers: number;
  maxPossibleTransactions: number;
}

interface SettleAllExpensesProps {
  groupId: string;
  currentUserId: string;
}

export default function SettleAllExpenses({ groupId, currentUserId }: SettleAllExpensesProps) {
  const [settlementsData, setSettlementsData] = useState<OptimalSettlementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingTransaction, setExecutingTransaction] = useState<string | null>(null);

  useEffect(() => {
    fetchOptimalSettlements();
  }, [groupId]);

  const fetchOptimalSettlements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/optimal-settlements`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data: OptimalSettlementsData = await response.json();
        setSettlementsData(data);
      } else {
        setError('Failed to fetch optimal settlements');
      }
    } catch (error) {
      console.error('Error fetching optimal settlements:', error);
      setError('Error loading optimal settlements');
    } finally {
      setLoading(false);
    }
  };

  const executeTransaction = async (transaction: SettlementTransaction) => {
    try {
      setExecutingTransaction(`${transaction.fromUserId}-${transaction.toUserId}`);
      
      const response = await fetch(`/api/groups/${groupId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: transaction.toUserId,
          amount: transaction.amount,
        }),
      });

      if (response.ok) {
        // Refresh the optimal settlements after successful transaction
        await fetchOptimalSettlements();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to execute transaction');
      }
    } catch (error) {
      console.error('Error executing transaction:', error);
      setError('Error executing transaction');
    } finally {
      setExecutingTransaction(null);
    }
  };

  const executeAllTransactions = async () => {
    if (!settlementsData || settlementsData.transactions.length === 0) return;

    for (const transaction of settlementsData.transactions) {
      await executeTransaction(transaction);
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optimal Settlement Plan</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optimal Settlement Plan</h3>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <button
          onClick={fetchOptimalSettlements}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!settlementsData) {
    return null;
  }

  const { transactions, totalTransactions, totalAmount, groupMembers, maxPossibleTransactions } = settlementsData;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Optimal Settlement Plan</h3>
        <p className="text-sm text-gray-500 mt-1">
          Minimum transactions needed to settle all group debts
        </p>
      </div>
      
      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🎉</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h4>
            <p className="text-gray-500">No transactions needed - all group debts are already settled.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalTransactions}</div>
                  <div className="text-sm text-gray-600">Transactions Needed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {totalTransactions}/{maxPossibleTransactions}
                  </div>
                  <div className="text-sm text-gray-600">Efficiency</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Maximum possible transactions: {groupMembers - 1} (group members - 1)
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Settlement Transactions ({totalTransactions})
              </h4>
              {transactions.map((transaction, index) => {
                const isCurrentUserPaying = transaction.fromUserId === currentUserId;
                const isCurrentUserReceiving = transaction.toUserId === currentUserId;
                const transactionKey = `${transaction.fromUserId}-${transaction.toUserId}`;
                const isExecuting = executingTransaction === transactionKey;

                return (
                  <div key={transactionKey} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            <span className="text-red-600">{transaction.fromUserName}</span>
                            <span className="text-gray-500 mx-2">pays</span>
                            <span className="text-green-600">{transaction.toUserName}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {isCurrentUserPaying && 'You are paying'}
                            {isCurrentUserReceiving && 'You are receiving'}
                            {!isCurrentUserPaying && !isCurrentUserReceiving && 'Other members'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            ₹{transaction.amount.toFixed(2)}
                          </div>
                        </div>
                        
                        {(isCurrentUserPaying || isCurrentUserReceiving) && (
                          <button
                            onClick={() => executeTransaction(transaction)}
                            disabled={isExecuting}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                              isCurrentUserPaying
                                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white'
                                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white'
                            }`}
                          >
                            {isExecuting ? 'Processing...' : (isCurrentUserPaying ? 'Pay' : 'Receive')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Execute All Button */}
            {transactions.some(t => t.fromUserId === currentUserId || t.toUserId === currentUserId) && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={executeAllTransactions}
                  disabled={executingTransaction !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {executingTransaction ? 'Processing Transactions...' : 'Execute All My Transactions'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This will execute all transactions where you are involved
                </p>
              </div>
            )}
          </>
        )}

        {/* Refresh button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={fetchOptimalSettlements}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Settlement Plan
          </button>
        </div>
      </div>
    </div>
  );
}
