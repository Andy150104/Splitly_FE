# Splitly — UI/UX Redesign & Product Design Guide

> Mục tiêu: nâng Splitly từ giao diện “đủ dùng” thành một sản phẩm quản lý chi tiêu/chia tiền có cảm giác hiện đại, rõ ràng, đáng tin cậy và thao tác nhanh.
>
> Phạm vi: áp dụng cho **toàn hệ thống** gồm Dashboard, Hóa đơn, Nhóm, Thành viên, Thanh toán, QR/Bank transfer, xác thực, thông báo và các trạng thái hệ thống.

---

## 1. Định hướng phong cách tổng thể

### 1.1. Tính cách thương hiệu

Splitly nên mang cảm giác:

- **Tin cậy**: liên quan tới tiền nên dữ liệu, trạng thái và hành động phải rõ ràng.
- **Nhẹ nhàng**: tránh giao diện kiểu banking quá nặng nề.
- **Hiện đại**: nhiều khoảng thở, typography sạch, border tinh tế, icon nhất quán.
- **Nhanh**: người dùng phải thấy ngay “ai còn nợ”, “bao nhiêu tiền”, “cần làm gì tiếp theo”.
- **Thân thiện với nhóm bạn**: wording gần gũi, không quá “enterprise”.

### 1.2. Design language đề xuất

Phong cách: **Clean Financial SaaS + Friendly Social Utility**.

Tham chiếu tinh thần thiết kế:

- Linear: spacing, hierarchy, command feeling.
- Stripe: tính tin cậy, bố cục số liệu.
- Wise/Revolut: money UI rõ ràng, dễ quét mắt.
- Splitwise: logic chia tiền đơn giản nhưng Splitly nên hiện đại hơn về visual.

Không nên:

- Dùng quá nhiều card trắng giống nhau.
- Viền xám ở mọi nơi.
- Text nhỏ quá nhiều.
- Mỗi trạng thái dùng một màu ngẫu nhiên.
- Dùng icon decorative quá nhiều nhưng không giúp thao tác.

---

## 2. Các vấn đề UI hiện tại nhìn từ màn hình mẫu

### 2.1. Content đang quá nhỏ so với viewport

Màn hình desktop rộng nhưng content chỉ chiếm một phần trung tâm, tạo cảm giác trống lớn.

**Đề xuất:**

- Container chính: `max-width: 1280–1440px`.
- Trên desktop lớn có thể cho content rộng tới `calc(100vw - sidebar - 64px)`.
- Không nên để card thanh toán chỉ rộng khoảng một nửa màn hình nếu dữ liệu đủ để hiển thị tốt hơn.

### 2.2. Hierarchy chưa mạnh

Tên hóa đơn, trạng thái, tổng tiền, tiến độ đang có nhưng chưa có “điểm bắt mắt” chính.

Người dùng mở trang chi tiết hóa đơn cần trả lời ngay 4 câu:

1. Hóa đơn này là gì?
2. Tổng bao nhiêu?
3. Đã thu bao nhiêu?
4. Ai chưa trả?

**Đề xuất:** tạo một `Bill Summary Header` rõ ràng hơn.

### 2.3. Khu vực topbar đang hơi lãng phí

Hiện tại topbar có slogan bên trái và user bên phải nhưng không hỗ trợ thao tác chính.

Nên tận dụng để chứa:

- Breadcrumb.
- Global search / quick search.
- Nút `+ Tạo hóa đơn`.
- Notifications.
- Profile menu.

### 2.4. Card thành viên đang chứa quá nhiều thông tin ngang

Tên, email, số tiền, trạng thái, lịch sử thanh toán nằm cùng một vùng khiến mắt phải chạy xa.

**Đề xuất:** tách layout thành:

- Trái: avatar + người dùng.
- Giữa: số tiền phải trả / đã trả.
- Phải: trạng thái + action.
- Expandable panel phía dưới: lịch sử giao dịch.

### 2.5. “Đã thanh toán” vẫn hiển thị “0đ còn lại” hơi thừa

Khi trạng thái đã complete, có thể ưu tiên:

- `Đã thanh toán 1.312.321đ`
- timestamp
- payment method

thay vì giữ một dòng “0đ còn lại” quá nổi.

---

# 3. App Shell mới cho toàn hệ thống

## 3.1. Sidebar có thể đóng/mở

Đây nên là thay đổi bắt buộc.

### Expanded state

Chiều rộng đề xuất: `240–256px`.

Hiển thị:

- Logo + chữ `Splitly`.
- Navigation icon + label.
- Group navigation nếu có.
- Bottom area: Help / Settings / Logout.

Ví dụ:

```text
┌────────────────────────┐
│  [S] Splitly       [<<]│
│                        │
│  ▣  Tổng quan          │
│  ▤  Hóa đơn            │
│  ◉  Nhóm               │
│  ♙  Thành viên         │
│                        │
│  QUẢN LÝ               │
│  ⚙  Cài đặt            │
│                        │
│────────────────────────│
│  ?  Trợ giúp           │
│  ↪  Đăng xuất          │
└────────────────────────┘
```

### Collapsed state

Chiều rộng: `64–72px`.

Chỉ hiển thị:

- Logo icon.
- Menu icon.
- Tooltip khi hover.
- Active indicator.

```text
┌───────┐
│ [S] > │
│       │
│  ▣    │
│  ▤    │
│  ◉    │
│  ♙    │
│       │
│  ⚙    │
│       │
│  ?    │
│  ↪    │
└───────┘
```

### UX behavior

- Desktop: lưu trạng thái collapsed bằng `localStorage` hoặc user preference.
- Tablet: mặc định collapsed.
- Mobile: sidebar trở thành `drawer` từ bên trái.
- Nút toggle luôn nằm cạnh logo.
- Hover icon khi collapsed phải có tooltip trong khoảng `300–500ms`.

### Transition

```css
transition: width 180ms ease;
```

Không nên animation dài hơn 250ms.

---

## 3.2. Topbar mới

Chiều cao: `64px`.

Bố cục:

```text
Breadcrumb / Page context    Search          + Tạo hóa đơn   Bell   Avatar
```

Ví dụ trang Bill detail:

```text
Hóa đơn / YouTube Premium / Tháng 8
```

Bên phải:

- `+ Tạo hóa đơn` — primary action.
- Notification bell.
- User avatar dropdown.

Slogan có thể chuyển về dashboard welcome state thay vì nằm cố định trên mọi màn hình.

---

# 4. Grid và spacing system

Sử dụng hệ spacing theo 4/8px.

| Token | Value | Dùng cho |
|---|---:|---|
| `space-1` | 4px | icon/text nhỏ |
| `space-2` | 8px | text pair |
| `space-3` | 12px | compact controls |
| `space-4` | 16px | component padding |
| `space-5` | 20px | form blocks |
| `space-6` | 24px | card padding |
| `space-8` | 32px | section spacing |
| `space-10` | 40px | page section lớn |
| `space-12` | 48px | hero/major separation |

### Page padding

- Desktop: `32px` horizontal.
- Tablet: `24px`.
- Mobile: `16px`.

### Card radius

- Default: `12px`.
- Modal / prominent cards: `16px`.
- Pill badge: `999px`.

---

# 5. Color system

Không nên dùng màu trực tiếp theo từng component. Tạo semantic tokens.

## 5.1. Primary

Blue là hợp lý với Splitly vì tạo cảm giác tin cậy.

Ví dụ:

```text
Primary 500: #2563EB
Primary 600: #1D4ED8
Primary 50 : #EFF6FF
```

## 5.2. Semantic colors

```text
Success  : Green
Warning  : Amber
Danger   : Red
Info     : Blue
Neutral  : Gray/Slate
```

### Mapping trạng thái tài chính

| Status | Màu | Ý nghĩa |
|---|---|---|
| Đã thanh toán | Green | complete |
| Chờ thanh toán | Amber | pending |
| Quá hạn | Red | attention |
| Một phần | Blue | partial |
| Đã hủy | Gray | inactive |

Không nên chỉ dùng màu. Luôn kèm text hoặc icon.

---

# 6. Typography

Đề xuất: `Inter`, `Geist`, `SF Pro`, hoặc `Roboto` nếu cần phổ thông.

## Hierarchy

```text
Page title       28px / 700
Section title    18px / 600
Card title       15–16px / 600
Body             14px / 400
Secondary text   13px / 400
Caption          12px / 400
Financial value  20–24px / 700
```

Tiền nên dùng `tabular-nums` để số canh thẳng và dễ đọc.

```css
font-variant-numeric: tabular-nums;
```

---

# 7. Dashboard — nên thiết kế lại như “control center”

Dashboard không chỉ là overview đẹp mà phải trả lời “tôi cần làm gì?”.

## 7.1. Hero summary

```text
Chào Duy Anh 👋
Bạn còn 3 khoản đang chờ thanh toán trong tháng này.
```

Kèm CTA:

- `Tạo hóa đơn`.
- `Tạo nhóm`.

## 7.2. Financial summary cards

Không quá 4 card:

- Tổng đang chia.
- Đã thu.
- Chờ thu.
- Quá hạn.

Card nên có trend/context thay vì chỉ số trần.

Ví dụ:

```text
Chờ thu
2.450.000đ
3 người • 2 hóa đơn
```

## 7.3. “Cần bạn xử lý”

Một section cực quan trọng:

```text
Cần bạn xử lý

• YouTube Premium — 2 người chưa thanh toán
  Gửi nhắc nhở

• Trip Đà Lạt — 1 khoản quá hạn 3 ngày
  Xem chi tiết
```

Đây sẽ tăng UX hơn nhiều so với chỉ dashboard thống kê.

## 7.4. Recent activity

Timeline:

- Minh đã thanh toán 120.000đ.
- Bạn tạo bill Netflix.
- Lan tham gia nhóm Đà Lạt.

---

# 8. Trang Hóa đơn — list view

## 8.1. Header

```text
Hóa đơn
Theo dõi và quản lý các khoản chia tiền.

[Search] [Status filter] [Group] [Date] [+ Tạo hóa đơn]
```

## 8.2. Filter UX

Có quick chips:

- Tất cả.
- Đang thu.
- Đã thanh toán.
- Quá hạn.

Advanced filter mở popover.

## 8.3. Bill list

Desktop nên dùng bảng hoặc hybrid card-row thay vì card lớn.

Columns:

- Hóa đơn.
- Nhóm.
- Tổng tiền.
- Đã thu.
- Tiến độ.
- Hạn thanh toán.
- Trạng thái.
- Action.

### Row example

```text
YouTube Premium
Nhóm Bạn Thân
1.312.321đ       970.000đ      ███████░ 74%      12/08     Đang thu   ...
```

### Action menu

`...`:

- Xem chi tiết.
- Chỉnh sửa.
- Gửi nhắc nhở.
- Copy link.
- Hủy hóa đơn.

Không nên đặt quá nhiều button trực tiếp trên row.

---

# 9. Trang Chi tiết Hóa đơn — redesign theo màn hình hiện tại

## 9.1. Bill Header

Hiện tại header hơi “chìm”. Nên chuyển thành:

```text
← Hóa đơn

YouTube Premium                         [Đã thanh toán]
Tháng 8/2026 • Nhóm Bạn thân

1.312.321đ
Tổng hóa đơn

[Chỉnh sửa] [Chia sẻ] [...]
```

Nếu bill chưa hoàn tất:

```text
[Nhắc thanh toán] [Sao chép link] [...]
```

## 9.2. Summary cards

Hiện tại có 4 card ngang là hợp lý nhưng nên làm rõ hơn.

### Card 1 — Tổng hóa đơn

```text
1.312.321đ
Tổng hóa đơn
```

### Card 2 — Đã thu

```text
1.312.321đ
Đã thu
100% tổng tiền
```

### Card 3 — Còn lại

```text
0đ
Còn phải thu
```

### Card 4 — Thành viên

```text
1 / 1
Đã thanh toán
```

Nếu còn người chưa trả, card này nên là:

```text
3 / 5
Đã thanh toán
2 người đang chờ
```

## 9.3. Payment progress

Hiện progress bar quá dài nhưng hơi ít thông tin.

Nên hiển thị:

```text
Tiến độ thanh toán                 100%
1.312.321đ / 1.312.321đ
████████████████████████████████████
```

Nếu có nhiều thành viên có thể thêm milestone dots hoặc stacked segments.

## 9.4. Members & Payment section

Đề xuất card row mới:

```text
┌────────────────────────────────────────────────────────────┐
│ [DU]  Duy Anh Trần                         ĐÃ THANH TOÁN    │
│       tranduyanh...@gmail.com                              │
│                                                            │
│       Phải trả          Đã trả             Còn lại         │
│       1.312.321đ        1.312.321đ          0đ             │
│                                                            │
│       Thanh toán lúc 13:48 • Chuyển khoản ngân hàng       │
│                                                   [∨]      │
└────────────────────────────────────────────────────────────┘
```

### Khi chưa thanh toán

```text
[Nhắc thanh toán] [Copy payment link]
```

### Khi expandable

Show timeline:

```text
13:48 — Thanh toán thành công — Bank transfer — 1.312.321đ
13:47 — Payment pending
13:45 — Payment link opened
```

Không cần expose kỹ thuật quá nhiều cho user phổ thông.

---

# 10. Trang Nhóm

## 10.1. Group overview

Card nhóm nên show:

- Tên nhóm.
- Avatar nhóm.
- Số thành viên.
- Tổng tiền đang chia.
- Các khoản pending.
- Latest activity.

Ví dụ:

```text
Đà Lạt 2026
5 thành viên
3 hóa đơn • 2.800.000đ đang chờ
```

## 10.2. Group detail tabs

```text
Tổng quan | Hóa đơn | Thành viên | Hoạt động
```

### Tổng quan

- Tổng chi.
- Ai đang nợ ai.
- Activity.

### Hóa đơn

- Bill list filtered theo group.

### Thành viên

- Member list.
- Role.
- Tổng đã trả / còn phải trả.

---

# 11. Flow tạo hóa đơn — cần tối ưu UX mạnh

Không nên nhồi toàn bộ form vào một màn hình dài.

Đề xuất wizard 4 bước:

```text
1. Thông tin
2. Người tham gia
3. Cách chia
4. Xác nhận
```

## Step 1 — Thông tin

Fields:

- Tên hóa đơn.
- Tổng tiền.
- Ngày.
- Hạn thanh toán.
- Nhóm (optional).
- Ghi chú.

## Step 2 — Người tham gia

Cho phép:

- Chọn member từ group.
- Nhập email mới.
- Paste nhiều email cùng lúc.

Display như chips.

## Step 3 — Cách chia

Options dạng card:

```text
○ Chia đều
○ Theo số tiền
○ Theo phần trăm
○ Theo tỷ lệ
```

Thay đổi option phải preview ngay.

Ví dụ:

```text
Duy Anh     250.000đ
Minh        250.000đ
Lan         250.000đ
```

## Step 4 — Xác nhận

Hiển thị full summary trước khi tạo.

Primary CTA:

`Tạo hóa đơn & gửi lời mời`.

Secondary:

`Lưu nháp`.

---

# 12. UX cho QR / Bank Transfer

Vì sản phẩm có payment flow, đây là screen rất quan trọng.

## Payment page nên cực sạch

```text
Bạn cần thanh toán
250.000đ
cho YouTube Premium

[ QR CODE ]

Ngân hàng: MB Bank
STK: 0123456789
Người nhận: DUY ANH TRAN
Nội dung: SPLITLY A8X2KD

[Đã thanh toán]
```

### Quan trọng

- Số tiền phải rất nổi.
- QR phải đủ lớn.
- Có nút copy số tài khoản / nội dung.
- Payment reference nên unique và dễ parse backend.
- Sau khi hệ thống detect thanh toán, UI tự chuyển state:

```text
✓ Thanh toán thành công
250.000đ
13:48, 08/08/2026
```

### Polling / realtime

Trong lúc chờ:

```text
Đang chờ xác nhận thanh toán…
```

Không nên để user spam refresh.

---

# 13. Empty states

Đây là phần giúp UX “có cảm giác hoàn thiện”.

## Hóa đơn trống

```text
Bạn chưa có hóa đơn nào
Tạo hóa đơn đầu tiên để bắt đầu chia tiền cùng bạn bè.

[+ Tạo hóa đơn]
```

## Nhóm trống

```text
Chưa có nhóm nào
Tạo nhóm cho chuyến đi, phòng trọ hoặc subscription chung.

[Tạo nhóm]
```

Empty state nên có icon/illustration nhỏ, không cần artwork quá lớn.

---

# 14. Loading states

Không nên spinner toàn màn hình cho các page thông thường.

Sử dụng Skeleton:

- Page title skeleton.
- Summary card skeleton.
- Table row skeleton.

Button submit:

```text
[Đang tạo hóa đơn…]
```

Disable trong khi request chạy để tránh double submit.

---

# 15. Error states

## API error

Không show raw backend message nếu message kỹ thuật.

Bad:

```text
500 Internal Server Error
```

Better:

```text
Không thể tải hóa đơn
Đã có lỗi xảy ra. Vui lòng thử lại.

[Thử lại]
```

## Form validation

Validation hiển thị ngay dưới field.

```text
Email
[ abc@ ]
Email chưa đúng định dạng.
```

Không gom tất cả lỗi thành toast.

---

# 16. Toast & Notification system

Toast nên dùng cho confirmation ngắn:

```text
✓ Đã sao chép link thanh toán
✓ Đã gửi nhắc nhở tới Minh
✓ Hóa đơn đã được tạo
```

Toast duration: khoảng 3–5 giây.

Không dùng toast cho error cần user action quan trọng.

---

# 17. Confirm dialogs

Chỉ confirm cho destructive action.

Ví dụ:

```text
Hủy hóa đơn này?
Các thành viên sẽ không thể tiếp tục thanh toán qua link hiện tại.

[Quay lại] [Hủy hóa đơn]
```

Không hỏi confirm cho những hành động có thể undo dễ dàng.

---

# 18. Search UX

Global search trong topbar có thể search:

- Bill name.
- Group.
- Member email/name.

Shortcut:

```text
Ctrl / Cmd + K
```

Mở command palette:

```text
Tìm hóa đơn, nhóm, thành viên…
```

Có thể thêm quick actions:

- Tạo hóa đơn.
- Tạo nhóm.
- Mời thành viên.

---

# 19. Responsive design

## Desktop ≥ 1280px

- Expanded sidebar mặc định.
- Summary 4 cards ngang.
- Table full columns.

## Tablet 768–1279px

- Sidebar collapsed.
- Summary 2x2.
- Table có thể hide cột phụ.

## Mobile < 768px

- Sidebar → drawer.
- Topbar chỉ: hamburger + title + avatar.
- Summary cards thành horizontal scroll hoặc 2x2.
- Member row thành card vertical.
- Sticky bottom CTA cho flow payment/create.

---

# 20. Accessibility

Tối thiểu nên đảm bảo:

- Contrast đạt WCAG AA.
- Touch target ít nhất `40–44px`.
- Keyboard navigation.
- Focus ring rõ ràng.
- Icon-only button có `aria-label`.
- Không biểu diễn status chỉ bằng màu.
- Modal phải trap focus.

Ví dụ:

```html
<button aria-label="Thu gọn thanh điều hướng">
  ...
</button>
```

---

# 21. Interaction & Micro-animation

Animation chỉ nên giúp user hiểu state change.

Nên có:

- Sidebar collapse: 180ms.
- Accordion member expand: 160–200ms.
- Hover card: border/shadow subtle.
- Button press feedback.
- Progress update animation.
- Success check animation khi payment complete.

Không nên:

- Bounce.
- Scale quá mạnh.
- Animation > 300ms cho navigation thường.

---

# 22. Component system đề xuất

Tạo component reusable, không build page bằng div random.

## Navigation

```text
AppSidebar
SidebarItem
SidebarGroup
Topbar
Breadcrumbs
UserMenu
CommandMenu
```

## Data display

```text
StatCard
MoneyValue
StatusBadge
ProgressBar
Avatar
MemberRow
ActivityItem
Timeline
EmptyState
```

## Actions

```text
Button
IconButton
DropdownMenu
ConfirmDialog
CopyButton
```

## Forms

```text
TextField
MoneyInput
EmailInput
Select
DatePicker
MemberPicker
SplitMethodPicker
```

## Feedback

```text
Toast
Alert
Skeleton
ErrorState
LoadingButton
```

---

# 23. Naming & wording UX

Wording nên nhất quán và dễ hiểu.

### Nên dùng

- `Còn phải thu` thay vì `Còn lại` nếu context là chủ bill.
- `Bạn cần thanh toán` nếu context là payer.
- `Đã thu` nếu là owner.
- `Đã trả` nếu là participant.

### Status

Không nên dùng cùng một từ cho mọi perspective.

Ví dụ owner thấy:

```text
Đã thu 250.000đ
```

Participant thấy:

```text
Bạn đã thanh toán 250.000đ
```

---

# 24. Information architecture đề xuất

Sidebar:

```text
Tổng quan
Hóa đơn
Nhóm

---

Hoạt động       (optional)
Thông báo       (optional)

---

Cài đặt
```

`Thành viên` không nhất thiết phải là menu global nếu member chủ yếu tồn tại trong Group. Nếu hệ thống có use case quản lý contact/member global thì giữ lại.

---

# 25. Quick actions để tăng trải nghiệm

## Bill row hover

Show quick icons:

```text
Copy link | Nhắc | ...
```

## Member pending payment

One-click:

```text
Nhắc thanh toán
```

Sau khi click:

```text
✓ Đã gửi nhắc nhở • 13:52
```

Disable gửi lại trong một khoảng ngắn để tránh spam.

## Copy action

Sau copy:

```text
✓ Đã sao chép
```

Button text đổi trong 1–2 giây sẽ dễ hiểu hơn chỉ toast.

---

# 26. Personalization nhỏ nhưng hiệu quả

Dashboard greeting có thể dựa thời gian:

```text
Chào buổi sáng, Duy Anh 👋
```

Nhưng chỉ nên dùng ở Dashboard, không dùng mọi page.

Có thể thêm:

- Recent groups.
- Frequently used members.
- Default split method.
- Last selected group.

để giảm số click khi tạo hóa đơn.

---

# 27. Dark mode

Không bắt buộc MVP nhưng nếu làm thì design token phải hỗ trợ từ đầu.

Không hard-code:

```css
background: #ffffff;
```

Dùng:

```css
background: var(--surface-primary);
```

---

# 28. Design tokens cơ bản

Ví dụ:

```css
:root {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-muted: #f1f5f9;

  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;

  --border-default: #e2e8f0;

  --primary: #2563eb;
  --primary-hover: #1d4ed8;

  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

---

# 29. Layout đề xuất cho màn hình trong ảnh

```text
┌────────────Sidebar────────────┬──────────────────────────────────────────────────────┐
│ Splitly                [<<]   │ Hóa đơn / dfsdf                         [+ Tạo bill] │
│                               ├──────────────────────────────────────────────────────┤
│ Tổng quan                     │                                                      │
│ Hóa đơn                       │ dfsdf                              [Đã thanh toán]   │
│ Nhóm                          │ Theo dõi tiến độ thanh toán                          │
│                               │                                                      │
│                               │ 1.312.321đ                                           │
│                               │ Tổng hóa đơn                                         │
│                               │                                                      │
│                               │ [Tổng] [Đã thu] [Còn phải thu] [Thành viên]         │
│                               │                                                      │
│                               │ Tiến độ  ███████████████████████████ 100%            │
│                               │                                                      │
│                               │ Thành viên                                           │
│                               │ ┌──────────────────────────────────────────────┐     │
│                               │ │ DU Duy Anh         1.312.321đ   Đã thanh toán │    │
│                               │ │ 13:48 • Bank transfer                    ∨   │     │
│                               │ └──────────────────────────────────────────────┘     │
│                               │                                                      │
│ Cài đặt                       │                                                      │
│ Đăng xuất                     │                                                      │
└───────────────────────────────┴──────────────────────────────────────────────────────┘
```

Điểm quan trọng: **content phải tận dụng chiều rộng tốt hơn** và hierarchy phải tập trung vào `amount`, `payment progress`, `pending member`.

---

# 30. Các cải tiến ưu tiên theo impact

## P0 — Nên làm trước

1. Sidebar collapsible + responsive drawer.
2. Topbar mới với breadcrumb + primary action.
3. Chuẩn hóa typography / spacing / color token.
4. Redesign bill detail hierarchy.
5. Responsive mobile.
6. Empty/loading/error states.
7. Standard component system.

## P1 — Tăng UX rõ rệt

1. Create bill wizard.
2. Search + filter tốt hơn.
3. One-click payment reminder.
4. Member payment expandable timeline.
5. Toast / feedback chuẩn hóa.
6. Dashboard “Cần bạn xử lý”.

## P2 — Product polish

1. Command palette `Cmd/Ctrl + K`.
2. Dark mode.
3. Recent members / smart defaults.
4. Realtime payment confirmation.
5. Activity center.

---

# 31. UX metrics nên theo dõi

Nếu muốn đánh giá redesign có hiệu quả hay không, track:

- Time to create bill.
- % user hoàn thành create-bill flow.
- Số bước trung bình để gửi payment reminder.
- Time from bill detail → payment action.
- Payment conversion rate.
- Drop-off ở từng step trong create bill wizard.
- Mobile completion rate.
- Error rate trên form.

---

# 32. Checklist trước khi release UI

## Visual

- [ ] Tất cả page dùng cùng spacing system.
- [ ] Font size body không nhỏ hơn 14px trên desktop.
- [ ] Card radius nhất quán.
- [ ] Status badge semantic.
- [ ] Currency formatting nhất quán.
- [ ] Icon set duy nhất.

## UX

- [ ] Mọi action quan trọng đều có feedback.
- [ ] Mọi empty state có CTA.
- [ ] Mọi error state có cách retry/recover.
- [ ] Destructive action có confirm.
- [ ] Form error nằm cạnh field.

## Responsive

- [ ] Sidebar collapse desktop.
- [ ] Sidebar drawer mobile.
- [ ] Table có mobile alternative.
- [ ] CTA dễ bấm bằng một tay.

## Accessibility

- [ ] Keyboard usable.
- [ ] Focus visible.
- [ ] Contrast AA.
- [ ] Icon buttons có label.
- [ ] Status không phụ thuộc chỉ vào màu.

---

# 33. Hướng implementation frontend

Nếu frontend là Next.js/React, nên tổ chức UI shell như sau:

```text
src/
├── components/
│   ├── app-shell/
│   │   ├── app-sidebar.tsx
│   │   ├── sidebar-item.tsx
│   │   ├── topbar.tsx
│   │   └── mobile-nav.tsx
│   │
│   ├── billing/
│   │   ├── bill-summary.tsx
│   │   ├── bill-stat-card.tsx
│   │   ├── payment-progress.tsx
│   │   ├── member-payment-row.tsx
│   │   └── payment-timeline.tsx
│   │
│   ├── shared/
│   │   ├── money-value.tsx
│   │   ├── status-badge.tsx
│   │   ├── empty-state.tsx
│   │   ├── error-state.tsx
│   │   └── loading-skeleton.tsx
│
├── hooks/
│   └── use-sidebar.ts
│
└── stores/
    └── ui-store.ts
```

Sidebar state có thể quản lý bằng Zustand hoặc context nhẹ:

```text
isSidebarCollapsed
setSidebarCollapsed
mobileSidebarOpen
```

Persist preference của desktop sidebar vào localStorage.

---

# 34. Kết luận design direction

Nếu chỉ chọn một hướng để redesign Splitly, nên đi theo nguyên tắc:

> **“Tiền rõ ràng — trạng thái rõ ràng — hành động tiếp theo luôn rõ ràng.”**

Người dùng không cần thấy thật nhiều UI. Họ cần nhanh chóng biết:

- Tôi đang chia bao nhiêu?
- Ai đã trả?
- Ai chưa trả?
- Tôi cần làm gì tiếp theo?

Sidebar collapsible, topbar có action, bill summary mạnh hơn, member payment row rõ hơn và flow tạo bill từng bước sẽ là những thay đổi có impact lớn nhất cho toàn hệ thống.
