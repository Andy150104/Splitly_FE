import { useState } from 'react'
import type { Dispatch, FormEvent } from 'react'
import { ArrowUpRight, Check, Sprout } from 'lucide-react'
import Modal from './Modal'
import { currency, localDate, totalBalance, validAmount } from '../lib/finance'
import type { Category, DialogState, FinanceAction, FinanceState } from '../types'

export default function FinanceDialog({
  dialog,
  state,
  dispatch,
  onClose,
  notify,
}: {
  dialog: NonNullable<DialogState>
  state: FinanceState
  dispatch: Dispatch<FinanceAction>
  onClose: () => void
  notify: (message: string) => void
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [error, setError] = useState('')
  const goal = dialog.kind === 'goal' ? state.goals.find((g) => g.id === dialog.id) : undefined
  const title =
    dialog.kind === 'transaction'
      ? 'Ghi lại một chút.'
      : dialog.kind === 'bill'
        ? 'Thêm một hóa đơn.'
        : dialog.kind === 'goal'
          ? (goal?.name ?? 'Điều đang Splitly')
          : 'Chào bạn, mình là Splitly'
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const amount = Number(data.get('amount'))
    if (!validAmount(amount)) {
      setError('Nhập số tiền nguyên dương, tối đa 1.000 tỷ đồng.')
      return
    }
    const id = crypto.randomUUID()
    if (dialog.kind === 'goal' && goal) {
      if (amount > goal.target - goal.saved) {
        setError(`Bạn chỉ cần thêm ${currency(goal.target - goal.saved)} để chạm ước mơ này.`)
        return
      }
      if (amount > totalBalance(state)) {
        setError('Số tiền để dành vượt quá số dư hiện tại.')
        return
      }
      dispatch({ type: 'SAVE_GOAL', id: goal.id, amount, transactionId: id, date: localDate() })
      notify('Ước mơ vừa gần hơn một chút!')
    } else {
      const name = String(data.get('name') ?? '').trim()
      if (!name) {
        setError('Bạn đặt một cái tên cho khoản này nhé.')
        return
      }
      const date = String(data.get('date'))
      if (!date || Number.isNaN(Date.parse(date))) {
        setError('Chọn một ngày hợp lệ nhé.')
        return
      }
      if (dialog.kind === 'transaction') {
        dispatch({
          type: 'ADD_TRANSACTION',
          transaction: {
            id,
            name,
            amount,
            date,
            type,
            category: type === 'income' ? 'Thu nhập' : (String(data.get('category')) as Category),
          },
        })
        notify('Đã ghi lại giao dịch. Gọn thêm một chút!')
      } else if (dialog.kind === 'bill') {
        dispatch({
          type: 'ADD_BILL',
          bill: { id, name, amount, dueDate: date, paid: false, kind: 'other' },
        })
        notify('Hóa đơn đã có chỗ. Bạn yên tâm nhé!')
      }
    }
    onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      {dialog.kind === 'about' ? (
        <div className="about-content">
          <span className="about-flower">✳</span>
          <p>
            Splitly bắt đầu từ một ý nghĩ nhỏ: tiền bạc gọn gàng thì cuộc sống có thêm chỗ cho những
            điều đẹp.
          </p>
          <p>
            Một khoản cà phê, một hóa đơn đúng hẹn, một chuyến đi đang để dành. Không phải để tính
            toán nhiều hơn. Để thảnh thơi nhiều hơn.
          </p>
          <div className="local-note">
            <Sprout size={20} />
            <span>
              Đây là bản trải nghiệm frontend. Dữ liệu mẫu và thay đổi của bạn lưu trên trình duyệt
              hiện tại. Không có thanh toán thật, tài khoản hay kết nối ngân hàng.
            </span>
          </div>
          <button className="button button-dark full-width" onClick={onClose}>
            Một khởi đầu nhẹ tênh <Check size={18} />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="finance-form">
          {dialog.kind === 'transaction' && (
            <div className="form-type-switch" aria-label="Loại giao dịch">
              <button
                type="button"
                aria-pressed={type === 'expense'}
                className={type === 'expense' ? 'selected' : ''}
                onClick={() => setType('expense')}
              >
                Khoản chi
              </button>
              <button
                type="button"
                aria-pressed={type === 'income'}
                className={type === 'income' ? 'selected' : ''}
                onClick={() => setType('income')}
              >
                Khoản thu
              </button>
            </div>
          )}
          {goal && (
            <div className="goal-dialog-summary">
              <span>
                Đã dành dụm <b>{currency(goal.saved)}</b>
              </span>
              <span>
                Mục tiêu <b>{currency(goal.target)}</b>
              </span>
              <p>Khoản để dành được chuyển từ số dư ví và ghi lại trong mục Tiết kiệm.</p>
            </div>
          )}
          {dialog.kind !== 'goal' && (
            <label>
              Tên {dialog.kind === 'bill' ? 'hóa đơn' : 'giao dịch'}
              <input
                name="name"
                placeholder={
                  dialog.kind === 'bill' ? 'Ví dụ: Internet tháng này' : 'Ví dụ: Cà phê cùng bạn'
                }
                maxLength={80}
                required
                autoFocus
              />
            </label>
          )}
          <label>
            {goal ? 'Bạn muốn để dành thêm bao nhiêu?' : 'Số tiền'}
            <div className="amount-field">
              <input
                name="amount"
                type="number"
                min="1"
                max={
                  goal
                    ? Math.min(goal.target - goal.saved, Math.max(0, totalBalance(state)))
                    : 1_000_000_000_000
                }
                step="1"
                inputMode="numeric"
                placeholder="0"
                required
                autoFocus={dialog.kind === 'goal'}
                disabled={goal ? goal.saved >= goal.target : false}
              />
              <span>VND</span>
            </div>
          </label>
          {dialog.kind === 'transaction' && type === 'expense' && (
            <label>
              Danh mục
              <select name="category">
                {['Ăn uống', 'Mua sắm', 'Di chuyển', 'Hóa đơn', 'Tiết kiệm', 'Khác'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          {dialog.kind !== 'goal' && (
            <label>
              {dialog.kind === 'bill' ? 'Ngày đến hạn' : 'Ngày giao dịch'}
              <input
                name="date"
                type="date"
                defaultValue={localDate()}
                min="2000-01-01"
                max="2100-12-31"
                required
              />
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-dark full-width"
            type="submit"
            disabled={goal ? goal.saved >= goal.target : false}
          >
            {goal
              ? goal.saved >= goal.target
                ? 'Bạn đã chạm ước mơ này!'
                : 'Gần ước mơ thêm một chút'
              : 'Lưu lại, nhẹ lòng'}{' '}
            <ArrowUpRight size={18} />
          </button>
          <p className="form-footnote">Chỉ lưu trên trình duyệt này. Không chuyển tiền thật.</p>
        </form>
      )}
    </Modal>
  )
}
