'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { bindControl } from '../slots'
import { motion, useReducedMotion } from 'motion/react'
import { Info } from 'lucide-react'
import type { AdminReference, PermissionDefinitionView } from '../../../lib/api/views'
import Tooltip from '../../ui/Tooltip'
import SearchInput from '../../ui/SearchInput'
import Select from '../../ui/Select'

export default function PermissionsForm({
  initial,
  catalog,
  saveButton,
  pending,
  onSave,
}: {
  initial: AdminReference[]
  catalog: PermissionDefinitionView[]
  saveButton: ReactNode
  pending: boolean
  onSave?: (values: string[]) => void
}) {
  const editable = !!saveButton && catalog.length > 0
  const [selected, setSelected] = useState(initial)
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const reduced = useReducedMotion()
  const changed =
    selected
      .map((item) => item.id)
      .sort()
      .join('|') !==
    initial
      .map((item) => item.id)
      .sort()
      .join('|')
  // Preserve grants absent from the catalog when editing other selections.
  const definitions = [
    ...catalog,
    ...initial
      .filter((item) => !catalog.some((entry) => entry.id === item.id))
      .map((item, index) => ({
        ...item,
        name: `Quyền hiện tại ${index + 1}`,
        groupName: 'Quyền hiện tại',
        description: null,
        sortOrder: 0,
      })),
  ]
  const sorted = [...definitions].sort((a, b) => a.sortOrder - b.sortOrder)
  const groups = [...new Set(sorted.map((item) => item.groupName))]
  const term = search.trim().toLocaleLowerCase('vi')
  const visibleGroups = groups
    .filter((group) => !groupFilter || group === groupFilter)
    .map((group) => ({
      group,
      items: sorted.filter(
        (item) =>
          item.groupName === group &&
          `${item.name} ${item.description || ''}`.toLocaleLowerCase('vi').includes(term),
      ),
    }))
    .filter(({ items }) => items.length > 0)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (editable) onSave?.(selected.map((item) => item.value))
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
          placeholder="Tìm tên quyền…"
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
              {group}
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
                  {items.filter((item) => selected.some((entry) => entry.id === item.id)).length} /{' '}
                  {items.length}
                </span>
              </legend>
              {items.map(
                (item) =>
                  item.id && (
                    <label className="ws-permission-option" key={item.id}>
                      <input
                        type="checkbox"
                        checked={selected.some((entry) => entry.id === item.id)}
                        disabled={!editable || pending}
                        onChange={(event) => {
                          setSelected((previous) =>
                            event.target.checked
                              ? [...previous, { id: item.id, value: item.value }]
                              : previous.filter((value) => value.id !== item.id),
                          )
                        }}
                      />
                      <span>
                        <strong>{item.name}</strong>
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
          {bindControl(saveButton, {
            disabled: pending || !changed,
            children: pending ? 'Đang lưu…' : 'Lưu quyền hiệu lực',
          })}
        </div>
      )}
    </form>
  )
}
