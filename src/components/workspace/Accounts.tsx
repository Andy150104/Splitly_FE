'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api, send } from '../../lib/api/client'
import { motion, useReducedMotion } from 'motion/react'
import BankPicker, { BankLogo } from './BankPicker'
import WorkspaceModal from '../ui/WorkspaceModal'
import type { AccountLookup, Bank, PayoutAccount } from '../../lib/api/types'
import { Empty, ErrorState, Loading, Notice } from '../ui/Feedback'
import { Field } from '../ui/Field'
import { PageHeading } from '../ui/PageHeading'
import { useApi, useWorkspace } from './hooks'

export function AccountForm({
  onSaved,
  onCancel,
  onBusy,
}: {
  onSaved: (account: PayoutAccount) => void
  onCancel?: () => void
  onBusy?: (busy: boolean) => void
}) {
  const { can } = useWorkspace()
  const banks = useApi<Bank[]>(can('Banks.Read') ? 'vietqr/banks' : null)
  const [bin, setBin] = useState('')
  const [number, setNumber] = useState('')
  const [isDefault, setDefault] = useState(true)
  const [verified, setVerified] = useState<AccountLookup | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupKey, setLookupKey] = useState('')
  const [retry, setRetry] = useState(0)
  const lock = useRef(false)
  const identity = `${bin}:${number}`
  const owner = lookupKey === identity ? verified : null
  useEffect(() => {
    onBusy?.(pending)
  }, [pending, onBusy])
  useEffect(() => {
    setVerified(null)
    setError('')
    if (!bin || number.length < 6) {
      setLookingUp(false)
      return
    }
    const controller = new AbortController()
    setLookingUp(true)
    const timer = setTimeout(async () => {
      try {
        const lookup = await api<AccountLookup>('vietqr/account-lookup', {
          method: 'POST',
          body: JSON.stringify({ bankBin: bin, accountNumber: number }),
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        if (!lookup.verified || !lookup.accountName)
          throw new Error(
            'Chưa tìm thấy tên chủ tài khoản. Kiểm tra lại ngân hàng và số tài khoản.',
          )
        setLookupKey(`${bin}:${number}`)
        setVerified(lookup)
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Chưa tra được chủ tài khoản.')
      } finally {
        if (!controller.signal.aborted) setLookingUp(false)
      }
    }, 550)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [bin, number, retry])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current || !owner || lookingUp) return
    lock.current = true
    setPending(true)
    setError('')
    try {
      const account = await send<PayoutAccount>('payout-accounts', {
        bankBin: bin,
        accountNumber: number,
        isDefault,
      })
      onSaved(account)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thêm được tài khoản.')
    } finally {
      lock.current = false
      setPending(false)
    }
  }
  return (
    <form className="ws-form ws-account-form" onSubmit={submit}>
      <div className="ws-form-title">
        <div>
          <p>Chọn ngân hàng và nhập số tài khoản. Tên chủ tài khoản sẽ tự động được điền.</p>
        </div>
      </div>
      <Notice message={error || banks.error} />
      {banks.loading ? (
        <Loading />
      ) : (
        <>
          <BankPicker
            banks={banks.data || []}
            value={bin}
            disabled={pending}
            onChange={(bank) => {
              setBin(bank.bin || '')
              setVerified(null)
            }}
          />
          <div className="ws-account-fields">
            <Field label="Số tài khoản">
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6,19}"
                minLength={6}
                maxLength={19}
                disabled={pending}
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value.replace(/\D/g, ''))
                  setVerified(null)
                }}
                placeholder="Nhập số tài khoản"
              />
            </Field>
            <Field label="Tên chủ tài khoản">
              <input
                readOnly
                value={owner?.accountName || ''}
                placeholder={
                  lookingUp
                    ? 'Đang tìm tên chủ tài khoản…'
                    : 'Tự động điền sau khi nhập số tài khoản'
                }
                aria-busy={lookingUp}
              />
            </Field>
            <div className="ws-lookup-status" role="status">
              {lookingUp
                ? 'Đang tra cứu tài khoản…'
                : owner
                  ? 'Đã tìm thấy chủ tài khoản'
                  : 'Nhập đầy đủ số tài khoản để tra cứu tự động.'}
            </div>
            <label className="ws-checkbox">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setDefault(e.target.checked)}
              />
              Đặt làm tài khoản mặc định
            </label>
            <div className="ws-form-actions">
              {onCancel && (
                <button
                  type="button"
                  className="ws-button ws-button-secondary"
                  onClick={onCancel}
                  disabled={pending}
                >
                  Hủy
                </button>
              )}
              <button
                className="ws-button"
                aria-busy={pending}
                disabled={
                  pending ||
                  lookingUp ||
                  !owner ||
                  !can('PayoutAccounts.Create') ||
                  !can('Banks.Read')
                }
              >
                {pending ? 'Đang lưu…' : 'Lưu tài khoản'}
              </button>
            </div>
          </div>
        </>
      )}
      {banks.error && (
        <button type="button" onClick={banks.reload}>
          Tải lại danh sách ngân hàng
        </button>
      )}
      {error && bin && number.length >= 6 && !pending && (
        <button className="ws-text-button" type="button" onClick={() => setRetry((v) => v + 1)}>
          Thử tra cứu lại
        </button>
      )}
    </form>
  )
}
export default function Accounts() {
  const { can } = useWorkspace()
  const query = useApi<PayoutAccount[]>(can('PayoutAccounts.Read') ? 'payout-accounts' : null)
  const banks = useApi<Bank[]>(can('Banks.Read') ? 'vietqr/banks' : null)
  const reduced = useReducedMotion()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [saving, setSaving] = useState(false)
  async function makeDefault(id: string) {
    if (pending) return
    setPending(true)
    setError('')
    try {
      await send(`payout-accounts/${id}/default`, {}, 'PUT')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không cập nhật được tài khoản.')
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="THANH TOÁN"
        title="Tài khoản nhận tiền."
        description="Các tài khoản ngân hàng đã xác minh để nhận tiền từ hóa đơn."
      >
        {can('PayoutAccounts.Create') && (
          <button className="ws-button" aria-haspopup="dialog" onClick={() => setAdding(true)}>
            + Thêm tài khoản
          </button>
        )}
      </PageHeading>
      <Notice message={error} />
      {query.isRefreshing && (
        <div className="ws-refresh-status" role="status">
          Đang cập nhật tài khoản…
        </div>
      )}
      <WorkspaceModal
        open={adding}
        title="Thêm tài khoản nhận tiền"
        size="wide"
        busy={saving}
        onClose={() => setAdding(false)}
      >
        <AccountForm
          onBusy={setSaving}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            query.reload()
          }}
        />
      </WorkspaceModal>
      {query.loading ? (
        <Loading variant="cards" />
      ) : query.error ? (
        <ErrorState message={query.error} retry={query.reload} />
      ) : query.data?.length ? (
        <div className="ws-card-grid">
          {query.data.map((a, index) => (
            <motion.article
              className={`ws-bank-card ${a.isDefault ? 'is-default' : ''}`}
              key={a.id}
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={reduced ? undefined : { y: -5 }}
            >
              <div className="ws-card-top">
                <BankLogo
                  bank={banks.data?.find(
                    (bank) => bank.bin === a.bankBin || (!!bank.code && bank.code === a.bankCode),
                  )}
                  name={a.bankCode || a.bankName}
                />

                {a.isDefault && <span className="ws-status is-paid">Mặc định</span>}
              </div>
              <small>{a.bankCode}</small>
              <h3>{a.bankName}</h3>
              <strong className="ws-account-number">{a.accountNumberMasked}</strong>
              <p>{a.accountHolderName}</p>
              {!a.isDefault && can('PayoutAccounts.Update') && (
                <button
                  className="ws-text-button"
                  disabled={pending}
                  onClick={() => void makeDefault(a.id)}
                >
                  Đặt làm mặc định
                </button>
              )}
            </motion.article>
          ))}
        </div>
      ) : (
        <Empty
          title="Một chỗ để tiền trở về."
          description="Thêm tài khoản nhận tiền trước khi phát hành hóa đơn đầu tiên."
        />
      )}
    </>
  )
}
