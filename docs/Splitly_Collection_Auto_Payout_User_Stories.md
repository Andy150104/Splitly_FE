# Splitly — User Stories & Acceptance Criteria: Collection → Automatic Payout (PayOS Flow)

## US-001 — Quản lý tài khoản ngân hàng Payout của Bill Owner A
**Là một** Bill Owner A,  
**tôi muốn** lưu hoặc chọn tài khoản ngân hàng nhận tiền ở bước cuối cùng khi tạo hóa đơn,  
**để** Splitly tự động chuyển toàn bộ tiền thu từ người tham gia về đúng tài khoản của tôi.

- **Acceptance Criteria**:
  - Tại bước 4 "Xác nhận", A có thể chọn STK Payout mặc định đã có hoặc nhập STK mới.
  - Thông tin ngân hàng được snapshot cố định vào Hóa đơn và Đơn thu tiền.

---

## US-002 — Tự động gửi Email mời thanh toán kèm Link & Mã QR PayOS
**Là một** người tham gia B,  
**tôi muốn** nhận email ngay khi A hoàn tất tạo hóa đơn,  
**để** xem chi tiết số tiền nợ và truy cập mã QR/Link thanh toán.

- **Acceptance Criteria**:
  - Khi Bill chuyển trạng thái `Published`, hệ thống tự động sinh `EmailJob` cho từng email người tham gia.
  - Email chứa thông tin hóa đơn, số tiền phân bổ, mã QR PayOS và link checkout PayOS.

---

## US-003 — Hiển thị mã QR PayOS theo trạng thái thanh toán (Conditional QR Visibility)
**Là một** người xem hóa đơn,  
**tôi muốn** chỉ nhìn thấy mã QR thanh toán khi tôi chưa trả tiền, và không thấy mã QR nữa khi đã trả xong,  
**để** tránh quét nhầm và thanh toán trùng lặp.

- **Acceptance Criteria**:
  - Khi `BillSplit.RemainingAmount > 0` (Trạng thái `Pending`, `AwaitingPayment`, `PartiallyPaid`, `Overdue`):
    - Tra cứu PayOS `PaymentOrder` tương ứng.
    - Trả về `paymentQrImageUrl` và `paymentUrl` để quét trả.
  - Khi `BillSplit.RemainingAmount == 0` (Trạng thái `Paid`):
    - `paymentQrImageUrl` trả về `null` (Ẩn hoàn toàn mã QR trên UI).
    - `paymentUrl` trả về `null` (Ẩn nút thanh toán).
    - Trả về danh sách chi tiết các lần thanh toán đã thực hiện (`Payments`).

---

## US-004 — Tự động thu tiền & Payout về tài khoản A khi B quét QR thành công
**Là** hệ thống Splitly,  
**tôi muốn** nhận Webhook thu tiền từ PayOS và tự động chi trả về tài khoản ngân hàng của A,  
**để** A nhận được tiền ngay lập tức mà không cần rút tiền thủ công.

- **Acceptance Criteria**:
  - Webhook PayOS thu tiền được xử lý trong **1 DB Transaction nguyên khối**: Mark `PaymentOrder = Collected`, `BillSplit.RecordPayment()`, `bill.RefreshPaymentStatus()`, và chèn `OutboxMessage(InitiatePayout)`.
  - `PayoutOutboxWorker` tự động chi tiền về tài khoản ngân hàng A với `IdempotencyKey` an toàn, chống chuyển tiền 2 lần khi sập server.
