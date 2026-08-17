# Splitly SRS - Role va Privilege

## 1. Muc tieu

Phan quyen he thong theo RBAC co privilege, thay vi kiem tra truc tiep `Administrator` trong API.

- Role la mau quyen mac dinh duoc luu trong database.
- Permission la quyen nghiep vu nho nhat duoc luu trong database.
- Moi user co mot role va co the co override rieng theo hai huong `Grant` hoac `Deny`.
- FE khong hard-code role, permission, nhom permission hay bo quyen mac dinh.
- Backend luon la noi quyet dinh quyen truy cap cuoi cung.

Quyen hieu luc duoc tinh nhu sau:

```text
effective permissions = (role default permissions + user grants) - user denies
```

## 2. Mo hinh du lieu

| Bang | Muc dich |
|---|---|
| `AccessRoles` | Danh muc role, vi du `User`, `Administrator` |
| `Permissions` | Danh muc privilege va metadata de FE render |
| `RolePermissions` | Bo privilege mac dinh cua tung role |
| `MemberPermissionOverrides` | Phan cap them (`Grant`) hoac thu hoi (`Deny`) rieng cho user |
| `Members.RoleId` | Role hien tai cua user |

Khong luu danh sach checkbox lap lai tren `Members`. Khong suy dien `Administrator` la toan quyen trong code.

## 3. Role mac dinh

### User

- `Bills.Read`
- `Bills.Write`
- `Bills.Delete`
- `Groups.Manage`
- `Payments.Record`

### Administrator

- Tat ca quyen cua `User`
- `Payouts.Review`
- `SupportRequests.Manage`
- `Users.Manage`
- `System.Configure`

Khi chuyen role, backend xoa override cu va ap dung dung bo quyen mac dinh cua role moi. FE phai hien hop thoai xac nhan truoc khi doi role.

## 4. API contract cho FE

Tat ca API ben duoi can header `Authorization: Bearer <accessToken>` va quyen `Users.Manage`.

### 4.1 Lay danh sach user

```http
GET /api/admin/users?pageNumber=1&pageSize=20&search=&status=
```

Moi item co `memberId`, `name`, `email`, `status`, `roleId`, `role`, `createdAtUtc`, `lastLoginAtUtc`.

### 4.2 Lay catalog permission tu database

```http
GET /api/admin/users/permissions
```

```json
{
  "success": true,
  "data": [
    {
      "permissionId": "20000000-0000-0000-0000-000000000001",
      "code": "Bills.Read",
      "name": "Xem hoa don",
      "description": "Xem danh sach va chi tiet hoa don",
      "groupCode": "Bills",
      "groupName": "Hoa don",
      "sortOrder": 10
    }
  ]
}
```

FE group theo `groupCode`, hien tieu de bang `groupName`, sap xep theo `sortOrder`. Khong tach nhom bang chuoi `code`.

### 4.3 Lay catalog role va quyen mac dinh tu database

```http
GET /api/admin/users/roles
```

```json
{
  "success": true,
  "data": [
    {
      "roleId": "10000000-0000-0000-0000-000000000002",
      "code": "Administrator",
      "name": "Administrator",
      "description": "Quan tri he thong",
      "isSystem": true,
      "defaultPermissionCodes": ["Bills.Read", "Users.Manage"]
    }
  ]
}
```

Dropdown role dung `roleId` lam value, `name` lam label. `code` chi dung cho logic hien thi on dinh, khong gui thay cho `roleId`.

### 4.4 Lay role va privilege cua mot user

```http
GET /api/admin/users/{memberId}/permissions
```

```json
{
  "success": true,
  "data": {
    "memberId": "d8da59b3-fc8b-4df5-940b-0f78317b34ee",
    "fullName": "System Administrator",
    "email": "admin@example.com",
    "role": {
      "roleId": "10000000-0000-0000-0000-000000000002",
      "code": "Administrator",
      "name": "Administrator"
    },
    "rolePermissionCodes": ["Bills.Read", "Users.Manage"],
    "grantedPermissionCodes": [],
    "deniedPermissionCodes": [],
    "effectivePermissionCodes": ["Bills.Read", "Users.Manage"]
  }
}
```

- Checkbox checked khi code nam trong `effectivePermissionCodes`.
- Badge "Mac dinh theo role" khi code nam trong `rolePermissionCodes` va khong nam trong `deniedPermissionCodes`.
- Badge "Cap them" khi code nam trong `grantedPermissionCodes`.
- Badge "Da thu hoi" khi code nam trong `deniedPermissionCodes`.

### 4.5 Doi role

```http
PATCH /api/admin/users/{memberId}/role
Content-Type: application/json

{
  "roleId": "10000000-0000-0000-0000-000000000002"
}
```

Response tra lai toan bo object quyen cua user theo cau truc tai muc 4.4. FE thay state bang response, khong tu tinh quyen mac dinh.

### 4.6 Luu cac checkbox privilege

```http
PATCH /api/admin/users/{memberId}/permissions
Content-Type: application/json

{
  "effectivePermissionCodes": [
    "Bills.Read",
    "Bills.Write",
    "Users.Manage"
  ]
}
```

FE gui toan bo danh sach checkbox dang duoc chon, khong chi gui phan thay doi. Backend tu tinh `Grant` va `Deny` so voi role hien tai. Response tra lai object moi theo muc 4.4.

### 4.7 Doi role va trang thai trong mot request

```http
PUT /api/admin/users/{memberId}/access
Content-Type: application/json

{
  "blocked": false,
  "roleId": "10000000-0000-0000-0000-000000000001"
}
```

Dung endpoint nay khi form FE cho phep luu dong thoi role va trang thai khoa.

### 4.8 Lay quyen cua user dang dang nhap

```http
GET /api/auth/me/permissions
```

FE goi sau login va sau refresh trang de tao navigation guard. FE chi dung response de an/hien chuc nang; backend van bat buoc kiem tra privilege tren moi API.

## 5. Luong FE bat buoc

1. Mo trang quan tri: goi song song `GET /api/admin/users`, `GET /api/admin/users/permissions`, `GET /api/admin/users/roles`.
2. Nhan nut "Phan quyen chi tiet": goi `GET /api/admin/users/{memberId}/permissions`.
3. Render catalog permission tu response 4.2 va checked state tu `effectivePermissionCodes`.
4. User thay checkbox: chi cap nhat local draft, chua goi API.
5. Nhan "Luu phan quyen": gui toan bo code dang checked theo muc 4.6.
6. Luu thanh cong: thay state bang response backend va dong modal.
7. Doi role: hien canh bao override se bi reset, goi API 4.5, sau do render response moi.
8. Gap `401`: thu refresh token mot lan; that bai thi ve login.
9. Gap `403`: hien thong bao khong du privilege, refetch `/api/auth/me/permissions`, khong tu dong thu lai request.

## 6. Quy tac bao mat va nghiep vu

- API quan ly user yeu cau `Users.Manage`, khong yeu cau ten role `Administrator`.
- API payout yeu cau `Payouts.Review`; API support admin yeu cau `SupportRequests.Manage`.
- API hoa don va nhom kiem tra privilege tuong ung, sau do van kiem tra ownership/membership trong handler.
- User khong duoc doi role, khoa tai khoan hoac sua privilege cua chinh minh de tranh tu khoa quyen quan tri.
- Permission code khong ton tai hoac da inactive tra `400 InvalidPermissionCodes`.
- Role khong ton tai hoac inactive tra `400 InvalidRole`.
- User khong ton tai tra `404 MemberNotFound`.
- Thay doi role xoa tat ca override cu.
- Access token khong duoc FE giai ma de suy ra quyen. FE dung `/api/auth/me/permissions`.

## 7. Acceptance criteria

- Catalog role va permission duoc doc tu PostgreSQL, khong tra truc tiep tu constant trong handler.
- Chon `Administrator` tao bo quyen hieu luc theo `RolePermissions` trong DB.
- Bo chon mot quyen mac dinh tao override `Deny`; chon them quyen ngoai role tao override `Grant`.
- Reload trang van hien dung checkbox tu database.
- Doi bo quyen cua role trong DB anh huong cac user khong override o request ke tiep.
- User co `Users.Manage` truy cap duoc API quan tri user du ten role khong phai `Administrator`.
- User mang ten role `Administrator` nhung bi `Deny Users.Manage` nhan `403` tai API quan tri user.
