export interface User {
  id: string;
  name: string;
  username: string;
}

export interface GroupMember {
  id: string;
  userId: string;
  user: User;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  paidBy: User;
  createdAt: string;
}

export interface Group {
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

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
}

export type DistributionMethod = 'exact' | 'percentage';

export interface ExpenseDistributionStep {
  step: 'members' | 'distribution';
  selectedMembers: string[];
  distributionMethod: DistributionMethod;
  splits: ExpenseSplit[];
}
