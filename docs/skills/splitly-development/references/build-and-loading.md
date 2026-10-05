# Cài thư viện, build và tải trang — 04/10/2026

## Một toolchain có thể tái lập

Source dùng **npm + package-lock.json**, Next.js App Router và bundler Turbopack mặc định. `packageManager` ghi npm 11.8.0; `.node-version` chọn Node 24 LTS. Node 22 từ 22.13.0 vẫn được engines cho phép; máy 22.12.0 cũ sẽ có cảnh báo của eslint-visitor-keys 5. Đọc phiên bản thực trong lockfile và `node_modules`, không suy ra từ range trong `package.json`. Không trộn pnpm/yarn/bun vào cùng `node_modules`, không thêm Vite hoặc một bộ build Webpack song song để sửa lỗi cấu hình Next. Tham khảo [lịch hỗ trợ Node](https://nodejs.org/en/about/previous-releases) khi chọn runtime.

```powershell
node --version
npm --version
npm ci --include=dev
npm ls --include=dev --depth=0
```

`--include=dev` cần thiết trên máy có `NODE_ENV=production` hoặc cấu hình npm omit dev: TypeScript, ESLint, Playwright và cross-env vẫn cần khi build/test. `npm ci` tái lập lockfile; không xóa lockfile để thử sửa dependency. Nếu trước đó cài bằng pnpm, dừng server thuộc repo trước khi cài lại bằng npm.

Lỗi editor `Cannot find module react/@radix-ui/react-popover` cần phân biệt với lỗi compiler. Kiểm tra `npm ls --include=dev react @types/react @radix-ui/react-popover typescript --depth=0` và `npm run typecheck` từ đúng root. Nếu module thực sự thiếu, `npm ci --include=dev` rồi kiểm tra lại. Nếu compiler qua nhưng VS Code còn báo lỗi, dùng TypeScript của workspace (`.vscode/settings.json`) và Restart TS Server; không thêm ambient declaration giả, bỏ strict hoặc cài React/types toàn cục.

Trên Windows, `npm.ps1` có thể gọi `node.exe` trong thư mục npm cũ dù PATH đang ưu tiên một Node khác. Đọc giá trị `current.node` của EBADENGINE và dùng cặp Node/npm cùng installation; chỉ đổi PATH của node.exe chưa đủ. `.prettierrc.json` dùng `endOfLine: auto` để checkout CRLF không làm format check báo lỗi toàn bộ source; giữ quy tắc format còn lại.

Khi thêm thư viện: đọc import và dependency hiện có trước, kiểm tra peerDependencies với React/Fiber/Three/Next trong source. Chọn phiên bản cụ thể và dùng:

```powershell
npm install --include=dev --save-exact ten-thu-vien@phien-ban
# Với công cụ chỉ phục vụ phát triển:
npm install --include=dev --save-dev --save-exact ten-cong-cu@phien-ban
```

Không dùng `--force`, `--legacy-peer-deps` hoặc `npm audit fix --force` để bỏ qua incompatibility. Sau cài, xem diff của cả manifest và lockfile: chỉ dependency mới cùng dependency bắc cầu cần thiết nên đổi. Cài đặt thất bại phải sửa nguyên nhân và kiểm tra cây dependency trước khi báo hoàn tất.

Kiểm tra audit có cả devDependencies khi rà dependency. Snapshot lần này đã vá Next lên 16.3.8 và brace-expansion bằng patch tương thích. Audit còn hai mục moderate cùng advisory của Vitest/@vitest/mocker trong tooling phát triển; không mặc định nâng major runner hoặc ép override khi chưa kiểm tra migration. Đây là trạng thái 04/10/2026, phải audit lại ở lần cài tiếp theo.

## Kiểm tra từ source sạch

```powershell
# Dừng next dev/build trước khi clean.
npm run clean
npm run typecheck
npm run lint
npm test
npm run build
npm run start
```

`typecheck` chạy `next typegen` trước `tsc --noEmit`, nên không phụ thuộc `.next` hoặc `next-env.d.ts` có sẵn. `clean` chỉ xóa output build/test và file type sinh tự động, không xóa source, node_modules, cấu hình môi trường hoặc QA. Script từ chối khi còn lock của Next; nếu process crash để lại lock, xác minh process đã dừng trước khi xử lý lock. Không clean `.next` trong lúc preview production vẫn đang dùng nó.

`dev`, `build`, `start` dùng cross-env để đặt NODE_ENV đúng theo lệnh trên Windows/Linux. Chỉ có **một** `next.config.ts` và `eslint.config.js`; Next sinh type vào `.next/types` hoặc `.next/dev/types`, không thêm đường dẫn `.next/dev/dev/types`. Đọc `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md` khi thay workflow typegen/build.

Trước khi mở preview, kiểm tra server đang có. `EADDRINUSE :3000` thường là phiên dev cũ: chỉ dừng server do agent mở đã được xác minh, không kill tất cả Node hoặc tắt tiến trình của người dùng. Dùng :3001 cho preview riêng khi cần. Kết thúc kiểm tra phải dừng server do agent mở, trừ khi người dùng muốn giữ chạy; xác nhận cổng preview đã được giải phóng. Nếu :3000 đang là phiên do người dùng mở, giữ nguyên và giải thích rằng chạy thêm một phiên cùng cổng sẽ báo EADDRINUSE. Việc chọn port khác không sửa một process của agent còn bị bỏ quên.

Giữ `.env.example` với placeholder, `.env.local` và secret nằm ngoài Git. QA, screenshot/video/trace, node_modules, .next, next-env.d.ts, báo cáo test và tsbuildinfo đều bị ignore. Nếu đã tracked, cập nhật `.gitignore` chưa đủ: bỏ khỏi index trong commit cleanup. Chỉ push khi người dùng đã yêu cầu, không suy ra quyền publish từ việc sửa source.

## Landing và login tải lần đầu

- Nội dung và form phải hiển thị từ HTML server; không đặt opacity 0 cho form login để chờ hydration/animation. `Reveal initiallyVisible` dành cho nội dung quan trọng trên màn đầu, không thay hành vi reveal ở toàn bộ workspace.
- `WalletScene` và `LoginScene` chỉ dynamic import từ client component, `ssr: false`. Giữ Three/Fiber/Drei/GSAP ở trong graph của cảnh, không static import renderer vào layout hoặc form.
- `useDeferredScene` cho phép trình duyệt paint/hydrate trước rồi tải cảnh bằng idle callback có timeout 800ms. Login chỉ tải cảnh khi viewport **>900px**, đúng breakpoint CSS; mobile không tải Three chỉ để vẽ một cảnh display:none. Resize desktop phải vẫn khởi tạo lại đúng vị trí. Nội dung không đợi WebGL, font canvas hoặc Google GIS tải xong.
- Landing dựng ví trước; `SecondaryScenes` dựng chương gần mốc cuộn rồi giữ những chương đã xem. Không biên dịch vật liệu kính và tạo toàn bộ texture/hình học của năm chương ngay lúc vào trang. Giữ tư thế theo progress khi nhảy chương/cuộn ngược, và giảm chuyển động/fallback WebGL.
- Scene vẫn cần cleanup idle callback, timer, observer và tài nguyên GPU. Không preload toàn bộ scene trên mobile hoặc khóa pointer/scroll trong khi tải. Không giảm chất lượng model tùy tiện để che lỗi bundle.
- Landing dùng `ui/WalletPlaceholder` từ HTML đầu tiên và giữ nó qua cả dynamic import lẫn khởi tạo WebGL. `three/SceneReady` báo sau một frame thực sự; chỉ khi đó mới ẩn placeholder. Desktop pinned đặt hình dự phòng ở tâm 72% giống StageComposition, tablet/mobile/non-pinned đặt ở giữa vùng art. Không đặt ví 2D ở giữa toàn Canvas desktop hoặc coi `onCreated` là model đã hiển thị. WebGL thiếu/lost/error vẫn giữ artwork và CTA, khóa tương tác model khi chưa sẵn sàng. Test `initial-loading.spec.ts` giữ chunk renderer chậm rồi mở, cùng trường hợp WebGL tắt, để bắt khoảng trống lúc tải lần đầu.
- Login cũng giữ một fallback duy nhất đến frame đầu và khi mất WebGL; reset trạng thái sẵn sàng khi chuyển về mobile để resize lên desktop không bỏ qua fallback. Không render đồng thời fallback từ Canvas/error boundary và từ overlay. Lỗi renderer không được làm mất form hoặc mã email đang nhập.

Đọc guide `lazy-loading.md` và `package-bundling.md` trong Next cài đặt khi thay import graph. Đo bản production sau build, không gọi lần biên dịch route đầu của `next dev` là tốc độ production.

```powershell
# Trong terminal riêng, chạy bản production trên :3001.
npm exec -- cross-env NODE_ENV=production next start --port 3001
node scripts/audit-initial-load.mjs
```

Script đo cold cache với CPU throttle 4x ở 390/1440px, ghi FCP/LCP, JS tải, long task, ảnh và nội dung khi JS tắt vào QA. Nó chặn API và Google cho lần đo; số đo không đại diện cho độ trễ backend/OAuth thật. So sánh cùng máy/cấu hình và không khẳng định một lần đo là mức cải thiện cố định. Kiểm tra form hoạt động trong khi 3D chưa tải, mobile không tải chunk renderer, resize, chuyển chương và cuộn ngược bằng test phù hợp.

## Cleanup có căn cứ

Tra import/route/test/script trước khi bỏ file; một export không dùng trong UI có thể được test hoặc generator dùng. Các demo modal cũ FinanceDialog/WalletDemo/Modal/Toast/useFinance đã bỏ, thông báo và modal thật dùng `ui/Notifications`/`ui/WorkspaceModal`. Không phục hồi demo tài chính localStorage vào flow backend.

Các file Markdown lịch sử navbar/palmo ở root và ảnh QA cũ đã dọn. Giữ README, AGENTS/CLAUDE, API flow coverage, skill, capture scripts và tests hiện hành. Git lưu lịch sử source; tài liệu hiện hành không nên trở thành danh sách phiên bản thử UI đã bỏ.
