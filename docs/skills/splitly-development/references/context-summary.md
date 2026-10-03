# Context Splitly — snapshot 02/10/2026

## Mục tiêu và yêu cầu của người dùng

Tích hợp API backend theo flow của `C:/Users/ADMIN/OneDrive/Desktop/FE_Personal`, trên source hiện tại `C:/Users/ADMIN/Downloads/3D_UI_story_nav_v9_scrollfix/3D`. `/` tiếp tục là landing page, còn nghiệp vụ thực nằm trong các trang đăng nhập và workspace. Bỏ popup/demo flow không cần thiết nhưng giữ trải nghiệm kể chuyện và tương tác 3D của landing.

Swagger đã được cung cấp: `https://92d4-171-251-232-238.ngrok-free.app/swagger/v1/swagger.json`. Đây là địa chỉ ngrok theo context cũ; không mặc định nó vẫn truy cập được. Đọc `BACKEND_API_URL` theo cấu hình hiện tại khi cần nối backend.

Người dùng muốn thiết kế hiện đại, chuyên nghiệp, màu đẹp và chuyển động rõ ràng, tránh UI có quá nhiều icon trang trí hoặc dashboard đơn điệu. Tham khảo Pinterest: `https://www.pinterest.com/pin/341358846778893928/`, cùng các ảnh người dùng đã gửi. Link Pinterest chưa đọc được trực tiếp trong lần triển khai trước; ảnh đính kèm là căn cứ thiết kế đã sử dụng.

Các yêu cầu cụ thể được giữ xuyên suốt:

- Brand hiển thị là **Splitly**, thay tên cũ `mơ.`.
- Sidebar thu gọn/mở rộng được trên desktop; mobile dùng drawer.
- Các khối dashboard đóng/mở được; không để nội dung tràn hoặc bị footer che.
- Chọn ngân hàng bằng search và lưới logo thật, hỗ trợ bàn phím; modal đủ rộng để nhìn nhiều lựa chọn.
- Chọn ngân hàng và nhập số tài khoản thì tự gọi tra cứu và điền tên; không có bước bấm nút xác minh riêng. Vẫn phải có kết quả xác minh hợp lệ để lưu.
- Modal có animation xuất hiện/biến mất, đóng/hủy rõ ràng, focus và Escape hoạt động.
- Login có 3D. Chuyển trang có hiệu ứng giọt nước/giọt tím hoặc hiệu ứng đẹp tương đương, kèm trạng thái tải.
- Skeleton và progressive loading cho dữ liệu; tải lại không làm toàn trang biến mất.
- Chỉ test luồng quan trọng; không tự chạy toàn bộ e2e suite cho mỗi thay đổi.

## Flow đã có trong source

| Khu vực             | Trạng thái triển khai                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Landing `/`         | Kể chuyện 3D theo scroll, CTA sang workspace, phần chức năng/nhóm/FAQ/footer; bỏ các popup tài chính demo không cần thiết.     |
| Login               | Google GIS hoặc mã email, giữ `next`/deep link; dev login chỉ khi bật cấu hình local, luôn tắt ở production.                   |
| Session             | Gateway cùng origin, HttpOnly cookies, profile ký HMAC, refresh token khi upstream 401, clear cookie khi logout.               |
| Dashboard/hóa đơn   | Tổng quan, bạn tạo/bạn tham gia, tìm/lọc/phân trang; các section đóng/mở và sidebar có trạng thái lưu.                         |
| Wizard hóa đơn      | Tạo/cập nhật draft → thành viên → tính chia `Equal`/`CustomAmount` → chọn payout account và publish. Có tiếp tục draft.        |
| Chi tiết hóa đơn    | Thành viên, lịch sử, QR/PayOS theo người, nhắc người còn nợ, ghi nhận thanh toán thủ công, hủy có lý do, sửa thành viên draft. |
| Nhóm                | Tạo/xem/thêm hoặc xóa người/tạo hóa đơn từ nhóm/đóng nhóm.                                                                     |
| Tài khoản nhận tiền | Danh sách, tra tên tự động, thêm tài khoản, đặt mặc định.                                                                      |
| Hỗ trợ              | Gửi yêu cầu, có thể gắn hóa đơn.                                                                                               |
| Quản trị            | Người dùng/vai trò/quyền hiệu lực/chặn mở tài khoản; danh sách và xử lý yêu cầu hỗ trợ.                                        |

Bảng contract chi tiết và phạm vi endpoint chưa có UI nằm ở `docs/api-flow-coverage.md`. Webhook PayOS là backend flow; các API payout vận hành nội bộ và một số API thanh toán cũ chưa có màn riêng. Không coi phạm vi này là toàn bộ Swagger.

## Lần cải thiện UI mới nhất

- Thêm `src/refinement.css`, import cuối cùng để sửa các lớp màu/layout cũ còn xung đột.
- Sửa nền sáng và chữ xanh nhạt ở features, đổi highlight của dreams sang chữ tối trên lavender.
- Giới hạn vòng preview trong section; bỏ pseudo-element `hero-art::after` tạo quầng xám hình ellipse lớn.
- Sửa z-index phần FAQ bị `Atmosphere` che; footer chuyển từ wordmark khổng lồ sang CTA và hàng brand gọn hơn.
- Thêm `LoginScene.tsx` với thẻ 3D và emblem, tải bằng dynamic import `ssr: false`; có fallback và chế độ giảm chuyển động/render.
- Thêm `RouteTransition.tsx` ở root layout: giọt tím mở rộng, emblem xoay và thu lại; hỗ trợ điều hướng lập trình, link nội bộ, back/forward. Có timeout để tránh overlay kẹt.
- Thêm `Skeleton.tsx`, fallback `src/app/(workspace)/loading.tsx`. `useApi` giữ dữ liệu khi refresh cùng URL, phân biệt `isRefreshing`, hủy request cũ.
- Modal ngân hàng desktop rộng tối đa 980px, lưới logo ở trái và thông tin tài khoản ở phải; 24 lựa chọn ban đầu và tìm kiếm toàn bộ danh sách hỗ trợ. Mobile xếp dọc, thanh đóng/hủy/lưu tiếp cận được ở viewport hẹp.
- Chỉnh profile dropdown, nhóm nút cuối sidebar, hover/focus/pending của button; bỏ thẻ quảng bá thừa cuối dashboard.

## Đăng nhập và giới hạn cần nhớ

Lỗi gateway so sánh Origin với địa chỉ bind `0.0.0.0` đã sửa để so với Host. Email được trim/lowercase; mã được trim/uppercase và cho phép định dạng có dấu gạch nối, không ép OTP chỉ là số.

Lần kiểm tra Google trước ghi nhận GIS báo **origin không được phép với client ID**. Cần cấu hình Authorized JavaScript origins của Web OAuth client trên Google Cloud, gồm `http://localhost` và `http://localhost:3000` theo ghi chú kiểm tra trước. Header popup/referrer local đã chỉnh trong `next.config.ts`. Việc đổi UI không tự giải quyết cấu hình OAuth này; chưa xác nhận đăng nhập Google thật thành công sau khi người dùng đổi Cloud config.

Không lưu lại ID token, cookie, thông tin tài khoản cá nhân hoặc secret từ hội thoại trong skill. Chỉ liệt kê tên biến cấu hình: `BACKEND_API_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ENABLE_DEV_LOGIN`.

## Kiểm tra đã thực hiện trước lần đóng gói skill

Build production, TypeScript, ESLint và Prettier đã qua sau lần sửa UI mới nhất. Các test trọng yếu đã kiểm tra email/deep link, sidebar/dashboard, ngân hàng/search/tên cũ không ghi đè tên mới, nút modal ở chiều rộng 230px, tạo/phát hành hóa đơn, tải resource độc lập, refresh giữ thẻ và điều hướng/back. Các thao tác ghi trong e2e dùng API mock.

Những lần trước đã đọc một số API thật qua gateway, gồm quyền/vai trò/danh mục quyền. Không thực hiện giao dịch PayOS/webhook/payout thật hoặc xác nhận nhận mã email bằng hộp thư người dùng trong các test mock.

Ảnh QA: `QA/refinement/` cho lần chỉnh mới; `QA/api-integration/` chứa bộ ảnh và fixtures trước đó. Đây là ảnh chụp theo thời điểm, không thay cho kiểm tra browser khi sửa tiếp.

## Cách tiếp tục

Đọc yêu cầu mới, kiểm tra source hiện tại và áp dụng skill này ở phạm vi liên quan. Chưa có yêu cầu chức năng mới nào được để dở sau lần hoàn thành UI; vấn đề Google OAuth bên ngoài source vẫn cần theo dõi nếu người dùng báo không login được. Trạng thái test trên đây là lịch sử của phiên làm việc, không được dùng để tuyên bố một thay đổi mới đã được test.
