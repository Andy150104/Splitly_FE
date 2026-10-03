'use client'

import Select from '../ui/Select'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { send } from '../../lib/api/client'
import { Field } from '../ui/Field'
import { Notice } from '../ui/Feedback'
import { PageHeading } from '../ui/PageHeading'
import { useWorkspace } from './hooks'

export default function Support({ billId }: { billId?: string }) {
  const { user } = useWorkspace()
  const [email, setEmail] = useState(user.email)
  const [relatedBill, setRelatedBill] = useState(billId || '')
  const [type, setType] = useState('Other')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    setSuccess('')
    try {
      if (
        relatedBill.trim() &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(relatedBill.trim())
      )
        throw new Error('Mã hóa đơn cần có định dạng UUID hợp lệ.')
      await send('support-requests', {
        contactEmail: email.trim().toLowerCase(),
        type,
        description: description.trim(),
        billId: relatedBill.trim() || null,
        paymentOrderId: null,
      })
      setSuccess('Yêu cầu đã được gửi. Đội ngũ hỗ trợ sẽ liên hệ qua email của bạn.')
      setDescription('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa gửi được yêu cầu.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="TRUNG TÂM HỖ TRỢ"
        title="Gửi yêu cầu."
        description="Mô tả vấn đề. Đội ngũ hỗ trợ sẽ liên hệ qua email của bạn."
      />
      <div className="ws-detail-grid">
        <form className="ws-panel ws-form" onSubmit={submit}>
          <Notice message={error} />
          <Notice message={success} success />
          <Field label="Email liên hệ">
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Bạn cần hỗ trợ về">
            <Select value={type} onValueChange={(value) => setType(value)}>
              <option value="Other">Câu hỏi chung</option>
              <option value="PaymentIssue">Thanh toán</option>
              <option value="PayoutIssue">Nhận tiền</option>
              <option value="AccountIssue">Tài khoản & quyền truy cập</option>
            </Select>
          </Field>
          {billId && <p className="ws-muted">Yêu cầu này được gắn với hóa đơn bạn đang xem.</p>}
          <Field
            label="Mã hóa đơn liên quan · tùy chọn"
            hint="Tự điền khi bạn mở hỗ trợ từ trang hóa đơn."
          >
            <input
              value={relatedBill}
              maxLength={36}
              onChange={(event) => setRelatedBill(event.target.value)}
              placeholder="Dán mã hóa đơn nếu cần đối soát"
            />
          </Field>
          <Field label="Điều bạn muốn chia sẻ">
            <textarea
              required
              minLength={10}
              maxLength={1000}
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tình huống để chúng mình hỗ trợ tốt hơn…"
            />
          </Field>
          <div className="ws-form-actions">
            <button className="ws-button" disabled={pending || description.trim().length < 10}>
              {pending ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
        <aside className="ws-support-note">
          <span className="ws-eyebrow">TRƯỚC KHI GỬI</span>
          <h2>
            Thêm thông tin,
            <br />
            xử lý nhanh hơn.
          </h2>
          <p>
            Cho chúng mình biết khoản nào đang gặp vấn đề, thời điểm xảy ra và điều bạn mong muốn
            được hỗ trợ.
          </p>
          <ol>
            <li>Hóa đơn đang gặp vấn đề</li>
            <li>Thời điểm xảy ra</li>
            <li>Nội dung cần hỗ trợ</li>
          </ol>
        </aside>
      </div>
    </>
  )
}
