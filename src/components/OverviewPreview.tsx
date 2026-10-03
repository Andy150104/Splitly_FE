import {
  ArrowDownLeft,
  ArrowUpRight,
  Coffee,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
} from 'lucide-react'
import Reveal from './Reveal'
import { currency, summarize, totalBalance } from '../lib/finance'
import type { FinanceState } from '../types'

export default function OverviewPreview({
  state,
  month,
  onOpenWallet,
}: {
  state: FinanceState
  month: string
  onOpenWallet: () => void
}) {
  const summary = summarize(state.transactions, month)
  return (
    <section
      className="overview-section section-wrap"
      id="workspace"
      aria-labelledby="overview-title"
    >
      <Reveal className="overview-copy">
        <div className="eyebrow">KHI MỌI THỨ ĐÃ VÀO NẾP</div>
        <h2 id="overview-title">
          NHÌN MỘT LẦN.
          <br />
          BIẾT MÌNH
          <br />
          <span className="olive-text">ĐANG Ở ĐÂU.</span>
        </h2>
        <p>
          Hóa đơn đã tạo, những người cùng chia.
          <br />
          Nhìn rõ những khoản đã thanh toán —
          <br />
          để biết phần còn lại cần làm gì.
        </p>
        <button className="text-link" onClick={onOpenWallet}>
          Thử một ngày cùng Splitly <ArrowUpRight size={20} />
        </button>
        <div className="preview-values">
          <span>
            <ShieldCheck size={17} /> Thanh toán QR · Theo dõi rõ ràng
          </span>
          <span>
            <Sprout size={17} /> Bắt đầu thật đơn giản
          </span>
        </div>
      </Reveal>
      <Reveal className="preview-stage" delay={0.15}>
        <div className="preview-orbit" aria-hidden="true" />
        <div className="app-preview">
          <div className="preview-top">
            <span className="preview-logo">Splitly</span>
            <span>GIAO DIỆN MINH HỌA</span>
            <div className="preview-avatar">M</div>
          </div>
          <div className="preview-greeting">
            <div>
              <small>MỘT NGÀY THẬT ĐẸP ĐỂ BẮT ĐẦU</small>
              <h3>
                Chào bạn, thảnh thơi nhé <span>✳</span>
              </h3>
            </div>
            <SlidersHorizontal size={18} />
          </div>
          <div className="preview-balance">
            <div>
              <span>Tổng số dư hiện tại</span>
              <strong>{currency(totalBalance(state))}</strong>
            </div>
            <span className="balance-flower">✳</span>
            <div className="preview-income">
              <span>
                <ArrowDownLeft size={14} /> Thu nhập <b>{currency(summary.income)}</b>
              </span>
              <span>
                <ArrowUpRight size={14} /> Chi tiêu <b>{currency(summary.expense)}</b>
              </span>
            </div>
          </div>
          <div className="preview-recent">
            <b>Một chút gần đây</b>
            <button onClick={onOpenWallet} aria-label="Mở giao dịch">
              <Plus size={16} />
            </button>
          </div>
          <div className="preview-transaction">
            <span className="transaction-icon">
              <Coffee size={19} />
            </span>
            <span>
              <b>Một chút cà phê</b>
              <small>Ăn uống · Một niềm vui nhỏ</small>
            </span>
            <strong>− 65.000 ₫</strong>
          </div>
          <div className="preview-chart">
            <div>
              <b>Tuần này, trong tầm tay.</b>
              <span>Chi tiêu vừa đủ. Niềm vui vừa đầy.</span>
            </div>
            <div className="bar-chart" aria-label="Biểu đồ chi tiêu minh họa trong tuần">
              {[43, 68, 37, 83, 56, 95, 48].map((height, i) => (
                <div key={i}>
                  <span style={{ height: `${height}%` }} />
                  <small>{i < 6 ? `T${i + 2}` : 'CN'}</small>
                </div>
              ))}
            </div>
          </div>
          <button className="preview-open" onClick={onOpenWallet}>
            Chạm để trải nghiệm <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="preview-sticker">
          <span>✓</span>GỌN TIỀN.
          <br />
          NHẸ TÊNH.
        </div>
        <div className="preview-hand-note">
          Một góc nhỏ, thật yên.<span>↗</span>
        </div>
      </Reveal>
    </section>
  )
}
