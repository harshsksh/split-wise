import { Group } from './types';

interface GroupStatsProps {
  group: Group;
  totalExpenses: number;
}

export default function GroupStats({ group, totalExpenses }: GroupStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">Members</h3>
        <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{group._count.members}</div>
      </div>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
        <div className="text-2xl sm:text-3xl font-bold text-green-600">{group._count.expenses}</div>
      </div>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">Total Amount</h3>
        <div className="text-2xl sm:text-3xl font-bold text-purple-600">₹{totalExpenses.toFixed(2)}</div>
      </div>
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">Created</h3>
        <div className="text-sm sm:text-lg font-medium text-gray-600">
          {new Date(group.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
