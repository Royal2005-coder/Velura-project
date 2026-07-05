# ADR-001: Lo trinh backend Velura

- Status: Accepted
- Date: 2026-06-30

## Quyet dinh

Giu Node.js ESM API hien tai trong UC-A01 de tach rui ro nghiep vu khoi rui ro doi framework. Code moi phai tach router/service/repository, co API versioning va test tu dong. Sau khi UC-A01 va UC-A02 on dinh, chuyen facade API sang NestJS + TypeScript theo tung module, khong big-bang rewrite.

## Ly do

- Du an co sau phan he admin, RBAC, approval, audit, queue va can nhieu thanh vien phat trien song song.
- NestJS phu hop dai han voi module boundary, dependency injection, guard, validation pipe, OpenAPI va test harness.
- Chuyen framework ngay khi schema Supabase dang lech ten se lam kho phan biet loi migration, auth va nghiep vu.
- Service/repository cua giai doan hien tai duoc thiet ke de co the boc vao Nest provider sau nay.

## SSO

Supabase Auth tiep tuc la identity provider cua ung dung. SAML SSO chi duoc bat khi co metadata IdP, domain doanh nghiep, callback URL va plan Supabase ho tro. UUID Auth la dinh danh goc; email khong duoc dung lam khoa danh tinh SSO.

## Dieu kien chuyen NestJS

1. UC-A01 va UC-A02 co test nghiep vu xanh.
2. Canonical schema singular duoc xac nhan tren staging.
3. CI co unit/integration test va migration check.
4. Team thong nhat TypeScript strict, OpenAPI va convention module.

