import { Expense } from './types';

interface ExpensesListProps {
  expenses: Expense[];
  onAddExpense: () => void;
}

export default function ExpensesList({ expenses, onAddExpense }: ExpensesListProps) {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Group Expenses</h3>
      </div>
      
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-500 mb-4">Add your first expense to get started</p>
          <button
            onClick={onAddExpense}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Add Expense
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <div key={expense.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{expense.title}</h4>
                  {expense.description && (
                    <p className="text-sm text-gray-500">{expense.description}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Paid by {expense.paidBy.name || expense.paidBy.username}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ₹{expense.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
