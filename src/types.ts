export type TransactionType = 'income' | 'expense'
export type Category =
  | 'Ăn uống'
  | 'Mua sắm'
  | 'Di chuyển'
  | 'Hóa đơn'
  | 'Thu nhập'
  | 'Tiết kiệm'
  | 'Khác'

export interface Transaction {
  id: string
  name: string
  amount: number
  type: TransactionType
  category: Category
  date: string
}

export interface Bill {
  id: string
  name: string
  amount: number
  dueDate: string
  paid: boolean
  kind: 'home' | 'electric' | 'wifi' | 'music' | 'other'
}

export interface Goal {
  id: string
  name: string
  description: string
  target: number
  saved: number
  kind: 'travel' | 'rainy' | 'creative'
}

export interface FinanceState {
  version: 1
  openingBalance: number
  transactions: Transaction[]
  bills: Bill[]
  goals: Goal[]
}

export type FinanceAction =
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'ADD_BILL'; bill: Bill }
  | { type: 'PAY_BILL'; id: string; transactionId: string; date: string }
  | { type: 'SAVE_GOAL'; id: string; amount: number; transactionId: string; date: string }

export type DialogState =
  | { kind: 'transaction' }
  | { kind: 'bill' }
  | { kind: 'goal'; id: string }
  | { kind: 'about' }
  | null
