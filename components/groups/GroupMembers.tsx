'use client';

import { useState, useEffect } from 'react';
import { GroupMember } from './types';

interface MemberBalance {
  userId: string;
  userName: string;
  netBalance: number;
  owes: number;
  owed: number;
}

interface MemberBalancesData {
  memberBalances: MemberBalance[];
}

interface GroupMembersProps {
  members: GroupMember[];
  creatorId: string;
  groupId: string;
}

export default function GroupMembers({ members, creatorId, groupId }: GroupMembersProps) {
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberBalances();
  }, [groupId]);

  const fetchMemberBalances = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${groupId}/member-balances`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data: MemberBalancesData = await response.json();
        setMemberBalances(data.memberBalances);
      } else {
        setError('Failed to fetch member balances');
      }
    } catch (error) {
      console.error('Error fetching member balances:', error);
      setError('Error loading member balances');
    } finally {
      setLoading(false);
    }
  };

  const getMemberBalance = (userId: string): MemberBalance | undefined => {
    return memberBalances.find(balance => balance.userId === userId);
  };
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Group Members</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 text-sm mb-4">{error}</div>
            <button
              onClick={fetchMemberBalances}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const balance = getMemberBalance(member.userId);
              return (
                <div key={member.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-sm">
                        {(member.user.name || member.user.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.name || member.user.username}
                      </p>
                      {member.userId === creatorId && (
                        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                          Creator
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {balance && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Net Balance</div>
                      <div className={`text-lg font-bold ${
                        balance.netBalance > 0 
                          ? 'text-green-600' 
                          : balance.netBalance < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}>
                        {balance.netBalance > 0 ? '+' : ''}₹{balance.netBalance.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {balance.netBalance > 0 
                          ? 'Owed by group' 
                          : balance.netBalance < 0 
                            ? 'Owes to group' 
                            : 'All settled'
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Refresh button */}
        {!loading && !error && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={fetchMemberBalances}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Refresh Balances
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
