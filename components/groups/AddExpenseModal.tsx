'use client';

import { useState, useEffect } from 'react';
import { GroupMember, ExpenseSplit, DistributionMethod } from './types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  members,
  currentUserId,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currentStep, setCurrentStep] = useState<'members' | 'distribution'>('members');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const [expenseSplits, setExpenseSplits] = useState<{ userId: string; amount: string; percentage: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setTitle('');
      setDescription('');
      setTotalAmount('');
      setCurrentStep('members');
      setSelectedMembers([]);

      setExpenseSplits([]);
    }
  }, [isOpen]);

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleNextStep = () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one member to split the expense with.');
      return;
    }
    
    // Only include the members that were actually selected
    // The current user (who paid) is not automatically included unless they selected themselves
    const membersToSplitWith = selectedMembers;
    
    // Initialize splits with equal distribution among only the selected members
    const equalAmount = parseFloat(totalAmount) / membersToSplitWith.length;
    const equalPercentage = 100 / membersToSplitWith.length;
    
    const newSplits = membersToSplitWith.map(memberId => ({
      userId: memberId,
      amount: equalAmount.toString(),
      percentage: equalPercentage.toString()
    }));
    
    setExpenseSplits(newSplits);
    setCurrentStep('distribution');
  };

  const handleBackStep = () => {
    setCurrentStep('members');
  };

  const handleSplitAmountChange = (userId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    const total = parseFloat(totalAmount) || 0;
    const newPercentage = total > 0 ? (numAmount / total) * 100 : 0;
    
    setExpenseSplits(prev => {
      const updatedSplits = prev.map(split => 
        split.userId === userId ? { 
          ...split, 
          amount: amount,
          percentage: newPercentage.toString()
        } : split
      );
      
      // Auto-adjust the last person's amount to ensure total equals expense amount
      return autoAdjustLastPerson(updatedSplits, total, 'amount');
    });
  };

  const handleSplitPercentageChange = (userId: string, percentage: string) => {
    const numPercentage = parseFloat(percentage) || 0;
    const total = parseFloat(totalAmount) || 0;
    const newAmount = (numPercentage / 100) * total;
    
    setExpenseSplits(prev => {
      const updatedSplits = prev.map(split => 
        split.userId === userId ? { 
          ...split, 
          percentage: percentage,
          amount: newAmount.toString()
        } : split
      );
      
      // Auto-adjust the last person's percentage to ensure total equals 100%
      return autoAdjustLastPerson(updatedSplits, total, 'percentage');
    });
  };

  const autoAdjustLastPerson = (splits: { userId: string; amount: string; percentage: string }[], totalAmount: number, adjustType: 'amount' | 'percentage') => {
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



  const getCurrentUser = () => {
    return members.find(member => member.userId === currentUserId);
  };

  const getTotalSplitAmount = () => {
    return expenseSplits.reduce((sum, split) => sum + parseFloat(split.amount || '0'), 0);
  };

  const getTotalSplitPercentage = () => {
    return expenseSplits.reduce((sum, split) => sum + parseFloat(split.percentage || '0'), 0);
  };

  const getRemainingAmount = () => {
    const total = parseFloat(totalAmount) || 0;
    const split = getTotalSplitAmount();
    return total - split;
  };

  const getRemainingPercentage = () => {
    const total = 100;
    const split = getTotalSplitPercentage();
    return total - split;
  };

  const isFormValid = () => {
    if (currentStep === 'members') {
      return selectedMembers.length > 0;
    }
    
    // Check both amount and percentage totals
    return Math.abs(getRemainingAmount()) < 0.01 && Math.abs(getRemainingPercentage()) < 0.01;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !totalAmount || !isFormValid()) {
      const amountError = Math.abs(getRemainingAmount()) >= 0.01;
      const percentageError = Math.abs(getRemainingPercentage()) >= 0.01;
      
      let errorMessage = 'Please fix the following issues:\n';
      if (amountError) {
        errorMessage += `• Total split amount (₹${getTotalSplitAmount().toFixed(2)}) must equal total expense amount (₹${parseFloat(totalAmount).toFixed(2)})\n`;
      }
      if (percentageError) {
        errorMessage += `• Total split percentage (${getTotalSplitPercentage().toFixed(1)}%) must equal 100%`;
      }
      
      alert(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          amount: parseFloat(totalAmount),
          paidBy: currentUserId,
          splits: expenseSplits.map(split => ({
            userId: split.userId,
            amount: parseFloat(split.amount || '0'),
            percentage: parseFloat(split.percentage || '0')
          })),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentUser = getCurrentUser();
  const remainingAmount = getRemainingAmount();
  const remainingPercentage = getRemainingPercentage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New Expense</h2>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'members' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className={`text-sm ${currentStep === 'members' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Select Members
            </span>
            <div className="w-8 h-2 bg-gray-300"></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'distribution' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className={`text-sm ${currentStep === 'distribution' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              Distribute Expense
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Expense Details - Always visible */}
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
                placeholder="What was this expense for?"
                required
              />
            </div>

            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                id="totalAmount"
                step="0.01"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about the expense"
              rows={2}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Paid by:</strong> {currentUser?.user.name || currentUser?.user.username} (You)
            </p>
          </div>

          {/* Step 1: Member Selection */}
          {currentStep === 'members' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members to Split With *
              </label>
              
              <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {members.map((member) => {
                  console.log(currentUserId)
                  console.log(member);
                  const isCurrentUser = member.userId === currentUserId;
                  return (
                    <div key={member.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`member-${member.id}`}
                        checked={selectedMembers.includes(member.userId)}
                        onChange={() => handleMemberToggle(member.userId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`member-${member.id}`} className="flex-1 text-sm cursor-pointer">
                        {isCurrentUser ? (
                          <span className="text-blue-600 font-medium">
                            {member.user.name || member.user.username} (You - the person who paid)
                          </span>
                        ) : (
                          member.user.name || member.user.username
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-600 mt-2">
                Selected members: {selectedMembers.length} total
              </p>
            </div>
          )}

          {/* Step 2: Distribution */}
          {currentStep === 'distribution' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Distribution
              </label>
              
              <div className="bg-green-50 p-3 rounded-md mb-4">
                <p className="text-sm text-green-800">
                  💡 <strong>Tip:</strong> You can enter both amounts (₹) and percentages (%) for each person. 
                  The last person&apos;s values will automatically adjust to ensure the total equals the expense amount.
                  <br />
                  <strong>Note:</strong> Only the members you selected will be included in the split.
                </p>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {expenseSplits.map((split, index) => {
                  const member = members.find(m => m.userId === split.userId);
                  const isCurrentUser = split.userId === currentUserId;
                  const isLastPerson = index === expenseSplits.length - 1;
                  const isAutoAdjusted = isLastPerson && expenseSplits.length > 1;
                  
                  return (
                    <div key={split.userId} className="flex items-center space-x-3">
                      <span className={`w-32 text-sm font-medium ${isCurrentUser ? 'text-blue-600' : ''} ${isAutoAdjusted ? 'text-green-600' : ''}`}>
                        {isCurrentUser ? 'You' : member?.user.name || member?.user.username}
                        {isAutoAdjusted && <span className="text-xs text-green-500 block">(auto)</span>}
                      </span>
                      
                      <input
                        type="text"
                        value={split.amount}
                        onChange={(e) => handleSplitAmountChange(split.userId, e.target.value)}
                        className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm ${
                          isAutoAdjusted ? 'bg-green-50 border-green-200' : ''
                        }`}
                        placeholder="Amount (₹)"
                        disabled={isAutoAdjusted}
                      />
                      <input
                        type="text"
                        value={split.percentage}
                        onChange={(e) => handleSplitPercentageChange(split.userId, e.target.value)}
                        className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm ${
                          isAutoAdjusted ? 'bg-green-50 border-green-200' : ''
                        }`}
                        placeholder="%"
                        disabled={isAutoAdjusted}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-3 rounded-md mt-3">
                <div className="flex justify-between text-sm">
                  <span>Total Split Amount:</span>
                  <span className="font-medium">
                    ₹{getTotalSplitAmount().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Split Percentage:</span>
                  <span className="font-medium">
                    {getTotalSplitPercentage().toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining Amount:</span>
                  <span className={`font-medium ${
                    remainingAmount === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{remainingAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Remaining Percentage:</span>
                  <span className={`font-medium ${
                    remainingPercentage === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {remainingPercentage.toFixed(1)}%
                  </span>
                </div>
                {(remainingAmount !== 0 || remainingPercentage !== 0) && (
                  <p className="text-xs text-red-600 mt-1">
                    Split amounts must equal total expense amount and percentages must equal 100%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            
            {currentStep === 'members' ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={selectedMembers.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Distribute Expense
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Adding...' : 'Add Expense'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
