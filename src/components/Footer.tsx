import { ArrowUp, ArrowUpRight, Heart, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import Reveal from './Reveal'
import Brand from './ui/Brand'

const questions = [
  {
    q: 'Mọi người thanh toán khoản chung như thế nào?',
    a: 'Khi bạn phát hành hóa đơn, mỗi người nhận email mời thanh toán. Mở hóa đơn để xem phần của mình, quét mã QR hoặc thanh toán qua PayOS. Trạng thái cập nhật khi hệ thống xác nhận giao dịch.',
  },
  {
    q: 'Dữ liệu của mình được lưu ở đâu?',
    a: 'Hóa đơn, nhóm và tài khoản nhận tiền được lưu trên hệ thống, gắn với tài khoản của bạn. Đăng nhập trên thiết bị khác để tiếp tục theo dõi những khoản chung.',
  },
  {
    q: 'Mình bắt đầu cùng Splitly như thế nào?',
    a: 'Bấm “Bắt đầu”, đăng nhập bằng mã gửi qua email hoặc Google nếu có. Thêm tài khoản nhận tiền, tạo hóa đơn và mời những người cùng chia. Trang giới thiệu này có thể xem mà không cần đăng nhập.',
  },
]

export default function Footer({
  onOpenWallet,
  onAbout,
  year,
}: {
  onOpenWallet: () => void
  onAbout: () => void
  year: number
}) {
  const [expanded, setExpanded] = useState<number | null>(null)
  return (
    <>
      <section className="faq-section section-wrap" aria-labelledby="faq-title">
        <Reveal>
          <span className="eyebrow">MỘT CHÚT GIẢI ĐÁP</span>
          <h2 id="faq-title">
            CÒN ĐIỀU
            <br />
            BĂN KHOĂN?
          </h2>
        </Reveal>
        <div className="faq-list">
          {questions.map((item, index) => (
            <div className="faq-item" key={item.q}>
              <h3>
                <button
                  aria-expanded={expanded === index}
                  aria-controls={`faq-${index}`}
                  onClick={() => setExpanded(expanded === index ? null : index)}
                >
                  {item.q}
                  {expanded === index ? <Minus size={20} /> : <Plus size={20} />}
                </button>
              </h3>
              <div id={`faq-${index}`} hidden={expanded !== index}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <div className="footer-scallops" aria-hidden="true" />
        <div className="section-wrap">
          <Reveal className="footer-top">
            <div>
              <span className="eyebrow">NHẸ LÒNG BẮT ĐẦU TỪ ĐÂY.</span>
              <h2>
                CHO TIỀN MỘT CHỖ.
                <br />
                CHO MÌNH MỘT KHOẢNG THƠI.
              </h2>
            </div>
            <button className="button button-yellow" onClick={onOpenWallet}>
              Bắt đầu cùng Splitly <ArrowUpRight size={20} />
            </button>
          </Reveal>
          <div className="footer-brand-row">
            <a href="#home" aria-label="Splitly — Lên đầu trang">
              <Brand />
            </a>
            <p>
              Khoản chung rõ ràng.
              <br />
              Những lần cùng nhau nhẹ nhàng hơn.
            </p>
          </div>
          <div className="footer-bottom">
            <span>© {year} Splitly Chăm chút những điều nhỏ.</span>
            <button onClick={onAbout}>
              Một chút về Splitly <Heart size={12} />
            </button>
            <a href="#home">
              LÊN ĐẦU TRANG <ArrowUp size={14} />
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
