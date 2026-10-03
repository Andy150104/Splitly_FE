import { describe, expect, it } from 'vitest'
import { createSeed } from '../data/seed'
import { financeReducer, localDate, summarize, toCsv, totalBalance, validAmount } from './finance'

describe('money state transitions', () => {
  it('records bill payment exactly once, including duplicate actions', () => {
    const state = createSeed()
    const bill = state.bills[0]
    const action = {
      type: 'PAY_BILL' as const,
      id: bill.id,
      transactionId: 'payment',
      date: localDate(),
    }
    const paid = financeReducer(state, action)
    expect(totalBalance(paid)).toBe(totalBalance(state) - bill.amount)
    expect(paid.bills[0].paid).toBe(true)
    expect(paid.transactions.filter((t) => t.id === 'payment')).toHaveLength(1)
    expect(financeReducer(paid, action)).toBe(paid)
  })
  it('moves goal savings out of available balance and into an expense record', () => {
    const state = createSeed()
    const next = financeReducer(state, {
      type: 'SAVE_GOAL',
      id: 'g1',
      amount: 500000,
      transactionId: 'saving',
      date: localDate(),
    })
    expect(next.goals[0].saved).toBe(state.goals[0].saved + 500000)
    expect(totalBalance(next)).toBe(totalBalance(state) - 500000)
    expect(next.transactions[0].category).toBe('Tiết kiệm')
  })
  it('rejects negative, fractional, overflowing and overfunded goal amounts', () => {
    const state = createSeed()
    for (const amount of [-1, 0, 2.5, Infinity, 999999999999999, 3500001]) {
      expect(
        financeReducer(state, {
          type: 'SAVE_GOAL',
          id: 'g1',
          amount,
          transactionId: 'bad',
          date: localDate(),
        }),
      ).toBe(state)
    }
  })
  it('does not fund a goal beyond the available balance', () => {
    const state = { ...createSeed(), openingBalance: -28000000 }
    expect(
      financeReducer(state, {
        type: 'SAVE_GOAL',
        id: 'g2',
        amount: 10000000,
        transactionId: 'bad',
        date: localDate(),
      }),
    ).toBe(state)
  })
  it('adds an income and calculates the balance from all records', () => {
    const state = createSeed()
    const next = financeReducer(state, {
      type: 'ADD_TRANSACTION',
      transaction: {
        id: 'new',
        name: 'Test income',
        type: 'income',
        amount: 500000,
        date: localDate(),
        category: 'Thu nhập',
      },
    })
    expect(totalBalance(next)).toBe(totalBalance(state) + 500000)
  })
  it('limits monthly summaries to the selected month', () => {
    const state = createSeed()
    const month = localDate().slice(0, 7)
    expect(summarize(state.transactions, month).income).toBe(28500000)
    expect(summarize(state.transactions, '2000-01')).toEqual({
      transactions: [],
      income: 0,
      expense: 0,
    })
  })
  it('escapes CSV quotes, commas, formula prefixes and preserves Vietnamese', () => {
    const csv = toCsv([
      {
        id: 'csv',
        name: '=SUM(1,2) "Cà phê"',
        amount: 65000,
        category: 'Ăn uống',
        type: 'expense',
        date: '2026-09-09',
      },
    ])
    expect(csv).toContain('"\'=SUM(1,2) ""Cà phê"""')
    expect(csv.startsWith('\uFEFF')).toBe(true)
  })
  it('keeps integer VND exact', () => {
    expect(validAmount(1)).toBe(true)
    expect(validAmount(1_000_000_000_000)).toBe(true)
    expect(validAmount(1_000_000_000_001)).toBe(false)
    expect(validAmount(NaN)).toBe(false)
  })
})
