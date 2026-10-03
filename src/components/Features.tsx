import type { PointerEvent } from 'react'
import { ArrowUpRight, Check, ArrowDownLeft, Wallet, Plus } from 'lucide-react'
import Reveal from './Reveal'

export default function Features({
  onOpenWallet,
}: {
  onOpenWallet: (tab?: 'overview' | 'transactions' | 'bills') => void
}) {
  const tiltCard = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty('--tilt-x', `${-y * 3.8}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${x * 5.2}deg`)
    event.currentTarget.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`)
    event.currentTarget.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`)
  }
  const resetTilt = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg')
    event.currentTarget.style.setProperty('--tilt-y', '0deg')
  }
  const tiltProps = {
    onPointerMove: tiltCard,
    onPointerLeave: resetTilt,
  }
  return (
    <section className="features-section" id="details" aria-labelledby="features-title">
      <div className="section-wrap">
        <Reveal className="section-kicker">
          <span>CHẠM VÀO TỪNG PHẦN</span>
          <span className="mini-sun">✳</span>
          <span>NHỮNG VIỆC NHỎ, ĐƯỢC LÀM THẬT GỌN</span>
        </Reveal>
        <Reveal className="features-intro">
          <h2 id="features-title">
            CÂU CHUYỆN XONG RỒI.
            <br />
            <span>GIỜ CHẠM THỬ TỪNG PHẦN.</span>
          </h2>
          <p>
            Nhóm bạn, hóa đơn và tài khoản nhận tiền — mọi khoản chung đều có chỗ.
            <br />
            Bắt đầu từ một khoản nhỏ, để những lần cùng nhau luôn thật thảnh thơi.
          </p>
        </Reveal>
        <div className="feature-grid">
          <Reveal className="feature-item" delay={0.05}>
            <div className="feature-card-shell" {...tiltProps}>
              <button
                className="feature-card feature-balance"
                onClick={() => onOpenWallet('transactions')}
                aria-label="Khám phá nhóm cùng chia"
              >
                <span className="feature-index">01 — NHÓM CÙNG CHIA</span>
                <div className="feature-art balance-art" aria-hidden="true">
                  <div className="art-disc" />
                  <div className="mini-bank-card">
                    <div>
                      <span>Splitly</span>
                      <Wallet size={20} />
                    </div>
                    <small>SỐ DƯ CỦA BẠN</small>
                    <b>
                      35.369.000 <small>₫</small>
                    </b>
                    <span className="card-dots">•••• &nbsp; •••• &nbsp; 0926</span>
                  </div>
                  <div className="mini-income">
                    <span>
                      <ArrowDownLeft size={18} />
                    </span>
                    <div>
                      Một ngày thật tốt<b>+ 4.500.000 ₫</b>
                    </div>
                  </div>
                  <span className="art-spark spark-one">✳</span>
                </div>
                <div className="feature-card-bottom">
                  <h3>
                    KHOẢN CHUNG GỌN,
                    <br />
                    BẠN BÈ VUI.
                  </h3>
                  <span className="round-arrow">
                    <ArrowUpRight />
                  </span>
                </div>
              </button>
            </div>
            <p>
              Gia đình, bạn bè, đồng nghiệp. Gom vào một nhóm,
              <br />
              để mỗi lần chia tiền đều dễ dàng hơn.
            </p>
          </Reveal>
          <Reveal className="feature-item" delay={0.13}>
            <div className="feature-card-shell" {...tiltProps}>
              <button
                className="feature-card feature-bills"
                onClick={() => onOpenWallet('bills')}
                aria-label="Khám phá quản lý hóa đơn"
              >
                <span className="feature-index">02 — HÓA ĐƠN</span>
                <div className="feature-art bills-art" aria-hidden="true">
                  <div className="art-disc" />
                  <div className="paper-receipt">
                    <div className="receipt-brand">Splitly</div>
                    <span>THÊM MỘT ĐIỀU BỚT LO.</span>
                    <div className="receipt-rule" />
                    <div>
                      Điện tổ ấm<b>485.000 ₫</b>
                    </div>
                    <div>
                      Internet<b>220.000 ₫</b>
                    </div>
                    <div>
                      Một chút âm nhạc<b>59.000 ₫</b>
                    </div>
                    <div className="receipt-rule" />
                    <div>
                      TỔNG CỘNG<strong>764.000 ₫</strong>
                    </div>
                    <div className="receipt-barcode" />
                  </div>
                  <div className="paid-stamp">
                    <Check size={30} />
                    <span>ĐÃ GỌN!</span>
                  </div>
                </div>
                <div className="feature-card-bottom">
                  <h3>
                    HÓA ĐƠN NHẸ.
                    <br />
                    ĐẦU CŨNG NHẸ.
                  </h3>
                  <span className="round-arrow">
                    <ArrowUpRight />
                  </span>
                </div>
              </button>
            </div>
            <p>
              Tạo hóa đơn, mời người cùng chia, phân bổ từng phần.
              <br />
              Theo dõi thanh toán. Nhắc đúng lúc.
            </p>
          </Reveal>
          <Reveal className="feature-item" delay={0.21}>
            <div className="feature-card-shell" {...tiltProps}>
              <button
                className="feature-card feature-saving"
                onClick={() => onOpenWallet('overview')}
                aria-label="Khám phá tài khoản nhận tiền"
              >
                <span className="feature-index">03 — NHẬN TIỀN</span>
                <div className="feature-art saving-art" aria-hidden="true">
                  <div className="art-disc" />
                  <div className="savings-jar">
                    <div className="jar-lid" />
                    <span className="jar-word">
                      Splitly<small>FOR SOMETHING GOOD</small>
                    </span>
                    <div className="jar-coin jar-coin-one">₫</div>
                    <div className="jar-coin jar-coin-two">₫</div>
                    <div className="jar-coin jar-coin-three">₫</div>
                  </div>
                  <div className="falling-coin">₫</div>
                  <span className="art-spark spark-two">✳</span>
                  <div className="savings-tag">
                    <Plus size={14} /> TIỀN VỀ ĐÚNG CHỖ
                  </div>
                </div>
                <div className="feature-card-bottom">
                  <h3>
                    CHIA MỘT CHÚT.
                    <br />
                    NHẸ THÊM MỘT CHÚT.
                  </h3>
                  <span className="round-arrow">
                    <ArrowUpRight />
                  </span>
                </div>
              </button>
            </div>
            <p>
              Thêm tài khoản ngân hàng, xác minh người nhận.
              <br />
              Khoản chung trở về, rõ ràng và an tâm.
            </p>
          </Reveal>
        </div>
        <div className="feature-footnote">
          <span>TIỀN BẠC KHÔNG CẦN PHỨC TẠP.</span>
          <span>
            CUỘC SỐNG CŨNG VẬY. <ArrowDownLeft size={16} />
          </span>
        </div>
      </div>
      <div className="scallop-edge" aria-hidden="true" />
    </section>
  )
}
