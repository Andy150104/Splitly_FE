# Đối chiếu trang home với video tham chiếu

Nguồn hình ảnh tham chiếu: `Palmo _ Pouring - Google Chrome 2026-09-09 22-43-55.mp4`, dài khoảng 20,9 giây. Chỉ dùng video để phân tích thiết kế và nhịp tương tác; không nhập model, logo hoặc hình ảnh của Palmo vào source.

| Quan sát trong video                                             | Cách áp dụng vào mơ.                                                                             | Kiểm tra                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Vật thể 3D là tâm điểm trên nền kem trống thoáng                 | Ví, thẻ chia tiền, hóa đơn và hũ để dành có cùng ánh sáng và palette                             | Chụp riêng 4 cảnh trên desktop/mobile                      |
| Khoảng 5–6 giây: vật thể tách ra, để lộ sản phẩm bên trong       | Ví mở và tách lớp; các thẻ đi ra rồi chia thành ba phần                                          | Cuộn qua đoạn 0,02–0,36, xem chiều sâu và không đứt canvas |
| Khoảng 6–8 giây: model tiếp tục xoay trong khi chữ đổi vị trí    | Thẻ → hóa đơn xoay → hũ và đồng xu; chữ xuất hiện theo mốc cùng timeline                         | Kiểm tra tiến/lùi qua 4 cảnh                               |
| Logo/menu và thông tin tiến độ vẫn có chỗ ổn định                | Header giữ vị trí; thanh chương và progress nằm dưới scene                                       | Chuột, bàn phím và thanh chọn cảnh                         |
| Chuyển từ kem sang phần olive, chữ lớn, thẻ sản phẩm và mép cong | Cuối câu chuyện ngả vàng, nối vào phần tính năng olive và mép scallop                            | Kiểm tra đoạn ra khỏi pin và ảnh các phần dưới             |
| Vật thể phải phản hồi theo cuộn, không chỉ tự chạy               | Pose của cảnh chia tiền, hóa đơn và hũ tính trực tiếp từ scroll; chỉ ví lúc chào có dao động nhẹ | So sánh ảnh canvas khi dừng và khi quay lại cùng vị trí    |

Đây là bản chuyển thể cho sản phẩm quản lý/chia tiền: không tái tạo quả dừa, lon nước hay toàn bộ nội dung của video. Cơ chế tương tác được đối chiếu theo cách model tách/mở, di chuyển, xoay và nối các cảnh khi cuộn.

Các bài kiểm tra liên quan trực tiếp nằm trong `tests/story.spec.ts`; ảnh tạo bằng `node scripts/capture-story.mjs`. Bộ kiểm tra còn bao gồm responsive, accessibility, WebGL fallback và các tương tác demo. Chrome mobile là mô phỏng kích thước và touch, không phải kiểm tra trên iPhone vật lý.
