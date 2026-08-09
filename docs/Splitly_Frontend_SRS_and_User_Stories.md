# Splitly — Frontend SRS & User Stories: PayOS Collection & Auto Payout

## 1. Mục Tiêu & Phạm Vi

Tài liệu này cung cấp **Đặc tả Yêu cầu Phần mềm (SRS)** và **Danh sách User Stories dành riêng cho nhóm phát triển Frontend (FE)** để xây dựng giao diện người dùng cho tính năng Thu tiền tự động qua PayOS và Chi trả tự động cho Bill Owner.

---

## 2. Tổng Quan Luồng Giao Diện (UI Flow Overview)

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            1. QUY TRÌNH 4 BƯỚC TẠO HÓA ĐƠN (/bills/create)                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
  [Bước 1: Thông Tin]   ──► [Bước 2: Người Tham Gia] ──► [Bước 3: Chia Tiền] ──► [Bước 4: Xác Nhận & STK]
   - Tên hóa đơn             - Thêm email/member          - Chọn Equal/Custom    - Chọn/Nhập STK Payout
   - Tổng tiền               - Chọn danh bạ               - Phân bổ số tiền      - Bấm "Phát hành Hóa đơn"
   - Ngày & Hạn                                                                  - Tự động gửi Email & QR
                                                                                        │
                                                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            2. CHI TIẾT HÓA ĐƠN & QUY TẮC HIỂN THỊ MÃ QR                    │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ GET /api/bills/{id}                                                                         │
│                                                                                             │
│  ┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ THÀNH VIÊN CHƯA THANH TOÁN (Remaining > 0)   │  │ THÀNH VIÊN ĐÃ THANH TOÁN (Paid)     │  │
│  ├──────────────────────────────────────────────┤  ├──────────────────────────────────────┤  │
│  │ - Thẻ màu cam: "Chờ thanh toán"              │  │ - Thẻ màu xanh lá: "Đã thanh toán"   │  │
│  │ - Hiển thị Mã QR PayOS quét thanh toán       │  │ - ẨN HOÀN TOÀN MÃ QR                 │  │
│  │ - Nút "Thanh toán ngay" (PayOS Link)         │  │ - ẨN NÚT THANH TOÁN                  │  │
│  │ - Mã nội dung chuyển khoản (PaymentCode)     │  │ - Hiển thị ngày & lịch sử trả tiền   │  │
│  └──────────────────────────────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Danh Sách Frontend User Stories (FE-US) & Acceptance Criteria

### FE-US-001 — Quản lý tài khoản ngân hàng nhận tiền Payout
**Là một** Bill Owner A,  
**tôi muốn** thêm và xem danh sách tài khoản ngân hàng cá nhân của mình,  
**để** cài đặt tài khoản nhận tiền Payout tự động từ PayOS.

- **Màn hình**: `/payout-accounts`
- **Acceptance Criteria**:
  - Đội FE hiển thị danh sách các ngân hàng kèm logo, tên chủ tài khoản và số tài khoản đã che mờ (ví dụ: `******4105`).
  - Có nút chọn **"Đặt làm mặc định"**.
  - Form thêm tài khoản yêu cầu chọn Ngân hàng, Nhập Số tài khoản, Tên chủ tài khoản.

---

### FE-US-002 — Form tạo hóa đơn 4 bước (Create Bill Wizard)
**Là một** Bill Owner A,  
**tôi muốn** thực hiện quy trình tạo hóa đơn qua 4 bước trực quan kèm thanh tiến trình (Progress Bar),  
**để** dễ dàng nhập liệu mà không bị rối thông tin.

- **Màn hình**: `/bills/create`
- **Acceptance Criteria**:
  - **Thanh tiến trình (Progress Bar)**:
    - Bước 1 (25%): Thông tin cơ bản (Tên hóa đơn, Tổng tiền, Ngày tạo, Hạn thanh toán, Ghi chú).
    - Bước 2 (50%): Thêm người tham gia (Nhập email hoặc chọn thành viên trong nhóm).
    - Bước 3 (75%): Chia tiền (Chọn Chia đều `Equal` hoặc Nhập số tiền riêng cho từng người).
    - Bước 4 (100%): Xác nhận & Chọn STK Payout.

---

### FE-US-003 — Chọn tài khoản Payout ở Bước 4 Xác Nhận
**Là một** Bill Owner A ở Bước 4 của quy trình tạo hóa đơn,  
**tôi muốn** chọn tài khoản ngân hàng nhận tiền hoặc thêm nhanh tài khoản mới,  
**để** hoàn tất phát hành hóa đơn.

- **Màn hình**: `/bills/create` (Step 4)
- **Acceptance Criteria**:
  - Hiển thị ô Dropdown chọn tài khoản Payout đã lưu (tự động chọn tài khoản mặc định).
  - Có nút **"+ Thêm tài khoản ngân hàng mới"** mở Modal để thêm nhanh mà không làm mất dữ liệu đã nhập ở Bước 1, 2, 3.
  - Sau khi chọn xong, bấm nút **"Phát hành Hóa đơn"**: Hệ thống gửi dữ liệu lên Backend, tự động gửi Email kèm QR cho từng người tham gia và chuyển hướng người dùng về màn hình xem chi tiết hóa đơn.

---

### FE-US-004 — Hiển thị thẻ người tham gia CHƯA thanh toán (Có Mã QR PayOS)
**Là một** người tham gia B mở xem chi tiết hóa đơn,  
**tôi muốn** thấy mã QR PayOS và nút thanh toán trực tuyến đối với khoản nợ của tôi,  
**để** quét mã hoặc bấm thanh toán ngay lập tức.

- **Màn hình**: `/bills/{billId}`
- **Acceptance Criteria**:
  - Nếu thành viên chưa trả tiền (`remainingAmount > 0` và status khác `Paid`):
    - Thẻ thành viên có màu cam/vàng thể hiện *"Chờ thanh toán"*.
    - Hiển thị **Mã QR PayOS** để quét mã ứng dụng ngân hàng.
    - Hiển thị Nút **"Thanh toán ngay"** (mở link Checkout của PayOS).
    - Hiển thị Mã cú pháp chuyển khoản (`PaymentCode`).

---

### FE-US-005 — Hiển thị thẻ người tham gia ĐÃ thanh toán (Ẩn Mã QR)
**Là một** người xem hóa đơn,  
**tôi muốn** mã QR và nút thanh toán tự động ẩn đi đối với những ai đã thanh toán xong,  
**để** giao diện gọn gàng và không chuyển khoản trùng lặp.

- **Màn hình**: `/bills/{billId}`
- **Acceptance Criteria**:
  - Nếu thành viên đã trả xong (`remainingAmount == 0` hoặc status là `Paid`):
    - Thẻ thành viên chuyển sang màu xanh lá với nhãn *"✓ Đã thanh toán"*.
    - **ẨN HOÀN TOÀN Mã QR** (Không render khung ảnh QR).
    - **ẨN HOÀN TOÀN Nút thanh toán**.
    - Hiển thị ngày giờ đã trả tiền và danh sách lịch sử các đợt thanh toán.

---

### FE-US-006 — Tự động cập nhật giao diện khi người dùng vừa trả tiền (Real-time Auto Refresh)
**Là một** người vừa quét mã QR thanh toán trên điện thoại,  
**tôi muốn** màn hình hóa đơn trên trình duyệt tự động cập nhật trạng thái "Đã thanh toán" và ẩn mã QR ngay lập tức,  
**để** không cần bấm tải lại trang (F5).

- **Acceptance Criteria**:
  - Khi người dùng ở màn hình chi tiết hóa đơn `/bills/{billId}` và còn người chưa trả tiền, FE tự động gửi yêu cầu kiểm tra trạng thái ngầm (Polling) định kỳ mỗi 3-5 giây.
  - Ngay khi Backend nhận được Webhook từ PayOS báo thành công, dữ liệu mới trả về sẽ làm giao diện FE re-render: Thẻ màu cam chuyển thành thẻ màu xanh lá, mã QR biến mất ngay trước mắt người dùng.

---

## 4. Bảng Tóm Tắt API Endpoints Cho Frontend

| Chức Năng Frontend | HTTP Method | Endpoint Backend | Ghi Chú |
|---|---|---|---|
| Lấy danh sách STK Payout | `GET` | `/api/payout-accounts` | Dùng cho trang Cài đặt & Dropdown Bước 4 |
| Thêm STK Payout mới | `POST` | `/api/payout-accounts` | Thêm STK nhận tiền Payout |
| Tạo bản nháp Hóa đơn (Bước 1) | `POST` | `/api/bills` | Trả về `billId` |
| Thêm người tham gia (Bước 2) | `POST` | `/api/bills/{billId}/members` | Nhập danh sách email |
| Chia tiền (Bước 3) | `POST` | `/api/bills/{billId}/calculate` | Phân bổ số tiền |
| Phát hành Hóa đơn (Bước 4) | `POST` | `/api/bills/{billId}/publish` | Đính kèm `payoutAccountId` |
| Xem chi tiết Hóa đơn | `GET` | `/api/bills/{id}` | Trả về mã QR (nếu chưa trả) hoặc `null` (nếu đã trả) |
