# API 설정 완벽 가이드

## 1. Naver Search API 설정

### Step 1: 네이버 개발자 센터 접속

1. https://developers.naver.com 접속
2. 우측 상단 **로그인** (네이버 계정 필요)

### Step 2: 애플리케이션 등록

1. 상단 메뉴 **Application** → **애플리케이션 등록**
2. 정보 입력:

| 항목 | 입력값 |
|-----|-------|
| 애플리케이션 이름 | `Blog Factory` (자유) |
| 사용 API | ✅ **검색** 선택 |
| 비로그인 오픈 API 서비스 환경 | **WEB 설정** 선택 |
| 웹 서비스 URL | `http://localhost` |

3. **등록하기** 클릭

### Step 3: 키 확인

등록 완료 후 **내 애플리케이션** 페이지에서:

```
Client ID: xxxxxxxxxx
Client Secret: xxxxxxxxxx
```

### Step 4: .env 설정

```bash
cd /Users/sdh/Dev/01_active_projects/blog_factory
```

`.env` 파일 편집:
```env
NAVER_CLIENT_ID=발급받은_Client_ID
NAVER_CLIENT_SECRET=발급받은_Client_Secret
```

### Step 5: 테스트

```bash
# MCP 서버 테스트
npx -y @isnow890/naver-search-mcp
# Ctrl+C로 종료
```

---

## 2. GitHub Token 설정

### Step 1: GitHub 설정 접속

1. https://github.com 로그인
2. 우측 상단 프로필 아이콘 → **Settings**
3. 좌측 메뉴 최하단 **Developer settings**

### Step 2: Personal Access Token 생성

1. **Personal access tokens** → **Fine-grained tokens**
2. **Generate new token** 클릭

### Step 3: 토큰 설정

| 항목 | 설정값 |
|-----|-------|
| Token name | `blog-factory` |
| Expiration | 90 days (또는 Custom) |
| Repository access | **Only select repositories** → 블로그 저장소 선택 |

### Step 4: 권한 설정

**Repository permissions**에서:

| Permission | Access |
|-----------|--------|
| **Contents** | Read and write |
| **Metadata** | Read-only (자동 선택됨) |
| **Pull requests** | Read and write (선택사항) |
| **Actions** | Read-only (배포 확인용) |

### Step 5: 토큰 생성 및 복사

1. **Generate token** 클릭
2. `ghp_xxxxxxxxxxxxxxxxxxxx` 형식의 토큰 복사
3. ⚠️ **이 페이지를 벗어나면 다시 볼 수 없음!**

### Step 6: .env 설정

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO=your-username/your-blog-repo
```

### Step 7: 테스트

```bash
# GitHub CLI로 테스트 (gh 설치 필요)
gh auth login --with-token <<< "$GITHUB_TOKEN"
gh repo view $GITHUB_REPO
```

---

## 3. Telegram Bot 설정

### Step 1: BotFather로 봇 생성

1. Telegram 앱에서 **@BotFather** 검색
2. 대화 시작 → `/start`
3. `/newbot` 명령어 입력

### Step 2: 봇 정보 입력

```
BotFather: Alright, a new bot. How are we going to call it?
You: Blog Factory Bot

BotFather: Good. Now let's choose a username for your bot.
You: blog_factory_notify_bot
```

⚠️ 봇 username은 `_bot`으로 끝나야 함

### Step 3: 토큰 저장

BotFather가 제공하는 토큰 복사:
```
Use this token to access the HTTP API:
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Step 4: 봇과 대화 시작

1. 생성된 봇 검색 (예: @blog_factory_notify_bot)
2. **Start** 버튼 클릭 또는 `/start` 입력

### Step 5: Chat ID 확인

브라우저에서 접속:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

예시:
```
https://api.telegram.org/bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates
```

응답에서 `chat.id` 찾기:
```json
{
  "result": [{
    "message": {
      "chat": {
        "id": 123456789,  // ← 이 값이 Chat ID
        "type": "private"
      }
    }
  }]
}
```

### Step 6: .env 설정

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Step 7: 테스트

```bash
# 메시지 전송 테스트
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": \"Blog Factory 연동 테스트!\"}"
```

---

## 4. (고급) Telegram MTProto API 설정

> Bot API보다 강력한 기능이 필요한 경우 (메시지 읽기 등)

### Step 1: my.telegram.org 접속

1. https://my.telegram.org 접속
2. 전화번호 입력 → 인증 코드 입력

### Step 2: API 생성

1. **API development tools** 클릭
2. 앱 정보 입력:

| 항목 | 입력값 |
|-----|-------|
| App title | `Blog Factory` |
| Short name | `blogfactory` |
| Platform | Desktop |

3. **Create application** 클릭

### Step 3: 키 확인

```
App api_id: 12345678
App api_hash: 0123456789abcdef0123456789abcdef
```

### Step 4: .env 설정

```env
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef
```

---

## 5. BigKinds (DeepNews) 설정

> 일부 도구는 인증 없이 사용 가능. 전체 기능 사용 시 필요.

### Step 1: 회원가입

1. https://www.bigkinds.or.kr 접속
2. 우측 상단 **회원가입**
3. 일반 회원 가입 완료

### Step 2: .env 설정

```env
BIGKINDS_USER_ID=your_email@example.com
BIGKINDS_USER_PASSWORD=your_password
```

---

## 최종 .env 파일 예시

```env
# ============================================================
# Naver Search API
# ============================================================
NAVER_CLIENT_ID=aBcDeFgHiJkL
NAVER_CLIENT_SECRET=mNoPqRsTuV

# ============================================================
# GitHub
# ============================================================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=seolcoding/my-viral-blog

# ============================================================
# Telegram Bot
# ============================================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321

# ============================================================
# Telegram MTProto (Optional)
# ============================================================
# TELEGRAM_API_ID=12345678
# TELEGRAM_API_HASH=0123456789abcdef0123456789abcdef

# ============================================================
# BigKinds (Optional)
# ============================================================
# BIGKINDS_USER_ID=email@example.com
# BIGKINDS_USER_PASSWORD=password

# ============================================================
# Agent Settings
# ============================================================
AGENT_MAX_ITERATIONS=50
LOG_LEVEL=INFO
```

---

## 검증 스크립트

모든 설정 후 검증:

```bash
cd /Users/sdh/Dev/01_active_projects/blog_factory

# 환경변수 로드
source .env

# 1. Naver API 테스트
echo "=== Naver API ==="
curl -s "https://openapi.naver.com/v1/search/news.json?query=AI&display=1" \
  -H "X-Naver-Client-Id: $NAVER_CLIENT_ID" \
  -H "X-Naver-Client-Secret: $NAVER_CLIENT_SECRET" | head -100

# 2. GitHub API 테스트
echo -e "\n=== GitHub API ==="
curl -s "https://api.github.com/user" \
  -H "Authorization: Bearer $GITHUB_TOKEN" | grep login

# 3. Telegram Bot 테스트
echo -e "\n=== Telegram Bot ==="
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | grep username

echo -e "\n=== All checks complete ==="
```

---

## 문제 해결

### Naver API: "인증 실패"
- Client ID/Secret 확인
- 애플리케이션에서 "검색" API가 활성화되었는지 확인
- 일일 할당량(25,000건) 초과 여부 확인

### GitHub: "Bad credentials"
- 토큰 만료 여부 확인
- Fine-grained token의 repository access 확인
- Contents permission이 Read and write인지 확인

### Telegram: "chat not found"
- 봇과 대화를 시작했는지 확인 (/start)
- Chat ID가 올바른지 확인
- 그룹 채팅의 경우 Chat ID 앞에 `-` 필요 (예: -123456789)

### BigKinds: "로그인 실패"
- 계정이 활성화되었는지 확인
- 비밀번호에 특수문자가 있으면 따옴표로 감싸기
