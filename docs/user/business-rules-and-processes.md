# Tài Liệu Quy Tắc Và Quy Trình Nghiệp Vụ Phân Hệ User (Velura Backend Reference)

Tài liệu này được trích xuất tự động từ tài liệu đặc tả `docs/user/source.md` nhằm phục vụ việc thiết kế và lập trình cho backend phân hệ Khách hàng (User) của Velura. Toàn bộ các quy trình nghiệp vụ, quy tắc xử lý dữ liệu, các tình huống ngoại lệ, và đặc tả Use Case thuộc phạm vi User được tập hợp chi tiết dưới đây.

---

## PHẦN 1: QUY TRÌNH & QUY TẮC NGHIỆP VỤ CỦA USER

3.1.1. Quy trình Đăng ký / Đăng nhập 
3.1.1.1. Mô tả quy trình
Quy trình Đăng ký/Đăng nhập của hệ thống Velura hướng tới mục tiêu tối ưu hóa trải nghiệm khách hàng, xóa bỏ rào cản trong quá trình mua sắm trực tuyến. Khác với mô hình thương mại điện tử truyền thống yêu cầu người dùng phải đăng nhập trước khi sử dụng các chức năng chính, Velura cho phép khách vãng lai (Guest) trải nghiệm gần như đầy đủ các chức năng mua sắm ngay từ lần truy cập đầu tiên. Khi truy cập vào website, người dùng chưa đăng nhập vẫn có thể thực hiện các thao tác như xem danh mục sản phẩm, tìm kiếm theo từ khóa, áp dụng các bộ lọc, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng và sử dụng các tính năng hỗ trợ tư vấn của hệ thống. Việc yêu cầu xác thực danh tính chỉ được thực hiện khi người dùng tiến hành đặt hàng nhằm đảm bảo tính thuận tiện và hạn chế việc bỏ dở quá trình mua sắm. 
Hệ thống cung cấp hai luồng thiết lập tài khoản người dùng gồm:
Luồng Đăng ký/Đăng nhập chủ động:
Đối với người dùng đã có tài khoản, hệ thống cho phép đăng nhập thông qua số điện thoại hoặc email cùng mật khẩu đã đăng ký. Sau khi thông tin được xác thực thành công, hệ thống khởi tạo phiên đăng nhập, tải dữ liệu cá nhân và điều hướng người dùng đến Trang chủ. Trong trường hợp người dùng nhập sai thông tin đăng nhập hoặc mật khẩu, hệ thống hiển thị thông báo lỗi tương ứng và ghi nhận số lần đăng nhập thất bại. Nếu số lần vượt quá 5 lần liên tiếp trong một khoảng thời gian ngắn, hệ thống sẽ tạm thời khóa chức năng đăng nhập trong vòng 15 phút nhằm hạn chế các hành vi truy cập trái phép và tăng cường bảo mật tài khoản.
Đối với người dùng mới, hệ thống cung cấp các trường thông tin đăng ký bao gồm họ tên, địa chỉ email hoặc số điện thoại và mật khẩu. Hệ thống kiểm tra email/số điện thoại chưa được đăng ký trước đó ngay khi người dùng nhập liệu, khi nhấn gửi thì nếu thông tin hợp lệ thì hệ thống sẽ gửi về email/SMS xác nhận. Người dùng nhấn link xác nhận trong email hoặc nhập mã OTP được gửi qua số điện thoại cá nhân để kích hoạt tài khoản. Sau khi hệ thống ghi nhận tài khoản tạo thành công, người dùng được điều hướng đến Trang chủ với quyền Member và có thể bắt đầu sử dụng các chức năng mua sắm của hệ thống.
Luồng tạo tài khoản tự động khi đặt hàng:
Đối với khách vãng lai (Guest) chưa đăng nhập, hệ thống vẫn cho phép tiến hành đặt hàng mà không yêu cầu đăng ký tài khoản trước. Khi người dùng nhấn “Tiến hành thanh toán” từ Giỏ hàng hoặc lựa chọn “Mua ngay” tại trang chi tiết sản phẩm, hệ thống chuyển trực tiếp đến trang Thông tin giao hàng. Tại đây, người dùng cung cấp các thông tin cần thiết phục vụ cho việc giao hàng bao gồm họ tên, số điện thoại và địa chỉ nhận hàng. Địa chỉ email được xem là thông tin tùy chọn. Sau khi người dùng xác nhận đặt hàng, hệ thống gửi mã OTP đến số điện thoại đã khai báo để thực hiện xác thực. 
Nếu OTP được thông qua việc điền đúng mã trên popup xác thực, hệ thống tiến hành tạo đơn hàng và hiển thị thông báo đặt hàng thành công. Đồng thời, hệ thống tự động khởi tạo một tài khoản thành viên mới dựa trên số điện thoại vừa xác thực. Thông tin đăng nhập của tài khoản được gửi đến người dùng thông qua tin nhắn SMS để phục vụ cho các lần mua sắm tiếp theo. Kể từ thời điểm đó, toàn bộ đơn hàng, lịch sử giao dịch và dữ liệu tương tác của người dùng sẽ được liên kết với tài khoản vừa được tạo. Cơ chế này giúp chuyển đổi khách vãng lai thành thành viên một cách tự nhiên, đồng thời vẫn đảm bảo trải nghiệm mua sắm liền mạch và thuận tiện trong lần sử dụng đầu tiên.
 
 Hình 3.x: BPMN quy trình Đăng ký/Đăng nhập chủ động
 
Hình 3.x: BPMN quy trình tạo tài khoản chủ động khi đặt hàng (Guest)
 
Hình 3.x: BPMN quy trình Đăng ký/Đăng nhập
3.1.1.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hoạt động hệ thống
AUTH-01
Trải nghiệm đồng nhất 
Khách vãng lai (Guest) và Thành viên (Member) được cấp quyền sử dụng các tính năng xem, tìm kiếm, lọc và thêm giỏ hàng hoàn toàn như nhau. 
Cấp Session ID tạm thời cho Guest để quản lý giỏ hàng; không hiển thị popup yêu cầu đăng nhập khi tương tác catalog. 
AUTH-02
Giới hạn số lần đăng nhập sai 
Cho phép người dùng nhập sai mật khẩu tối đa 5 lần liên tiếp. Quá 5 lần, tài khoản bị tạm khóa chức năng đăng nhập trong 15 phút. 
Ghi nhận số lần đăng nhập thất bại, kích hoạt bộ đếm thời gian khóa tạm thời và hiển thị thông báo tương ứng. 
AUTH-03
Tính duy nhất của tài khoản 
Một địa chỉ Email hoặc Số điện thoại chỉ được phép liên kết với một tài khoản duy nhất trên hệ thống Velura. 
Truy vấn Database; nếu phát hiện trùng lặp, chặn luồng đăng ký và báo lỗi "Email/SĐT đã được sử dụng". 
AUTH-04
Tiêu chuẩn mật khẩu an toàn 
Mật khẩu đăng ký mới phải dài tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một số hoặc ký tự đặc biệt. 
Thực hiện kiểm tra validate định dạng cấu trúc mật khẩu ở cả hai đầu Frontend và Backend trước khi xử lý mã hóa dữ liệu. 
AUTH-05
Xác thực danh tính (OTP/Link) 
Tài khoản mới chỉ được kích hoạt thành công (Active) sau khi người dùng xác thực mã OTP qua SMS hoặc click vào Link trong Email. 
Gửi email/SMS qua dịch vụ bên thứ 3; đối chiếu chuỗi mã xác thực với thời hạn hiệu lực (TTL). 
AUTH-06
Tạo tài khoản tự động khi đặt hàng 
Guest có thể đặt hàng mà không cần đăng ký trước. Khi xác thực OTP thành công tại, hệ thống tự động tạo tài khoản thành viên dựa trên số điện thoại đã xác thực. 
Sinh tài khoản mới, liên kết đơn hàng với tài khoản vừa tạo và gửi thông tin đăng nhập đến người dùng qua SMS hoặc email (nếu có). 
Bảng 3.x: Quy tắc nghiệp vụ quy trình Đăng ký/Đăng nhập
3.1.1.3. Tình huống ngoại lệ
Tình huống 1: Người dùng bị khóa chức năng đăng nhập do nhập sai mật khẩu quá số lần cho phép.  
Mô tả: Người dùng nhiều lần cố gắng đăng nhập nhưng không nhớ chính xác mật khẩu, khiến hệ thống kích hoạt cơ chế bảo vệ tự động. 
Cách xử lý: Hệ thống sẽ tạm thời vô hiệu hóa nút Đăng nhập của người dùng và hiển thị thông báo: Tài khoản của bạn đã bị khóa tạm thời trong 15 phút do nhập sai mật khẩu quá số lần quy định. Đồng thời, một email bảo mật được gửi đến hòm thư điện tử của người dùng với thông tin cảnh báo và liên kết "Quên mật khẩu" để họ có thể chủ động đặt lại mật khẩu nếu cần. 
Tình huống 2: Guest đặt hàng bằng Số điện thoại đã tồn tại tài khoản Member đang hoạt động .  
Mô tả: Tại bước thanh toán tự động, khách vãng lai điền Số điện thoại mà số này trước đó đã được đăng ký làm tài khoản Member chính thức trên hệ thống.  
Cách xử lý: Hệ thống kiểm tra dữ liệu trùng lặp và chặn luồng tạo tài khoản tự động. Một thông báo Popup xuất hiện ngay tại trang thanh toán: "Số điện thoại này đã được liên kết với một tài khoản thành viên của Velura. Vui lòng Đăng nhập để tiếp tục tích lũy đơn hàng, hoặc sử dụng một Số điện thoại khác để nhận mã OTP thanh toán nhanh." kèm theo nút dẫn lối trực tiếp về Form đăng nhập. 
Tình huống 3: Mã OTP xác thực đơn hàng và kích hoạt tài khoản tự động bị quá hạn.
Mô tả: Người dùng thực hiện đặt hàng tại Checkout, hệ thống gửi mã OTP xác thực về điện thoại nhưng người dùng nhập mã khi đã quá thời gian hiệu lực 5 phút (TTL hết hạn). 
Cách xử lý: Hệ thống hiển thị giao diện thông báo lỗi: "Liên kết kích hoạt đã hết hạn." kèm theo một nút bấm chức năng "Gửi lại liên kết kích hoạt mới" để người dùng không phải nhập lại toàn bộ thông tin đăng ký từ đầu.
Tình huống 4: Luồng tự động gửi SMS chứa thông tin tài khoản và mật khẩu mới bị lỗi hệ thống.
Mô tả: Khách hàng xác thực đơn hàng bằng mã OTP thành công, hệ thống đã tạo đơn và ghi nhận tài khoản thành viên mới vào Cơ sở dữ liệu, nhưng dịch vụ SMS của bên thứ ba bị nghẽn khiến không thể gửi tin nhắn thông báo mật khẩu về máy khách hàng. 
Cách xử lý: Hệ thống không làm gián đoạn trải nghiệm thanh toán của khách hàng. Trên màn hình xác nhận đơn hàng thành công, hệ thống hiển thị thêm một bảng thông báo: "Velura đã tự động khởi tạo tài khoản thành viên cho bạn dựa trên Số điện thoại đặt hàng. Do hệ thống tin nhắn đang quá tải, mật khẩu đăng nhập tạm thời của bạn là: [Chuỗi mật khẩu sinh ngẫu nhiên]. Vui lòng lưu lại thông tin này để đăng nhập và đổi mật khẩu mới trong lần truy cập sau." Giao diện cũng cung cấp tính năng nhấp để sao chép nhanh chuỗi mật khẩu này. 
Tình huống 5: Lỗi kết nối cơ sở dữ liệu.
Mô tả: Khách hàng nhấn nút xác nhận Đăng ký hoặc Xác nhận đơn hàng đúng thời điểm hệ thống gặp sự cố mất kết nối mạng nội bộ hoặc máy chủ cơ sở dữ liệu bảo trì đột xuất. 
Cách xử lý: Hệ thống chặn hiển thị các dòng mã lỗi kỹ thuật hệ thống (như lỗi 500 hoặc rò rỉ cấu trúc SQL). Giao diện hiển thị một hộp thoại thông báo: "Hệ thống Velura đang bận xử lý dữ liệu đột xuất. Yêu cầu của bạn đã được tạm lưu, vui lòng thử lại sau ít phút hoặc liên hệ Hotline hỗ trợ." Hệ thống tự động sao lưu dữ liệu form vào bộ nhớ tạm trình duyệt để tránh việc người dùng phải gõ lại thông tin sau khi tải lại trang.

---

3.1.2. Quy trình Thiết lập hồ sơ cá nhân Style Quiz 
3.1.2.1. Mô tả quy trình
Đây là quy trình hỗ trợ cá nhân hóa trải nghiệm mua sắm dành cho thành viên của hệ thống Velura. Hệ thống tự động hiển thị hộp thoại/banner mời tham gia Style Quiz ngay khi khách vãng lai (Guest) lần đầu truy cập vào website. Đối với thành viên (Member), hệ thống sẽ kiểm tra CSDL, nếu Member chưa từng làm Quiz, banner sẽ tiếp tục xuất hiện để nhắc nhở; nếu đã làm, banner sẽ ẩn đi. Người dùng có thể lựa chọn thực hiện ngay hoặc bỏ qua và cập nhật sau trong mục Hồ sơ cá nhân.
Khi bắt đầu Style Quiz, hệ thống hiển thị giao diện khảo sát trực quan dưới dạng từng bước. Người dùng tiến hành nhập các thông số vật lý định lượng (chiều cao, cân nặng, số đo 3 vòng), lựa chọn các đặc điểm định tính (đặc điểm hình dáng cơ thể, tone da warm/cool/neutral) và nhấp chọn các bảng cảm hứng đại diện cho phong cách mà họ hướng tới. Người dùng trả lời từ 5-10 câu hỏi ngắn dưới dạng lựa chọn hình ảnh trực quan (không phải câu hỏi văn bản thuần túy). Nội dung quiz bao gồm: phong cách ưa thích (casual, minimalist, feminine, streetwear,...), màu sắc hay dùng, những dịp mặc đồ chính trong tuần (đi làm, đi học, dạo phố, hẹn hò,...), thương hiệu hoặc KOL thời trang yêu thích, mức ngân sách thường chi cho một bộ đồ.
Sau khi người dùng hoàn tất bài khảo sát, hệ thống lưu trữ toàn bộ tập dữ liệu này vào cơ sở dữ liệu dưới dạng "Style Profile" độc quyền cho tài khoản của Member. Còn với Guest, kết quả chỉ được lưu tạm trong session hiện tại để đảm bảo Guest cũng có thể trải nghiệm được đầy đủ các tính năng đặc biệt của hệ thống. Tuy nhiên, nếu Guest thực hiện thao tác đóng trình duyệt hoặc thoát trang, hệ thống sẽ bật một Popup cảnh báo: "Hồ sơ cá nhân của bạn chưa được lưu lại, toàn bộ sẽ bị mất khi bạn rời đi. Bạn có muốn Đăng ký tài khoản ngay để lưu giữ không?"
Ngay sau khi nhấn lưu, hệ thống tự động điều hướng người dùng đến trang “Gợi ý dàn cho bạn”. Tại đây, hệ thống tính toán, hiển thị các outfit được phối sẵn và sản phẩm đáp ứng chuẩn xác các thông số vừa cung cấp. Đồng thời, Style Profile này cũng được nạp làm ngữ cảnh nền bắt buộc cho AI Chatbot để hỗ trợ tư vấn thời trang chính xác hơn trong tương lai. Thành viên có thể vào mục Hồ sơ cá nhân để cập nhật số đo, điều chỉnh tone da, làm lại Style Quiz bất kỳ lúc nào, và hệ thống sẽ tự động cập nhật lại danh sách outfit gợi ý theo profile mới. 
  
Hình 3.x: BPMN quy trình thiết lập hồ sơ cá nhân, Style Quiz
3.1.2.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hoạt động hệ thống
QUIZ-01
Điều kiện hiển thị banner 
Guest auto thấy Banner. Member chỉ thấy Banner nếu cờ trạng thái "is_quiz_completed" = false.
Kiểm tra Session (với Guest) và Database (với Member) để render banner mời làm quiz.
QUIZ-02
Cơ chế bỏ qua
Người dùng có quyền từ chối làm bài khảo sát ngay lúc đó mà không bị khóa tài khoản hoặc giới hạn các tính năng mua sắm cơ bản.
Lưu cờ ẩn banner; điều hướng người dùng ra trang chủ; đặt trạng thái nhắc nhở cập nhật sau trong Profile.
QUIZ-03
Cảnh báo mất dữ liệu 
Guest đã làm Quiz khi có hành vi thoát trang phải nhận được cảnh báo bảo lưu dữ liệu.
Bắt sự kiện đóng tab/trình duyệt; render Popup mời đăng ký tài khoản để chuyển Profile từ Session vào Database.
QUIZ-04
Ràng buộc tính hợp lệ của dữ liệu số 
Các thông số vật lý định lượng bắt buộc phải nằm trong phạm vi giới hạn logic sinh học của con người và không được bỏ trống khi đã chọn làm Quiz.
Ràng buộc điều kiện kiểm tra dữ liệu đầu vào trực tiếp (Ví dụ: Chiều cao: 100cm - 220cm; Cân nặng: 30kg - 150kg); hiển thị thông báo nếu nhập sai.
QUIZ-05
Tối ưu hóa trải nghiệm tương tác 
Bài khảo sát bắt buộc phải triển khai dưới dạng bộ chọn hình ảnh đại diện, nghiêm cấm sử dụng câu hỏi dạng chuỗi văn bản dài đơn điệu.
Render giao diện dạng slide step-by-step; tải dữ liệu hình ảnh phong cách từ CMS.
QUIZ-06
Cập nhật dữ liệu gợi ý và điều hướng 
Ngay sau khi lưu Style Profile, hệ thống phải cập nhật dữ liệu để sử dụng cho việc gợi ý combo outfit và làm ngữ cảnh nền cho AI Chatbot. 
Lưu dữ liệu vào DB; tính toán danh sách sản phẩm khớp tiêu chí; tự động điều hướng người dùng sang trang "Gợi ý dành cho bạn". 
QUIZ-07
Cho phép cập nhật tự do
Người dùng có quyền thay đổi thông số, làm lại Style Quiz không giới hạn số lần tại mục quản lý hồ sơ.
Mở chức năng Edit; ghi đè dữ liệu mới lên bản ghi cũ trong CSDL và làm mới bộ lọc logic gợi ý tức thì.
Bảng 3.x: Quy tắc nghiệp vụ quy trình Thiết lập hồ sơ cá nhân Style Quiz 
3.1.2.3. Tình huống ngoại lệ
Tình huống 1: Người dùng nhập thông số vật lý sai logic hoặc không hợp lệ.
Mô tả: Người dùng vô tình hoặc cố ý nhập sai định dạng tại các ô Chiều cao, Cân nặng.
Cách xử lý: Hệ thống thực hiện validation ngay tại trường nhập liệu, không cho phép nhấn nút "Tiếp theo", hiển thị cảnh báo đỏ bên dưới: "Vui lòng nhập số đo hợp lệ (Ví dụ: Chiều cao từ 100 - 220 cm)."
Tình huống 2: Người dùng đột ngột tắt trình duyệt hoặc mất kết nối mạng khi đang làm dở bài Quiz.
Mô tả: Trạng thái bài khảo sát đang thực hiện ở bước 5/10 thì bị ngắt quãng.
Cách xử lý: Hệ thống không lưu trữ các câu trả lời chưa hoàn thiện vào CSDL chính thức để tránh rác dữ liệu. Khi người dùng kết nối lại và vào hệ thống, hệ thống sẽ kiểm tra trạng thái profile vẫn trống và hiển thị lại banner gợi ý làm Style Quiz từ bước đầu tiên.
Tình huống 3: Khách hàng từ chối làm Style Quiz ở lần đăng nhập đầu tiên .
Mô tả: Người dùng lựa chọn tắt hộp thoại giới thiệu Style Quiz để tiến thẳng vào giao diện xem sản phẩm. 
Cách xử lý: Hệ thống tạm thời xếp người dùng vào nhóm chưa có dữ liệu cá nhân hóa và hiển thị luồng hàng hóa đại trà. Đồng thời, hệ thống sẽ tự động chèn các banner nhắc nhở nhỏ gọn hoặc thông qua AI Chatbot để mời gọi người dùng hoàn thiện hồ sơ khi họ truy cập vào trang quản lý tài khoản cá nhân sau này. 
Tình huống 4: Dữ liệu hồ sơ bị trống ở các trường không bắt buộc. 
Mô tả: Khách hàng hoàn thành bài kiểm tra phong cách nhưng chủ động bỏ qua việc cung cấp chi tiết số đo ba vòng. 
Cách xử lý: Thuật toán AI vẫn tiếp tục hoạt động dựa trên các thông số cốt lõi bắt buộc (chiều cao, cân nặng) để ước lượng dáng người tổng quát. Luồng gợi ý sản phẩm vẫn được cá nhân hóa ở mức độ tương đối, đảm bảo hành trình mua sắm của khách hàng không bị gián đoạn.

---

3.1.3. Quy trình Tìm kiếm, lọc sản phẩm và thêm vào giỏ hàng 
3.1.3.1. Mô tả quy trình
Khi truy cập vào hệ thống Velura, cả Guest và Member đều có thể tìm kiếm sản phẩm thông qua từ khóa hoặc danh mục. Hệ thống sẽ truy xuất dữ liệu và hiển thị danh sách sản phẩm, giày, phụ kiện, khoảng giá, màu sắc, size, thương hiệu, và đặc biệt tương ứng với nhu cầu tìm kiếm của người dùng. Khách hàng có thể lọc kết quả theo nhiều tiêu chí: áo, quần, váy, hoặc là theo body type (dáng người) phù hợp. Tại trang chủ, đối với thành viên đã thực hiện Style Quiz sẽ có block "Gợi ý dành cho bạn" được xây dựng dựa trên Style Profile. Hệ thống ưu tiên hiển thị các sản phẩm phù hợp với body shape đã khai báo, màu sắc hợp tone da, phong cách đã chọn trong quiz, và khoảng giá thường chi. Đi kèm với đó là các block sản phẩm đại trà như “Xu hướng tuần này”, “Sản phẩm nổi bật”,... dành cho những người dùng bỏ qua bước làm Quiz. Khi người dùng nhấp vào xem chi tiết một sản phẩm, ngoài việc cung cấp hình ảnh và mô tả, hệ thống sẽ phân tích số đo chiều cao, cân nặng đã lưu trong hồ sơ để đưa ra dòng gợi ý trực tiếp (Ví dụ: "Size M là lựa chọn vừa vặn nhất với bạn"). Sau khi khách hàng tin tưởng và chọn nút "Thêm vào giỏ hàng", hệ thống sẽ gửi yêu cầu cập nhật lên cơ sở dữ liệu, ghi nhận sản phẩm vào giỏ hàng của tài khoản đó, đồng thời hiển thị thông báo thành công và cập nhật số lượng hiển thị trên biểu tượng giỏ hàng ở thanh điều hướng.
  
Hình 3.x: BPMN quy trình tìm kiếm, lọc sản phẩm và thêm vào giỏ hàng
3.1.3.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hành động hệ thống
SHOP -01
Cá nhân hóa trang chủ
Block "Gợi ý dành cho bạn" hoạt động dựa trên Style Profile đang có hiệu lực (từ Session của Guest hoặc DB của Member).
Lấy dữ liệu Style Profile; đối chiếu thông số để hiển thị danh sách Combo Outfit phù hợp vóc dáng, tone da và phong cách. 
SHOP -02
Giới hạn lọc Body Type
Bộ lọc tìm kiếm nâng cao theo dáng người (Body Type) chỉ hiển thị và có hiệu lực đối với tài khoản Member đã làm Style Quiz.
Ẩn hoặc làm mờ bộ lọc Body Type đối với khách vãng lai và Member chưa hoàn thiện hồ sơ phong cách.
SHOP -03
Tính toán size thông minh
Tại trang chi tiết sản phẩm, hệ thống tự động chạy thuật toán đối chiếu số đo cơ thể của tài khoản với bảng quy chuẩn size của nhà sản xuất.
Render dòng văn bản gợi ý size động (Ví dụ: "Size L là lựa chọn vừa vặn nhất với bạn") theo thời gian thực khi trang chi tiết được tải.
SHOP -04
Lưu trữ giỏ hàng đa nền tảng 
Giỏ hàng của Member phải được đồng bộ trực tiếp vào CSDL đám mây. Giỏ hàng của Guest được lưu trữ tạm thời tại thiết bị cục bộ.
Phân nhánh lưu trữ dữ liệu; tự động hợp nhất giỏ hàng Local vào Database nếu Guest thực hiện đăng nhập sau đó. 
SHOP -05
Giới hạn thêm vào giỏ hàng 
Người dùng không được phép thêm một mặt hàng vào giỏ nếu số lượng tồn kho khả dụng của Size/Màu đó bằng 0. 
Tự động làm mờ nút "Thêm vào giỏ hàng" và chuyển trạng thái hiển thị thành "Tạm hết hàng" (Out of Stock). 
Bảng 3.x: Quy tắc nghiệp vụ quy trình Tìm kiếm, lọc sản phẩm và thêm vào giỏ hàng
3.1.3.3. Tình huống ngoại lệ
Tình huống 1:Không tìm thấy sản phẩm khớp với từ khóa hoặc bộ lọc.
Mô tả: Người dùng nhập từ khóa vô nghĩa hoặc áp dụng bộ lọc quá hẹp khiến không có sản phẩm nào thỏa mãn.
Cách xử lý: Hệ thống hiển thị trang thông báo: "Rất tiếc, Velura không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn." Đồng thời, hệ thống tự động đề xuất danh sách các sản phẩm thuộc block "Xu hướng tuần này" hoặc "Sản phẩm nổi bật" ở phía dưới để giữ chân khách hàng.
Tình huống 2: Sản phẩm hết hàng ngay tại thời điểm bấm "Thêm vào giỏ".
Mô tả: Tại thời điểm xem thì còn hàng, nhưng khi click nút "Thêm vào giỏ" thì số lượng tồn kho hệ thống đã về 0.
Cách xử lý: Hệ thống chặn hành động thêm, không tăng số lượng giỏ hàng, hiển thị thông báo lỗi: "Sản phẩm với kích cỡ/màu sắc này hiện đã hết hàng. Vui lòng chọn màu/size khác." và tự động cập nhật lại trạng thái nút bấm thành "Hết hàng".
Tình huống 3: Số lượng sản phẩm người dùng muốn thêm vào giỏ vượt quá số lượng tồn kho tối đa còn lại.
Mô tả: Sản phẩm chỉ còn 2 chiếc trong kho, nhưng người dùng nhập số lượng là 5 và bấm thêm vào giỏ.
Cách xử lý: Hệ thống chặn thao tác thêm vào giỏ. Hiển thị thông báo cảnh báo: "Số lượng sản phẩm trong kho chỉ còn [3]. Vui lòng điều chỉnh lại số lượng." Hệ thống tự động thay đổi con số trong ô nhập lượng về mức tối đa khả dụng là 3. 
Tình huống 4: Thành viên chưa tạo Hồ sơ phong cách nhưng muốn sử dụng bộ lọc Dáng người 
Mô tả: Khách hàng đã đăng nhập nhưng trước đó đã chọn bỏ qua bước làm khảo sát phong cách (Style Quiz). Hiện tại, khách hàng muốn sử dụng bộ lọc dáng người để tìm kiếm sản phẩm phù hợp.  
Cách xử lý: Hệ thống sẽ không cho phép áp dụng bộ lọc này. Khi khách hàng nhấp vào, sẽ xuất hiện một cửa sổ Popup hoặc hộp thoại nhỏ với thông báo: "Tính năng này cần thông tin số đo của bạn để hoạt động chính xác. Hãy nhấn vào đây để thiết lập Hồ sơ phong cách chỉ mất 2 phút!" cùng với nút chuyển hướng hỗ trợ khách hoàn tất thao tác một cách nhanh chóng.

---

3.1.4. Quy trình Đặt hàng và Thanh toán (User)
3.1.4.1. Mô tả quy trình
Quy trình được kích hoạt thông qua 2 điểm chạm chính: (1) Khi khách hàng nhấn "Tiến hành thanh toán" tại trang Giỏ hàng sau khi đã được xem lại toàn bộ sản phẩm và xác nhận số lượng mong muốn, hoặc (2) Khách hàng nhấn nút “Mua ngay” trực tiếp tại trang Chi tiết sản phẩm để mua nhanh một mặt hàng duy nhất.
Trước khi chuyển sang bước Thanh toán, tùy vào điểm kích hoạt mà hệ thống sẽ xử lý dữ liệu đầu vào khác nhau. Với luồng Giỏ hàng, hệ thống kiểm tra tình trạng tồn kho khả dụng của toàn bộ mặt hàng trong giỏ. Với luồng "Mua ngay", hệ thống khởi tạo một phiên thanh toán độc lập (chỉ chứa sản phẩm vừa chọn) mà không làm xáo trộn các sản phẩm đang lưu sẵn trong giỏ hàng. Nếu có sản phẩm đã hết hàng hoặc số lượng không còn đủ, hệ thống sẽ hiển thị thông báo cụ thể và yêu cầu người dùng điều chỉnh giỏ hàng trước khi tiếp tục thanh toán. Tại trang Thông tin đơn hàng, hệ thống tự động điền sẵn các thông tin đối với Member, còn với khách vãng lai thì hệ thống yêu cầu cung cấp các trường thông tin giao hàng bắt buộc: Số điện thoại, Họ tên, Địa chỉ nhận hàng (Email là tùy chọn). Sau khi nhấn "Tiếp tục", người dùng chuyển sang giao diện áp dụng Mã giảm giá (Voucher). Hệ thống lập tức kiểm tra tính hợp lệ của mã (còn hạn, còn lượt, đạt giá trị tối thiểu). Tại đây, người dùng chọn phương thức thanh toán: Trực tuyến hoặc Thanh toán khi nhận hàng (COD). Hệ thống hiển thị bảng tóm tắt đơn hàng: danh sách sản phẩm, tổng tiền hàng, phí vận chuyển, số tiền giảm từ khuyến mãi, và tổng thanh toán cuối cùng. Người dùng kiểm tra lại toàn bộ trước khi tiếp tục. 
Và ngay khi khách hàng nhấp vào nút “Xác nhận đặt hàng”, Guest sẽ nhận được mã OTP do hệ thống gọi dịch vụ gửi mã xác thực qua SMS đến số điện thoại vừa nhập. Khi người dùng nhập đúng mã OTP, hệ thống tự động khởi tạo một tài khoản Member mới ngầm định (với Số điện thoại làm tên đăng nhập và mật khẩu sinh ngẫu nhiên). Thông tin tài khoản/mật khẩu này được gửi qua SMS đến khách hàng để sử dụng cho các lần sau. Đồng thời, thông tin giao hàng vừa nhập được tự động lưu vào sổ địa chỉ của tài khoản mới. Lúc này, khách vãng lai đã chính thức trở thành Member, hệ thống gắn đơn hàng cho tài khoản mới này và tiến hành xử lý chốt đơn. 
Cụ thể tại bước lựa chọn phương thức thanh toán, luồng quy trình chia làm hai nhánh chính. Đối với  khách hàng chọn "Thanh toán khi nhận hàng" (COD), hệ thống ngay lập tức sinh mã đơn hàng với trạng thái "Chờ xác nhận", đồng thời ghi nhận số lượng tồn kho tương ứng của sản phẩm và trừ tồn kho sau khi xác nhận đơn hàng. Sau đó, hệ thống gửi thông tin xác nhận đặt hàng qua email/số điện thoại của khách hàng. Còn trường hợp khách hàng chọn thanh toán trực tuyến, hệ thống mã hóa thông tin đơn hàng và chuyển hướng sang cổng thanh toán trực tuyến. Hệ thống sẽ tạo đơn hàng với trạng thái “Chờ thanh toán” và chuyển hướng người dùng sang cổng thanh toán để thực hiện giao dịch. Sau khi khách hàng hoàn tất thao tác thanh toán, cổng thanh toán sẽ gửi kết quả xử lý về hệ thống thông qua callback. Nếu giao dịch thành công, hệ thống cập nhật trạng thái đơn hàng sang “Đã thanh toán”, tiến hành cập nhật tồn kho và hiển thị màn hình Cảm ơn xác nhận đặt hàng thành công. Nếu giao dịch thất bại hoặc bị hủy từ phía người dùng, đơn hàng vẫn được giữ lại với trạng thái “Chờ thanh toán”. Hệ thống đồng thời hiển thị thông báo lỗi tương ứng và cho phép khách hàng tiếp tục thanh toán lại hoặc chuyển sang phương thức COD mà không cần tạo lại đơn hàng từ đầu.
 
 
Hình 3.x: BPMN quy trình đặt hàng và thanh toán
3.1.4.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hành động hệ thống
PAY -01
Kiểm kho bắt buộc
Hệ thống bắt buộc phải chạy lệnh rà soát lại số lượng tồn kho thực tế của các mặt hàng trong giỏ ngay tại giây người dùng click thanh toán.
Khóa nút thanh toán; highlight màu đỏ sản phẩm vi phạm trong giỏ hàng kèm thông báo yêu cầu giảm số lượng hoặc xóa sản phẩm. 
PAY -02
Chuyển đổi Guest tự động qua OTP 
Guest bắt buộc phải xác thực số điện thoại qua OTP tại bước Xác nhận đặt hàng. Khi OTP hợp lệ, hệ thống tự động sinh tài khoản Member. 
Cấp tài khoản mới (Username=SĐT, Password ngẫu nhiên); tự động gửi SMS chứa thông tin đăng nhập; gán đơn hàng vào ID tài khoản mới này. 
PAY -03
Xác thực điều kiện Voucher
Mã giảm giá chỉ được tính là hợp lệ khi thỏa mãn đồng thời: trong thời hạn, tổng lượt dùng hệ thống còn, tài khoản chưa dùng hết giới hạn và đơn hàng đạt giá trị tối thiểu.
Chạy hàm validate voucher; tính toán trừ tiền trực tiếp vào tổng tiền hiển thị nếu hợp lệ, trả lý do lỗi cụ thể nếu không hợp lệ.
PAY -04
Linh hoạt chuyển đổi phương thức
Đơn hàng chọn thanh toán trực tuyến nhưng giao dịch thất bại/hủy sẽ không bị xóa bỏ, mà được phép chuyển đổi phương thức thanh toán. 
Giữ nguyên ID đơn hàng; cho phép người dùng click nút "Đổi sang thanh toán COD" để cập nhật Database và chuyển sang màn hình thành công. 
PAY -05
Xử lý Callback an toàn
Hệ thống phải xác thực chữ ký bảo mật từ cổng thanh toán gửi về trước khi cập nhật trạng thái đơn hàng để tránh lỗ hổng giả mạo tham số.
Kiểm tra tính đúng đắn của chuỗi checksum; nếu giao dịch thành công, cập nhật trạng thái đơn thành "Đã thanh toán", chuyển kho từ giữ chỗ sang trừ chính thức.
PAY -06
Quản lý tạm giữ tồn kho 
Tồn kho của sản phẩm phải được đưa vào trạng thái "Tạm giữ" ngay khi đơn COD được đặt thành công hoặc đơn thanh toán trực tuyến được giao dịch thành công để tránh bán vượt. 
Cập nhật số lượng tạm giữ trong Database; giảm trừ tồn kho vật lý khi đơn hàng chuyển trạng thái hoàn tất. 
Bảng 3.x: Quy tắc nghiệp vụ quy trình đặt hàng và thanh toán
3.1.4.3. Tình huống ngoại lệ
Tình huống 1: Sản phẩm trong giỏ hàng bị thay đổi trạng thái hoặc hết hàng đột ngột ngay trước bước bấm nút thanh toán cuối cùng.
Mô tả: Người dùng ở lại trang checkout quá lâu, trong thời gian đó sản phẩm bị admin gỡ bỏ hoặc khách hàng khác đã thanh toán hết kho lẻ.
Cách xử lý: Khi người dùng nhấn nút đặt hàng, hệ thống phát hiện tồn kho không đủ. Hệ thống hủy luồng tạo đơn, đưa người dùng quay lại trang Giỏ hàng ban đầu, hiển thị modal thông báo: "Rất tiếc, sản phẩm [Tên sản phẩm] vừa hết hàng hoặc không đủ số lượng khả dụng. Vui lòng điều chỉnh lại giỏ hàng."
Tình huống 2: Mã khuyến mãi hết lượt sử dụng trong lúc đang checkout .
Mô tả: Voucher có giới hạn số lượng toàn sàn và vừa bị người dùng khác áp dụng hết sạch ngay trước khi hệ thống kịp ghi nhận cho đơn hàng này.
Cách xử lý: Hệ thống thực hiện hoàn tác số tiền được giảm về 0, cập nhật lại bảng tóm tắt đơn hàng với giá gốc, hiển thị cảnh báo: "Mã giảm giá này vừa hết lượt sử dụng trên hệ thống. Vui lòng chọn mã giảm giá khác hoặc tiếp tục thanh toán đơn hàng với giá trị gốc."
Tình huống 3: Giao dịch thanh toán trên cổng thanh toán bị thất bại hoặc người dùng chủ động bấm "Hủy giao dịch và quay lại".
Mô tả: Người dùng nhập sai mã OTP ngân hàng, tài khoản không đủ số dư hoặc chủ động click nút quay lại website Velura từ trang của đối tác thanh toán .
Cách xử lý: Cổng thanh toán gửi trả mã phản hồi lỗi về URL callback của hệ thống. Hệ thống ghi nhận kết quả thanh toán lỗi nhưng không xóa đơn hàng. Hệ thống điều hướng người dùng đến giao diện thông báo lỗi thanh toán, giữ nguyên đơn hàng ở trạng thái "Chờ thanh toán", hiển thị rõ ràng 2 nút hành động tùy chọn: "Thử thanh toán lại" và "Chuyển đổi sang phương thức thanh toán khi nhận hàng (COD)" nhằm hỗ trợ khách hàng mua sắm nhanh chóng mà không cần thực hiện tạo lại đơn hàng từ đầu.
Tình huống 4: Mất kết nối đường truyền giữa hệ thống và cổng thanh toán sau khi khách hàng đã trừ tiền trong tài khoản.
Mô tả: Khách hàng đã thanh toán thành công phía ngân hàng, nhưng cổng thanh toán không thể gửi tín hiệu callback/IPN về cho Velura do sự cố mạng, khiến trạng thái đơn hàng trên website vẫn hiển thị "Chờ thanh toán".
Cách xử lý: Hệ thống thiết lập cơ chế kiểm tra định kỳ. Nếu đơn trực tuyến ở trạng thái "Chờ thanh toán" quá 15 phút, hệ thống tự động gọi API queryDR của đối tác thanh toán để truy vấn. Nếu được báo "Thành công", hệ thống lập tức cập nhật đơn thành "Đã thanh toán" và gửi email xác nhận muộn cho khách hàng kèm lời xin lỗi. Nếu kiểm tra báo giao dịch chưa diễn ra, hệ thống chuyển đơn sang trạng thái "Đã hủy" để giải phóng số lượng hàng hóa đang bị tạm giữ trong kho.  
Tình huống 5: Guest nhập Số điện thoại đã được đăng ký tài khoản Member khi đang điền thông tin Checkout. 
Mô tả: Tại bước điền form để nhận OTP, khách vãng lai nhập một số điện thoại đã tồn tại trên hệ thống (do người dùng này trước đó đã tạo tài khoản nhưng quên đăng nhập). 
Cách xử lý: Ngay khi khách hàng chuyển con trỏ chuột khỏi ô số điện thoại, hệ thống nhận diện số điện thoại đã tồn tại và chặn việc gửi mã OTP tạo tài khoản mới. Giao diện hiển thị cảnh báo: "Số điện thoại này đã có tài khoản. Vui lòng nhập mật khẩu để đăng nhập và tiếp tục thanh toán, hoặc sử dụng một số điện thoại khác." (Lúc này form yêu cầu nhập thêm Mật khẩu ngay tại màn hình Checkout). Đặc biệt, nếu khách hàng đi từ luồng "Mua ngay", hệ thống vẫn ghi nhớ ngữ cảnh sản phẩm hiện tại để tiếp tục thanh toán sau khi họ xác thực mật khẩu thành công.

---

3.1.5. Quy trình Theo dõi đơn hàng, Đánh giá và Yêu cầu trả hàng (User)
3.1.5.1. Mô tả quy trình 
Quy trình Theo dõi đơn hàng, Đánh giá và Đổi/trả hàng: 
Quy trình theo dõi đơn hàng: 
Quy trình được bắt đầu ngay sau khi khách hàng hoàn tất bước xác nhận đơn hàng (nhấn nút “Đặt hàng” sau khi điền thông tin và chọn phương thức thanh toán). Hệ thống tạo bản ghi đơn hàng với trạng thái ban đầu là “Chờ xác nhận” hoặc “Chờ thanh toán” (tùy phương thức). Từ thời điểm này, khách hàng có thể theo dõi trạng thái đơn hàng một cách liên tục qua mục “Đơn hàng của tôi” trong tài khoản.
Hệ thống cập nhật và hiển thị các trạng thái của đơn hàng theo thời gian thực kèm với các chú thích như: Chờ xác nhận, Đã xác nhận, Đang chuẩn bị hàng, Đã hủy đơn hàng, Đang giao hàng, Đã giao thành công /Giao hàng không thành công. Khách hàng có thể xem chi tiết từng bước kèm thời gian tương ứng. Khi đơn hàng được giao thành công thì hệ thống sẽ gửi thông báo qua email hoặc khách hàng có thể tự lên trang web tra mã đơn hàng để kiểm tra.
Trong khoảng thời gian từ sau khi đặt hàng cho đến trước khi đơn hàng chuyển sang trạng thái “Đang giao hàng” tức là khi đơn hàng chưa được bàn giao cho đơn vị vận chuyển, khách hàng có quyền yêu cầu hủy đơn. Thao tác này được thực hiện bằng cách nhấn nút “Hủy đơn” trong trang chi tiết đơn hàng, sau đó chọn lý do hủy từ danh sách có sẵn (ví dụ: thay đổi ý định, nhập sai thông tin, tìm thấy sản phẩm rẻ hơn…) hoặc nhập lý do khác. Hệ thống ghi nhận yêu cầu và chuyển đến bộ phận xử lý đơn hàng để phê duyệt. Nếu được chấp thuận (thường tự động nếu chưa thanh toán hoặc chưa chuẩn bị hàng), đơn hàng chuyển sang trạng thái “Đã hủy” và mọi giao dịch thanh toán (nếu có) được hoàn lại. Nếu yêu cầu bị từ chối (ví dụ đơn hàng đã đóng gói hoặc sắp giao), hệ thống thông báo lý do. Sau khi đơn hàng đã chuyển sang trạng thái “Đang giao hàng”, nút hủy sẽ bị ẩn hoặc vô hiệu hóa, không cho phép khách hàng yêu cầu hủy nữa.
Khi đơn hàng được vận chuyển đến địa chỉ giao và khách hàng xác nhận đã nhận hàng (bằng cách nhấn nút “Đã nhận hàng” trong hệ thống hoặc sau một khoảng thời gian mặc định nếu không có phản hồi, hệ thống sẽ chỉ tự động xác nhận khi có xác nhận giao hàng từ đơn vị vận chuyển), hệ thống cập nhật trạng thái đơn hàng thành “Hoàn thành”. Lúc này, giao diện chi tiết đơn hàng hiển thị hai nút hành động chính: “Đánh giá” và “Yêu cầu đổi/ trả”. Khách hàng có thể thực hiện một trong hai tùy theo nhu cầu.

Hình 3.x: BPMN - Quy trình theo dõi đơn hàng
Quy trình đánh giá đơn hàng: 
1. Quy trình đánh giá đơn hàng cũ
Quy trình bắt đầu khi khách hàng muốn đánh giá các đơn hàng cũ đã mua trước đây. Khách hàng truy cập vào trang chi tiết sản phẩm hoặc mục “Đơn hàng của tôi”, hệ thống sẽ hiển thị từ khóa (size quá to, size quá nhỏ,....) để khách hàng chọn. Nếu có từ khóa phù hợp thì khách hàng có thể chọn nếu không khách hàng trực tiếp bỏ qua để đi đến bước đánh giá sản phẩm, nhập nội dung nhận xét, chọn số sao (từ 1 đến 5) và tải ảnh minh họa (tùy chọn). Sau khi gửi, đánh giá được lưu tạm với trạng thái “Chờ duyệt” và đưa vào hàng đợi kiểm duyệt tự động. Công cụ kiểm duyệt quét nội dung để phát hiện từ ngữ vi phạm (thô tục, quảng cáo, spam) và kiểm tra tính hợp lệ của hình ảnh (tránh ảnh giả hoặc trùng lặp).
Nếu vượt qua kiểm duyệt, đánh giá được công khai trên trang chi tiết sản phẩm, góp phần tính lại điểm đánh giá trung bình. Nếu vi phạm, hệ thống từ chối hiển thị và gửi thông báo cho khách hàng kèm lý do (ví dụ: “Nội dung không phù hợp” hoặc “Hình ảnh không hợp lệ”) sau đó hệ thống sẽ gửi yêu cầu đánh giá lại đơn hàng. Quản trị viên có thể can thiệp thủ công để phê duyệt hoặc từ chối chính thức trong trường hợp cần xem xét thêm. Hệ thống nghiêm cấm mọi hình thức đổi đánh giá tích cực lấy quà tặng hoặc ưu đãi. Bất kỳ hành vi gian lận nào bị phát hiện sẽ dẫn đến khóa tài khoản và gỡ bỏ toàn bộ đánh giá giả mạo.

Hình 3.x: BPMN - Quy trình đánh giá đơn hàng cũ
2. Quy trình đánh giá đơn hàng mới: 
Quy trình bắt đầu khi khách hàng đơn hàng được giao thành công và khách hàng xác nhận đơn hàng. Khách hàng nếu muốn đánh giá sẽ nhấn đánh giá hiện trên giao diện để đánh giá đơn hàng còn không thì khách hàng sẽ thoát trang. Hệ thống sẽ hiển thị từ khóa (size quá to, size quá nhỏ,....) để khách hàng chọn. Nếu có từ khóa phù hợp thì khách hàng có thể chọn nếu không khách hàng trực tiếp bỏ qua để đi đến bước đánh giá sản phẩm, nhập nội dung nhận xét, chọn số sao (từ 1 đến 5) và tải ảnh minh họa (tùy chọn). Sau khi gửi, đánh giá được lưu tạm với trạng thái “Chờ duyệt” và đưa vào hàng đợi kiểm duyệt tự động. Công cụ kiểm duyệt quét nội dung để phát hiện từ ngữ vi phạm (thô tục, quảng cáo, spam) và kiểm tra tính hợp lệ của hình ảnh (tránh ảnh giả hoặc trùng lặp).
Nếu vượt qua kiểm duyệt, đánh giá được công khai trên trang chi tiết sản phẩm, góp phần tính lại điểm đánh giá trung bình. Nếu vi phạm, hệ thống từ chối hiển thị và gửi thông báo cho khách hàng kèm lý do (ví dụ: “Nội dung không phù hợp” hoặc “Hình ảnh không hợp lệ”) sau đó hệ thống sẽ gửi yêu cầu đánh giá lại đơn hàng. Quản trị viên có thể can thiệp thủ công để phê duyệt hoặc từ chối chính thức trong trường hợp cần xem xét thêm. Hệ thống nghiêm cấm mọi hình thức đổi đánh giá tích cực lấy quà tặng hoặc ưu đãi. Bất kỳ hành vi gian lận nào bị phát hiện sẽ dẫn đến khóa tài khoản và gỡ bỏ toàn bộ đánh giá giả mạo.


Hình 3.x: BPMN - Quy trình đánh giá đơn hàng mới
Quy trình đổi trả đơn hàng: 
Nếu khách hàng lựa chọn việc trả hàng và nhấn nút “Yêu cầu đổi/ trả” trong trang chi tiết đơn hàng, quy trình sẽ bắt đầu. Lúc này, hệ thống sẽ thực hiện bước sàng lọc tự động dựa trên các chính sách cơ bản: kiểm tra sản phẩm có còn trong thời hạn 7 ngày kể từ khi nhận hàng hay không và có nằm trong danh mục hạn chế đổi trả của Velura hay không. Nếu không thỏa mãn một trong các điều kiện trên, hệ thống sẽ hiển thị lý do từ chối cụ thể và kết thúc quy trình ngay lập tức.
Trường hợp vượt qua bước sàng lọc, khách hàng sẽ thực hiện điền Form yêu cầu trên giao diện bao gồm: lựa chọn sản phẩm cần xử lý, chọn hình thức mong muốn (Trả hàng hoàn tiền hoặc Đổi hàng), phiếu đổi/trả ở trạng thái “Chờ xác nhận”. Khách hàng tạm thời kết thúc tương ập lý do và tải lên hình ảnh minh chứng. Sau khi Khách hàng nhấn “Gửi yêu cầu”, hệ thống sẽ khởi tạo tác trực tiếp để chờ đợi kết quả phê duyệt hồ sơ từ phía Admin.
Khách hàng sẽ nhận được thông báo về kết quả phê duyệt hồ sơ. Nếu Admin từ chối (do minh chứng không hợp lệ), quy trình kết thúc. Nếu Admin phê duyệt, Khách hàng sẽ nhận được hướng dẫn chi tiết về địa chỉ kho nhận hàng và mã vận đơn để thực hiện gửi trả hàng về Velura. Trong suốt quá trình vận chuyển, Khách hàng có thể theo dõi trạng thái vận chuyển ngược ngay trên hệ thống cho đến khi hàng về tới kho.
Sau khi hàng về kho và trải qua bước kiểm tra thực tế từ Admin, Khách hàng nhận được thông báo cập nhật trạng thái phiếu thành “Đồng ý đổi/trả”. Nếu hàng thực tế bị từ chối (do lỗi từ phía khách hàng hoặc không đúng hiện trạng ban đầu), Khách hàng sẽ nhận được thông báo từ chối kèm hướng dẫn nhận lại sản phẩm. Nếu được đồng ý, quy trình sẽ tự động rẽ nhánh sang bước thực thi cuối cùng theo hình thức Khách hàng đã chọn ban đầu.
Kết quả cuối cùng của Khách hàng được thực hiện theo một trong hai nhánh:
Nhánh Trả hàng: Khách hàng chờ nhận tiền hoàn trả về phương thức thanh toán ban đầu (COD hoặc Ví điện tử) sau 4-5 ngày làm việc và nhận thông báo xác nhận hoàn tiền qua Email.
Nhánh Đổi hàng: Khách hàng theo dõi đơn hàng mới được hệ thống tự động khởi tạo. Nếu phát sinh chênh lệch giá, Khách hàng thực hiện thanh toán bổ sung (nếu giá cao hơn) hoặc nhận tiền hoàn chênh lệch (nếu giá thấp hơn). Sau khi đơn hàng mới được xác nhận, Khách hàng tiến hành nhận hàng tương tự như một đơn hàng mua mới thông thường.

Hình 3.x: BPMN - Quy trình yêu cầu đổi/trả đơn hàng
3.1.5.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hành động hệ thống
ORD-01
Hiển thị trạng thái đơn hàng
Hệ thống phải cập nhật và hiển thị chính xác các trạng thái đơn hàng theo thời gian thực: Chờ xác nhận, Đã xác nhận, Đang chuẩn bị hàng, Đang giao hàng, Đã giao thành công, Không giao hàng thành công, Đã hủy.
Tự động cập nhật trạng thái khi có biến động; gửi thông báo SMS/email khi đơn hàng được giao thành công.
ORD-02
Quyền hủy đơn hàng
Khách hàng chỉ được phép yêu cầu hủy đơn trong khoảng thời gian từ sau khi đặt hàng đến trước khi đơn hàng chuyển sang trạng thái “Đang giao hàng”.
Hiển thị nút “Hủy đơn” khi đủ điều kiện; ẩn/vô hiệu hóa nút sau khi chuyển sang “Đang giao hàng”.
ORD-03
Xử lý yêu cầu hủy đơn
Yêu cầu hủy đơn phải được phê duyệt tự động nếu đơn hàng chưa thanh toán hoặc chưa vào giai đoạn chuẩn bị hàng. Trường hợp đã đóng gói hoặc sắp giao, yêu cầu có thể bị từ chối.
Tự động duyệt hoặc chuyển đến bộ phận xử lý; ghi nhận lý do hủy; hoàn tiền (nếu có) theo đúng phương thức thanh toán ban đầu.
ORD-04
Xác nhận đã nhận hàng
Đơn hàng chỉ được chuyển sang trạng thái “Hoàn thành” khi khách hàng chủ động nhấn “Đã nhận hàng” hoặc có xác nhận giao hàng thành công từ đơn vị vận chuyển (sau thời gian mặc định).
Cập nhật trạng thái; kích hoạt nút “Đánh giá” và “Yêu cầu đổi/trả”.
REV-01
Điều kiện gửi đánh giá
Chỉ khách hàng đã mua sản phẩm (đơn hàng có trạng thái “Hoàn thành”) mới được phép gửi đánh giá. Mỗi sản phẩm trong một đơn hàng chỉ được đánh giá một lần.
Kiểm tra quyền dựa trên lịch sử đơn hàng; vô hiệu hóa nút đánh giá nếu chưa đủ điều kiện.
REV-02
Kiểm duyệt đánh giá tự động
Mọi đánh giá trước khi công khai phải trải qua bước kiểm duyệt tự động: lọc từ ngữ vi phạm (thô tục, quảng cáo, spam) và kiểm tra tính hợp lệ của hình ảnh (không trùng lặp, không ảnh giả).
Đánh giá hợp lệ → công khai, cập nhật điểm trung bình. Vi phạm → từ chối, gửi thông báo kèm lý do.
REV-03
Xử lý đánh giá gian lận
Nghiêm cấm mọi hình thức đổi đánh giá tích cực lấy quà tặng, ưu đãi hoặc lợi ích vật chất.
Phát hiện gian lận → khóa tài khoản, gỡ bỏ toàn bộ đánh giá giả mạo, ghi nhận vào audit log.
RET-01
Điều kiện yêu cầu đổi/trả
Sản phẩm được yêu cầu đổi/trả phải đáp ứng đồng thời: (a) còn trong thời hạn 2 ngày kể từ ngày nhận hàng; (b) chưa qua sử dụng; (c) còn nguyên tem mác, bao bì; (d) không bị hư hỏng do lỗi khách hàng.
Tự động kiểm tra các điều kiện trước khi tạo phiếu; từ chối ngay nếu không thỏa, hiển thị lý do.
RET-02
Thời hạn xử lý hoàn tiền
Hoàn tiền cho yêu cầu trả hàng được thực hiện trong vòng 4–5 ngày làm việc kể từ khi Velura nhận được hàng hoàn trả và kiểm tra tình trạng thực tế.
Tự động xử lý hoàn tiền theo phương thức thanh toán ban đầu (COD hoặc ví điện tử); gửi thông báo qua email.
RET-03
Xử lý đổi hàng
Khi đổi hàng, hệ thống tạo đơn hàng mới, trừ đi giá trị sản phẩm trả lại. Nếu sản phẩm mới có giá cao hơn → yêu cầu thanh toán chênh lệch; thấp hơn → hoàn lại chênh lệch.
Tự động tính toán chênh lệch, tạo đơn hàng mới, cập nhật trạng thái và giao hàng.
Bảng 3.X: Quy tắc nghiệp vụ quy trình Theo dõi, Đánh giá và Yêu cầu trả hàng (User)
3.1.5.3. Tình huống ngoại lệ
Tình huống 1: Khách hàng yêu cầu hủy đơn sau khi đơn đã chuyển sang “Đang giao hàng”
Mô tả: Nút hủy đơn đã bị vô hiệu hóa, nhưng khách hàng vẫn cố gắng thao tác hủy qua API hoặc liên hệ bộ phận chăm sóc khách hàng để yêu cầu hủy.
Cách xử lý: Hệ thống từ chối yêu cầu hủy, hiển thị thông báo “Đơn hàng đã được giao cho đơn vị vận chuyển, không thể hủy”. Đồng thời, hướng dẫn khách hàng chờ nhận hàng, sau đó thực hiện yêu cầu đổi/trả nếu có nhu cầu.
Tình huống 2: Đơn vị vận chuyển xác nhận giao hàng nhưng khách hàng không nhận được
Mô tả: Hệ thống nhận callback từ đơn vị vận chuyển báo trạng thái “Đã giao hàng”, nhưng khách hàng phản ánh chưa nhận được hàng.
Cách xử lý: Hệ thống tạm thời giữ trạng thái “Chờ xác nhận từ khách” thay vì chuyển ngay sang “Hoàn thành”. Gửi thông báo yêu cầu khách hàng xác nhận trong vòng 24 giờ. Nếu hết thời gian mà không có phản hồi, hệ thống chuyển sang bước xử lý khiếu nại và yêu cầu đơn vị vận chuyển xác minh.
Tình huống 3: Khách hàng không bấm “Đã nhận hàng” và đơn vị vận chuyển cũng không xác nhận
Mô tả: Sau thời gian dài (vượt quá thời gian giao hàng dự kiến), hệ thống không thể xác định trạng thái thực tế của đơn hàng do cả khách hàng và đơn vị vận chuyển đều không có phản hồi.
Cách xử lý: Hệ thống tự động gửi thông báo nhắc nhở khách hàng qua email và SMS. Sau 7 ngày không nhận được phản hồi, hệ thống chuyển đơn hàng sang trạng thái “Hoàn thành” để kích hoạt các tính năng đánh giá và đổi/trả, đồng thời ghi nhận log cảnh báo để quản trị viên kiểm tra sau.
Tình huống 4: Đánh giá bị từ chối do lỗi hệ thống (nhầm lẫn)
Mô tả: Nội dung và hình ảnh đánh giá hợp lệ, nhưng công cụ kiểm duyệt tự động đánh dấu vi phạm sai do lỗi thuật toán hoặc từ khóa nhạy cảm bị hiểu nhầm.
Cách xử lý: Quản trị viên có thể can thiệp thủ công, xem xét lại đánh giá và phê duyệt trực tiếp trên trang quản lý. Hệ thống ghi nhận hành động này vào audit log, đồng thời cập nhật đánh giá lên trang sản phẩm sau khi được phê duyệt.
Tình huống 5: Khách hàng gửi ảnh đánh giá không đúng định dạng hoặc quá dung lượng
Mô tả: Khách hàng tải lên ảnh có định dạng không được hỗ trợ (ví dụ: .bmp, .tiff) hoặc kích thước vượt quá giới hạn cho phép (ví dụ >10MB).
Cách xử lý: Hệ thống từ chối lưu ảnh, hiển thị thông báo lỗi cụ thể: “Ảnh phải có định dạng .jpg, .png và dung lượng tối đa 5MB”. Hướng dẫn khách hàng xử lý ảnh và gửi lại.
Tình huống 6: Hàng trả lại bị hư hỏng trong quá trình vận chuyển ngược
Mô tả: Sản phẩm khách hàng gửi trả về kho Velura bị hư hỏng (rách, vỡ, ướt, biến dạng) do lỗi của đơn vị vận chuyển trong quá trình vận chuyển ngược.
Cách xử lý: Nhân viên kho lập biên bản hiện trạng kèm hình ảnh. Hệ thống ghi nhận trạng thái “Hàng hư hỏng do vận chuyển”. Thông báo cho khách hàng và đơn vị vận chuyển để giải quyết bồi thường. Tạm dừng xử lý hoàn tiền/đổi hàng cho đến khi có kết luận cuối cùng.
Tình huống 7: Khách hàng yêu cầu đổi/trả ngoài thời hạn 2 ngày
Mô tả: Sản phẩm đã được giao thành công, nhưng khách hàng chỉ gửi yêu cầu đổi/trả sau ngày thứ 2 kể từ ngày nhận hàng (theo xác nhận của hệ thống).
Cách xử lý: Hệ thống tự động từ chối yêu cầu, hiển thị thông báo “Quá thời hạn đổi/trả (2 ngày)”. Khách hàng có thể liên hệ bộ phận chăm sóc khách hàng để được xem xét đặc biệt nếu có lý do chính đáng (ví dụ: hàng lỗi nhà sản xuất phát sinh muộn).
Tình huống 8: Hàng trả lại không còn tem mác hoặc đã qua sử dụng
Mô tả: Khi kiểm tra thực tế, kho Velura phát hiện sản phẩm khách hàng gửi trả đã được giặt, bung tem mác, có dấu hiệu sử dụng hoặc bị hư hỏng do lỗi của khách.
Cách xử lý: Hệ thống cập nhật trạng thái “Từ chối – hàng không đủ điều kiện”, gửi thông báo kèm hình ảnh minh chứng cho khách hàng. Nếu khách hàng yêu cầu nhận lại hàng, hệ thống yêu cầu thanh toán phí vận chuyển ngược; nếu không, hàng sẽ được xử lý theo quy định (hủy bỏ hoặc trả lại NCC nếu có thể).
Tình huống 9: Hết hàng khi đổi sang sản phẩm mới
Mô tả: Khách hàng yêu cầu đổi sang một sản phẩm khác, nhưng tại thời điểm xử lý, sản phẩm đó đã hết hàng trong kho (tồn kho = 0).
Cách xử lý: Hệ thống thông báo ngay cho khách hàng khi xác nhận yêu cầu: “Sản phẩm mong muốn đã hết hàng”. Đồng thời, đề xuất danh sách sản phẩm thay thế tương tự (dựa trên AI Recommendation) hoặc yêu cầu khách hàng chuyển sang hình thức “Trả hàng hoàn tiền”.

---

3.1.6. Quy trình Tư vấn AI Stylist Chatbot 
3.1.6.1. Mô tả quy trình
Quy trình Tư vấn AI Stylist Chatbot trên hệ thống Velura được kích hoạt khi người dùng (bao gồm Khách vãng lai - Guest và Thành viên - Member) nhấn vào biểu tượng bong bóng Chatbot ở góc dưới bên phải màn hình. Nhằm tối ưu hóa trải nghiệm khách hàng và tối đa hóa tỷ lệ chuyển đổi, hệ thống Velura thiết kế quy trình Chatbot vận hành theo hai luồng nghiệp vụ song song và độc lập, được phân loại tự động dựa trên ý định của người dùng:
Luồng 1 - Chatbot Giải đáp Câu hỏi Thường gặp (FAQ và Hỗ trợ vận hành)
Luồng này hướng đến mục tiêu hỗ trợ nhanh chóng các nhu cầu thông tin mang tính chất phổ thông và lặp đi lặp lại của khách hàng mà không cần sự can thiệp của tư vấn viên. Chatbot tự động trả lời các câu hỏi liên quan đến giá cả sản phẩm, các chương trình khuyến mãi hiện hành (Flash Sale, Seasonal Sale, Combo), hướng dẫn sử dụng website, chính sách đổi trả, thời gian giao hàng, phí vận chuyển hoặc các thắc mắc/lỗi thường gặp trong quá trình mua sắm trên hệ thống Velura. Phương thức xử lý của luồng này là AI truy xuất dữ liệu từ kho tri thức FAQ và thông tin cấu hình sản phẩm của hệ thống để sinh phản hồi văn bản chính xác với tốc độ tức thì (dưới 3 giây), đảm bảo khách hàng nhận được câu trả lời ngay lập tức mà không cần chờ đợi.

Hình 3.x: BPMN quy trình Chatbot câu hỏi thường
Luồng 2 - Tư vấn Chuyên sâu về Phong cách Thời trang Cá nhân hóa (AI Stylist Advice)
Luồng này đóng vai trò như một Stylist cá nhân thực thụ, giúp khách hàng khám phá phong cách, tự tin lựa chọn sản phẩm và tạo ra những bộ trang phục hoàn chỉnh. Khi khách hàng đặt các câu hỏi liên quan đến phối đồ (ví dụ: "Phối đồ đi hẹn hò mùa hè như thế nào?", "Dáng quả lê nên mặc gì khi đi làm?"), tư vấn phong cách theo dáng người hoặc tông da, hoặc yêu cầu đề xuất trang phục cho một dịp cụ thể, Chatbot sẽ tự động phân tích ý định. Đặc biệt, các gợi ý không chỉ dừng lại ở văn bản mô tả mà được trực quan hóa thành các Outfit/Item dưới dạng hình ảnh thực tế. Mỗi sản phẩm được gợi ý sẽ hiển thị dưới dạng một thẻ sản phẩm tương tác chứa đầy đủ thông tin: hình ảnh sản phẩm, tên, giá bán, kèm các nút chức năng "Thêm vào giỏ hàng" hoặc "Mua ngay", cho phép người dùng chốt đơn trực tiếp ngay tại cửa sổ chat mà không cần chuyển hướng sang trang khác, rút ngắn tối đa hành trình mua sắm.

Cơ chế Lưu trữ Phối đồ Yêu thích và Phân quyền Trạng thái Người dùng
Nhằm khuyến khích người dùng đăng ký tài khoản và gia tăng giá trị vòng đời khách hàng, hệ thống tích hợp tính năng "Lưu phối đồ yêu thích" trực tiếp trên các Outfit được Chatbot gợi ý. Luồng lưu trữ này được phân tách nghiêm ngặt theo trạng thái đăng nhập của người dùng:
Đối với Người dùng đã Đăng nhập (Member): Hệ thống ghi nhận ID người dùng và lưu vĩnh viễn tổ hợp phối đồ này vào Cơ sở dữ liệu đám mây. Người dùng có thể truy cập, xem lại hoặc mua lại các set đồ yêu thích này ở bất kỳ thiết bị nào và trong các phiên làm việc sau này, tạo nên một "tủ đồ cá nhân hóa" theo thời gian.
Đối với Khách vãng lai (Guest - Chưa đăng nhập): Toàn bộ lịch sử trò chuyện, kết quả Style Quiz tạm thời và danh sách phối đồ yêu thích sẽ chỉ được lưu trữ tạm thời trong Session hiện hành (Session Storage/Cookie). Chỉ cần người dùng tắt tab, tắt trình duyệt hoặc tải lại trang, toàn bộ nội dung này sẽ bị xóa sạch khỏi hệ thống. Hệ thống cảnh báo người dùng ngay khi họ thực hiện hành động lưu phối đồ bằng thông báo: "Bạn đang trải nghiệm dưới quyền Khách vãng lai. Vui lòng Đăng ký hoặc Đăng nhập tài khoản để lưu giữ vĩnh viễn phối đồ này vào tủ đồ cá nhân!", kèm nút dẫn lối nhanh đến trang Đăng ký/Đăng nhập để hỗ trợ chuyển đổi khách hàng tiềm năng thành thành viên chính thức, đồng thời tự động đồng bộ dữ liệu phiên tạm vào tài khoản mới sau khi xác thực thành công. 
→ Chi tiết về cơ chế đồng bộ và cảnh báo được mô tả trong các quy tắc nghiệp vụ CHAT-06 và CHAT-07.
Xử lý khi Chatbot không đáp ứng được yêu cầu
Trong trường hợp câu hỏi của khách hàng vượt quá khả năng xử lý của AI (ví dụ: khiếu nại gay gắt, yêu cầu phức tạp, hoặc người dùng chủ động yêu cầu gặp nhân viên), hệ thống thực hiện chuyển tiếp cuộc trò chuyện sang bộ phận Chăm sóc khách hàng (CSKH). Chatbot hiển thị thông báo "Đang chuyển sang nhân viên hỗ trợ", tạo phiên chat mới và gửi thông báo đẩy (real-time notification) đến Dashboard của CSKH kèm theo lịch sử hội thoại đầy đủ để nhân viên tiếp quản liền mạch. Đối với Guest, phiên tạm vẫn được tạo nhưng không lưu lịch sử sau khi kết thúc; đối với Member, toàn bộ lịch sử (bao gồm phần chuyển giao) được lưu đầy đủ vào tài khoản.

3.1.6.2. Quy tắc nghiệp vụ
Mã quy tắc
Tên quy tắc
Mô tả chi tiết
Hành động hệ thống
CHAT-01
Quyền sử dụng chatbot
Cả khách vãng lai (Guest) và khách hàng đã đăng nhập (Member) đều được phép tương tác với chatbot không giới hạn. Cả hai đều có thể gửi câu hỏi dạng văn bản và tải lên hình ảnh kèm theo.
Kiểm tra session/token; hiển thị giao diện nhập liệu đầy đủ (text + ảnh) cho cả hai loại người dùng.
CHAT-02
Phân luồng ý định tự động
Hệ thống phải tự động phân loại ý định (Intent Classification) của người dùng thành 2 nhóm: Câu hỏi thường (FAQ) hoặc Tư vấn phong cách cá nhân hóa.
AI Gateway quét từ khóa và ngữ nghĩa (NLP); phân luồng xử lý sang kho dữ liệu FAQ hoặc gọi API Stylist Service tương ứng.
CHAT-03
Hiển thị sản phẩm mua trực tiếp (Shoppable Card)
Các sản phẩm được Chatbot gợi ý trong luồng Tư vấn phối đồ bắt buộc phải hiển thị dưới dạng Card sản phẩm có thể tương tác, cho phép thêm vào giỏ hoặc mua ngay ngay trong cửa sổ chat.
Gọi API sản phẩm để nạp hình ảnh, tên, giá, size khả dụng và render trực tiếp nút "Thêm vào giỏ" và "Mua ngay" trên cửa sổ Chatbot.
CHAT-04
Giới hạn nội dung tư vấn
Chatbot chỉ trả lời các câu hỏi liên quan đến sản phẩm, phong cách thời trang, phối đồ, kích cỡ, chính sách vận chuyển và đổi trả. Không trả lời các câu hỏi ngoài phạm vi.
Lọc câu hỏi; nếu ngoài phạm vi, trả lời mặc định: "Xin lỗi, tôi chỉ có thể tư vấn về thời trang và sản phẩm của Velura."
CHAT-05
Lưu trữ lịch sử hội thoại
Toàn bộ lịch sử hội thoại của Member được lưu vĩnh viễn, gắn với tài khoản. Đối với Guest, lịch sử chỉ được lưu tạm trong session và tự động xóa khi đóng trình duyệt.
Member: lưu vào collection chat_history với userId. Guest: lưu vào session storage hoặc collection tạm với sessionId, xóa khi phiên kết thúc.
CHAT-06
Đồng bộ dữ liệu từ Session sang Database
Khi Guest đăng ký tài khoản thành công từ luồng gợi ý của Chatbot, toàn bộ lịch sử phối đồ yêu thích tạm thời trong Session phải được đồng bộ sang tài khoản mới.
Quét Session Storage; gọi API chuyển đổi dữ liệu và insert các bản ghi phối đồ tạm vào bảng AI_LOG liên kết với user_id mới tạo.
CHAT-07
Cảnh báo mất dữ liệu cho Guest
Hệ thống phải kích hoạt Pop-up cảnh báo mất dữ liệu khi Guest có hành động đóng trang hoặc reload nếu trong Session đang lưu trữ phối đồ yêu thích chưa được đồng bộ.
Bắt sự kiện beforeunload trên trình duyệt; hiển thị thông điệp cảnh báo và nút chuyển hướng đăng ký tài khoản.
CHAT-08
Bảo mật hình ảnh
Hình ảnh do người dùng tải lên (cả Guest và Member) chỉ được sử dụng để phân tích nội dung và không được chia sẻ với bên thứ ba. 
Mã hóa đường dẫn ảnh; ghi log truy cập; thiết lập cơ chế tự động xóa.
CHAT-09
Chuyển tiếp khi chatbot không xử lý được
Nếu câu hỏi của người dùng vượt quá khả năng xử lý của AI, hệ thống phải chuyển hội thoại sang nhân viên CSKH.
Hiển thị thông báo "Đang chuyển sang nhân viên hỗ trợ"; tạo phiên chat mới với CSKH; gửi thông báo nội bộ. Đối với Guest, tạo phiên tạm nhưng không lưu lịch sử.
CHAT-10
Thời gian phản hồi tối đa
Chatbot phải trả lời trong vòng 5 giây đối với câu hỏi văn bản; đối với câu hỏi có hình ảnh, thời gian tối đa là 15 giây.
Đo lường thời gian xử lý; nếu vượt quá, gửi phản hồi dự phòng "Đang xử lý, vui lòng chờ" và xử lý bất đồng bộ.
CHAT-11
Gợi ý đăng nhập để lưu lịch sử
Khi Guest có nhu cầu lưu lại lịch sử trò chuyện hoặc muốn được cá nhân hóa sâu hơn, chatbot sẽ gợi ý đăng nhập hoặc đăng ký tài khoản.
Hiển thị tin nhắn kèm link "Đăng nhập / Đăng ký để lưu lịch sử trò chuyện và được tư vấn cá nhân hóa hơn."
CHAT-12
Phản hồi tư vấn dựa trên Style Profile
Trong luồng Tư vấn cá nhân hóa, AI Stylist bắt buộc phải sử dụng các thông số từ Style Profile (nếu có) để làm ngữ cảnh nền.
Backend tự động truy vấn dữ liệu từ bảng STYLE_PROFILE và chèn vào system prompt gửi đến mô hình LLM trước khi sinh câu trả lời.
CHAT-13
Cập nhật hồ sơ phong cách từ hội thoại
Nếu Member cung cấp thông tin về số đo, sở thích trong quá trình trò chuyện, chatbot có thể đề xuất cập nhật vào hồ sơ phong cách.
Hiển thị câu hỏi xác nhận; nếu đồng ý, tự động cập nhật STYLE_PROFILE.
CHAT-14
Giới hạn dung lượng và định dạng ảnh
Hình ảnh tải lên Chatbot phải tuân thủ đúng định dạng và dung lượng quy chuẩn.
Chỉ chấp nhận JPG, JPEG, PNG; dung lượng dưới 5MB. Quét kiểm duyệt tự động để từ chối ảnh không hợp lệ hoặc nhạy cảm.
CHAT-15
Xử lý khi sản phẩm hết hàng
Khi AI đề xuất sản phẩm đã hết hàng, hệ thống vẫn hiển thị gợi ý nhưng kèm thông báo và đề xuất sản phẩm thay thế có sẵn hàng.
Kiểm tra tồn kho trước khi render Card; hiển thị trạng thái "Tạm hết hàng" và gợi ý thay thế từ AI Recommendation.
CHAT-16
Giới hạn tốc độ gửi tin nhắn (Rate Limiting)
Hệ thống phải áp dụng giới hạn tốc độ để ngăn chặn spam. Mỗi Session/tài khoản tối đa 20 tin nhắn/phút.
Khi vượt ngưỡng, tạm khóa gửi tin nhắn trong 5 phút; hiển thị cảnh báo; ghi nhận vào Audit Log.
Bảng 3.X: Bảng quy tắc nghiệp vụ - Quy trình Tư vấn AI Stylist Chatbot (User)
3.1.6.3. Tình huống ngoại lệ
Tình huống 1: Chatbot không thể kết nối đến AI service
Mô tả: Hệ thống gửi yêu cầu đến mô hình AI để xử lý câu hỏi của người dùng, nhưng API không phản hồi trong thời gian quy định (ví dụ quá 5 giây) do quá tải hoặc lỗi mạng.
Cách xử lý: Chatbot hiển thị tin nhắn dự phòng: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau vài phút hoặc liên hệ hotline của Velura." Đồng thời, ghi log lỗi để quản trị viên kiểm tra. Hệ thống đề xuất người dùng gửi câu hỏi qua email hỗ trợ.
Tình huống 2: Người dùng gửi ảnh có nội dung nhạy cảm hoặc không phù hợp
Mô tả: Người dùng tải lên ảnh chứa nội dung thô tục, bạo lực, vi phạm pháp luật hoặc hoàn toàn không liên quan đến thời trang.
Cách xử lý: Hệ thống tự động phát hiện qua công cụ kiểm duyệt ảnh. Chặn không xử lý ảnh, chỉ xử lý phần văn bản (nếu có). Gửi thông báo: "Ảnh không hợp lệ, vui lòng chỉ gửi ảnh liên quan đến thời trang." Nếu vi phạm nhiều lần (Member), tạm khóa chức năng gửi ảnh; Guest từ chối xử lý ảnh trong phiên hiện tại.
Tình huống 3: Người dùng yêu cầu tư vấn sản phẩm đã ngừng kinh doanh
Mô tả: Người dùng hỏi về một sản phẩm đã bị ngừng bán (trạng thái Discontinued) hoặc không còn trong danh mục.
Cách xử lý: Chatbot trả lời: "Sản phẩm [tên] hiện không còn bán. Em có thể gợi ý cho bạn một số sản phẩm tương tự nhé." Sau đó, hiển thị danh sách sản phẩm thay thế được gợi ý bởi AI Recommendation.
Tình huống 4: Nhân viên CSKH không thể tiếp nhận khi chatbot chuyển tiếp
Mô tả: Câu hỏi vượt quá khả năng xử lý của AI, nhưng tất cả nhân viên CSKH đều bận hoặc ngoài giờ làm việc.
Cách xử lý: Chatbot thông báo: "Hiện tại các nhân viên đang bận. Câu hỏi của bạn đã được ghi nhận. Chúng tôi sẽ phản hồi qua email trong vòng 24 giờ." Hệ thống tạo ticket hỗ trợ. Member ticket lưu theo tài khoản; Guest theo email (nếu có) hoặc session tạm.
Tình huống 5: Người dùng gửi ảnh quá lớn hoặc sai định dạng
Mô tả: Người dùng tải lên ảnh có dung lượng vượt quá giới hạn (ví dụ >10MB) hoặc định dạng không được hỗ trợ (ví dụ .bmp, .webp).
Cách xử lý: Chatbot hiển thị thông báo lỗi: "Ảnh phải có dung lượng dưới 5MB và định dạng .jpg, .png. Bạn vui lòng nén hoặc chuyển đổi ảnh rồi gửi lại nhé."
Tình huống 6: Người dùng liên tục gửi tin nhắn rác 
Mô tả: Hệ thống phát hiện một tài khoản (hoặc địa chỉ IP) gửi quá nhiều tin nhắn trong thời gian ngắn (ví dụ >20 tin nhắn/phút) với nội dung trùng lặp hoặc vô nghĩa.
Cách xử lý: Áp dụng Rate Limiting. Tạm thời chặn tài khoản/IP trong 5 phút, hiển thị thông báo: "Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi vài phút rồi thử lại." Ghi log để admin xem xét xử lý lâu dài.
Tình huống 7: Hình ảnh người dùng gửi không thể nhận diện được nội dung
Mô tả: Người dùng tải lên ảnh mờ, tối, bị che khuất hoặc không rõ đối tượng, khiến AI không thể phân tích phong cách hoặc sản phẩm.
Cách xử lý: Chatbot trả lời: "Tôi không nhìn rõ ảnh của bạn. Bạn có thể gửi lại ảnh rõ hơn hoặc mô tả bằng chữ được không ạ?" Member ảnh lưu với nhãn "không xác định"; Guest ảnh không lưu sau phiên.
Tình huống 8: Người dùng Guest bấm "Lưu phối đồ yêu thích" nhưng chưa đăng nhập
Mô tả: Khách vãng lai nhận được gợi ý phối đồ từ Chatbot, thấy ưng ý và bấm nút "Lưu phối đồ yêu thích" nhưng hệ thống không có ID tài khoản để ghi nhận.
Cách xử lý: Hệ thống chặn thao tác ghi vào DB. Hiển thị Popup: "Tủ đồ yêu thích chỉ dành cho thành viên của Velura. Toàn bộ phối đồ này sẽ bị mất khi bạn tắt trình duyệt. Đăng nhập hoặc Đăng ký tài khoản ngay để lưu giữ vĩnh viễn!" Nếu đồng ý, lưu tạm vào Session và điều hướng đến trang Đăng ký/Đăng nhập; sau xác thực, tự động đồng bộ.
Tình huống 9: Người dùng Guest reload hoặc tắt trình duyệt làm mất lịch sử phối đồ yêu thích
Mô tả: Khách vãng lai đã thực hiện Style Quiz và lưu một số set đồ yêu thích trong session, sau đó vô tình reload hoặc tắt trình duyệt.
Cách xử lý: Do lưu trữ Session, dữ liệu bị xóa khi phiên kết thúc. Khi truy cập lại, chatbot hiển thị lời chào mặc định và gợi ý: "Chào bạn! Bạn có muốn làm lại Style Quiz để nhận tư vấn phối đồ cá nhân hóa, hoặc Đăng nhập để khôi phục tủ đồ yêu thích?"
Tình huống 10: Sản phẩm được AI gợi ý bị hết hàng giữa lúc người dùng đang xem
Mô tả: Chatbot đã hiển thị Card sản phẩm gợi ý (còn hàng), nhưng trước khi người dùng kịp bấm "Thêm vào giỏ", sản phẩm đó vừa bị khách hàng khác mua hết (tồn kho về 0).
Cách xử lý: Khi người dùng bấm vào nút "Thêm vào giỏ" hoặc "Mua ngay", hệ thống kiểm tra lại tồn kho thời gian thực. Nếu đã hết, hiển thị thông báo: "Sản phẩm này vừa được bán hết. Tuy nhiên, bạn có thể tham khảo sản phẩm thay thế tương tự sau." và tự động gợi ý thay thế.
Tình huống 11: Lỗi đồng bộ dữ liệu từ Session sang Database khi đăng ký
Mô tả: Guest đăng ký tài khoản thành công, hệ thống cố gắng đồng bộ dữ liệu phối đồ yêu thích từ Session sang Database nhưng xảy ra lỗi (mất kết nối DB, cấu trúc bảng không khớp).
Cách xử lý: Hệ thống vẫn tạo tài khoản và đăng nhập thành công, nhưng dữ liệu phối đồ tạm thời bị mất. Chatbot hiển thị thông báo: "Chào mừng bạn đến với Velura! Hệ thống đang xử lý đồng bộ dữ liệu phối đồ yêu thích của bạn. Nếu có sự cố, bạn có thể liên hệ CSKH để được hỗ trợ." Ghi log lỗi để admin kiểm tra và khắc phục.

---

## PHẦN 2: ĐẶC TẢ CHI TIẾT CÁC USE CASE PHÂN HỆ USER

3.3.2.1. Đặc tả use case: Đăng ký tài khoản 
Thuộc tính
Chi tiết
Mã Use Case
UC-C01
Tên Use Case
Đăng ký tài khoản
Description
Là khách vãng lai (Guest), muốn đăng ký tài khoản mới để trở thành thành viên (Member) và sử dụng các chức năng cá nhân hóa, mua sắm của hệ thống Velura. 
Actor(s)
Khách vãng lai (Guest) là tác nhân chính
Hệ thống gửi OTP (Email/SMS) là tác nhân phụ
Priority
Must Have
Trigger
Người dùng chọn chức năng "Đăng ký" trên giao diện.
Pre-Condition(s)
1. Người dùng chưa có tài khoản hoặc chưa đăng nhập vào hệ thống.
2. Thiết bị có kết nối Internet.
3. Hệ thống gửi OTP sẵn sàng hoạt động.
Post-Condition(s)
1. Tài khoản mới được tạo và kích hoạt thành công (trạng thái active) trong kho D1.
2. Hệ thống tự động đăng nhập và cấp quyền Member cho người dùng.
3. Sự kiện đăng ký được ghi nhận vào kho Nhật ký hoạt động (D9).
Basic Flow
1. Người dùng truy cập trang đăng ký tài khoản.
2. Hệ thống hiển thị form yêu cầu nhập: Họ tên, Email/SĐT, Mật khẩu.
3. Người dùng nhập thông tin. Ngay khi hoàn tất nhập hoặc rời chuột khỏi ô Email/SĐT (onBlur), hệ thống tự động bắn API ngầm xuống kho D1 để kiểm tra định dạng và tính duy nhất.
4. Người dùng nhấn nút "Đăng ký" (Nút chỉ khả dụng khi bước 3 hợp lệ).
5. Hệ thống tạo mã OTP và gửi đến Email/SĐT của người dùng qua tác nhân phụ.
6. Người dùng nhập mã OTP nhận được.
7. Hệ thống xác thực mã OTP thành công.
8. Hệ thống mã hóa mật khẩu, tạo tài khoản mới. 
9. Hệ thống thông báo "Đăng ký thành công", tự động đăng nhập và điều hướng về Trang chủ.
10. Hệ thống ghi nhận sự kiện vào kho Nhật ký hoạt động (D9).
Alternative Flow
3a. Lỗi nhập liệu hoặc trùng lặp định danh tại chỗ:
- Nếu sai định dạng hoặc Email/SĐT đã tồn tại trong DB, hệ thống hiển thị thông báo lỗi trực tiếp bên cạnh ô nhập và vô hiệu hóa nút "Đăng ký".
- Người dùng hiệu chỉnh lại thông tin hợp lệ. Quay lại bước 3.
Exception Flow
3b. Lỗi kết nối DB khi check trùng ngầm:
- Hệ thống hiển thị thông báo lỗi kết nối, ghi log lỗi cho Admin và tạm hoãn bước check trùng tại chỗ.
5a. OTP hết hạn (quá 5 phút):
- Hệ thống thông báo mã hết hạn. Người dùng chọn "Gửi lại mã".Quay lại bước 5.
6a. Nhập sai OTP quá 3 lần liên tiếp:
- Hệ thống thông báo lỗi, từ chối xác thực và khóa chức năng đăng ký của IP/Tài khoản này trong 5 phút.
Business Rules
BR-REG-01: Mỗi Email hoặc Số điện thoại chỉ được đăng ký một tài khoản duy nhất.
BR-REG-02: Mật khẩu phải có độ dài tối thiểu 8 ký tự, bao gồm ít nhất một chữ hoa, một chữ thường và một chữ số.
BR-REG-03: Mã OTP có hiệu lực tối đa trong 5 phút kể từ khi phát hành.
BR-REG-04: Hệ thống tự động khóa đăng ký 5 phút nếu nhập sai mã OTP quá 3 lần liên tiếp.
Non-Functional Requirement
NFR-REG-01: Thời gian xử lý và gửi OTP qua SMS/Email Gateway không quá 10 giây.
NFR-REG-02: Toàn bộ quá trình truyền tải gói tin đăng ký phải được mã hóa qua giao thức HTTPS.
NFR-REG-03: API check trùng ngầm tại bước 3 phải sử dụng kỹ thuật Debounce, thời gian phản hồi không quá 200ms.
Bảng 3.: Đặt tả usecase UC-C01 Đăng ký tài khoản

---

3.3.2.2. Đặc tả use case: Đăng nhập 
Thuộc tính
Chi tiết
Mã Use Case
UC-C02
Tên Use Case
Đăng nhập (thành viên)
Description
Cho phép người dùng đã có tài khoản thành viên thực hiện xác thực thông tin đăng nhập để truy cập vào hệ thống dưới quyền Member, nhằm sử dụng đầy đủ các chức năng của Velura.
Actor(s)
Khách hàng (Member) là tác nhân chính kích hoạt.
Priority
Must Have
Trigger
Người dùng chủ động nhấn nút "Đăng nhập" trên thanh điều hướng hoặc hệ thống tự động điều hướng yêu cầu đăng nhập khi người dùng kích hoạt các luồng chức năng bắt buộc quyền thành viên.
Pre-Condition(s)
1. Người dùng đã có tài khoản được khởi tạo hợp lệ trên hệ thống.
2. Thiết bị của người dùng có kết nối Internet để kết nối tới kho dữ liệu.
Post-Condition(s)
1. Hệ thống xác thực quyền truy cập hợp lệ và cấp phiên làm việc dưới quyền Member.
2. Hệ thống đồng bộ, hợp nhất giỏ hàng tạm thời và Style Quiz (nếu có) từ phiên khách vãng lai ban đầu sang tài khoản chính thức.
3. Sự kiện đăng nhập thành công và lịch sử hoạt động được ghi vết vào kho D1 và kho D9.
Basic Flow
1. Người dùng truy cập vào giao diện Đăng nhập của hệ thống.
2. Hệ thống hiển thị biểu mẫu đăng nhập yêu cầu nhập: Email/Số điện thoại và Mật khẩu.
3. Người dùng nhập đầy đủ thông tin yêu cầu và nhấn nút "Đăng nhập".
4. Hệ thống tiếp nhận gói tin, thực hiện đọc dữ liệu xác thực (gồm mật khẩu đã băm, vai trò và trạng thái) từ kho dữ liệu Người dùng D1.
5. Hệ thống thực hiện đối chiếu thông tin đăng nhập và kiểm tra trạng thái tài khoản đang hoạt động.
6. Hệ thống xác nhận thông tin trùng khớp hoàn toàn, cấp token phiên làm việc hợp lệ cho Member.
7. Hệ thống cập nhật thời gian đăng nhập gần nhất và reset số lần đăng nhập sai về 0 tại kho D1.
8. Hệ thống thông báo đăng nhập thành công và điều hướng người dùng về Trang chủ hoặc trang chức năng đang thực hiện dở dang.
9. Hệ thống tự động ghi nhận sự kiện đăng nhập vào kho dữ liệu Nhật ký hoạt động (D9).
Alternative Flow
4a. Hợp nhất dữ liệu từ phiên làm việc ẩn danh :
- Tại bước 4, hệ thống kiểm tra nếu trước khi đăng nhập, người dùng đang có một phiên khách vãng lai chứa giỏ hàng tạm thời hoặc hồ sơ Style Quiz tạm thời.
- Hệ thống tự động kích hoạt luồng gọi API để chuyển đổi, hợp nhất toàn bộ dữ liệu tạm thời đó sang tài khoản chính thức của Member, đồng thời cập nhật trạng thái phiên tạm và giải phóng bộ nhớ. Tiếp tục bước 5 của luồng chính.
Exception Flow
3a. Nhập sai thông tin Đăng nhập (Email/SĐT hoặc Mật khẩu không khớp):
- Hệ thống hiển thị thông báo lỗi trực tiếp trên giao diện: "Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại."
- Hệ thống thực hiện đếm tăng số lần đăng nhập sai thêm 1 đơn vị vào bản ghi tài khoản tại kho D1. Quay lại bước 2 để người dùng nhập lại.
5a. Tài khoản đã bị khóa tạm thời hoặc khóa vĩnh viễn:
- Hệ thống kiểm tra thấy trạng thái tài khoản đang bị khóa do Admin khóa hoặc do vi phạm quy tắc hệ thống.
- Hệ thống chặn luồng đăng nhập, hiển thị thông báo lỗi cụ thể: "Tài khoản của bạn hiện đang bị khóa. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết." và kết thúc quy trình.
5b. Tài khoản bị khóa tự động do nhập sai quá số lần quy định:
- Tại bước 3a, nếu hệ thống ghi nhận số lần đăng nhập sai liên tiếp đạt ngưỡng quy định, hệ thống tự động kích hoạt lệnh khóa tạm thời tài khoản.
- Hệ thống cập nhật mốc thời gian khóa tại kho D1, ghi nhận sự kiện bảo mật khẩn cấp vào kho Nhật ký hoạt động (D9) và hiển thị thông báo cho người dùng.
Business Rules
BR-C02-01: Hệ thống bắt buộc sử dụng phương thức băm mật khẩu bảo mật.
BR-C02-02: Hệ thống tự động khóa tài khoản tạm thời trong vòng 15 phút nếu người dùng thực hiện nhập sai mật khẩu liên tiếp quá 5 lần.
BR-C02-03: Khi một phiên khách vãng lai được chuyển đổi thành công sang tài khoản thành viên, phiên bắt buộc phải được gắn độc nhất để tránh trùng lặp đồng bộ dữ liệu.
Non-Functional Requirement
NFR-C02-01: Thời gian xử lý xác thực thông tin đăng nhập và phản hồi điều hướng giao diện không được vượt quá 1.5 giây.
NFR-C02-02: Toàn bộ dữ liệu mật khẩu thô gửi từ client lên server bắt buộc phải được truyền tải thông qua giao thức mã hóa bảo mật HTTPS/TLS.
NFR-C02-03: Hệ thống phải áp dụng cơ chế thiết lập thời gian hết hạn của mã Token phiên làm việc sau 7 ngày nếu người dùng không tích chọn "Ghi nhớ đăng nhập".
Bảng 3.: Đặt tả usecase UC-C02 Đăng nhập

---

3.3.2.3. Đặc tả use case: Đặt lại mật khẩu 

Thuộc tính
Chi tiết
Mã Use Case
UC-C03
Tên Use Case
Đặt lại mật khẩu (Quên mật khẩu)
Description
Cho phép người dùng thực hiện quy trình khôi phục và thiết lập lại mật khẩu mới thông qua phương thức xác thực mã OTP khi vô tình quên mật khẩu đăng nhập hệ thống.
Actor(s)
Tác nhân chính: Khách vãng lai (Guest), Khách hàng (Member).
Priority
Must Have
Trigger
Người dùng nhấn vào liên kết "Quên mật khẩu?" tại giao diện màn hình Đăng nhập.
Pre-Condition(s)
1. Tài khoản Email hoặc Số điện thoại yêu cầu khôi phục phải tồn tại trên hệ thống.
2. Dịch vụ gửi mã OTP ngoại vi đang ở trạng thái sẵn sàng hoạt động.
Post-Condition(s)
1. Chuỗi mật khẩu mã hóa mới được ghi đè thành công vào kho dữ liệu Người dùng D1.
2. Mọi thông số kiểm soát đăng nhập sai trước đó được reset về 0 và trạng thái tài khoản được mở khóa.
3. Hành vi khôi phục được hệ thống ghi nhận vết vào kho Nhật ký hoạt động (D9).
Basic Flow
1. Người dùng nhấn chọn liên kết "Quên mật khẩu?" trên màn hình giao diện đăng nhập.
2. Hệ thống hiển thị biểu mẫu yêu cầu nhập Email hoặc Số điện thoại đã dùng để đăng ký tài khoản.
3. Người dùng nhập định danh tài khoản và nhấn nút "Gửi mã xác thực".
4. Hệ thống tiếp nhận gói tin, truy vấn xuống kho D1 để kiểm tra sự tồn tại của tài khoản.
5. Hệ thống xác nhận tài khoản hợp lệ, tự động sinh mã số OTP khôi phục gồm 6 ký tự và lưu mốc thời gian hết hạn vào kho D1.
6. Hệ thống gọi API gửi mã OTP trực tiếp đến Email/Số điện thoại của người dùng thông qua tác nhân phụ dịch vụ cổng ngoại vi.
7. Hệ thống hiển thị giao diện nhập mã xác thực OTP kèm đồng hồ đếm ngược thời gian hiệu lực.
8. Người dùng nhập mã OTP nhận được vào hệ thống.
9. Hệ thống đối chiếu thực tế với dữ liệu lưu trữ tại kho D1 và xác nhận mã chính xác, còn hạn sử dụng.
10. Hệ thống hiển thị biểu mẫu cho phép thiết lập mật khẩu mới (bao gồm ô nhập mật khẩu và ô xác nhận lại).
11. Người dùng nhập mật khẩu mới thỏa mãn quy định bảo mật và nhấn "Xác nhận".
12. Hệ thống thực hiện mã hóa mật khẩu thô thành chuỗi password_hash mới, cập nhật vào kho dữ liệu D1, đồng thời mở khóa trạng thái tài khoản.
13. Hệ thống thông báo "Đặt lại mật khẩu thành công" và điều hướng người dùng quay trở lại màn hình Đăng nhập.
14. Hệ thống tự động ghi nhận sự kiện khôi phục mật khẩu vào kho Nhật ký hoạt động (D9).
Alternative Flow
Luồng nghiệp vụ diễn ra tuần tự theo các bước của Luồng chính, không có nhánh rẽ thay thế nào khác.
Exception Flow
4a. Định danh Email hoặc Số điện thoại không tồn tại trong hệ thống:
- Tại bước 4, hệ thống kiểm tra kho D1 và không tìm thấy bản ghi nào khớp.
- Hệ thống chặn luồng xử lý, hiển thị lỗi: "Email hoặc Số điện thoại này chưa được đăng ký tài khoản trên Velura" và yêu cầu nhập lại.

9a. Mã OTP nhập vào bị hết hạn sử dụng (Quá 5 phút):
- Tại bước 9, hệ thống đối chiếu mốc mốc thời gian phát hiện đã qua thời điểm hiện tại.
- Hệ thống báo lỗi "Mã xác thực đã hết hạn hiệu lực", hiển thị nút "Gửi lại mã" để người dùng kích hoạt luồng sinh OTP mới quay lại bước 5.

9b. Người dùng nhập sai mã OTP quá số lần liên tiếp cho phép:
- Tại bước 9, nếu người dùng nhập sai ký tự OTP quá 3 lần liên tiếp.
- Hệ thống hủy bỏ phiên khôi phục khẩn cấp, tiến hành khóa tạm thời chức năng đặt lại mật khẩu trong vòng 5 phút và ghi nhận log lỗi vào kho D9.

11a. Mật khẩu mới nhập vào không khớp hoặc không đạt chuẩn bảo mật:
- Tại bước 11, hệ thống kiểm tra mật khẩu mới không thỏa mãn độ dài, ký tự đặc biệt hoặc ô xác nhận lại không khớp nội dung.
- Hệ thống đưa ra thông báo cảnh báo chi tiết bên cạnh ô nhập và giữ nguyên giao diện để người dùng hiệu chỉnh lại thông tin.
Business Rules
BR-C03-01: Hệ thống bắt buộc mã hóa mật khẩu mới trước khi ghi đè trường dữ liệu vào Database.
BR-C03-02: Mã số xác thực OTP khôi phục chỉ có thời gian hiệu lực trong vòng 5 phút kể từ thời điểm phát hành.
BR-C03-03: Hệ thống tự động khóa luồng đăng ký/khôi phục mật khẩu 5 phút nếu tác nhân nhập sai mã OTP quá 3 lần liên tiếp.
Non-Functional Requirement
NFR-C03-01: Thời gian xử lý tạo mã và điều hướng gói tin gửi OTP qua SMS/Email Gateway đến thiết bị không được vượt quá 10 giây.
NFR-C03-02: Toàn bộ dữ liệu mật khẩu mới luân chuyển từ Client lên Server bắt buộc phải đi qua giao thức mã hóa đường truyền HTTPS/TLS an toàn.
NFR-C03-03: Màn hình nhập OTP khôi phục mật khẩu bắt buộc phải hiển thị đồng hồ đếm ngược trực quan theo thời gian thực để người dùng theo dõi hạn mức khả dụng.
Bảng 3.: Đặt tả usecase UC-C03 Đặt lại mật khẩu

---

3.3.2.4. Đặc tả use case: Thiết lập hồ sơ Style Quiz 
Thuộc tính
Chi tiết
Mã Use Case
UC-C04
Tên Use Case
Thiết lập hồ sơ Style Quiz
Description
Cho phép Khách vãng lai (Guest) hoặc Thành viên (Member) thực hiện bài khảo sát trắc nghiệm để khởi tạo các thông số sinh trắc học và hồ sơ phong cách cá nhân hóa lần đầu tiên trên hệ thống Velura.
Actor(s)
Tác nhân chính: Khách vãng lai (Guest), Khách hàng (Member).
Priority
Must Have
Trigger
1. Hệ thống tự động kích hoạt hiển thị pop-up/giao diện khảo sát ngay sau khi người dùng truy cập trang web lần đầu.
2. Hoặc người dùng chủ động nhấn vào mục "Làm Style Quiz" trên thanh điều hướng.
Pre-Condition(s)
Thiết bị của người dùng có kết nối Internet ổn định để nạp e-form khảo sát từ kho dữ liệu sản phẩm. (Không yêu cầu đăng nhập đối với quyền Guest).
Post-Condition(s)
1. Hệ thống khởi tạo thành công bản ghi cấu trúc dữ liệu phong cách mới vào kho D1.
2. Đối với Member, cờ trạng thái is_quiz_completed được cập nhật thành true.
3. Ngữ cảnh nhãn phong cách mới được đồng bộ tức thì sang module AI Stylist Chatbot để trả ra danh sách outfit gợi ý cá nhân hóa.
Basic Flow
1. Người dùng truy cập vào trang chủ website hoặc chủ động chọn chức năng làm Style Quiz trên thanh điều hướng.
2. Hệ thống tiếp nhận lệnh, hiển thị giao diện biểu mẫu khảo sát trực quan bằng hình ảnh.
3. Người dùng thực hiện nhập các thông số sinh trắc học bắt buộc bao gồm: Chiều cao, Cân nặng, và số đo 3 vòng.
4. Người dùng tương tác tích chọn các tùy chọn định hình gu thẩm mỹ: Dáng người, Tông màu da, Phong cách yêu thích, Dịp mặc đồ mong muốn và phân khúc ngân sách chi tiêu.
5. Người dùng nhấn nút "Hoàn thành thiết lập".
6. Hệ thống thực hiện tính toán, chuẩn hóa dữ liệu đầu vào, mã hóa nhãn phong cách AI và lưu trữ bản ghi mới vào kho Người dùng và hồ sơ phong cách (D1).
7. Hệ thống hiển thị thông báo thiết lập thành công, tự động chuyển hướng người dùng về trang giao diện cá nhân hóa hiển thị danh sách các outfits được mô hình AI đề xuất riêng biệt dựa trên kết quả Quiz.
Alternative Flow
5a. Người dùng thực hiện lưu hồ sơ với tư cách là Khách vãng lai (Guest):
- Tại bước 5, sau khi nhấn nút "Hoàn thành thiết lập", hệ thống kiểm tra thấy người dùng chưa đăng nhập tài khoản.
- Hệ thống sẽ tạm thời đóng gói gói tin khảo sát thành cấu trúc JSON lưu vào trường temp_style_profile của bảng GUEST_SESSION và Local Storage thiết bị thay vì lưu vĩnh viễn. Luồng xử lý chuyển hướng sang bước 7.
Exception Flow
2a. Lỗi mất kết nối kho dữ liệu D1 khi khởi tạo:
- Hệ thống hiển thị thông báo lỗi: "Hệ thống kết nối kho dữ liệu thất bại, vui lòng tải lại trang và thử lại sau."
5b. Người dùng hủy ngang luồng thiết lập hồ sơ lần đầu:
- Người dùng nhấn nút "Bỏ qua/Làm sau" hoặc đóng trình duyệt ở giai đoạn khảo sát .
- Hệ thống hủy lệnh tạo bản ghi, duy trì trạng thái hồ sơ rỗng và điều hướng người dùng về trang chủ mua sắm thông thường.
Business Rules
BR-C05-01: 
Đối với Member: Sau khi hoàn thành Quiz, dữ liệu hồ sơ phong cách lưu vĩnh viễn vào kho dữ liệu vật lý STYLE_PROFILE liên kết trực tiếp với mã định danh user_id.
Đối với Guest: Dữ liệu được đóng gói thành chuỗi JSON lưu tạm vào trường temp_style_profile thuộc bảng GUEST_SESSION trên Server , đồng thời lưu vào Local Storage/Cache của trình duyệt máy khách để phục vụ tính năng gợi ý outfits tức thời.
BR-C05-02: Hệ thống áp dụng cơ chế xóa bất đồng bộ  phía Server cho thực thể GUEST_SESSION. Toàn bộ dữ liệu Style Quiz tạm thời của Guest sẽ được duy trì lưu trữ ngầm trong vòng 3 tháng kể từ ngày khởi tạo, sau đó mới tự động xóa hoàn toàn khỏi hệ thống.
BR-C05-03: Khi hệ thống phát hiện sự kiện Guest có hành vi thoát phiên làm việc (đóng trình duyệt hoặc tắt tab khi giỏ hàng/style profile tạm vẫn đang hoạt động), hệ thống  kích hoạt một pop-up cảnh báo (Thao tác phía Client-side) thông báo rằng: "Dữ liệu hồ sơ phong cách và giỏ hàng của bạn sẽ bị xóa bỏ nếu không tiến hành Đăng nhập/Đăng ký" nhằm thúc đẩy người dùng tạo tài khoản.
BR-C05-04: Trong trường hợp Guest thực hiện đăng ký tài khoản (UC-C01) hoặc đặt hàng thành công trước khi phiên tạm 3 tháng hết hạn, toàn bộ dữ liệu temp_style_profile từ phiên ẩn danh này phải được hệ thống tự động chuyển đổi, hợp nhất đồng bộ sang tài khoản chính thức của thành viên (USERS/STYLE_PROFILE) để lưu trữ vĩnh viễn.
Non-Functional Requirement
NFR-C05-01: Thời gian xử lý ghi nhận dữ liệu thiết lập và gọi API AI để sinh danh sách trang phục gợi ý hiển thị lên màn hình không được quá 3 giây .

NFR-C05-02: Biểu mẫu khảo sát Style Quiz bắt buộc phải có tính năng lưu tạm trạng thái (Session State) để tránh mất dữ liệu nhập liệu của người dùng khi vô tình mất kết nối mạng giữa chừng.
Bảng 3.: Đặt tả usecase UC-C04 Thiết lập hồ sơ Style Quiz

---

3.3.2.5. Đặc tả use case: Cập nhật hồ sơ Style Quiz
Thuộc tính
Chi tiết
Mã Use Case
UC-C05
Tên Use Case
Cập nhật hồ sơ Style Quiz
Description
Cho phép Thành viên (Member) hoặc Guest muốn cập nhật dữ liệu Style Quiz đã làm để hiệu chỉnh lại các thông số số đo cơ thể hoặc thay đổi gu thời trang, ngân sách chi tiêu để hệ thống cập nhật lại bộ lọc gợi ý outfits cá nhân hóa mới.
Actor(s)
Tác nhân chính: Khách thành viên (Member) và Khách vãng lai (Guest)
Priority
High
Trigger
Member và Guest chủ động truy cập vào trang "Style Profile của tôi" và nhấn chọn nút chức năng "Cập nhật hồ sơ".
Pre-Condition(s)
1. Khách hàng đã đăng nhập thành công vào hệ thống Velura dưới quyền Member, hoặc khách vãng lai đã thiết lập hồ sơ style quiz đang trong phiên 
2. Đã tồn tại sẵn một bản ghi hồ sơ phong cách liên kết với user_id của tài khoản trong kho dữ liệu D1.
Post-Condition(s)
1. Hệ thống ghi đè toàn bộ dữ liệu cấu hình phong cách mới vào kho D1.
2. Thuật toán gợi ý của AI Stylist Chatbot và Dành cho bạn tự động làm mới danh sách trang phục đề xuất theo các nhãn thay đổi tức thì.
Basic Flow
1. Member truy cập vào trang cá nhân "Style Profile của tôi".
2. Hệ thống đọc dữ liệu hiện tại từ kho D1 và hiển thị chi tiết các thông số phong cách cũ của Member.
3. Member nhấn chọn nút chức năng "Cập nhật hồ sơ".
4. Hệ thống kích hoạt luồng hiệu chỉnh, hiển thị lại biểu mẫu khảo sát trắc nghiệm và tự động điền sẵn các thông số, tùy chọn sinh trắc học cũ của Member lên các ô nhập liệu.
5. Member tiến hành chỉnh sửa lại các số đo hình thể (chiều cao, cân nặng) hoặc thay đổi tích chọn các ô gu thời trang, tone da, ngân sách mong muốn mới.
6. Member nhấn nút "Lưu thay đổi".
7. Hệ thống tiếp nhận gói tin, thực hiện kiểm tra tính hợp lệ, chạy transaction an toàn để ghi đè toàn bộ dữ liệu mới lên bản ghi cũ trong kho dữ liệu Người dùng và hồ sơ phong cách (D1).
8. Hệ thống tự động làm mới trang web và hiển thị giao diện Style Profile mới cùng danh sách các outfits/sản phẩm được mô hình AI cập nhật gợi ý lại theo gu thời trang vừa thay đổi.
Alternative Flow
Luồng nghiệp vụ cập nhật diễn ra tuần tự, không có nhánh rẽ thay thế.
Exception Flow
4a. Lỗi mất kết nối kho dữ liệu D1 khi lưu thay đổi:
- Tại bước 6, khi Member bấm lưu nhưng đường truyền Database bị ngắt.
- Hệ thống dừng quá trình xử lý, giữ nguyên form nhập liệu để tránh mất công sức nhập của khách, đồng thời hiển thị cảnh báo lỗi: "Cập nhật thất bại do lỗi kết nối. Vui lòng thử lại sau ít phút."
5a. Member hủy ngang luồng hiệu chỉnh:
- Member nhấn nút "Hủy bỏ thao tác" khi đang sửa form.
- Hệ thống đóng biểu mẫu chỉnh sửa, giữ nguyên toàn bộ dữ liệu cũ trong kho D1 và đưa Member quay trở lại giao diện xem thông tin hồ sơ hiện tại.
Business Rules
BR-C05-UPDATE-01: Mỗi tài khoản thành viên chỉ sở hữu duy nhất một bản ghi Style Profile. Hành động cập nhật bắt buộc phải thực hiện theo cơ chế ghi đè, không tạo thêm bản ghi mới trong database để tối ưu hóa hiệu năng và dung lượng lưu trữ của kho D1.
BR-C05-UPDATE-02: Sau khi Member lưu thay đổi thành công, hệ thống bắt buộc phải giải phóng cache gợi ý cũ để nạp tham số mới cho mô hình AI, tránh việc hiển thị outfits lệch pha logic.

Non-Functional Requirement
NFR-C05-UPDATE-01: Thời gian hệ thống ghi đè dữ liệu vào DB và tải lại trang hiển thị kết quả outfits gợi ý mới không được vượt quá 2 giây .
NFR-C05-UPDATE-02: Toàn bộ dữ liệu cập nhật sinh trắc học và gu phối đồ luân chuyển giữa client và server phải được mã hóa qua đường truyền bảo mật HTTPS/TLS.
Bảng 3.: Đặt tả usecase UC-C05 Cập nhật hồ sơ Style Quiz

---

3.3.2.6. Đặc tả use case: Tìm kiếm và xem sản phẩm
Thuộc tính
Chi tiết
Mã Use Case
UC-C06
Tên Use Case
Tìm kiếm sản phẩm
Description
Cho phép cả Khách vãng lai (Guest) và Khách hàng (Member) tìm kiếm các mặt hàng trên hệ thống bằng từ khóa hoặc danh mục. Người dùng có thể tùy chọn kích hoạt bộ lọc nâng cao để thu hẹp danh sách kết quả theo giá, màu, size hoặc vóc dáng cá nhân.
Actor(s)
Khách vãng lai (Guest), Khách hàng (Member)
Priority
Must Have
Trigger
Người dùng nhập từ khóa vào thanh tìm kiếm và nhấn Enter (hoặc chọn một Danh mục sản phẩm trên thanh điều hướng).
Pre-Condition(s)
Thiết bị của người dùng có kết nối Internet để kết nối tới kho dữ liệu sản phẩm D2.
Post-Condition(s)
Danh sách sản phẩm thỏa mãn tiêu chí được truy xuất và hiển thị phân trang trực quan trên giao diện công khai.
Basic Flow
1. Người dùng nhập từ khóa tìm kiếm hoặc chọn một danh mục sản phẩm.
2. Hệ thống tiếp nhận gói tin, thực hiện truy vấn xuống kho dữ liệu D2 (Sản phẩm).
3. Hệ thống kiểm tra vai trò người dùng: Nếu là Member đã có Style Profile, tự động nạp thêm khối "Gợi ý dành cho bạn".
4. Hệ thống hiển thị danh sách sản phẩm active thỏa mãn kèm theo thanh công cụ bộ lọc nâng cao.
5. Người dùng duyệt danh sách sản phẩm và click chọn một mặt hàng mong muốn để chuyển tiếp sang luồng xem chi tiết.
Alternative Flow
4a. Người dùng sử dụng bộ lọc nâng cao:
- Condition: Người dùng chủ động click chọn các tiêu chí lọc.
- Hệ thống kích hoạt luồng Tìm kiếm với bộ lọc.
- Người dùng chọn các tiêu chí cơ bản (Khoảng giá, màu sắc, size, thương hiệu).
- Ràng buộc phân quyền: Nếu là Member, hệ thống mở thêm bộ lọc theo Dáng người (Body Type). Nếu là Guest hoặc Member chưa làm quiz, hệ thống ẩn/làm mờ bộ lọc này .
- Người dùng nhấn "Áp dụng". Hệ thống lọc lại dữ liệu và trả về danh sách mới. Quay lại bước 4 của luồng chính.
Exception Flow
4b. Không tìm thấy sản phẩm trùng khớp (Hết hàng/Sai từ khóa):
- Hệ thống hiển thị giao diện thông báo: "Rất tiếc, Velura không tìm thấy sản phẩm nào phù hợp với lựa chọn của bạn."
- Hệ thống tự động truy vấn kho D2 để render thêm khối sản phẩm "Xu hướng tuần này" hoặc "Sản phẩm nổi bật" ở phía dưới để giữ chân người dùng.
2a. Lỗi kết nối kho dữ liệu D2:
- Hệ thống hiển thị thông báo: "Hệ thống đang bận, vui lòng tải lại trang sau."
Business Rules
BR-C06-01: Hệ thống chỉ hiển thị các sản phẩm và biến thể ở trạng thái kích hoạt trên trang kết quả.
BR-C06-02: Bộ lọc nâng cao theo dáng người (Body Type) bắt buộc phải lấy các tham số từ cấu trúc dữ liệu Style Profile của tài khoản tương ứng trong kho D1, nghiêm cấm cho phép Guest áp dụng sai lệch logic.
Non-Functional Requirement
NFR-C06-01: Thời gian thực thi câu lệnh truy vấn SQL/NoSQL và trả về danh sách kết quả phân trang không được vượt quá 2 giây.
NFR-C06-02: Cơ chế tìm kiếm phải hỗ trợ tìm kiếm không dấu, tìm kiếm gần đúng để tối ưu hóa trải nghiệm tìm kiếm của người dùng.
Bảng 3.: Đặt tả usecase UC-C06 Tìm kiếm và Xem sản phẩm
  
Hình: Biểu đồ Usecase Tìm kiếm sản phẩm

---

3.3.2.7. Đặc tả use case: Quản lý giỏ hàng
Thuộc tính
Chi tiết
Mã Use Case
UC-C07
Tên Use Case
Quản lý giỏ hàng
Description
Cho phép cả Khách vãng lai (Guest) và Thành viên (Member) xem danh sách các mặt hàng đã chọn, điều chỉnh số lượng tăng/giảm, hoặc xóa bỏ mặt hàng khỏi giỏ trước khi tiến hành đặt hàng.
Actor(s)
Khách vãng lai (Guest), Khách hàng (Member)
Priority
Must Have
Trigger
Người dùng nhấn vào biểu tượng Giỏ hàng trên thanh điều hướng, hoặc phát động lệnh "Thêm vào giỏ hàng" tại trang danh sách/chi tiết sản phẩm.
Pre-Condition(s)
Thiết bị của người dùng có kết nối Internet để đồng bộ trạng thái tồn kho thực tế từ kho dữ liệu D2.
Post-Condition(s)
1. Trạng thái, số lượng và tổng tiền của các mặt hàng trong giỏ được cập nhật và hiển thị chính xác.
2. Dữ liệu giỏ hàng được lưu trữ tương ứng theo vai trò (Đồng bộ vào kho D3 với Member, lưu tại Local Storage của thiết bị với Guest).
Basic Flow
1. Người dùng truy cập vào giao diện Giỏ hàng (hoặc nhấn nút "Thêm vào giỏ" từ trang sản phẩm).
2. Hệ thống kiểm tra vai trò người dùng để xác định phương thức nạp dữ liệu: Đọc từ cơ sở dữ liệu đám mây đối với Member, hoặc đọc từ Local Storage thiết bị đối với Guest.
3. Hệ thống hiển thị danh sách các mặt hàng hiện có kèm theo: Hình ảnh, biến thể (Size/Màu), đơn giá, số lượng chọn, tổng tiền tạm tính và số lượng tồn kho khả dụng từ kho D2.
4. Người dùng thực hiện các thao tác quản trị giỏ hàng:
- Kịch bản A (Thêm mới/Tăng số lượng): Người dùng tăng số lượng mặt hàng. Hệ thống đối chiếu số lượng yêu cầu với tồn kho khả dụng tại kho D2. Nếu thỏa mãn, hệ thống cập nhật tăng số lượng và tính lại tổng tiền.
- Kịch bản B (Giảm số lượng): Người dùng giảm số lượng. Hệ thống cập nhật giảm và tính lại tổng tiền (Nếu số lượng giảm về 0, chuyển sang kịch bản C).
- Kịch bản C (Xóa mặt hàng): Người dùng nhấn nút "Xóa". Hệ thống loại bỏ hoàn toàn bản ghi mặt hàng đó ra khỏi danh sách giỏ hàng.
5. Hệ thống tự động làm mới giao diện, cập nhật lại tổng số lượng item trên biểu tượng giỏ hàng ở thanh điều hướng.
Alternative Flow
2a. Guest thực hiện đăng nhập hệ thống:
- Nếu người dùng chuyển trạng thái từ Guest sang Member, hệ thống tự động gọi API quét và hợp nhất toàn bộ dữ liệu giỏ hàng tạm thời từ Local Storage vào Cơ sở dữ liệu đám mây của tài khoản đó. Quay lại bước 3 của luồng chính.
Exception Flow
4a. Sản phẩm hết hàng hoặc vượt quá số lượng tồn kho tối đa:
- Tình huống 1: Tại thời điểm bấm thêm, số lượng tồn kho bằng 0. Hệ thống chặn hành động, thông báo lỗi: "Sản phẩm với kích cỡ/màu sắc này hiện đã hết hàng. Vui lòng chọn màu/size khác." và khóa nút thêm.
- Tình huống 2: Người dùng tăng số lượng vượt quá số lượng còn lại trong kho. Hệ thống chặn thao tác, hiển thị cảnh báo: "Số lượng sản phẩm trong kho chỉ còn [X]. Vui lòng điều chỉnh lại số lượng." và tự động đưa số lượng về mức tối đa khả dụng.
3a. Lỗi kết nối dữ liệu giỏ hàng:
- Hệ thống hiển thị thông báo lỗi kỹ thuật và giữ nguyên trạng thái giỏ hàng cũ, yêu cầu người dùng thử lại sau ít phút.
Business Rules
BR-C07-01: Người dùng không được phép tăng số lượng mặt hàng trong giỏ vượt quá số lượng tồn kho khả dụng của biến thể đó trong kho D2.
BR-C07-02: Giỏ hàng của Guest chỉ có giá trị lưu trữ tạm thời trên thiết bị hiện tại và sẽ bị xóa nếu trình duyệt xóa bộ nhớ cache (trừ khi thực hiện đăng nhập để hợp nhất dữ liệu).
Non-Functional Requirement
NFR-C07-01: Thời gian xử lý cập nhật số lượng, tính lại tổng tiền giỏ hàng và phản hồi lên giao diện không được vượt quá 1 giây.
NFR-C07-02: Số lượng hiển thị trên biểu tượng giỏ hàng ở thanh điều hướng phải được cập nhật ngay lập tức (Real-time) sau khi người dùng thực hiện bất kỳ thao tác Thêm/Sửa/Xóa nào.
Bảng 3.: Đặt tả usecase UC-C07 Quản lý giỏ hàng
 
Hình: Biểu đồ Usecase Quản lý giỏ hàng

---

3.3.2.8. Đặc tả use case: Đặt hàng và thanh toán 
Thuộc tính
Chi tiết
Mã Use Case
UC-C08
Tên Use Case
Đặt hàng & Thanh toán
Description
Là khách hàng (Member hoặc Guest), tôi muốn đặt mua sản phẩm và thực hiện thanh toán để hoàn tất giao dịch mua sắm trên hệ thống Velura. Use case này bao gồm toàn bộ quy trình từ xác nhận sản phẩm, kiểm tra tồn kho, nhập thông tin giao hàng, áp dụng khuyến mãi, lựa chọn phương thức thanh toán và tạo đơn hàng.
Actor(s)
Khách hàng (Member/Guest), Cổng thanh toán trực tuyến, Dịch vụ SMS OTP
Priority
Must Have
Trigger
1. Khách hàng nhấn nút "Tiến hành thanh toán" tại Giỏ hàng.
2. Khách hàng nhấn nút "Mua ngay" tại trang Chi tiết sản phẩm.
Pre-Condition(s)
1. Hệ thống đang hoạt động bình thường.
2. Sản phẩm được chọn đang tồn tại trên hệ thống.
3. Khách hàng có ít nhất một sản phẩm để mua.
4. Dịch vụ SMS OTP và Cổng thanh toán trực tuyến  sẵn sàng (nếu sử dụng).
Post-Condition(s)
1. Đơn hàng được tạo thành công.
2. Trạng thái đơn hàng được ghi nhận tương ứng với phương thức thanh toán.
3. Hệ thống lưu thông tin giao dịch và ghi nhận Audit Log.
4. Tồn kho được cập nhật theo quy tắc nghiệp vụ.
Basic Flow
1. Khách hàng chọn "Tiến hành thanh toán" từ Giỏ hàng hoặc "Mua ngay" từ trang Chi tiết sản phẩm.
2. Hệ thống kiểm tra tồn kho của các sản phẩm được chọn.
3. Hệ thống hiển thị màn hình Checkout.
4. Khách hàng nhập hoặc xác nhận thông tin giao hàng.
5. Hệ thống hiển thị ô nhập mã khuyến mãi.
6. Khách hàng nhập voucher và hệ thống kiểm tra tính hợp lệ.
7. Hệ thống tính toán tổng thanh toán cuối cùng.
8. Hệ thống hiển thị tóm tắt đơn hàng gồm sản phẩm, phí vận chuyển, khuyến mãi và tổng tiền.
9. Khách hàng chọn phương thức thanh toán.
10. Nếu chọn COD, hệ thống tạo đơn hàng trạng thái "Chờ xác nhận".
11. Hệ thống gửi xác nhận đơn hàng cho khách hàng.
12. Hệ thống ghi nhận giao dịch và kết thúc quy trình.
Alternative Flow
1a. Mua ngay
Hệ thống tạo phiên thanh toán tạm thời chỉ chứa sản phẩm được chọn.
Các sản phẩm trong giỏ hàng hiện tại không bị thay đổi.
4a. Khách hàng là Guest
Hệ thống yêu cầu nhập Họ tên, Số điện thoại, Địa chỉ nhận hàng và Email (tùy chọn).
Hệ thống gửi OTP qua SMS.
Khách hàng xác thực OTP thành công.
Hệ thống tạo tài khoản Member ngầm định.
Hệ thống gửi thông tin đăng nhập qua SMS.
Thông tin giao hàng được lưu vào sổ địa chỉ của tài khoản mới.
9a. Thanh toán trực tuyến 
Hệ thống tạo đơn hàng trạng thái "Chờ thanh toán".
Hệ thống chuyển hướng sang cổng thanh toán trực tuyến.
Khách hàng thực hiện thanh toán.
Cổng thanh toán trực tuyến gửi callback kết quả giao dịch.
Nếu thành công, hệ thống cập nhật đơn hàng thành "Đã thanh toán", cập nhật tồn kho và hiển thị trang cảm ơn.
Exception Flow
2e. Hết hàng hoặc không đủ tồn kho
Hệ thống thông báo sản phẩm không đủ số lượng.
Yêu cầu khách hàng điều chỉnh giỏ hàng trước khi tiếp tục.
4e. OTP không hợp lệ hoặc hết hạn
Hệ thống thông báo lỗi.
Cho phép gửi lại OTP.
6e. Voucher không hợp lệ
Hệ thống hiển thị lý do cụ thể (hết hạn, hết lượt sử dụng, không đủ giá trị đơn hàng...).
Khách hàng có thể tiếp tục thanh toán mà không áp dụng voucher.
9ae. Thanh toán trực tuyến thất bại hoặc bị hủy
Đơn hàng vẫn được giữ ở trạng thái "Chờ thanh toán".
Hệ thống hiển thị thông báo lỗi.
Khách hàng có thể thanh toán lại hoặc chuyển sang COD.
2b. Lỗi hệ thống hoặc cơ sở dữ liệu
Hệ thống hiển thị thông báo thân thiện.
Ghi log lỗi cho quản trị viên.
Business Rules
BR-C08-01: Chỉ cho phép thanh toán khi tất cả sản phẩm còn đủ tồn kho.
BR-C08-02: Voucher phải còn hiệu lực, chưa vượt số lượt sử dụng và đáp ứng điều kiện đơn hàng tối thiểu.
BR-C08-03: Guest bắt buộc xác thực OTP trước khi đặt hàng.
BR-C08-04: Guest sau khi xác thực OTP sẽ được tạo tài khoản Member ngầm định.
BR-C08-05: Đơn COD được tạo với trạng thái "Chờ xác nhận".
BR-C08-06: Đơn thanh toán trực tuyến được tạo với trạng thái "Chờ thanh toán" trước khi chuyển sang Cổng thanh toán.
BR-C08-07: Chỉ cập nhật trạng thái "Đã thanh toán" khi nhận callback thành công từ Cổng thanh toán.
BR-C08-08: Đơn hàng thất bại thanh toán vẫn được lưu để khách hàng tiếp tục thanh toán lại.
Non-Functional Requirement
NFR-C08-01: Thời gian tải trang Checkout không quá 3 giây.
NFR-C08-02: Kiểm tra tồn kho phải hoàn thành trong vòng 2 giây.
NFR-C08-03: OTP phải được gửi trong vòng 10 giây.
NFR-C08-04: Toàn bộ dữ liệu thanh toán phải được truyền qua HTTPS/TLS.
NFR-C08-05: Callback từ Cổng thanh toán trực tuyến phải được xác thực chữ ký số trước khi cập nhật trạng thái đơn hàng.
NFR-C08-06: Hệ thống phải hỗ trợ tối thiểu 500 phiên checkout đồng thời.
Bảng 3.x: Đặc tả Use Case UC-C08 – Đặt hàng & Thanh toán



  
Hình 3.x: Biểu đồ Use Case Đặt hàng và Thanh toán

---

3.3.2.9. Đặc tả use case: Theo dõi đơn hàng 
Thuộc tính
Chi tiết
Mã Use Case
UC-C09
Tên Use Case
Theo dõi đơn hàng
Description
Là khách hàng, tôi muốn theo dõi trạng thái đơn hàng sau khi đặt hàng để biết tiến trình xử lý, vận chuyển, nhận hàng và thực hiện các thao tác liên quan như hủy đơn, xác nhận nhận hàng, đánh giá hoặc yêu cầu đổi trả.
Actor(s)
Khách hàng (Member), Hệ thống quản lý đơn hàng, Đơn vị vận chuyển
Priority
Must Have
Trigger
Khách hàng truy cập mục "Đơn hàng của tôi" hoặc xem chi tiết một đơn hàng đã được tạo thành công.
Pre-Condition(s)
1. Khách hàng đã đăng nhập vào hệ thống.
2. Tồn tại ít nhất một đơn hàng thuộc tài khoản khách hàng.
3. Đơn hàng đã được tạo thành công trên hệ thống.
Post-Condition(s)
1. Trạng thái đơn hàng được hiển thị chính xác cho khách hàng.
2. Yêu cầu hủy đơn (nếu có) được ghi nhận và xử lý.
3. Đơn hàng có thể được cập nhật sang trạng thái Hoàn thành khi khách hàng xác nhận nhận hàng.
4. Khách hàng có thể thực hiện đánh giá hoặc yêu cầu đổi/trả sau khi đơn hàng hoàn thành.
Basic Flow
1. Khách hàng truy cập mục "Đơn hàng của tôi".
2. Hệ thống hiển thị danh sách các đơn hàng của khách hàng.
3. Khách hàng chọn một đơn hàng để xem chi tiết.
4. Hệ thống hiển thị thông tin đơn hàng và trạng thái hiện tại.
5. Hệ thống hiển thị lịch sử thay đổi trạng thái kèm thời gian tương ứng.
6. Trạng thái đơn hàng được cập nhật theo quy trình xử lý: Chờ xác nhận → Đã xác nhận → Đang chuẩn bị hàng → Đang giao hàng → Đã giao thành công → Hoàn thành.
7. Khi đơn hàng được giao thành công, hệ thống gửi thông báo cho khách hàng.
8. Khách hàng xác nhận đã nhận hàng bằng cách nhấn nút "Đã nhận hàng".
9. Hệ thống cập nhật trạng thái đơn hàng thành "Hoàn thành".
10. Hệ thống hiển thị các chức năng "Đánh giá" và "Yêu cầu đổi/trả".
Alternative Flow
8a. Tự động xác nhận hoàn thành
Đơn vị vận chuyển gửi xác nhận giao hàng thành công.
Sau khoảng thời gian quy định mà khách hàng không phản hồi, hệ thống tự động cập nhật trạng thái đơn hàng thành "Hoàn thành".
10a. Khách hàng thực hiện đánh giá sản phẩm
Hệ thống chuyển sang Use Case Đánh giá sản phẩm.
10b. Khách hàng yêu cầu đổi/trả hàng
Hệ thống chuyển sang Use Case Yêu cầu đổi/trả sản phẩm.
Exception Flow
5e. Không tìm thấy đơn hàng
Hệ thống hiển thị thông báo "Đơn hàng không tồn tại hoặc đã bị xóa".
7e. Không gửi được thông báo
Hệ thống ghi log lỗi và tiếp tục xử lý đơn hàng bình thường.
8e1. Đơn hàng chưa giao thành công
Nút "Đã nhận hàng" không được hiển thị hoặc không khả dụng.
8e2. Lỗi kết nối hệ thống
Hệ thống hiển thị thông báo lỗi và yêu cầu khách hàng thử lại sau.
Business Rules
BR-C09-01: Chỉ chủ sở hữu đơn hàng mới được phép xem thông tin chi tiết đơn hàng.
BR-C09-02: Khách hàng chỉ được hủy đơn khi đơn hàng chưa chuyển sang trạng thái "Đang giao hàng".
BR-C09-03: Mọi yêu cầu hủy đơn phải ghi nhận lý do hủy.
BR-C09-04: Đơn hàng ở trạng thái "Đang giao hàng" không được phép hủy.
BR-C09-05: Đơn hàng chỉ được chuyển sang trạng thái "Hoàn thành" khi khách hàng xác nhận nhận hàng hoặc có xác nhận giao hàng thành công từ đơn vị vận chuyển.
BR-C09-06: Chỉ các đơn hàng ở trạng thái "Hoàn thành" mới được đánh giá hoặc yêu cầu đổi/trả.
BR-C09-07: Nếu đơn hàng đã thanh toán trước và được hủy hợp lệ, hệ thống phải thực hiện hoàn tiền theo chính sách hiện hành.
Non-Functional Requirement
NFR-C09-01: Danh sách đơn hàng phải được tải trong vòng tối đa 3 giây.
NFR-C09-02: Trạng thái đơn hàng phải được đồng bộ với dữ liệu vận chuyển trong thời gian thực hoặc gần thời gian thực.
NFR-C09-03: Chỉ người dùng đã xác thực mới được truy cập thông tin đơn hàng.
NFR-C09-04: Lịch sử trạng thái đơn hàng phải được lưu trữ đầy đủ để phục vụ truy vết và kiểm toán.
NFR-C09-05: Hệ thống phải hỗ trợ tối thiểu 500 yêu cầu tra cứu đơn hàng đồng thời.
Bảng 3.x: Đặc tả Use Case UC-C09 – Theo dõi đơn hàng

---

3.3.2.10. Đặc tả use case: Hủy đơn hàng 
Thuộc tính
Chi tiết
Mã Use Case
UC-C10
Tên Use Case
Hủy đơn hàng
Description
Là khách hàng, tôi muốn hủy đơn hàng đã đặt khi đơn hàng chưa được bàn giao cho đơn vị vận chuyển để thay đổi quyết định mua hàng hoặc chỉnh sửa thông tin đơn hàng.
Actor(s)
Khách hàng (Member), Hệ thống quản lý đơn hàng, Quản trị viên/Nhân viên xử lý đơn hàng, VNPay (nếu có hoàn tiền)
Priority
Medium
Trigger
Khách hàng nhấn nút "Hủy đơn" trên màn hình chi tiết đơn hàng.
Pre-Condition(s)
1. Khách hàng đã đăng nhập hệ thống.2. Đơn hàng tồn tại và thuộc quyền sở hữu của khách hàng.3. Đơn hàng chưa chuyển sang trạng thái "Đang giao hàng".
Post-Condition(s)
1. Đơn hàng được cập nhật sang trạng thái "Đã hủy" nếu yêu cầu được chấp thuận.
2. Lý do hủy đơn được lưu vào hệ thống.
3. Giao dịch hoàn tiền được khởi tạo (nếu đơn hàng đã thanh toán trước).
4. Hệ thống ghi nhận Audit Log cho thao tác hủy đơn.
Basic Flow
1. Khách hàng truy cập màn hình chi tiết đơn hàng.
2. Hệ thống kiểm tra trạng thái đơn hàng.
3. Hệ thống hiển thị nút "Hủy đơn" nếu đơn hàng đủ điều kiện hủy.
4. Khách hàng nhấn nút "Hủy đơn".
5. Hệ thống hiển thị danh sách lý do hủy và ô nhập lý do khác.
6. Khách hàng chọn hoặc nhập lý do hủy.
7. Khách hàng xác nhận yêu cầu hủy đơn.
8. Hệ thống ghi nhận yêu cầu hủy đơn.
9. Hệ thống kiểm tra điều kiện xử lý hủy đơn.
10. Hệ thống cập nhật trạng thái đơn hàng thành "Đã hủy".
11. Nếu đơn hàng đã thanh toán trước, hệ thống khởi tạo quy trình hoàn tiền.
12. Hệ thống gửi thông báo hủy đơn thành công cho khách hàng.
Alternative Flow
9a. Đơn hàng chưa thanh toán hoặc chưa chuẩn bị hàng
Hệ thống tự động phê duyệt yêu cầu hủy.
Chuyển đến bước 10.
11a. Đơn hàng thanh toán qua VNPay
Hệ thống tạo yêu cầu hoàn tiền.
Chuyển yêu cầu đến quy trình hoàn tiền VNPay.
12a. Thông báo qua Email/SMS
Hệ thống gửi thông báo xác nhận hủy đơn qua email hoặc SMS cho khách hàng.
Exception Flow
2e. Đơn hàng không tồn tại
Hệ thống hiển thị thông báo "Không tìm thấy đơn hàng".
3e. Đơn hàng đã chuyển sang trạng thái Đang giao hàng
Hệ thống ẩn hoặc vô hiệu hóa nút "Hủy đơn".
Không cho phép thực hiện hủy đơn.
9e. Yêu cầu hủy bị từ chối
Hệ thống hiển thị lý do từ chối (đã đóng gói, đang chuẩn bị giao...).
Đơn hàng giữ nguyên trạng thái hiện tại.
11e. Hoàn tiền thất bại
Hệ thống ghi nhận lỗi.
Thông báo cho bộ phận quản trị xử lý thủ công.
10e. Lỗi hệ thống hoặc cơ sở dữ liệu
Hệ thống hiển thị thông báo "Hệ thống đang bận, vui lòng thử lại sau".
Ghi log lỗi cho quản trị viên.
Business Rules
BR-C10-01: Chỉ chủ sở hữu đơn hàng mới được phép yêu cầu hủy đơn.
BR-C10-02: Chỉ được hủy đơn khi trạng thái chưa chuyển sang "Đang giao hàng".
BR-C10-03: Khách hàng bắt buộc cung cấp lý do hủy đơn.
BR-C10-04: Đơn hàng đã đóng gói hoặc chuẩn bị bàn giao có thể bị từ chối yêu cầu hủy.
BR-C10-05: Đơn hàng thanh toán trước phải được hoàn tiền theo chính sách hoàn tiền của hệ thống.
BR-C10-06: Mọi yêu cầu hủy đơn phải được ghi nhận trong Audit Log.
BR-C10-07: Sau khi hủy thành công, khách hàng không được khôi phục đơn hàng đã hủy.
Non-Functional Requirement
NFR-C10-01: Hệ thống phản hồi yêu cầu hủy đơn trong vòng tối đa 3 giây.
NFR-C10-02: Chỉ người dùng đã xác thực mới được thực hiện thao tác hủy đơn.
NFR-C10-03: Toàn bộ dữ liệu trao đổi phải được mã hóa qua HTTPS/TLS.
NFR-C10-04: Hệ thống phải ghi nhận đầy đủ lịch sử hủy đơn, gồm thời gian, người thực hiện và lý do hủy.
NFR-C10-05: Thông báo kết quả xử lý hủy đơn phải được gửi đến khách hàng trong vòng tối đa 1 phút sau khi hoàn tất xử lý.
Bảng 3.x: Bảng 3.x: Đặc tả Use Case UC-C10 – Hủy đơn hàng

---

3.3.2.10. Đặc tả use case: Đánh giá sản phẩm 
Thuộc tính
Mô tả
Mã Use Case
UC-C11
Tên Use Case
Đánh giá sản phẩm
Description
Cho phép khách hàng đánh giá sản phẩm đã mua thông qua việc lựa chọn từ khóa gợi ý, nhập nhận xét, chấm điểm sao và tải lên hình ảnh minh họa. Đánh giá được kiểm duyệt trước khi hiển thị công khai trên hệ thống.
Actor(s)
Khách hàng, Hệ thống kiểm duyệt tự động, Quản trị viên
Priority
Medium
Trigger
Khách hàng chọn chức năng "Đánh giá sản phẩm" từ trang chi tiết sản phẩm, mục "Đơn hàng của tôi" hoặc từ thông báo xác nhận giao hàng thành công.
Pre-Condition(s)
1. Khách hàng đã đăng nhập.
2. Đơn hàng đã hoàn thành hoặc đã được xác nhận nhận hàng thành công.
3. Sản phẩm thuộc đơn hàng của khách hàng. 
Post-Condition(s)
1. Đánh giá được lưu trên hệ thống.
2. Đánh giá được phê duyệt hoặc từ chối sau quá trình kiểm duyệt.
3. Điểm đánh giá trung bình của sản phẩm được cập nhật nếu đánh giá được phê duyệt.
4. Hệ thống ghi nhận lịch sử đánh giá.
Basic Flow
1. Khách hàng truy cập chức năng đánh giá sản phẩm.
2. Hệ thống hiển thị các từ khóa gợi ý đánh giá và biểu mẫu đánh giá.
3. Khách hàng lựa chọn từ khóa phù hợp.
4. Khách hàng nhập nội dung nhận xét.
5. Khách hàng chọn số sao đánh giá từ 1 đến 5 sao.
6. Khách hàng tải lên hình ảnh minh họa (nếu có).
7. Khách hàng gửi đánh giá.
8. Hệ thống lưu đánh giá với trạng thái "Chờ duyệt".
9. Hệ thống đưa đánh giá vào hàng đợi kiểm duyệt tự động.
10. Hệ thống kiểm tra nội dung văn bản và hình ảnh đánh giá.
11. Đánh giá vượt qua kiểm duyệt.
12. Hệ thống công khai đánh giá trên trang chi tiết sản phẩm.
13. Hệ thống cập nhật điểm đánh giá trung bình của sản phẩm.
14. Hệ thống gửi thông báo đánh giá thành công cho khách hàng.
Alternative Flow
1a1. Khách hàng truy cập từ mục "Đơn hàng của tôi" để đánh giá đơn hàng cũ, tiếp tục tại bước 2.
1b. Sau khi đơn hàng được giao thành công và khách hàng xác nhận nhận hàng, hệ thống hiển thị tùy chọn đánh giá sản phẩm. Khách hàng chọn "Đánh giá", tiếp tục tại bước 2.
1c. Tại bước 1b, khách hàng không muốn đánh giá sản phẩm và thoát chức năng. Use Case kết thúc.
3a. Khách hàng không chọn từ khóa gợi ý và tiếp tục nhập nhận xét.
6a. Khách hàng không tải hình ảnh minh họa và tiếp tục gửi đánh giá.
10a. Hệ thống không thể xác định kết quả kiểm duyệt tự động, đánh giá được chuyển sang trạng thái "Chờ duyệt thủ công".
Quản trị viên xem xét đánh giá.
Quản trị viên phê duyệt đánh giá.
12a. Hệ thống công khai đánh giá trên trang sản phẩm.
Exception Flow
10e1. Hệ thống phát hiện nội dung chứa từ ngữ thô tục, quảng cáo hoặc spam. Đánh giá bị từ chối.
10e2. Hệ thống phát hiện hình ảnh không hợp lệ, giả mạo hoặc trùng lặp. Đánh giá bị từ chối.
10e3. Hệ thống gửi thông báo từ chối kèm lý do và kích hoạt Use Case "Đánh giá lại sản phẩm".
1e. Khách hàng không đủ điều kiện đánh giá sản phẩm. Hệ thống từ chối truy cập chức năng.
8e. Xảy ra lỗi khi lưu đánh giá. Hệ thống thông báo thất bại và yêu cầu thực hiện lại sau.
10e. Hệ thống phát hiện hành vi đánh giá gian lận hoặc trao đổi đánh giá lấy ưu đãi. Tài khoản bị khóa theo chính sách hệ thống và các đánh giá liên quan bị gỡ bỏ.
Business Rules
BR-C11-01: Chỉ khách hàng đã mua và nhận sản phẩm mới được phép đánh giá.
BR-C11-02: Điểm đánh giá phải nằm trong khoảng từ 1 đến 5 sao.
BR-C11-03: Mọi đánh giá phải trải qua kiểm duyệt trước khi hiển thị công khai.
BR-C11-04: Nội dung chứa từ ngữ vi phạm, quảng cáo hoặc spam sẽ bị từ chối.
BR-C11-05: Hình ảnh tải lên phải hợp lệ và tuân thủ chính sách nội dung.
BR-C11-06: Quản trị viên có quyền can thiệp kiểm duyệt thủ công khi cần thiết.
BR-C11-07: Điểm đánh giá trung bình chỉ được cập nhật sau khi đánh giá được phê duyệt.
BR-C11-08: Nghiêm cấm mọi hình thức đổi đánh giá tích cực lấy quà tặng hoặc ưu đãi.
BR-C11-09: Hành vi gian lận đánh giá sẽ bị xử lý theo chính sách của hệ thống.
Non-Functional Requirement
NFR-C11-01: Thời gian phản hồi khi gửi đánh giá không vượt quá 3 giây.
NFR-C11-02: Chỉ người dùng đã xác thực mới được phép đánh giá sản phẩm.
NFR-C11-03: Dữ liệu đánh giá phải được truyền và lưu trữ thông qua HTTPS/TLS.
NFR-C11-04: Hệ thống phải ghi log toàn bộ quá trình đánh giá và kiểm duyệt.
NFR-C11-05: Hệ thống phải đảm bảo tính toàn vẹn dữ liệu đánh giá và điểm đánh giá trung bình của sản phẩm.
Bảng 3.x: Đặc tả Use Case UC-C11 - Đánh giá sản phẩm


Hình 3.x: Biểu đồ Use Case Đánh giá sản phẩm

---

3.3.2.11. Đặc tả use case: Yêu cầu đổi/trả hàng 
Thuộc tính
Mô tả
Mã Use Case
UC-C11
Tên Use Case
Yêu cầu đổi/trả hàng
Description
Cho phép khách hàng gửi yêu cầu đổi hàng hoặc trả hàng hoàn tiền đối với các sản phẩm đủ điều kiện theo chính sách của Velura. Hệ thống hỗ trợ tiếp nhận yêu cầu, kiểm tra điều kiện, phê duyệt hồ sơ, theo dõi vận chuyển hoàn trả và xử lý đổi/trả sau khi hàng được kiểm tra tại kho.
Actor(s)
Khách hàng, Quản trị viên, Hệ thống
Priority
High
Trigger
Khách hàng nhấn nút "Yêu cầu đổi/trả" tại trang chi tiết đơn hàng.
Pre-Condition(s)
1. Khách hàng đã đăng nhập.
2. Đơn hàng đã được giao thành công.
3. Đơn hàng vẫn còn trong thời gian cho phép đổi/trả.
4. Sản phẩm không thuộc danh mục hạn chế đổi/trả.
Post-Condition(s)
1. Phiếu đổi/trả được xử lý hoàn tất.
2. Trạng thái yêu cầu được cập nhật tương ứng.
3. Khách hàng nhận hàng thay thế hoặc nhận tiền hoàn trả theo hình thức đã chọn.
4. Hệ thống lưu lịch sử đổi/trả phục vụ tra cứu và kiểm toán.
Basic Flow
1. Khách hàng truy cập trang chi tiết đơn hàng và chọn chức năng "Yêu cầu đổi/trả".
2. Hệ thống kiểm tra thời hạn đổi/trả và danh mục hạn chế đổi/trả.
3. Hệ thống hiển thị biểu mẫu yêu cầu đổi/trả.
4. Khách hàng lựa chọn sản phẩm cần đổi/trả.
5. Khách hàng chọn hình thức xử lý (Đổi hàng hoặc Trả hàng hoàn tiền).
6. Khách hàng nhập lý do đổi/trả.
7. Khách hàng tải lên hình ảnh minh chứng.
8. Khách hàng gửi yêu cầu.
9. Hệ thống khởi tạo phiếu đổi/trả với trạng thái "Chờ xác nhận".
10. Quản trị viên xem xét hồ sơ đổi/trả.
11. Quản trị viên phê duyệt yêu cầu.
12. Hệ thống gửi hướng dẫn gửi hàng, địa chỉ kho và mã vận đơn cho khách hàng.
13. Khách hàng gửi hàng về kho Velura.
14. Hệ thống cập nhật trạng thái vận chuyển hoàn trả.
15. Kho nhận hàng và quản trị viên kiểm tra thực tế sản phẩm.
16. Quản trị viên xác nhận sản phẩm đạt điều kiện đổi/trả.
17. Hệ thống cập nhật trạng thái phiếu thành "Đồng ý đổi/trả".
18. Hệ thống thực hiện xử lý theo hình thức khách hàng đã chọn.
Alternative Flow
5a. Khách hàng chọn hình thức "Trả hàng hoàn tiền".
18a. Hệ thống khởi tạo quy trình hoàn tiền.
Khách hàng chờ nhận tiền hoàn trả về phương thức thanh toán ban đầu.
Hệ thống gửi Email xác nhận hoàn tiền thành công.
5b. Khách hàng chọn hình thức "Đổi hàng".
18b. Hệ thống tự động khởi tạo đơn hàng mới thay thế.
Hệ thống tính toán chênh lệch giá giữa sản phẩm cũ và sản phẩm mới.
Nếu giá trị sản phẩm mới cao hơn, khách hàng thanh toán phần chênh lệch.
Nếu giá trị sản phẩm mới thấp hơn, hệ thống hoàn tiền phần chênh lệch cho khách hàng.
Hệ thống xác nhận đơn hàng mới và thực hiện quy trình giao hàng như đơn hàng thông thường.
Exception Flow
2e1. Sản phẩm đã vượt quá thời hạn đổi/trả theo chính sách. Hệ thống từ chối yêu cầu và hiển thị lý do.
2e2. Sản phẩm thuộc danh mục không hỗ trợ đổi/trả. Hệ thống từ chối yêu cầu và kết thúc quy trình.
10e1. Quản trị viên phát hiện minh chứng không hợp lệ hoặc không đủ cơ sở xử lý. Yêu cầu bị từ chối.
10e2. Hệ thống gửi thông báo từ chối cho khách hàng kèm lý do cụ thể.
15e1. Hàng hóa thực tế không đúng hiện trạng ban đầu hoặc có dấu hiệu sử dụng sai quy định. Yêu cầu bị từ chối.
15e2. Hệ thống gửi hướng dẫn nhận lại sản phẩm cho khách hàng.
8e. Xảy ra lỗi khi gửi yêu cầu đổi/trả. Hệ thống thông báo thất bại và yêu cầu thực hiện lại.
18ae1. Quá trình hoàn tiền thất bại. Hệ thống ghi nhận lỗi và chuyển xử lý thủ công.
18be1. Khách hàng không hoàn tất thanh toán phần chênh lệch trong thời gian quy định. Đơn đổi hàng bị hủy.
Business Rules
BR-C12-01: Chỉ các đơn hàng đã giao thành công mới được phép gửi yêu cầu đổi/trả.
BR-C12-02: Khách hàng phải gửi yêu cầu trong vòng 2 ngày kể từ ngày nhận hàng.
BR-C12-03: Sản phẩm thuộc danh mục hạn chế đổi/trả không được phép thực hiện yêu cầu.
BR-C12-04: Khách hàng phải cung cấp lý do và hình ảnh minh chứng khi gửi yêu cầu.
BR-C12-05: Yêu cầu chỉ được xử lý sau khi được quản trị viên phê duyệt.
BR-C12-06: Hàng hóa gửi về kho phải đúng hiện trạng theo chính sách đổi/trả của Velura.
BR-C12-07: Hoàn tiền được thực hiện thông qua phương thức thanh toán ban đầu của đơn hàng.
BR-C12-08: Đơn đổi hàng có thể phát sinh thanh toán hoặc hoàn tiền chênh lệch giá.
BR-C12-09: Hệ thống phải lưu toàn bộ lịch sử xử lý đổi/trả để phục vụ kiểm tra và đối soát.
Non-Functional Requirement
NFR-C12-01: Hệ thống phản hồi thao tác gửi yêu cầu trong thời gian không quá 3 giây.
NFR-C12-02: Chỉ người dùng đã xác thực mới được phép gửi yêu cầu đổi/trả.

NFR-C12-03: Dữ liệu yêu cầu đổi/trả phải được truyền và lưu trữ thông qua HTTPS/TLS.
NFR-C12-04: Hệ thống phải ghi log toàn bộ quá trình xử lý đổi/trả và hoàn tiền.
NFR-C12-05: Trạng thái yêu cầu đổi/trả phải được cập nhật theo thời gian thực cho khách hàng.
NFR-C12-06: Hệ thống phải đảm bảo tính toàn vẹn dữ liệu đơn hàng, phiếu đổi/trả và giao dịch hoàn tiền.
Bảng 3.x: Đặc tả Use Case UC-C12 - Yêu cầu đổi/trả hàng
 
Hình 3.x: Biểu đồ Use Case Yêu cầu đổi/trả

---

3.3.2.12. Đặc tả use case: Tương tác với AI Stylist Chatbot 

Thuộc tính
Mô tả
Mã Use Case
UC-C12
Tên Use Case
Tương tác với AI Stylist Chatbot
Description
Cho phép người dùng tương tác với AI Stylist Chatbot để được tư vấn thời trang, sản phẩm, kích thước, phong cách phối đồ và giải đáp các câu hỏi liên quan đến website Velura thông qua văn bản hoặc hình ảnh.
Actor(s)
Khách vãng lai (Guest), Thành viên (Member), AI Stylist Chatbot, Nhân viên CSKH
Priority
High
Trigger
Người dùng nhấn vào biểu tượng AI Stylist Chatbot trên giao diện website.
Pre-Condition(s)
1. Website đang hoạt động bình thường.
2. Người dùng có quyền truy cập chatbot.
3. Hệ thống AI Stylist Chatbot đang sẵn sàng phục vụ.
Post-Condition(s)
1. Người dùng nhận được phản hồi từ AI hoặc nhân viên CSKH.
2. Hội thoại được kết thúc thành công.
3. Lịch sử hội thoại được lưu nếu người dùng đã đăng nhập.
4. Các yêu cầu cần hỗ trợ thủ công được chuyển đến bộ phận CSKH.
Basic Flow
1. Người dùng nhấn vào biểu tượng AI Stylist Chatbot.
2. Hệ thống hiển thị cửa sổ trò chuyện.
3. Người dùng nhập câu hỏi dạng văn bản hoặc tải lên hình ảnh cần tư vấn.
4. Hệ thống tiếp nhận dữ liệu đầu vào.
5. Hệ thống kích hoạt quy trình xử lý AI.
6. AI phân tích nội dung văn bản.
7. AI kiểm tra sự tồn tại của hình ảnh đính kèm.
8. AI đối chiếu dữ liệu với kho tri thức của hệ thống.
9. AI xác định được câu trả lời phù hợp.
10. Hệ thống tạo phản hồi cá nhân hóa kèm sản phẩm, hình ảnh hoặc thông tin liên quan.
11. Hệ thống gửi phản hồi cho người dùng.
12. Người dùng nhận phản hồi.
13. Hệ thống kiểm tra người dùng có tiếp tục đặt câu hỏi hay không.
14. Người dùng kết thúc cuộc trò chuyện.
15. Hệ thống kiểm tra trạng thái đăng nhập của người dùng.
16. Hệ thống hoàn tất phiên trò chuyện.
Alternative Flow
3a. Người dùng chỉ nhập văn bản, tiếp tục tại bước 4.
3b. Người dùng chỉ tải lên hình ảnh, tiếp tục tại bước 4.
3c. Người dùng nhập cả văn bản và hình ảnh, tiếp tục tại bước 4.
7a. Không có hình ảnh đính kèm, AI bỏ qua bước nhận diện hình ảnh và tiếp tục tại bước 8.
7b. Có hình ảnh đính kèm, AI thực hiện nhận diện màu sắc, phong cách, loại trang phục và các thuộc tính liên quan trước khi chuyển sang bước 8.
13a. Người dùng còn câu hỏi khác. Quy trình quay lại bước 3.
15a. Người dùng là Member. Hệ thống lưu lịch sử hội thoại vào cơ sở dữ liệu.
15b. Người dùng là Guest. Hệ thống không lưu lịch sử hội thoại sau khi kết thúc phiên làm việc.
Exception Flow
9e1. AI không tìm được câu trả lời phù hợp hoặc câu hỏi nằm ngoài phạm vi xử lý.
9e2. Hệ thống chuyển yêu cầu đến bộ phận CSKH.
9e3. Nhân viên CSKH nhận thông báo yêu cầu hỗ trợ.
9e4. Nhân viên CSKH phản hồi thủ công cho người dùng thông qua cửa sổ chat.
12e. Người dùng nhận phản hồi từ nhân viên CSKH thay vì AI.
4e. Dữ liệu đầu vào không hợp lệ hoặc tệp hình ảnh không được hỗ trợ. Hệ thống yêu cầu người dùng nhập lại dữ liệu.
5e. Hệ thống AI gặp lỗi xử lý. Yêu cầu được chuyển trực tiếp cho bộ phận CSKH.
10e. Không thể truy xuất kho tri thức hoặc dữ liệu sản phẩm. Hệ thống thông báo tạm thời không thể xử lý yêu cầu.
Business Rules
BR-C13-01: Guest và Member đều được phép sử dụng AI Stylist Chatbot.
BR-C13-02: Chatbot hỗ trợ tiếp nhận dữ liệu dạng văn bản, hình ảnh hoặc kết hợp cả hai.
BR-C13-03: Chỉ Member mới được lưu lịch sử hội thoại lâu dài.
BR-C13-04: Hệ thống phải ghi log toàn bộ các tương tác giữa người dùng và chatbot.
BR-C13-05: Các yêu cầu nằm ngoài khả năng xử lý của AI phải được chuyển đến bộ phận CSKH.
BR-C13-06: Phản hồi của AI phải dựa trên dữ liệu từ kho tri thức chính thức của Velura.
BR-C13-07: Hệ thống không được tự động tạo thông tin sản phẩm hoặc chính sách không tồn tại trong hệ thống.
BR-C13-08: Lịch sử hội thoại của Guest chỉ tồn tại trong phiên làm việc hiện tại.
Non-Functional Requirement
NFR-C13-01: Thời gian phản hồi trung bình của AI không vượt quá 5 giây đối với các yêu cầu thông thường.
NFR-C13-02: Hệ thống phải hỗ trợ đồng thời nhiều phiên trò chuyện.
NFR-C13-03: Dữ liệu trao đổi phải được truyền và lưu trữ thông qua HTTPS/TLS.
NFR-C13-04: Hệ thống phải ghi log toàn bộ lịch sử xử lý để phục vụ kiểm tra và cải thiện mô hình AI.
NFR-C13-05: Hệ thống phải đảm bảo tính sẵn sàng của chatbot tối thiểu 99%.
NFR-C13-06: Các dữ liệu cá nhân trong hội thoại phải được bảo vệ theo chính sách bảo mật của Velura.
Bảng 3.x: Đặc tả Use Case UC-C13 - Tương tác với AI Stylist Chatbot

Hình 3.x: Biểu đồ Use Case Tương tác với AI Stylist Chatbot

---

