# DBC 2026 — WORK RELATIONSHIP & TASK SYSTEM
## DBC 2026 — BẢN ĐỒ CÔNG VIỆC & PHỐI HỢP

Hệ thống quản lý công việc và quan hệ phối hợp tương tác dành cho nhóm 4 người tham gia **Cuộc thi Sinh viên Kinh doanh Số 2026 (DBC 2026) - Nội dung: Bán hàng Online**.

---

### 1. Giới thiệu tổng quan

Hệ thống được thiết kế theo triết lý **Relationship Map** (Bản đồ quan hệ & điều phối), không chỉ là danh sách việc đơn thuần mà thể hiện chặt chẽ mối liên hệ:
**NGƯỜI ↕ VAI TRÒ ↕ CÔNG VIỆC ↕ QUAN HỆ PHỐI HỢP ↕ BÀN GIAO ↕ CHECKLIST ↕ TIẾN ĐỘ ↕ DỮ LIỆU GOOGLE SHEETS**

#### 4 Vai trò cốt lõi (Core Roles):
- 🔵 **ROLE 1: TRƯỞNG NHÓM / ĐIỀU PHỐI** — Điều phối chung, kế hoạch, tiến độ, KPI, phân bổ nguồn lực và báo cáo tổng kết.
- 🟣 **ROLE 2: PHÂN TÍCH THỊ TRƯỜNG** — Nghiên cứu sản phẩm, khách hàng mục tiêu, từ khóa SEO sàn, đối thủ cạnh tranh và phân tích dữ liệu hiệu quả kinh doanh.
- 🟢 **ROLE 3: QUẢN LÝ GIAN HÀNG** — Thiết lập gian hàng TMĐT & TikTok Shop, cấu trúc SKU/thuộc tính, đăng sản phẩm, voucher/khuyến mãi, quản lý đơn hàng và CSKH.
- 🟠 **ROLE 4: MARKETING / MẠNG XÃ HỘI / NỘI DUNG** — Kế hoạch Marketing, sáng tạo nội dung, thiết kế hình ảnh, sản xuất video ngắn, kéo traffic ngoại sàn và Affiliate.

*Lưu ý kiến trúc quan trọng:* Công việc gắn chặt vào **ROLE**, không gắn cứng vào tên người. Khi thay đổi người phụ trách một Role trong trang Thành viên, toàn bộ các công việc liên quan sẽ tự động hiển thị người mới mà không cần chỉnh sửa từng task!

---

### 2. Cách chạy trên môi trường cục bộ (Local Development)

#### Bước 1: Cài đặt dependencies
```bash
npm install
```

#### Bước 2: Khởi chạy Development Server
```bash
npm run dev
```
Truy cập ứng dụng tại `http://localhost:3000`.

#### Bước 3: Kiểm tra và Build Production
```bash
npm run build
```

---

### 3. Các tính năng chính trong ứng dụng

1. **Tổng quan (Dashboard):**
   - Thống kê thời gian thực: Tổng task, Chưa làm, Đang làm, Hoàn thành, Bị vướng, Quá hạn.
   - Thước đo tiến độ toàn đội và thanh tiến độ riêng cho từng Role.
   - Khu vực "Công việc cần chú ý" hiển thị ngay các rủi ro tiến độ.

2. **Bản đồ công việc tương tác (Relationship Map):**
   - Tương tác không gian trực quan với `@xyflow/react`.
   - 4 Role Node cố định xung quanh khu trung tâm (Top, Left, Right, Bottom).
   - Task Node hiển thị: Mã ID, tên, chip người cầm chính, người phối hợp, trạng thái, deadline và tiến độ %.
   - **Cơ chế Truy vết Quan hệ (Relationship Trace):**
     - Click vào bất kỳ ROLE nào (hoặc thành viên) ➔ Làm sáng Role đó, các việc riêng và toàn bộ việc chung có sự tham gia của Role đó. Các node khác mờ đi (opacity ~0.15).
     - Click vào bất kỳ TASK nào ➔ Làm sáng Task, người cầm chính, người phối hợp, người chốt và các đường liên kết liên quan.
     - Toggle *Hiện công việc trước / sau* ➔ Hiển thị đường mũi tên bàn giao và các task phụ thuộc trực tiếp.
     - Nhấn phím `ESC` hoặc click ra khoảng trống để xóa lựa chọn trở về toàn cảnh.
   - Hỗ trợ kéo thả card thủ công (lưu vị trí) hoặc bấm nút *Tự sắp xếp lại* (Auto Layout) theo signature phân vùng.

3. **Công việc của tôi (My Work):**
   - Đang xem với tư cách thành viên được chọn.
   - Bộ lọc: Tất cả, Tôi cầm chính, Tôi phối hợp, Tôi chốt.
   - Phân mục đặc biệt: **Đang chờ người khác** (nhận biết task nào đang chặn mình) và **Người khác đang chờ tôi** (đôn đốc hoàn tất bàn giao).

4. **Danh sách kiểm tra (Checklist):**
   - Tích chọn hoàn thành trực tiếp cập nhật tiến độ công việc tức thì.
   - Nhóm linh hoạt: Theo Người phụ trách, Theo Công việc, Theo Trạng thái.
   - Tự động gợi ý đánh dấu hoàn thành (DONE) khi tích xong toàn bộ checklist.

5. **Quản lý Thành viên (Members):**
   - 4 Role Card chi tiết.
   - Cho phép đổi tên, tên hiển thị ngắn, chỉ định Primary Person hoặc thêm người hỗ trợ.

6. **Danh sách Task dạng bảng (Task Table):**
   - Xem toàn bộ dữ liệu, tìm kiếm đa tiêu chí, sắp xếp theo ID, hạn chót, mức độ ưu tiên.
   - Cho phép chỉnh sửa nhanh trạng thái và deadline trực tiếp trên bảng.

7. **Tích hợp Google Sheets (Two-Way Sync):**
   - Hỗ trợ cả **Local Mode** (lưu trên trình duyệt) và **Google Sheets Sync**.
   - Phân tích tự động Spreadsheet ID từ URL bảng tính.
   - Tự động kiểm tra và khởi tạo 7 tab tiêu chuẩn nếu bảng tính trống.
   - Cơ chế phát hiện xung đột dữ liệu (Conflict Resolution) bảo vệ an toàn dữ liệu nhóm.

---

### 4. Cấu hình Google OAuth & Google Sheets API

Nếu muốn kích hoạt tính năng đồng bộ trực tiếp với Google Sheets:

1. Vào [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Dự án mới (hoặc dùng dự án hiện có).
3. Bật **Google Sheets API**.
4. Vào mục **APIs & Services > Credentials**, tạo một **OAuth 2.0 Client ID** loại *Web application*.
5. Thêm URL của bạn vào danh sách **Authorized JavaScript origins** (ví dụ `http://localhost:3000` hoặc URL triển khai).
6. Sao chép Client ID và cấu hình vào file `.env`:
   ```env
   VITE_GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
   ```
7. Bạn cũng có thể dán trực tiếp Client ID này tại giao diện trang *Google Sheets* trong ứng dụng bất kỳ lúc nào.

---

### 5. Cấu trúc 7 Tab trên Google Sheet

Khi bấm **Tạo cấu trúc tự động**, ứng dụng sẽ tạo 7 tab với các cột chuẩn xác:
- `ROLES`: `role_id`, `role_code`, `role_name`, `color`, `sort_order`, `active`
- `PEOPLE`: `person_id`, `full_name`, `short_name`, `role_id`, `avatar_url`, `is_primary`, `active`, `created_at`, `updated_at`
- `TASKS`: `task_id`, `title`, `category`, `owner_role_id`, `approver_role_id`, `status`, `priority`, `description`, `how_to`, `definition_of_done`, `start_date`, `due_date`, `progress`, `notes`, `created_at`, `updated_at`, `updated_by`
- `TASK_PARTICIPANTS`: `id`, `task_id`, `role_id`, `relation_type`, `responsibility`
- `CHECKLIST`: `checklist_id`, `task_id`, `text`, `assignee_role_id`, `status`, `sort_order`, `created_at`, `updated_at`
- `TASK_LINKS`: `link_id`, `source_task_id`, `target_task_id`, `link_type`, `label`
- `SETTINGS`: `key`, `value`

---

### 6. Sao lưu & Phục hồi dự phòng (JSON)

- Tại trang **Cài đặt**, bạn có thể bấm **Xuất file JSON sao lưu** để tải toàn bộ cơ sở dữ liệu hiện tại về máy tính.
- Khi cần chuyển thiết bị hoặc khôi phục, chỉ cần bấm **Nhập dữ liệu từ file JSON**.
- Bất kỳ lúc nào bạn cũng có thể bấm **Khôi phục dữ liệu mẫu DBC 2026** để tải lại 58 nhiệm vụ tiêu chuẩn của cuộc thi.
