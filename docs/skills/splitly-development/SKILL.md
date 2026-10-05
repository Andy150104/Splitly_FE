---
name: splitly-development
description: Phát triển, sửa lỗi và cải thiện UI hoặc flow API trong source Splitly với Next.js App Router, gateway cùng origin, workspace và cảnh 3D. Dùng khi tiếp tục dự án Splitly hoặc khi người dùng yêu cầu bám convention của source này.
---

# Splitly development

Giữ thiết kế và nghiệp vụ Splitly nhất quán khi sửa source. Đọc code hiện tại trước khi áp dụng thông tin snapshot; yêu cầu mới của người dùng được ưu tiên hơn quyết định thiết kế trước đó.

## Xác định source và đọc đúng tài liệu

Source gốc: `C:/Users/ADMIN/Downloads/3D_UI_story_nav_v9_scrollfix/3D`. Nếu workspace đã di chuyển, xác định root qua `package.json`, `src/components/workspace/Shell.tsx` và `docs/api-flow-coverage.md`; không áp dụng skill lên dự án khác chỉ vì cùng dùng Next.js.

- Đọc `AGENTS.md`. Trước khi viết code Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/`; phiên bản cài đặt là nguồn chuẩn cho API và file convention. Giữ nguyên block do Next.js tự sinh trong `AGENTS.md`.
- Đọc [source-conventions.md](references/source-conventions.md) cho vị trí sửa, quy tắc TypeScript/CSS, component dùng chung và invariants của API.
- Khi cài thư viện, cleanup, sửa build hoặc tốc độ tải landing/login, đọc [build-and-loading.md](references/build-and-loading.md). Dùng npm cùng package-lock, cài có devDependencies và kiểm tra bản production; không trộn package manager hoặc build pipeline.
- Khi sửa response, thông tin cá nhân/ngân hàng hoặc quyền quản trị, đọc [api-privacy.md](references/api-privacy.md). Rút gọn dữ liệu ở server, giữ dữ liệu cần cho UI và kiểm tra authorization; không hứa giấu dữ liệu đã gửi tới trình duyệt.
- Khi tiếp tục công việc từ hội thoại này, đọc [context-summary.md](references/context-summary.md). Đây là snapshot ngày 02/10/2026, không phải trạng thái backend trực tiếp.
- Khi sửa nghiệp vụ, đọc `docs/api-flow-coverage.md` trong repo và phần tương ứng của source tham khảo `C:/Users/ADMIN/OneDrive/Desktop/FE_Personal`. Swagger và cấu hình backend có thể thay đổi; xác minh contract đang dùng trước khi thay payload.

## Sửa đúng lớp

Route trong `src/app` đảm nhiệm composition, dữ liệu/phiên server và redirect. UI tương tác của hệ thống nằm ở `src/components/workspace`. Landing dùng `src/App.tsx` cùng các component ở `src/components`.

Tái sử dụng `PageHeading`, `Field`, `Notice`, `ErrorState`, `Loading`, `useApi`, `useWorkspace`, `WorkspaceModal`, `ConfirmDialog`, `Brand` và các helper motion. Với một thay đổi nhỏ, giữ cách tổ chức hiện có; chỉ thêm abstraction khi có nhu cầu dùng lại cụ thể.

Gọi API trình duyệt qua `api<T>()` hoặc `send<T>()` và `/api/...`. Token và refresh nằm trên server. Khi thêm endpoint, kiểm tra gateway allowlist, method, type và permission cùng với UI; một endpoint có trong gateway chưa đồng nghĩa đã có flow sử dụng.

## Thiết kế và tương tác

Hướng thiết kế hiện tại là nền charcoal, accent tím/lavender, typography rõ, ánh sáng nhẹ và 3D có chủ đích. Icon phục vụ thao tác. Giữ landing, login và dashboard cùng một hệ màu; tránh mảng sáng có chữ nhạt hoặc hiệu ứng che nội dung.

- Đọc cascade trước khi sửa màu/layout; `refinement.css` được import sau `splitly.css`. Scope `.splitly-landing`, `.workspace`, `.ws-login` hoặc `.ws-modal` để tránh tác động ngoài màn đang sửa.
- Giữ shell cuộn trong `.ws-main`, sidebar thu gọn trên desktop và drawer trên mobile. Nút quan trọng phải tiếp cận được khi viewport thấp hoặc modal có nội dung dài.
- Modal dùng portal và native dialog: có nút đóng/hủy, Escape, trả focus về trigger, chặn đóng khi đang lưu. Thao tác hủy hóa đơn/đóng nhóm/xóa người chỉ gọi API sau xác nhận trong UI.
- Skeleton tải từng resource độc lập; refresh cùng URL giữ dữ liệu cũ, đổi URL không hiển thị nhầm resource. Hủy request cũ và bỏ qua response đã hết hiệu lực.
- Dùng `useSplitlyNavigation()` cho điều hướng lập trình cần transition toàn trang. Giữ xử lý deep link, back/forward và giảm chuyển động; không thêm loader vô hạn hoặc trì hoãn API chỉ để trình diễn.
- Cảnh 3D tải riêng, có fallback khi WebGL lỗi và giảm render khi không hiển thị. Giữ `prefers-reduced-motion` hoạt động.

## Kiểm tra theo phạm vi

Người dùng ưu tiên test luồng quan trọng, không chạy toàn bộ suite mặc định. Chọn test liên quan trong bảng ở reference; dùng API mock cho thao tác ghi khi kiểm tra UI. Chỉ thực hiện giao dịch, gửi email hoặc ghi dữ liệu backend thật khi nằm trong yêu cầu thực tế đã được giao.

Với thay đổi code, kiểm tra type, ESLint và Prettier ở phạm vi sửa; build production khi thay route, import, cấu hình hoặc cần xác nhận bundle. Với thay đổi chỉ là tài liệu, kiểm tra nội dung, link và cấu trúc skill; không cần chạy lại app test.

Kết thúc bằng mô tả thay đổi, kiểm tra đã chạy và giới hạn thực tế. Phân biệt kiểm tra mock với backend thật; giữ ghi chú Google OAuth nếu vấn đề đăng nhập vẫn liên quan. Không báo đã implement mọi endpoint Swagger khi còn endpoint chưa có UI.
