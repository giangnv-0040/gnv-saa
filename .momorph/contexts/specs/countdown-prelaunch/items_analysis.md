# Items Analysis - countdown-prelaunch

## Screen Context

- Screen Purpose: Trang đếm ngược trước khi sự kiện Sun\*Kudos chính thức ra mắt; hiển thị thời gian còn lại theo đơn vị Ngày / Giờ / Phút.
- Target User Type: Người dùng / Nhân viên Sun\* (truy cập trang trong giai đoạn pre-launch).

---

### Item 1: 1_Days (`2268:35139`)

- hasChildren: true
- Name JP: 残り日数
- Name Trans: Days
- Item Type: others
- Item Subtype: info_block
- Button Type:
- Data Type:
- Format:
- Required: false
- Min Length: -
- Max Length: -
- Default Value:
- User Action:
- Transition Note:
- Database Table: -
- Database Column: -
- Database Note: -

Validation Note:
(không có quy tắc validation, đây là phần tử hiển thị chỉ đọc)

Description:
Mục đích và Bối cảnh
Khối hiển thị số ngày còn lại đến thời điểm sự kiện bắt đầu trong bộ đếm ngược pre-launch.

Display Elements:

- Số: 2 ô hiển thị chữ số dạng LED 7-đoạn (kiểu digital clock)
- Nhãn: Text "DAYS" - chữ in hoa, màu trắng
- Children: 2 chữ số đơn (ô chục, ô đơn vị) + label

Function & Logic:

- Cập nhật tự động: Hiển thị số ngày còn lại tới thời điểm sự kiện bắt đầu, làm mới mỗi giây hoặc khi giá trị thay đổi
- Logic: Giá trị luôn được pad-zero 2 chữ số (ví dụ: 5 → "05")
- State: Hiển thị "00" khi thời gian còn lại < 1 ngày
- State: Khi countdown kết thúc (về 00:00:00), khối vẫn hiển thị "00"

Candidate QA:

- Số ngày tối đa có thể hiển thị? Nếu sự kiện cách hơn 99 ngày thì cần thêm chữ số thứ 3 hay vẫn cap ở "99"?
- Có hiệu ứng animation (flip/fade) khi số thay đổi không?
- Khi countdown về 00:00:00, hành vi tiếp theo của trang là gì (redirect, hiển thị message, chuyển sang trang chính)?
- Múi giờ tham chiếu cho countdown là gì (server time, UTC, hay giờ địa phương của user)?

---

### Item 2: 2_Hours (`2268:35144`)

- hasChildren: true
- Name JP: 残り時間
- Name Trans: Hours
- Item Type: others
- Item Subtype: info_block
- Button Type:
- Data Type:
- Format:
- Required: false
- Min Length: -
- Max Length: -
- Default Value:
- User Action:
- Transition Note:
- Database Table: -
- Database Column: -
- Database Note: -

Validation Note:
(không có quy tắc validation, đây là phần tử hiển thị chỉ đọc)

Description:
Mục đích và Bối cảnh
Khối hiển thị số giờ còn lại đến thời điểm sự kiện bắt đầu trong bộ đếm ngược pre-launch.

Display Elements:

- Số: 2 ô hiển thị chữ số dạng LED 7-đoạn
- Nhãn: Text "HOURS" - chữ in hoa, màu trắng
- Children: 2 chữ số đơn (ô chục, ô đơn vị) + label

Function & Logic:

- Cập nhật tự động: Hiển thị số giờ còn lại sau khi trừ phần ngày, làm mới mỗi giây
- Logic: Giá trị luôn được pad-zero 2 chữ số, phạm vi hiển thị 00–23
- State: Hiển thị "00" khi thời gian còn lại < 1 giờ
- State: Khi countdown kết thúc, khối hiển thị "00"

Candidate QA:

- Có hiệu ứng animation khi số giờ thay đổi không?
- Hiển thị theo định dạng 24h, xác nhận đúng không?
- Khi user mở trang ở các múi giờ khác nhau, giá trị có đồng bộ với server không?

---

### Item 3: 3_Minutes (`2268:35149`)

- hasChildren: true
- Name JP: 残り分数
- Name Trans: Minutes
- Item Type: others
- Item Subtype: info_block
- Button Type:
- Data Type:
- Format:
- Required: false
- Min Length: -
- Max Length: -
- Default Value:
- User Action:
- Transition Note:
- Database Table: -
- Database Column: -
- Database Note: -

Validation Note:
(không có quy tắc validation, đây là phần tử hiển thị chỉ đọc)

Description:
Mục đích và Bối cảnh
Khối hiển thị số phút còn lại đến thời điểm sự kiện bắt đầu trong bộ đếm ngược pre-launch.

Display Elements:

- Số: 2 ô hiển thị chữ số dạng LED 7-đoạn
- Nhãn: Text "MINUTES" - chữ in hoa, màu trắng
- Children: 2 chữ số đơn (ô chục; ô đơn vị) + label

Function & Logic:

- Cập nhật tự động: Hiển thị số phút còn lại sau khi trừ phần ngày và phần giờ; làm mới mỗi giây
- Logic: Giá trị luôn được pad-zero 2 chữ số; phạm vi hiển thị 00–59
- State: Hiển thị "00" khi thời gian còn lại < 1 phút
- State: Khi countdown kết thúc; khối hiển thị "00"

Candidate QA:

- Có cần đơn vị giây (SECONDS) đi kèm không; hay phút là đơn vị nhỏ nhất hiển thị?
- Có hiệu ứng animation khi số phút thay đổi không?
- Khi còn dưới 1 phút; trang có chuyển trạng thái hay vẫn giữ countdown ở "00"?
