# 바디체인지 랭킹전 - 무료 배포 가이드

모든 서비스가 **완전 무료**이며, 8월까지 안정적으로 운영 가능합니다.

---

## 전체 구조

| 서비스 | 역할 | 비용 |
|--------|------|------|
| **GitHub** | 코드 저장소 | 무료 |
| **Turso** | 데이터베이스 (클라우드 SQLite) | 무료 (5GB) |
| **Render** | 웹 서버 호스팅 | 무료 |

---

## 1단계: GitHub 계정 생성 + 저장소 만들기

### 1-1. GitHub 가입
1. [https://github.com/signup](https://github.com/signup) 접속
2. 이메일, 비밀번호, 사용자명 입력 후 가입
3. 이메일 인증 완료

### 1-2. 새 저장소(Repository) 만들기
1. 로그인 후 우측 상단 **+** 버튼 → **New repository** 클릭
2. Repository name: `body-change-ranking`
3. **Public** 선택 (Render 무료 플랜은 Public 저장소만 지원)
4. 나머지는 기본값 → **Create repository** 클릭

### 1-3. 코드 업로드
GitHub에서 제공하는 방법 중 가장 간단한 방법:

**방법 A: GitHub 웹에서 직접 업로드**
1. 저장소 페이지에서 **uploading an existing file** 링크 클릭
2. 폴더/파일을 드래그 앤 드롭
3. **Commit changes** 클릭

**방법 B: Git CLI 사용 (컴퓨터에 Git이 설치된 경우)**
```bash
cd body-change-ranking
git remote add origin https://github.com/YOUR_USERNAME/body-change-ranking.git
git branch -M main
git push -u origin main
```

> ⚠️ `.env` 파일은 절대 업로드하지 마세요! (이미 .gitignore에 포함)

---

## 2단계: Turso 데이터베이스 생성 (무료)

### 2-1. Turso 가입
1. [https://turso.tech](https://turso.tech) 접속
2. **Get Started Free** 클릭
3. GitHub 계정으로 로그인 (1단계에서 만든 계정 사용)

### 2-2. 데이터베이스 생성
1. 대시보드에서 **Create Database** 클릭
2. 이름: `body-change` (원하는 이름)
3. 지역: **Tokyo (nrt)** 선택 (한국에서 가장 가까운 서버)
4. **Create** 클릭

### 2-3. 연결 정보 확인
1. 생성된 데이터베이스 클릭
2. 상단에 **Database URL** 확인 → 복사해두기
   - 예: `libsql://body-change-USERNAME.turso.io`
3. 좌측 메뉴에서 **Generate Token** 클릭 → 토큰 복사해두기
   - 토큰은 한 번만 표시되므로 **반드시 메모장에 저장**

---

## 3단계: Render.com 배포 (무료)

### 3-1. Render 가입
1. [https://render.com](https://render.com) 접속
2. **Get Started for Free** 클릭
3. **GitHub** 버튼으로 가입 (1단계 계정과 연동)

### 3-2. 웹 서비스 생성
1. 대시보드에서 **New** → **Web Service** 클릭
2. GitHub 저장소 연결:
   - `body-change-ranking` 저장소 선택 → **Connect**
3. 설정:
   - **Name**: `body-change-ranking`
   - **Region**: `Singapore (Southeast Asia)` (한국에서 가장 가까운 서버)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `NODE_ENV=production node dist/index.cjs`
   - **Instance Type**: **Free** 선택

### 3-3. 환경 변수 설정 (중요!)
아래쪽 **Environment Variables** 섹션에서 **Add Environment Variable** 클릭:

| Key | Value |
|-----|-------|
| `TURSO_DATABASE_URL` | 2단계에서 복사한 Database URL |
| `TURSO_AUTH_TOKEN` | 2단계에서 복사한 Auth Token |
| `NODE_VERSION` | `20` |

### 3-4. 배포
**Create Web Service** 버튼 클릭 → 자동으로 빌드 & 배포 시작

첫 빌드에 2~3분 소요됩니다. 완료 후 상단에 URL이 표시됩니다:
- 예: `https://body-change-ranking.onrender.com`

---

## 4단계: 사용하기

| 페이지 | URL |
|--------|-----|
| 랭킹 페이지 (회원용) | `https://your-app.onrender.com` |
| 관리자 페이지 | `https://your-app.onrender.com/#/admin` |

- **관리자 비밀번호**: `bodychange2026`
- 비밀번호를 바꾸려면 `server/routes.ts` 파일에서 `ADMIN_PASSWORD` 값을 수정 후 GitHub에 push하면 Render가 자동 재배포합니다.

---

## 알아두면 좋은 점

### Render 무료 플랜 특성
- **15분 동안 접속이 없으면 서버가 절전 모드**로 들어갑니다
- 다시 접속하면 약 30초~1분 후 자동으로 깨어납니다
- 데이터는 Turso 클라우드에 저장되므로 **절전 모드에서도 데이터 유지**

### Turso 무료 플랜 한도
- 5GB 저장 공간 (바디체인지 랭킹전 데이터로는 충분)
- 월 500M 행 읽기 (충분)
- 월 10M 행 쓰기 (충분)

---

## 문제 해결

| 증상 | 해결 |
|------|------|
| 사이트가 느리게 로딩 | Render 무료 플랜은 15분 비활성 시 절전 → 잠시 기다리면 로딩됨 |
| 데이터가 안 보임 | Render 환경 변수에 TURSO_DATABASE_URL과 TURSO_AUTH_TOKEN이 올바르게 입력되었는지 확인 |
| 빌드 실패 | Render 대시보드 → Logs 확인 → 대부분 환경변수 누락이 원인 |
