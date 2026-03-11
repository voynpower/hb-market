# 🛒 HB Market

> **HB Market**은 현대적인 이커머스 경험을 제공하기 위한 고성능 풀스택 쇼핑몰 플랫폼입니다. 
> 백엔드(NestJS)와 프론트엔드(React)가 통합된 모노레포 구조로 설계되었으며, 다국어 지원 및 강력한 관리자 기능을 제공합니다.

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## ✨ 주요 기능 (Key Features)

### 👤 고객 서비스 (Storefront)
- **다국어 지원 (i18n):** 🇰🇷 한국어, 🇺🇿 Oʻzbekcha, 🇷🇺 Русский, 🇺🇸 English 완벽 지원.
- **반응형 디자인:** 모바일과 데스크탑 어디서든 최적화된 UI 제공.
- **상품 브라우징:** 실시간 검색, 카테고리 필터링 및 상세 정보 확인.
- **스마트 장바구니:** 상품 옵션별 재고 관리 및 실시간 장바구니 반영.
- **주문 및 결제:** 간편한 배송지 관리 및 주문 추적 시스템.

### 🛠 관리자 도구 (Admin Console)
- **대시보드:** 매출 현황, 신규 주문, 가입자 통계 실시간 모니터링.
- **상품 관리 (CRUD):** 이미지 업로드(최대 10MB), 옵션 설정, 판매 상태(`ON_SALE`, `OFF_SALE`) 관리.
- **강제 삭제 시스템:** 주문 내역이 있어도 참조 무결성을 유지하며 상품을 강제 삭제하는 기능.
- **주문 처리:** 결제 확인, 상품 준비, 배송 시작 등 주문 단계별 상태 업데이트.

---

## 🏗 프로젝트 구조 (Structure)

```text
hb-market/
├── backend/           # NestJS API 서버
│   ├── src/           # API 로직 (Auth, Products, Orders, etc.)
│   ├── prisma/        # 데이터베이스 스키마 및 마이그레이션
│   └── uploads/       # 상품 이미지 저장 폴더
└── frontend/
    └── web/           # React + Vite 프론트엔드
        ├── src/       # 컴포넌트, 페이지, 상태 관리
        └── public/    # 정적 자산
```

---

## 🚀 시작하기 (Getting Started)

### 1. 레포지토리 클론
```bash
git clone https://github.com/voynpower/hb-market.git
cd hb-market
```

### 2. 백엔드 설정 및 실행
```bash
cd backend
npm install
# .env 파일 생성 및 데이터베이스 연결 설정
npx prisma generate
npm run start:dev
```

### 3. 프론트엔드 설정 및 실행
```bash
cd ../frontend/web
npm install
npm run dev
```

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 기술 |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Vanilla CSS, React Router |
| **Backend** | NestJS, Prisma ORM, JWT Auth, Multer (File Upload) |
| **Database** | MariaDB / MySQL |
| **DevOps** | Git, NPM, ESLint, Prettier |

---

## 📄 라이선스 (License)
Copyright © 2026 [voynpower](https://github.com/voynpower). 
This project is licensed under the MIT License.
