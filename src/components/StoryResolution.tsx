import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import Reveal from './Reveal'

const phases = ['RỐI', 'CHIA', 'GỌN', 'RÕ', 'VUI']

export default function StoryResolution({ onOpenWallet }: { onOpenWallet: () => void }) {
  return (
    <section className="story-resolution" id="discover" aria-labelledby="resolution-title">
      <div className="story-resolution-rail" aria-label="Hành trình từ rối đến rõ">
        {phases.map((phase, index) => (
          <span key={phase}>
            <b>0{index + 1}</b>
            {phase}
            {index < phases.length - 1 && <i aria-hidden="true" />}
          </span>
        ))}
      </div>
      <div className="story-resolution-grid section-wrap">
        <Reveal className="story-resolution-kicker">
          <span>SAU MỘT VÒNG CUỘN</span>
          <ArrowDownRight size={18} strokeWidth={1.2} />
        </Reveal>
        <Reveal className="story-resolution-copy" delay={0.08}>
          <h2 id="resolution-title">
            VẪN LÀ TIỀN CỦA BẠN.
            <br />
            <span>CHỈ LÀ DỄ THỞ HƠN.</span>
          </h2>
          <div>
            <p>
              Splitly không cố biến tiền bạc thành một bài toán lớn. Chỉ gom những việc nhỏ về đúng
              chỗ — để bạn nhìn một lần, hiểu vừa đủ và tiếp tục sống phần còn lại của ngày.
            </p>
            <button className="resolution-link" onClick={onOpenWallet}>
              Bước vào không gian của bạn <ArrowUpRight size={18} />
            </button>
          </div>
        </Reveal>
      </div>
      <div className="story-resolution-word" aria-hidden="true">
        NHẸ.
      </div>
    </section>
  )
}
