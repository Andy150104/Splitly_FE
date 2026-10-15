# Sidebar Splitly: phản hồi về thiết kế trông giống AI

## Trạng thái hiện tại: đã khôi phục sidebar gốc

Ngày 15/10/2026, người dùng từ chối bản sidebar mục lục chữ và yêu cầu quay về sidebar cũ. Source hiện giữ lại panel nổi, icon, đường nhóm dạng cây và kiểu chọn mục gốc. Các quyết định bên dưới là lịch sử thử nghiệm; không tự áp dụng lại chúng trong lần sửa sau. Ưu tiên lựa chọn mới nhất của người dùng.

Thu thập ngày 14/10/2026 từ ba thảo luận cộng đồng và hướng dẫn navigation của NN/g. Đây là nghiên cứu định tính phục vụ lần sửa sidebar, không phải khảo sát đại diện hoặc bộ phát hiện nguồn gốc UI. Các trang được người bình luận đưa làm ví dụ không được coi là bằng chứng chúng do AI tạo.

## Các bad case người dùng thường nhắc đến

| Mẫu bị chê                                                                                 | Căn cứ                                                                                                                                              | Cách dùng nhận xét này                                                                                                          |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar phẳng mặc định, icon/emoji cạnh mọi tên mục, vạch màu bên trái lặp lại             | [UXDesign: What are the top AI slop design patterns?](https://www.reddit.com/r/UXDesign/comments/1s1guo5/what_are_the_top_ai_slop_design_patterns/) | Kiểm tra ý nghĩa từng dấu. Vạch trái vốn cũng là mẫu UI thông thường; bỏ ở Splitly vì người dùng không thích phương án vừa thử. |
| Bo góc quá nhiều, icon trong ô màu, gradient viền, box lồng box, font nhỏ và phân cấp yếu  | [UI_Design: How can you tell a design is AI?](https://www.reddit.com/r/UI_Design/comments/1uchh8o/how_can_you_tell_a_design_is_ai/)                 | Xem tổ hợp và mức lặp, không cấm từng thành phần riêng lẻ. Giảm lớp trang trí trong navigation và tăng cỡ nhãn.                 |
| Chạy theo danh sách anti-AI rồi bỏ màu thương hiệu; dùng mọi section như cùng một template | [webdesign: Preventing the AI slop look](https://www.reddit.com/r/webdesign/comments/1uhuovu/preventing_the_ai_slop_look/)                          | Giữ dark tím, light xanh mà chủ sản phẩm đã chọn. Quyết định theo nội dung và tác vụ, không tự recolor hoặc thay UI gốc.        |

## Bad case trong sidebar trước lần sửa này

Các nhận định sau là đánh giá của lần review source và ảnh Splitly, không phải kết luận của cộng đồng về Splitly:

- Phương án đầu dùng nền gradient, khung bo tròn và chấm bên phải để báo cùng một trạng thái.
- Phương án tiếp theo chỉ đổi thành một vạch trái; vẫn giữ icon cạnh tất cả nhãn, đường cây và panel nổi. Nhiều lớp dấu hiệu còn lặp lại mà hierarchy thực tế chỉ là ba nhóm route.
- Nhãn route 11px cạnh nhãn nhóm viết hoa khiến nội dung cần đọc nhỏ và dày đặc. Hiệu ứng trang trí chiếm ưu tiên hơn tên đích đến.

## Quyết định thử nghiệm đã bị từ chối

Thiết kế như một mục lục của không gian quản lý khoản chung: sidebar gắn vào mép màn, nền cùng family của sản phẩm, có một đường phân cách với vùng làm việc. Giữ tên và nhóm route hiện có.

- Căn thẳng nhãn nhóm và tên mục; dùng chữ thường theo cách viết tiếng Việt thay cho mọi tiêu đề nhóm viết hoa. Tên route 15px, vùng bấm ít nhất 48px.
- Hiển thị tên mục thay cho hàng loạt icon ở chế độ mở rộng. Giữ icon và tooltip khi người dùng chủ động thu gọn; menu mobile luôn có nhãn chữ.
- Dùng chữ đậm và gạch chân màu thương hiệu cho trang hiện tại. Không dùng vạch trái, chấm, badge hoặc nền thẻ. Rail thu gọn dùng nét nhỏ dưới icon vì nhãn lúc đó không hiển thị.
- Giữ focus bàn phím, `aria-current`, nhóm có thể đóng/mở, deep link và trạng thái thu gọn. Không tạo badge số lượng giả, shortcut giả hoặc đổi API.

Đây là lựa chọn cụ thể cho Splitly. Không biến nó thành template bắt buộc áp lên mọi sản phẩm.

## Căn cứ UX để tránh làm lạ mà khó dùng

[NN/g: Menu-Design Checklist](https://www.nngroup.com/articles/menu-design/) nhấn mạnh việc báo trang hiện tại, nhãn dễ hiểu/căn trái, vùng bấm đủ lớn và dấu chỉ submenu rõ ràng. Vì vậy giữ caret cho nút đóng/mở nhóm và đánh dấu mục đang mở.

[NN/g: Left-Side Vertical Navigation](https://www.nngroup.com/articles/vertical-nav/) khuyến nghị không giấu tên mục sau icon. Sidebar hiển thị chữ theo mặc định; chế độ icon là lựa chọn thu gọn của người dùng, không phải mặc định của lần thiết kế mới.

## Kiểm tra

Xem ảnh desktop/mobile, dark/light và rail thu gọn; kiểm tra điều hướng, group toggle, tooltip, focus, contrast và không tràn ngang. Dùng test workspace với backend mock. Giữ ảnh trước/sau ở `QA/sidebar/`. Không tuyên bố đã chứng minh UI do con người dựng hoặc đạt một điểm detector cụ thể.
