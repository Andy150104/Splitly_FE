import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  accountId,
  billId,
  fixtureBill,
  mockWorkspace,
  provisionSession,
} from './helpers/workspace'

test('protected email deep links return to their bill after login', async ({ page }) => {
  await page.goto(`/bills/${billId}`)
  await expect(page).toHaveURL(new RegExp(`/login\\?next=.*${billId}`))
  await expect(page.getByRole('heading', { name: 'Đăng nhập.' })).toBeVisible()
})
test('four steps call create, members, calculate and publish in order', async ({ page }, info) => {
  await mockWorkspace(page)
  let draft = fixtureBill({ status: 'Draft', members: [] })
  const calls: string[] = []
  await page.route('**/api/bills**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() === 'POST') {
      calls.push(path)
      const body = request.postDataJSON()
      if (path === '/api/bills') {
        expect(body.currency).toBe('VND')
        expect(body.totalAmount).toBe(720000)
        return route.fulfill({ json: { data: { billId } } })
      }
      if (path.endsWith('/members')) {
        expect(body.emails).toEqual(['friend@example.com'])
        draft = fixtureBill({ status: 'Draft' })
      }
      if (path.endsWith('/calculate')) expect(body).toEqual({ method: 'Equal', allocations: [] })
      if (path.endsWith('/publish')) {
        expect(body.payoutAccountId).toBe(accountId)
        draft = fixtureBill()
      }
    }
    return route.fulfill({ json: { data: draft } })
  })
  await page.goto('/bills/new')
  await page.getByLabel('Tên hóa đơn', { exact: true }).fill('Bữa tối cuối tuần')
  await page.getByLabel('Tổng số tiền (VND)').fill('720000')
  await page.screenshot({
    path: `test-results/${info.project.name}-create-bill.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await page.getByLabel('Email người cùng chia').fill('friend@example.com')
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await expect(page.getByRole('button', { name: 'Chia đều', exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await expect(page.getByRole('combobox', { name: /^Tài khoản nhận tiền/ })).toHaveValue(accountId)
  await page.getByRole('button', { name: 'Phát hành hóa đơn', exact: true }).click()
  await expect(page).toHaveURL(`/bills/${billId}`)
  expect(calls).toEqual([
    '/api/bills',
    `/api/bills/${billId}/members`,
    `/api/bills/${billId}/calculate`,
    `/api/bills/${billId}/publish`,
  ])
})
test('custom allocations must sum to the total and failed calls retain the draft', async ({
  page,
}) => {
  await mockWorkspace(page)
  await page.route('**/api/bills**', async (route) => {
    if (route.request().method() === 'POST' && route.request().url().endsWith('/calculate'))
      return route.fulfill({ status: 400, json: { message: 'Phân bổ chưa hợp lệ.' } })
    return route.fulfill({
      json: {
        data:
          route.request().method() === 'POST' &&
          new URL(route.request().url()).pathname === '/api/bills'
            ? { billId }
            : fixtureBill({ status: 'Draft' }),
      },
    })
  })
  await page.goto('/bills/new')
  await page.getByLabel('Tên hóa đơn', { exact: true }).fill('Test')
  await page.getByLabel('Tổng số tiền (VND)').fill('720000')
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await page.getByRole('button', { name: 'Tự nhập số tiền', exact: false }).click()
  await page.getByLabel('Số tiền của owner@example.com').fill('100000')
  await page.getByLabel('Số tiền của friend@example.com').fill('100000')
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await expect(page.locator('.ws-notice[role="alert"]')).toContainText(
    'Tổng phần chia phải bằng tổng hóa đơn',
  )
  await page.getByLabel('Số tiền của friend@example.com').fill('620000')
  await page.getByRole('button', { name: 'Lưu & tiếp tục' }).click()
  await expect(page.locator('.ws-notice[role="alert"]')).toContainText('Phân bổ chưa hợp lệ.')
  await expect(page).toHaveURL(`/bills/new?draft=${billId}`)
})
test('payment polling hides QR and checkout after confirmation and stops', async ({
  page,
}, info) => {
  await mockWorkspace(page)
  let reads = 0
  let settled = false
  await page.route(`**/api/bills/${billId}`, (route) => {
    reads++
    const bill = fixtureBill()
    if (settled) {
      bill.remainingAmount = 0
      bill.completionPercentage = 100
      bill.members.forEach((m) => {
        m.remainingAmount = 0
        m.status = 'Paid'
        m.paymentUrl = null
        m.paymentQrImageUrl = null
      })
    }
    return route.fulfill({ json: { data: bill } })
  })
  await page.goto(`/bills/${billId}`)
  await expect(page.getByRole('img', { name: 'Mã QR thanh toán phần của bạn' })).toBeVisible()
  await page.screenshot({
    path: `test-results/${info.project.name}-bill-detail.png`,
    fullPage: true,
  })
  settled = true
  await expect(page.getByRole('heading', { name: 'Phần của bạn đã gọn gàng.' })).toBeVisible({
    timeout: 8000,
  })
  await expect(page.getByRole('img', { name: 'Mã QR thanh toán phần của bạn' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Thanh toán qua PayOS' })).toHaveCount(0)
  const count = reads
  await page.waitForTimeout(3500)
  expect(reads).toBe(count)
})
test('dashboard, bill form and account layout fit the viewport', async ({ page }, info) => {
  await mockWorkspace(page)
  for (const path of [
    '/dashboard',
    '/bills',
    '/bills/new',
    `/bills/${billId}`,
    '/groups',
    '/payout-accounts',
    '/support',
  ]) {
    await page.goto(path)
    await expect(page.locator('.ws-main h1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    )
    if (path === '/dashboard')
      await page.screenshot({
        path: `test-results/${info.project.name}-dashboard.png`,
        animations: 'disabled',
      })
  }
})
test('permissions hide unauthorized actions and the session can sign out', async ({ page }) => {
  await mockWorkspace(page, ['Bills.Read'])
  await page.goto('/dashboard')
  await expect(page.getByRole('link', { name: 'Tạo hóa đơn' })).toHaveCount(0)
  await page.goto('/bills/new')
  await expect(page.getByRole('heading', { name: 'Chưa có quyền tạo hóa đơn' })).toBeVisible()
  if (await page.getByRole('button', { name: 'Mở menu', exact: true }).isVisible())
    await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
  await page.route('**/api/auth/logout', async (route) => {
    await page.context().clearCookies()
    await route.fulfill({ json: { data: true } })
  })
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await expect(page).toHaveURL('/login')
})
test('workspace and login meet structural accessibility checks', async ({ page }) => {
  await mockWorkspace(page)
  await page.goto('/dashboard')
  await expect(page.locator('.ws-main h1')).toBeVisible()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(result.violations).toEqual([])
})

test('email login retains the bill destination and handles a wrong code', async ({ page }) => {
  await page.route('https://accounts.google.com/**', (route) => route.abort())
  await page.route('**/api/auth/send-login-code', (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: 'owner@example.com' })
    return route.fulfill({ json: { data: true } })
  })
  let attempts = 0
  await page.route('**/api/auth/verify-login-code', async (route) => {
    attempts++
    expect(route.request().postDataJSON()).toEqual({
      email: 'owner@example.com',
      code: attempts === 1 ? 'WRONGCODE1' : 'SL-82A9-K4M7',
    })
    if (attempts === 1) return route.fulfill({ status: 401, json: { message: 'Mã chưa hợp lệ.' } })
    await provisionSession(page)
    await route.fulfill({ json: { data: { email: 'owner@example.com' } } })
  })
  await page.route('**/api/auth/me/permissions', (route) =>
    route.fulfill({ json: { data: { effectivePermissionCodes: ['Bills.Read'] } } }),
  )
  await page.route(`**/api/bills/${billId}`, (route) =>
    route.fulfill({ json: { data: fixtureBill() } }),
  )
  await page.goto(`/login?next=${encodeURIComponent(`/bills/${billId}`)}`)
  await page.getByLabel('Email của bạn').fill('owner@example.com')
  await page.getByRole('button', { name: 'Gửi mã đăng nhập' }).click()
  await page.getByRole('textbox', { name: /^Mã đăng nhập/ }).fill('WRONGCODE1')
  await page.getByRole('button', { name: 'Bước vào không gian của bạn' }).click()
  await expect(page.locator('.ws-notice[role="alert"]')).toContainText('Mã chưa hợp lệ.')
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.getByRole('textbox', { name: /^Mã đăng nhập/ }).fill('sl-82a9-k4m7')
  await page.getByRole('button', { name: 'Bước vào không gian của bạn' }).click()
  await expect(page).toHaveURL(`/bills/${billId}`)
})

test('bank lookup verifies the account before saving the current API payload', async ({ page }) => {
  await mockWorkspace(page)
  let saved = false
  await page.route('**/api/payout-accounts', (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        bankBin: '970436',
        accountNumber: '0123456789',
        isDefault: true,
      })
      saved = true
      return route.fulfill({ json: { data: { id: accountId } } })
    }
    return route.fulfill({
      json: {
        data: saved
          ? [
              {
                id: accountId,
                bankName: 'Vietcombank',
                accountNumberMasked: '•••• 6789',
                accountHolderName: 'MINH ANH',
                isDefault: true,
              },
            ]
          : [],
      },
    })
  })
  await page.route('**/api/vietqr/account-lookup', (route) =>
    route.fulfill({
      json: { data: { verified: true, accountName: 'MINH ANH' } },
    }),
  )
  await page.goto('/payout-accounts')
  await page.getByRole('button', { name: '+ Thêm tài khoản', exact: true }).click()
  await page.getByRole('combobox', { name: 'Ngân hàng', exact: true }).fill('VCB')
  await page.getByRole('option', { name: /Vietcombank/ }).click()
  await page.getByLabel('Số tài khoản', { exact: true }).fill('0123456789')
  await expect(page.getByLabel('Tên chủ tài khoản', { exact: true })).toHaveValue('MINH ANH')
  expect(saved).toBe(false)
  await page.getByRole('button', { name: 'Lưu tài khoản' }).click()
  await expect(page.locator('.ws-bank-card')).toContainText('•••• 6789')
})
