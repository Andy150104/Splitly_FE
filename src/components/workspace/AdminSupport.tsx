'use client'

import Select from '../ui/Select'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { send } from '../../lib/api/client'
import type { PageResult, SupportRequest } from '../../lib/api/types'
import { Reveal } from '../ui/Motion'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

const states = [
  { value: 'Pending', label: 'Chờ tiếp nhận' },
  { value: 'InReview', label: 'Đang xử lý' },
  { value: 'Resolved', label: 'Đã giải quyết' },
  { value: 'Dismissed', label: 'Từ chối' },
]
const types = [
  { value: 'Other', label: 'Hỗ trợ chung' },
  { value: 'PaymentIssue', label: 'Thanh toán' },
  { value: 'PayoutIssue', label: 'Nhận tiền' },
  { value: 'AccountIssue', label: 'Tài khoản & quyền' },
]
export default function AdminSupport() {
  const { can } = useWorkspace()
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SupportRequest | null>(null)
  const [message, setMessage] = useState('')
  const query = useApi<PageResult<SupportRequest>>(
    can('SupportRequests.Read')
      ? `admin/support-requests?status=${status}&type=${type}&page=${page}&pageSize=12`
      : null,
  )
  if (!can('SupportRequests.Read'))
    return (
      <Empty
        title="Chưa có quyền xem yêu cầu hỗ trợ"
        description="Liên hệ quản trị viên để mở quyền truy cập."
      />
    )
  return (
    <>
      <PageHeading
        eyebrow="QUẢN TRỊ"
        title="Yêu cầu hỗ trợ."
        description="Tiếp nhận, theo dõi và ghi lại kết quả xử lý cho từng yêu cầu."
      />
      <div className="ws-toolbar">
        <div className="ws-tabs">
          <button
            aria-pressed={!status}
            onClick={() => {
              setStatus('')
              setPage(1)
            }}
          >
            Tất cả
          </button>
          {states.map((state) => (
            <button
              aria-pressed={status === state.value}
              key={state.value}
              onClick={() => {
                setStatus(state.value)
                setPage(1)
              }}
            >
              {state.label}
            </button>
          ))}
        </div>
        <Select
          className="ws-compact-select"
          aria-label="Loại hỗ trợ"
          value={type}
          onValueChange={(value) => {
            setType(value)
            setPage(1)
          }}
        >
          <option value="">Tất cả loại yêu cầu</option>
          {types.map((item) => (
            <option value={item.value} key={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <Notice message={message} success />
      <div className={`ws-admin-layout ${selected ? 'has-selection' : ''}`}>
        <section className="ws-panel ws-admin-list">
          <div className="ws-section-heading">
            <h2>Hộp thư hỗ trợ</h2>
            <span className="ws-muted">{query.data?.totalCount ?? '…'} yêu cầu</span>
          </div>
          {query.loading ? (
            <Loading />
          ) : query.error ? (
            <ErrorState message={query.error} retry={query.reload} />
          ) : query.data?.items?.length ? (
            query.data.items.map((item) => (
              <button
                className={`ws-request-row ${selected?.id === item.id ? 'is-selected' : ''}`}
                key={item.id}
                aria-pressed={selected?.id === item.id}
                onClick={() => setSelected(item)}
              >
                <span className="ws-request-meta">
                  <strong>{item.memberName || item.contactEmail}</strong>
                  <Status value={item.status} />
                </span>
                <span className="ws-request-preview">{item.description}</span>
                <span className="ws-request-meta">
                  <small>{item.contactEmail}</small>
                  <small>{new Date(item.createdAtUtc).toLocaleDateString('vi-VN')}</small>
                </span>
              </button>
            ))
          ) : (
            <Empty
              title="Chưa có yêu cầu ở mục này"
              description="Yêu cầu mới sẽ xuất hiện tại đây khi người dùng gửi hỗ trợ."
            />
          )}
          {(query.data?.totalPages || 0) > 1 && (
            <div className="ws-pagination">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Trang trước
              </button>
              <span>
                {page} / {query.data?.totalPages}
              </span>
              <button
                disabled={page >= (query.data?.totalPages || 1)}
                onClick={() => setPage((value) => value + 1)}
              >
                Trang sau
              </button>
            </div>
          )}
        </section>
        {selected && (
          <Reveal key={selected.id}>
            <RequestEditor
              request={selected}
              onClose={() => setSelected(null)}
              onSaved={() => {
                setMessage('Đã cập nhật kết quả xử lý yêu cầu.')
                query.reload()
                setSelected(null)
              }}
            />
          </Reveal>
        )}
      </div>
    </>
  )
}
function RequestEditor({
  request,
  onClose,
  onSaved,
}: {
  request: SupportRequest
  onClose: () => void
  onSaved: () => void
}) {
  const { can } = useWorkspace()
  const [status, setStatus] = useState(request.status || 'Pending')
  const [note, setNote] = useState(request.resolutionNote || '')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    if (['Resolved', 'Dismissed'].includes(status) && !note.trim()) {
      setError('Nhập kết quả xử lý trước khi đóng yêu cầu.')
      return
    }
    lock.current = true
    setPending(true)
    setError('')
    try {
      await send(
        `admin/support-requests/${request.id}/status`,
        { status, resolutionNote: note.trim() || null },
        'PATCH',
      )
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa cập nhật được yêu cầu.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return (
    <section className="ws-panel ws-admin-editor">
      <div className="ws-section-heading">
        <div>
          <span className="ws-eyebrow">CHI TIẾT YÊU CẦU</span>
          <h2>{request.memberName || request.contactEmail}</h2>
        </div>
        <button className="ws-text-button" disabled={pending} onClick={onClose}>
          Đóng
        </button>
      </div>
      <p className="ws-muted">
        {request.contactEmail} · {new Date(request.createdAtUtc).toLocaleString('vi-VN')}
      </p>
      <p className="ws-request-description">{request.description}</p>
      {request.billId && (
        <Link className="ws-section-link" href={`/bills/${request.billId}`}>
          {request.billTitle || 'Mở hóa đơn liên quan'} ↗
        </Link>
      )}
      {request.paymentOrderId && (
        <p className="ws-muted">Mã thanh toán: {request.paymentOrderId}</p>
      )}
      <Notice message={error} />
      {can('SupportRequests.Update') ? (
        <form className="ws-form" onSubmit={submit}>
          <Field label="Trạng thái xử lý">
            <Select value={status} disabled={pending} onValueChange={(value) => setStatus(value)}>
              {states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kết quả xử lý" hint="Bắt buộc khi giải quyết hoặc từ chối yêu cầu.">
            <textarea
              value={note}
              disabled={pending}
              required={['Resolved', 'Dismissed'].includes(status)}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ghi lại cách xử lý yêu cầu…"
            />
          </Field>
          <button
            className="ws-button"
            disabled={
              pending || (status === request.status && note === (request.resolutionNote || ''))
            }
          >
            {pending ? 'Đang lưu…' : 'Lưu trạng thái'}
          </button>
        </form>
      ) : (
        <>
          <Status value={request.status} />
          <p>{request.resolutionNote || 'Chưa có kết quả xử lý.'}</p>
        </>
      )}
      {request.resolvedByMemberName && (
        <p className="ws-muted">
          Đã xử lý bởi {request.resolvedByMemberName}
          {request.resolvedAtUtc
            ? ` · ${new Date(request.resolvedAtUtc).toLocaleString('vi-VN')}`
            : ''}
        </p>
      )}
    </section>
  )
}
