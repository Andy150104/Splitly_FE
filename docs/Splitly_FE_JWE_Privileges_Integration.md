# Splitly FE Integration - JWE Role and Privileges

## 1. Muc dich

Tai lieu nay mo ta contract giua FE va BE sau khi access token JWE duoc bo sung role va privilege.

Muc tieu:

- FE biet token dang su dung la nested JWE.
- FE biet cach lay quyen hien tai de render giao dien.
- FE xu ly dung login, refresh token, `401` va `403`.
- FE khong nhan hoac luu `EncryptionKey` cua BE.

## 2. Thay doi tren BE

Access token van la compact JWE gom 5 phan:

```text
protectedHeader.encryptedKey.iv.ciphertext.authenticationTag
```

Protected header:

```json
{
  "alg": "A256KW",
  "enc": "A256CBC-HS512",
  "cty": "JWT"
}
```

Inner JWT moi co them snapshot quyen tai thoi diem login hoac refresh:

```json
{
  "sub": "<member-id>",
  "session_id": "<session-id>",
  "jti": "<token-id>",
  "role": "Administrator",
  "permission": [
    "Bills.Read",
    "Bills.Write",
    "Users.Manage"
  ],
  "iss": "BillSplitService",
  "aud": "BillSplitService.Api",
  "iat": 0,
  "nbf": 0,
  "exp": 0
}
```

`role` va `permission` trong token la snapshot. Neu admin thay doi quyen trong database, token cu khong tu thay doi.

BE khong authorize dua tren snapshot nay. Tren moi request, BE van:

```text
Giai ma va validate JWE
-> validate session
-> doc role va permission moi nhat tu PostgreSQL
-> tao ClaimsPrincipal
-> kiem tra authorization policy
```

Vi vay thay doi quyen co hieu luc tai BE ngay lap tuc, ke ca khi access token cu chua het han.

## 3. Quy tac bao mat bat buoc

FE trinh duyet xem access token la opaque token va khong tu giai ma JWE.

Khong dat cac bien sau trong project FE:

```env
AUTH_JWE_ENCRYPTION_KEY=...
NEXT_PUBLIC_AUTH_JWE_ENCRYPTION_KEY=...
```

Khong dua `Authentication__AccessToken__EncryptionKey` vao Vercel, Next.js hoac bundle cua FE. Key nay chi ton tai trong moi truong chay BE.

Ly do:

- Day la symmetric encryption key cua he thong BE.
- FE khong can key de gui Bearer token.
- UI authorization khong phai security boundary.
- Backend la noi quyet dinh request co duoc phep hay khong.

## 4. Login response

Cac endpoint co the phat access token:

```http
POST /api/auth/google
POST /api/auth/verify-login-code
POST /api/auth/dev-login
POST /api/auth/refresh
```

Vi du response login:

```json
{
  "success": true,
  "message": null,
  "data": {
    "displayName": "System Administrator",
    "email": "admin@example.com",
    "avatarUrl": null,
    "sessionId": "<session-id>",
    "accessToken": "<nested-jwe>",
    "refreshToken": "<opaque-refresh-token>",
    "accessTokenExpiresAtUtc": "2026-08-17T10:15:00Z",
    "refreshTokenExpiresAtUtc": "2026-09-16T10:00:00Z"
  },
  "errors": [],
  "traceId": "<trace-id>"
}
```

Login response khong can tra `memberId` hoac `role` rieng. FE lay access state hien tai qua endpoint muc 5.

## 5. Lay role va privilege cho FE

Sau khi login thanh cong, FE goi:

```http
GET /api/auth/me/permissions
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "success": true,
  "message": null,
  "data": {
    "memberId": "<member-id>",
    "fullName": "System Administrator",
    "email": "admin@example.com",
    "role": {
      "roleId": "<role-id>",
      "code": "Administrator",
      "name": "Administrator"
    },
    "rolePermissionCodes": [
      "Bills.Read",
      "Bills.Write"
    ],
    "grantedPermissionCodes": [],
    "deniedPermissionCodes": [],
    "effectivePermissionCodes": [
      "Bills.Read",
      "Bills.Write",
      "Users.Manage"
    ]
  },
  "errors": [],
  "traceId": "<trace-id>"
}
```

FE chi dung `effectivePermissionCodes` de quyet dinh menu, route va action nao duoc hien thi.

Khong tu tinh effective permission tu role tren FE. Cong thuc nghiep vu duoc xu ly tai BE:

```text
effective = (role defaults + grants) - denies
```

## 6. TypeScript contract

```ts
export type ApiError = {
  code: string;
  field: string | null;
  message: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: ApiError[];
  traceId: string | null;
};

export type MemberRole = {
  roleId: string;
  code: string;
  name: string;
};

export type CurrentAccess = {
  memberId: string;
  fullName: string;
  email: string;
  role: MemberRole;
  rolePermissionCodes: string[];
  grantedPermissionCodes: string[];
  deniedPermissionCodes: string[];
  effectivePermissionCodes: string[];
};
```

Permission codes hien tai:

```ts
export const Permission = {
  BillsRead: "Bills.Read",
  BillsWrite: "Bills.Write",
  BillsDelete: "Bills.Delete",
  GroupsManage: "Groups.Manage",
  PaymentsRecord: "Payments.Record",
  PayoutsReview: "Payouts.Review",
  SupportRequestsManage: "SupportRequests.Manage",
  UsersManage: "Users.Manage",
  SystemConfigure: "System.Configure",
} as const;

export type PermissionCode =
  (typeof Permission)[keyof typeof Permission];
```

## 7. Auth state tren FE

Auth store nen quan ly toi thieu:

```ts
export type AuthState = {
  status: "loading" | "authenticated" | "anonymous";
  accessToken: string | null;
  accessTokenExpiresAtUtc: string | null;
  currentAccess: CurrentAccess | null;
};
```

Sau login:

```ts
async function loadCurrentAccess(accessToken: string): Promise<CurrentAccess> {
  const response = await fetch(`${API_URL}/api/auth/me/permissions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = (await response.json()) as ApiResponse<CurrentAccess>;
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message ?? "Cannot load current permissions.");
  }

  return result.data;
}
```

Thu tu bootstrap:

```text
Login thanh cong
-> luu session/token theo auth strategy cua FE
-> GET /api/auth/me/permissions
-> tao Set tu effectivePermissionCodes
-> render application
```

Khong render nhanh UI administrator chi dua vao email hoac ten role hard-code.

## 8. Permission guard

```ts
export function createPermissionGuard(currentAccess: CurrentAccess | null) {
  const effective = new Set(currentAccess?.effectivePermissionCodes ?? []);

  return {
    can: (permission: PermissionCode) => effective.has(permission),
    canAny: (permissions: PermissionCode[]) =>
      permissions.some((permission) => effective.has(permission)),
    canAll: (permissions: PermissionCode[]) =>
      permissions.every((permission) => effective.has(permission)),
  };
}
```

Vi du:

```tsx
const { can } = createPermissionGuard(currentAccess);

return can(Permission.UsersManage)
  ? <AdminUsersPage />
  : <ForbiddenPage />;
```

Button guard:

```tsx
{can(Permission.BillsDelete) && (
  <button type="button" onClick={cancelBill}>
    Cancel bill
  </button>
)}
```

FE guard chi cai thien UX. User van co the tu gui HTTP request, do do moi endpoint BE van phai authorize.

## 9. Refresh token

Khi access token het han:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<current-refresh-token>"
}
```

BE rotate ca access token va refresh token. FE phai thay the ca hai gia tri cu.

Sau refresh thanh cong:

1. Cap nhat access token moi.
2. Cap nhat refresh token moi.
3. Goi lai `GET /api/auth/me/permissions`.
4. Thay the toan bo `currentAccess` cu bang response moi.

Khong merge permission cu va moi.

## 10. Xu ly 401 va 403

### 401 Unauthorized

```text
API tra 401
-> chi mot request duoc phep refresh tai mot thoi diem
-> refresh thanh cong: retry request cu dung mot lan
-> refresh that bai: xoa auth state va chuyen ve login
```

Khong retry vo han.

### 403 Forbidden

```text
API tra 403
-> khong refresh token chi de retry quyen
-> goi lai /api/auth/me/permissions
-> cap nhat UI
-> hien thong bao khong du quyen
```

`403` co the xay ra khi admin vua thu hoi quyen trong luc FE van dang hien button theo state cu.

## 11. Khi admin thay doi role hoac privilege

Sau khi cap nhat quyen mot user:

- Backend enforcement thay doi ngay tren request tiep theo.
- Access token cu van chua snapshot cu cho toi khi refresh/login lai.
- `/api/auth/me/permissions` tra quyen moi nhat tu database.
- FE cua admin dung response tu PATCH de cap nhat dong user dang chinh sua.
- FE cua user bi thay doi quyen se dong bo lai khi bootstrap, refresh, hoac gap `403`.

Khong dung privilege snapshot trong JWE de override ket qua `/api/auth/me/permissions`.

## 12. Checklist cho FE

- [ ] Khong co JWE EncryptionKey trong source, `.env.local` hoac deployment FE.
- [ ] Xem access token la opaque string.
- [ ] Gui `Authorization: Bearer <accessToken>` cho API protected.
- [ ] Goi `/api/auth/me/permissions` sau login va refresh.
- [ ] Dung `effectivePermissionCodes` cho menu, route va action guard.
- [ ] Khong hard-code Administrator la co tat ca quyen.
- [ ] Xu ly refresh token single-flight khi gap `401`.
- [ ] Khi gap `403`, refetch permission va khong retry vo han.
- [ ] Xoa auth state khi logout hoac refresh token khong con hop le.
- [ ] Dang nhap lai de lay JWE moi sau khi BE deploy thay doi nay.

## 13. Acceptance scenarios

1. User co `Bills.Read` thay danh sach hoa don.
2. User khong co `Bills.Delete` khong thay action huy hoa don.
3. User co `Users.Manage` mo duoc trang quan tri du role khong mang ten `Administrator`.
4. Administrator bi deny `Users.Manage` nhan `403` tai API user administration.
5. Admin thu hoi quyen cua user dang online; request tiep theo cua user bi BE chan ngay.
6. Sau refresh, JWE moi va `/api/auth/me/permissions` cung phan anh snapshot/quyen hien tai.
7. Token cu khong co claim role/permission van co the het han tu nhien; FE khong phu thuoc vao viec giai ma token.
