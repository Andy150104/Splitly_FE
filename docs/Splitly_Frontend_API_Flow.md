# Splitly — Sơ Đồ Luồng Gọi API Cho Frontend (FE API Sequence Flow)

## 1. Sơ Đồ Tổng Quan Luồng API (API Sequence Diagram)

```text
[BILL OWNER (A)]                           [FRONTEND (FE)]                           [BACKEND (BE)]
       │                                          │                                        │
       │ 1. Thêm STK nhận tiền Payout             │                                        │
       ├─────────────────────────────────────────►│── POST /api/payout-accounts ──────────►│ (Lưu STK Payout)
       │                                          │                                        │
       │ 2. Wizard Bước 1: Nhập thông tin hóa đơn │                                        │
       ├─────────────────────────────────────────►│── POST /api/bills ────────────────────►│ (Tạo Bill Draft)
       │                                          │                                        │
       │ 3. Wizard Bước 2: Nhập email người chia │                                        │
       ├─────────────────────────────────────────►│── POST /api/bills/{id}/members ───────►│ (Thêm Participants)
       │                                          │                                        │
       │ 4. Wizard Bước 3: Phân bổ chia tiền      │                                        │
       ├─────────────────────────────────────────►│── POST /api/bills/{id}/calculate ─────►│ (Gán số tiền từng người)
       │                                          │                                        │
       │ 5. Wizard Bước 4: Chọn STK & Publish     │                                        │
       ├─────────────────────────────────────────►│── POST /api/bills/{id}/publish ───────►│ (Tự gửi Email + sinh QR)
       │                                          │                                        │
                                                  │                                        │
[PAYER (B, C...)]                                 │                                        │
       │                                          │                                        │
       │ 6. Click Link từ Email / Truy cập xem    │                                        │
       ├─────────────────────────────────────────►│── GET /api/bills/{id} ─────────────────►│
       │                                          │◄── (Trả về QR Code + PayOS Link) ──────┤
       │                                          │                                        │
       │ 7. Quét mã QR / Bấm PayOS trả tiền       │                                        │
       ├─────────────────────────────────────────►│── Cổng PayOS Checkout ─────────────────┤
       │                                          │        │                               │
       │                                          │        ▼ (Webhook tự động ngầm)        │
       │                                          │    POST /api/integrations/payos/webhook│ (BE gạch nợ + Auto Payout)
       │                                          │                                        │
       │ 8. Màn hình chi tiết tự động Refresh     │                                        │
       ├─────────────────────────────────────────►│── GET /api/bills/{id} (Polling 3s) ───►│
       │                                          │◄── (remainingAmount = 0, QR = null) ───┤ (UI chuyển thẻ Paid, ẩn QR)
```

---

## 2. Chi Tiết Các API Theo Thứ Tự Thực Thi

### GIAI ĐOẠN 1: Chuẩn bị & Tạo Hóa Đơn 4 Bước (Owner A)

#### 🔹 API 1: Thêm tài khoản ngân hàng Payout của Owner (Thực hiện ở Cài đặt hoặc Modal Bước 4)
- **HTTP Method**: `POST`
- **Endpoint**: `/api/payout-accounts`
- **Request Body**:
  ```json
  {
    "bankBin": "970436",
    "bankCode": "VCB",
    "bankName": "Vietcombank",
    "accountNumber": "0123456789",
    "accountHolderName": "NGUYEN VAN A",
    "isDefault": true
  }
  ```

---

#### 🔹 API 2: Bước 1 Wizard — Nhập thông tin cơ bản hóa đơn
- **HTTP Method**: `POST`
- **Endpoint**: `/api/bills`
- **Request Body**:
  ```json
  {
    "title": "YouTube Premium tháng 8",
    "description": "Chia tiền tài khoản chung",
    "totalAmount": 200000,
    "currency": "VND",
    "billDate": "2026-08-09",
    "dueDate": "2026-08-15"
  }
  ```
- **Response**: Trả về `data.id` (Dùng `billId` này cho các bước tiếp theo).

---

#### 🔹 API 3: Bước 2 Wizard — Nhập danh sách email người tham gia
- **HTTP Method**: `POST`
- **Endpoint**: `/api/bills/{billId}/members`
- **Request Body**:
  ```json
  {
    "emails": ["b@gmail.com", "c@gmail.com"],
    "groupMemberIds": [],
    "includeOwner": true
  }
  ```

---

#### 🔹 API 4: Bước 3 Wizard — Chia tiền
- **HTTP Method**: `POST`
- **Endpoint**: `/api/bills/{billId}/calculate`
- **Request Body** *(Nếuchọn chia đều `Equal`)*:
  ```json
  {
    "method": 1,
    "allocations": []
  }
  ```

---

#### 🔹 API 5: Bước 4 Wizard — Phát hành Hóa Đơn & Gửi Mail
- **HTTP Method**: `POST`
- **Endpoint**: `/api/bills/{billId}/publish`
- **Request Body**:
  ```json
  {
    "payoutAccountId": "00000000-0000-0000-0000-000000000000" // Hoặc gửi null để dùng STK mặc định
  }
  ```
- **Xử lý Backend**:
  - Hóa đơn sang `Published`.
  - Tự động phát hành mã QR PayOS và tự động gửi Email mời thanh toán kèm link cho tất cả người tham gia.

---

### GIAI ĐOẠN 2: Người Tham Gia Thanh Toán & Cập Nhật Real-time (Payers B, C...)

#### 🔹 API 6: Xem chi tiết Hóa Đơn (Mở từ link Email hoặc App)
- **HTTP Method**: `GET`
- **Endpoint**: `/api/bills/{billId}`
- **Response Data Structure**:
  ```json
  {
    "data": {
      "billId": "b07341ea-176c-4ec7-a9a3-def2cae89bfa",
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
          "paymentQrImageUrl": "https://img.vietqr.io/...", // 👈 HIỂN THỊ MÃ QR NẾU CHƯA PAID
          "paymentUrl": "https://payos.vn/checkout/12345",   // 👈 LINK NÚT "THANH TOÁN PAYOS"
          "transferContent": "SL12345678"
        },
        {
          "memberId": "member-c-id",
          "name": "Trần Văn C",
          "email": "c@gmail.com",
          "assignedAmount": 100000,
          "remainingAmount": 0,
          "status": "Paid",
          "paymentQrImageUrl": null, // 👈 ẨN MÃ QR KHI ĐÃ PAID
          "paymentUrl": null,        // 👈 ẨN NÚT THANH TOÁN KHI ĐÃ PAID
          "transferContent": null
        }
      ]
    }
  }
  ```

---

#### 🔹 Quy Trình Cập Nhật Real-time Trên Frontend (Polling):
1. Khi FE hiển thị trang `/bills/{billId}`, nếu còn ít nhất 1 member có `remainingAmount > 0`, FE khởi chạy `setInterval` gọi lại `GET /api/bills/{billId}` mỗi **3 giây**.
2. Ngay khi B quét mã QR hoặc bấm thanh toán trên PayOS thành công:
   - Cổng PayOS bắn Webhook ngầm sang Backend Splitly.
   - Backend gạch nợ B -> Chuyển status B sang `Paid` -> Payout tự động về STK A.
3. Đợt Polling tiếp theo của FE nhận được `remainingAmount = 0` và `paymentQrImageUrl = null`:
   - FE re-render giao diện: Mã QR tự biến mất, thẻ chuyển sang màu xanh lá **"Đã thanh toán"**!
