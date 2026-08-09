# Splitly User Stories Specification (SRS & Features Documentation)

Tài liệu tổng hợp danh sách các **User Stories (Hồ Sơ Yêu Cầu Người Dùng)** và Đặc tả Kỹ thuật của các tính năng mới vừa được triển khai trong hệ thống **Splitly**.

---

## 🎯 Danh Sách User Stories (US)

### 📌 US-01: Đường Link Email Điền Sẵn Tham Số (Email Prefill Parameters)
* **Là một**: Thành viên hoặc Khách được mời tham gia chia tiền hóa đơn / nhóm chi tiêu.
* **Tôi muốn**: Khi bấm vào đường link trong Email, hệ thống mở ra giao diện Web đã đính kèm sẵn tham số Email và Mã Hóa Đơn (`email` & `billId`).
* **Để**: Tôi không cần gõ lại địa chỉ Email thủ công.

#### 🛠️ Điều Kiện Nghiệm Thu (Acceptance Criteria):
1. Đường dẫn `BillUrl` có dạng: `http://localhost:5173/bills/{billId}?email={email}&billId={billId}`.
2. Đường dẫn `GroupUrl` có dạng: `http://localhost:5173/login?email={email}&redirectTo=/groups/{groupId}`.
3. Frontend nhận đường link, tự động trích xuất param `email` và điền sẵn vào ô đăng nhập.

---

### 📌 US-02: Đăng Nhập Qua Mã Code Email (Magic Passcode Auth) & Tự Đồng Bộ Google Account
* **Là một**: Người dùng nhận được Email mời hoặc đăng nhập không qua Google.
* **Tôi muốn**: Bấm nút **"Gửi Mã Đăng Nhập"** để nhận mã xác nhận OTP (10 ký tự, ví dụ: `SL-82A9-K4M7`) gửi về Email, sau đó nhập mã để vào hệ thống. Lần sau nếu tôi chọn đăng nhập bằng Google bằng chính Email này, hệ thống sẽ tự động đồng bộ hóa đơn cũ.
* **Để**: Đăng nhập nhanh chóng, an toàn mà vẫn giữ nguyên 100% dữ liệu lịch sử hóa đơn.

#### 🛠️ Điều Kiện Nghiệm Thu (Acceptance Criteria):
1. **API Send Code**: `POST /api/auth/send-login-code` `{ "email": "user@example.com" }` sinh mã OTP 10 ký tự, lưu Hash và gửi Mail HTML có hạn 15 phút.
2. **API Verify Code**: `POST /api/auth/verify-login-code` `{ "email": "user@example.com", "code": "SL-82A9-K4M7" }` xác thực và trả về JWT Access Token.
3. **Google Sync**: Khi người dùng chọn *Sign in with Google* cùng Email `user@example.com`, `GoogleLoginHandler` gọi `LinkGoogleIdentity` để nối tài khoản tự động, không tạo trùng lặp Member.

---

### 📌 US-03: Quản Lý Vai Trò Thành Viên (Admin Member Role Management)
* **Là một**: Quản trị viên hệ thống (Administrator).
* **Tôi muốn**: Thay đổi vai trò hệ thống (`Administrator` hoặc `User`) cho bất kỳ thành viên nào.
* **Để**: Phân quyền Admin quản trị hoặc hạ quyền người dùng khi cần.

#### 🛠️ Điều Kiện Nghiệm Thu (Acceptance Criteria):
1. **API**: `PATCH /api/admin/users/{memberId}/role` Body: `{ "role": "Administrator" }` hoặc `{ "role": "User" }`.
2. Chỉ tài khoản có vai trò `Administrator` mới được gọi API này.

---

### 📌 US-04: Phân Quyền Tùy Chỉnh Chi Tiết Cho Từng Người Dùng (Granular Custom Privileges)
* **Là một**: Quản trị viên hệ thống (Administrator).
* **Tôi muốn**: Tùy chỉnh danh sách quyền hạn chi tiết (Privileges / Fine-grained Permissions) cho từng người dùng riêng biệt (ví dụ: User A được duyệt Payout + Báo lỗi, User B chỉ được tạo Hóa đơn).
* **Để**: Linh hoạt cấp đúng chức năng cần thiết cho từng nhân sự mà không nhất thiết phải trao toàn quyền Admin.

#### 🛠️ Danh Sách Mã Quyền Hệ Thống (System Permissions Matrix):

| Permission Code | Mô tả | Nhóm chức năng |
| :--- | :--- | :--- |
| `Bills.Read` | Xem danh sách và chi tiết hóa đơn | Bills |
| `Bills.Write` | Tạo mới và chỉnh sửa hóa đơn | Bills |
| `Bills.Delete` | Hủy và xóa hóa đơn | Bills |
| `Groups.Manage` | Quản lý nhóm chi tiêu & thành viên | Groups |
| `Payments.Record` | Ghi nhận thanh toán thủ công | Payments |
| `Payouts.Review` | Duyệt & xử lý giải ngân Payout | Payouts |
| `SupportRequests.Manage` | Quản lý & duyệt báo lỗi Support Request | Support |
| `Users.Manage` | Quản lý & phân quyền người dùng | Administration |
| `System.Configure` | Cấu hình hệ thống & Template Email | System |

#### 🛠️ Điều Kiện Nghiệm Thu (Acceptance Criteria):
1. **API Danh Sách Quyền**: `GET /api/admin/users/permissions` trả về toàn bộ danh sách mã quyền để Frontend hiển thị ô Checkbox.
2. **API Gán Quyền**: `PATCH /api/admin/users/{memberId}/permissions` Body: `{ "permissions": ["Bills.Read", "SupportRequests.Manage", "Payouts.Review"] }`.
3. Lưu danh sách quyền dưới dạng mảng `CustomPermissions` trong bảng `Members` của PostgreSQL.

---

### 📌 US-05: Hệ Thống Báo Lỗi Thanh Toán & Request Hỗ Trợ (Support & Payment Issue Request System)
* **Là một**: Người dùng gặp sự cố thanh toán (đã chuyển khoản nhưng chưa gạch nợ / không nhận được tiền) hoặc thắc mắc khác.
* **Tôi muốn**: Gửi yêu cầu hỗ trợ kèm loại sự cố và mô tả chi tiết, đồng thời Admin có thể xem danh sách và cập nhật trạng thái xử lý kèm ghi chú.
* **Để**: Sự cố giao dịch tài chính được hỗ trợ và giải quyết minh bạch.

#### 🛠️ Quy Trình Trạng Thái (Workflow Statuses):
* `Pending`: Mới tiếp nhận, chờ Admin kiểm tra.
* `InReview`: Admin đang kiểm tra với cổng PayOS / Ngân hàng.
* `Resolved`: Đã xử lý xong (đã gạch nợ / hoàn tiền).
* `Dismissed`: Yêu cầu không hợp lệ.

#### 🛠️ Điều Kiện Nghiệm Thu (Acceptance Criteria):
1. **API Public / User gửi Request**: `POST /api/support-requests`
   - Body: `{ "contactEmail": "user@example.com", "type": "PaymentIssue", "billId": "...", "description": "Đã chuyển tiền qua VietQR PayOS thành công nhưng hóa đơn chưa cập nhật." }`
2. **API Admin Xem Danh Sách**: `GET /api/admin/support-requests?status=Pending&type=PaymentIssue&page=1&pageSize=20`
3. **API Admin Cập Nhật Trạng Thái**: `PATCH /api/admin/support-requests/{requestId}/status`
   - Body: `{ "status": "Resolved", "resolutionNote": "Đã đối soát giao dịch PayOS và cập nhật gạch nợ hóa đơn thủ công." }`
