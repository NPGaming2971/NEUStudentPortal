<div align="center">
  <h1>NEU PORTAL v2</h1>
  <p><b>Hệ thống Cổng thông tin Sinh viên Đại học Kinh tế Quốc dân (Phiên bản mới)</b></p>
  <p>
    <a href="#giới-thiệu">Giới thiệu</a> •
    <a href="#công-nghệ-sử-dụng">Công nghệ</a> •
    <a href="#tính-năng-chính">Tính năng</a> •
    <a href="#kiến-trúc-dự-án">Kiến trúc</a> •
    <a href="#hướng-dẫn-cài-đặt">Cài đặt</a> •
    <a href="#hướng-dẫn-sử-dụng">Sử dụng</a>
  </p>
</div>

---

## Giới thiệu

**NEU Portal v2** là môt hệ thống quản lý thông tin sinh viên toàn diện, được xây dựng lại với giao diện hiện đại, trực quan và tối ưu hóa trải nghiệm người dùng. Dự án hướng đến việc cung cấp một môi trường tương tác hiệu quả, giúp sinh viên Đại học Kinh tế Quốc dân dễ dàng theo dõi thông tin học tập, tài chính và các hoạt động ngoại khóa ngay trên một nền tảng duy nhất.

---

## Công nghệ sử dụng

Dự án được phát triển dựa trên các công nghệ và thư viện hiện đại nhất trong hệ sinh thái frontend, đảm bảo hiệu suất cao, dễ bảo trì và mở rộng:

* **Core Framework:** React 19 kết hợp với Vite (Build tool siêu tốc).
* **Ngôn ngữ:** TypeScript (Kiểm soát kiểu dữ liệu chặt chẽ).
* **Quản lý State:** Zustand (Gọn nhẹ, hiệu năng cao, thay thế Redux).
* **Routing:** React Router DOM v7.
* **Styling & Giao diện:** 
  * Tailwind CSS v4 (Utility-first CSS framework).
  * Radix UI Primitives (Headless UI accessibility).
  * Class Variance Authority (CVA) + clsx + tailwind-merge (Thiết kế hệ thống Component linh hoạt).
* **Gọi API & Xử lý dữ liệu:** Axios.
* **Tiện ích khác:**
  * Xử lý thời gian thi/học: date-fns.
  * Hiển thị biểu đồ học lực: Recharts.
  * Lịch (Calendar): react-day-picker.

---

## Tính năng chính

Ứng dụng đáp ứng toàn diện mọi nhu cầu tra cứu và thao tác của sinh viên, bao gồm các phân hệ (modules) cốt lõi:

### 1. Phân hệ Học tập
* **Kết quả học tập:** Theo dõi điểm số, điểm trung bình tích luỹ qua các học kì.
* **Lịch học và Lịch thi:** Giao diện lịch trực quan, giúp sinh viên tiện theo dõi thời gian và phòng học.
* **Chương trình đào tạo & Điểm rèn luyện:** Cập nhật tiến độ hoàn thành chương trình học và đánh giá chuyên cần/hành vi cá nhân.

### 2. Phân hệ Đăng ký học phần
* **Đăng ký mới / Học lại / Cải thiện:** Xử lý quy trình đăng ký môn học và học lại (Retake).
* **Lịch sử đăng ký & Kết quả đăng ký:** Tra cứu danh sách môn học đã đăng ký thành công.
* **Kế hoạch đăng ký trực tuyến:** Xem trước các môn học dự kiến mở trong học kì tới.

### 3. Phân hệ Tài chính - Học phí
* Theo dõi công nợ, chi tiết học phí từng kì.
* Kiểm tra lịch sử thanh toán và tình trạng xử lý biên lai.
* Theo dõi học bổng hỗ trợ.

### 4. Hệ thống Tương tác & Trợ lý ảo (Tiện ích nhúng)
* **Chatbot sinh viên:** Tích hợp tính năng Chatbot AI (tương tự ChatGPTUI) hỗ trợ sinh viên giải đáp thắc mắc 24/7.
* **Thông báo & Thảo luận:** Bảng tin nội bộ, trao đổi học thuật, và các thông báo khẩn từ nhà trường.

---

## Kiến trúc Dự án

Dự án được cấu trúc theo mô hình phân tách components rành mạch, dễ dàng mở rộng và bảo trì.

```text
neu-portal/
├── src/
│   ├── assets/       # Chứa tài nguyên tĩnh (hình ảnh, fonts)
│   ├── components/   # Các UI components dùng chung (Buttons, Cards, Modals...)
│   ├── contexts/     # React Context Providers
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Các utils liên quan tới thư viện bên thứ 3
│   ├── pages/        # Các trang màn hình của ứng dụng (HomePage, LoginPage...)
│   ├── routes/       # Cấu hình định tuyến (Routing)
│   ├── services/     # Tầng gọi API qua Axios
│   ├── stores/       # Zustand store quản lý state toàn cục
│   └── utils/        # Các hàm tiện ích dùng chung (formaters, helpers)
├── public/           # Assets công khai, không qua quá trình build
├── package.json      # Quản lý dependencies và scripts
├── vite.config.ts    # Cấu hình Vite
└── tsconfig.json     # Cấu hình TypeScript
```

---

## Hướng dẫn Cài đặt

Để cài đặt và chạy ứng dụng trên máy cá nhân, yêu cầu cần có **Node.js (phiên bản từ 18 trở lên)**.

**Bước 1: Tải source code**
```bash
git clone <repository_url>
cd neu-portal
```

**Bước 2: Cài đặt các gói thư viện (Dependencies)**
Có thể dùng `npm`, `yarn` hoặc `pnpm`. Mặc định cấu hình dự án đang lưu `package-lock.json`.
```bash
npm install
```

**Bước 3: Thiết lập biến môi trường**
Tạo tệp `.env` tại thư mục gốc dự án và khai báo đường dẫn tới Backend API. (Thay đổi giá trị cho phù hợp).
```env
VITE_API_BASE_URL=https://api.neu.edu.vn/
```

**Bước 4: Chạy dự án (Môi trường Development)**
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`

**Bước 5: Chạy dự án (Môi trường Production)**
Build bộ mã nguồn:
```bash
npm run build
```
Xem trước tệp tin đã build:
```bash
npm run preview
```

---

## Hướng dẫn Sử dụng

1. **Đăng nhập Hệ thống:** Sử dụng mã sinh viên (MSSV) và mật khẩu được cấp bởi nhà trường tại màn hình Login.
2. **Khám phá Bảng điều khiển (Dashboard):** Tại trang chủ, sinh viên có thể xem nhanh Lịch học hôm nay, Tổng quan điểm số và Số dư tài chính.
3. **Sử dụng Chatbot hỗ trợ:** Mở module Chatbot từ thanh điều hướng để đặt các câu hỏi trực tiếp về thủ tục hành chính, quy chế đào tạo, hệ thống thẻ sinh viên, hoặc chương trình liên kết.
4. **Theo dõi Tiến độ Đăng ký môn:** Khi vào đợt khai báo học phần, truy cập "Đăng ký học phần", tra cứu mã lớp và thêm vào giỏ. Chờ xếp lịch và thanh toán học phí.

---

> Trải nghiệm tốt nhất trên các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari cập nhật mới nhất). Nếu phát sinh lỗi liên quan đến tiện ích mở rộng cản trở giao diện, vui lòng gửi phản hồi tại mục **Cài đặt -> Báo lỗi**.
