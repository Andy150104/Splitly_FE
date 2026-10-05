'use client'

import Select from '../ui/Select'
import DatePicker from '../ui/DatePicker'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api, localDate, money, parseEmails, send } from '../../lib/api/client'
import type { Group, GroupItem, PageResult, PayoutAccount } from '../../lib/api/types'
import type { BillView } from '../../lib/api/views'
import { AccountForm } from './Accounts'
import WorkspaceModal from '../ui/WorkspaceModal'
import { motion, useReducedMotion } from 'motion/react'
import { Empty, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { useApi, useWorkspace } from './hooks'

const steps = [
  { title: 'Thông tin' },
  { title: 'Người cùng chia' },
  { title: 'Chia tiền' },
  { title: 'Xác nhận' },
]
export default function CreateBill({
  draftId,
  initialGroupId,
}: {
  draftId?: string
  initialGroupId?: string
}) {
  const { can, user } = useWorkspace()
  const reduced = useReducedMotion()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [billId, setBillId] = useState(draftId || '')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [billDate, setBillDate] = useState(localDate)
  const [dueDate, setDueDate] = useState('')
  const [groupId, setGroupId] = useState(initialGroupId || '')
  const [groupMembers, setGroupMembers] = useState<string[]>([])
  const [emails, setEmails] = useState('')
  const [includeOwner, setIncludeOwner] = useState(true)
  const [bill, setBill] = useState<BillView | null>(null)
  const [method, setMethod] = useState('Equal')
  const [allocations, setAllocations] = useState<Record<string, string>>({})
  const [accountId, setAccountId] = useState('')
  const [addingAccount, setAddingAccount] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [initializing, setInitializing] = useState(Boolean(draftId))
  const lock = useRef(false)
  const savedGroup = useRef(initialGroupId || '')
  const groups = useApi<PageResult<GroupItem>>(can('Groups.Read') ? 'groups?pageSize=200' : null)
  const group = useApi<Group>(groupId ? `groups/${groupId}` : null)
  const accounts = useApi<PayoutAccount[]>(can('PayoutAccounts.Read') ? 'payout-accounts' : null)
  useEffect(() => {
    if (!draftId) return
    let active = true
    api<BillView>(`bills/${draftId}`)
      .then((b) => {
        if (!active) return
        if (b.status !== 'Draft' || !b.isOwner) {
          router.replace(`/bills/${draftId}`)
          return
        }
        setBill(b)
        setTitle(b.title || '')
        setAmount(String(b.totalAmount))
        setDescription(b.description || '')
        setBillDate(b.billDate || localDate())
        setDueDate(b.dueDate || '')
        if (b.members?.length)
          setIncludeOwner(
            b.members.some((m) => m.email?.toLowerCase() === user.email.toLowerCase()),
          )
      })
      .catch((e) => {
        if (active) setError(e.message)
      })
      .finally(() => {
        if (active) setInitializing(false)
      })
    return () => {
      active = false
    }
  }, [draftId, router, user.email])
  const selectedAccount =
    accountId || accounts.data?.find((a) => a.isDefault)?.id || accounts.data?.[0]?.id || ''
  async function next(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setPending(true)
    setError('')
    try {
      if (step === 0) {
        const value = Number(amount)
        if (!title.trim() || !Number.isSafeInteger(value) || value <= 0)
          throw new Error('Nhập tên hóa đơn và số tiền nguyên dương hợp lệ.')
        if (dueDate && dueDate < billDate)
          throw new Error('Hạn thanh toán phải từ ngày hóa đơn trở đi.')
        const body = {
          title: title.trim(),
          totalAmount: value,
          currency: 'VND',
          description: description.trim() || null,
          billDate,
          dueDate: dueDate || null,
          ...(groupId ? { groupId } : !billId ? { groupId: null } : {}),
        }
        if (billId) {
          const unchanged =
            bill &&
            bill.title === body.title &&
            bill.totalAmount === value &&
            (bill.description || '') === (body.description || '') &&
            (bill.billDate || '') === billDate &&
            (bill.dueDate || '') === dueDate &&
            groupId === savedGroup.current
          if (!unchanged) await send(`bills/${billId}`, body, 'PUT')
        } else {
          const created = await send<{ billId?: string; id?: string }>('bills', body)
          const id = created.billId || created.id
          if (!id)
            throw new Error(
              'Máy chủ chưa trả mã hóa đơn. Hãy kiểm tra danh sách bản nháp trước khi tạo lại.',
            )
          setBillId(id)
          window.history.replaceState(
            null,
            '',
            `/bills/new?draft=${id}${groupId ? `&group=${groupId}` : ''}`,
          )
        }
        savedGroup.current = groupId
        setStep(1)
      } else if (step === 1) {
        const list = parseEmails(emails)
        const current = await api<BillView>(`bills/${billId}`)
        const existing = new Set(current.members?.map((m) => m.email?.toLowerCase()))
        const newEmails = list.filter((e) => !existing.has(e))
        const ownerMember = current.members?.find(
          (m) => m.email?.toLowerCase() === user.email.toLowerCase(),
        )
        if (!includeOwner && ownerMember)
          await api(`bills/${billId}/members/${ownerMember.memberId}`, { method: 'DELETE' })
        const newGroupMembers = groupMembers.filter((id) => {
          const member = group.data?.members?.find((m) => m.memberId === id)
          return member && !existing.has(member.email?.toLowerCase())
        })
        const addOwner = includeOwner && !ownerMember
        if (!current.members?.length && !list.length && !groupMembers.length && !includeOwner)
          throw new Error('Thêm ít nhất một người cùng chia.')
        if (newEmails.length || newGroupMembers.length || addOwner)
          await send(`bills/${billId}/members`, {
            emails: newEmails,
            groupMemberIds: newGroupMembers,
            includeOwner: addOwner,
          })
        const updated = await api<BillView>(`bills/${billId}`)
        if (!updated.members?.length) throw new Error('Hóa đơn cần ít nhất một người tham gia.')
        setBill(updated)
        setAllocations(
          Object.fromEntries(
            updated.members.map((m) => [m.memberId, String(m.assignedAmount || '')]),
          ),
        )
        setStep(2)
      } else if (step === 2) {
        const values =
          bill?.members?.map((m) => ({
            memberId: m.memberId,
            amount: Number(allocations[m.memberId]),
          })) || []
        if (
          method === 'CustomAmount' &&
          (values.some((v) => !Number.isSafeInteger(v.amount) || v.amount < 0) ||
            values.reduce((s, v) => s + v.amount, 0) !== Number(amount))
        )
          throw new Error(
            'Tổng phần chia phải bằng tổng hóa đơn. Mỗi phần là số tiền nguyên không âm.',
          )
        await send(`bills/${billId}/calculate`, {
          method,
          allocations: method === 'Equal' ? [] : values,
        })
        setBill(await api<BillView>(`bills/${billId}`))
        setStep(3)
      } else {
        if (!selectedAccount)
          throw new Error('Chọn hoặc thêm tài khoản nhận tiền trước khi phát hành.')
        await send(`bills/${billId}/publish`, { payoutAccountId: selectedAccount })
        router.push(`/bills/${billId}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chưa hoàn tất được bước này.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  const permission = ['Bills.Create', 'Bills.ManageMembers', 'Bills.Calculate', 'Bills.Publish'][
    step
  ]
  if (!can('Bills.Create') && !draftId)
    return (
      <Empty
        title="Chưa có quyền tạo hóa đơn"
        description="Liên hệ quản trị viên để được hỗ trợ."
      />
    )
  return (
    <>
      <Link className="ws-back" href="/bills">
        Về hóa đơn
      </Link>
      <PageHeading
        eyebrow="HÓA ĐƠN MỚI"
        title={draftId ? 'Tiếp tục bản nháp.' : 'Tạo khoản chung.'}
        description="Thêm thông tin, chọn người tham gia và chia số tiền."
      />
      <ol className="ws-steps">
        {steps.map(({ title: label }, i) => (
          <li
            key={label}
            className={`${i === step ? 'is-active' : ''} ${i < step ? 'is-complete' : ''}`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span>{i < step ? '✓' : `0${i + 1}`}</span>
            <div>
              <small>BƯỚC 0{i + 1}</small>
              <strong>{label}</strong>
            </div>
          </li>
        ))}
      </ol>
      <Notice message={error} />
      {initializing ? (
        <Loading />
      ) : (
        <div className="ws-wizard-grid">
          <motion.form
            key={step}
            className="ws-panel ws-form"
            onSubmit={next}
            initial={reduced ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ws-form-title">
              <h2>
                {
                  [
                    'Thông tin hóa đơn',
                    'Người tham gia',
                    'Phương thức chia tiền',
                    'Xác nhận và phát hành',
                  ][step]
                }
              </h2>
              <p>
                {
                  [
                    'Nhập thông tin cơ bản của khoản chi.',
                    'Mời bằng email hoặc chọn thành viên trong nhóm.',
                    'Chia đều hoặc tự nhập số tiền cho từng người.',
                    'Chọn nơi nhận tiền và phát hành lời mời thanh toán.',
                  ][step]
                }
              </p>
            </div>
            {step === 0 && (
              <>
                <Field label="Tên hóa đơn">
                  <input
                    required
                    maxLength={200}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Bữa tối cuối tuần"
                  />
                </Field>
                <Field label="Tổng số tiền (VND)">
                  <input
                    required
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Number.MAX_SAFE_INTEGER}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </Field>
                <div className="ws-two-fields">
                  <Field label="Ngày hóa đơn">
                    <DatePicker
                      label="Ngày hóa đơn"
                      required
                      value={billDate}
                      onChange={setBillDate}
                    />
                  </Field>
                  <Field label="Hạn thanh toán · tùy chọn">
                    <DatePicker
                      label="Hạn thanh toán · tùy chọn"
                      min={billDate}
                      value={dueDate}
                      onChange={setDueDate}
                    />
                  </Field>
                </div>
                {can('Groups.Read') && (
                  <Field label="Nhóm · tùy chọn">
                    <Select
                      value={groupId}
                      onValueChange={(value) => {
                        setGroupId(value)
                        setGroupMembers([])
                      }}
                    >
                      <option value="">Hóa đơn riêng, không thuộc nhóm</option>
                      {groups.data?.items
                        ?.filter((g) => g.status !== 'Closed')
                        .map((g) => (
                          <option key={g.groupId} value={g.groupId}>
                            {g.name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                )}
                <Field label="Ghi chú · tùy chọn">
                  <textarea
                    maxLength={2000}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Một chút thông tin để mọi người dễ hiểu…"
                  />
                </Field>
              </>
            )}
            {step === 1 && (
              <>
                {bill?.members?.length ? (
                  <div className="ws-mini-members">
                    <small>ĐÃ CÓ TRONG BẢN NHÁP</small>
                    {bill.members.map((m) => (
                      <span key={m.memberId}>{m.email}</span>
                    ))}
                  </div>
                ) : null}
                <Field
                  label="Email người cùng chia"
                  hint="Mỗi email một dòng, hoặc cách nhau bằng dấu phẩy."
                >
                  <textarea
                    rows={5}
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder={'ban@email.com\nnguoi-thuong@email.com'}
                  />
                </Field>
                <label className="ws-checkbox">
                  <input
                    type="checkbox"
                    checked={includeOwner}
                    onChange={(e) => setIncludeOwner(e.target.checked)}
                  />
                  Tính cả phần của mình
                </label>
                {groupId && (
                  <div className="ws-group-select">
                    <h3>Chọn người trong nhóm</h3>
                    {group.loading ? (
                      <Loading />
                    ) : group.error ? (
                      <Notice message={group.error} />
                    ) : (
                      group.data?.members?.map((m) => (
                        <label className="ws-checkbox" key={m.memberId}>
                          <input
                            type="checkbox"
                            checked={groupMembers.includes(m.memberId)}
                            onChange={(e) =>
                              setGroupMembers((ids) =>
                                e.target.checked
                                  ? [...ids, m.memberId]
                                  : ids.filter((id) => id !== m.memberId),
                              )
                            }
                          />
                          {m.name || m.email}
                          <small>{m.email}</small>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <div className="ws-split-options">
                  <button
                    type="button"
                    aria-pressed={method === 'Equal'}
                    onClick={() => setMethod('Equal')}
                  >
                    <strong>Chia đều</strong>
                    <small>Ai cũng một phần như nhau</small>
                  </button>
                  <button
                    type="button"
                    aria-pressed={method === 'CustomAmount'}
                    onClick={() => setMethod('CustomAmount')}
                  >
                    <strong>Tự nhập số tiền</strong>
                    <small>Linh hoạt theo phần mỗi người</small>
                  </button>
                </div>
                <div className="ws-allocation-list">
                  {bill?.members?.map((m, i, list) => (
                    <div key={m.memberId}>
                      <span className="ws-avatar">
                        {(m.name || m.email || '?')[0].toUpperCase()}
                      </span>
                      <div>
                        <strong>{m.name || m.email}</strong>
                        <small>{m.email}</small>
                      </div>
                      {method === 'Equal' ? (
                        <strong>
                          {money(
                            Math.floor(Number(amount) / list.length) +
                              (i < Number(amount) % list.length ? 1 : 0),
                          )}
                        </strong>
                      ) : (
                        <input
                          type="number"
                          aria-label={`Số tiền của ${m.email}`}
                          required
                          min={0}
                          step={1}
                          value={allocations[m.memberId] || ''}
                          onChange={(e) =>
                            setAllocations((a) => ({ ...a, [m.memberId]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
                {method === 'CustomAmount' && (
                  <p className="ws-allocation-total">
                    Đã chia:{' '}
                    <strong>
                      {money(Object.values(allocations).reduce((s, v) => s + Number(v || 0), 0))}
                    </strong>{' '}
                    / {money(Number(amount))}
                  </p>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <div className="ws-review-members">
                  {bill?.members?.map((m) => (
                    <div key={m.memberId}>
                      <span>{m.name || m.email}</span>
                      <strong>{money(m.assignedAmount)}</strong>
                    </div>
                  ))}
                </div>
                <Field label="Tài khoản nhận tiền">
                  <Select
                    value={selectedAccount}
                    required
                    onValueChange={(value) => setAccountId(value)}
                  >
                    <option value="">Chọn tài khoản nhận tiền</option>
                    {accounts.data?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} · {a.accountNumberMasked}
                        {a.isDefault ? ' · Mặc định' : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Notice message={accounts.error} />
                {can('PayoutAccounts.Create') && (
                  <button
                    type="button"
                    className="ws-text-button"
                    onClick={() => setAddingAccount(true)}
                  >
                    Thêm tài khoản nhận tiền
                  </button>
                )}
                <div className="ws-info">
                  <p>
                    Khi phát hành, mỗi người nhận email mời thanh toán. Trạng thái được cập nhật tự
                    động sau khi backend xác nhận.
                  </p>
                </div>
              </>
            )}
            <div className="ws-form-actions">
              <button
                type="button"
                className="ws-button ws-button-secondary"
                disabled={pending || step === 0}
                onClick={() => {
                  setStep((s) => s - 1)
                  setError('')
                }}
              >
                Quay lại
              </button>
              <button
                className="ws-button"
                aria-busy={pending}
                disabled={
                  pending || (!can(permission) && !(step === 0 && billId && can('Bills.Update')))
                }
              >
                {pending ? 'Đang lưu…' : step === 3 ? 'Phát hành hóa đơn' : 'Lưu & tiếp tục'}
              </button>
            </div>
            {billId && (
              <Link className="ws-draft-link" href={`/bills/${billId}`}>
                Bản nháp đã lưu · Tiếp tục sau
              </Link>
            )}
          </motion.form>
          <aside className="ws-wizard-summary">
            <span className="ws-eyebrow">KHOẢN CHUNG CỦA BẠN</span>
            <h3>{title || 'Một hóa đơn mới'}</h3>
            <strong>{money(Number(amount))}</strong>
            <div>
              <span>Người cùng chia</span>
              <b>{bill?.members?.length || '—'}</b>
            </div>
            <div>
              <span>Ngày hóa đơn</span>
              <b>{billDate}</b>
            </div>
            <div>
              <span>Hạn thanh toán</span>
              <b>{dueDate || 'Chưa đặt'}</b>
            </div>
            <p>
              Bản nháp được lưu sau mỗi bước.
              <br />
              Chỉ phát hành khi bạn đã xác nhận.
            </p>
          </aside>
        </div>
      )}
      <WorkspaceModal
        open={step === 3 && addingAccount}
        title="Thêm tài khoản nhận tiền"
        size="wide"
        busy={savingAccount}
        onClose={() => setAddingAccount(false)}
      >
        <AccountForm
          onBusy={setSavingAccount}
          onCancel={() => setAddingAccount(false)}
          onSaved={(a) => {
            setAccountId(a.id)
            setAddingAccount(false)
            accounts.reload()
          }}
        />
      </WorkspaceModal>
    </>
  )
}
