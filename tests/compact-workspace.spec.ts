import { expect, test } from '@playwright/test'
import { mockWorkspace, owner, permissions } from './helpers/workspace'

test('group bills stay compact and searchable; adding members requires submitting the modal', async ({
  page,
}) => {
  await mockWorkspace(page)
  const bills = Array.from({ length: 17 }, (_, index) => ({
    billId: `bill-${index + 1}`,
    title: `Khoản chung ${index + 1}`,
    totalAmount: 120000 + index * 1000,
    currency: 'VND',
    status: index % 2 ? 'Paid' : 'Published',
  }))
  const writes: unknown[] = []
  await page.route('**/api/groups/group-compact**', (route) => {
    if (route.request().method() === 'POST') {
      writes.push(route.request().postDataJSON())
      return route.fulfill({ json: { data: true } })
    }
    return route.fulfill({
      json: {
        data: {
          groupId: 'group-compact',
          name: 'Những chuyến đi',
          isOwner: true,
          status: 'Active',
          bills,
          members: [
            { memberId: 'owner', name: owner.displayName, email: owner.email, role: 'Owner' },
            { memberId: 'friend', name: 'Linh', email: 'friend@example.com', role: 'Member' },
          ],
        },
      },
    })
  })
  await page.goto('/groups/group-compact')
  const panel = page.getByRole('region', { name: 'Hóa đơn trong nhóm', exact: true })
  await expect(panel.locator('.ws-group-bill-compact')).toHaveCount(5)
  await panel.locator('.ws-group-bill-compact').nth(3).hover()
  expect(
    await panel
      .locator('.ws-group-bill-list')
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true)
  expect((await panel.boundingBox())!.height).toBeLessThan(850)
  await panel.getByRole('button', { name: 'Trang hóa đơn sau' }).click()
  await expect(panel).toContainText('Trang 2 / 4')
  await expect(panel.locator('.ws-group-bill-compact').first()).toContainText('Khoản chung 6')
  await page
    .getByRole('searchbox', { name: 'Tìm hóa đơn trong nhóm', exact: true })
    .fill('Khoản chung 17')
  await expect(panel.locator('.ws-group-bill-compact')).toHaveCount(1)
  await expect(panel.locator('.ws-group-bill-compact')).toHaveAttribute('href', '/bills/bill-17')
  await page.getByRole('combobox', { name: 'Lọc trạng thái hóa đơn trong nhóm' }).click()
  await page.getByRole('option', { name: 'Đã thanh toán', exact: true }).click()
  await expect(panel).toContainText('Không có hóa đơn phù hợp')
  await page.getByRole('searchbox', { name: 'Tìm hóa đơn trong nhóm', exact: true }).fill('')
  await expect(panel).toContainText('Trang 1 / 2')
  await expect(panel.locator('.ws-group-bill-compact')).toHaveCount(5)
  await expect(panel.getByRole('link', { name: 'Tạo hóa đơn cho nhóm' })).toHaveAttribute(
    'href',
    '/bills/new?group=group-compact',
  )

  const add = page.getByRole('button', { name: 'Thêm người cùng chia', exact: true })
  await add.click()
  const modal = page.getByRole('dialog', { name: 'Thêm thành viên', exact: true })
  await modal.getByLabel('Thêm người cùng chia').fill('new@example.com')
  await modal.getByRole('button', { name: 'Hủy', exact: true }).click()
  await expect(modal).not.toBeVisible()
  await expect(add).toBeFocused()
  expect(writes).toHaveLength(0)
  await add.click()
  await modal.getByRole('button', { name: 'Thêm thành viên', exact: true }).click()
  await expect(modal).not.toBeVisible()
  expect(writes).toEqual([{ emails: ['new@example.com'] }])
})

test('permission filtering preserves selections, shows guidance in the dialog, and keeps scrolling vertical', async ({
  page,
  isMobile,
}) => {
  await mockWorkspace(page, [
    ...permissions,
    'Users.Read',
    'Users.ReadPermissions',
    'Users.UpdatePermissions',
    'Roles.Read',
    'Permissions.Read',
  ])
  const member = {
    memberId: 'user-filter',
    name: 'Linh',
    email: 'friend@example.com',
    roleId: 'member',
    role: 'User',
    status: 'Active',
  }
  const initial = ['Bills.Read', 'Groups.Read']
  const catalog = ['Bills', 'Groups', 'Payments', 'Users'].flatMap((group) =>
    ['Read', 'Create', 'Update', 'Delete', 'ManageMembers', 'ManagePermissions'].map(
      (action, index) => ({
        permissionId: `${group}.${action}`,
        code: `${group}.${action}`,
        name: group === 'Bills' && action === 'Create' ? 'Tạo hóa đơn' : `${action} ${group}`,
        groupCode: group,
        groupName: group === 'Bills' ? 'Hóa đơn' : group === 'Groups' ? 'Nhóm chi tiêu' : group,
        description: 'Quản lý các thao tác cho tài khoản trong không gian chung.',
        sortOrder: index,
      }),
    ),
  )
  let saved: unknown
  await page.route('**/api/admin/**', (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    let data: unknown = { effectivePermissionCodes: initial }
    if (path === '/api/admin/users') data = { items: [member], totalCount: 1, totalPages: 1 }
    if (path === '/api/admin/users/roles') data = [{ roleId: 'member', name: 'User' }]
    if (path === '/api/admin/users/permissions') data = catalog
    if (request.method() === 'PATCH') saved = request.postDataJSON()
    return route.fulfill({ json: { data } })
  })
  await page.goto('/admin/users')
  await page.getByRole('button', { name: /Linh friend@example.com/ }).click()
  const modal = page.getByRole('dialog', { name: 'Thông tin người dùng', exact: true })
  await modal.getByRole('tab', { name: 'Quyền hiệu lực', exact: true }).click()
  await modal.getByRole('button', { name: 'Giải thích quyền hiệu lực' }).focus()
  const hint = page.getByRole('tooltip')
  await expect(hint).toContainText('không bỏ những quyền đã chọn')
  expect(await hint.evaluate((node) => node.matches(':popover-open'))).toBe(true)
  expect(await hint.evaluate((node) => !!node.closest('dialog[open]'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(hint).not.toBeVisible()
  await expect(modal).toBeVisible()
  const list = modal.getByRole('region', { name: 'Danh sách quyền', exact: true })
  const height = (await list.boundingBox())!.height
  expect(height).toBeGreaterThanOrEqual(isMobile ? 240 : 280)
  expect(
    await list
      .locator('strong')
      .first()
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
  ).toBeGreaterThanOrEqual(14)
  await modal.getByRole('combobox', { name: 'Nhóm quyền', exact: true }).click()
  await page.getByRole('option', { name: 'Hóa đơn', exact: true }).click()
  const search = modal.getByLabel('Tìm quyền', { exact: true })
  await search.fill('Bills.Create')
  await expect(list.getByRole('checkbox')).toHaveCount(1)
  await list.getByRole('checkbox', { name: /Tạo hóa đơn Bills.Create/ }).check()
  await search.fill('không có quyền này')
  await expect(list).toContainText('Không tìm thấy quyền phù hợp')
  expect((await list.boundingBox())!.height).toBe(height)
  await modal.getByRole('button', { name: 'Xóa từ khóa: Tìm quyền', exact: true }).click()
  await expect(search).toBeFocused()
  await modal.getByRole('combobox', { name: 'Nhóm quyền', exact: true }).click()
  await page.getByRole('option', { name: 'Tất cả nhóm quyền', exact: true }).click()
  await expect(list.getByRole('checkbox')).toHaveCount(24)
  await page.screenshot({
    path: `QA/permissions/${page.viewportSize()!.width}-catalog.png`,
    animations: 'disabled',
  })
  await expect(list.getByRole('checkbox', { name: /Tạo hóa đơn Bills.Create/ })).toBeChecked()
  await list.getByRole('checkbox', { name: /Read Groups Groups.Read/ }).hover()
  expect(await list.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
  await page.setViewportSize({ width: isMobile ? 360 : 1366, height: 640 })
  await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(isMobile ? 360 : 1366)
  expect((await list.boundingBox())!.height).toBeGreaterThanOrEqual(200)
  await page.screenshot({
    path: `QA/permissions/${page.viewportSize()!.width}-low-catalog.png`,
    animations: 'disabled',
  })
  const save = modal.getByRole('button', { name: 'Lưu quyền hiệu lực', exact: true })
  const saveBounds = (await save.boundingBox())!
  expect(saveBounds.y + saveBounds.height).toBeLessThan(page.viewportSize()!.height)
  expect(
    await modal
      .locator('.ws-modal-body')
      .evaluate((node) => node.scrollHeight <= node.clientHeight),
  ).toBe(true)
  await modal.getByRole('button', { name: 'Lưu quyền hiệu lực', exact: true }).click()
  await expect(modal).not.toBeVisible()
  expect(saved).toEqual({ effectivePermissionCodes: [...initial, 'Bills.Create'] })
})

test('user directory opens an accessible detail modal, preserves edits between tabs, and cancels without writing', async ({
  page,
}) => {
  await mockWorkspace(page, [
    ...permissions,
    'Users.Read',
    'Users.ReadPermissions',
    'Users.UpdateRole',
    'Users.UpdateAccess',
    'Users.UpdatePermissions',
    'Roles.Read',
    'Permissions.Read',
  ])
  const members = Array.from({ length: 8 }, (_, index) => ({
    memberId: `user-${index + 1}`,
    name: `Thành viên ${index + 1}`,
    email: `member${index + 1}@example.com`,
    roleId: 'role-member',
    role: 'Thành viên',
    status: index === 1 ? 'Blocked' : 'Active',
  }))
  let writes = 0
  const reads: string[] = []
  await page.route('**/api/admin/**', (route) => {
    const request = route.request()
    if (request.method() !== 'GET') writes++
    const path = new URL(request.url()).pathname
    if (request.method() === 'GET') reads.push(path)
    let data: unknown = { effectivePermissionCodes: ['Bills.Read'] }
    if (path === '/api/admin/users') data = { items: members, totalCount: 8, totalPages: 1 }
    if (path === '/api/admin/users/roles')
      data = [
        { roleId: 'role-member', name: 'Thành viên' },
        { roleId: 'role-manager', name: 'Quản lý' },
      ]
    if (path === '/api/admin/users/permissions')
      data = ['Bills.Read', 'Bills.Create'].map((code, index) => ({
        permissionId: code,
        code,
        name: index ? 'Tạo hóa đơn' : 'Xem hóa đơn',
        groupCode: 'Bills',
        groupName: 'Hóa đơn',
        sortOrder: index,
      }))
    return route.fulfill({ json: { data } })
  })
  await page.goto('/admin/users')
  await expect(page.locator('.ws-admin-person')).toHaveCount(8)
  expect((await page.locator('.ws-directory-rows').boundingBox())!.height).toBeLessThanOrEqual(530)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  const first = page.getByRole('button', { name: /Thành viên 1 member1@example.com/ })
  expect(reads.filter((path) => path !== '/api/admin/users')).toEqual([])
  await first.click()
  const modal = page.getByRole('dialog', { name: 'Thông tin người dùng', exact: true })
  await expect(modal).toBeVisible()
  await modal.getByRole('combobox', { name: 'Vai trò người dùng' }).click()
  await page.getByRole('option', { name: 'Quản lý', exact: true }).click()
  expect(reads).not.toContain('/api/admin/users/permissions')
  expect(reads).not.toContain('/api/admin/users/user-1/permissions')
  const accessTab = modal.getByRole('tab', { name: 'Vai trò & truy cập' })
  const permissionTab = modal.getByRole('tab', { name: 'Quyền hiệu lực', exact: true })
  await accessTab.focus()
  await page.keyboard.press('ArrowRight')
  await expect(permissionTab).toBeFocused()
  await expect(permissionTab).toHaveAttribute('aria-selected', 'true')
  await modal.getByRole('checkbox', { name: 'Tạo hóa đơn Bills.Create', exact: true }).check()
  await permissionTab.press('ArrowLeft')
  await expect(modal.getByRole('combobox', { name: 'Vai trò người dùng' })).toHaveAttribute(
    'data-value',
    'role-manager',
  )
  await permissionTab.click()
  await expect(
    modal.getByRole('checkbox', { name: 'Tạo hóa đơn Bills.Create', exact: true }),
  ).toBeChecked()
  expect(reads.filter((path) => path === '/api/admin/users/permissions')).toHaveLength(1)
  expect(reads.filter((path) => path === '/api/admin/users/user-1/permissions')).toHaveLength(1)
  await page.screenshot({ path: `QA/permissions/${page.viewportSize()!.width}-editor.png` })
  await page.keyboard.press('Escape')
  await expect(modal).not.toBeVisible()
  await expect(first).toBeFocused()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: /Thành viên 2 member2@example.com/ }).click()
  await expect(modal.getByRole('heading', { name: 'Thành viên 2', exact: true })).toBeVisible()
  await expect(modal.getByText('Đã chặn', { exact: true }).first()).toBeVisible()
  await expect(modal.getByRole('combobox', { name: 'Vai trò người dùng' })).toHaveAttribute(
    'data-value',
    'role-member',
  )
})

test('login keeps email and submit above the mobile fold and bounds the layout on wide screens', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  const sizes = isMobile
    ? [
        { width: 390, height: 844 },
        { width: 360, height: 640 },
      ]
    : [
        { width: 2560, height: 1440 },
        { width: 1440, height: 900 },
      ]
  for (const size of sizes) {
    await page.setViewportSize(size)
    await page.goto('/login')
    const email = page.getByLabel('Email của bạn')
    const submit = page.getByRole('button', { name: 'Gửi mã đăng nhập', exact: true })
    await expect(email).toBeVisible()
    await expect(submit).toBeVisible()
    await expect(page.locator('.ws-google')).toHaveClass(/is-unavailable/)
    const submitBox = (await submit.boundingBox())!
    expect(submitBox.y).toBeGreaterThan(0)
    expect(submitBox.y + submitBox.height).toBeLessThan(size.height)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    if (isMobile) {
      await expect(page.locator('.ws-login-intro')).toBeHidden()
    } else {
      const layout = (await page.locator('.ws-login-layout').boundingBox())!
      const card = (await page.locator('.ws-auth-card').boundingBox())!
      const back = (await page.locator('.ws-login-form .ws-back').boundingBox())!
      expect(layout.width).toBeLessThanOrEqual(1760)
      expect(Math.abs(card.x - back.x)).toBeLessThan(2)
      expect(card.x + card.width).toBeLessThanOrEqual(layout.x + layout.width)
      await expect(page.locator('.ws-login-scene-backdrop canvas')).toBeVisible()
      // Canvas measures its container asynchronously after viewport changes.
      await expect
        .poll(async () => {
          const stage = (await page.locator('.ws-login-scene-backdrop').boundingBox())!
          const scene = (await page.locator('.ws-login-scene-backdrop canvas').boundingBox())!
          return Math.max(
            Math.abs(stage.x + stage.width / 2 - (scene.x + scene.width / 2)),
            Math.abs(stage.y - scene.y),
          )
        })
        .toBeLessThan(1)
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        size.height,
      )
      const interaction = (await page
        .getByRole('button', { name: 'Tương tác với ví Splitly' })
        .boundingBox())!
      expect(interaction.x + interaction.width).toBeLessThan(card.x)
    }
  }
})
