import { ArrowUpRight, Camera, MoveUpRight, Plane, Umbrella } from 'lucide-react'
import Reveal from './Reveal'
import type { Goal } from '../types'

export default function Dreams({ goals, onGoal }: { goals: Goal[]; onGoal: (id: string) => void }) {
  return (
    <section className="dreams-section section-wrap" id="dreams" aria-labelledby="dreams-title">
      <Reveal className="dreams-heading">
        <span className="eyebrow">DÀNH CHO NHỮNG ĐIỀU CÙNG NHAU</span>
        <h2 id="dreams-title">
          HÔM NAY GỌN HƠN.
          <br />
          <span className="dream-heading-last">
            NGÀY MAI <span>RỘNG HƠN.</span>
            <MoveUpRight strokeWidth={1} />
          </span>
        </h2>
        <p>
          Một chuyến đi, một góc nhà, một cuộc hẹn cuối tuần.
          <br />
          Chia khoản chung thật gọn, để niềm vui luôn ở lại.
        </p>
      </Reveal>
      <div className="dreams-grid">
        {goals.map((goal, index) => {
          const Icon = goal.kind === 'travel' ? Plane : goal.kind === 'rainy' ? Umbrella : Camera
          const scenarios = [
            {
              name: 'Chuyến đi của tụi mình',
              description: 'Vé xe, chỗ ở, những bữa ăn cùng nhau.',
            },
            { name: 'Một tổ ấm chung', description: 'Tiền nhà, điện nước, các khoản chung.' },
            { name: 'Những niềm vui nhỏ', description: 'Bữa tối, cà phê, một buổi hẹn cuối tuần.' },
          ]
          const scenario = scenarios[index % scenarios.length]
          return (
            <Reveal key={goal.id} delay={index * 0.08}>
              <button className={`dream-card dream-${goal.kind}`} onClick={() => onGoal(goal.id)}>
                <span className="dream-card-label">MỘT NIỀM VUI CHUNG · 0{index + 1}</span>
                <div className="dream-illustration" aria-hidden="true">
                  <div className="dream-art-halo" />
                  <div className="dream-object">
                    <Icon strokeWidth={1.3} />
                  </div>
                  <span className="dream-art-star">✳</span>
                  {goal.kind === 'travel' && <div className="luggage-lines" />}
                  {goal.kind === 'rainy' && (
                    <>
                      <i className="rain-drop drop-one" />
                      <i className="rain-drop drop-two" />
                      <i className="rain-drop drop-three" />
                    </>
                  )}
                </div>
                <div className="dream-info">
                  <div>
                    <h3>{scenario.name}</h3>
                    <p>{scenario.description}</p>
                  </div>
                  <span className="dream-arrow">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="dream-progress-label">
                  <span>Tạo nhóm của bạn</span>
                  <b>
                    <ArrowUpRight size={17} />
                  </b>
                </div>
              </button>
            </Reveal>
          )
        })}
      </div>
      <Reveal className="dreams-note">
        <span>✳</span>Điều đẹp đẽ bắt đầu từ những lần cùng nhau.
      </Reveal>
    </section>
  )
}
