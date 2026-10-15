# Splitly: giữ UI gốc khi tinh chỉnh thiết kế

Yêu cầu được người dùng làm rõ ngày 14/10/2026: giữ UI gốc, dark tím và light xanh; chỉ sửa các chi tiết đã bị công cụ đề cập là quá giống UI dựng bằng AI. Yêu cầu này thay thế các quyết định đổi sang đất nung hoặc petrol trong phiên trước.

## Giữ nhận diện và cấu trúc

- Giữ dark charcoal tím/lavender, light xanh, Be Vietnam Pro cho UI và Barlow Condensed cho heading. Đọc palette thực tế trong CSS và `SceneTheme.tsx`; không recolor toàn repo hoặc đổi hệ theme để giảm điểm detector.
- Giữ composition của landing: hero và timeline 3D, phần chuyển tiếp, ba thẻ minh họa ví/hóa đơn/hũ tiền, dashboard preview có biểu đồ, các thẻ tình huống và FAQ/footer. Không thay các section này bằng hàng văn bản, hóa đơn tính thử hoặc layout khác nếu người dùng không yêu cầu.
- Giữ navbar gốc, thẻ bo góc, góc nghiêng của preview, vật liệu, ánh sáng, quỹ đạo 3D và cơ chế tương tác. Không loại bỏ một chi tiết chỉ vì nó cũng xuất hiện trong UI do AI tạo.

## Chỉ sửa phần có căn cứ

- Cập nhật ngày 15/10/2026: người dùng không thích sidebar mới và yêu cầu khôi phục sidebar cũ. Giữ panel nổi bo góc, icon cạnh nhãn, nhóm dạng cây và mục đang chọn có nền/khung/chấm như bản gốc. Giữ `aria-current`, focus bàn phím, thu gọn desktop, tooltip và drawer mobile; giữ dark tím, light xanh. [sidebar-review.md](sidebar-review.md) là nghiên cứu và lịch sử thử nghiệm đã bị từ chối, không phải yêu cầu áp dụng mục lục chữ/gạch chân.

- Giảm icon trang trí lặp lại cạnh nhãn đã rõ nghĩa, mũi tên trang trí và ký hiệu hoa/ngôi sao làm bullet. Giữ icon cho menu, đóng, theme, xoay 3D, điều hướng, thanh toán và các hình minh họa có ý nghĩa. Giữ dấu xác nhận trong stamp thanh toán.
- Hiển thị các khối nội dung ngay từ HTML đầu tiên. Không fade-in hoặc slide-up hàng loạt khi vào trang. Giữ chuyển động phản hồi hover, disclosure/modal, đổi theme và timeline theo cuộn; tôn trọng reduced-motion.
- Chỉnh dấu gạch dài trong prose khi dấu phẩy hoặc câu mới tự nhiên hơn. Giữ giọng văn, heading và nội dung gốc. Không thay toàn bộ copy, xóa số liệu minh họa hoặc thêm tính năng khác để chạy theo detector.
- Giữ nhãn minh họa của preview; ví dụ không được biến thành dữ liệu tài khoản thật. Không đổi API hoặc nghiệp vụ trong một lần cleanup giao diện.
- Khi tiêu chí detector xung đột với nhận diện đã được người dùng yêu cầu giữ, ưu tiên yêu cầu của người dùng. Không đổi framework hoặc hứa đạt một mức điểm AI cố định.

## Sửa và kiểm tra

Đọc cascade: `styles.css` → `story.css` → `navbar.css` → `experience.css` → `workspace.css` → `splitly.css` → `refinement.css` → `universe.css` → `theme.css` → `public/offline.css`. Dark dùng các màu gốc; light dùng semantic token và đổi vật liệu 3D sang xanh. Không thêm stylesheet thay toàn bộ identity chỉ để tinh chỉnh vài chi tiết.

Giữ diff nhỏ và đối chiếu ảnh UI gốc trước khi kết thúc. Kiểm tra các thẻ minh họa và dashboard preview vẫn tồn tại, typography/khung/layout vẫn đúng; kiểm tra dark tím, light xanh, mobile và độ tương phản. Chạy type/lint/format cho file sửa, build khi đổi component/import, và các test liên quan đến landing, theme, cuộn 3D, CTA/FAQ/menu. Dùng backend mock cho kiểm tra thao tác ghi. Ghi rõ giới hạn thực tế nếu chưa chạy lại công cụ chấm UI.
