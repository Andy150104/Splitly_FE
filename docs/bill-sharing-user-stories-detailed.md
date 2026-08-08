# USER STORY BACKLOG  
## Hệ thống chia tiền hóa đơn và theo dõi thanh toán

---

## 1. Thông tin tài liệu

| Thuộc tính | Nội dung |
|---|---|
| Tên sản phẩm | Bill Sharing & Payment Tracking System |
| Phiên bản | 1.2 |
| Loại tài liệu | Product Backlog / User Story Specification |
| Đối tượng sử dụng | Product Owner, Business Analyst, Developer, Tester, UI/UX |
| Phạm vi | Quản lý tài khoản, nhóm, hóa đơn, chia tiền, email, thanh toán và theo dõi trạng thái |
| Cập nhật | Thay passwordless OTP bằng Google Identity Services; backend xác minh Google ID token và phát hành session nội bộ |

---

## 2. Mục tiêu sản phẩm

Hệ thống cho phép một người tạo hóa đơn, chọn những người cần chia tiền, tự động tính số tiền từng người phải trả, gửi yêu cầu thanh toán qua email, theo dõi trạng thái thanh toán và hỗ trợ thanh toán trực tuyến hoặc xác nhận thanh toán thủ công.

Hệ thống hỗ trợ hai luồng chính:

1. Tạo hóa đơn và nhập trực tiếp email của từng người.
2. Tạo nhóm trước, thêm thành viên vào nhóm, sau đó chọn thành viên cần chia khi tạo hóa đơn.

Người chưa có tài khoản vẫn có thể được thêm vào hóa đơn. Hệ thống tạo tài khoản ở trạng thái chờ kích hoạt và liên kết tài khoản khi người đó đăng nhập thành công bằng Google.

---

## 3. Vai trò người dùng

### 3.1. Bill Owner

Người tạo và quản lý hóa đơn.

Có thể:

- Tạo, chỉnh sửa, công bố hoặc hủy hóa đơn.
- Chọn người tham gia chia tiền.
- Chọn phương thức chia tiền.
- Theo dõi trạng thái thanh toán.
- Gửi email nhắc thanh toán.
- Xác nhận thanh toán thủ công.

### 3.2. Bill Member

Người được thêm vào hóa đơn và có nghĩa vụ thanh toán.

Có thể:

- Nhận email thông báo.
- Đăng nhập bằng Google.
- Xem hóa đơn liên quan.
- Xem số tiền cần thanh toán.
- Thanh toán trực tuyến.
- Xem lịch sử thanh toán.

### 3.3. Group Owner

Người tạo và quản lý nhóm.

Có thể:

- Tạo nhóm.
- Thêm hoặc xóa thành viên.
- Tạo hóa đơn từ nhóm.
- Chọn một phần thành viên trong nhóm để chia tiền.

### 3.4. Administrator

Người vận hành hệ thống.

Có thể:

- Quản lý người dùng.
- Kiểm tra hóa đơn và giao dịch.
- Theo dõi email gửi thất bại.
- Kiểm tra audit log.
- Xử lý các trường hợp lỗi vận hành.

---

## 3.5. Ma trận phân quyền backend

| Hành động | User | Bill Owner | Bill Member | Group Owner | Administrator |
|---|---:|---:|---:|---:|---:|
| Xem/sửa hồ sơ của chính mình | Có | Có | Có | Có | Có |
| Tạo nhóm hoặc hóa đơn | Có | Có | Có | Có | Có |
| Quản lý thành viên nhóm | Không | Không | Không | Có | Qua API quản trị riêng |
| Sửa, công bố, hủy hóa đơn | Không | Có | Không | Không | Qua API quản trị riêng |
| Xem hóa đơn | Không | Toàn bộ hóa đơn sở hữu | Chỉ phần liên quan | Không mặc định | Qua API quản trị riêng |
| Xác nhận thanh toán thủ công | Không | Có | Không | Không | Qua use case có audit |
| Tra cứu và thay đổi quyền user | Không | Không | Không | Không | Có |

Quyền hệ thống được lưu bằng `MemberRole` gồm `User` và `Administrator`. Quyền Bill Owner,
Bill Member và Group Owner là quyền theo tài nguyên, phải được kiểm tra lại trong từng use case.
Không được chỉ dựa vào việc frontend ẩn nút. Middleware phải nạp trạng thái và role mới nhất;
tài khoản `Blocked` hoặc `Deleted` không được tiếp tục dùng session còn hạn.

Administrator đầu tiên chỉ được bootstrap từ danh sách email cấu hình ngoài source code. Sau đó,
việc đổi role hoặc khóa/mở khóa user phải đi qua API Administrator, chống tự khóa/tự hạ quyền và có audit log.

---

# EPIC 1 — Xác thực và quản lý tài khoản

---

## US-AUTH-001 — Đăng nhập bằng Google

### User Story

**Là một** người dùng,  
**tôi muốn** đăng nhập bằng tài khoản Google,  
**để** truy cập hệ thống mà không cần quản lý mật khẩu riêng.

### Mô tả chi tiết

Frontend sử dụng Google Identity Services để nhận Google ID token và gửi token đó đến backend qua HTTPS.
Backend không tin email hoặc Google User ID do client tự khai báo. Backend phải xác minh chữ ký, issuer,
thời hạn và audience của ID token bằng Google Auth Library trước khi tạo phiên nội bộ.

### Điều kiện trước

- Google OAuth Web Client đã được cấu hình.
- Frontend gửi ID token do Google Identity Services cấp.
- Backend có cấu hình đúng Google Client ID dùng làm trusted audience.

### Luồng nghiệp vụ chính

1. Người dùng chọn `Đăng nhập bằng Google`.
2. Frontend nhận Google ID token và gửi đến `POST /api/auth/google`.
3. Backend xác minh chữ ký, issuer, expiry, audience và trạng thái email verified.
4. Backend tìm tài khoản theo Google `sub`, sau đó mới đối chiếu normalized email để liên kết tài khoản Pending.
5. Backend tạo access token, refresh token và session nội bộ.

### Acceptance Criteria

- ID token hợp lệ và email đã xác minh tạo phiên đăng nhập thành công.
- ID token sai chữ ký, hết hạn, sai issuer hoặc sai audience bị từ chối.
- Backend không nhận Google User ID hoặc email thuần làm bằng chứng đăng nhập.
- Tài khoản Pending cùng email được kích hoạt và liên kết với Google `sub`.
- Cùng một Google `sub` chỉ liên kết với một tài khoản.
- Tài khoản đã liên kết với Google `sub` khác không được tự động ghi đè.
- Tài khoản Blocked hoặc Deleted không được đăng nhập.
- Endpoint được rate limit theo IP.

### Business Rules

- Google `sub` là định danh liên kết ổn định; email vẫn được chuẩn hóa và unique.
- Chỉ chấp nhận email có claim `email_verified = true`.
- Google Client ID phải lấy từ configuration/secret, không commit client secret.
- ID token chỉ dùng để xác thực với backend; hệ thống vẫn phát hành session token nội bộ.
- Không ghi ID token, access token hoặc refresh token vào log.

---

## US-AUTH-002 — Làm mới phiên đăng nhập Google

### User Story

**Là một** người dùng đã đăng nhập bằng Google,  
**tôi muốn** làm mới phiên nội bộ,  
**để** tiếp tục sử dụng hệ thống mà không phải gửi lại Google ID token liên tục.

### Luồng nghiệp vụ chính

1. Client gửi refresh token nội bộ đến `POST /api/auth/refresh`.
2. Backend kiểm tra token hash, expiry và trạng thái thu hồi.
3. Backend xoay vòng cả access token và refresh token.
4. Refresh token cũ không còn hợp lệ.

### Acceptance Criteria

- Refresh token hợp lệ phát hành một cặp token mới.
- Refresh token hết hạn, đã thu hồi hoặc không tồn tại bị từ chối.
- Token được lưu dưới dạng hash.
- Logout thu hồi session và ngăn refresh tiếp theo.

---


## US-AUTH-003 — Tự động tạo tài khoản khi email chưa tồn tại

### User Story

**Là một** Bill Owner,  
**tôi muốn** hệ thống tự động tạo tài khoản cho email chưa tồn tại,  
**để** tôi vẫn có thể thêm người đó vào hóa đơn.


### Mô tả chi tiết

Chức năng bảo đảm Bill Owner có thể thêm bất kỳ người nào bằng email mà không cần yêu cầu họ đăng ký trước. Hệ thống tái sử dụng tài khoản hiện có hoặc tạo tài khoản Pending khi email chưa từng xuất hiện.

### Điều kiện trước

- Bill Owner đang thêm thành viên vào hóa đơn hoặc nhóm.
- Email thành viên đã được chuẩn hóa và hợp lệ.

### Luồng nghiệp vụ chính

1. Hệ thống tìm tài khoản theo normalized email.
2. Nếu tìm thấy, liên kết UserId hiện có.
3. Nếu không tìm thấy, tạo User trạng thái Pending.
4. Liên kết user với hóa đơn hoặc nhóm và chuẩn bị email mời.

### Kết quả mong đợi

- Mỗi email chỉ tương ứng một tài khoản.
- Thành viên được liên kết đúng mà không tạo dữ liệu trùng.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Email chưa tồn tại

**Given** Bill Owner thêm một email vào hóa đơn  
**And** email chưa tồn tại trong hệ thống  
**When** hóa đơn được lưu hoặc công bố  
**Then** hệ thống tạo một tài khoản mới với trạng thái `Pending`  
**And** liên kết tài khoản đó với thành viên hóa đơn  
**And** gửi email mời tham gia.

#### AC2 — Email đã tồn tại

**Given** Bill Owner thêm một email đã tồn tại  
**When** hệ thống xử lý thành viên hóa đơn  
**Then** hệ thống liên kết tài khoản hiện có  
**And** không tạo tài khoản mới.

#### AC3 — Email khác chữ hoa/thường

**Given** hệ thống đã có tài khoản `user@example.com`  
**When** Bill Owner nhập `User@Example.com`  
**Then** hệ thống xác định đây là cùng một email  
**And** không tạo bản ghi trùng.

### Business Rules

- Email là duy nhất trên toàn hệ thống.
- Email phải được trim và chuẩn hóa về chữ thường trước khi so sánh.
- Không được tạo nhiều user cho cùng một địa chỉ email.
- Tài khoản `Pending` chưa cần có tên hiển thị đầy đủ.

---

## US-AUTH-004 — Đăng xuất khỏi hệ thống

### User Story

**Là một** người dùng đã đăng nhập,  
**tôi muốn** đăng xuất,  
**để** kết thúc phiên sử dụng một cách an toàn.


### Mô tả chi tiết

Chức năng đăng xuất kết thúc phiên hiện tại trên cả client và server. Việc chỉ xóa token ở giao diện là chưa đủ; refresh token hoặc session phía server cũng phải bị vô hiệu hóa.

### Điều kiện trước

- Người dùng đang có phiên đăng nhập hợp lệ.

### Luồng nghiệp vụ chính

1. Người dùng chọn đăng xuất.
2. Client gửi yêu cầu thu hồi phiên hoặc refresh token.
3. Server vô hiệu hóa phiên hiện tại.
4. Client xóa token và dữ liệu phiên rồi chuyển về trang đăng nhập.

### Kết quả mong đợi

- Phiên hiện tại không thể tiếp tục dùng để cấp access token mới.

### Priority

Must Have

### Acceptance Criteria

**Given** người dùng đang đăng nhập  
**When** người dùng chọn `Đăng xuất`  
**Then** hệ thống thu hồi hoặc vô hiệu hóa refresh token hiện tại  
**And** xóa thông tin phiên phía client  
**And** chuyển về màn hình đăng nhập.

---

# EPIC 2 — Quản lý nhóm

---

## US-GROUP-001 — Tạo nhóm mới

### User Story

**Là một** người dùng,  
**tôi muốn** tạo nhóm,  
**để** quản lý những người thường xuyên chia hóa đơn cùng nhau.


### Mô tả chi tiết

Nhóm đại diện cho tập hợp người thường xuyên chia chi phí với nhau, chẳng hạn nhóm YouTube, tiền nhà hoặc du lịch. Người tạo nhóm trở thành Owner và có quyền quản lý thành viên.

### Điều kiện trước

- Người dùng đã đăng nhập.

### Luồng nghiệp vụ chính

1. Người dùng mở chức năng tạo nhóm.
2. Nhập tên, mô tả và ảnh đại diện nếu có.
3. Hệ thống kiểm tra dữ liệu và tạo nhóm Active.
4. Hệ thống thêm người tạo vào GroupMember với vai trò Owner.

### Kết quả mong đợi

- Nhóm mới xuất hiện trong danh sách của người tạo.
- Nhóm sẵn sàng để thêm thành viên và tạo hóa đơn.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Tạo nhóm thành công

**Given** người dùng đã đăng nhập  
**When** nhập tên nhóm hợp lệ và chọn `Tạo nhóm`  
**Then** hệ thống tạo nhóm mới  
**And** gán người tạo làm `Owner`  
**And** nhóm có trạng thái `Active`.

#### AC2 — Thiếu tên nhóm

**Given** người dùng không nhập tên nhóm  
**When** gửi yêu cầu tạo nhóm  
**Then** hệ thống từ chối  
**And** hiển thị lỗi bắt buộc nhập tên.

### Data Requirements

- Name: bắt buộc, tối đa 150 ký tự.
- Description: không bắt buộc, tối đa 500 ký tự.
- AvatarUrl: không bắt buộc.
- Status: mặc định `Active`.

---

## US-GROUP-002 — Thêm thành viên vào nhóm bằng email

### User Story

**Là một** Group Owner,  
**tôi muốn** thêm thành viên bằng email,  
**để** sử dụng họ trong các hóa đơn tương lai.


### Mô tả chi tiết

Group Owner thêm thành viên bằng email để tái sử dụng danh sách này cho nhiều hóa đơn. Thành viên chưa có tài khoản vẫn được tạo ở trạng thái Pending và nhận lời mời qua email.

### Điều kiện trước

- Nhóm đang Active.
- Người thao tác là Group Owner.
- Email được nhập hợp lệ.

### Luồng nghiệp vụ chính

1. Owner nhập một hoặc nhiều email.
2. Hệ thống chuẩn hóa, loại email trùng và tìm user tương ứng.
3. Hệ thống tạo user Pending nếu cần rồi tạo GroupMember.
4. Email mời được xếp hàng gửi cho thành viên mới.

### Kết quả mong đợi

- Thành viên xuất hiện trong nhóm với trạng thái phù hợp.
- Không có thành viên trùng trong cùng nhóm.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Thêm người đã có tài khoản

**Given** Group Owner nhập email đã tồn tại  
**When** xác nhận thêm thành viên  
**Then** hệ thống thêm user hiện tại vào nhóm  
**And** gán vai trò `Member`.

#### AC2 — Thêm người chưa có tài khoản

**Given** Group Owner nhập email chưa tồn tại  
**When** xác nhận thêm thành viên  
**Then** hệ thống tạo user `Pending`  
**And** thêm user vào nhóm  
**And** gửi email mời.

#### AC3 — Thành viên đã có trong nhóm

**Given** email đã là thành viên đang hoạt động của nhóm  
**When** Group Owner thêm lại email đó  
**Then** hệ thống từ chối  
**And** hiển thị thông báo thành viên đã tồn tại.

#### AC4 — Không đủ quyền

**Given** người dùng không phải Group Owner  
**When** cố thêm thành viên  
**Then** hệ thống trả về lỗi không có quyền.

### Business Rules

- Một user chỉ xuất hiện một lần trong một nhóm ở trạng thái hoạt động.
- Thành viên mặc định có trạng thái `Pending` nếu chưa từng xác thực email.
- Thành viên chuyển sang `Active` sau khi xác thực thành công.

---

## US-GROUP-003 — Xem danh sách nhóm

### User Story

**Là một** người dùng,  
**tôi muốn** xem các nhóm mình sở hữu hoặc tham gia,  
**để** truy cập và quản lý nhóm phù hợp.


### Mô tả chi tiết

Danh sách nhóm giúp người dùng phân biệt nhóm mình sở hữu và nhóm mình chỉ tham gia. Dữ liệu phải được giới hạn theo quyền của người đang đăng nhập và hỗ trợ phân trang khi số lượng lớn.

### Điều kiện trước

- Người dùng đã đăng nhập.

### Luồng nghiệp vụ chính

1. Người dùng mở trang Nhóm.
2. Hệ thống lấy các GroupMember liên quan đến user.
3. Áp dụng bộ lọc, sắp xếp và phân trang.
4. Trả về thông tin tóm tắt của từng nhóm.

### Kết quả mong đợi

- Người dùng chỉ nhìn thấy các nhóm có liên quan đến mình.

### Priority

Must Have

### Acceptance Criteria

**Given** người dùng đã đăng nhập  
**When** mở trang danh sách nhóm  
**Then** hệ thống hiển thị các nhóm mà người dùng là Owner hoặc Member  
**And** không hiển thị nhóm không liên quan  
**And** hỗ trợ phân trang.

### Display Information

- Tên nhóm.
- Vai trò của người dùng.
- Số thành viên.
- Số hóa đơn liên quan.
- Trạng thái nhóm.
- Ngày cập nhật gần nhất.

---

## US-GROUP-004 — Xem chi tiết nhóm

### User Story

**Là một** thành viên nhóm,  
**tôi muốn** xem thông tin chi tiết nhóm,  
**để** biết thành viên và các hóa đơn liên quan.


### Mô tả chi tiết

Trang chi tiết nhóm cung cấp thông tin chung, danh sách thành viên và các hóa đơn liên quan. Quyền thao tác quản trị chỉ hiển thị cho Owner, trong khi Member chỉ có quyền xem những dữ liệu được phép.

### Điều kiện trước

- Người dùng là Owner hoặc Member của nhóm.

### Luồng nghiệp vụ chính

1. Người dùng chọn một nhóm.
2. Hệ thống kiểm tra tư cách thành viên.
3. Tải thông tin nhóm, thành viên và hóa đơn phù hợp quyền.
4. Hiển thị các hành động tương ứng với vai trò.

### Kết quả mong đợi

- Thông tin nhóm được hiển thị đúng quyền, không làm lộ dữ liệu ngoài phạm vi.

### Priority

Must Have

### Acceptance Criteria

**Given** người dùng thuộc nhóm  
**When** mở chi tiết nhóm  
**Then** hệ thống hiển thị thông tin nhóm  
**And** danh sách thành viên  
**And** danh sách hóa đơn của nhóm mà người dùng được phép xem.

---

## US-GROUP-005 — Xóa thành viên khỏi nhóm

### User Story

**Là một** Group Owner,  
**tôi muốn** xóa thành viên khỏi nhóm,  
**để** họ không còn được chọn cho các hóa đơn mới.


### Mô tả chi tiết

Xóa thành viên khỏi nhóm chỉ chấm dứt khả năng được chọn cho các hóa đơn mới. Các hóa đơn và giao dịch lịch sử vẫn phải giữ nguyên để bảo đảm tính toàn vẹn tài chính.

### Điều kiện trước

- Người thao tác là Group Owner.
- Thành viên mục tiêu đang thuộc nhóm.

### Luồng nghiệp vụ chính

1. Owner chọn thành viên và xác nhận xóa.
2. Hệ thống kiểm tra thành viên không phải Owner hiện tại.
3. Chuyển GroupMember sang Removed thay vì xóa vật lý.
4. Ẩn thành viên khỏi danh sách chọn cho hóa đơn mới.

### Kết quả mong đợi

- Thành viên không còn hoạt động trong nhóm.
- Dữ liệu hóa đơn cũ không bị ảnh hưởng.

### Priority

Should Have

### Acceptance Criteria

#### AC1 — Xóa thành viên thành công

**Given** thành viên đang hoạt động trong nhóm  
**When** Group Owner xác nhận xóa  
**Then** trạng thái thành viên được chuyển sang `Removed`  
**And** thành viên không còn xuất hiện trong danh sách chọn cho hóa đơn mới.

#### AC2 — Không ảnh hưởng hóa đơn cũ

**Given** thành viên đã tham gia hóa đơn trước đó  
**When** bị xóa khỏi nhóm  
**Then** dữ liệu thành viên trong hóa đơn cũ vẫn được giữ nguyên.

#### AC3 — Không tự xóa Owner

**Given** người được xóa là Group Owner hiện tại  
**When** thực hiện xóa  
**Then** hệ thống từ chối  
**And** yêu cầu chuyển quyền sở hữu trước.

---

## US-GROUP-006 — Đóng nhóm

### User Story

**Là một** Group Owner,  
**tôi muốn** đóng nhóm không còn sử dụng,  
**để** ngăn phát sinh hóa đơn mới từ nhóm đó.


### Mô tả chi tiết

Đóng nhóm được sử dụng khi nhóm không còn phát sinh chi phí nhưng lịch sử vẫn cần được tra cứu. Đây là thao tác vô hiệu hóa mềm, không xóa thành viên hay hóa đơn đã tồn tại.

### Điều kiện trước

- Người thao tác là Group Owner.
- Nhóm đang Active.

### Luồng nghiệp vụ chính

1. Owner chọn đóng nhóm và xác nhận.
2. Hệ thống kiểm tra quyền và các điều kiện liên quan.
3. Chuyển trạng thái nhóm thành Closed.
4. Ngăn tạo hóa đơn mới từ nhóm.

### Kết quả mong đợi

- Nhóm chỉ còn dùng để tra cứu lịch sử.

### Priority

Could Have

### Acceptance Criteria

**Given** nhóm đang hoạt động  
**When** Group Owner xác nhận đóng nhóm  
**Then** nhóm chuyển sang trạng thái `Closed`  
**And** không thể tạo hóa đơn mới từ nhóm  
**And** lịch sử nhóm và hóa đơn cũ vẫn được giữ.

---

# EPIC 3 — Tạo và quản lý hóa đơn

---

## US-BILL-001 — Tạo hóa đơn nháp

### User Story

**Là một** Bill Owner,  
**tôi muốn** tạo hóa đơn nháp,  
**để** có thể nhập và kiểm tra thông tin trước khi gửi cho mọi người.


### Mô tả chi tiết

Hóa đơn nháp cho phép Bill Owner nhập dần thông tin trước khi gửi yêu cầu thanh toán. Ở trạng thái Draft, chưa có email nào được gửi và Owner có thể sửa toàn bộ dữ liệu.

### Điều kiện trước

- Người dùng đã đăng nhập.

### Luồng nghiệp vụ chính

1. Người dùng nhập tên hóa đơn, tổng tiền, tiền tệ và thông tin tùy chọn.
2. Hệ thống kiểm tra dữ liệu bắt buộc.
3. Tạo Bill với trạng thái Draft và gán OwnerId.
4. Trả về Bill ID để tiếp tục thêm thành viên và cấu hình chia tiền.

### Kết quả mong đợi

- Hóa đơn nháp được lưu nhưng chưa phát sinh nghĩa vụ thanh toán.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Tạo hóa đơn hợp lệ

**Given** người dùng đã đăng nhập  
**When** nhập đầy đủ thông tin bắt buộc  
**Then** hệ thống tạo hóa đơn ở trạng thái `Draft`  
**And** gán người tạo là Bill Owner.

#### AC2 — Tổng tiền không hợp lệ

**Given** tổng tiền bằng 0 hoặc nhỏ hơn 0  
**When** tạo hóa đơn  
**Then** hệ thống từ chối  
**And** hiển thị lỗi tổng tiền phải lớn hơn 0.

#### AC3 — Ngày đến hạn không hợp lệ

**Given** ngày đến hạn nhỏ hơn ngày tạo hoặc ngày phát sinh  
**When** tạo hóa đơn  
**Then** hệ thống cảnh báo hoặc từ chối theo cấu hình nghiệp vụ.

### Data Requirements

- Bill Name: bắt buộc, tối đa 200 ký tự.
- Total Amount: bắt buộc, lớn hơn 0.
- Currency: mặc định `VND`.
- Bill Date: không bắt buộc.
- Due Date: không bắt buộc.
- Description: không bắt buộc.
- GroupId: không bắt buộc.
- Attachment: không bắt buộc.
- Status: mặc định `Draft`.

---

## US-BILL-002 — Thêm thành viên trực tiếp bằng email

### User Story

**Là một** Bill Owner,  
**tôi muốn** nhập email từng người vào hóa đơn,  
**để** chia tiền mà không cần tạo nhóm trước.


### Mô tả chi tiết

Luồng này phù hợp khi Bill Owner không muốn tạo nhóm trước. Owner nhập trực tiếp email của từng người, hệ thống kiểm tra user, tạo tài khoản Pending nếu cần và thêm Bill Member.

### Điều kiện trước

- Hóa đơn thuộc quyền Owner.
- Hóa đơn đang ở trạng thái cho phép chỉnh sửa.

### Luồng nghiệp vụ chính

1. Owner nhập danh sách email.
2. Hệ thống chuẩn hóa và kiểm tra định dạng, trùng lặp.
3. Tìm hoặc tạo user tương ứng.
4. Tạo BillMember và giữ EmailSnapshot tại thời điểm thêm.

### Kết quả mong đợi

- Danh sách người tham gia hóa đơn được cập nhật chính xác.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Thêm danh sách email hợp lệ

**Given** hóa đơn đang ở trạng thái `Draft`  
**When** Bill Owner nhập các email hợp lệ  
**Then** hệ thống thêm các thành viên vào hóa đơn  
**And** kiểm tra tài khoản theo từng email.

#### AC2 — Email bị trùng trong cùng hóa đơn

**Given** một email đã được thêm vào hóa đơn  
**When** Bill Owner thêm lại email đó  
**Then** hệ thống từ chối  
**And** không tạo Bill Member trùng.

#### AC3 — Email không hợp lệ

**Given** một hoặc nhiều email sai định dạng  
**When** lưu danh sách thành viên  
**Then** hệ thống chỉ rõ email không hợp lệ  
**And** không công bố hóa đơn cho đến khi lỗi được sửa.

### Business Rules

- Một thành viên chỉ xuất hiện một lần trong cùng hóa đơn.
- So sánh email không phân biệt chữ hoa và chữ thường.
- Hóa đơn phải có ít nhất một Bill Member trước khi công bố.

---

## US-BILL-003 — Chọn thành viên từ nhóm

### User Story

**Là một** Bill Owner,  
**tôi muốn** chọn thành viên từ nhóm,  
**để** tạo hóa đơn nhanh hơn.


### Mô tả chi tiết

Thay vì nhập lại email, Bill Owner có thể lấy danh sách từ một nhóm đã có. Owner được phép chọn một phần thành viên; việc thuộc nhóm không đồng nghĩa tự động tham gia mọi hóa đơn của nhóm.

### Điều kiện trước

- Owner có quyền truy cập nhóm.
- Nhóm chưa bị đóng.
- Hóa đơn đang chỉnh sửa được.

### Luồng nghiệp vụ chính

1. Owner chọn nhóm.
2. Hệ thống tải các thành viên có thể chọn.
3. Owner đánh dấu người tham gia hóa đơn.
4. Hệ thống tạo BillMember cho các lựa chọn chưa tồn tại.

### Kết quả mong đợi

- Chỉ thành viên được chọn mới có nghĩa vụ trong hóa đơn.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Hiển thị thành viên nhóm

**Given** Bill Owner chọn một nhóm mình có quyền sử dụng  
**When** mở danh sách thành viên  
**Then** hệ thống hiển thị các thành viên đang hoạt động hoặc đang chờ kích hoạt.

#### AC2 — Chọn một phần thành viên

**Given** nhóm có nhiều thành viên  
**When** Bill Owner chọn một số người  
**Then** chỉ những người được chọn được thêm vào hóa đơn.

#### AC3 — Thành viên bị xóa khỏi nhóm

**Given** một thành viên có trạng thái `Removed`  
**When** Bill Owner chọn thành viên cho hóa đơn mới  
**Then** thành viên đó không xuất hiện trong danh sách chọn.

---

## US-BILL-004 — Người tạo tham gia hoặc không tham gia chia tiền

### User Story

**Là một** Bill Owner,  
**tôi muốn** chọn bản thân có tham gia chia tiền hay không,  
**để** số tiền được tính đúng với tình huống thực tế.


### Mô tả chi tiết

Bill Owner có thể là người đã trả trước toàn bộ nhưng không phải chịu một phần chi phí, hoặc cũng là một thành viên chia tiền. Tùy chọn này quyết định Owner có được đưa vào phép tính hay không.

### Điều kiện trước

- Hóa đơn đang Draft hoặc chưa có thanh toán.
- Owner chưa xuất hiện trùng trong danh sách BillMember.

### Luồng nghiệp vụ chính

1. Owner bật hoặc tắt tùy chọn tham gia.
2. Hệ thống thêm hoặc loại BillMember tương ứng của Owner.
3. Tính lại số tiền nếu phương thức chia phụ thuộc số người.
4. Hiển thị kết quả mới để Owner xác nhận.

### Kết quả mong đợi

- Số người chia và phần tiền của Owner phản ánh đúng lựa chọn.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Owner tham gia

**Given** Bill Owner bật tùy chọn `Tôi cũng tham gia chia tiền`  
**When** hệ thống tính toán  
**Then** Bill Owner được tính là một thành viên của hóa đơn.

#### AC2 — Owner không tham gia

**Given** Bill Owner tắt tùy chọn trên  
**When** hệ thống tính toán  
**Then** Bill Owner không có phần tiền phải trả.

### Business Rules

- Owner không được xuất hiện hai lần nếu email đã có trong danh sách thành viên.
- Cần phân biệt `Bill Owner` và `Bill Member`.

---

## US-BILL-005 — Chỉnh sửa hóa đơn nháp

### User Story

**Là một** Bill Owner,  
**tôi muốn** chỉnh sửa hóa đơn nháp,  
**để** hoàn thiện thông tin trước khi gửi.


### Mô tả chi tiết

Khi hóa đơn còn Draft, Owner được chỉnh sửa tự do vì chưa gửi yêu cầu thanh toán. Mọi thay đổi ảnh hưởng đến tổng tiền, thành viên hoặc cách chia phải kích hoạt tính toán lại.

### Điều kiện trước

- Người dùng là Bill Owner.
- Bill có trạng thái Draft.

### Luồng nghiệp vụ chính

1. Owner mở hóa đơn và thay đổi dữ liệu.
2. Hệ thống validate trường được cập nhật.
3. Tính lại phần tiền khi cần.
4. Lưu thay đổi cùng UpdatedAt.

### Kết quả mong đợi

- Bản nháp mới nhất được lưu và vẫn chưa gửi cho thành viên.

### Priority

Must Have

### Acceptance Criteria

**Given** hóa đơn có trạng thái `Draft`  
**When** Bill Owner thay đổi thông tin  
**Then** hệ thống cho phép cập nhật tên, tổng tiền, thành viên, cách chia, hạn thanh toán và mô tả  
**And** tính toán lại số tiền nếu dữ liệu liên quan thay đổi.

---

## US-BILL-006 — Công bố hóa đơn

### User Story

**Là một** Bill Owner,  
**tôi muốn** công bố hóa đơn,  
**để** gửi yêu cầu thanh toán đến các thành viên.


### Mô tả chi tiết

Công bố là bước biến hóa đơn nháp thành yêu cầu thanh toán chính thức. Trước khi chuyển trạng thái, hệ thống phải bảo đảm dữ liệu đầy đủ, tổng tiền chia khớp và không có thành viên trùng.

### Điều kiện trước

- Người dùng là Bill Owner.
- Bill đang Draft.
- Có ít nhất một BillMember.
- Kết quả chia tiền hợp lệ.

### Luồng nghiệp vụ chính

1. Owner xem lại và chọn công bố.
2. Hệ thống chạy toàn bộ validation nghiệp vụ.
3. Chuyển Bill sang Published và ghi PublishedAt.
4. Tạo email job riêng cho từng thành viên.

### Kết quả mong đợi

- Thành viên bắt đầu có nghĩa vụ thanh toán.
- Hóa đơn được theo dõi trạng thái và không còn chỉnh sửa tự do.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Công bố thành công

**Given** hóa đơn hợp lệ  
**And** có ít nhất một thành viên  
**And** tổng số tiền đã chia bằng tổng tiền cần thu  
**When** Bill Owner chọn `Gửi yêu cầu thanh toán`  
**Then** hóa đơn chuyển từ `Draft` sang `Published`  
**And** hệ thống tạo yêu cầu gửi email cho từng thành viên  
**And** ghi nhận thời gian công bố.

#### AC2 — Tổng tiền chia không khớp

**Given** tổng Assigned Amount khác tổng số tiền cần thu  
**When** Bill Owner công bố hóa đơn  
**Then** hệ thống từ chối  
**And** hiển thị phần chênh lệch.

#### AC3 — Không có thành viên

**Given** hóa đơn chưa có thành viên  
**When** công bố  
**Then** hệ thống từ chối.

### Business Rules

- Sau khi công bố, việc chỉnh sửa bị giới hạn.
- Email được gửi bất đồng bộ.
- Một lỗi gửi email không được rollback toàn bộ hóa đơn đã công bố.

---

## US-BILL-007 — Xem danh sách hóa đơn đã tạo

### User Story

**Là một** Bill Owner,  
**tôi muốn** xem các hóa đơn mình đã tạo,  
**để** quản lý và theo dõi việc thu tiền.


### Mô tả chi tiết

Danh sách này phục vụ Bill Owner quản lý các hóa đơn mình tạo, theo dõi tiến độ thu tiền và nhanh chóng tìm hóa đơn cần xử lý.

### Điều kiện trước

- Người dùng đã đăng nhập.

### Luồng nghiệp vụ chính

1. Người dùng mở mục Hóa đơn đã tạo.
2. Hệ thống lọc Bill theo OwnerId.
3. Áp dụng từ khóa, trạng thái, nhóm, thời gian và phân trang.
4. Trả về số tiền đã thu, còn thiếu và trạng thái tổng quan.

### Kết quả mong đợi

- Owner có cái nhìn tập trung về toàn bộ hóa đơn do mình quản lý.

### Priority

Must Have

### Acceptance Criteria

**Given** người dùng đã đăng nhập  
**When** mở danh sách `Hóa đơn đã tạo`  
**Then** hệ thống hiển thị hóa đơn do người đó sở hữu  
**And** hỗ trợ lọc theo trạng thái, thời gian, nhóm và từ khóa  
**And** hỗ trợ phân trang.

---

## US-BILL-008 — Xem hóa đơn cần thanh toán

### User Story

**Là một** Bill Member,  
**tôi muốn** xem các hóa đơn mình cần thanh toán,  
**để** biết nghĩa vụ hiện tại.


### Mô tả chi tiết

Danh sách Cần thanh toán chỉ hiển thị các hóa đơn mà người dùng là Bill Member. Mục tiêu là giúp người dùng biết khoản nào chưa trả, đã quá hạn hoặc đang xử lý.

### Điều kiện trước

- Người dùng đã đăng nhập và được liên kết với BillMember.

### Luồng nghiệp vụ chính

1. Người dùng mở mục Cần thanh toán.
2. Hệ thống tìm BillMember theo UserId.
3. Tải hóa đơn liên quan và tính RemainingAmount.
4. Sắp xếp ưu tiên hóa đơn quá hạn hoặc gần đến hạn.

### Kết quả mong đợi

- Người dùng thấy chính xác các nghĩa vụ thanh toán của mình.

### Priority

Must Have

### Acceptance Criteria

**Given** người dùng đã đăng nhập  
**When** mở danh sách `Cần thanh toán`  
**Then** hệ thống hiển thị các hóa đơn người dùng là Bill Member  
**And** hiển thị số tiền còn thiếu  
**And** trạng thái thanh toán  
**And** hạn thanh toán.

---

## US-BILL-009 — Xem chi tiết hóa đơn

### User Story

**Là một** người liên quan đến hóa đơn,  
**tôi muốn** xem chi tiết hóa đơn,  
**để** hiểu số tiền và trạng thái thanh toán.


### Mô tả chi tiết

Trang chi tiết là nguồn thông tin chính cho cả Owner và Member nhưng nội dung hiển thị khác nhau theo vai trò. Owner cần xem toàn bộ tiến độ, còn Member chủ yếu xem phần tiền và giao dịch của mình.

### Điều kiện trước

- Người dùng đã đăng nhập.
- Người dùng là Owner hoặc BillMember của hóa đơn.

### Luồng nghiệp vụ chính

1. Người dùng truy cập Bill ID hoặc link trong email.
2. Hệ thống xác thực và kiểm tra quyền.
3. Tải thông tin hóa đơn, phần tiền và giao dịch được phép.
4. Hiển thị hành động phù hợp như thanh toán, nhắc hoặc xác nhận thủ công.

### Kết quả mong đợi

- Thông tin được hiển thị đúng vai trò và bảo vệ dữ liệu tài chính.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Bill Owner xem chi tiết

**Given** người dùng là Bill Owner  
**When** mở hóa đơn  
**Then** được xem toàn bộ danh sách thành viên và trạng thái thanh toán.

#### AC2 — Bill Member xem chi tiết

**Given** người dùng là Bill Member  
**When** mở hóa đơn  
**Then** được xem thông tin hóa đơn  
**And** phần tiền của mình  
**And** trạng thái của mình  
**And** không được xem thông tin nhạy cảm không cần thiết của thành viên khác.

#### AC3 — Người không liên quan

**Given** người dùng không phải Owner hoặc Member  
**When** truy cập hóa đơn  
**Then** hệ thống trả về `403 Forbidden` hoặc `404 Not Found`.

---

## US-BILL-010 — Hủy hóa đơn

### User Story

**Là một** Bill Owner,  
**tôi muốn** hủy hóa đơn không còn hiệu lực,  
**để** các thành viên không tiếp tục thanh toán.


### Mô tả chi tiết

Hủy hóa đơn dừng việc thu tiền nhưng không xóa lịch sử. Nếu đã có giao dịch thành công, hệ thống phải yêu cầu xử lý điều chỉnh hoặc hoàn tiền thay vì âm thầm hủy dữ liệu.

### Điều kiện trước

- Người dùng là Bill Owner.
- Bill chưa ở trạng thái Cancelled hoặc Paid hoàn tất.

### Luồng nghiệp vụ chính

1. Owner nhập lý do và xác nhận hủy.
2. Hệ thống kiểm tra các giao dịch đã thành công.
3. Nếu đủ điều kiện, chuyển Bill sang Cancelled và khóa thanh toán mới.
4. Thông báo cho thành viên bị ảnh hưởng và ghi audit log.

### Kết quả mong đợi

- Hóa đơn không nhận thêm thanh toán nhưng lịch sử vẫn được bảo toàn.

### Priority

Should Have

### Acceptance Criteria

#### AC1 — Hóa đơn chưa có thanh toán

**Given** chưa có giao dịch thành công  
**When** Bill Owner xác nhận hủy  
**Then** hóa đơn chuyển sang `Cancelled`  
**And** các thành viên không thể thanh toán.

#### AC2 — Hóa đơn đã có thanh toán

**Given** đã có ít nhất một giao dịch thành công  
**When** Bill Owner yêu cầu hủy  
**Then** hệ thống cảnh báo cần xử lý điều chỉnh hoặc hoàn tiền  
**And** không tự động xóa giao dịch.

#### AC3 — Lưu lịch sử

**When** hóa đơn bị hủy  
**Then** hệ thống lưu người thực hiện, thời gian và lý do hủy.

---

# EPIC 4 — Tính toán và chia tiền

---

## US-SPLIT-001 — Chia đều hóa đơn

### User Story

**Là một** Bill Owner,  
**tôi muốn** chia đều tổng tiền cho các thành viên,  
**để** không phải tự tính thủ công.


### Mô tả chi tiết

Chia đều lấy tổng tiền cần thu chia cho số thành viên tham gia. Khi không chia hết, hệ thống phân bổ phần dư theo quy tắc ổn định để tổng phần tiền luôn bằng chính xác tổng hóa đơn.

### Điều kiện trước

- Bill có tổng tiền lớn hơn 0.
- Có ít nhất một BillMember.

### Luồng nghiệp vụ chính

1. Xác định danh sách người được tính, bao gồm hoặc không bao gồm Owner.
2. Tính phần cơ bản theo đơn vị tiền nhỏ nhất.
3. Phân bổ phần dư cho các thành viên theo thứ tự xác định.
4. Lưu AssignedAmount và hiển thị kết quả.

### Kết quả mong đợi

- Mỗi người có phần tiền hợp lệ và tổng AssignedAmount khớp TotalAmount.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Chia đều chính xác

**Given** hóa đơn có tổng tiền 250.000 VND  
**And** có 5 người tham gia  
**When** chọn phương thức `Chia đều`  
**Then** mỗi người được gán 50.000 VND.

#### AC2 — Xử lý tiền lẻ

**Given** tổng tiền không chia hết cho số người  
**When** hệ thống chia đều  
**Then** phần dư được phân bổ cho một hoặc nhiều thành viên  
**And** tổng Assigned Amount luôn bằng chính xác Total Amount.

#### AC3 — Tính lại khi thay đổi thành viên

**Given** hóa đơn đang chia đều  
**When** thêm hoặc xóa thành viên  
**Then** hệ thống tính lại phần tiền của toàn bộ thành viên chưa thanh toán.

### Business Rules

- Không sử dụng số thực binary để lưu tiền.
- Sử dụng kiểu decimal hoặc đơn vị tiền nhỏ nhất.
- Quy tắc làm tròn phải nhất quán theo currency.
- Với VND, mặc định không dùng phần thập phân.

---

## US-SPLIT-002 — Chia theo số tiền tùy chỉnh

### User Story

**Là một** Bill Owner,  
**tôi muốn** nhập số tiền cụ thể cho từng người,  
**để** phản ánh mức sử dụng khác nhau.


### Mô tả chi tiết

Chia tùy chỉnh dùng khi mỗi thành viên phải trả số tiền khác nhau. Owner nhập trực tiếp số tiền, hệ thống chỉ chấp nhận khi tất cả giá trị hợp lệ và tổng cộng khớp số tiền cần thu.

### Điều kiện trước

- Hóa đơn có danh sách thành viên.
- Owner có quyền chỉnh sửa cách chia.

### Luồng nghiệp vụ chính

1. Owner nhập AssignedAmount cho từng người.
2. Hệ thống kiểm tra số âm, định dạng và currency precision.
3. Tính tổng các phần và so sánh với TotalAmount.
4. Lưu kết quả nếu không có chênh lệch.

### Kết quả mong đợi

- Phần tiền tùy chỉnh được lưu chính xác hoặc hệ thống chỉ rõ số dư/thiếu.

### Priority

Should Have

### Acceptance Criteria

#### AC1 — Tổng tiền hợp lệ

**Given** Bill Owner nhập số tiền cho từng thành viên  
**And** tổng các phần bằng tổng tiền cần thu  
**When** lưu cách chia  
**Then** hệ thống chấp nhận.

#### AC2 — Tổng tiền không khớp

**Given** tổng các phần khác tổng tiền cần thu  
**When** lưu  
**Then** hệ thống từ chối  
**And** hiển thị số tiền đang thiếu hoặc dư.

#### AC3 — Số tiền âm

**Given** một thành viên có Assigned Amount nhỏ hơn 0  
**When** lưu  
**Then** hệ thống từ chối.

---

## US-SPLIT-003 — Chia theo phần trăm

### User Story

**Là một** Bill Owner,  
**tôi muốn** chia hóa đơn theo tỷ lệ phần trăm,  
**để** áp dụng các mức đóng góp khác nhau.


### Mô tả chi tiết

Chia theo phần trăm cho phép mô tả mức đóng góp bằng tỷ lệ. Hệ thống chuyển phần trăm thành số tiền và xử lý sai số làm tròn mà không làm thay đổi tổng hóa đơn.

### Điều kiện trước

- Có ít nhất một BillMember.
- Tổng tiền hóa đơn đã xác định.

### Luồng nghiệp vụ chính

1. Owner nhập tỷ lệ cho từng thành viên.
2. Hệ thống xác nhận tổng tỷ lệ bằng 100%.
3. Tính AssignedAmount theo TotalAmount.
4. Phân bổ sai số làm tròn và lưu cả tỷ lệ lẫn số tiền.

### Kết quả mong đợi

- Mỗi thành viên có tỷ lệ và số tiền tương ứng, tổng tiền không sai lệch.

### Priority

Could Have

### Acceptance Criteria

#### AC1 — Tổng phần trăm bằng 100%

**Given** tổng tỷ lệ của các thành viên bằng 100%  
**When** lưu  
**Then** hệ thống tính số tiền tương ứng cho từng người.

#### AC2 — Tổng phần trăm khác 100%

**Given** tổng tỷ lệ khác 100%  
**When** lưu  
**Then** hệ thống từ chối  
**And** hiển thị phần chênh lệch.

#### AC3 — Sai số làm tròn

**Given** phép tính phần trăm tạo ra tiền lẻ  
**When** hệ thống làm tròn  
**Then** tổng tiền cuối cùng vẫn bằng Total Amount.

---

## US-SPLIT-004 — Xem trước kết quả chia tiền

### User Story

**Là một** Bill Owner,  
**tôi muốn** xem trước số tiền từng người phải trả,  
**để** kiểm tra trước khi công bố hóa đơn.


### Mô tả chi tiết

Xem trước giúp Owner phát hiện email trùng, người bị bỏ sót, tiền lẻ hoặc tổng phân bổ chưa khớp trước khi công bố. Đây là bước kiểm tra, chưa tạo nghĩa vụ thanh toán.

### Điều kiện trước

- Bill có tổng tiền và ít nhất một thành viên.
- Một SplitType đã được chọn.

### Luồng nghiệp vụ chính

1. Owner yêu cầu tính hoặc dữ liệu thay đổi.
2. Hệ thống chạy thuật toán chia tiền nhưng chưa công bố.
3. Hiển thị từng thành viên, phần tiền và tổng cộng.
4. Nêu rõ lỗi hoặc phần chênh lệch cần sửa.

### Kết quả mong đợi

- Owner có thể xác nhận kết quả trước khi gửi hóa đơn.

### Priority

Must Have

### Acceptance Criteria

**Given** hóa đơn có tổng tiền, thành viên và cách chia hợp lệ  
**When** hệ thống tính toán  
**Then** hiển thị danh sách email, tên, tỷ lệ hoặc Assigned Amount  
**And** hiển thị tổng đã phân bổ  
**And** hiển thị phần chênh lệch nếu có.

---

# EPIC 5 — Email và thông báo

---

## US-EMAIL-001 — Gửi email yêu cầu thanh toán

### User Story

**Là một** Bill Owner,  
**tôi muốn** hệ thống gửi email cho từng thành viên khi công bố hóa đơn,  
**để** họ biết số tiền cần thanh toán.


### Mô tả chi tiết

Khi hóa đơn được công bố, mỗi thành viên nhận một email cá nhân hóa chứa số tiền của riêng họ và đường link xem hóa đơn. Việc gửi phải chạy bất đồng bộ để không làm chậm thao tác công bố.

### Điều kiện trước

- Bill đã chuyển sang Published.
- BillMember có email hợp lệ.

### Luồng nghiệp vụ chính

1. Hệ thống tạo EmailJob cho từng BillMember.
2. Render template bằng dữ liệu hóa đơn và phần tiền cá nhân.
3. Email worker gửi thư và cập nhật EmailLog.
4. Retry theo chính sách nếu gặp lỗi tạm thời.

### Kết quả mong đợi

- Mỗi thành viên có một email riêng; trạng thái gửi có thể truy vết.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Nội dung email đầy đủ

**Given** hóa đơn được công bố  
**When** hệ thống gửi email  
**Then** email bao gồm:
- Tên hóa đơn.
- Người tạo.
- Số tiền người nhận phải trả.
- Hạn thanh toán.
- Nút hoặc đường link xem hóa đơn.
- Hướng dẫn đăng nhập bằng email.

#### AC2 — Email riêng từng người

**Given** hóa đơn có nhiều thành viên  
**When** gửi email  
**Then** mỗi người nhận một email riêng  
**And** không nhìn thấy email của thành viên khác.

#### AC3 — Ghi nhận trạng thái gửi

**When** email được xử lý  
**Then** hệ thống lưu trạng thái `Pending`, `Sent` hoặc `Failed`  
**And** lưu thời gian gửi  
**And** lưu lỗi nếu thất bại.

### Non-functional Requirements

- Email phải được gửi bằng background worker hoặc queue.
- Có retry với lỗi tạm thời.
- Không retry vô hạn.
- Email phải chứa URL có HTTPS.

---

## US-EMAIL-002 — Gửi email mời người chưa có tài khoản

### User Story

**Là một** người chưa từng sử dụng hệ thống,  
**tôi muốn** nhận email mời rõ ràng,  
**để** biết vì sao mình được thêm và cách đăng nhập.


### Mô tả chi tiết

Email mời giải thích rõ người nhận được ai thêm vào, thuộc nhóm hoặc hóa đơn nào và cách truy cập mà không cần mật khẩu. Link không nên tự đăng nhập mà dẫn đến luồng xác thực email an toàn.

### Điều kiện trước

- Người nhận có tài khoản Pending hoặc chưa từng xác thực.
- Có sự kiện thêm vào nhóm hoặc hóa đơn.

### Luồng nghiệp vụ chính

1. Hệ thống chọn template lời mời phù hợp.
2. Điền tên người mời, tên nhóm/hóa đơn và số tiền nếu có.
3. Gửi link đến trang đăng nhập bằng Google.
4. Lưu EmailLog.

### Kết quả mong đợi

- Người mới hiểu bối cảnh lời mời và có thể bắt đầu xác thực.

### Priority

Must Have

### Acceptance Criteria

**Given** email chưa có tài khoản Active  
**When** được thêm vào hóa đơn hoặc nhóm  
**Then** hệ thống gửi email mời  
**And** nêu tên người mời  
**And** tên hóa đơn hoặc nhóm  
**And** hướng dẫn chọn `Đăng nhập bằng Google`.

---

## US-EMAIL-003 — Gửi lại email nhắc thanh toán thủ công

### User Story

**Là một** Bill Owner,  
**tôi muốn** gửi nhắc cho những người chưa thanh toán,  
**để** tăng khả năng thu đủ tiền đúng hạn.


### Mô tả chi tiết

Owner có thể chủ động nhắc một hoặc nhiều người còn nợ. Hệ thống phải lọc lại trạng thái tại thời điểm gửi để tránh nhắc người vừa thanh toán xong.

### Điều kiện trước

- Bill đang Published, PartiallyPaid hoặc Overdue.
- Người thao tác là Bill Owner.

### Luồng nghiệp vụ chính

1. Owner chọn thành viên cần nhắc.
2. Hệ thống kiểm tra RemainingAmount mới nhất.
3. Loại người đã trả đủ và tạo EmailJob cho người còn nợ.
4. Ghi số lần nhắc và thời gian yêu cầu.

### Kết quả mong đợi

- Chỉ người còn nghĩa vụ thanh toán nhận email nhắc.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Chọn người chưa thanh toán

**Given** hóa đơn có thành viên chưa thanh toán  
**When** Bill Owner chọn một hoặc nhiều người và nhấn `Gửi nhắc`  
**Then** hệ thống tạo yêu cầu gửi email nhắc.

#### AC2 — Không gửi người đã trả đủ

**Given** một thành viên có trạng thái `Paid`  
**When** Bill Owner gửi nhắc hàng loạt  
**Then** hệ thống bỏ qua thành viên đó.

#### AC3 — Lưu lịch sử nhắc

**When** email nhắc được gửi  
**Then** hệ thống lưu thời gian, người yêu cầu và số lần đã nhắc.

---

## US-EMAIL-004 — Tự động nhắc trước và sau hạn

### User Story

**Là một** Bill Owner,  
**tôi muốn** hệ thống tự động nhắc người chưa thanh toán,  
**để** không phải gửi thủ công nhiều lần.


### Mô tả chi tiết

Background job tự động tìm các khoản sắp đến hạn hoặc đã quá hạn theo lịch cấu hình. Chức năng này giảm thao tác thủ công nhưng phải chống gửi lặp quá nhiều.

### Điều kiện trước

- Bill có DueDate.
- Tính năng nhắc tự động được bật.
- Bill chưa Cancelled hoặc Paid.

### Luồng nghiệp vụ chính

1. Scheduler chạy theo lịch.
2. Tìm BillMember còn RemainingAmount lớn hơn 0.
3. Kiểm tra mốc nhắc và lịch sử đã gửi.
4. Tạo email job rồi lưu ReminderLog.

### Kết quả mong đợi

- Thông báo được gửi đúng mốc, đúng đối tượng và không bị lặp ngoài chính sách.

### Priority

Could Have

### Acceptance Criteria

**Given** hóa đơn có Due Date  
**And** thành viên chưa thanh toán đủ  
**When** đến thời điểm nhắc được cấu hình  
**Then** hệ thống gửi email nhắc  
**And** không gửi cho người đã thanh toán  
**And** không gửi cho hóa đơn đã hủy.

### Suggested Reminder Schedule

- Trước hạn 3 ngày.
- Đúng ngày đến hạn.
- Sau hạn 3 ngày.

---

## US-EMAIL-005 — Gửi email xác nhận thanh toán

### User Story

**Là một** Bill Member,  
**tôi muốn** nhận email xác nhận sau khi thanh toán,  
**để** có bằng chứng giao dịch.


### Mô tả chi tiết

Sau khi thanh toán được backend xác nhận, hệ thống gửi biên nhận điện tử cho người trả. Email phản ánh trạng thái giao dịch đã xác thực, không dựa vào màn hình trả về từ provider.

### Điều kiện trước

- PaymentTransaction đã chuyển sang Succeeded hoặc giao dịch thủ công đã được xác nhận.

### Luồng nghiệp vụ chính

1. Hệ thống nhận sự kiện thanh toán thành công.
2. Tải thông tin bill, amount, method và transaction code.
3. Render email xác nhận.
4. Gửi và lưu EmailLog.

### Kết quả mong đợi

- Người trả có bằng chứng và link tra cứu giao dịch.

### Priority

Should Have

### Acceptance Criteria

**Given** giao dịch được xác nhận thành công  
**When** hệ thống hoàn tất xử lý  
**Then** gửi email gồm tên hóa đơn, số tiền, thời gian, phương thức và mã giao dịch.

---

# EPIC 6 — Thanh toán

---

## US-PAY-001 — Khởi tạo giao dịch thanh toán trực tuyến

### User Story

**Là một** Bill Member,  
**tôi muốn** thanh toán phần tiền của mình trực tuyến,  
**để** hoàn thành nghĩa vụ nhanh chóng.


### Mô tả chi tiết

Chức năng này tạo giao dịch với cổng thanh toán cho đúng phần tiền còn thiếu của Bill Member. Việc khởi tạo chưa đồng nghĩa đã thanh toán thành công.

### Điều kiện trước

- Bill cho phép thanh toán.
- Người dùng là BillMember.
- RemainingAmount lớn hơn 0.

### Luồng nghiệp vụ chính

1. Người dùng chọn phương thức và số tiền.
2. Backend kiểm tra trạng thái hóa đơn và RemainingAmount.
3. Tạo PaymentTransaction Pending với mã duy nhất.
4. Gọi provider và trả payment URL hoặc QR.

### Kết quả mong đợi

- Một giao dịch chờ xử lý được tạo và người dùng có thể tiếp tục tại provider.

### Priority

Should Have

### Acceptance Criteria

#### AC1 — Tạo giao dịch

**Given** người dùng còn số tiền phải trả  
**When** chọn phương thức thanh toán và xác nhận  
**Then** hệ thống tạo Payment Transaction ở trạng thái `Pending`  
**And** gắn với đúng Bill Member  
**And** chuyển người dùng đến cổng thanh toán hoặc hiển thị QR.

#### AC2 — Không còn số tiền phải trả

**Given** Remaining Amount bằng 0  
**When** người dùng cố thanh toán  
**Then** hệ thống từ chối  
**And** hiển thị trạng thái đã thanh toán đủ.

#### AC3 — Hóa đơn bị hủy

**Given** hóa đơn có trạng thái `Cancelled`  
**When** người dùng cố thanh toán  
**Then** hệ thống từ chối.

### Business Rules

- Amount không được lớn hơn Remaining Amount, trừ khi nghiệp vụ cho phép trả dư.
- Payment Transaction phải có mã duy nhất.
- Currency phải khớp với hóa đơn.

---

## US-PAY-002 — Xử lý callback hoặc webhook thanh toán

### User Story

**Là một** hệ thống,  
**tôi muốn** xác minh callback hoặc webhook từ cổng thanh toán,  
**để** cập nhật trạng thái giao dịch chính xác.


### Mô tả chi tiết

Webhook là nguồn xác nhận đáng tin cậy từ cổng thanh toán. Hệ thống phải kiểm tra chữ ký, mã giao dịch, số tiền, currency và xử lý idempotent trước khi cộng tiền.

### Điều kiện trước

- PaymentTransaction đã được tạo.
- Provider có cơ chế ký hoặc xác thực callback.

### Luồng nghiệp vụ chính

1. Nhận webhook và lưu thông tin kỹ thuật cần thiết.
2. Xác minh chữ ký và tra giao dịch.
3. Kiểm tra amount, currency, provider transaction ID và trạng thái cũ.
4. Cập nhật giao dịch, BillMember và Bill trong một transaction an toàn.

### Kết quả mong đợi

- Giao dịch chỉ được ghi nhận một lần và trạng thái thanh toán được cập nhật chính xác.

### Priority

Must Have nếu tích hợp thanh toán trực tuyến

### Acceptance Criteria

#### AC1 — Giao dịch hợp lệ

**Given** webhook có chữ ký hợp lệ  
**And** mã giao dịch tồn tại  
**And** số tiền và currency khớp  
**When** cổng thanh toán báo thành công  
**Then** Payment Transaction chuyển sang `Succeeded`  
**And** Paid Amount của Bill Member được cập nhật  
**And** trạng thái Bill Member được tính lại.

#### AC2 — Chữ ký không hợp lệ

**Given** webhook không vượt qua bước xác minh chữ ký  
**When** hệ thống nhận request  
**Then** từ chối xử lý  
**And** ghi security log.

#### AC3 — Callback trùng

**Given** một webhook thành công đã được xử lý  
**When** nhận lại cùng Provider Transaction ID  
**Then** hệ thống không cộng tiền lần hai  
**And** phản hồi idempotent.

#### AC4 — Số tiền không khớp

**Given** số tiền từ provider không khớp giao dịch  
**When** xử lý webhook  
**Then** giao dịch không được xác nhận thành công  
**And** chuyển sang trạng thái cần kiểm tra.

---

## US-PAY-003 — Hiển thị kết quả thanh toán

### User Story

**Là một** Bill Member,  
**tôi muốn** biết kết quả thanh toán,  
**để** xác nhận giao dịch đã hoàn tất hay chưa.


### Mô tả chi tiết

Trang kết quả cho người dùng biết giao dịch thành công, thất bại hay vẫn đang xử lý. Giao diện phải truy vấn trạng thái backend thay vì tin tham số redirect có thể bị chỉnh sửa.

### Điều kiện trước

- Người dùng đã khởi tạo giao dịch và quay lại từ provider hoặc mở link kết quả.

### Luồng nghiệp vụ chính

1. Frontend gửi Payment ID cho backend.
2. Backend trả trạng thái đã xác minh gần nhất.
3. Nếu Pending/Processing, giao diện cho phép kiểm tra lại.
4. Hiển thị hướng dẫn phù hợp theo từng trạng thái.

### Kết quả mong đợi

- Người dùng nhận thông tin đáng tin cậy về kết quả thanh toán.

### Priority

Should Have

### Acceptance Criteria

**Given** người dùng quay lại từ cổng thanh toán  
**When** mở trang kết quả  
**Then** hệ thống hiển thị trạng thái mới nhất từ backend  
**And** không chỉ dựa trên query string do trình duyệt gửi về  
**And** cho phép kiểm tra lại nếu giao dịch đang xử lý.

---

## US-PAY-004 — Đánh dấu thanh toán thủ công

### User Story

**Là một** Bill Owner,  
**tôi muốn** đánh dấu một thành viên đã trả tiền mặt hoặc chuyển khoản ngoài hệ thống,  
**để** trạng thái hóa đơn phản ánh đúng thực tế.


### Mô tả chi tiết

Đây là phương thức thanh toán chính của MVP khi tiền được trả bằng tiền mặt hoặc chuyển khoản ngoài hệ thống. Chỉ Bill Owner được xác nhận, và thao tác tạo một giao dịch Manual để có thể truy vết.

### Điều kiện trước

- Người thao tác là Bill Owner.
- BillMember còn RemainingAmount.
- Bill chưa bị hủy.

### Luồng nghiệp vụ chính

1. Owner chọn thành viên và nhập số tiền, phương thức, thời gian, ghi chú.
2. Hệ thống kiểm tra số tiền không vượt quy định.
3. Tạo PaymentTransaction loại Manual và Succeeded.
4. Cập nhật PaidAmount, RemainingAmount, trạng thái member và bill.

### Kết quả mong đợi

- Khoản thanh toán ngoài hệ thống được phản ánh trong dashboard và audit log.

### Priority

Must Have cho MVP

### Acceptance Criteria

#### AC1 — Xác nhận thủ công

**Given** thành viên còn số tiền phải trả  
**When** Bill Owner nhập số tiền, phương thức, thời gian và xác nhận  
**Then** hệ thống tạo một giao dịch loại `Manual`  
**And** cập nhật Paid Amount  
**And** tính lại trạng thái.

#### AC2 — Số tiền vượt quá số còn thiếu

**Given** số tiền xác nhận lớn hơn Remaining Amount  
**When** lưu  
**Then** hệ thống cảnh báo hoặc từ chối theo chính sách sản phẩm.

#### AC3 — Lưu người xác nhận

**When** giao dịch thủ công được tạo  
**Then** hệ thống lưu người xác nhận, thời gian, ghi chú và bằng chứng nếu có.

### Business Rules

- Giao dịch thủ công phải phân biệt với giao dịch provider.
- Mọi xác nhận thủ công phải có audit log.
- Bill Member không được tự đánh dấu mình đã thanh toán.

---

## US-PAY-005 — Thanh toán một phần

### User Story

**Là một** Bill Member,  
**tôi muốn** thanh toán một phần số tiền,  
**để** có thể hoàn tất theo nhiều lần khi hóa đơn cho phép.


### Mô tả chi tiết

Thanh toán một phần cho phép một nghĩa vụ được hoàn tất qua nhiều giao dịch. Mỗi lần trả được ghi riêng, trong khi PaidAmount là tổng các giao dịch hợp lệ.

### Điều kiện trước

- Bill bật AllowPartialPayment.
- Số tiền nhập lớn hơn 0 và nhỏ hơn hoặc bằng RemainingAmount.

### Luồng nghiệp vụ chính

1. Người dùng nhập số tiền muốn trả.
2. Backend kiểm tra chính sách và RemainingAmount.
3. Tạo và xử lý giao dịch như bình thường.
4. Sau thành công, tính lại tổng đã trả và phần còn thiếu.

### Kết quả mong đợi

- Member chuyển sang PartiallyPaid cho đến khi RemainingAmount bằng 0.

### Priority

Could Have

### Acceptance Criteria

**Given** hóa đơn cho phép thanh toán một phần  
**When** người dùng thanh toán số tiền nhỏ hơn Remaining Amount  
**Then** giao dịch được ghi nhận  
**And** trạng thái thành viên chuyển sang `PartiallyPaid`  
**And** Remaining Amount được cập nhật.

---

## US-PAY-006 — Xem lịch sử giao dịch

### User Story

**Là một** người dùng,  
**tôi muốn** xem lịch sử thanh toán liên quan đến mình,  
**để** kiểm tra các giao dịch đã thực hiện.


### Mô tả chi tiết

Lịch sử giao dịch giúp người dùng đối chiếu các lần thanh toán, kể cả giao dịch thất bại hoặc hoàn tiền. Người dùng chỉ được xem giao dịch của mình hoặc giao dịch thuộc hóa đơn mình sở hữu theo quyền.

### Điều kiện trước

- Người dùng đã đăng nhập.

### Luồng nghiệp vụ chính

1. Người dùng mở lịch sử và đặt bộ lọc.
2. Hệ thống áp dụng phạm vi dữ liệu theo quyền.
3. Trả danh sách phân trang cùng trạng thái và mã giao dịch.
4. Cho phép mở chi tiết một giao dịch được phép xem.

### Kết quả mong đợi

- Người dùng có thể tra cứu và đối chiếu giao dịch liên quan.

### Priority

Should Have

### Acceptance Criteria

**Given** người dùng đã đăng nhập  
**When** mở lịch sử giao dịch  
**Then** hệ thống hiển thị các giao dịch người dùng có quyền xem  
**And** hỗ trợ lọc theo trạng thái, thời gian, hóa đơn và phương thức.

---

# EPIC 7 — Theo dõi trạng thái thanh toán

---

## US-TRACK-001 — Theo dõi trạng thái từng thành viên

### User Story

**Là một** Bill Owner,  
**tôi muốn** xem trạng thái thanh toán của từng người,  
**để** biết ai đã trả và ai còn thiếu.


### Mô tả chi tiết

Bảng trạng thái thành viên là công cụ chính để Owner biết ai đã trả đủ, trả một phần, đang xử lý hoặc quá hạn. Dữ liệu phải được tính từ các giao dịch hợp lệ thay vì cập nhật thủ công rời rạc.

### Điều kiện trước

- Người dùng là Bill Owner.
- Hóa đơn có BillMember.

### Luồng nghiệp vụ chính

1. Hệ thống lấy AssignedAmount và các giao dịch hợp lệ của từng member.
2. Tính PaidAmount và RemainingAmount.
3. Suy ra PaymentStatus theo rule.
4. Hiển thị thời gian giao dịch và lịch sử nhắc.

### Kết quả mong đợi

- Owner có trạng thái chính xác theo từng người.

### Priority

Must Have

### Acceptance Criteria

**Given** Bill Owner mở chi tiết hóa đơn  
**Then** hệ thống hiển thị cho mỗi thành viên:
- Assigned Amount.
- Paid Amount.
- Remaining Amount.
- Payment Status.
- Thời gian thanh toán gần nhất.
- Số lần đã nhắc.

### Payment Status

- `AwaitingPayment`
- `Processing`
- `PartiallyPaid`
- `Paid`
- `Failed`
- `Overdue`
- `Cancelled`
- `Refunded`

---

## US-TRACK-002 — Hiển thị tổng quan thu tiền

### User Story

**Là một** Bill Owner,  
**tôi muốn** xem tổng quan số tiền đã thu và còn thiếu,  
**để** đánh giá tiến độ thanh toán.


### Mô tả chi tiết

Dashboard tổng hợp tiến độ thu tiền trên toàn hóa đơn. Các con số phải khớp với chi tiết từng thành viên và loại trừ giao dịch thất bại, bị hủy hoặc đã hoàn.

### Điều kiện trước

- Người dùng có quyền xem dashboard hóa đơn.

### Luồng nghiệp vụ chính

1. Tổng hợp AssignedAmount, PaidAmount và RemainingAmount.
2. Đếm member theo trạng thái.
3. Tính tỷ lệ hoàn thành.
4. Trả dữ liệu cùng thời điểm cập nhật gần nhất.

### Kết quả mong đợi

- Owner nhanh chóng biết đã thu bao nhiêu và còn thiếu bao nhiêu.

### Priority

Must Have

### Acceptance Criteria

**Given** hóa đơn có nhiều thành viên  
**When** mở dashboard hóa đơn  
**Then** hệ thống hiển thị:
- Tổng tiền cần thu.
- Tổng tiền đã thu.
- Tổng tiền còn thiếu.
- Số người đã thanh toán.
- Số người chưa thanh toán.
- Số người quá hạn.
- Tỷ lệ hoàn thành.

### Business Rules

- Total Collected chỉ tính các giao dịch hợp lệ.
- Giao dịch Failed, Cancelled hoặc Refunded không được tính vào số đã thu, trừ phần chưa hoàn.

---

## US-TRACK-003 — Tự động cập nhật trạng thái hóa đơn

### User Story

**Là một** hệ thống,  
**tôi muốn** tự động cập nhật trạng thái hóa đơn,  
**để** trạng thái tổng thể luôn đúng với dữ liệu thanh toán.


### Mô tả chi tiết

Trạng thái Bill là kết quả tổng hợp từ trạng thái phát hành, số tiền đã thu và hạn thanh toán. Việc cập nhật phải xảy ra sau mọi thay đổi thanh toán và trong job kiểm tra quá hạn.

### Điều kiện trước

- Bill không bị xóa vật lý.

### Luồng nghiệp vụ chính

1. Tính tổng cần thu và tổng đã thu hợp lệ.
2. Kiểm tra trạng thái Cancelled trước.
3. So sánh số tiền và DueDate theo thứ tự ưu tiên rule.
4. Cập nhật BillStatus nếu có thay đổi và ghi audit/event.

### Kết quả mong đợi

- BillStatus luôn đồng bộ với dữ liệu thanh toán thực tế.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Chưa ai trả

**Given** hóa đơn đã công bố  
**And** chưa có người thanh toán  
**Then** trạng thái là `Published`.

#### AC2 — Có người trả một phần

**Given** đã thu được một phần nhưng chưa đủ  
**Then** trạng thái là `PartiallyPaid`.

#### AC3 — Đã thu đủ

**Given** tổng số tiền hợp lệ đã thu bằng tổng số tiền cần thu  
**Then** trạng thái là `Paid`.

#### AC4 — Quá hạn

**Given** đã qua Due Date  
**And** vẫn còn người chưa thanh toán đủ  
**Then** trạng thái là `Overdue`.

#### AC5 — Hủy

**Given** hóa đơn đã bị hủy  
**Then** trạng thái giữ là `Cancelled` bất kể lịch chạy cập nhật trạng thái.

---

## US-TRACK-004 — Xác định thành viên quá hạn

### User Story

**Là một** Bill Owner,  
**tôi muốn** biết người nào đã quá hạn thanh toán,  
**để** có thể nhắc đúng đối tượng.


### Mô tả chi tiết

Member bị xem là quá hạn khi đã qua DueDate và vẫn còn tiền phải trả. Việc xác định có thể chạy theo scheduler và phải hoàn nguyên nếu ngày đến hạn được chỉnh hợp lệ.

### Điều kiện trước

- Bill có DueDate.
- Bill chưa Paid hoặc Cancelled.

### Luồng nghiệp vụ chính

1. Job so sánh thời điểm hiện tại với DueDate.
2. Tìm member có RemainingAmount lớn hơn 0.
3. Chuyển trạng thái phù hợp sang Overdue.
4. Hiển thị trong bộ lọc và phục vụ gửi nhắc.

### Kết quả mong đợi

- Danh sách quá hạn phản ánh đúng thời gian và số tiền còn thiếu.

### Priority

Should Have

### Acceptance Criteria

**Given** Due Date đã qua  
**And** Remaining Amount lớn hơn 0  
**Then** trạng thái thành viên chuyển sang `Overdue`  
**And** xuất hiện trong bộ lọc người quá hạn.

---

# EPIC 8 — Chỉnh sửa sau khi công bố

---

## US-EDIT-001 — Hạn chế sửa hóa đơn đã công bố

### User Story

**Là một** hệ thống,  
**tôi muốn** hạn chế thay đổi hóa đơn đã gửi,  
**để** tránh làm sai dữ liệu thanh toán.


### Mô tả chi tiết

Sau khi công bố, hóa đơn đã tạo nghĩa vụ và có thể đã phát sinh thanh toán. Vì vậy các thay đổi tài chính phải bị kiểm soát chặt, đặc biệt với người đã trả một phần hoặc toàn bộ.

### Điều kiện trước

- Người thao tác là Bill Owner.
- Bill đã Published hoặc PartiallyPaid.

### Luồng nghiệp vụ chính

1. Owner gửi thay đổi.
2. Hệ thống xác định trường bị ảnh hưởng và member đã thanh toán.
3. Cho phép thay đổi an toàn hoặc từ chối thay đổi trực tiếp.
4. Nếu được phép, tính lại, lưu version và gửi thông báo.

### Kết quả mong đợi

- Không làm mất cân đối dữ liệu đã thanh toán; toàn bộ thay đổi có lịch sử.

### Priority

Must Have

### Acceptance Criteria

#### AC1 — Chưa có giao dịch thành công

**Given** hóa đơn đã công bố nhưng chưa có thanh toán thành công  
**When** Bill Owner chỉnh sửa  
**Then** hệ thống có thể cho phép thay đổi  
**And** yêu cầu xác nhận  
**And** tính lại số tiền  
**And** thông báo cho thành viên bị ảnh hưởng.

#### AC2 — Đã có người thanh toán

**Given** một thành viên đã thanh toán đủ hoặc một phần  
**When** Bill Owner thay đổi Assigned Amount của người đó  
**Then** hệ thống từ chối thay đổi trực tiếp  
**And** yêu cầu thực hiện luồng điều chỉnh hoặc hoàn tiền.

#### AC3 — Lưu lịch sử thay đổi

**When** hóa đơn đã công bố bị chỉnh sửa  
**Then** hệ thống ghi lại giá trị trước và sau  
**And** người thực hiện  
**And** thời gian thay đổi.

---

## US-EDIT-002 — Thông báo khi hóa đơn thay đổi

### User Story

**Là một** Bill Member,  
**tôi muốn** được thông báo khi phần tiền của mình thay đổi,  
**để** biết nghĩa vụ thanh toán mới.


### Mô tả chi tiết

Khi AssignedAmount, DueDate hoặc thông tin quan trọng thay đổi sau công bố, thành viên bị ảnh hưởng phải được biết. Thông báo cần nêu rõ giá trị mới và không chứa dữ liệu của người khác.

### Điều kiện trước

- Một thay đổi sau công bố đã được lưu thành công.

### Luồng nghiệp vụ chính

1. Hệ thống so sánh trước và sau để xác định người bị ảnh hưởng.
2. Tạo nội dung email/in-app notification cá nhân hóa.
3. Gửi thông báo và lưu log.
4. Hiển thị thay đổi mới trong chi tiết hóa đơn.

### Kết quả mong đợi

- Member có thông tin mới nhất về nghĩa vụ của mình.

### Priority

Should Have

### Acceptance Criteria

**Given** Assigned Amount hoặc Due Date của thành viên bị thay đổi  
**When** thay đổi được lưu thành công  
**Then** hệ thống gửi email hoặc in-app notification  
**And** hiển thị giá trị mới  
**And** nêu người thực hiện thay đổi.

---

# EPIC 9 — Audit, bảo mật và vận hành

---

## US-AUDIT-001 — Ghi audit log cho hành động quan trọng

### User Story

**Là một** Administrator,  
**tôi muốn** hệ thống ghi lại hành động quan trọng,  
**để** có thể truy vết khi xảy ra vấn đề.


### Mô tả chi tiết

Audit log phục vụ truy vết ai đã thay đổi dữ liệu gì và vào thời điểm nào. Log phải đủ chi tiết cho điều tra nhưng không được chứa Google ID token, session token hoặc dữ liệu thanh toán nhạy cảm.

### Điều kiện trước

- Một hành động thuộc danh sách cần audit được thực hiện.

### Luồng nghiệp vụ chính

1. Thu thập actor, action, entity, dữ liệu trước/sau và trace context.
2. Mask hoặc loại bỏ trường nhạy cảm.
3. Ghi bản ghi append-only.
4. Cho phép Admin tra cứu theo quyền.

### Kết quả mong đợi

- Mọi hành động quan trọng có dấu vết không thể sửa bởi người dùng thông thường.

### Priority

Must Have

### Acceptance Criteria

**When** xảy ra một trong các hành động sau:
- Tạo hoặc chỉnh sửa hóa đơn.
- Công bố hoặc hủy hóa đơn.
- Thêm hoặc xóa thành viên.
- Thay đổi cách chia tiền.
- Đánh dấu thanh toán thủ công.
- Xử lý giao dịch.
- Đăng nhập Google, refresh hoặc thu hồi session.
- Gửi email nhắc.
- Thay đổi trạng thái.

**Then** hệ thống lưu:
- User ID.
- Action.
- Entity Type.
- Entity ID.
- Old Value.
- New Value.
- Timestamp.
- IP Address.
- User Agent.
- Trace ID.

### Business Rules

- Audit log không được chỉnh sửa bởi người dùng thông thường.
- Dữ liệu nhạy cảm phải được mask.
- Không lưu Google ID token, access token hoặc thông tin thẻ.

---

## US-SEC-001 — Phân quyền truy cập hóa đơn

### User Story

**Là một** người dùng,  
**tôi muốn** chỉ người liên quan mới xem được hóa đơn,  
**để** bảo vệ thông tin cá nhân và tài chính.


### Mô tả chi tiết

Phân quyền được kiểm tra tại backend cho từng tài nguyên, không chỉ ẩn nút trên giao diện. Người thuộc cùng nhóm nhưng không được chọn vào hóa đơn không mặc nhiên có quyền xem hóa đơn đó.

### Điều kiện trước

- Request có danh tính người dùng hoặc link yêu cầu xác thực.

### Luồng nghiệp vụ chính

1. Xác thực phiên người dùng.
2. Tra OwnerId, BillMember hoặc vai trò Admin phù hợp.
3. Cho phép đúng phạm vi dữ liệu và hành động.
4. Từ chối request không có quyền mà không làm lộ tài nguyên.

### Kết quả mong đợi

- Dữ liệu hóa đơn và thanh toán chỉ được truy cập bởi đúng đối tượng.

### Priority

Must Have

### Acceptance Criteria

- Bill Owner được xem toàn bộ hóa đơn mình tạo.
- Bill Member được xem hóa đơn mình tham gia.
- Người không liên quan không được xem.
- Group Member không tự động được xem mọi hóa đơn của nhóm nếu không được thêm vào hóa đơn đó.
- Admin chỉ truy cập theo quyền vận hành được cấu hình.

---

## US-SEC-002 — Chống lạm dụng đăng nhập và gửi email hàng loạt

### User Story

**Là một** hệ thống,  
**tôi muốn** giới hạn các hành động gửi email,  
**để** chống spam và lạm dụng.


### Mô tả chi tiết

Endpoint đăng nhập Google, lời mời và nhắc thanh toán có thể bị lợi dụng. Hệ thống cần hạn mức theo IP, email, user và tài nguyên, đồng thời ghi nhận hành vi bất thường.

### Điều kiện trước

- Có request đăng nhập hoặc tạo email.

### Luồng nghiệp vụ chính

1. Tạo rate-limit key phù hợp.
2. Kiểm tra số lượt trong cửa sổ thời gian.
3. Cho phép hoặc từ chối request.
4. Ghi security event và áp dụng khóa tạm/CAPTCHA khi vượt ngưỡng.

### Kết quả mong đợi

- Giảm nguy cơ brute-force, email bombing và lạm dụng dịch vụ.

### Priority

Must Have

### Acceptance Criteria

- Giới hạn đăng nhập Google theo IP.
- Giới hạn gửi lại lời mời.
- Giới hạn gửi nhắc thanh toán.
- Log các hành vi vượt ngưỡng.
- Có thể khóa tạm thời hoặc yêu cầu CAPTCHA khi cần.

---

## US-OPS-001 — Retry email thất bại

### User Story

**Là một** Administrator,  
**tôi muốn** email lỗi được thử gửi lại,  
**để** giảm trường hợp thành viên không nhận được thông báo.


### Mô tả chi tiết

Email có thể thất bại do lỗi mạng hoặc provider tạm thời. Worker chỉ retry các lỗi có khả năng phục hồi, theo backoff, và đưa vào trạng thái thất bại cuối cùng khi hết số lần.

### Điều kiện trước

- Một EmailJob đã thất bại.
- Lỗi được phân loại là có thể retry hoặc không.

### Luồng nghiệp vụ chính

1. Worker đọc RetryCount và loại lỗi.
2. Lập lịch lại theo exponential backoff nếu phù hợp.
3. Cập nhật trạng thái sau mỗi lần.
4. Đánh dấu Failed/Dead-letter khi vượt giới hạn.

### Kết quả mong đợi

- Email tạm lỗi có cơ hội được gửi lại mà không tạo vòng lặp vô hạn.

### Priority

Should Have

### Acceptance Criteria

**Given** email thất bại do lỗi tạm thời  
**When** background worker retry  
**Then** hệ thống thử lại theo chính sách  
**And** tăng Retry Count  
**And** chuyển sang `Failed` vĩnh viễn sau khi vượt giới hạn.

---

## US-OPS-002 — Theo dõi giao dịch cần kiểm tra

### User Story

**Là một** Administrator,  
**tôi muốn** xem giao dịch bất thường,  
**để** xử lý các trường hợp số tiền hoặc trạng thái không khớp.


### Mô tả chi tiết

Một số giao dịch không thể tự động kết luận, chẳng hạn callback sai số tiền hoặc pending quá lâu. Chúng cần được gom vào hàng đợi kiểm tra để Admin xử lý có kiểm soát.

### Điều kiện trước

- Giao dịch thỏa một rule bất thường.

### Luồng nghiệp vụ chính

1. Hệ thống phát hiện bất thường trong webhook hoặc job đối soát.
2. Chuyển transaction sang ReviewRequired và lưu reason.
3. Hiển thị trong danh sách vận hành.
4. Admin xem dữ liệu và thực hiện hành động được cấp quyền.

### Kết quả mong đợi

- Giao dịch nghi vấn không bị tự động ghi nhận sai và có đường xử lý rõ ràng.

### Priority

Should Have

### Acceptance Criteria

Hệ thống phải đưa giao dịch vào danh sách kiểm tra khi:

- Số tiền callback không khớp.
- Currency không khớp.
- Provider Transaction ID bị trùng bất thường.
- Giao dịch pending quá lâu.
- Webhook có chữ ký không hợp lệ.
- Có lỗi cập nhật trạng thái sau khi provider báo thành công.

---

# EPIC 10 — Chức năng quản trị

---

## US-ADMIN-001 — Quản lý người dùng

### User Story

**Là một** Administrator,  
**tôi muốn** tìm kiếm và xem trạng thái người dùng,  
**để** hỗ trợ vận hành hệ thống.


### Mô tả chi tiết

Màn hình quản lý người dùng hỗ trợ tra cứu và xử lý tài khoản Pending, Active hoặc Blocked. Admin không được truy cập Google ID token, session token hoặc thông tin bí mật.

### Điều kiện trước

- Người dùng có quyền Administrator phù hợp.

### Luồng nghiệp vụ chính

1. Admin tìm theo email/tên và áp dụng bộ lọc.
2. Hệ thống trả dữ liệu tối thiểu cần thiết.
3. Admin xem chi tiết hoặc khóa/mở khóa theo quyền.
4. Mọi thay đổi trạng thái được audit.

### Kết quả mong đợi

- Admin có thể hỗ trợ tài khoản mà vẫn bảo vệ dữ liệu nhạy cảm.

### Priority

Could Have cho MVP, Should Have cho production

### Acceptance Criteria

- Tìm kiếm theo email hoặc tên.
- Xem trạng thái `Pending`, `Active`, `Blocked`.
- Xem ngày tạo và lần đăng nhập gần nhất.
- Khóa hoặc mở khóa tài khoản theo quyền.
- Không được xem Google ID token hoặc session token.

---

## US-ADMIN-002 — Quản lý hóa đơn

### User Story

**Là một** Administrator,  
**tôi muốn** tra cứu hóa đơn,  
**để** hỗ trợ người dùng và điều tra lỗi.


### Mô tả chi tiết

Màn hình quản lý hóa đơn giúp tra cứu sự cố theo mã hóa đơn, Owner hoặc Member. Đây chủ yếu là quyền quan sát; chỉnh sửa dữ liệu tài chính phải đi qua luồng nghiệp vụ chuyên biệt.

### Điều kiện trước

- Người dùng có quyền vận hành hóa đơn.

### Luồng nghiệp vụ chính

1. Admin nhập điều kiện tìm kiếm.
2. Hệ thống trả danh sách hóa đơn phân trang.
3. Admin mở chi tiết, lịch sử, email và giao dịch liên quan.
4. Các hành động nhạy cảm yêu cầu quyền riêng và audit.

### Kết quả mong đợi

- Đội vận hành có đủ dữ liệu để hỗ trợ và điều tra.

### Priority

Should Have

### Acceptance Criteria

- Tìm theo Bill Code, Owner Email hoặc Member Email.
- Lọc theo trạng thái.
- Xem lịch sử thay đổi.
- Xem trạng thái gửi email.
- Không được tự sửa dữ liệu tài chính nếu không qua luồng nghiệp vụ.

---

## US-ADMIN-003 — Quản lý email log

### User Story

**Là một** Administrator,  
**tôi muốn** xem lịch sử gửi email,  
**để** xác định nguyên nhân email không đến người nhận.


### Mô tả chi tiết

Email log cho biết hệ thống đã gửi loại email nào, đến ai, trạng thái và lý do thất bại. Nội dung lỗi phải được làm sạch để không làm lộ secret hoặc dữ liệu cá nhân không cần thiết.

### Điều kiện trước

- Người dùng có quyền xem vận hành email.

### Luồng nghiệp vụ chính

1. Admin lọc theo recipient, loại, trạng thái hoặc entity.
2. Hệ thống trả EmailLog và RetryCount.
3. Admin xem lỗi đã sanitize.
4. Nếu được phép, Admin yêu cầu retry tạo một job mới có liên kết log cũ.

### Kết quả mong đợi

- Sự cố gửi email có thể được xác định và xử lý có kiểm soát.

### Priority

Should Have

### Acceptance Criteria

- Xem recipient, email type, related entity và trạng thái.
- Xem thời gian gửi và số lần retry.
- Xem failure reason đã được loại bỏ dữ liệu nhạy cảm.
- Cho phép retry thủ công nếu có quyền.

---

# 4. Business Rules tổng hợp

## BR-001 — Email duy nhất

Mỗi email chỉ được liên kết với một tài khoản.

## BR-002 — Chuẩn hóa email

Email phải được trim và chuyển về chữ thường trước khi so sánh.

## BR-003 — Thành viên duy nhất trong hóa đơn

Một user hoặc email chỉ được xuất hiện một lần trong cùng một hóa đơn.

## BR-004 — Tổng tiền chia phải khớp

Tổng Assigned Amount của các thành viên phải bằng tổng số tiền cần thu trước khi công bố.

## BR-005 — Hóa đơn phải có thành viên

Một hóa đơn phải có ít nhất một người cần thanh toán trước khi công bố.

## BR-006 — Thanh toán phải được xác thực

Thanh toán trực tuyến chỉ được xác nhận sau khi webhook hoặc callback được xác minh.

## BR-007 — Không tin dữ liệu frontend

Không được chuyển trạng thái thành `Paid` chỉ dựa trên dữ liệu từ browser.

## BR-008 — Callback idempotent

Cùng một giao dịch provider không được xử lý thành công nhiều lần.

## BR-009 — Không sửa trực tiếp phần tiền đã thanh toán

Không được giảm hoặc tăng Assigned Amount của người đã thanh toán nếu chưa qua luồng điều chỉnh.

## BR-010 — Xác minh Google ID token

Backend chỉ đăng nhập sau khi Google ID token vượt qua kiểm tra chữ ký, issuer, expiry, audience và email verified.

## BR-011 — Bảo vệ dữ liệu

Người dùng chỉ xem được hóa đơn do mình tạo hoặc hóa đơn mình tham gia.

## BR-012 — Không nhắc người đã thanh toán

Không gửi email nhắc cho Bill Member có Remaining Amount bằng 0.

## BR-013 — Không xóa vật lý dữ liệu tài chính

Hóa đơn và giao dịch đã phát sinh không được hard delete trong luồng thông thường.

## BR-014 — Tính tiền chính xác

Tiền phải được lưu bằng decimal hoặc đơn vị nhỏ nhất của tiền tệ, không dùng float/double.

---

# 5. Trạng thái đề xuất

## 5.1. User Status

| Trạng thái | Ý nghĩa |
|---|---|
| Pending | Đã được tạo nhưng chưa xác thực email |
| Active | Đã xác thực và có thể sử dụng |
| Blocked | Bị khóa |
| Deleted | Đã vô hiệu hóa mềm |

## 5.2. Group Status

| Trạng thái | Ý nghĩa |
|---|---|
| Active | Đang hoạt động |
| Closed | Không tạo hóa đơn mới |
| Deleted | Đã xóa mềm |

## 5.3. Bill Status

| Trạng thái | Ý nghĩa |
|---|---|
| Draft | Chưa gửi |
| Published | Đã gửi, chưa có thanh toán |
| PartiallyPaid | Đã thu một phần |
| Paid | Đã thu đủ |
| Overdue | Quá hạn và còn thiếu |
| Cancelled | Đã hủy |

## 5.4. Bill Member Payment Status

| Trạng thái | Ý nghĩa |
|---|---|
| AwaitingPayment | Chờ thanh toán |
| Processing | Giao dịch đang xử lý |
| PartiallyPaid | Đã trả một phần |
| Paid | Đã trả đủ |
| Failed | Giao dịch gần nhất thất bại |
| Overdue | Quá hạn |
| Cancelled | Không còn nghĩa vụ thanh toán |
| Refunded | Đã hoàn tiền |

## 5.5. Payment Transaction Status

| Trạng thái | Ý nghĩa |
|---|---|
| Pending | Đã khởi tạo |
| Processing | Provider đang xử lý |
| Succeeded | Thành công |
| Failed | Thất bại |
| Cancelled | Đã hủy |
| Refunded | Đã hoàn tiền |
| ReviewRequired | Cần kiểm tra thủ công |

---

# 6. Phạm vi MVP

## Must Have

- Đăng nhập bằng Google ID token đã được backend xác minh.
- Kiểm tra email đã tồn tại hay chưa.
- Tự động tạo tài khoản `Pending`.
- Tạo nhóm.
- Thêm thành viên vào nhóm.
- Tạo hóa đơn nháp.
- Thêm người bằng email.
- Chọn người từ nhóm.
- Chia đều hóa đơn.
- Xem trước số tiền.
- Công bố hóa đơn.
- Gửi email thông báo.
- Xem danh sách hóa đơn.
- Theo dõi trạng thái từng người.
- Đánh dấu đã thanh toán thủ công.
- Gửi email nhắc thủ công.
- Audit log cơ bản.
- Phân quyền Owner/Member.

## Should Have

- Chia theo số tiền tùy chỉnh.
- Lịch sử giao dịch.
- Email xác nhận thanh toán.
- Tự động xác định quá hạn.
- Admin tra cứu hóa đơn và email.
- Retry email.

## Could Have

- Chia theo phần trăm.
- Thanh toán một phần.
- Thanh toán trực tuyến.
- Hoàn tiền.
- Nhắc tự động.
- OCR hóa đơn.
- Hóa đơn định kỳ.
- Mobile notification.

---

# 7. Definition of Ready

Một User Story được xem là sẵn sàng phát triển khi:

- Có mô tả vai trò, nhu cầu và giá trị.
- Có Acceptance Criteria rõ ràng.
- Có mockup hoặc flow nếu liên quan UI phức tạp.
- Có API contract sơ bộ nếu liên quan backend.
- Có business rule đã được thống nhất.
- Không còn dependency chưa xác định.
- Tester có thể viết test case từ Acceptance Criteria.
- Story đủ nhỏ để hoàn thành trong một sprint.

---

# 8. Definition of Done

Một User Story được xem là hoàn thành khi:

- Code đã được review.
- Unit test đạt yêu cầu.
- Integration test đã chạy.
- Acceptance Criteria đã được kiểm thử.
- Phân quyền đã được kiểm tra.
- Validation và error handling đầy đủ.
- Audit log được ghi nếu cần.
- API documentation được cập nhật.
- Không còn lỗi blocker hoặc critical.
- Đã deploy lên môi trường test.
- Product Owner chấp nhận kết quả.

---


# 9. Gợi ý API theo User Story

## Authentication

- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

## Groups

- `POST /api/groups`
- `GET /api/groups`
- `GET /api/groups/{groupId}`
- `POST /api/groups/{groupId}/members`
- `DELETE /api/groups/{groupId}/members/{memberId}`
- `POST /api/groups/{groupId}/close`

## Bills

- `POST /api/bills`
- `GET /api/bills`
- `GET /api/bills/{billId}`
- `PUT /api/bills/{billId}`
- `POST /api/bills/{billId}/members`
- `DELETE /api/bills/{billId}/members/{memberId}`
- `POST /api/bills/{billId}/calculate`
- `POST /api/bills/{billId}/publish`
- `POST /api/bills/{billId}/cancel`
- `POST /api/bills/{billId}/reminders`

## Payments

- `POST /api/bills/{billId}/payments`
- `POST /api/bills/{billId}/members/{memberId}/manual-payments`
- `GET /api/payments`
- `GET /api/payments/{paymentId}`
- `POST /api/payments/{provider}/webhooks`

## Administration

- `GET /api/admin/users`
- `GET /api/admin/bills`
- `GET /api/admin/payments`
- `GET /api/admin/email-logs`
- `GET /api/admin/audit-logs`

---

# 10. Ghi chú thiết kế

- Nên tách `Bill Owner` khỏi `Bill Member`.
- Nên lưu `UserId` trong Bill Member sau khi tài khoản được tạo.
- Có thể giữ thêm `EmailSnapshot` để lưu email tại thời điểm tạo hóa đơn.
- Email nên gửi qua message queue và background worker.
- Payment webhook phải có idempotency.
- Thay đổi tài chính cần transaction và audit log.
- Không nên tích hợp thanh toán trực tuyến ngay trong MVP nếu chưa có merchant account.
- MVP có thể dùng thanh toán thủ công hoặc QR chuyển khoản trước.
