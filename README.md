# Splitly — Tiền gọn gàng. Đời thảnh thơi.

Next.js 16 App Router, React 19 và TypeScript. Trang `/` là landing page với cảnh 3D, logo Splitly và bảng màu charcoal/violet. Khu quản lý dùng API Bill Split Service, tham khảo luồng trong `FE_Personal` và đối chiếu Swagger thực tế. Landing, login và khu quản lý dùng chung nền tối, ánh tím/xanh chuyển động nhẹ, chữ rõ và bề mặt có chiều sâu. Sidebar có một nút thu/mở trên topbar, vùng menu chỉ cuộn khi cần; dashboard có các khối đóng/mở. Chuyển động gồm vào trang, thẻ xuất hiện lần lượt, số liệu đếm tăng, thanh tiến độ, chuyển bước wizard, modal bay lên và lưới ngân hàng mở/thu; hỗ trợ tùy chọn giảm chuyển động của thiết bị.

## Chạy dự án

Dùng Node 24 LTS (`.node-version`) và npm; Node 22 từ 22.13.0 cũng tương thích. Chỉ dùng `package-lock.json`, không trộn pnpm/yarn vào cùng `node_modules`.

```powershell
npm ci --include=dev
# Nếu chưa có .env.local, sao chép .env.example và điền SESSION_SECRET.
Copy-Item .env.example .env.local
npm run dev
```

Mở http://localhost:3000. Giữ `.env.local` đang có. Nếu cần nút **Vào bằng tài khoản phát triển** ở `/login`, đặt `ENABLE_DEV_LOGIN=true` và dùng seed `admin@example.com` trên backend. Google và mã email hoạt động qua cùng gateway; nút phát triển luôn bị tắt trong production.

Nếu VS Code báo thiếu `react` hoặc `@radix-ui/react-popover`, chạy `npm ci --include=dev` từ root này rồi `npm run typecheck`. Khi typecheck qua nhưng editor còn báo lỗi, chọn **TypeScript: Select TypeScript Version → Use Workspace Version**, sau đó **TypeScript: Restart TS Server**. `.vscode/settings.json` trỏ đến TypeScript đã khóa trong dự án. Không thêm declaration giả hoặc bỏ strict để che lỗi dependency.

Nếu báo `EADDRINUSE :3000`, một server đang dùng cổng đó. Dừng đúng terminal đang chạy bằng Ctrl+C trước khi mở phiên mới; không tắt toàn bộ Node trên máy. Có thể chạy preview riêng bằng `npm exec -- cross-env NODE_ENV=development next dev --port 3001`.

Chi tiết cài thêm thư viện, cleanup và đo tốc độ: [hướng dẫn build và tải trang](docs/skills/splitly-development/references/build-and-loading.md). `npm run typecheck` tự sinh route types; không cần commit `next-env.d.ts` hoặc output `.next`. `npm run clean` dọn output khi server đã dừng.

Form login hiển thị từ HTML server. Cảnh 3D tải sau khi trang paint; mobile login không tải renderer bị ẩn. Landing chỉ dựng các chương tiếp theo khi cuộn đến gần, giữ các cảnh đã xem để cuộn ngược ổn định. Script `node scripts/audit-initial-load.mjs` đo bản production ở :3001 và lưu ảnh/số đo tại `QA/initial-load`.

| Biến môi trường                | Ý nghĩa                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_API_URL`              | URL gốc của backend, không thêm `/api`; thay khi ngrok đổi địa chỉ.                                                                                       |
| `SESSION_SECRET`               | Khóa ngẫu nhiên dài để ký thông tin phiên; bắt buộc trong production.                                                                                     |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID; nếu để trống, đăng nhập bằng mã email vẫn dùng được. Cấu hình authorized JavaScript origin cho URL frontend trong Google Console. |
| `ENABLE_DEV_LOGIN`             | `true` để mở đăng nhập seed ở local. Mặc định `false`, luôn tắt trong production.                                                                         |

## Luồng sử dụng

- Landing page giới thiệu sản phẩm, không tải dữ liệu cá nhân và không mở popup ví demo.
- `/login`: mã email hoặc Google; giữ đường dẫn hóa đơn khi đăng nhập từ email. Cho phép dán nguyên mã có dấu gạch nối, chuyển sang chữ hoa và chuẩn hóa email trước khi gửi.
- `/dashboard`: tổng quan, lọc hóa đơn gần đây, tiến độ thu tiền và nhóm; từng khối đóng/mở được. Số liệu lấy từ API, tiến độ chỉ phản ánh các hóa đơn đang hiển thị.
- `/bills`: hóa đơn bạn tạo/bạn tham gia, tìm trong trang, phân trang.
- `/bills/new`: lưu thông tin → thêm thành viên → `Equal` hoặc `CustomAmount` → chọn tài khoản nhận tiền → phát hành. Bản nháp lưu trên backend, có thể tiếp tục sau.
- `/bills/[billId]`: tổng tiền, phần chia, số còn lại, chi tiết từng người và lịch sử thanh toán theo quyền. QR/link PayOS dành cho phần của bạn; chủ hóa đơn có thể xem QR của người chưa trả. Đọc lại mỗi 3 giây khi còn phần chưa trả; dừng khi hoàn tất hoặc rời trang. Chủ hóa đơn có thể nhắc đúng các thành viên còn nợ, ghi nhận khoản thực nhận, xóa thành viên bản nháp hoặc hủy với lý do và modal xác nhận.
- `/groups` và `/groups/[groupId]`: tạo nhóm, thêm/xóa thành viên, xem hóa đơn và đóng nhóm.
- `/payout-accounts`: modal thêm tài khoản có lưới logo ngân hàng, tìm không dấu theo tên/mã/BIN, hỗ trợ bàn phím. Sau khi ngừng nhập 550ms, tự gọi tra tên và điền chủ tài khoản. Hủy request cũ khi đổi ngân hàng/số tài khoản, bỏ qua kết quả cũ; lưu một lần bằng `bankBin`, `accountNumber`, `isDefault`. Đặt tài khoản mặc định.
- `/support`: gửi yêu cầu hỗ trợ, có thể gắn với hóa đơn.
- `/admin/users`: tìm/phân trang người dùng, danh mục vai trò/quyền, đổi vai trò, cấp quyền hiệu lực và chặn/mở truy cập theo quyền backend.
- `/admin/support-requests`: lọc/phân trang yêu cầu, mở chi tiết và cập nhật trạng thái/kết quả xử lý. Giải quyết hoặc từ chối cần ghi chú.

Các nút quản lý và điều hướng quản trị hiện theo `effectivePermissionCodes` của backend. Backend quyết định quyền cuối cùng và kiểm tra quyền sở hữu. Webhook và auto payout do backend xử lý. Xem [bảng đối chiếu flow/API](docs/api-flow-coverage.md) để phân biệt UI tham khảo với endpoint vận hành nội bộ/legacy.

## API và phiên đăng nhập

`src/app/api/[...path]/route.ts` chuyển các endpoint được cho phép về backend để frontend gọi cùng origin. Access/refresh token giữ trong cookie HttpOnly. Thông tin người dùng được ký bằng HMAC, kiểm tra chữ ký và hạn sử dụng trước khi cho vào khu quản lý. Token không trả về JavaScript, không lưu vào localStorage.

`BACKEND_API_URL` phải được cấu hình rõ trong môi trường; gateway không gửi dữ liệu đến một URL ngrok mặc định. `src/lib/api/responses.ts` rút gọn dữ liệu quyền, vai trò, ngân hàng và chi tiết hóa đơn trước khi gửi về trình duyệt. Số tài khoản trong danh sách được che, lookup chỉ trả tên đã xác minh; lỗi không chuyển tiếp response chẩn đoán của ngân hàng. `views.ts` khai báo contract UI, còn `types.ts` giữ schema upstream được sinh từ Swagger. API quản trị kiểm tra quyền hiệu lực từ backend trước khi lấy dữ liệu, chỉ gộp các kiểm tra đồng thời và không cache quyền qua các request đã hoàn thành.

Quyền phiên chỉ chứa hành động được frontend sử dụng, được khai báo trong `capabilities.ts`. Danh mục vai trò chỉ tải khi mở người dùng; danh mục quyền và các grant của người đó chỉ tải khi mở thẻ quyền. Bộ chỉnh quyền giữ toàn bộ grant để không xóa nhầm quyền nghiệp vụ chưa có màn hình frontend. Component riêng nằm trong `src/components/workspace/admin/PermissionsForm.tsx`.

Dữ liệu cần cho UI vẫn đọc được trong DevTools: tên/email khi quản lý người dùng, mã quyền để bật hành động, số tài khoản do người dùng nhập trong request xác minh/lưu, QR và link thanh toán. Không thể giấu dữ liệu này bằng CSS hay mã hóa trong frontend. Backend vẫn phải kiểm tra quyền sở hữu từng hóa đơn/tài khoản; việc rút gọn response không thay thế kiểm tra đó. Xem [quy tắc privacy và gateway](docs/skills/splitly-development/references/api-privacy.md).

Kiểm tra Origin so sánh với Host của request, tránh chặn nhầm `localhost:3000` khi Next dev chạy nội bộ ở `0.0.0.0:3000`. Request từ host khác vẫn bị chặn.

Trang `/login` có `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Referrer-Policy: no-referrer-when-downgrade` ở local và `strict-origin-when-cross-origin` trong production. Đã kiểm tra hiệu ứng không gây hydration mismatch khi bật giảm chuyển động.

**Cấu hình Google còn cần trên tài khoản Google Cloud:** trong lần kiểm tra local, GIS trả 403 và báo `The given origin is not allowed for the given client ID`. Mở Google Auth Platform → Clients → Web client đang dùng trong `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; thêm cả `http://localhost` và `http://localhost:3000` vào **Authorized JavaScript origins** rồi lưu. Khi triển khai, thêm origin frontend thực tế. Cấu hình này nằm ngoài source và cần quyền quản lý OAuth client. Xem [hướng dẫn chính thức của Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

Khi API trả 401, gateway refresh phiên, cập nhật cookie và thử lại một lần. Các yêu cầu refresh đồng thời trong cùng tiến trình dùng chung kết quả. Nếu không refresh được, phiên được xóa và giao diện trở về đăng nhập. Sau logout, cookie local được xóa kể cả khi backend không phản hồi.

API không dùng dữ liệu demo làm fallback. Lỗi kết nối, validation, thiếu quyền hoặc dữ liệu trống được thể hiện trên trang. Các minh họa trên landing page độc lập với dữ liệu tài khoản.

`src/lib/api/types.ts` được sinh từ Swagger hiện hành. Để cập nhật:

```powershell
Invoke-WebRequest -Uri "$env:BACKEND_API_URL/swagger/v1/swagger.json" -Headers @{'ngrok-skip-browser-warning'='true'} -OutFile "$env:TEMP\mo-swagger.json"
node scripts/generate-api-types.mjs "$env:TEMP\mo-swagger.json"
npx prettier --write src/lib/api/types.ts
```

## Kiểm tra và build

Chỉ chạy các kiểm tra quan trọng khi thay đổi UI: đăng nhập, sidebar, tra tên/lưu tài khoản (gồm request trả chậm), modal hủy, wizard và viewport nhỏ. Các API quyền đã được đọc thử trực tiếp với tài khoản seed local; không thực hiện giao dịch tài chính thật.

```powershell
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run start
```

Kiểm tra E2E dùng Chrome đã cài, gồm desktop và viewport iPhone. Test quản lý tự tạo cookie thử bằng `SESSION_SECRET` trong `.env.local` và mock API; không gửi email, tạo hóa đơn hay thanh toán trên backend thật. Unit test kiểm tra gateway, bảo vệ token, refresh/logout và xử lý contract. Test landing giữ kiểm tra 3D, scroll, WebGL fallback và accessibility.

Đã kiểm tra đọc dữ liệu thật qua backend và gateway. Google/OTP cần tài khoản người dùng để kiểm tra đăng nhập tương tác; PayOS/webhook/payout cần giao dịch backend thật để xác nhận toàn bộ chuỗi thanh toán.

Production cần `SESSION_SECRET` nhất quán giữa các instance, backend hoạt động và Google origin tương ứng nếu bật Google. Các font và cảnh 3D nằm trong source. Kết quả screenshot/trace ở `test-results/`, được bỏ qua trong source control.
