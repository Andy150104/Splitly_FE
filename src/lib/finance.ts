import type { FinanceAction, FinanceState, Transaction } from '../types'

export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value)
export const currency = (value: number) => `${money(value)} ₫`
export const shortMoney = (value: number) =>
  value >= 1_000_000
    ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000)}tr`
    : `${Math.round(value / 1000)}k`
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const monthKey = (date = new Date()) => localDate(date).slice(0, 7)
export const prettyDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(
    new Date(`${date}T12:00:00`),
  )
export const totalBalance = (state: FinanceState) =>
  state.openingBalance +
  state.transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
export const validAmount = (amount: number) =>
  Number.isSafeInteger(amount) && amount > 0 && amount <= 1_000_000_000_000

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  if (action.type === 'ADD_TRANSACTION') {
    if (!validAmount(action.transaction.amount) || !action.transaction.name.trim()) return state
    return { ...state, transactions: [action.transaction, ...state.transactions] }
  }
  if (action.type === 'ADD_BILL') {
    if (!validAmount(action.bill.amount) || !action.bill.name.trim()) return state
    return { ...state, bills: [...state.bills, action.bill] }
  }
  if (action.type === 'PAY_BILL') {
    const bill = state.bills.find((b) => b.id === action.id)
    if (!bill || bill.paid) return state
    return {
      ...state,
      bills: state.bills.map((b) => (b.id === bill.id ? { ...b, paid: true } : b)),
      transactions: [
        {
          id: action.transactionId,
          name: bill.name,
          amount: bill.amount,
          type: 'expense',
          category: 'Hóa đơn',
          date: action.date,
        },
        ...state.transactions,
      ],
    }
  }
  if (action.type === 'SAVE_GOAL') {
    const goal = state.goals.find((g) => g.id === action.id)
    if (
      !goal ||
      !validAmount(action.amount) ||
      action.amount > goal.target - goal.saved ||
      action.amount > totalBalance(state)
    )
      return state
    return {
      ...state,
      goals: state.goals.map((g) =>
        g.id === goal.id ? { ...g, saved: g.saved + action.amount } : g,
      ),
      transactions: [
        {
          id: action.transactionId,
          name: `Dành dụm · ${goal.name}`,
          amount: action.amount,
          type: 'expense',
          category: 'Tiết kiệm',
          date: action.date,
        },
        ...state.transactions,
      ],
    }
  }
  return state
}

export function summarize(transactions: Transaction[], month: string) {
  const filtered = transactions.filter((t) => t.date.startsWith(month))
  return {
    transactions: filtered,
    income: filtered.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0),
    expense: filtered.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
  }
}

export function toCsv(transactions: Transaction[]) {
  const escape = (value: string) =>
    `"${(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`
  return (
    '\uFEFF' +
    [
      'Ngày,Tên giao dịch,Loại,Danh mục,Số tiền (VND)',
      ...transactions.map((t) =>
        [
          t.date,
          t.name,
          t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
          t.category,
          String(t.amount),
        ]
          .map(escape)
          .join(','),
      ),
    ].join('\r\n')
  )
}
