'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Search } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  username: string;
  email: string;
}

interface Friend {
  id: string;
  friend: User;
  createdAt: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchUsername.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addFriend = async (username: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        fetchFriends();
        setSearchUsername('');
        setSearchResults([]);
        alert('Friend added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch('/api/friends', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });

      if (response.ok) {
        fetchFriends();
        alert('Friend removed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.friend.id === userId);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-600 mt-2">Manage your friends and see shared expenses</p>
      </div>

      {/* Add Friend Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddFriend(!showAddFriend)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </button>
      </div>

      {/* Add Friend Section */}
      {showAddFriend && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Friend</h3>
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              placeholder="Enter username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchUsers}
              disabled={!searchUsername.trim() || isSearching}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div>
                    <div className="font-medium">{user.name || user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isAlreadyFriend(user.id) ? (
                      <span className="text-green-600 text-sm font-medium">Already Friends</span>
                    ) : (
                      <button
                        onClick={() => addFriend(user.username)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="text-center text-gray-500 py-4">
              Searching...
            </div>
          )}
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Friends</h3>
        {friends.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No friends added yet.</p>
            <p className="text-sm mt-2">Add friends by searching their username to start creating groups and sharing expenses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <div>
                  <div className="font-medium">{friend.friend.name || friend.friend.username}</div>
                  <div className="text-sm text-gray-500">{friend.friend.email}</div>
                  <div className="text-xs text-gray-400">Friends since {new Date(friend.createdAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => removeFriend(friend.friend.id)}
                  className="p-2 text-red-600 hover:text-red-700 transition-colors"
                  title="Remove friend"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Friends Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{friends.length}</div>
            <div className="text-sm text-gray-500">Total Friends</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹0.00</div>
            <div className="text-sm text-gray-500">Shared Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-500">Pending Settlements</div>
          </div>
        </div>
      </div>
    </div>
  );
}
