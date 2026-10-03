# Storytelling Home v4

Bản này đổi Home từ một hero 3D lớn thành một câu chuyện scroll liên tục.

## Narrative

1. **Rối** — ví, thẻ, hóa đơn bắt đầu hơi lệch và tự tìm về đúng chỗ.
2. **Chia** — khoản chung tách thành ba phần, ưu tiên cảm giác “nhìn là hiểu”.
3. **Gọn** — hóa đơn đi vào trung tâm và đóng dấu hoàn tất.
4. **Rõ** — scene 3D mới hiển thị bức tranh dòng tiền bằng panel + bar chart.
5. **Mơ** — coin rơi vào hũ dành dụm, kết thúc bằng cảm giác nhẹ và có khoảng thở.

Sau cinematic story là một **resolution section** màu vàng: “Vẫn là tiền của bạn. Chỉ là dễ thở hơn.”, rồi mới đi vào các phần sản phẩm thật.

## UI changes

- Giảm zoom object, giữ full-width canvas nhưng chừa safe area lớn hơn.
- Copy của từng chapter đổi vị trí trái/phải để tạo nhịp editorial, không center mọi thứ.
- Bottom chapter navigation có 5 chapter và rail liên tục.
- Pointer parallax nhẹ hơn; drag bị giới hạn và tự trở về pose mặc định khi thả chuột.
- Camera movement nhẹ hơn để 3D có chiều sâu mà không “đập vào mặt”.
- Thêm `InsightsScene` 3D cho đoạn “Nhìn rõ”.
- Thay marquee cũ bằng `StoryResolution` để flow không bị ngắt như landing page template.
- Copy ở Features / Overview / Dreams được nối tiếp cùng một câu chuyện thay vì reset thành các section độc lập.

## Validation performed

- TypeScript/TSX syntax checked with the TypeScript compiler API for every modified file.
- `styles.css` and `story.css` parsed with `tinycss2`: 0 parse errors.
- No dependency was added, so `package-lock.json` stays unchanged.
- Full Next.js/Playwright rendering was not run because the execution environment could not complete `npm ci` from the npm registry.
