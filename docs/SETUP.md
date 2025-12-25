# Blog Factory - Setup Guide

## 필수 설정 단계

### 1. 환경 변수 설정

```bash
cd /Users/sdh/Dev/01_active_projects/blog_factory
cp .env.example .env
```

`.env` 파일 편집:

#### Naver Search API (필수)

1. https://developers.naver.com 접속
2. 애플리케이션 등록 → "검색" API 추가
3. Client ID, Secret 복사

```env
NAVER_CLIENT_ID=발급받은_클라이언트_ID
NAVER_CLIENT_SECRET=발급받은_시크릿
```

#### GitHub Token (필수)

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Generate new token
3. Repository access: 블로그 저장소 선택
4. Permissions: Contents (Read and write)

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_REPO=your-username/your-blog-repo
```

#### BigKinds (선택 - DeepNews 일부 도구용)

일부 도구는 인증 없이 사용 가능. 전체 기능 사용 시:

1. https://www.bigkinds.or.kr 가입
2. 로그인 정보 입력

```env
BIGKINDS_USER_ID=your_email@example.com
BIGKINDS_USER_PASSWORD=your_password
```

---

### 2. Telegram 설정 (Phase 2)

#### Bot 생성

1. Telegram에서 @BotFather 검색
2. `/newbot` 명령어 입력
3. 봇 이름, username 설정
4. 토큰 저장

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### Chat ID 확인

1. 봇과 대화 시작 (`/start`)
2. https://api.telegram.org/bot<TOKEN>/getUpdates 접속
3. `chat.id` 값 확인

```env
TELEGRAM_CHAT_ID=123456789
```

#### API Credentials (고급 - MTProto용)

1. https://my.telegram.org 접속
2. API development tools 선택
3. App 생성

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
```

---

### 3. GitHub Pages 블로그 설정

#### 저장소 생성

```bash
# 새 저장소 생성 (username.github.io 또는 별도 repo)
gh repo create my-viral-blog --public

# 또는 기존 Jekyll 블로그 사용
```

#### Jekyll 설정 (blog/_config.yml)

```yaml
title: My Viral Blog
description: Trending topics and insights
url: https://username.github.io
baseurl: ""

# 자동 배포를 위한 설정
plugins:
  - jekyll-feed
  - jekyll-seo-tag
```

#### GitHub Actions 활성화

Settings → Pages → Source → GitHub Actions

---

### 4. 초기화 실행

```bash
# 환경 초기화
./scripts/init.sh

# 테스트 실행
uv run pytest tests/ -v

# 모든 테스트 통과 확인
```

---

## MCP 서버 테스트

### trendkit 테스트

```bash
# 트렌드 조회 테스트
cd /Users/sdh/Dev/02_production/trendkit
uv run trendkit trend --limit 5
```

### deepnews 테스트

SSE 서버이므로 Claude Code에서 직접 테스트:

```
# Claude Code에서
오늘의 AI 이슈 알려줘
```

### naver-search 테스트

```bash
# 환경변수 설정 후
npx -y @isnow890/naver-search-mcp
```

---

## 체크리스트

- [ ] `.env` 파일 생성 및 설정
- [ ] Naver API 키 발급 및 설정
- [ ] GitHub Token 발급 및 설정
- [ ] GitHub Pages 저장소 준비
- [ ] `./scripts/init.sh` 실행
- [ ] `uv run pytest tests/ -v` 통과
- [ ] (Phase 2) Telegram Bot 생성
- [ ] (Phase 2) BigKinds 계정 설정

---

## 문제 해결

### "npx not found"

```bash
# Node.js 설치
brew install node
```

### "uv not found"

```bash
# uv 설치
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "Playwright not installed"

```bash
# trendkit bulk 기능 사용 시
cd /Users/sdh/Dev/02_production/trendkit
uv sync --extra playwright
uv run playwright install chromium
```

### MCP 연결 오류

1. `.mcp/mcp.json` 경로 확인
2. 환경변수 설정 확인
3. Claude Desktop 재시작
