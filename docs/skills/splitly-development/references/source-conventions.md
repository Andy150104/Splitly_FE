# Convention và bản đồ source Splitly

Các quy tắc dưới đây được rút từ config và implementation hiện có ngày 02/10/2026. Đọc file thực tế khi sửa; không giữ một convention đã bị yêu cầu mới hoặc source mới thay thế.

## Stack và cách viết

| Mục        | Convention quan sát được                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Runtime    | Next.js 16.3.4 App Router, React 19, TypeScript 5.9; version thực tế xem `package.json`/lockfile.           |
| Component  | `.tsx`, functional component; PascalCase tên file component. File UI tương tác có `'use client'`.           |
| TypeScript | Strict, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`; dùng `import type` cho type.        |
| Import     | Đường dẫn tương đối trong source; chưa có alias `@/` trong `tsconfig.json`.                                 |
| Formatting | Không semicolon, single quote, trailing comma `all`, print width 100 theo `.prettierrc.json`.               |
| Lint       | ESLint flat config với TypeScript và `react-hooks`; giữ dependency/cleanup của effect đúng.                 |
| Styling    | CSS thường, class theo màn và component; `ws-` là workspace, `splitly-` cho brand/hiệu ứng chung.           |
| Motion     | `motion/react`, `AnimatePresence`, `useReducedMotion`; helper ở `ui/Motion.tsx`.                            |
| 3D         | React Three Fiber, Drei, Three.js; ưu tiên cảnh procedural và ánh sáng local đang có.                       |
| Font       | Be Vietnam Pro cho UI, Barlow Condensed cho heading editorial của landing; font import local ở root layout. |
| Ngôn ngữ   | Copy UI tiếng Việt; tiền dùng helper `money`, ngày local dùng `Asia/Ho_Chi_Minh`.                           |

## Chọn nơi sửa

UI tái sử dụng nằm trong `src/components/ui`; xem [bản đồ component](../../../../src/components/ui/README.md) để chọn control, feedback hoặc overlay phù hợp. State phiên, quyền và hook API của workspace nằm trong `src/components/workspace/hooks.tsx`. Import trực tiếp file cần dùng, giữ component nghiệp vụ trong `components/workspace`.

| Nhu cầu                               | File/khu vực                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| App shell, metadata, font, thứ tự CSS | `src/app/layout.tsx`                                                                                                      |
| Landing composition                   | `src/App.tsx`, `src/components/Header.tsx`, `Hero.tsx`, `Features.tsx`, `Dreams.tsx`, `Footer.tsx`, `OverviewPreview.tsx` |
| Story timeline và cảnh landing        | `src/lib/story.ts`, `src/components/WalletScene.tsx`                                                                      |
| Bảo vệ trang và deep link             | `src/app/(workspace)/layout.tsx`, `src/proxy.ts`, `src/app/login/page.tsx`                                                |
| Sidebar, profile, quyền chung         | `src/components/workspace/Shell.tsx`, `hooks.tsx`                                                                         |
| Login UI và cảnh 3D                   | `workspace/Login.tsx`, `workspace/LoginScene.tsx`                                                                         |
| Hóa đơn                               | `workspace/Bills.tsx`, `CreateBill.tsx`, `BillDetail.tsx`                                                                 |
| Nhóm, tài khoản, hỗ trợ, quản trị     | `workspace/Groups.tsx`, `Accounts.tsx`, `Support.tsx`, `AdminUsers.tsx`, `AdminSupport.tsx`                               |
| Modal và animation dùng chung         | `ui/WorkspaceModal.tsx`, `ui/Motion.tsx`                                                                                  |
| Ngân hàng                             | `workspace/BankPicker.tsx`; `BankLogo` export cùng file; `AccountForm` export từ `Accounts.tsx`                           |
| Loading và chuyển route               | `src/components/ui/Skeleton.tsx`, `RouteTransition.tsx`, `src/app/(workspace)/loading.tsx`                                |
| Gateway server                        | `src/app/api/[...path]/route.ts`; không có file `src/lib/api/gateway.ts`                                                  |
| Session và API client                 | `src/lib/api/session.ts`, `client.ts`                                                                                     |
| Schema API                            | `src/lib/api/types.ts`, `scripts/generate-api-types.mjs`                                                                  |

Route page thường là wrapper mỏng; giữ form, state và action trong component nghiệp vụ. Cookies, secret và upstream Bearer token không chuyển sang client component. App Router đang dùng `params`/`searchParams` dạng Promise, `await cookies()`/`headers()` và `proxy.ts`; đọc Next docs cài đặt trước khi đổi các API này.

## CSS, layout và motion

Thứ tự import trong root layout: `styles.css` → `story.css` → `navbar.css` → `experience.css` → `workspace.css` → `splitly.css` → `refinement.css`. Các file cũ có selector/nền sáng còn tồn tại; đọc cascade thay vì chỉ thay một token rồi giả định mọi màn đã đổi màu.

Theme hiện tại: nền khoảng `#0b0b12`, surfaces tối, accent lavender/tím; workspace dùng biến `--ws-*`. Tái sử dụng token/component phù hợp. Typography landing có style global; workspace cần scope để tránh heading khổng lồ hoặc `white-space: nowrap` tràn màn.

Workspace có chiều cao `100dvh`; `.ws-main-shell` là flex column, `.ws-main` cuộn dọc với `min-height: 0`. Route có giới hạn chiều rộng, grid dùng `minmax(0, ...)`, children cần `min-width: 0`. Không dùng `overflow: hidden` để che nội dung cần thao tác.

`Atmosphere` là lớp nền fixed, pointer-events none, z-index 0. Content như main, FAQ và footer phải có stacking phù hợp; nội dung direct sibling không được để nền che. Vòng/orbit phải được chứa trong section của nó. Quầng xám cũ `hero-art::after` đang bị tắt trong refinement.

`WorkspaceModal` dùng portal vào body, `dialog.showModal()`, refcount khóa cuộn, `AnimatePresence`, spring và restore focus. CSS modal không thể phụ thuộc nó nằm trong `.workspace`. Props chính: `open`, `title`, `onClose`, `busy`, `size`. `size="wide"` dùng cho thêm tài khoản; `AccountForm.onBusy` báo trạng thái lưu về modal. Trên mobile `ws-account-fields` dùng `display: contents` để sticky action bar có containing block phù hợp.

`RouteTransition` được mount một lần trong root layout. Hook `useSplitlyNavigation()` trả về hàm gọi theo dạng `navigate(href, { replace, refresh })`; dùng cho điều hướng toàn trang lập trình. Link nội bộ được bắt qua event, cùng pathname/hash không mở hiệu ứng; navigation/back có cleanup và giới hạn 7 giây. Không tạo transition provider thứ hai trong từng page.

`LoginScene` dynamic import với `ssr: false` từ client component; có fallback, DPR giới hạn, ánh sáng local, IntersectionObserver/visibility và demand rendering khi giảm chuyển động hoặc không hiển thị. Không khiến auth form phải đợi WebGL thành công mới sử dụng được.

Cảnh login dùng portal vào `.ws-login-scene-backdrop` trong layout để vòng quỹ đạo chạy sau cả hai cột. `ResizeObserver` ánh xạ tâm `.ws-login-spatial-space` sang tọa độ 3D; ví, quỹ đạo chính và nét vòng kéo dài cùng một group có chung tâm. Vùng kéo/chạm vẫn nằm trong cột trái, form ở lớp phía trước. Chỉ backdrop cắt phần trang trí vượt khung; không khóa cuộn nội dung form khi mã email hoặc lỗi làm form dài hơn. Nhịp chuyển động tự động có khoảng nghỉ; chạm kích hoạt cùng chuỗi tách ba lớp thẻ, xoay hai phần logo rồi ghép lại. Giữ chi tiết mặt thẻ trong group của mặt thẻ khi tách lớp. Tắt chuyển động tự động khi giảm chuyển động. Visual QA riêng: `node scripts/capture-login-interaction.mjs`, ảnh lưu ở `QA/login-assembled-scene`.

Các model login và landing dùng chung `src/components/three/`: `materials.ts` định nghĩa màu và vật liệu satin/soft metal; `StudioLighting` cung cấp ánh sáng studio; `LinkedLoop` có đầu bo kín; `SplitToken` có viền bevel và dấu Splitly hai mặt. Import trực tiếp từng file. Choreography, camera và pointer state vẫn thuộc scene tương ứng. Props CSS nhỏ dùng cùng palette, không thêm canvas riêng. Hũ tiết kiệm kết hợp lớp thân paper satin với phần đáy trong nhẹ; tránh nền/chữ vàng cũ và chrome bóng gương.

## API và state invariants

- `api<T>(path, options)` nhận path **không có** `/api/` ở đầu, fetch `/api/${path}`, no-store, unwrap envelope `data`, gom lỗi và xử lý session hết hạn. `send<T>(path, data, method)` mặc định POST.
- `useApi<T>(path, poll)` trả `data`, `error`, `loading`, `isRefreshing`, `reload`. `path=null` nghĩa không fetch; thường gắn với `can('Permission.Code')`. Resource được gắn theo path, không dùng data của URL cũ để render URL mới. Reload cùng path giữ data trong lúc request mới chạy.
- Giữ AbortController, bỏ qua response bị abort, cleanup timeout và poll khi document visible. Dispatch đầu được defer để tránh request đôi do effect replay ở development. Nếu truyền poll callback, giữ reference ổn định theo pattern hiện tại.
- `useWorkspace().can(code)` dựa trên `effectivePermissionCodes`. Ẩn/disable hành động theo quyền, hiển thị lỗi quyền/retry có ích; UI gating không thay cho authorization backend.
- Gateway allowlist có cả path nghiệp vụ và admin. Admin method quan trọng: list GET, role/permission PATCH, access PUT, support status PATCH. Catalog là `admin/users/roles` và `admin/users/permissions`.
- Token cookie hiện dùng tên legacy `mo_access`, `mo_refresh`, `mo_profile`; profile ký HMAC. LocalStorage `mo.sidebar` lưu preference UI. Đổi brand hiển thị không tự đổi các key này nếu chưa có migration tương ứng.
- Origin của request ghi được so với Host; giữ xử lý dev bind `0.0.0.0`. Refresh upstream khi 401 một lần, gom concurrent refresh bằng hash/token và grace window. Logout clear session ngay cả khi upstream lỗi.
- `auth/dev-login` chỉ dùng khi bật `ENABLE_DEV_LOGIN` và không ở production. Không dùng shortcut này để che lỗi Google/email thật.
- Types được sinh từ Swagger qua `node scripts/generate-api-types.mjs <swagger.json>`. Khi schema đổi, xem generator/schema trước khi sửa thủ công file sinh. Không dùng `any` để bỏ qua contract.

### Các contract dễ sửa nhầm

| Flow                | Invariant                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Email login         | Email trim/lowercase; code trim/uppercase, hỗ trợ mã có dấu gạch nối. Giữ redirect `next` hợp lệ qua login.                                                                                            |
| Tài khoản nhận tiền | Lookup `bankBin` + `accountNumber`, debounce 550ms sau tối thiểu 6 số; invalidate tên khi đổi ngân hàng/số. Chỉ lưu kết quả đúng identity hiện tại và khóa submit trùng.                               |
| Lưu tài khoản       | POST `payout-accounts` với `bankBin`, `accountNumber`, `isDefault`; tên chủ tài khoản readonly từ lookup, không lấy tên người đăng nhập để điền.                                                       |
| Chia hóa đơn        | Tạo draft → members → calculate với enum chuỗi `Equal`/`CustomAmount` → publish với `payoutAccountId`. Custom allocation phải đúng tổng. Giữ draft khi call lỗi.                                       |
| Thanh toán          | QR/checkout/lịch sử đến từ bill detail; poll 3 giây theo `needsPolling`, dừng khi phần cần theo dõi hoàn tất hoặc rời trang. Chủ xem QR người chưa trả nhưng không trở thành người thanh toán thay họ. |
| Nhắc/hủy            | Nhắc đúng danh sách còn nợ; hủy có reason qua modal. Quay lại/đóng modal chưa xác nhận không gửi action.                                                                                               |
| Admin               | Đừng rút gọn catalog thành `admin/roles`/`admin/permissions`; access dùng `blocked` + `roleId`; support `Resolved`/`Dismissed` cần note.                                                               |

## Kiểm tra phù hợp với thay đổi

| Thay đổi                                                    | Bộ kiểm tra nên chọn                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Gateway, cookie, Origin, refresh/logout                     | `src/lib/api/gateway.test.ts`; test import route thật ở `src/app/api/[...path]/route.ts`. |
| Envelope/lỗi/format helper                                  | `src/lib/api/client.test.ts`                                                              |
| Login/deep link/quyền, wizard, QR polling                   | Case liên quan trong `tests/workspace.spec.ts`                                            |
| Sidebar, search logo, keyboard, manual payment, admin       | Case liên quan trong `tests/interactions.spec.ts`                                         |
| Lookup response cũ, cancel/close, modal hẹp, nhóm           | `tests/splitly-important.spec.ts`                                                         |
| Skeleton, progressive loading, refresh giữ data, route/back | `tests/loading-motion.spec.ts`                                                            |
| Story và landing 3D                                         | `src/lib/story.test.ts`, case phù hợp trong `tests/story.spec.ts`/`experience.spec.ts`    |

Chạy từ repo root. Ví dụ chọn test, không yêu cầu chạy cả danh sách:

```powershell
npm run typecheck
npx eslint src/components/workspace/Accounts.tsx
npx prettier --check src/components/workspace/Accounts.tsx
npx vitest run src/lib/api/client.test.ts
npx playwright test tests/loading-motion.spec.ts --project=desktop-chrome
npx playwright test tests/splitly-important.spec.ts --project=mobile-chrome --grep 'small workspace'
npm run build
```

Playwright config có `desktop-chrome` và `mobile-chrome`, tái sử dụng server local :3000. `tests/helpers/workspace.ts` provision phiên fixture và mock `/api/**`; tránh vô tình bỏ mock rồi ghi lên backend. Kiểm tra UI desktop 1440px, mobile 390px; viewport 230px dùng khi sửa overflow và nút modal. Visual QA lưu ở `QA/`; có script `scripts/capture-api-design.mjs` dùng fixtures, chạy bằng `node --experimental-strip-types scripts/capture-api-design.mjs` khi cần bộ ảnh tương ứng.

Môi trường hiện tại là PowerShell. Dùng `rg`/`rg --files` để tìm, `Get-Content -LiteralPath` cho tên chứa `[...path]`/`[id]`, đọc/ghi UTF-8 để giữ tiếng Việt. Không đọc hoặc in `.env.local` vào báo cáo; `.env.example` đủ để hiểu tên biến cấu hình.
