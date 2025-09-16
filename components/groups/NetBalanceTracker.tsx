'use client';

import { useState, useEffect } from 'react';

interface NetBalance {
  userId: string;
  userName: string;
  netAmount: number;
  type: 'owed' | 'owes';
}

interface NetBalanceData {
  netBalances: NetBalance[];
  currentUserId: string;
}

interface NetBalanceTrackerProps {
  groupId: string;
  currentUserId: string;
}

export default function NetBalanceTracker({ groupId, currentUserId }: NetBalanceTrackerProps) {
  const [netBalanceData, setNetBalanceData] = useState<NetBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  useEffect(() => {
    fetchNetBalances();
  }, [groupId]);

  const fetchNetBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/net-balances`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setNetBalanceData(data);
      } else {
        setError('Failed to fetch net balance information');
      }
    } catch (error) {
      console.error('Error fetching net balance data:', error);
      setError('Error loading net balance information');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleDebt = async (userId: string, maxAmount: number) => {
    // For instant settlement, directly call the API
    try {
      setSettlementLoading(true);
      const response = await fetch(`/api/groups/${groupId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: userId,
          amount: maxAmount,
        }),
      });

      if (response.ok) {
        // Refresh the net balances after successful settlement
        await fetchNetBalances();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to settle debt');
      }
    } catch (error) {
      console.error('Error settling debt:', error);
      setError('Error settling debt');
    } finally {
      setSettlementLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Net Balances</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Net Balances</h3>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchNetBalances}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!netBalanceData) {
    return null;
  }

  const { netBalances } = netBalanceData;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Net Balances</h3>
        <p className="text-sm text-gray-500 mt-1">
          Click &quot;Pay&quot; to instantly settle debts you owe to others
        </p>
      </div>
      
      <div className="p-6">
        {netBalances.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">💰</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">All Settled Up!</h4>
            <p className="text-gray-500">You don&apos;t owe anyone and no one owes you anything in this group.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {netBalances.map((balance) => (
              <div key={balance.userId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      balance.type === 'owed' 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        balance.type === 'owed' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {balance.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{balance.userName}</div>
                      <div className={`text-xs ${
                        balance.type === 'owed' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {balance.type === 'owed' 
                          ? 'They owe you' 
                          : 'You owe them'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        balance.type === 'owed' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ₹{Math.abs(balance.netAmount).toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Only show settlement button if current user owes money (type === 'owes') */}
                    {balance.type === 'owes' && (
                      <button
                        onClick={() => handleSettleDebt(balance.userId, Math.abs(balance.netAmount))}
                        disabled={settlementLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
                      >
                        {settlementLoading ? 'Paying...' : 'Pay'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* Refresh button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={fetchNetBalances}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Refresh Balances
          </button>
        </div>
      </div>
    </div>
  );
}
