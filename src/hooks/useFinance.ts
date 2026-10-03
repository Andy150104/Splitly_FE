import { useEffect, useReducer, useState } from 'react'
import { financeReducer, validAmount } from '../lib/finance'
import type { FinanceAction, FinanceState } from '../types'

const STORAGE_KEY = 'mo.finance.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidState(value: unknown): value is FinanceState {
  if (!isRecord(value) || value.version !== 1 || !Number.isSafeInteger(value.openingBalance))
    return false
  const validDate = (d: unknown) =>
    typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))
  return (
    Array.isArray(value.transactions) &&
    value.transactions.every(
      (t) =>
        isRecord(t) &&
        typeof t.id === 'string' &&
        typeof t.name === 'string' &&
        validAmount(Number(t.amount)) &&
        typeof t.amount === 'number' &&
        ['income', 'expense'].includes(String(t.type)) &&
        ['Ăn uống', 'Mua sắm', 'Di chuyển', 'Hóa đơn', 'Thu nhập', 'Tiết kiệm', 'Khác'].includes(
          String(t.category),
        ) &&
        validDate(t.date),
    ) &&
    Array.isArray(value.bills) &&
    value.bills.every(
      (b) =>
        isRecord(b) &&
        typeof b.id === 'string' &&
        typeof b.name === 'string' &&
        typeof b.amount === 'number' &&
        validAmount(b.amount) &&
        validDate(b.dueDate) &&
        typeof b.paid === 'boolean' &&
        ['home', 'electric', 'wifi', 'music', 'other'].includes(String(b.kind)),
    ) &&
    Array.isArray(value.goals) &&
    value.goals.every(
      (g) =>
        isRecord(g) &&
        typeof g.id === 'string' &&
        typeof g.name === 'string' &&
        typeof g.description === 'string' &&
        typeof g.target === 'number' &&
        validAmount(g.target) &&
        typeof g.saved === 'number' &&
        Number.isSafeInteger(g.saved) &&
        g.saved >= 0 &&
        g.saved <= g.target &&
        ['travel', 'rainy', 'creative'].includes(String(g.kind)),
    )
  )
}

function loadState(initialState: FinanceState): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isValidState(parsed)) return parsed
    }
  } catch {
    /* Storage can be unavailable; the demo still works in memory. */
  }
  return initialState
}

function reducer(
  state: FinanceState,
  action: FinanceAction | { type: 'HYDRATE'; state: FinanceState },
) {
  return action.type === 'HYDRATE' ? action.state : financeReducer(state, action)
}

export function useFinance(initialState: FinanceState) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  useEffect(() => {
    dispatch({ type: 'HYDRATE', state: loadState(initialState) })
    setHydrated(true)
  }, [initialState])
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      setStorageAvailable(false)
    }
  }, [state, hydrated])
  return { state, dispatch, storageAvailable, hydrated }
}
