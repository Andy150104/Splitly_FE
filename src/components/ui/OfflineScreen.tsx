import { ArrowUpRight, RefreshCw, WifiOff } from 'lucide-react'
import Brand from './Brand'
import WalletPlaceholder from './WalletPlaceholder'

/** Shared by the live disconnect screen and the generated service-worker fallback. */
export default function OfflineScreen({
  checking = false,
  onRetry,
}: {
  checking?: boolean
  onRetry?: () => void
}) {
  return (
    <div
      className="splitly-offline-page"
      id="offline-home"
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return
        const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#offline-"]')
        const target = link && document.getElementById(link.hash.slice(1))
        if (!target) return
        event.preventDefault()
        // Keep the original URL, including its hash, for automatic recovery.
        target.scrollIntoView({ block: 'start' })
      }}
    >
      <header className="splitly-offline-header">
        <a className="splitly-offline-brand" href="#offline-home" aria-label="Splitly — Trang đầu">
          <Brand />
        </a>
        <nav className="splitly-offline-nav" aria-label="Điều hướng Splitly">
          <a href="#offline-home">Trang đầu</a>
          <a href="#offline-discover">Khám phá</a>
          <a href="#offline-dreams">Cùng nhau</a>
          <a href="#offline-about">Câu chuyện</a>
        </nav>
        <span className="splitly-offline-connection">
          <WifiOff size={14} aria-hidden="true" /> Ngoại tuyến
        </span>
      </header>
      <div className="splitly-offline-body">
        <div className="splitly-offline-topline" aria-hidden="true">
          <span>ÍT LO TOAN. NHIỀU ĐIỀU ĐẸP.</span>
          <span>
            MỘT NHỊP NGHỈ NHỎ <ArrowUpRight size={13} />
          </span>
        </div>
        <section className="splitly-offline-hero" aria-labelledby="offline-title">
          <div className="splitly-offline-copy">
            <span className="splitly-offline-eyebrow">
              <span /> KẾT NỐI ĐANG TẠM GIÁN ĐOẠN
            </span>
            <h1 id="offline-title">
              Không thể <br />
              <span>kết nối</span>
            </h1>
            <p className="splitly-offline-lead">Mình chờ bạn trở lại.</p>
            <p id="offline-description">
              Bạn đang ngoại tuyến. Kiểm tra kết nối Wi-Fi hoặc dữ liệu di động để tiếp tục những
              điều đang dang dở cùng Splitly.
            </p>
            <button
              className="splitly-offline-retry"
              type="button"
              disabled={checking}
              onClick={onRetry}
              autoFocus
            >
              <RefreshCw size={18} aria-hidden="true" />
              <span>{checking ? 'Đang kiểm tra…' : 'Thử lại'}</span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
            <p className="splitly-offline-hint" role="status" aria-live="polite">
              <span aria-hidden="true">✳</span>
              Trang sẽ tự tải lại khi có kết nối mạng.
            </p>
          </div>
          <div className="splitly-offline-art" aria-hidden="true">
            <span className="splitly-offline-orbit" />
            <span className="splitly-offline-orbit is-inner" />
            <span className="splitly-offline-art-label">TIỀN GỌN GÀNG. ĐỜI THẢNH THƠI.</span>
            <WalletPlaceholder />
            <span className="splitly-offline-art-status">
              <WifiOff size={20} /> MỘT CHÚT NỮA THÔI.
            </span>
            <span className="splitly-offline-art-footnote">
              Một khoảng dừng. Rồi mình tiếp tục.
            </span>
          </div>
        </section>
        <section
          className="splitly-offline-discover"
          id="offline-discover"
          aria-label="Khám phá Splitly"
        >
          <div className="splitly-offline-section-label">
            <span>VẪN LÀ KHÔNG GIAN CỦA BẠN</span>
            <span>01 — 03</span>
          </div>
          <div className="splitly-offline-cards">
            <article>
              <span className="splitly-offline-card-number">01 / KHOẢN CHUNG</span>
              <h2>
                Chia khoản chung.
                <br />
                Nhẹ chuyện tính toán.
              </h2>
              <p>Hóa đơn rõ ràng, mỗi người một phần. Những khoản chung về đúng chỗ.</p>
            </article>
            <article id="offline-dreams">
              <span className="splitly-offline-card-number">02 / CÙNG NHAU</span>
              <h2>
                Cùng một nhóm.
                <br />
                Bớt một nỗi lo.
              </h2>
              <p>Từ một bữa ăn đến một chuyến đi, cùng nhau giữ mọi thứ gọn gàng.</p>
            </article>
            <article>
              <span className="splitly-offline-card-number">03 / ĐIỀU ĐẸP PHÍA TRƯỚC</span>
              <h2>
                Mỗi ngày một chút.
                <br />
                Thảnh thơi thêm nhiều.
              </h2>
              <p>Dành một khoảng nhỏ cho những điều riêng, để tiền bạc nhẹ đầu hơn.</p>
            </article>
          </div>
        </section>
        <footer className="splitly-offline-footer" id="offline-about">
          <Brand />
          <p>Không cần bắt đầu thật giỏi. Chỉ cần bắt đầu thật gọn.</p>
          <a href="#offline-home">
            Về đầu trang <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  )
}
