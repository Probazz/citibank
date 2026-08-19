export interface UserWithAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  createdAt: Date;
  account?: {
    id: string;
    accountNumber: string;
    routingNumber: string;
    balance: number;
    savingsBalance: number;
    status: string;
    accountType: string;
    cards: Card[];
  } | null;
}

export interface Transaction {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  note?: string | null;
  metadata?: string | null;
  category?: string | null;
  senderId?: string | null;
  receiverId?: string | null;
  createdAt: Date;
  sender?: { firstName: string; lastName: string; email: string } | null;
  receiver?: { firstName: string; lastName: string; email: string } | null;
}

export interface Card {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isActive: boolean;
  isFrozen: boolean;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: string;
  note?: string | null;
  adminNote?: string | null;
  createdAt: Date;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalBalance: number;
  savingsBalance: number;
  recentTransactions: Transaction[];
  accountNumber: string;
  routingNumber: string;
  accountStatus: string;
  cards: Card[];
  unreadNotifications: number;
}

export interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  totalBalance: number;
  recentTransactions: Transaction[];
  recentUsers: UserWithAccount[];
}