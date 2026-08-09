# Splitly — Implementation Guide & SRS: Collection → Automatic Payout (PayOS Flow)

## 1. Luồng Nghiệp Vụ Tạo Hóa Đơn & Thanh Toán (UI 4 Bước)

Tài liệu này mô tả chi tiết luồng nghiệp vụ tạo hóa đơn và thanh toán PayOS theo đúng quy trình 4 bước của giao diện người dùng Splitly.

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              QUY TRÌNH 4 BƯỚC TẠO HÓA ĐƠN                       │
└─────────────────────────────────────────────────────────────────────────────────┘
  1. Thông Tin      ──► 2. Người Tham Gia ──► 3. Chia Tiền       ──► 4. Xác Nhận (STK Payout)
     - Tên hóa đơn         - Nhập Email          - Tính phân bổ         - Chọn/Nhập STK Payout
     - Tổng tiền           - Chọn Member           Equal/Custom         - Publish Bill
     - Ngày & Hạn                                                       - Tự động phát hành QR
                                                                        - Tự động gửi Email
                                                                              │
                                                                              ▼
                                                               ┌──────────────────────────────┐
                                                               │ Người tham gia nhận Email    │
                                                               │ chứa link & mã QR PayOS      │
                                                               └──────────────┬───────────────┘
                                                                              │
                                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             LUỒNG HIỂN THỊ MÃ QR THEO TRẠNG THÁI                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────┐ ┌───────────────────────────────────────┐ │
│ │ KHI THÀNH VIÊN CHƯA THANH TOÁN                │ │ KHI THÀNH VIÊN ĐÃ THANH TOÁN (PAID)   │ │
│ │ (RemainingAmount > 0)                         │ │ (RemainingAmount == 0)                │ │
│ ├───────────────────────────────────────────────┤ ├───────────────────────────────────────┤ │
│ │ - Hiển thị mã QR PayOS quét thanh toán        │ │ - ẨN mã QR thanh toán (null)          │ │
│ │ - Hiển thị Nút "Thanh toán ngay" (PayOS Link) │ │ - Hiển thị mác "Đã thanh toán"        │ │
│ │ - Hiển thị số tiền còn nợ                     │ │ - Hiển thị lịch sử thanh toán         │ │
│ └───────────────────────────────────────────────┘ └───────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chi Tiết Luồng Từng Bước (Step-by-Step API Specification)

### Bước 1, 2, 3: Nhập Thông Tin, Member & Chia Tiền (`CreateBill` / `UpdateBill`)
- Người tạo Bill (Owner A) nhập thông tin hóa đơn, danh sách email người tham gia (Payers B, C...), và chọn cách chia tiền (`EqualBillSplitCalculator` hoặc Custom).
- Trạng thái Bill ban đầu là `Draft`.

### Bước 4: Xác Nhận & Phát Hành (`PublishBill`)
- Owner A chọn tài khoản nhận tiền Payout đã lưu (`BeneficiaryPayoutAccount`) hoặc nhập tài khoản ngân hàng mới.
- Khi A bấm **Publish**:
  1. Gán `BeneficiaryPayoutAccount` vào hóa đơn.
  2. Tạo mã `PaymentCode` duy nhất cho từng `BillSplit`.
  3. Khởi tạo PayOS `PaymentOrder` (gọi PayOS API sinh mã đơn hàng, QR Code và Checkout URL).
  4. Chuyển trạng thái hóa đơn `bill.Publish(now)`.
  5. Đưa công việc gửi Email vào `EmailJobRepository` để hệ thống tự động gửi email thông báo thanh toán kèm link/mã QR PayOS cho từng người tham gia.

---

## 3. Quy Tắc Hiển Thị Mã QR & Nút Thanh Toán (`GetBill` / `GetBillSplit`)

Khi thành viên truy cập xem chi tiết hóa đơn:

- **Trạng Thái CHƯA Thanh Toán (`Status != Paid` & `RemainingAmount > 0`)**:
  - `PaymentQrImageUrl`: Trả về đường dẫn ảnh mã QR PayOS hoặc QR VietQR với đúng số tiền còn nợ (`RemainingAmount`).
  - `PaymentUrl`: Trả về link chuyển hướng cổng thanh toán PayOS.
  - `TransferContent`: Mã nội dung chuyển khoản (`PaymentCode`).

- **Trạng Thái ĐÃ Thanh Toán (`Status == Paid` & `RemainingAmount == 0`)**:
  - `PaymentQrImageUrl` = `null` (Ẩn hoàn toàn mã QR).
  - `PaymentUrl` = `null` (Ẩn nút thanh toán).
  - `TransferContent` = `null`.
  - Hiển thị danh sách lịch sử giao dịch trong mảng `Payments` (Thời gian, Số tiền, Trạng thái).

---

## 4. Tự Động Chi Trả Payout Khi B Thanh Toán (PayOS Webhook → Outbox Worker)

1. **Nhận Webhook Thu Tiền (`POST /api/integrations/payos/webhook`)**:
   - PayOS gọi Webhook báo B đã trả tiền -> Backend verify HMAC-SHA256 signature.
   - Chạy 1 DB Transaction nguyên khối:
     - Mark `PaymentOrder = Collected`.
     - Gạch nợ `split.RecordPayment(amount, memberId, note: "PayOS Collection", method: "PayOS")`.
     - Recalculate `bill.RefreshPaymentStatus()`.
     - Ghi `OutboxMessage(InitiatePayout)` để chuẩn bị chi trả cho A.
2. **Chi Trả Tự Động Cho A (`PayoutOutboxWorker`)**:
   - Outbox worker quét tin nhắn, gọi PayOS Payout API chi tiền về tài khoản ngân hàng của A đã chọn ở Bước 4.
   - Payout chuyển sang `Settled`.

---

## 5. Bảng Dữ Liệu & API Design

### Publish Bill kèm STK Payout
```http
POST /api/bills/{id}/publish
Authorization: Bearer <TOKEN_OWNER_A>
Content-Type: application/json

{
  "payoutAccountId": "00000000-0000-0000-0000-000000000000" // Hoặc truyền thông tin STK mới
}
```

### Xem Chi Tiết Bill
```http
GET /api/bills/{id}
Authorization: Bearer <TOKEN>
```
Response:
```json
{
  "id": "...",
  "title": "YouTube Premium tháng 8",
  "totalAmount": 200000,
  "status": "Published",
  "members": [
    {
      "memberId": "member-b-id",
      "name": "Nguyễn Văn B",
      "email": "b@gmail.com",
      "assignedAmount": 100000,
      "remainingAmount": 100000,
      "status": "AwaitingPayment",
      "paymentQrImageUrl": "https://payos.vn/qr.png",
      "paymentUrl": "https://payos.vn/checkout/123456",
      "transferContent": "SL12345678"
    },
    {
      "memberId": "member-c-id",
      "name": "Trần Văn C",
      "email": "c@gmail.com",
      "assignedAmount": 100000,
      "remainingAmount": 0,
      "status": "Paid",
      "paymentQrImageUrl": null,
      "paymentUrl": null,
      "transferContent": null
    }
  ]
}
```
