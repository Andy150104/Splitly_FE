# Quyền BE và giao diện server

Quyền hiệu lực của phiên chỉ nằm ở server. Browser không gọi `/api/auth/me/permissions`; gateway trả 404 cho endpoint này. Không có DTO `actions`, mảng grant của phiên hoặc context `can(...)` ở client.

## Luồng hiện tại

1. Layout xác minh profile phiên đã ký. `getWorkspacePermissions()` đọc access cookie và gọi `auth/me/permissions` trực tiếp tới BE qua `upstream.server.ts`.
2. Server dùng mã BE như `Bills.Create`, `Users.UpdateRole` để chọn menu và dựng các control cho từng màn. Đối tượng quyền không được truyền vào client props.
3. `WorkspaceViews.tsx` gửi các slot ReactNode thực tế: nút, link, field hoặc panel được phép hiển thị. Không có quyền thì slot không có nội dung. Client chỉ gắn handler, dữ liệu hiện tại và trạng thái pending vào control này.
4. Gateway/BE kiểm tra quyền khi gọi API. Nội dung UI đã dựng không phải bằng chứng quyền và không thay thế authorization.
5. Sau khi tự đổi vai trò/quyền, `router.refresh()` lấy lại giao diện theo quyền BE mới.

`React.cache` gộp các lần đọc trong cùng lượt render. `fetch` dùng `no-store`; không giữ grant qua những lượt render đã hoàn thành. Layout có thể được Next giữ khi điều hướng, nên quyền bị thu hồi vẫn phải được gateway/BE từ chối ngay ở API; refresh tải lại cả menu và control.

## Đọc code để debug

| File                                                 | Trách nhiệm                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/lib/api/permissions.server.ts`                  | Đọc quyền hiệu lực; `has('Mã.BE')`; chọn mã cần cho API admin.                                                |
| `src/lib/api/upstream.server.ts`                     | Gọi BE với token server, gộp refresh đồng thời.                                                               |
| `src/lib/api/admin-references.server.ts`             | Tạo/đọc mã tham chiếu quản trị; chuyển lựa chọn browser về payload BE.                                        |
| `src/app/(workspace)/layout.tsx`                     | Xác minh phiên, chọn navigation, bỏ metadata quyền trước khi gửi menu.                                        |
| `src/app/(workspace)/_components/WorkspaceViews.tsx` | Kiểm tra quyền xem trang; dựng các nút/link/field/panel theo mã BE.                                           |
| `src/components/workspace/slots.tsx`                 | `bindControl` gắn tương tác local; `fillControl` giữ label server khi thêm input local. Không kiểm tra quyền. |
| `src/components/workspace/hooks.tsx`                 | Context chỉ có user; `useApi` quản lý tài nguyên và loading.                                                  |
| `src/app/api/[...path]/route.ts`                     | Allowlist, session, Origin, quyền admin, gọi BE và rút gọn response.                                          |
| `src/app/api/auth/refresh-session/route.ts`          | Refresh token hết hạn, ghi cookie và redirect về đường dẫn nội bộ. Không trả token/grant.                     |

Khi nút không xuất hiện, đặt breakpoint ở `getWorkspacePermissions()` rồi tìm mã BE trong `WorkspaceViews.tsx`. Khi API admin trả 403, xem `requiredAdminPermission(path, method)` và quyền hiệu lực trong gateway. Khi đã qua gateway nhưng BE từ chối, kiểm tra ownership và policy của resource tại BE. Không log token hoặc nguyên payload dữ liệu cá nhân.

Nếu BE trả dữ liệu quyền thiếu hoặc sai cấu trúc, server không dựng control được bảo vệ và hiển thị lỗi tải quyền có nút thử lại. Nếu access token hết hạn, server redirect qua route refresh để ghi cookie đúng ranh giới Next; phiên không dùng được trở về login. Không ghi cookie trong render Server Component.

## Dữ liệu còn phải nhận ở browser

UI được dựng, tên/email cần hiển thị, số tài khoản do người dùng nhập và QR/link thanh toán vẫn đọc được. Nội dung menu/nút cho biết chức năng người dùng có thể thao tác; không thể giấu điều đó trong một UI còn sử dụng được.

Màn chỉnh quyền admin chỉ nhận tên, mô tả/nhóm hiển thị, thứ tự sắp xếp và mã tham chiếu để chọn/lưu. Không nhận mã quyền BE, `roleId`, `permissionId`, `groupCode`, mặc định vai trò hoặc metadata nội bộ. Những endpoint này vẫn kiểm tra quyền đọc tương ứng ở server và chỉ tải khi mở phần chỉnh quyền. Tên chức năng và trạng thái checkbox vẫn đọc được trong DevTools.

## Contract quản trị ở browser

Một vai trò có dạng `{ id: "mã chọn", value: "v1.…", name: "Quản lý" }`. Danh mục quyền thêm `description`, `groupName`, `sortOrder`; quyền của người đang chỉnh có dạng `{ permissions: [{ id, value }] }`. Danh sách người dùng giữ tên/email/trạng thái/tên vai trò và `roleSelection` để chặn/mở truy cập mà không cần tải danh mục vai trò.

- `id` là HMAC ổn định theo người quản trị, loại lựa chọn và giá trị BE; cùng quyền trong danh mục và danh sách đã chọn có cùng `id`.
- `value` dùng AES-256-GCM với nonce ngẫu nhiên, khóa chỉ ở server và context gắn với người quản trị/loại lựa chọn. Đây là mã tham chiếu, không phải bằng chứng quyền. Mã bị sửa, khác người quản trị hoặc sai loại bị từ chối.
- Browser lưu vai trò bằng `{ role: value }`, truy cập bằng `{ role: value, blocked }`, quyền bằng `{ permissions: [value] }`. Gateway kiểm tra quyền trước, giải mã rồi gửi BE đúng `{ roleId }`, `{ roleId, blocked }` hoặc `{ effectivePermissionCodes }`. Không đổi contract upstream.
- Giữ mọi quyền đã chọn, kể cả quyền không nằm trong danh mục. Quyền chưa có tên hiển thị được ghi là “Quyền hiện tại 1…”; tìm kiếm/đổi tab không làm mất lựa chọn.
- Không có cache ánh xạ hoặc khóa giải mã ở client. `SESSION_SECRET` phải ổn định và nhất quán giữa các instance. Sau khi đổi secret, tải lại editor để lấy mã tham chiếu mới; các phiên ký bằng secret cũ cũng hết hiệu lực.

Khi debug lỗi lưu, kiểm tra `adminRequestBody()` ở server rồi payload chuyển cho BE. Response lỗi lựa chọn trả 400 và thông báo tải lại, không phản chiếu mã BE hoặc token. Xem [API crypto của Node](https://nodejs.org/docs/latest-v22.x/api/crypto.html) cho authenticated encryption.

## Kiểm tra

Unit test kiểm tra endpoint quyền phiên bị chặn, authorization admin, lọc dữ liệu riêng tư, quyền bị thu hồi, refresh/redirect và mã tham chiếu bị sửa/sai người/sai loại. E2E đọc HTML và Flight payload để xác nhận không chứa bảng quyền phiên hay mã quyền BE; kiểm tra control, wizard, ngân hàng và chỉnh quyền. Test editor đi qua gateway local kiểm tra cả response tối thiểu và việc giữ quyền chưa có trong danh mục khi chuyển payload về BE.

E2E chạy bản production ở `:3210`, dùng BE fixture quyền/DTO quản trị ở `:3211`, và mock API nghiệp vụ khác ở browser. Fixture chỉ xác nhận payload quản trị giả lập và từ chối nghiệp vụ khác; không ghi lên BE thật. `npm run test:e2e -- --grep 'tên case' --project=desktop-chrome` build trước khi chạy; nếu dùng `npx playwright test`, phải chạy `npm run build` trước.
