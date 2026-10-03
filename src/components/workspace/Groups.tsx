'use client'

import Select from '../ui/Select'

import Link from 'next/link'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { money, parseEmails, send } from '../../lib/api/client'
import type { Group, GroupItem, PageResult } from '../../lib/api/types'
import WorkspaceModal, { ConfirmDialog } from '../ui/WorkspaceModal'
import SearchInput from '../ui/SearchInput'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

export default function Groups() {
  const { can } = useWorkspace()
  const [page, setPage] = useState(1)
  const query = useApi<PageResult<GroupItem>>(
    can('Groups.Read') ? `groups?pageNumber=${page}&pageSize=12` : null,
  )
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const lock = useRef(false)
  async function create(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    try {
      await send('groups', { name: name.trim(), description: description || null })
      setAdding(false)
      setName('')
      setDescription('')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa tạo được nhóm.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="NHỮNG NGƯỜI CÙNG CHIA"
        title="Nhóm của bạn."
        description="Lưu những người cùng chia để tạo hóa đơn nhanh hơn."
      >
        {can('Groups.Create') && (
          <button className="ws-button" aria-haspopup="dialog" onClick={() => setAdding(true)}>
            Tạo nhóm mới
          </button>
        )}
      </PageHeading>
      <Notice message={error} />
      <WorkspaceModal
        open={adding}
        title="Tạo nhóm mới"
        busy={pending}
        onClose={() => setAdding(false)}
      >
        <form className="ws-form" onSubmit={create}>
          <Notice message={error} />
          <Field label="Tên nhóm">
            <input
              required
              maxLength={200}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Những chuyến đi của tụi mình"
            />
          </Field>
          <Field label="Một chút về nhóm">
            <textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="ws-form-actions">
            <button
              type="button"
              className="ws-button ws-button-secondary"
              disabled={pending}
              onClick={() => setAdding(false)}
            >
              Hủy
            </button>
            <button className="ws-button" disabled={pending || !name.trim()} aria-busy={pending}>
              {pending ? 'Đang tạo nhóm…' : 'Tạo nhóm'}
            </button>
          </div>
        </form>
      </WorkspaceModal>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error} retry={query.reload} />
      ) : query.data?.items?.length ? (
        <>
          <div className="ws-card-grid">
            {query.data.items.map((g) => (
              <Link className="ws-group-card" key={g.groupId} href={`/groups/${g.groupId}`}>
                <div className="ws-card-top">
                  <span className="ws-card-reference">NHÓM</span>
                  <Status value={g.status} />
                </div>
                <h3>{g.name}</h3>
                <p>
                  {g.memberCount} thành viên · {g.billCount} hóa đơn
                </p>
                <div className="ws-group-card-bottom">
                  <span>{g.role === 'Owner' ? 'Bạn quản lý nhóm' : 'Bạn cùng chia'}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="ws-pagination">
            <button disabled={!query.data.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </button>
            <span>
              Trang {page} / {query.data.totalPages || 1}
            </span>
            <button disabled={!query.data.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Trang sau
            </button>
          </div>
        </>
      ) : (
        <Empty
          title="Thêm những người cùng bạn."
          description="Tạo nhóm để những lần chia hóa đơn tiếp theo dễ dàng hơn."
        />
      )}
    </>
  )
}
export function GroupDetail({ groupId }: { groupId: string }) {
  const { can } = useWorkspace()
  const query = useApi<Group>(`groups/${groupId}`)
  const [emails, setEmails] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [addingMember, setAddingMember] = useState(false)
  const lock = useRef(false)
  async function action(path: string, body: unknown, method = 'POST') {
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    setMessage('')
    try {
      await send(`groups/${groupId}/${path}`, body, method)
      setMessage('Nhóm đã được cập nhật.')
      setEmails('')
      setConfirm(null)
      setAddingMember(false)
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa cập nhật được nhóm.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  function add(e: FormEvent) {
    e.preventDefault()
    try {
      const list = parseEmails(emails)
      if (!list.length) throw new Error('Nhập ít nhất một email.')
      void action('members', { emails: list })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email chưa hợp lệ.')
    }
  }
  if (query.loading) return <Loading />
  if (query.error) return <ErrorState message={query.error} retry={query.reload} />
  const group = query.data
  if (!group)
    return (
      <Empty
        title="Chưa tìm thấy nhóm"
        description="Kiểm tra liên kết hoặc quay về danh sách nhóm."
      />
    )
  const active = group.status !== 'Closed'
  return (
    <>
      <Link className="ws-back" href="/groups">
        <ArrowLeft size={16} />
        Về nhóm của bạn
      </Link>
      <PageHeading
        eyebrow="CÙNG CHIA CÁC KHOẢN CHUNG"
        title={group.name || 'Nhóm của bạn'}
        description={group.description || 'Những người cùng bạn chia khoản chung.'}
      >
        <div className="ws-group-heading-actions">
          <Status value={group.status} />
          {group.isOwner && active && can('Groups.Delete') && (
            <button
              className="ws-button ws-button-secondary"
              disabled={pending}
              aria-haspopup="dialog"
              onClick={() => setConfirm('close')}
            >
              Đóng nhóm
            </button>
          )}
        </div>
      </PageHeading>
      <Notice message={error} />
      <Notice message={message} success />
      <div className="ws-detail-grid ws-group-detail-layout">
        <section className="ws-panel ws-members-panel">
          <div className="ws-section-heading">
            <h2>Những người cùng chia.</h2>
            <span>{group.members?.length || 0} thành viên</span>
          </div>
          {group.members?.map((m) => (
            <div className="ws-member-row" key={m.memberId}>
              <span className="ws-avatar">{(m.name || m.email || '?')[0].toUpperCase()}</span>
              <div className="ws-member-name">
                <strong>{m.name || m.email}</strong>
                <small>{m.email}</small>
              </div>
              <span className="ws-status is-neutral">
                {m.role === 'Owner' ? 'Chủ nhóm' : 'Thành viên'}
              </span>
              {group.isOwner && active && can('Groups.ManageMembers') && m.role !== 'Owner' && (
                <button
                  aria-label={`Xóa ${m.email} khỏi nhóm`}
                  disabled={pending}
                  onClick={() => setConfirm(m.memberId)}
                >
                  <X size={17} />
                </button>
              )}
            </div>
          ))}
          {group.isOwner && active && can('Groups.ManageMembers') && (
            <button
              className="ws-button ws-button-secondary ws-group-add-trigger"
              aria-haspopup="dialog"
              onClick={() => setAddingMember(true)}
            >
              Thêm người cùng chia
            </button>
          )}
        </section>
        <GroupBills
          key={groupId}
          groupId={groupId}
          bills={group.bills || []}
          canCreate={active && can('Bills.Create')}
        />
      </div>
      <WorkspaceModal
        open={addingMember}
        title="Thêm thành viên"
        busy={pending}
        onClose={() => setAddingMember(false)}
      >
        <form className="ws-form" onSubmit={add}>
          <Notice message={error} />
          <Field
            label="Thêm người cùng chia"
            hint="Nhập email, mỗi người một dòng hoặc cách bằng dấu phẩy."
          >
            <textarea
              required
              rows={3}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="ban@email.com"
            />
          </Field>
          <div className="ws-form-actions">
            <button
              type="button"
              className="ws-button ws-button-secondary"
              disabled={pending}
              onClick={() => setAddingMember(false)}
            >
              Hủy
            </button>
            <button className="ws-button" disabled={pending || !emails.trim()} aria-busy={pending}>
              Thêm thành viên
            </button>
          </div>
        </form>
      </WorkspaceModal>
      <ConfirmDialog
        open={!!confirm}
        title={confirm === 'close' ? 'Đóng nhóm này?' : 'Xóa thành viên?'}
        description={
          confirm === 'close'
            ? 'Nhóm sẽ dừng thêm thành viên và hóa đơn mới. Các hóa đơn hiện có vẫn được giữ lại.'
            : 'Người này sẽ được xóa khỏi nhóm. Các khoản đã chia trong hóa đơn vẫn được giữ lại.'
        }
        action={confirm === 'close' ? 'Xác nhận đóng' : 'Xác nhận xóa'}
        pending={pending}
        error={error}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          void action(
            confirm === 'close' ? 'close' : `members/${confirm}`,
            {},
            confirm === 'close' ? 'POST' : 'DELETE',
          )
        }
      />
    </>
  )
}

function GroupBills({
  groupId,
  bills,
  canCreate,
}: {
  groupId: string
  bills: NonNullable<Group['bills']>
  canCreate: boolean
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const filtered = bills.filter(
    (bill) =>
      (bill.title || '').toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')) &&
      (!status ||
        (status === 'Paid'
          ? ['Paid', 'Completed'].includes(bill.status || '')
          : bill.status === status)),
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / 5))
  const current = Math.min(page, pageCount)
  const paid = bills.filter((bill) => ['Paid', 'Completed'].includes(bill.status || '')).length
  return (
    <section className="ws-panel ws-group-bills-panel" aria-label="Hóa đơn trong nhóm">
      <div className="ws-section-heading">
        <h2>Hóa đơn trong nhóm.</h2>
        <span>{bills.length} hóa đơn</span>
      </div>
      <div className="ws-group-bill-summary">
        <span>
          <strong>{bills.length}</strong> Tổng hóa đơn
        </span>
        <span>
          <strong>{paid}</strong> Đã thanh toán
        </span>
      </div>
      {bills.length > 0 && (
        <div className="ws-group-bill-tools">
          <SearchInput
            label="Tìm hóa đơn trong nhóm"
            placeholder="Tìm tên hóa đơn…"
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
          />
          <Select
            aria-label="Lọc trạng thái hóa đơn trong nhóm"
            value={status}
            onValueChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Published">Đang thu tiền</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Draft">Bản nháp</option>
            <option value="Cancelled">Đã hủy</option>
          </Select>
        </div>
      )}
      <div className="ws-group-bill-list">
        {filtered.length ? (
          filtered.slice((current - 1) * 5, current * 5).map((bill) => (
            <Link
              key={bill.billId}
              href={`/bills/${bill.billId}`}
              className="ws-group-bill-compact"
            >
              <div>
                <strong>{bill.title}</strong>
                <Status value={bill.status} />
              </div>
              <span>{money(bill.totalAmount, bill.currency || 'VND')}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))
        ) : (
          <p className="ws-group-bill-empty">
            {bills.length
              ? 'Không có hóa đơn phù hợp với bộ lọc.'
              : 'Chưa có hóa đơn. Bắt đầu bằng một khoản chung nhỏ nhé.'}
          </p>
        )}
      </div>
      {pageCount > 1 && (
        <div className="ws-pagination">
          <button
            aria-label="Trang hóa đơn trước"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            ←
          </button>
          <span>
            Trang {current} / {pageCount}
          </span>
          <button
            aria-label="Trang hóa đơn sau"
            disabled={current === pageCount}
            onClick={() => setPage(current + 1)}
          >
            →
          </button>
        </div>
      )}
      {canCreate && (
        <Link className="ws-button ws-full" href={`/bills/new?group=${groupId}`}>
          Tạo hóa đơn cho nhóm
        </Link>
      )}
    </section>
  )
}
