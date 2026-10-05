'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Info } from 'lucide-react'
import type { PermissionDefinitionView } from '../../../lib/api/views'
import Tooltip from '../../ui/Tooltip'
import SearchInput from '../../ui/SearchInput'
import Select from '../../ui/Select'

export default function PermissionsForm({
  initial,
  catalog,
  editable,
  pending,
  onSave,
}: {
  initial: string[]
  catalog: PermissionDefinitionView[]
  editable: boolean
  pending: boolean
  onSave: (codes: string[]) => void
}) {
  const [selected, setSelected] = useState(initial)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const reduced = useReducedMotion()
  const changed = [...selected].sort().join('|') !== [...initial].sort().join('|')
  const definitions = catalog.length
    ? catalog
    : initial.map((code) => ({
        code,
        name: code,
        groupCode: 'current',
        groupName: 'Quyền hiện tại',
        description: null,
        sortOrder: 0,
      }))
  const sorted = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder)
  const groups = [...new Set(sorted.map((item) => item.groupCode || 'other'))]
  const term = search.trim().toLocaleLowerCase('vi')
  const visibleGroups = groups
    .filter((group) => !groupFilter || group === groupFilter)
    .map((group) => ({
      group,
      items: sorted.filter(
        (item) =>
          (item.groupCode || 'other') === group &&
          `${item.name} ${item.code} ${item.description || ''}`
            .toLocaleLowerCase('vi')
            .includes(term),
      ),
    }))
    .filter(({ items }) => items.length > 0)
  function submit(event: FormEvent) {
    event.preventDefault()
    onSave(selected)
  }
  return (
    <form className="ws-permissions-form" onSubmit={submit}>
      <div className="ws-permission-heading">
        <span>{editable ? 'Quyền truy cập' : 'Quyền hiện tại'}</span>
        <Tooltip
          label="Quyền hiệu lực"
          description={
            editable
              ? 'Thay đổi chỉ được áp dụng khi bạn bấm Lưu quyền. Tìm kiếm chỉ lọc danh sách, không bỏ những quyền đã chọn.'
              : 'Đây là những quyền đang áp dụng cho tài khoản. Bạn có thể tìm kiếm và lọc nhóm để xem chi tiết.'
          }
          side="bottom"
        >
          <button type="button" className="ws-help-button" aria-label="Giải thích quyền hiệu lực">
            <Info size={16} aria-hidden="true" />
          </button>
        </Tooltip>
        <span className="ws-permission-count">
          <strong>{selected.length}</strong> quyền được chọn
        </span>
      </div>
      <div className="ws-permission-toolbar">
        <SearchInput
          label="Tìm quyền"
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên hoặc mã quyền…"
        />
        <Select
          className="ws-permission-group-select ws-compact-select"
          aria-label="Nhóm quyền"
          value={groupFilter}
          onValueChange={(value) => setGroupFilter(value)}
        >
          <option value="">Tất cả nhóm quyền</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {sorted.find((item) => (item.groupCode || 'other') === group)?.groupName || group}
            </option>
          ))}
        </Select>
      </div>
      <div
        className="ws-permission-catalog"
        role="region"
        aria-label="Danh sách quyền"
        tabIndex={0}
      >
        <motion.div
          className="ws-permission-groups"
          key={`${groupFilter}:${term}`}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          {visibleGroups.map(({ group, items }) => (
            <fieldset key={group}>
              <legend>
                {items[0].groupName || group}
                <span>
                  {items.filter((item) => selected.includes(item.code || '')).length} /{' '}
                  {items.length}
                </span>
              </legend>
              {items.map(
                (item) =>
                  item.code && (
                    <label className="ws-permission-option" key={item.code}>
                      <input
                        type="checkbox"
                        checked={selected.includes(item.code)}
                        disabled={!editable || pending}
                        onChange={(event) => {
                          const code = item.code!
                          setSelected((previous) =>
                            event.target.checked
                              ? [...previous, code]
                              : previous.filter((value) => value !== code),
                          )
                        }}
                      />
                      <span>
                        <strong>{item.name || item.code}</strong>
                        <small>{item.code}</small>
                        {item.description && <small>{item.description}</small>}
                      </span>
                    </label>
                  ),
              )}
            </fieldset>
          ))}
          {!visibleGroups.length && (
            <p className="ws-permission-empty">
              Không tìm thấy quyền phù hợp. Thử từ khóa hoặc nhóm khác.
            </p>
          )}
        </motion.div>
      </div>
      {editable && (
        <div className="ws-permission-actions">
          <span className="ws-muted" aria-live="polite">
            {changed ? 'Có thay đổi chưa lưu' : 'Quyền đang được áp dụng'}
          </span>
          <button className="ws-button" disabled={pending || !changed}>
            {pending ? 'Đang lưu…' : 'Lưu quyền hiệu lực'}
          </button>
        </div>
      )}
    </form>
  )
}
