# UI dùng chung của Splitly

Các màn hình import trực tiếp từ folder này. Giữ component chỉ nhận props và callback; gọi API và kiểm tra quyền ở component nghiệp vụ hoặc `workspace/hooks.tsx`.

| Nhóm                 | File                                                           | Mục đích                                             |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Form                 | `Field.tsx`, `SearchInput.tsx`, `Select.tsx`, `DatePicker.tsx` | Nhãn, tìm kiếm, dropdown và lịch chọn ngày nhất quán |
| Overlay              | `Tooltip.tsx`, `WorkspaceModal.tsx`, `Notifications.tsx`       | Hướng dẫn, modal, xác nhận và toast                  |
| Trạng thái           | `Feedback.tsx`, `Skeleton.tsx`, `Status.tsx`                   | Loading, lỗi, empty state, thông báo và badge        |
| Bố cục & chuyển động | `PageHeading.tsx`, `Motion.tsx`                                | Heading, reveal, vùng đóng/mở và số đếm              |
| Nhận diện & nền      | `Brand.tsx`, `Atmosphere.tsx`                                  | Logo Splitly và nền dùng chung                       |
| Chế độ sáng / tối    | `ThemeToggle.tsx`                                              | Chuyển theme toàn ứng dụng, nhớ lựa chọn             |

`Feedback.tsx` export `Notice`, `Loading`, `ErrorState` và `Empty`. `Motion.tsx` export `Reveal`, `Disclosure` và `Count`. `WorkspaceModal.tsx` export modal mặc định và `ConfirmDialog`.

`WalletPlaceholder.tsx` là hình SVG nhẹ cho lúc landing/login đang tải hoặc không có WebGL. Component không import Three/Fiber; vị trí responsive nằm trong `universe.css`. Giữ cùng node hình dự phòng từ HTML đầu đến lúc shader và hai frame khởi động đã sẵn sàng qua `three/SceneReady.tsx`, rồi ẩn dần hình dự phòng trong 220ms và hiện canvas trong 360ms. Canvas phải giữ kích thước thật khi ẩn; không dùng việc mount Canvas làm tín hiệu sẵn sàng. Không dùng hiệu ứng nhấp nháy báo tải model. Login giữ hình dự phòng trong `.ws-login-spatial-space`, kể cả khi renderer portal vào backdrop hoặc WebGL lỗi.

Trong lúc chuẩn bị, truyền `soft` để làm mờ và giảm opacity của SVG ngay từ HTML đầu. Giữ `soft` cả khi hình dự phòng đang biến mất, tránh lóe lại hình sắc nét đứng yên. Canvas thật hiện dần trong 360ms khi sẵn sàng. Chỉ filter hình SVG nhỏ; không blur thanh phần trăm, nội dung hay canvas WebGL toàn màn. Khi WebGL không dùng được, bỏ `soft` để hình dự phòng là bản xem tĩnh rõ nét.

`SceneLoading.tsx` hiển thị thanh tiến trình chuẩn bị cảnh cạnh hình dự phòng, dùng `useSceneLoading` và các mốc trong `lib/scene-loading.ts`. Phần trăm đại diện cho các bước chuẩn bị đã hoàn tất, không phải số byte tải mạng. Không chạy timer để giả tăng phần trăm: renderer, vật liệu, compile, frame khởi động và ready báo mốc trực tiếp. Chỉ ready mới đạt 100%, rồi tự ẩn sau 650ms; lỗi WebGL dùng hình dự phòng và bỏ thanh tiến trình. Mobile login vẫn không tải renderer hoặc hiển thị thanh này.

`Brand`, `Atmosphere`, `Field`, `PageHeading`, `Status` và `Skeleton` không tự yêu cầu client boundary. Component tương tác khai báo `'use client'` trong file của nó. Không tạo một barrel client cho toàn bộ folder, để các trang server có thể import những component tĩnh riêng.

CSS hiện tại nằm trong `src/refinement.css` và các lớp nền ở `src/splitly.css`/`src/workspace.css`; giữ prefix `ws-` hoặc `splitly-` và kiểm tra cascade khi sửa. Dropdown và lịch dùng Radix/DayPicker; overlay trong modal phải thuộc native dialog đang mở. Giữ focus, Escape, restore focus và reduced motion khi thêm tương tác.

`theme.css` được import cuối, chỉ định nghĩa palette light xanh dương trên `html[data-theme='light']`. CSS hiện có giữ màu dark gốc làm fallback của `--theme-*`; không khai báo các token light này toàn cục trên `:root`, vì sẽ đổi cả dark. Modal/popover portal nhận theme từ html, không phụ thuộc nó nằm trong `.workspace`. Giữ màu chữ trắng trên nút accent và dùng màu trạng thái riêng cho thành công/lỗi. `useTheme` đọc preference chung; `ThemeToggle` không truy cập API hay phiên người dùng.

Vòng tròn đổi theme dùng một cặp snapshot cho cả lượt chuyển. Bấm tiếp khi vòng tròn đang chạy sẽ đảo chiều từ bán kính hiện tại; bấm trong lúc chuẩn bị snapshot chỉ cập nhật lựa chọn cuối. Giữ nhịp 760ms và reduced motion. Trong lúc chuyển, CSS animation được tạm dừng, CSS transition màu được bỏ qua và 3D dùng demand rendering. Đồng bộ storage chỉ có một listener chung, có thể hủy lượt chuyển mà không khôi phục lựa chọn cũ.

Component có nghiệp vụ như `BankPicker`, `AccountForm`, `CreateBill` và `LoginScene` vẫn thuộc `components/workspace`. Điều hướng toàn trang nằm ở `components/RouteTransition.tsx`; không đưa session hoặc token vào UI chung.
