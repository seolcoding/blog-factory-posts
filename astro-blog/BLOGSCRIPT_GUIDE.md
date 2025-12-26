# BlogScript 사용 가이드

## 📖 소개

BlogScript는 JSON 기반 블로그 콘텐츠 스키마로, LLM이 구조화된 JSON을 생성하면 엔진이 자동으로 MDX로 변환합니다.

**핵심 철학**: LLM은 창의성에 집중, 엔진은 일관성과 품질 보장

---

## 🚀 빠른 시작

### 1. BlogScript JSON 작성

```json
{
  "$blogscript": { "version": "1.0" },
  "meta": {
    "title": "나의 첫 BlogScript 포스트",
    "description": "BlogScript로 만드는 첫 블로그 글",
    "pubDatetime": "2025-12-26T10:00:00+09:00",
    "tags": ["튜토리얼", "BlogScript"],
    "author": "Blog Factory"
  },
  "beats": [
    {
      "type": "text",
      "content": "BlogScript를 사용하면 **일관된 품질**의 블로그 포스트를 자동으로 생성할 수 있습니다."
    },
    {
      "type": "heading",
      "level": "h2",
      "text": "주요 특징"
    },
    {
      "type": "stat-grid",
      "columns": "3",
      "stats": [
        { "label": "품질 점수", "value": "100%", "trend": "up" },
        { "label": "생성 시간", "value": "< 1초", "trend": "neutral" },
        { "label": "타입 안전성", "value": "완벽", "trend": "up" }
      ]
    }
  ]
}
```

### 2. MDX로 변환

```typescript
import { renderBlogScript } from '@/utils/blogScriptRenderer';
import { readFile, writeFile } from 'fs/promises';

// JSON 읽기
const json = JSON.parse(await readFile('my-post.json', 'utf-8'));

// MDX로 변환
const mdx = renderBlogScript(json);

// 저장
await writeFile('src/data/blog/my-post.mdx', mdx, 'utf-8');
```

### 3. 테스트

```bash
npx tsx test-blogscript-pipeline.mjs
```

---

## 📚 Beat 유형 가이드

### Text Beat
**용도**: 일반 텍스트, 문단, 리스트

```json
{
  "type": "text",
  "content": "**굵은 글씨**, *이탤릭*, [링크](https://example.com)\n\n- 리스트 항목 1\n- 리스트 항목 2"
}
```

**렌더링 결과**:
```markdown
**굵은 글씨**, *이탤릭*, [링크](https://example.com)

- 리스트 항목 1
- 리스트 항목 2
```

---

### Heading Beat
**용도**: 섹션 제목

```json
{
  "type": "heading",
  "level": "h2",
  "text": "주요 특징"
}
```

**렌더링 결과**:
```markdown
## 주요 특징
```

**레벨**: `"h2"`, `"h3"`, `"h4"`

---

### Image Beat
**용도**: 이미지 삽입 (다양한 소스 지원)

#### Wikipedia 이미지
```json
{
  "type": "image",
  "source": {
    "kind": "wikipedia",
    "entity": "Claude (language model)",
    "lang": "en"
  },
  "size": "large",
  "caption": "Anthropic의 Claude 로고"
}
```

#### DuckDuckGo 검색
```json
{
  "type": "image",
  "source": {
    "kind": "ddg",
    "query": "AI artificial intelligence 2025"
  },
  "size": "hero"
}
```

#### 직접 URL
```json
{
  "type": "image",
  "source": {
    "kind": "url",
    "url": "https://example.com/image.jpg"
  },
  "size": "medium",
  "caption": "이미지 설명"
}
```

**크기**: `"small"` (400px), `"medium"` (800px), `"large"` (1200px), `"hero"` (1600px), `"full"` (1920px)

---

### Stat-Grid Beat
**용도**: 통계 지표 표시

```json
{
  "type": "stat-grid",
  "columns": "3",
  "stats": [
    {
      "label": "시장 규모",
      "value": "$50B",
      "description": "2025년 전망",
      "trend": "up"
    },
    {
      "label": "성장률",
      "value": "+127%",
      "description": "전년 대비",
      "trend": "up"
    },
    {
      "label": "시장 점유율",
      "value": "23%",
      "description": "국내 1위",
      "trend": "neutral"
    }
  ]
}
```

**컬럼 수**: `"2"`, `"3"`, `"4"`
**트렌드**: `"up"`, `"down"`, `"neutral"`

---

### Table Beat
**용도**: 비교 테이블

```json
{
  "type": "table",
  "title": "AI 모델 비교",
  "headers": ["모델", "개발사", "가격", "특징"],
  "rows": [
    ["Claude Opus 4", "Anthropic", "$15/MTok", "긴 컨텍스트"],
    ["GPT-5", "OpenAI", "$20/MTok", "멀티모달"],
    ["Gemini 3", "Google", "$12/MTok", "검색 통합"]
  ]
}
```

---

### Timeline Beat
**용도**: 시간 순서 이벤트

```json
{
  "type": "timeline",
  "items": [
    {
      "date": "2024 Q1",
      "title": "프로젝트 시작",
      "description": "초기 기획 및 아키텍처 설계",
      "status": "completed"
    },
    {
      "date": "2024 Q2",
      "title": "MVP 개발",
      "description": "핵심 기능 구현",
      "status": "current"
    },
    {
      "date": "2024 Q3",
      "title": "정식 출시",
      "description": "베타 테스트 완료 후 출시",
      "status": "upcoming"
    }
  ]
}
```

**상태**: `"completed"`, `"current"`, `"upcoming"`

---

### Profile Beat
**용도**: 인물 소개

```json
{
  "type": "profile",
  "name": "Dario Amodei",
  "role": "Anthropic CEO",
  "description": "Claude 개발을 이끄는 AI 안전성 전문가",
  "image": {
    "kind": "wikipedia",
    "entity": "Dario Amodei",
    "lang": "en"
  },
  "stats": [
    { "label": "창업 연도", "value": "2021" },
    { "label": "펀딩", "value": "$7.3B" }
  ]
}
```

---

### Quote Beat
**용도**: 인용구, 명언

```json
{
  "type": "quote",
  "text": "AI의 미래는 인간과의 협업에 있습니다.",
  "author": "Dario Amodei",
  "source": "Anthropic Blog, 2025",
  "variant": "accent"
}
```

**스타일**: `"default"`, `"accent"`, `"minimal"`, `"card"`

---

### Callout Beat
**용도**: 주의사항, 팁, 정보 강조

```json
{
  "type": "callout",
  "variant": "tip",
  "title": "Pro Tip",
  "content": "BlogScript를 사용하면 SEO 점수가 자동으로 최적화됩니다."
}
```

**타입**: `"info"`, `"warning"`, `"success"`, `"tip"`, `"danger"`

---

### Divider Beat
**용도**: 섹션 구분선

```json
{
  "type": "divider"
}
```

---

### Spacer Beat
**용도**: 레이아웃 여백

```json
{
  "type": "spacer",
  "size": "medium"
}
```

**크기**: `"small"`, `"medium"`, `"large"`

---

## 🎨 실전 예제

### 제품 리뷰 포스트

```json
{
  "$blogscript": { "version": "1.0" },
  "meta": {
    "title": "2025 최고의 AI 코딩 도구 비교",
    "description": "Claude Code, GitHub Copilot, Cursor를 직접 사용해본 후기",
    "pubDatetime": "2025-12-26T10:00:00+09:00",
    "tags": ["AI", "코딩도구", "리뷰"],
    "author": "Blog Factory"
  },
  "hero": {
    "type": "image",
    "source": { "kind": "ddg", "query": "AI coding tools 2025" },
    "size": "hero",
    "alt": "AI 코딩 도구 일러스트"
  },
  "beats": [
    {
      "type": "text",
      "content": "2025년, AI 코딩 도구는 **필수**가 되었습니다. 3대 도구를 직접 비교해봤습니다."
    },
    {
      "type": "stat-grid",
      "columns": "3",
      "stats": [
        { "label": "테스트 기간", "value": "3개월", "trend": "neutral" },
        { "label": "생산성 향상", "value": "+45%", "trend": "up" },
        { "label": "만족도", "value": "9.2/10", "trend": "up" }
      ]
    },
    {
      "type": "heading",
      "level": "h2",
      "text": "도구별 비교"
    },
    {
      "type": "table",
      "title": "AI 코딩 도구 상세 비교",
      "headers": ["도구", "가격", "장점", "단점", "추천 대상"],
      "rows": [
        ["Claude Code", "무료/$20", "긴 컨텍스트", "학습 곡선", "대형 프로젝트"],
        ["Copilot", "$10/$20", "IDE 통합", "짧은 컨텍스트", "일상 코딩"],
        ["Cursor", "$20", "커스텀 룰", "비용", "팀 협업"]
      ]
    },
    {
      "type": "heading",
      "level": "h2",
      "text": "최종 추천"
    },
    {
      "type": "callout",
      "variant": "success",
      "title": "결론",
      "content": "프로젝트 규모에 따라 선택하되, **Claude Code**를 기본으로 사용하는 것을 추천합니다."
    },
    {
      "type": "quote",
      "text": "AI 도구는 개발자를 대체하는 것이 아니라, 더 창의적인 일에 집중하게 해줍니다.",
      "author": "개발자 A",
      "variant": "accent"
    }
  ],
  "references": [
    { "url": "https://anthropic.com", "title": "Anthropic 공식 사이트" },
    { "url": "https://github.com/features/copilot", "title": "GitHub Copilot" },
    { "url": "https://cursor.sh", "title": "Cursor" }
  ]
}
```

---

## ✅ 검증 및 테스트

### 스키마 검증

```typescript
import { validateBlogScript, safeParseBlogScript } from '@/utils/blogScriptRenderer';

// Throw on error
const validScript = validateBlogScript(jsonData);

// Safe parsing
const result = safeParseBlogScript(jsonData);
if (result.success) {
  console.log('Valid!', result.data);
} else {
  console.error('Invalid:', result.error);
}
```

### 품질 체크리스트

- [ ] 제목 길이: 10-70자
- [ ] 설명 길이: 50-160자
- [ ] 태그 개수: 3-10개
- [ ] 히어로 이미지 포함
- [ ] 최소 5개 이상의 beats
- [ ] 헤딩 구조 (h2 → h3 → h4)
- [ ] 이미지 alt 텍스트
- [ ] 참고 자료 링크

---

## 🛠️ 고급 팁

### 1. 이미지 최적화

```json
{
  "type": "image",
  "source": { "kind": "ddg", "query": "specific search terms" },
  "size": "large",
  "caption": "설명적인 캡션 작성",
  "alt": "접근성을 위한 대체 텍스트"
}
```

### 2. SEO 최적화

- **제목**: 핵심 키워드 앞쪽 배치
- **설명**: 행동 유도 문구 포함
- **태그**: 구체적이고 검색 가능한 키워드
- **이미지**: alt 텍스트에 키워드 포함

### 3. 구조 패턴

```
1. 히어로 이미지 (선택)
2. 요약 텍스트 (1-2 문단)
3. 통계 그리드 (핵심 지표)
4. 메인 콘텐츠 (heading + text 반복)
5. 시각 자료 (table, timeline, profile)
6. 결론 callout
7. 인용구 (선택)
8. 참고 자료
```

### 4. 에러 처리

```typescript
try {
  const script = validateBlogScript(json);
  const mdx = renderBlogScript(script);
  await writeFile(outputPath, mdx);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Schema validation failed:');
    console.error(error.errors);
  } else {
    console.error('Rendering failed:', error);
  }
}
```

---

## 📦 배포 워크플로우

### 수동 배포

```bash
# 1. JSON 작성
vim my-post.json

# 2. 검증 및 변환
npx tsx test-blogscript-pipeline.mjs

# 3. Git 커밋
git add src/data/blog/my-post.mdx
git commit -m "feat: Add new blog post"
git push origin main

# 4. GitHub Actions 자동 배포 확인
gh run list --limit 1
```

### 자동화 (예정)

```bash
# Claude Code Skill 사용
/blog "AI 코딩 도구 비교"

# 자동 실행:
# 1. MCP로 트렌드 리서치
# 2. LLM이 BlogScript JSON 생성
# 3. 엔진이 MDX 변환
# 4. Git 커밋 및 배포
# 5. 텔레그램 알림
```

---

## 🐛 트러블슈팅

### "Cannot find module 'zod'"
```bash
pnpm add zod
```

### "Schema validation failed: Invalid beat type"
Beat 타입 오타 확인 (`"heading"`, `"image"` 등 정확히 입력)

### "MDX parsing error: Unexpected closing tag"
HighlightBox 내부에 markdown 리스트 사용 시 HTML `<ul>/<li>` 태그로 변환

### "Image not found"
- Wikipedia: 정확한 엔티티 이름 사용
- DDG: 구체적인 검색어 사용
- Fallback: Pexels 자동 사용

---

## 📚 추가 자료

- **BlogScript 스키마**: `src/types/blogScript.ts`
- **렌더러 엔진**: `src/utils/blogScriptRenderer.ts`
- **테스트 예제**: `test-blogscript.json`
- **테스트 스크립트**: `test-blogscript-pipeline.mjs`
- **아키텍처 문서**: `CLAUDE.md`

---

*Last Updated: 2025-12-26*
