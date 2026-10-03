import { ArrowUpRight, Check, Plus, RotateCcw, Users } from 'lucide-react'
import type { StoryDemo } from '../lib/story'

const money = (amount: number) => `${amount.toLocaleString('vi-VN')} ₫`

export default function StoryInteraction({
  chapter,
  demo,
  onChange,
  onOpenWallet,
}: {
  chapter: number
  demo: StoryDemo
  onChange: (patch: Partial<StoryDemo>) => void
  onOpenWallet: () => void
}) {
  return (
    <div className="story-experiment">
      <span className="experiment-label">MỘT CHÚT TRẢI NGHIỆM</span>
      {chapter === 1 && (
        <>
          <div className="experiment-heading">
            <Users size={17} />
            <span>Bữa tối cùng nhau · 720.000 ₫</span>
          </div>
          <div className="split-options" role="group" aria-label="Số người chia tiền">
            {([2, 3, 4] as const).map((people) => (
              <button
                key={people}
                aria-pressed={demo.people === people}
                onClick={() => onChange({ people })}
              >
                {people} người
              </button>
            ))}
          </div>
          <div className="experiment-result" aria-live="polite" aria-atomic="true">
            <strong>{money(720000 / demo.people)}</strong>
            <span>mỗi người, vừa xinh.</span>
          </div>
        </>
      )}
      {chapter === 2 && (
        <>
          <div className="experiment-heading">
            <span>Internet tháng này</span>
            <strong>250.000 ₫</strong>
          </div>
          <button
            className={`experiment-action ${demo.paid ? 'is-complete' : ''}`}
            aria-pressed={demo.paid}
            onClick={() => onChange({ paid: !demo.paid })}
          >
            {demo.paid ? <Check size={17} /> : <Plus size={17} />}
            {demo.paid ? 'Đã xong. Nhẹ đầu rồi.' : 'Thử đánh dấu đã trả'}
            {demo.paid && <RotateCcw size={13} />}
          </button>
          <span className="experiment-footnote" role="status">
            {demo.paid
              ? 'Một dấu tích. Thêm một điều bớt lo.'
              : 'Chạm một lần, xem hóa đơn được đóng dấu.'}
          </span>
        </>
      )}
      {chapter === 3 && (
        <>
          <div className="experiment-heading">
            <span>Khoảng thở của tháng này</span>
          </div>
          <div className="experiment-result">
            <strong>35.369.000 ₫</strong>
            <span>đang có trong ví mẫu</span>
          </div>
          <button className="experiment-link" onClick={onOpenWallet}>
            Khám phá từng khoản <ArrowUpRight size={17} />
          </button>
        </>
      )}
      {chapter === 4 && (
        <>
          <div className="experiment-heading">
            <span>Một chuyến đi nhỏ</span>
            <strong aria-live="polite">{money(demo.saved * 50000)}</strong>
          </div>
          <div
            className="experiment-progress"
            role="progressbar"
            aria-label="Quỹ chuyến đi mẫu"
            aria-valuemin={0}
            aria-valuemax={500000}
            aria-valuenow={demo.saved * 50000}
          >
            <span style={{ width: `${demo.saved * 10}%` }} />
          </div>
          <button
            className="experiment-action"
            onClick={() => (demo.saved < 10 ? onChange({ saved: demo.saved + 1 }) : onOpenWallet())}
          >
            {demo.saved < 10 ? <Plus size={17} /> : <Check size={17} />}
            {demo.saved < 10 ? 'Để dành thử 50.000 ₫' : 'Đủ một khởi đầu. Ghé ví thôi!'}
          </button>
          <span className="experiment-footnote">Thử thả một đồng xu, gần ước mơ thêm chút.</span>
        </>
      )}
      <span className="experiment-demo-note">
        Minh họa tương tác · không thay đổi tiền trong ví.
      </span>
    </div>
  )
}
