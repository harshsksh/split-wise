'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface CreateExpenseFormProps {
  groups: Group[];
  onClose: () => void;
}

export default function CreateExpenseForm({ groups, onClose }: CreateExpenseFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<{ userId: string; amount: string; percentage: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  useEffect(() => {
    if (selectedGroup && splitType === 'equal') {
      const equalAmount = selectedGroup.members.length > 0 ? parseFloat(amount) / selectedGroup.members.length : 0;
      setCustomSplits(
        selectedGroup.members.map(member => ({
          userId: member.user.id,
          amount: equalAmount.toString(),
          percentage: ((1 / selectedGroup.members.length) * 100).toString()
        }))
      );
    }
  }, [selectedGroup, amount, splitType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !selectedGroupId) return;
    
    // Validate custom splits
    if (splitType === 'custom') {
      const totalSplitAmount = customSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0);
      const totalAmount = parseFloat(amount);
      if (Math.abs(totalSplitAmount - totalAmount) > 0.01) {
        alert(`Total split amount (₹${totalSplitAmount.toFixed(2)}) must equal total expense amount (₹${totalAmount.toFixed(2)})`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          amount: parseFloat(amount),
          date,
          groupId: selectedGroupId,
          splits: customSplits.map(split => ({
            userId: split.userId,
            amount: parseFloat(split.amount),
            percentage: split.percentage ? parseFloat(split.percentage) : null
          }))
        }),
      });

      if (response.ok) {
        router.refresh();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSplitAmount = (userId: string, newAmount: string) => {
    const numAmount = parseFloat(newAmount) || 0;
    const totalAmount = parseFloat(amount) || 0;
    const newPercentage = totalAmount > 0 ? (numAmount / totalAmount) * 100 : 0;
    
    setCustomSplits(prev => {
      const updatedSplits = prev.map(split =>
        split.userId === userId ? { 
          ...split, 
          amount: newAmount,
          percentage: newPercentage.toString()
        } : split
      );
      
      // Auto-adjust the last person's amount to ensure total equals expense amount
      return autoAdjustLastPerson(updatedSplits, totalAmount, 'amount');
    });
  };

  const updateSplitPercentage = (userId: string, newPercentage: string) => {
    const numPercentage = parseFloat(newPercentage) || 0;
    const totalAmount = parseFloat(amount) || 0;
    const newAmount = (numPercentage / 100) * totalAmount;
    
    setCustomSplits(prev => {
      const updatedSplits = prev.map(split =>
        split.userId === userId ? { 
          ...split, 
          percentage: newPercentage,
          amount: newAmount.toString()
        } : split
      );
      
      // Auto-adjust the last person's percentage to ensure total equals 100%
      return autoAdjustLastPerson(updatedSplits, totalAmount, 'percentage');
    });
  };

  const autoAdjustLastPerson = (splits: typeof customSplits, totalAmount: number, adjustType: 'amount' | 'percentage') => {
    if (splits.length <= 1) return splits;
    
    const lastIndex = splits.length - 1;
    const otherSplits = splits.slice(0, lastIndex);
    
    if (adjustType === 'amount') {
      // Calculate what the last person should pay
      const otherAmountsTotal = otherSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0);
      const lastPersonAmount = totalAmount - otherAmountsTotal;
      const lastPersonPercentage = totalAmount > 0 ? (lastPersonAmount / totalAmount) * 100 : 0;
      
      return splits.map((split, index) => 
        index === lastIndex ? {
          ...split,
          amount: Math.max(0, lastPersonAmount).toString(),
          percentage: Math.max(0, lastPersonPercentage).toString()
        } : split
      );
    } else {
      // Calculate what the last person's percentage should be
      const otherPercentagesTotal = otherSplits.reduce((sum, split) => sum + parseFloat(split.percentage || '0'), 0);
      const lastPersonPercentage = Math.max(0, 100 - otherPercentagesTotal);
      const lastPersonAmount = (lastPersonPercentage / 100) * totalAmount;
      
      return splits.map((split, index) => 
        index === lastIndex ? {
          ...split,
          percentage: lastPersonPercentage.toString(),
          amount: lastPersonAmount.toString()
        } : split
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New Expense</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter expense title"
                required
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter expense description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
                Group *
              </label>
              <select
                id="group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGroup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Type
              </label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="equal"
                    checked={splitType === 'equal'}
                    onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Equal Split</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="custom"
                    checked={splitType === 'custom'}
                    onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Custom Split</span>
                </label>
              </div>
              
              {splitType === 'custom' && (
                <div className="bg-blue-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> You can manually enter amounts or percentages for each person. 
                    The last person&apos;s amount/percentage will automatically adjust to ensure the total equals the expense amount.
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {customSplits.map((split, index) => {
                  const member = selectedGroup.members.find(m => m.user.id === split.userId);
                  const isLastPerson = index === customSplits.length - 1;
                  const isAutoAdjusted = isLastPerson && customSplits.length > 1;
                  
                  return (
                    <div key={split.userId} className="flex items-center space-x-3">
                      <span className={`w-24 text-sm font-medium ${isAutoAdjusted ? 'text-blue-600' : ''}`}>
                        {member?.user.name || member?.user.username}
                        {isAutoAdjusted && <span className="text-xs text-blue-500 block">(auto)</span>}
                      </span>
                      <input
                        type="text"
                        value={split.amount}
                        onChange={(e) => updateSplitAmount(split.userId, e.target.value)}
                        className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm ${
                          isAutoAdjusted ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        placeholder="Amount"
                        disabled={splitType === 'equal' || isAutoAdjusted}
                      />
                      <input
                        type="text"
                        value={split.percentage}
                        onChange={(e) => updateSplitPercentage(split.userId, e.target.value)}
                        className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm ${
                          isAutoAdjusted ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        placeholder="%"
                        disabled={splitType === 'equal' || isAutoAdjusted}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Summary for custom splits */}
              {splitType === 'custom' && (
                <div className="bg-gray-50 p-3 rounded-md mt-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Split Amount:</span>
                    <span className="font-medium">
                      ₹{customSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Split Percentage:</span>
                    <span className="font-medium">
                      {customSplits.reduce((sum, split) => sum + parseFloat(split.percentage || '0'), 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className={`font-medium ${
                      Math.abs(parseFloat(amount) - customSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)) < 0.01 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ₹{(parseFloat(amount) - customSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || !amount || !selectedGroupId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
