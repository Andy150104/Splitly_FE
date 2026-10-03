import { useState } from 'react'
import type { Dispatch } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Coffee,
  Download,
  Home,
  Music2,
  Plus,
  ReceiptText,
  Search,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'
import Modal from './Modal'
import {
  currency,
  localDate,
  monthKey,
  prettyDate,
  summarize,
  toCsv,
  totalBalance,
} from '../lib/finance'
import type { DialogState, FinanceAction, FinanceState } from '../types'

export type WalletTab = 'overview' | 'transactions' | 'bills'

export default function WalletDemo({
  state,
  dispatch,
  initialTab,
  onClose,
  openDialog,
  notify,
  storageAvailable,
}: {
  state: FinanceState
  dispatch: Dispatch<FinanceAction>
  initialTab: WalletTab
  onClose: () => void
  openDialog: (dialog: NonNullable<DialogState>) => void
  notify: (message: string) => void
  storageAvailable: boolean
}) {
  const [tab, setTab] = useState<WalletTab>(initialTab)
  const [month, setMonth] = useState(monthKey())
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const summary = summarize(state.transactions, month)
  const visibleTransactions = summary.transactions
    .filter(
      (t) =>
        (filter === 'all' || t.type === filter) &&
        `${t.name} ${t.category}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
  const monthOptions = [
    ...new Set([
      monthKey(),
      ...state.transactions.map((t) => t.date.slice(0, 7)),
      ...Array.from({ length: 3 }, (_, i) =>
        monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - i - 1, 1)),
      ),
    ]),
  ]
    .sort()
    .reverse()
  const unpaid = state.bills.filter((b) => !b.paid)
  function download() {
    const blob = new Blob([toCsv(visibleTransactions)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mo-giao-dich-${month}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify(`Đã xuất ${visibleTransactions.length} giao dịch.`)
  }
  return (
    <Modal title="Ví gọn. Ngày nhẹ." onClose={onClose} wide>
      <div className="wallet-demo">
        <div className="demo-notice">
          <span className="status-dot" />{' '}
          {storageAvailable
            ? 'Bản trải nghiệm · Dữ liệu lưu trên trình duyệt này'
            : 'Trình duyệt không cho lưu dữ liệu. Thay đổi sẽ mất khi tải lại.'}
        </div>
        <div className="wallet-toolbar">
          <div className="wallet-tabs" role="tablist" aria-label="Nội dung ví">
            {(
              [
                ['overview', 'Tổng quan'],
                ['transactions', 'Giao dịch'],
                ['bills', 'Hóa đơn'],
              ] as const
            ).map(([key, label]) => (
              <button
                id={`tab-${key}`}
                role="tab"
                aria-selected={tab === key}
                aria-controls="wallet-panel"
                key={key}
                className={tab === key ? 'active' : ''}
                onClick={() => setTab(key)}
              >
                {label}
                {key === 'bills' && <span>{unpaid.length}</span>}
              </button>
            ))}
          </div>
          {tab !== 'bills' && (
            <select
              aria-label="Tháng xem giao dịch"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option value={m} key={m}>
                  Tháng {Number(m.slice(5))}, {m.slice(0, 4)}
                </option>
              ))}
            </select>
          )}
        </div>
        <div id="wallet-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'overview' && (
            <div className="wallet-stats">
              <div className="stat-card primary-stat">
                <span>
                  <Wallet size={17} /> Số dư hiện tại
                </span>
                <b>{currency(totalBalance(state))}</b>
                <small>Toàn bộ thời gian · chưa gồm tiền để dành</small>
              </div>
              <div className="stat-card">
                <span>
                  <ArrowDownLeft size={17} /> Thu nhập tháng
                </span>
                <b>{currency(summary.income)}</b>
                <small>Những điều tốt đẹp vừa tới</small>
              </div>
              <div className="stat-card">
                <span>
                  <ArrowUpRight size={17} /> Chi tiêu tháng
                </span>
                <b>{currency(summary.expense)}</b>
                <small>Gồm cả khoản chuyển sang để dành</small>
              </div>
            </div>
          )}
          {tab !== 'bills' ? (
            <section className="transactions-section">
              <div className="demo-section-heading">
                <h3>{tab === 'overview' ? 'Những khoản gần đây' : 'Từng khoản, thật rõ ràng'}</h3>
                <button
                  className="button button-dark button-small"
                  onClick={() => openDialog({ kind: 'transaction' })}
                >
                  <Plus size={16} /> Thêm giao dịch
                </button>
              </div>
              <div className="transaction-controls">
                <div className="filter-chips">
                  {[
                    ['all', 'Tất cả'],
                    ['income', 'Thu nhập'],
                    ['expense', 'Chi tiêu'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      aria-pressed={filter === key}
                      className={filter === key ? 'active' : ''}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="table-actions">
                  <label className="search-field">
                    <Search size={16} />
                    <input
                      placeholder="Tìm giao dịch"
                      aria-label="Tìm giao dịch"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <button
                    className="icon-button export-button"
                    onClick={download}
                    aria-label="Xuất giao dịch CSV"
                    title="Xuất CSV"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <div className="transaction-list">
                {visibleTransactions.length === 0 ? (
                  <div className="empty-state">
                    <ReceiptText size={32} />
                    <h4>Chưa có khoản nào ở đây.</h4>
                    <p>Thử tháng khác, từ khóa khác hoặc ghi lại giao dịch đầu tiên.</p>
                  </div>
                ) : (
                  visibleTransactions.slice(0, tab === 'overview' ? 5 : undefined).map((t) => (
                    <div className="transaction-row" key={t.id}>
                      <span
                        className={`transaction-icon ${t.type === 'income' ? 'income-icon' : ''}`}
                      >
                        {t.type === 'income' ? (
                          <ArrowDownLeft size={18} />
                        ) : t.category === 'Ăn uống' ? (
                          <Coffee size={18} />
                        ) : (
                          <ReceiptText size={18} />
                        )}
                      </span>
                      <div className="transaction-name">
                        <b>{t.name}</b>
                        <span>
                          {t.category} <i>·</i> {prettyDate(t.date)}
                        </span>
                      </div>
                      <span
                        className={`transaction-amount ${t.type === 'income' ? 'income-text' : ''}`}
                      >
                        {t.type === 'income' ? '+' : '−'} {currency(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              {tab === 'overview' && visibleTransactions.length > 5 && (
                <button
                  className="text-link all-transactions"
                  onClick={() => setTab('transactions')}
                >
                  Xem tất cả {visibleTransactions.length} giao dịch <ArrowUpRight size={16} />
                </button>
              )}
            </section>
          ) : (
            <section>
              <div className="demo-section-heading">
                <div>
                  <h3>Hóa đơn gọn, đầu nhẹ.</h3>
                  <p>
                    Còn {unpaid.length} hóa đơn ·{' '}
                    {currency(unpaid.reduce((sum, b) => sum + b.amount, 0))}
                  </p>
                </div>
                <button
                  className="button button-dark button-small"
                  onClick={() => openDialog({ kind: 'bill' })}
                >
                  <Plus size={16} /> Thêm hóa đơn
                </button>
              </div>
              <div className="bill-list">
                {[...state.bills]
                  .sort(
                    (a, b) => Number(a.paid) - Number(b.paid) || a.dueDate.localeCompare(b.dueDate),
                  )
                  .map((bill) => {
                    const Icon =
                      bill.kind === 'electric'
                        ? Zap
                        : bill.kind === 'wifi'
                          ? Wifi
                          : bill.kind === 'music'
                            ? Music2
                            : bill.kind === 'home'
                              ? Home
                              : ReceiptText
                    const overdue = !bill.paid && bill.dueDate < localDate()
                    return (
                      <div className={`bill-row ${bill.paid ? 'bill-paid' : ''}`} key={bill.id}>
                        <span className="transaction-icon">
                          <Icon size={20} />
                        </span>
                        <div className="bill-name">
                          <b>{bill.name}</b>
                          <span className={overdue ? 'overdue-text' : ''}>
                            {bill.paid
                              ? 'Đã ghi nhận thanh toán'
                              : `${overdue ? 'Quá hạn' : 'Đến hạn'} ${prettyDate(bill.dueDate)}`}
                          </span>
                        </div>
                        <strong>{currency(bill.amount)}</strong>
                        <button
                          disabled={bill.paid}
                          className={bill.paid ? 'bill-done' : 'bill-pay'}
                          onClick={() => {
                            dispatch({
                              type: 'PAY_BILL',
                              id: bill.id,
                              transactionId: crypto.randomUUID(),
                              date: localDate(),
                            })
                            notify('Đã đánh dấu thanh toán và ghi khoản chi vào ví.')
                          }}
                        >
                          {bill.paid ? (
                            <>
                              <Check size={14} /> Đã xong
                            </>
                          ) : (
                            'Đánh dấu đã trả'
                          )}
                        </button>
                      </div>
                    )
                  })}
              </div>
              <p className="form-footnote">
                Đánh dấu đã trả sẽ tạo một khoản chi trong ví. Không thực hiện thanh toán thật.
              </p>
            </section>
          )}
        </div>
      </div>
    </Modal>
  )
}
