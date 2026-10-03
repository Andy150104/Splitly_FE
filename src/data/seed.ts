import type { FinanceState } from '../types'
import { monthKey } from '../lib/finance'

export function createSeed(now = new Date()): FinanceState {
  const month = monthKey(now)
  const date = (day: number) => `${month}-${String(day).padStart(2, '0')}`
  return {
    version: 1,
    openingBalance: 12_500_000,
    transactions: [
      {
        id: 't1',
        name: 'Một chút cà phê',
        amount: 65000,
        type: 'expense',
        category: 'Ăn uống',
        date: date(9),
      },
      {
        id: 't2',
        name: 'Dự án freelance',
        amount: 4500000,
        type: 'income',
        category: 'Thu nhập',
        date: date(8),
      },
      {
        id: 't3',
        name: 'Đi chợ cuối tuần',
        amount: 485000,
        type: 'expense',
        category: 'Ăn uống',
        date: date(7),
      },
      {
        id: 't4',
        name: 'Một cuốn sách mới',
        amount: 189000,
        type: 'expense',
        category: 'Mua sắm',
        date: date(6),
      },
      {
        id: 't5',
        name: 'Grab về nhà',
        amount: 72000,
        type: 'expense',
        category: 'Di chuyển',
        date: date(5),
      },
      {
        id: 't6',
        name: 'Tổ ấm tháng này',
        amount: 4500000,
        type: 'expense',
        category: 'Hóa đơn',
        date: date(3),
      },
      {
        id: 't7',
        name: 'Bữa tối cùng bạn',
        amount: 320000,
        type: 'expense',
        category: 'Ăn uống',
        date: date(2),
      },
      {
        id: 't8',
        name: 'Lương tháng này',
        amount: 24000000,
        type: 'income',
        category: 'Thu nhập',
        date: date(1),
      },
    ],
    bills: [
      {
        id: 'b1',
        name: 'Điện tổ ấm',
        amount: 485000,
        dueDate: date(15),
        paid: false,
        kind: 'electric',
      },
      {
        id: 'b2',
        name: 'Internet FPT',
        amount: 220000,
        dueDate: date(18),
        paid: false,
        kind: 'wifi',
      },
      {
        id: 'b3',
        name: 'Spotify Premium',
        amount: 59000,
        dueDate: date(22),
        paid: false,
        kind: 'music',
      },
      {
        id: 'b4',
        name: 'Tổ ấm tháng này',
        amount: 4500000,
        dueDate: date(3),
        paid: true,
        kind: 'home',
      },
    ],
    goals: [
      {
        id: 'g1',
        name: 'Một chuyến đi xa',
        description: 'Đà Lạt, một sáng không vội.',
        target: 10000000,
        saved: 6500000,
        kind: 'travel',
      },
      {
        id: 'g2',
        name: 'Những ngày mưa',
        description: 'Một chút an tâm để dành.',
        target: 30000000,
        saved: 12000000,
        kind: 'rainy',
      },
      {
        id: 'g3',
        name: 'Góc nhỏ sáng tạo',
        description: 'Chiếc máy ảnh mình luôn Splitly',
        target: 20000000,
        saved: 4500000,
        kind: 'creative',
      },
    ],
  }
}
