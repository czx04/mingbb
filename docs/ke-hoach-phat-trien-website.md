# Kế hoạch xây dựng website quản lý và đặt lịch Barber Shop

## 1. Mục tiêu dự án

Xây dựng website dành cho Barber Shop, giúp khách hàng dễ dàng tìm hiểu dịch vụ, đặt lịch trực tuyến, tích điểm và giới thiệu bạn bè. Đồng thời, hệ thống cung cấp khu vực quản trị để chủ quán theo dõi và vận hành hoạt động kinh doanh.

Website được thiết kế theo hướng mobile-first, tối ưu trải nghiệm trên điện thoại.

## 2. Đối tượng sử dụng

### 2.1. Khách hàng

- Xem thông tin và dịch vụ của quán.
- Xem hồ sơ đội ngũ barber.
- Đặt và theo dõi lịch hẹn.
- Tích lũy điểm sau mỗi lần sử dụng dịch vụ.
- Đổi điểm lấy ưu đãi.
- Nhận mã hoặc QR giới thiệu cá nhân.
- Giới thiệu bạn bè để nhận thêm điểm thưởng.

### 2.2. Chủ quán và nhân viên quản trị

- Quản lý lịch hẹn.
- Quản lý dịch vụ và bảng giá.
- Quản lý barber và lịch làm việc.
- Quản lý thông tin khách hàng.
- Quản lý điểm thưởng và ưu đãi.
- Theo dõi lượt giới thiệu khách hàng.
- Xem báo cáo và thống kê hoạt động kinh doanh.

## 3. Các phân hệ chính

### 3.1. Landing page

Trang giới thiệu tổng quan về Barber Shop, bao gồm:

- Banner và thông điệp thương hiệu.
- Giới thiệu về quán.
- Danh sách dịch vụ nổi bật và mức giá.
- Đội ngũ barber.
- Hình ảnh không gian quán.
- Đánh giá từ khách hàng.
- Thông tin liên hệ, địa chỉ và giờ mở cửa.
- Bản đồ chỉ đường.
- Nút **Đặt lịch** được hiển thị nổi bật.

### 3.2. Đặt lịch trực tuyến

Quy trình đặt lịch gồm các bước:

1. Chọn dịch vụ.
2. Chọn barber hoặc để hệ thống tự sắp xếp.
3. Chọn ngày và khung giờ còn trống.
4. Nhập thông tin khách hàng.
5. Nhập mã giới thiệu nếu có.
6. Kiểm tra thông tin.
7. Xác nhận đặt lịch.
8. Nhận thông báo đặt lịch thành công.

Khách hàng có thể xem lại hoặc hủy lịch theo chính sách của quán.

#### Tự động tạo thẻ khách hàng khi đặt lịch

- Số điện thoại là khóa dùng để nhận diện khách hàng.
- Khi khách xác nhận đặt lịch, hệ thống kiểm tra số điện thoại đã tồn tại hay chưa.
- Nếu số điện thoại đã tồn tại, lịch hẹn mới được gắn vào thẻ khách hàng hiện có.
- Nếu số điện thoại chưa tồn tại, hệ thống tự động tạo một thẻ khách hàng mới.
- Tên và số điện thoại nhập trong lần đặt lịch đầu tiên được lưu làm thông tin đăng ký ban đầu của thẻ.
- Các lần đặt lịch sau bằng cùng số điện thoại không tạo thêm thẻ mới.
- Thẻ mới được tự động cấp mã giới thiệu riêng và số dư điểm ban đầu bằng `0`.

### 3.3. Trang thành viên

Khách hàng không cần đăng ký tài khoản hoặc đăng nhập. Chỉ cần nhập số điện thoại đã dùng khi đặt lịch để truy cập thẻ thành viên của mình.

Quy trình truy cập:

1. Khách hàng mở trang thành viên.
2. Nhập số điện thoại đã đăng ký tại quán hoặc đã dùng để đặt lịch.
3. Hệ thống tìm hồ sơ khách hàng tương ứng.
4. Nếu số điện thoại tồn tại, hệ thống hiển thị thẻ thành viên.
5. Nếu chưa tồn tại, hệ thống hướng dẫn khách đặt lịch hoặc liên hệ quán để tạo hồ sơ.

Thông tin trên thẻ thành viên bao gồm:

- Xem thông tin cá nhân.
- Xem lịch hẹn sắp tới và lịch sử sử dụng dịch vụ.
- Theo dõi số điểm hiện có.
- Xem lịch sử cộng, trừ điểm.
- Xem danh sách ưu đãi có thể đổi.
- Hiển thị mã và QR giới thiệu cá nhân.
- Theo dõi số bạn bè đã giới thiệu.
- Xem điểm thưởng nhận được từ chương trình giới thiệu.

### 3.4. Chương trình khách hàng thân thiết

- Cộng điểm sau khi lịch hẹn được hoàn thành và thanh toán.
- Số điểm có thể được tính theo hóa đơn hoặc theo từng dịch vụ.
- Cho phép đổi điểm lấy ưu đãi hoặc voucher.
- Lưu lịch sử mọi giao dịch điểm.
- Hỗ trợ cấu hình tỷ lệ tích điểm và thời hạn sử dụng.
- Cho phép quản trị viên điều chỉnh điểm kèm lý do.

### 3.5. Chương trình giới thiệu bạn bè

- Mỗi khách hàng có một mã và QR giới thiệu riêng.
- Mã giới thiệu mặc định gồm hai ký tự đầu tiên của tên và hai chữ số, ví dụ: `TU27`, `LI08`, `NA52`.
- Tên có dấu được chuẩn hóa thành chữ cái Latin viết hoa trước khi tạo mã; ví dụ `Tuấn` trở thành tiền tố `TU`.
- Hai chữ số được hệ thống tạo tự động và phải đảm bảo toàn bộ mã không trùng với khách hàng khác.
- Nếu mã vừa tạo đã tồn tại, hệ thống tiếp tục sinh cặp số khác cho đến khi có mã duy nhất.
- Khách hàng có thể chọn biệt danh hoặc tên làm mã giới thiệu dễ nhớ, với điều kiện mã đó chưa được sử dụng.
- Mã không phân biệt chữ hoa và chữ thường khi kiểm tra trùng lặp.
- Người được giới thiệu có thể truy cập liên kết hoặc nhập mã khi đặt lịch.
- Điểm thưởng chỉ được cộng khi người được giới thiệu hoàn thành lịch hẹn đầu tiên.
- Hệ thống lưu quan hệ giữa người giới thiệu và người được giới thiệu.
- Có cơ chế ngăn tự giới thiệu và cộng điểm trùng lặp.
- Quản trị viên có thể cấu hình mức thưởng.

### 3.6. Trang quản trị

#### Quản lý lịch hẹn

- Xem lịch theo ngày, tuần hoặc tháng.
- Lọc theo trạng thái và barber.
- Tạo hoặc chỉnh sửa lịch hẹn.
- Xác nhận, hoàn thành, hủy hoặc đánh dấu khách không đến.
- Theo dõi ghi chú của từng lịch hẹn.

#### Quản lý dịch vụ

- Thêm, sửa, ẩn hoặc xóa dịch vụ.
- Thiết lập tên, mô tả, giá và thời lượng.
- Gắn hình ảnh và sắp xếp thứ tự hiển thị.

#### Quản lý barber

- Quản lý hồ sơ barber.
- Thiết lập kỹ năng và dịch vụ phụ trách.
- Quản lý lịch làm việc, ngày nghỉ và khung giờ bận.
- Theo dõi số lượng lịch hẹn.

#### Quản lý khách hàng

- Xem thông tin và lịch sử đặt lịch.
- Theo dõi tổng chi tiêu và điểm thưởng.
- Xem dữ liệu giới thiệu bạn bè.
- Điều chỉnh điểm trong trường hợp cần thiết.

#### Báo cáo và thống kê

- Tổng số lịch hẹn.
- Tỷ lệ hoàn thành và hủy lịch.
- Doanh thu theo thời gian.
- Dịch vụ được sử dụng nhiều nhất.
- Hiệu suất của từng barber.
- Số lượng khách hàng mới và quay lại.
- Điểm đã cấp và đã đổi.
- Hiệu quả chương trình giới thiệu.

## 4. Quy trình sử dụng chính

```text
Khách truy cập website
        ↓
Xem thông tin và dịch vụ
        ↓
Chọn dịch vụ và barber
        ↓
Chọn thời gian phù hợp
        ↓
Xác nhận đặt lịch
        ↓
Đến quán sử dụng dịch vụ
        ↓
Nhân viên xác nhận hoàn thành và thanh toán
        ↓
Khách hàng nhận điểm thưởng
        ↓
Khách chia sẻ mã hoặc QR giới thiệu
        ↓
Bạn bè hoàn thành lần sử dụng đầu tiên
        ↓
Người giới thiệu nhận thêm điểm
```

## 5. Các trạng thái lịch hẹn

Một lịch hẹn nên có các trạng thái:

- Chờ xác nhận.
- Đã xác nhận.
- Đã đến.
- Đã hoàn thành.
- Đã hủy.
- Không đến.

Điểm thưởng chỉ được cộng khi lịch hẹn chuyển sang trạng thái **Đã hoàn thành**.

## 6. Giao diện dự kiến

### 6.1. Giao diện khách hàng

- Landing page.
- Danh sách và chi tiết dịch vụ.
- Danh sách barber.
- Trang đặt lịch nhiều bước.
- Trang xác nhận đặt lịch.
- Trang nhập số điện thoại để tra cứu thẻ thành viên, không yêu cầu đăng nhập.
- Trang thành viên.
- Trang điểm thưởng và ưu đãi.
- Trang mã/QR giới thiệu.
- Lịch sử đặt lịch.

### 6.2. Giao diện quản trị

- Trang tổng quan.
- Lịch hẹn dạng lịch và danh sách.
- Quản lý dịch vụ.
- Quản lý barber.
- Quản lý khách hàng.
- Quản lý điểm và ưu đãi.
- Quản lý referral.
- Báo cáo và thống kê.
- Cấu hình hệ thống.

## 7. Phạm vi triển khai

### 7.1. Giai đoạn 1 — Phiên bản MVP

- Landing page.
- Danh sách dịch vụ và barber.
- Quy trình đặt lịch.
- Quản lý lịch hẹn.
- Quản lý dịch vụ và barber.
- Hồ sơ khách hàng.
- Tích điểm cơ bản.
- Mã và QR giới thiệu.
- Dashboard quản trị cơ bản.
- Giao diện responsive, ưu tiên thiết bị di động.

### 7.2. Giai đoạn 2 — Hoàn thiện vận hành

- Đổi điểm lấy voucher.
- Nhắc lịch qua email, SMS hoặc Zalo.
- Quản lý ca làm việc chi tiết.
- Báo cáo doanh thu và hiệu suất.
- Cấu hình linh hoạt quy tắc loyalty/referral.
- Phân quyền chủ quán và nhân viên.
- Xuất báo cáo Excel.

### 7.3. Giai đoạn 3 — Mở rộng

- Thanh toán trực tuyến hoặc đặt cọc.
- Quản lý nhiều chi nhánh.
- Đồng bộ Zalo OA.
- Chiến dịch khuyến mãi.
- Xếp hạng thành viên.
- Đánh giá sau khi sử dụng dịch vụ.
- Chương trình membership theo tháng.

## 8. Yêu cầu vận hành quan trọng

- Không cho phép hai khách đặt cùng barber trong cùng khung giờ.
- Khung giờ phải được tính theo thời lượng dịch vụ.
- Số điện thoại là thông tin định danh chính của khách hàng và không được trùng lặp.
- Một số điện thoại chỉ được tạo một thẻ khách hàng; thao tác tạo thẻ và lịch hẹn cần được xử lý an toàn để không sinh hồ sơ trùng.
- Tên nhập ở lần đặt lịch đầu tiên được dùng làm tên đăng ký ban đầu của khách hàng.
- Mã giới thiệu phải là duy nhất trên toàn hệ thống.
- QR và mã giới thiệu phải gắn với đúng hồ sơ khách hàng theo số điện thoại.
- Thông tin nhạy cảm trên thẻ thành viên phải được giới hạn hoặc che bớt để bảo vệ khách hàng khi tra cứu bằng số điện thoại.
- Mỗi khách mới chỉ được ghi nhận giới thiệu một lần.
- Mọi thay đổi điểm phải có lịch sử giao dịch.
- Dữ liệu khách hàng cần được bảo vệ và phân quyền.
- Website phải hiển thị tốt trên điện thoại, máy tính bảng và máy tính.
- Có cơ chế sao lưu, ghi log và xử lý lỗi.

## 9. Tiêu chí hoàn thành

Dự án được xem là hoàn thành khi:

- Khách hàng có thể đặt lịch đầy đủ trên điện thoại.
- Khách hàng có thể mở thẻ thành viên bằng số điện thoại mà không cần tạo tài khoản hoặc đăng nhập.
- Hệ thống không tạo lịch trùng cho barber.
- Chủ quán có thể quản lý toàn bộ lịch hẹn.
- Điểm được cộng đúng sau khi hoàn thành dịch vụ.
- Referral được ghi nhận và thưởng đúng điều kiện.
- Khách hàng xem được điểm, lịch sử và QR cá nhân.
- Quản trị viên quản lý được dịch vụ, barber và khách hàng.
- Dashboard hiển thị các số liệu vận hành cơ bản.
