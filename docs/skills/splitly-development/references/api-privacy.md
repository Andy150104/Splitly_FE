# Response và dữ liệu riêng tư — 05/10/2026

Đọc guide `data-security.md` của Next đã cài trước khi sửa gateway. [Next khuyến nghị DTO tối thiểu và kiểm tra quyền ở server](https://nextjs.org/docs/app/guides/data-security); [OWASP API3](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/) giải thích rủi ro trả thuộc tính vượt nhu cầu.

## Đúng ranh giới

Trình duyệt luôn xem được dữ liệu đã nhận, kể cả khi UI không hiển thị. Không dùng base64, mã hóa có khóa ở frontend hoặc chặn DevTools để tuyên bố dữ liệu đã an toàn. Với yêu cầu giảm thông tin trong Network, tra trường UI thực sự đọc, tạo DTO ở server và kiểm tra quyền. Email/name trong danh sách quản trị, mã quyền để bật hành động, tên chủ tài khoản đã xác minh và QR/link checkout có nhu cầu sử dụng thật.

Số tài khoản người dùng nhập vẫn có trong request lookup/lưu; QR và checkout có thể mang dữ liệu thanh toán cần thiết. Nếu muốn thay luồng này bằng xác minh hoàn toàn ngoài trình duyệt, cần một contract backend khác. Không bỏ tên chủ tài khoản hoặc QR làm người dùng chuyển tiền sai; không gọi API ngân hàng thật để kiểm tra một fixture.

## Implementation hiện tại

- `src/app/api/[...path]/route.ts` yêu cầu cả profile hợp lệ lẫn access cookie cho request bảo vệ. Cookie/token không trả trong JSON đăng nhập; response đăng nhập và gửi mã chỉ xác nhận thành công.
- Không có backend ngrok mặc định. `BACKEND_API_URL` thiếu thì gateway trả lỗi kết nối, không gửi Bearer token hoặc thông tin ngân hàng sang một địa chỉ cũ.
- `src/lib/api/responses.ts` chọn trường của DTO quyền, vai trò, danh mục quyền, người dùng, tài khoản, lookup, ngân hàng và bill detail. Danh sách tài khoản chỉ trả số che; bill destination bỏ số tài khoản và ID thanh toán không dùng. Error envelope trả message tiếng Việt theo trạng thái/nghiệp vụ, bỏ data, trace và lỗi upstream chứa thông tin riêng tư.
- `withoutPrivateFields` là lớp bảo vệ bổ sung cho response legacy, loại token, số tài khoản thô và diagnostic payload theo tên trường. Nó không phải schema/authorization đầy đủ: endpoint mới có dữ liệu riêng tư cần DTO riêng, không dựa duy nhất vào denylist.
- `src/lib/api/types.ts` là contract upstream sinh từ Swagger. `views.ts` dùng Pick/Omit cho contract trình duyệt; không sửa schema sinh chỉ vì gateway đã rút gọn response.
- `auth/me/permissions` chỉ trả các mã trong `capabilities.ts` mà UI hiện có sử dụng; khi thêm hành động mới phải cập nhật danh sách này. Đây chỉ là dữ liệu bật UI, không phải nguồn kiểm tra quyền server. Response quyền của người đang được admin chỉnh vẫn giữ tất cả grant, kể cả nghiệp vụ chưa có màn frontend, để việc lưu không vô tình thu hồi quyền đó. Vai trò chỉ trả ID dùng khi lưu và tên hiển thị; danh mục quyền không trả permission ID không dùng.
- `AdminUsers` không tải role/catalog trên màn danh sách. Role tải khi mở người dùng; catalog và quyền người dùng tải lần đầu mở tab quyền và được giữ khi đổi tab trong cùng modal. Bộ chọn nằm ở `workspace/admin/PermissionsForm.tsx`, dùng chung SearchInput/Select/Tooltip. Giữ vùng cuộn có chiều cao đủ đọc và chữ tên quyền từ 14px; không thêm bộ lọc trùng nhau hoặc thu nhỏ chữ để nhét cả danh mục.
- API admin kiểm tra `auth/me/permissions` ở server theo đúng action: Users.Read, Roles.Read, Permissions.Read, Users.ReadPermissions/UpdatePermissions, Users.UpdateRole/UpdateAccess và SupportRequests.Read/Update. Thiếu mã hoặc payload không hợp lệ thì từ chối; không suy quyền từ tên vai trò hay profile cookie. Chỉ gộp kiểm tra đồng thời theo hash token, không lưu quyền sau khi request hoàn thành; backend tiếp tục kiểm tra quyền cuối cùng và ownership của từng resource.

Khi sửa, kiểm tra thêm `gateway.test.ts` với upstream fixture có trường nhạy cảm thừa, error data, lỗi ngân hàng và thiếu quyền. Xác nhận client nhận DTO tối thiểu, QR/link còn dùng được, không cache quyền sau khi thu hồi và không forward dữ liệu khi không có session. UI test ngân hàng/admin dùng mock phải đồng thời dùng DTO rút gọn; không coi browser route mock là kiểm tra authorization server.
