'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CreateGroupForm from './CreateGroupForm';

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
  description?: string;
  creator: User;
  members: GroupMember[];
  _count: {
    expenses: number;
    members: number;
  };
  createdAt: string;
}

export default function GroupsList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Group
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Groups</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 mb-4">Create your first group to start splitting expenses</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/dashboard/groups/${group.id}`}
                className="block hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {group._count.members} members
                        </span>
                      </div>
                      
                      {group.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="font-medium">Created by:</span>
                          <span className="ml-1">{group.creator.name || group.creator.username}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium">Expenses:</span>
                          <span className="ml-1">{group._count.expenses}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium">Created:</span>
                          <span className="ml-1">
                            {new Date(group.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className="text-gray-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateGroupForm onClose={() => setShowCreateForm(false)} onSuccess={fetchGroups} />
      )}
    </div>
  );
}
