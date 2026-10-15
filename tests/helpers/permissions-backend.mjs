import { createServer } from 'node:http'

// Local test backend for permissions and admin DTO integration. No real business operations.
// Tokens are synthetic fixtures, never real credentials.
createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Cache-Control', 'no-store')
  if (request.url === '/health') return response.end('{}')
  if (request.url === '/api/auth/refresh' && request.method === 'POST') {
    let body = ''
    for await (const chunk of request) body += chunk
    const { refreshToken } = JSON.parse(body)
    if (refreshToken?.startsWith('fixture-refresh.'))
      return response.end(
        JSON.stringify({
          data: {
            accessToken: refreshToken.replace('fixture-refresh.', 'fixture.'),
            refreshToken,
            refreshTokenExpiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
          },
        }),
      )
    response.writeHead(401)
    return response.end(JSON.stringify({ success: false }))
  }
  const token = (request.headers.authorization || '').replace(/^Bearer /, '')
  if (token === 'fixture-unavailable') {
    response.writeHead(503)
    return response.end(JSON.stringify({ success: false }))
  }
  try {
    if (!token.startsWith('fixture.')) throw new Error('Not a fixture token')
    const codes = JSON.parse(Buffer.from(token.slice(8), 'base64url').toString())
    const path = new URL(request.url, 'http://localhost').pathname
    const reply = (data) => response.end(JSON.stringify({ data }))
    if (path === '/api/auth/me/permissions' && request.method === 'GET')
      return reply({ effectivePermissionCodes: codes })
    if (request.method === 'GET') {
      if (path === '/api/admin/users')
        return reply({
          items: [
            {
              memberId: 'fixture-admin-member',
              name: 'Linh',
              email: 'friend@example.com',
              roleId: 'private-member-role',
              role: 'Thành viên',
              status: 'Active',
              internalAudit: 'private-audit',
            },
          ],
          totalCount: 1,
          totalPages: 1,
        })
      if (path === '/api/admin/users/roles')
        return reply([
          { roleId: 'private-member-role', name: 'Thành viên', code: 'private-member-code' },
          {
            roleId: 'private-manager-role',
            name: 'Quản lý',
            isSystem: true,
            defaultPermissionCodes: ['Users.Read'],
          },
        ])
      if (path === '/api/admin/users/permissions')
        return reply(
          ['Bills.Read', 'Bills.Create'].map((code, index) => ({
            permissionId: `private-${index}`,
            code,
            name: index ? 'Tạo hóa đơn' : 'Xem hóa đơn',
            groupCode: 'private-bills-group',
            groupName: 'Hóa đơn',
            description: null,
            sortOrder: index,
          })),
        )
      if (path === '/api/admin/users/fixture-admin-member/permissions')
        return reply({
          effectivePermissionCodes: ['Bills.Read', 'System.Configure'],
          rolePermissionCodes: ['Bills.Read'],
          memberId: 'private-metadata',
        })
    }
    // A successful fixture write proves the gateway restored the exact BE payload.
    if (path.startsWith('/api/admin/users/fixture-admin-member/') && request.method === 'PATCH') {
      let body = ''
      for await (const chunk of request) body += chunk
      const input = JSON.parse(body)
      if (
        path.endsWith('/role') &&
        input.roleId === 'private-manager-role' &&
        Object.keys(input).length === 1
      )
        return reply(true)
      if (
        path.endsWith('/permissions') &&
        JSON.stringify(input.effectivePermissionCodes) ===
          JSON.stringify(['Bills.Read', 'System.Configure', 'Bills.Create']) &&
        Object.keys(input).length === 1
      )
        return reply({ effectivePermissionCodes: input.effectivePermissionCodes })
      response.writeHead(400)
      return response.end(JSON.stringify({ success: false, message: 'Invalid fixture contract' }))
    }
    response.writeHead(404)
    response.end(JSON.stringify({ success: false }))
  } catch {
    response.writeHead(401)
    response.end(JSON.stringify({ success: false }))
  }
}).listen(3211, '127.0.0.1')
