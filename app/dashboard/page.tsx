'use client';

import { useState } from 'react';
import GroupsList from '@/components/groups/GroupsList';
import CreateGroupForm from '@/components/groups/CreateGroupForm';

export default function DashboardPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleGroupCreated = () => {
    // Refresh the groups list
    // This could be done by updating state or refetching data
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
        <p className="text-gray-600 mt-2">Manage your expense groups and track shared expenses</p>
      </div>

      {/* Create Group Section */}
      <div className="mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create a New Group</h3>
            <p className="text-gray-600 mb-4">Start managing expenses with friends and family</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="mb-8">
        <GroupsList />
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">0</div>
            <div className="text-sm text-gray-500">Active Groups</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹0.00</div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500">Pending Settlements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateForm && (
        <CreateGroupForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleGroupCreated}
        />
      )}
    </div>
  );
}

