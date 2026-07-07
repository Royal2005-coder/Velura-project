# UC-A01 - Quan ly tai khoan

## Muc tieu

Module cho phep `super_admin` tra cuu tai khoan, khoa/mo khoa, doi vai tro va xu ly yeu cau nang quyen. Supabase PostgreSQL la nguon du lieu chinh; mock chi duoc dung trong che do demo va test.

Thu tu uu tien khi co mau thuan:

1. Schema dang ton tai tren Supabase.
2. ERD va quy trinh BPMN duoc BA phe duyet.
3. Use case UC-A01 va bang quy tac AD_ACCOUNT.
4. UI/mocks hien tai.

## Vai tro

| Role | Pham vi UC-A01 |
| --- | --- |
| `super_admin` | Xem, khoa/mo khoa, doi vai tro, tao va xu ly yeu cau nang quyen |
| Cac `admin_operator_*` | Khong duoc truy cap module tai khoan |
| `admin_viewer` | Khong duoc truy cap module tai khoan |
| `member`, `guest` | Chi vao trang gioi thieu, khong co API admin |

## Yeu cau chuc nang (EARS)

- **FR-A01-001**: Khi `super_admin` mo trang tai khoan, he thong shall tra ve danh sach phan trang va cho phep tim theo ho ten, email hoac so dien thoai.
- **FR-A01-002**: Khi khoa tai khoan, he thong shall yeu cau ly do tren 10 tu, muc khoa `temporary` hoac `permanent`, va `expectedVersion`.
- **FR-A01-003**: Khi muc tieu la `super_admin` dang hoat dong cuoi cung, he thong shall tu choi khoa hoac ha quyen.
- **FR-A01-004**: Khi mo khoa tai khoan, he thong shall yeu cau ly do tren 10 tu va cap nhat tai khoan ve trang thai hoat dong.
- **FR-A01-005**: Khi doi sang vai tro khong phai `super_admin`, he thong shall cap nhat truc tiep neu du lieu va version hop le.
- **FR-A01-006**: Khi doi sang `super_admin`, he thong shall tao mot yeu cau `pending` thay vi cap nhat vai tro truc tiep.
- **FR-A01-007**: Khi duyet yeu cau nang quyen, nguoi duyet shall khac nguoi tao yeu cau va khac tai khoan duoc de xuat.
- **FR-A01-008**: Khi yeu cau qua 10 ngay, he thong shall chuyen sang `expired` va giu nguyen vai tro muc tieu.
- **FR-A01-009**: Khi mot thay doi nghiep vu thanh cong, he thong shall ghi `audit_log` va tao `email_outbox` trong cung transaction.
- **FR-A01-010**: Khi email gui loi, he thong shall giu nguyen thay doi tai khoan va thu lai toi da 3 lan trong 24 gio.
- **FR-A01-011**: Khi `expectedVersion` khong con khop, he thong shall tra `409 VERSION_CONFLICT` va khong ghi de.
- **FR-A01-012**: He thong shall khong bao gio tra `password_hash`, OTP hoac token trong API admin.

## Yeu cau phi chuc nang

- Danh sach va tim kiem phan hoi trong 3 giay o tai tieu chuan.
- Tat ca API admin bat buoc Supabase access token va HTTPS o staging/production.
- Quyen duoc kiem tra tai API va database; an nut tren UI khong duoc xem la bao mat.
- Audit log la append-only doi voi client va admin thong thuong.
- Moi loi co ma may doc duoc, `requestId` va thong diep khong lo du lieu nhay cam.

## Bang loi

| Ma | HTTP | Dieu kien |
| --- | --- | --- |
| `AUTH_REQUIRED` | 401 | Khong co/het han access token |
| `RBAC_DENIED` | 403 | Khong phai `super_admin` |
| `ACCOUNT_NOT_FOUND` | 404 | Khong tim thay tai khoan |
| `VALIDATION_ERROR` | 422 | Ly do <= 10 tu, role/lock type sai |
| `LAST_SUPER_ADMIN` | 409 | Khoa/ha quyen super admin cuoi cung |
| `VERSION_CONFLICT` | 409 | Version da thay doi |
| `APPROVAL_CONFLICT` | 409 | Yeu cau trung, tu duyet, da xu ly hoac het han |
| `SUPABASE_UNAVAILABLE` | 502/504 | Loi ket noi/timeout database |

## Tieu chi nghiem thu

### AC-A01-001 - Khoa tai khoan

Given mot `super_admin` va tai khoan muc tieu dang hoat dong
When gui muc khoa hop le, ly do tren 10 tu va version dung
Then tai khoan bi khoa, version tang mot, audit va email outbox duoc tao.

### AC-A01-002 - Bao ve super admin cuoi

Given chi con mot `super_admin` dang hoat dong
When co yeu cau khoa hoac ha quyen tai khoan do
Then API tra `409 LAST_SUPER_ADMIN` va du lieu khong thay doi.

### AC-A01-003 - Nang quyen hai nguoi

Given mot tai khoan chua phai `super_admin`
When admin A de xuat nang quyen va admin B duyet trong 10 ngay
Then vai tro muc tieu duoc cap nhat; admin A, admin B va muc tieu la ba dinh danh khac nhau.

### AC-A01-004 - Chong ghi de

Given hai admin cung doc version 4
When admin thu nhat cap nhat thanh cong
Then yeu cau sau voi version 4 bi tu choi `409`.

### AC-A01-005 - Khong lo du lieu nhay cam

Given danh sach hoac chi tiet tai khoan duoc tra ve
Then payload khong chua `password_hash`, `otp_code`, access token hoac refresh token.

