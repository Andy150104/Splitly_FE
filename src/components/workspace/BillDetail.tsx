'use client'

import Select from '../ui/Select'

import Link from 'next/link'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, ArrowUpRight, Bell, Check, Copy, RefreshCw } from 'lucide-react'
import { money, safeExternalUrl, send } from '../../lib/api/client'
import { Disclosure, Reveal } from '../ui/Motion'
import WorkspaceModal, { ConfirmDialog } from '../ui/WorkspaceModal'
import type { BillMember } from '../../lib/api/types'
import type { BillView } from '../../lib/api/views'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

const needsPolling = (bill: BillView) =>
  bill.status !== 'Draft' &&
  bill.status !== 'Cancelled' &&
  (bill.members?.some((m) => m.remainingAmount > 0) ?? false)
export default function BillDetail({ billId }: { billId: string }) {
  const { user, can } = useWorkspace()
  const query = useApi<BillView>(`bills/${billId}`, needsPolling)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [manualMember, setManualMember] = useState<BillMember | null>(null)
  const [cancel, setCancel] = useState(false)
  const [reason, setReason] = useState('')
  const [removeMember, setRemoveMember] = useState('')
  const lock = useRef(false)
  async function action(path: string, body: unknown, success: string, method = 'POST') {
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    setMessage('')
    try {
      await send(`bills/${billId}/${path}`, body, method)
      setMessage(success)
      setCancel(false)
      setManualMember(null)
      setRemoveMember('')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa thực hiện được thao tác.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setMessage('Đã sao chép liên kết hóa đơn.')
    } catch {
      setError('Chưa sao chép được. Bạn có thể sao chép địa chỉ trên trình duyệt.')
    }
  }
  async function copyTransfer(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage('Đã sao chép nội dung chuyển khoản.')
    } catch {
      setError('Chưa sao chép được. Hãy chọn và sao chép nội dung chuyển khoản.')
    }
  }
  if (query.loading) return <Loading />
  if (!query.data && query.error) return <ErrorState message={query.error} retry={query.reload} />
  const bill = query.data
  if (!bill)
    return (
      <Empty
        title="Chưa tìm thấy hóa đơn"
        description="Kiểm tra lại liên kết hoặc quay về danh sách hóa đơn."
        href="/bills"
        action="Về hóa đơn"
      />
    )
  const active = bill.status !== 'Draft' && bill.status !== 'Cancelled'
  const percent = Math.min(100, Math.max(0, bill.completionPercentage || 0))
  return (
    <>
      <Link className="ws-back" href="/bills">
        <ArrowLeft size={16} />
        Về hóa đơn
      </Link>
      <PageHeading
        eyebrow="CHI TIẾT HÓA ĐƠN"
        title={bill.title || 'Hóa đơn của bạn'}
        description={bill.description || 'Theo dõi phần chia và thanh toán của từng người.'}
      >
        <Status value={bill.status} />
      </PageHeading>
      <Notice message={error || query.error} />
      <Notice message={message} success />
      <div className="ws-detail-grid">
        <div>
          <section className="ws-bill-summary ws-panel">
            <span className="ws-eyebrow">TỔNG KHOẢN CHUNG</span>
            <h2>{money(bill.totalAmount, bill.currency || 'VND')}</h2>
            <div className="ws-bill-stats">
              <div>
                <span>Đã thu</span>
                <strong>{money(bill.collectedAmount, bill.currency || 'VND')}</strong>
              </div>
              <div>
                <span>Còn lại</span>
                <strong>{money(bill.remainingAmount, bill.currency || 'VND')}</strong>
              </div>
              <div>
                <span>Người cùng chia</span>
                <strong>{bill.members?.length || 0}</strong>
              </div>
            </div>
            <div
              className="ws-progress"
              role="progressbar"
              aria-label="Tiến độ thanh toán"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${percent}%` }} />
            </div>
            <div className="ws-progress-caption">
              <span>{bill.paidMemberCount} người đã thanh toán</span>
              <strong>{percent}% hoàn tất</strong>
            </div>
          </section>
          <section className="ws-panel ws-members-panel">
            <div className="ws-section-heading">
              <h2>Mỗi người một phần.</h2>
              <button className="ws-text-button" onClick={query.reload} disabled={pending}>
                <RefreshCw size={15} />
                Làm mới
              </button>
            </div>
            {bill.members?.length ? (
              bill.members.map((member) => (
                <Disclosure
                  key={member.memberId}
                  title={
                    <span className="ws-member-caption">
                      <strong>{member.name || member.email || 'Thành viên'}</strong>
                      <small>{member.email}</small>
                    </span>
                  }
                  meta={
                    <span className="ws-member-caption ws-member-caption-money">
                      <strong>{money(member.assignedAmount, bill.currency || 'VND')}</strong>
                      <Status value={member.status} />
                    </span>
                  }
                  defaultOpen={false}
                  className="ws-member-disclosure"
                >
                  <div className="ws-member-row">
                    <span className="ws-avatar">
                      {(member.name || member.email || '?')[0].toUpperCase()}
                    </span>
                    <div className="ws-member-name">
                      <strong>{member.name || member.email}</strong>
                      <small>{member.email}</small>
                      <Status value={member.status} />
                    </div>
                    <div className="ws-member-money">
                      <strong>{money(member.assignedAmount, bill.currency || 'VND')}</strong>
                      <small>Còn {money(member.remainingAmount, bill.currency || 'VND')}</small>
                      {active &&
                        bill.isOwner &&
                        can('Payments.RecordManual') &&
                        member.remainingAmount > 0 && (
                          <button
                            disabled={pending}
                            className="ws-text-button"
                            onClick={() => {
                              setManualMember(member)
                              setError('')
                            }}
                          >
                            Ghi nhận đã trả
                          </button>
                        )}
                    </div>
                  </div>
                  <div className="ws-member-detail">
                    <div className="ws-member-detail-meta">
                      <span>
                        Đã thanh toán{' '}
                        <strong>{money(member.paidAmount, bill.currency || 'VND')}</strong>
                      </span>
                      <span>
                        Đã nhắc <strong>{member.reminderCount || 0} lần</strong>
                      </span>
                      {member.paidAtUtc && (
                        <span>
                          Xác nhận{' '}
                          <strong>{new Date(member.paidAtUtc).toLocaleString('vi-VN')}</strong>
                        </span>
                      )}
                    </div>
                    {can('Payments.Read') && (
                      <div className="ws-payment-history">
                        <h3>Lịch sử thanh toán</h3>
                        {member.payments?.length ? (
                          member.payments.map((payment) => (
                            <div className="ws-history-row" key={payment.paymentId}>
                              <span>
                                <strong>
                                  {payment.method === 'Cash'
                                    ? 'Tiền mặt'
                                    : payment.method === 'BankTransfer'
                                      ? 'Chuyển khoản'
                                      : payment.method}
                                </strong>
                                <small>
                                  {new Date(payment.paidAtUtc).toLocaleString('vi-VN')}
                                  {payment.note ? ` · ${payment.note}` : ''}
                                </small>
                              </span>
                              <strong>{money(payment.amount, bill.currency || 'VND')}</strong>
                            </div>
                          ))
                        ) : (
                          <p className="ws-muted">Chưa có giao dịch được ghi nhận.</p>
                        )}
                      </div>
                    )}
                    {active &&
                      member.remainingAmount > 0 &&
                      bill.isOwner &&
                      can('Payments.Read') &&
                      member.email?.toLowerCase() !== user.email.toLowerCase() && (
                        <div className="ws-owner-payment">
                          <div>
                            <span className="ws-eyebrow">THÔNG TIN CHUYỂN KHOẢN</span>
                            <p>QR dành cho phần của {member.name || member.email}.</p>
                            {member.transferContent && (
                              <button
                                className="ws-transfer ws-copy-transfer"
                                onClick={() => void copyTransfer(member.transferContent!)}
                              >
                                <small>Nội dung chuyển khoản · bấm để sao chép</small>
                                <strong>
                                  {member.transferContent}
                                  <Copy size={14} />
                                </strong>
                              </button>
                            )}
                          </div>
                          {safeExternalUrl(member.paymentQrImageUrl) && (
                            <img
                              src={safeExternalUrl(member.paymentQrImageUrl)}
                              alt={`QR thanh toán của ${member.name || member.email}`}
                              width={160}
                              height={160}
                            />
                          )}
                        </div>
                      )}
                    {bill.isOwner && bill.status === 'Draft' && can('Bills.ManageMembers') && (
                      <div className="ws-remove-member">
                        <button
                          className="ws-text-button ws-danger"
                          disabled={pending}
                          onClick={() => setRemoveMember(member.memberId)}
                        >
                          Xóa khỏi bản nháp
                        </button>
                      </div>
                    )}
                  </div>
                </Disclosure>
              ))
            ) : (
              <p className="ws-muted">
                Bản nháp chưa có người tham gia. Tiếp tục tạo để thêm người cùng chia.
              </p>
            )}
          </section>
          <WorkspaceModal
            open={!!manualMember}
            title={`Ghi nhận thanh toán · ${manualMember?.name || manualMember?.email || ''}`}
            busy={pending}
            onClose={() => setManualMember(null)}
          >
            <Notice message={error} />
            {manualMember && (
              <ManualPayment
                key={manualMember.memberId}
                member={manualMember}
                pending={pending}
                onCancel={() => setManualMember(null)}
                onSubmit={(body) =>
                  void action(
                    `members/${manualMember.memberId}/manual-payments`,
                    body,
                    'Đã ghi nhận khoản thanh toán.',
                  )
                }
              />
            )}
          </WorkspaceModal>
          {active &&
            bill.members
              ?.filter((m) => m.email?.toLowerCase() === user.email.toLowerCase())
              .map((m) =>
                m.remainingAmount <= 0 ? (
                  <div key={m.memberId} className="ws-paid-banner">
                    <Check size={24} />
                    <div>
                      <h3>Phần của bạn đã gọn gàng.</h3>
                      <p>Thanh toán đã được xác nhận. Cảm ơn bạn!</p>
                    </div>
                  </div>
                ) : (
                  <Reveal className="ws-panel ws-payment-panel" key={m.memberId}>
                    <div>
                      <span className="ws-eyebrow">PHẦN CỦA BẠN</span>
                      <h2>{money(m.remainingAmount, bill.currency || 'VND')}</h2>
                      <p>
                        Quét mã hoặc mở trang thanh toán. Trạng thái sẽ tự cập nhật khi giao dịch
                        được xác nhận.
                      </p>
                      {m.transferContent && (
                        <button
                          className="ws-transfer ws-copy-transfer"
                          onClick={() => void copyTransfer(m.transferContent!)}
                        >
                          <small>NỘI DUNG CHUYỂN KHOẢN</small>
                          <strong>
                            {m.transferContent}
                            <Copy size={14} />
                          </strong>
                        </button>
                      )}
                      {can('Payments.Create') && safeExternalUrl(m.paymentUrl) && (
                        <a
                          className="ws-button"
                          href={safeExternalUrl(m.paymentUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Thanh toán qua PayOS <ArrowUpRight size={17} />
                        </a>
                      )}
                      {!m.paymentUrl && !m.paymentQrImageUrl && (
                        <Notice message="Chưa có thông tin thanh toán. Vui lòng liên hệ chủ hóa đơn." />
                      )}
                    </div>
                    {can('Payments.Create') && safeExternalUrl(m.paymentQrImageUrl) && (
                      <div className="ws-qr">
                        <img
                          src={safeExternalUrl(m.paymentQrImageUrl)}
                          alt="Mã QR thanh toán phần của bạn"
                          width={220}
                          height={220}
                        />
                        <small>QUÉT MÃ · THANH TOÁN ĐÚNG PHẦN</small>
                      </div>
                    )}
                  </Reveal>
                ),
              )}
        </div>
        <aside>
          <section className="ws-panel ws-detail-aside">
            <span className="ws-eyebrow">THÔNG TIN HÓA ĐƠN</span>
            <div>
              <span>Ngày hóa đơn</span>
              <strong>{bill.billDate || 'Chưa đặt'}</strong>
            </div>
            <div>
              <span>Hạn thanh toán</span>
              <strong>{bill.dueDate || 'Chưa đặt'}</strong>
            </div>
            {bill.paymentDestination && (
              <>
                <div>
                  <span>Ngân hàng nhận</span>
                  <strong>{bill.paymentDestination.bankName}</strong>
                </div>
                <div>
                  <span>Chủ tài khoản</span>
                  <strong>{bill.paymentDestination.accountName}</strong>
                </div>
              </>
            )}
            <button className="ws-button ws-button-secondary ws-full" onClick={() => void copy()}>
              <Copy size={16} />
              Sao chép liên kết
            </button>
            {bill.isOwner && bill.status === 'Draft' && (
              <Link className="ws-button ws-full" href={`/bills/new?draft=${billId}`}>
                Tiếp tục bản nháp <ArrowUpRight size={17} />
              </Link>
            )}
            {bill.isOwner && active && can('Bills.SendReminders') && bill.remainingAmount > 0 && (
              <button
                className="ws-button ws-button-secondary ws-full"
                disabled={pending}
                onClick={() =>
                  void action(
                    'reminders',
                    {
                      memberIds:
                        bill.members
                          ?.filter((member) => member.remainingAmount > 0)
                          .map((member) => member.memberId) || [],
                    },
                    'Đã gửi lời nhắc đến những người chưa thanh toán.',
                  )
                }
              >
                <Bell size={16} />
                Nhắc thanh toán
              </button>
            )}
            {bill.isOwner &&
              !['Cancelled', 'Paid', 'Completed'].includes(bill.status || '') &&
              can('Bills.Delete') && (
                <button
                  className="ws-text-button ws-danger"
                  disabled={pending}
                  onClick={() => setCancel((v) => !v)}
                >
                  Hủy hóa đơn
                </button>
              )}
            <WorkspaceModal
              open={cancel}
              title="Hủy hóa đơn này?"
              busy={pending}
              onClose={() => setCancel(false)}
            >
              <form
                className="ws-cancel-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void action('cancel', { reason }, 'Đã hủy hóa đơn.')
                }}
              >
                <Notice message={error} />
                <Field label="Lý do hủy">
                  <textarea
                    required
                    value={reason}
                    maxLength={500}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
                <p>
                  Hóa đơn sẽ ngừng nhận thanh toán. Các khoản đã thu cần được chủ hóa đơn xử lý.
                </p>
                <div className="ws-form-actions">
                  <button
                    type="button"
                    className="ws-button ws-button-secondary"
                    disabled={pending}
                    onClick={() => setCancel(false)}
                  >
                    Quay lại
                  </button>
                  <button className="ws-button ws-danger-button" disabled={pending}>
                    Xác nhận hủy
                  </button>
                </div>
              </form>
            </WorkspaceModal>
          </section>
          <div className="ws-info">
            <p>
              {needsPolling(bill)
                ? 'Đang tự động cập nhật thanh toán mỗi 3 giây.'
                : 'Trạng thái thanh toán được xác nhận bởi hệ thống.'}
            </p>
          </div>
          <Link className="ws-support-link" href={`/support?billId=${billId}`}>
            Cần giúp với khoản này? <ArrowUpRight size={15} />
          </Link>
        </aside>
      </div>
      <ConfirmDialog
        open={!!removeMember}
        title="Xóa khỏi bản nháp?"
        description="Thành viên này sẽ được xóa khỏi hóa đơn. Hãy tính lại phần chia trước khi phát hành."
        action="Xác nhận xóa thành viên"
        pending={pending}
        error={error}
        onClose={() => setRemoveMember('')}
        onConfirm={() =>
          void action(
            `members/${removeMember}`,
            {},
            'Đã xóa thành viên. Hãy tính lại phần chia trước khi phát hành.',
            'DELETE',
          )
        }
      />
    </>
  )
}
function ManualPayment({
  member,
  pending,
  onCancel,
  onSubmit,
}: {
  member: BillMember
  pending: boolean
  onCancel: () => void
  onSubmit: (body: unknown) => void
}) {
  const [amount, setAmount] = useState(String(member.remainingAmount))
  const [method, setMethod] = useState('BankTransfer')
  const [note, setNote] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ amount: Number(amount), method, note: note || null, paidAtUtc: null })
  }
  return (
    <form className="ws-form" onSubmit={submit}>
      <p className="ws-muted">Chỉ ghi nhận khoản bạn đã thực tế nhận được.</p>
      <Field label="Số tiền đã nhận">
        <input
          required
          type="number"
          min={1}
          max={member.remainingAmount}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label="Phương thức">
        <Select value={method} onValueChange={(value) => setMethod(value)}>
          <option value="BankTransfer">Chuyển khoản</option>
          <option value="Cash">Tiền mặt</option>
          <option value="Momo">MoMo</option>
        </Select>
      </Field>
      <Field label="Ghi chú">
        <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <div className="ws-form-actions">
        <button
          type="button"
          className="ws-button ws-button-secondary"
          disabled={pending}
          onClick={onCancel}
        >
          Để sau
        </button>
        <button className="ws-button" disabled={pending}>
          Xác nhận đã nhận
        </button>
      </div>
    </form>
  )
}
