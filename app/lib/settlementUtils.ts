interface User {
  id: string;
  name: string;
  username: string;
}

interface Group {
  id: string;
  name: string;
}

interface Settlement {
  id: string;
  fromUserId: string;
  toUserId: string;
  groupId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  settledAt?: string;
  fromUser?: User;
  toUser?: User;
  group?: Group;
}

/**
 * Validates settlement data and filters out invalid entries
 */
export function validateSettlements(settlements: Settlement[]): Settlement[] {
  return settlements.filter(settlement => {
    // Check if all required fields exist
    if (!settlement.fromUser || !settlement.toUser || !settlement.group) {
      console.warn('Invalid settlement found:', {
        id: settlement.id,
        fromUser: !!settlement.fromUser,
        toUser: !!settlement.toUser,
        group: !!settlement.group
      });
      return false;
    }
    
    // Check if user IDs match
    if (settlement.fromUser.id !== settlement.fromUserId || 
        settlement.toUser.id !== settlement.toUserId) {
      console.warn('User ID mismatch in settlement:', {
        id: settlement.id,
        fromUserId: settlement.fromUserId,
        fromUserActualId: settlement.fromUser.id,
        toUserId: settlement.toUserId,
        toUserActualId: settlement.toUser.id
      });
      return false;
    }
    
    // Check if group ID matches
    if (settlement.group.id !== settlement.groupId) {
      console.warn('Group ID mismatch in settlement:', {
        id: settlement.id,
        groupId: settlement.groupId,
        groupActualId: settlement.group.id
      });
      return false;
    }
    
    return true;
  });
}

/**
 * Gets a safe display name for a user, with fallbacks
 */
export function getUserDisplayName(user?: User): string {
  if (!user) return 'Unknown User';
  return user.name || user.username || 'Unknown User';
}

/**
 * Gets a safe display name for a group, with fallbacks
 */
export function getGroupDisplayName(group?: Group): string {
  if (!group) return 'Unknown Group';
  return group.name || 'Unknown Group';
}
