'use client'

import Select from '../ui/Select'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Count, Disclosure, Reveal } from '../ui/Motion'
import SearchInput from '../ui/SearchInput'
import { money } from '../../lib/api/client'
import type { BillItem, GroupItem, PageResult } from '../../lib/api/types'
import { Empty, ErrorState, Loading } from '../ui/Feedback'
import { PageHeading } from '../ui/PageHeading'
import { Status } from '../ui/Status'
import { useApi, useWorkspace } from './hooks'

export function BillCard({ bill }: { bill: BillItem }) {
  const date = bill.dueDate
    ? new Intl.DateTimeFormat('vi-VN').format(new Date(bill.dueDate))
    : 'Chưa đặt hạn'
  return (
    <Link href={`/bills/${bill.billId}`} className="ws-bill-card">
      <div className="ws-bill-identity">
        <h3>{bill.title || 'Hóa đơn'}</h3>
        <small>
          {bill.currency || 'VND'} · {date}
        </small>
      </div>
      <Status value={bill.status} />
      <span className="ws-bill-total">{money(bill.totalAmount, bill.currency || 'VND')}</span>
      <span className="ws-row-arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  )
}

function BillList({ rows }: { rows: BillItem[] }) {
  return (
    <div className="ws-bill-list" role="region" aria-label="Danh sách hóa đơn" tabIndex={0}>
      <div className="ws-list-labels" aria-hidden="true">
        <span>Hóa đơn</span>
        <span>Trạng thái</span>
        <span>Tổng tiền</span>
        <span />
      </div>
      {rows.map((bill) => (
        <BillCard key={bill.billId} bill={bill} />
      ))}
    </div>
  )
}

export default function Bills({ initialOwed = false }: { initialOwed?: boolean }) {
  const { can } = useWorkspace()
  const [owed, setOwed] = useState(initialOwed)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const query = useApi<PageResult<BillItem>>(
    can('Bills.Read') ? `bills?owed=${owed}&pageNumber=${page}&pageSize=12` : null,
  )
  const rows =
    query.data?.items?.filter((bill) =>
      (bill.title || '').toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN')),
    ) || []
  function switchView(value: boolean) {
    setOwed(value)
    setPage(1)
    setSearch('')
  }
  return (
    <>
      <PageHeading
        eyebrow="KHOẢN CHUNG"
        title="Hóa đơn."
        description="Các khoản bạn tạo và những khoản bạn cùng tham gia."
      >
        {can('Bills.Create') && (
          <Link href="/bills/new" className="ws-button">
            + Tạo hóa đơn
          </Link>
        )}
      </PageHeading>
      <div className="ws-toolbar">
        <div className="ws-tabs">
          <button aria-pressed={!owed} onClick={() => switchView(false)}>
            Bạn tạo
          </button>
          <button aria-pressed={owed} onClick={() => switchView(true)}>
            Bạn tham gia
          </button>
        </div>
        <SearchInput
          className="ws-search"
          label="Tìm trong trang hóa đơn"
          value={search}
          onChange={setSearch}
          placeholder="Tìm hóa đơn trong trang…"
        />
      </div>
      {!can('Bills.Read') ? (
        <Empty
          title="Chưa có quyền xem hóa đơn"
          description="Liên hệ quản trị viên để mở quyền truy cập."
        />
      ) : query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error} retry={query.reload} />
      ) : (
        <>
          {rows.length ? (
            <BillList rows={rows} />
          ) : (
            <Empty
              title={search ? 'Không có kết quả' : 'Chưa có hóa đơn'}
              description={
                search
                  ? 'Thử tên khác hoặc xóa nội dung tìm kiếm.'
                  : 'Tạo khoản chung đầu tiên để bắt đầu.'
              }
              href={can('Bills.Create') ? '/bills/new' : undefined}
              action="Tạo hóa đơn đầu tiên"
            />
          )}
          {(query.data?.totalPages || 0) > 1 && (
            <div className="ws-pagination">
              <button disabled={!query.data?.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
                Trang trước
              </button>
              <span>
                {page} / {query.data?.totalPages} · {query.data?.totalCount} hóa đơn
              </span>
              <button disabled={!query.data?.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export function Dashboard() {
  const { user, can } = useWorkspace()
  const [owed, setOwed] = useState(false)
  const [filter, setFilter] = useState('all')
  const reduced = useReducedMotion()
  const owned = useApi<PageResult<BillItem>>(
    can('Bills.Read') ? 'bills?owed=false&pageNumber=1&pageSize=6' : null,
  )
  const joined = useApi<PageResult<BillItem>>(
    can('Bills.Read') ? 'bills?owed=true&pageNumber=1&pageSize=6' : null,
  )
  const groups = useApi<PageResult<GroupItem>>(
    can('Groups.Read') ? 'groups?pageNumber=1&pageSize=3' : null,
  )
  const query = owed ? joined : owned
  const recent = query.data?.items || []
  const rows = recent.filter(
    (bill) =>
      filter === 'all' ||
      (filter === 'draft'
        ? bill.status === 'Draft'
        : !['Draft', 'Paid', 'Completed', 'Cancelled'].includes(bill.status || '')),
  )
  const progressRows = (owned.data?.items || [])
    .filter((bill) => !['Draft', 'Cancelled'].includes(bill.status || ''))
    .slice(0, 3)
  const metrics = [
    {
      label: 'Hóa đơn bạn tạo',
      query: owned,
      href: '/bills',
      permission: 'Bills.Read',
      note: 'Quản lý khoản chung',
    },
    {
      label: 'Hóa đơn tham gia',
      query: joined,
      href: '/bills?owed=true',
      permission: 'Bills.Read',
      note: 'Theo dõi phần của bạn',
    },
    {
      label: 'Nhóm của bạn',
      query: groups,
      href: '/groups',
      permission: 'Groups.Read',
      note: 'Những người cùng chia',
    },
  ]
  return (
    <>
      <PageHeading
        eyebrow="KHÔNG GIAN CÁ NHÂN"
        title={`Chào ${user.displayName.split(' ').pop()}.`}
        description="Một góc nhìn rõ ràng về các khoản chung của bạn."
      >
        {can('Bills.Create') && (
          <Link href="/bills/new" className="ws-button">
            + Tạo hóa đơn
          </Link>
        )}
      </PageHeading>
      <Disclosure
        title="Tổng quan khoản chung"
        meta="Không gian của bạn"
        className="ws-dashboard-overview"
      >
        <section className="ws-overview" aria-label="Tổng quan khoản chung">
          {metrics
            .filter((metric) => can(metric.permission))
            .map((metric, index) => (
              <motion.div
                key={metric.href}
                initial={reduced ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
                whileHover={reduced ? undefined : { y: -5 }}
              >
                <Link href={metric.href} className={`ws-metric ws-metric-${index}`}>
                  <div>
                    <span>{metric.label}</span>
                    <small>0{index + 1}</small>
                  </div>
                  <strong>
                    {metric.query.loading ? (
                      <span
                        className="skeleton-bar skeleton-number"
                        aria-label="Đang tải số liệu"
                      />
                    ) : metric.query.error ? (
                      '—'
                    ) : (
                      <Count value={metric.query.data?.totalCount ?? 0} />
                    )}
                  </strong>
                  <p>
                    {metric.query.error ? 'Chưa tải được dữ liệu' : metric.note}
                    <span aria-hidden="true">↗</span>
                  </p>
                </Link>
              </motion.div>
            ))}
        </section>
      </Disclosure>
      <div className="ws-dashboard-columns">
        <Disclosure title="Hóa đơn gần đây" meta="6 khoản gần nhất" className="ws-recent-section">
          <div className="ws-toolbar">
            <div className="ws-tabs">
              <button
                aria-pressed={!owed}
                onClick={() => {
                  setOwed(false)
                  setFilter('all')
                }}
              >
                Bạn tạo
              </button>
              <button
                aria-pressed={owed}
                onClick={() => {
                  setOwed(true)
                  setFilter('all')
                }}
              >
                Bạn tham gia
              </button>
            </div>
            <Select
              aria-label="Lọc hóa đơn gần đây"
              value={filter}
              onValueChange={(value) => setFilter(value)}
              className="ws-compact-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang thanh toán</option>
              <option value="draft">Bản nháp</option>
            </Select>
          </div>
          {query.loading ? (
            <Loading />
          ) : query.error ? (
            <ErrorState message={query.error} retry={query.reload} />
          ) : rows.length ? (
            <Reveal key={`${owed}-${filter}`}>
              <BillList rows={rows} />
            </Reveal>
          ) : (
            <Empty
              title={
                filter === 'all' ? 'Chưa có khoản chung nào.' : 'Không có hóa đơn ở trạng thái này.'
              }
              description={
                filter === 'all'
                  ? 'Hóa đơn sẽ xuất hiện ở đây khi bạn tạo hoặc được mời tham gia.'
                  : 'Chọn trạng thái khác để xem các khoản gần đây.'
              }
              href={can('Bills.Create') ? '/bills/new' : undefined}
              action="Tạo hóa đơn đầu tiên"
            />
          )}
          {can('Bills.Read') && (
            <Link className="ws-section-link" href={owed ? '/bills?owed=true' : '/bills'}>
              Xem tất cả hóa đơn <span>↗</span>
            </Link>
          )}
        </Disclosure>
        <div className="ws-dashboard-rail">
          <Disclosure
            title="Tiến độ thu tiền"
            meta="Hóa đơn gần đây"
            className="ws-collection-section"
          >
            {owned.error ? (
              <ErrorState message={owned.error} retry={owned.reload} />
            ) : owned.loading ? (
              <Loading />
            ) : progressRows.length ? (
              progressRows.map((bill, index) => {
                const remaining = bill.remainingAmount ?? bill.totalAmount
                const percent =
                  bill.totalAmount > 0
                    ? Math.min(
                        100,
                        Math.max(0, ((bill.totalAmount - remaining) / bill.totalAmount) * 100),
                      )
                    : 0
                return (
                  <Link
                    href={`/bills/${bill.billId}`}
                    className="ws-collection-row"
                    key={bill.billId}
                  >
                    <span>
                      {bill.title}
                      <strong>{Math.round(percent)}%</strong>
                    </span>
                    <div
                      className="ws-progress"
                      role="progressbar"
                      aria-label={`Đã thu ${bill.title}`}
                      aria-valuenow={Math.round(percent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <motion.span
                        initial={reduced ? false : { width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.9, delay: index * 0.1 }}
                      />
                    </div>
                    <small>Còn {money(remaining, bill.currency || 'VND')}</small>
                  </Link>
                )
              })
            ) : (
              <p className="ws-muted">Tiến độ sẽ xuất hiện sau khi bạn phát hành hóa đơn.</p>
            )}
          </Disclosure>
          {can('Groups.Read') && (
            <Disclosure
              title="Nhóm của bạn"
              meta={`${groups.data?.totalCount ?? '…'} nhóm`}
              className="ws-group-section"
            >
              {groups.error ? (
                <ErrorState message={groups.error} retry={groups.reload} />
              ) : groups.loading ? (
                <Loading />
              ) : groups.data?.items?.length ? (
                groups.data.items.map((group, index) => (
                  <Link
                    className="ws-mini-group"
                    href={`/groups/${group.groupId}`}
                    key={group.groupId}
                  >
                    <span className={`ws-avatar ws-group-avatar-${index}`}>
                      {(group.name || 'N')[0]}
                    </span>
                    <span>
                      <strong>{group.name}</strong>
                      <small>
                        {group.memberCount} thành viên · {group.billCount} hóa đơn
                      </small>
                    </span>
                    <span>↗</span>
                  </Link>
                ))
              ) : (
                <p className="ws-muted">Tạo một nhóm để chia những khoản thường xuyên.</p>
              )}
              <Link className="ws-section-link" href="/groups">
                Mở không gian nhóm <span>↗</span>
              </Link>
            </Disclosure>
          )}
        </div>
      </div>
      <div className="ws-dashboard-bottom">
        <span>Rõ từng khoản. Gọn từng phần.</span>
        <Link href="/support">Cần hỗ trợ? ↗</Link>
      </div>
    </>
  )
}
