'use client';

import { useState, useEffect, useMemo } from 'react';
import { validateSettlements, getUserDisplayName, getGroupDisplayName } from '@/app/lib/settlementUtils';

interface User {
  id: string;
  name: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
}

interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  settledAt?: string;
  fromUser?: User;
  toUser?: User;
  group?: Group;
}

export default function SettlementsList() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settlementsResponse, groupsResponse] = await Promise.all([
        fetch('/api/settlements'),
        fetch('/api/groups')
      ]);

      if (settlementsResponse.ok) {
        const settlementsData = await settlementsResponse.json();
        setSettlements(settlementsData);
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

  // Validate settlements and filter out invalid ones - memoized to prevent infinite re-renders
  const validSettlements = useMemo(() => validateSettlements(settlements), [settlements]);

  // Calculate filtered settlements based on selected group - memoized to prevent recalculation
  const filteredSettlements = useMemo(() => {
    if (selectedGroupId === 'all') {
      return validSettlements;
    } else {
      return validSettlements.filter(s => s.groupId === selectedGroupId);
    }
  }, [selectedGroupId, validSettlements]);

  const updateSettlementStatus = async (settlementId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/settlements', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: settlementId,
          status: newStatus
        }),
      });

      if (response.ok) {
        fetchData(); // Refresh data instead of router.refresh()
      } else {
        alert('Failed to update settlement status');
      }
    } catch (error) {
      console.error('Error updating settlement:', error);
      alert('Failed to update settlement status');
    }
  };

  // Memoize status color function to prevent recreation on every render
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Memoize stats calculations to prevent unnecessary recalculations
  const { totalPending, totalAmount } = useMemo(() => {
    const pending = filteredSettlements.filter(s => s.status === 'PENDING').length;
    const amount = filteredSettlements.reduce((sum, s) => sum + s.amount, 0);
    return { totalPending: pending, totalAmount: amount };
  }, [filteredSettlements]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Settlements</h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading settlements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settlements</h2>
          <p className="text-gray-600">
            Total: ₹{totalAmount.toFixed(2)} • Pending: {totalPending}
          </p>
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
        </div>
      </div>

             {filteredSettlements.length === 0 ? (
         <div className="text-center py-12">
           <div className="text-gray-400 text-6xl mb-4">💸</div>
           <h3 className="text-lg font-medium text-gray-900 mb-2">No settlements in this group</h3>
           <p className="text-gray-500">
             Try selecting a different group or create some expenses first
           </p>
         </div>
       ) : (
        <div className="space-y-4">
          {filteredSettlements.map((settlement) => (
            <div
              key={settlement.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
                             <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900">
                     {getUserDisplayName(settlement.fromUser)} → {getUserDisplayName(settlement.toUser)}
                   </h3>
                   <p className="text-gray-600">{getGroupDisplayName(settlement.group)}</p>
                 </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{settlement.amount.toFixed(2)}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(settlement.status)}`}>
                    {settlement.status}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                                 <div>
                   <span className="font-medium text-gray-700">From:</span>
                   <span className="ml-2 text-gray-600">
                     {getUserDisplayName(settlement.fromUser)}
                   </span>
                 </div>
                 
                 <div>
                   <span className="font-medium text-gray-700">To:</span>
                   <span className="ml-2 text-gray-600">
                     {getUserDisplayName(settlement.toUser)}
                   </span>
                 </div>
                
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(settlement.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {settlement.status === 'PENDING' && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateSettlementStatus(settlement.id, 'COMPLETED')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Mark as Completed
                    </button>
                    <button
                      onClick={() => updateSettlementStatus(settlement.id, 'CANCELLED')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {settlement.status === 'COMPLETED' && settlement.settledAt && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Settled on: {new Date(settlement.settledAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
