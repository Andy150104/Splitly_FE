# UI dùng chung của Splitly

Các màn hình import trực tiếp từ folder này. Giữ component chỉ nhận props và callback; gọi API và kiểm tra quyền ở component nghiệp vụ hoặc `workspace/hooks.tsx`.

| Nhóm                 | File                                                           | Mục đích                                             |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Form                 | `Field.tsx`, `SearchInput.tsx`, `Select.tsx`, `DatePicker.tsx` | Nhãn, tìm kiếm, dropdown và lịch chọn ngày nhất quán |
| Overlay              | `Tooltip.tsx`, `WorkspaceModal.tsx`, `Notifications.tsx`       | Hướng dẫn, modal, xác nhận và toast                  |
| Trạng thái           | `Feedback.tsx`, `Skeleton.tsx`, `Status.tsx`                   | Loading, lỗi, empty state, thông báo và badge        |
| Bố cục & chuyển động | `PageHeading.tsx`, `Motion.tsx`                                | Heading, reveal, vùng đóng/mở và số đếm              |
| Nhận diện & nền      | `Brand.tsx`, `Atmosphere.tsx`                                  | Logo Splitly và nền dùng chung                       |

`Feedback.tsx` export `Notice`, `Loading`, `ErrorState` và `Empty`. `Motion.tsx` export `Reveal`, `Disclosure` và `Count`. `WorkspaceModal.tsx` export modal mặc định và `ConfirmDialog`.

`Brand`, `Atmosphere`, `Field`, `PageHeading`, `Status` và `Skeleton` không tự yêu cầu client boundary. Component tương tác khai báo `'use client'` trong file của nó. Không tạo một barrel client cho toàn bộ folder, để các trang server có thể import những component tĩnh riêng.

CSS hiện tại nằm trong `src/refinement.css` và các lớp nền ở `src/splitly.css`/`src/workspace.css`; giữ prefix `ws-` hoặc `splitly-` và kiểm tra cascade khi sửa. Dropdown và lịch dùng Radix/DayPicker; overlay trong modal phải thuộc native dialog đang mở. Giữ focus, Escape, restore focus và reduced motion khi thêm tương tác.

Component có nghiệp vụ như `BankPicker`, `AccountForm`, `CreateBill` và `LoginScene` vẫn thuộc `components/workspace`. Điều hướng toàn trang nằm ở `components/RouteTransition.tsx`; không đưa session hoặc token vào UI chung.
