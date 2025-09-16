interface User {
  id: string;
  name: string;
  username: string;
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  user: User;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  paidById: string;
  paidBy: User;
  splits: ExpenseSplit[];
}

interface Settlement {
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
}

export function calculateSettlements(expenses: Expense[], groupId: string): Settlement[] {
  // Calculate net balance for each user
  const userBalances = new Map<string, number>();
  
  expenses.forEach(expense => {
    // Add what the user paid
    if (!userBalances.has(expense.paidById)) {
      userBalances.set(expense.paidById, 0);
    }
    userBalances.set(expense.paidById, userBalances.get(expense.paidById)! + expense.amount);
    
    // Subtract what the user owes
    expense.splits.forEach(split => {
      if (!userBalances.has(split.userId)) {
        userBalances.set(split.userId, 0);
      }
      userBalances.set(split.userId, userBalances.get(split.userId)! - split.amount);
    });
  });
  
  // Separate users into debtors and creditors
  const debtors: Array<{ userId: string; amount: number }> = [];
  const creditors: Array<{ userId: string; amount: number }> = [];
  
  userBalances.forEach((balance, userId) => {
    if (balance < 0) {
      debtors.push({ userId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ userId, amount: balance });
    }
  });
  
  // Sort by amount (largest first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  // Calculate optimal settlements
  const settlements: Settlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    
    if (settlementAmount > 0.01) { // Avoid tiny settlements
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        groupId,
        amount: settlementAmount
      });
    }
    
    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;
    
    if (debtor.amount < 0.01) {
      debtorIndex++;
    }
    if (creditor.amount < 0.01) {
      creditorIndex++;
    }
  }
  
  return settlements;
}

export function getUserBalance(expenses: Expense[], userId: string): number {
  let balance = 0;
  
  expenses.forEach(expense => {
    if (expense.paidById === userId) {
      balance += expense.amount;
    }
    
    const userSplit = expense.splits.find(split => split.userId === userId);
    if (userSplit) {
      balance -= userSplit.amount;
    }
  });
  
  return balance;
}
