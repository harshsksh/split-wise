'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import GroupHeader from '@/components/groups/GroupHeader';
import GroupStats from '@/components/groups/GroupStats';
import GroupMembers from '@/components/groups/GroupMembers';
import ExpensesList from '@/components/groups/ExpensesList';
import AddExpenseModal from '@/components/groups/AddExpenseModal';
import CustomPaymentModal from '@/components/groups/CustomPaymentModal';
import NetBalanceTracker from '@/components/groups/NetBalanceTracker';
import SettleAllExpenses from '@/components/groups/SettleAllExpenses';
import { Group, Expense } from '@/components/groups/types';
import { useUser } from '@/app/lib/UserContext';

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showCustomPayment, setShowCustomPayment] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
      fetchGroupExpenses();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      } else if (response.status === 404) {
        console.error('Group not found');
      } else {
        console.error('Error fetching group details:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const fetchGroupExpenses = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      } else {
        console.error('Error fetching group expenses:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching group expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenseSuccess = () => {
    fetchGroupExpenses();
    fetchGroupDetails();
    // The NetBalanceTracker component will automatically refresh when the group data changes
  };

  const handleCustomPaymentSuccess = () => {
    fetchGroupExpenses();
    fetchGroupDetails();
    // The NetBalanceTracker, GroupMembers, and SettleAllExpenses components will automatically refresh when the group data changes
  };

  const handleAddExpense = () => {
    console.log('Add expense clicked, currentUserId:', user?.id);
    console.log('Setting showAddExpense to true');
    setShowAddExpense(true);
  };

  const handleMakePayment = () => {
    console.log('Make payment clicked, currentUserId:', user?.id);
    setShowCustomPayment(true);
  };

  if (loading || userLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Group Not Found</h2>
          <p className="text-gray-600 mb-6">The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <GroupHeader 
          group={group} 
          onAddExpense={handleAddExpense}
          onMakePayment={handleMakePayment}
        />
      </div>
      
      {/* Group Stats */}
      <div className="mb-8">
        <GroupStats 
          group={group} 
          totalExpenses={totalExpenses} 
        />
      </div>
      
      {/* Group Members */}
      <div className="mb-8">
        <GroupMembers 
          key={`group-members-${groupId}`}
          members={group.members} 
          creatorId={group.creator.id}
          groupId={groupId}
        />
      </div>
      
      {/* Optimal Settlement Plan */}
      <div className="mb-8">
        <SettleAllExpenses 
          key={`settle-all-${groupId}`}
          groupId={groupId}
          currentUserId={user?.id || ''}
        />
      </div>
      
      {/* Expenses List */}
      <div className="mb-8">
        <ExpensesList 
          expenses={expenses} 
          onAddExpense={handleAddExpense} 
        />
      </div>
      
      {/* Net Balances */}
      <div className="mb-8">
        <NetBalanceTracker 
          key={`net-balance-${groupId}`}
          groupId={groupId}
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && user && (
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => {
            console.log('Closing modal');
            setShowAddExpense(false);
          }}
          onSuccess={handleAddExpenseSuccess}
          groupId={groupId}
          members={group.members}
          currentUserId={user.id}
        />
      )}

      {/* Custom Payment Modal */}
      {showCustomPayment && user && (
        <CustomPaymentModal
          isOpen={showCustomPayment}
          onClose={() => setShowCustomPayment(false)}
          onSuccess={handleCustomPaymentSuccess}
          groupId={groupId}
          members={group.members.map(member => member.user)}
          currentUserId={user.id}
        />
      )}
      
      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
        <p>Debug: showAddExpense = {showAddExpense.toString()}</p>
        <p>Debug: showCustomPayment = {showCustomPayment.toString()}</p>
        <p>Debug: currentUserId = {user?.id || 'not set'}</p>
        <p>Debug: groupId = {groupId}</p>
        <p>Debug: userLoading = {userLoading.toString()}</p>
        <p>Debug: Components loaded: GroupHeader, GroupStats, GroupMembers, SettleAllExpenses, ExpensesList, NetBalanceTracker</p>
      </div>
    </div>
  );
}
