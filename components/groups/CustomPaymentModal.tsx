'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  username: string;
}

interface CustomPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId: string;
  members: User[];
  currentUserId: string;
}

export default function CustomPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  members,
  currentUserId,
}: CustomPaymentModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current user from members list
  const otherMembers = members.filter(member => member.id !== currentUserId);
  
  // If no other members, show error
  if (otherMembers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">No Other Members</h3>
            <p className="text-gray-600 mb-4">There are no other members in this group to make payments to.</p>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !amount) {
      setError('Please select a member and enter an amount');
      return;
    }

    // Double-check: prevent self-payment
    if (selectedUserId === currentUserId) {
      setError('Cannot make payment to yourself');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}/custom-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: selectedUserId,
          amount: paymentAmount,
          description: description.trim() || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    setAmount('');
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Make Custom Payment</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay To
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            >
              <option value="">Select a member</option>
              {otherMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name || member.username}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Lunch payment, Shared expense, etc."
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Make Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
