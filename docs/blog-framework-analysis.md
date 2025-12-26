# 블로그 프레임워크 분석 리포트

## 요구사항 체크리스트

- [x] shadcn 같은 뻔한 것 말고
- [x] 심플함
- [x] Claude Code 자동화 친화적
- [x] 문서화 확실
- [x] 블로그 SEO 최적화
- [x] Static 라이브러리
- [x] UI 코드와 데이터 분리
- [x] JSON 데이터 → 자동 웹페이지 변환

---

## 🏆 추천: Astro + AstroPaper

### 선택 이유

| 요구사항 | Astro + AstroPaper | 현재 (Hugo + PaperMod) |
|---------|-------------------|----------------------|
| 심플함 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Claude Code 자동화 | ⭐⭐⭐⭐⭐ (TypeScript) | ⭐⭐⭐ (Go Templates) |
| 문서화 | ⭐⭐⭐⭐⭐ (공식 + 셀프 문서화) | ⭐⭐⭐⭐ |
| SEO | ⭐⭐⭐⭐⭐ (내장 + 플러그인) | ⭐⭐⭐⭐ |
| UI/데이터 분리 | ⭐⭐⭐⭐⭐ (Content Collections) | ⭐⭐⭐ |
| JSON → 페이지 | ⭐⭐⭐⭐⭐ (Zod 스키마) | ⭐⭐ |
| Lighthouse 점수 | 100/100 | 90~95 |

---

## Astro Content Collections 핵심 기능

### 1. 데이터/UI 완전 분리

```
src/
├── content/            # 데이터 (마크다운, JSON)
│   └── blog/
│       ├── post-1.md
│       └── post-2.json
├── pages/              # UI (페이지 라우팅)
│   └── posts/
│       └── [...slug].astro
└── components/         # 재사용 UI 컴포넌트
```

### 2. JSON/YAML 데이터 자동 변환

**데이터 파일 (src/data/blog/example.md):**
```yaml
---
title: "포스트 제목"
pubDatetime: 2025-12-26T09:00:00Z
tags: ["AI", "개발"]
description: "포스트 설명"
ogImage: "../../assets/og-image.png"
---

본문 내용...
```

**자동 페이지 생성 (src/pages/posts/[...slug].astro):**
```astro
---
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<Content />
```

### 3. Zod 스키마로 타입 안전

```typescript
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDatetime: z.date(),
    tags: z.array(z.string()).default(["others"]),
    description: z.string(),
    ogImage: z.string().optional(),
    draft: z.boolean().optional(),
  })
});

export const collections = { blog };
```

### 4. Claude Code 자동화 예시

```python
# content_generator.py
import json
from datetime import datetime

def create_post(title: str, content: str, tags: list[str]) -> dict:
    """JSON 데이터 생성 → Astro가 자동으로 페이지 변환"""
    return {
        "title": title,
        "pubDatetime": datetime.now().isoformat(),
        "tags": tags,
        "description": content[:150],
        "draft": False,
    }

# 파일로 저장하면 Astro가 자동 빌드
```

---

## AstroPaper 특징

### SEO 기능 (내장)

- ✅ 자동 Sitemap 생성
- ✅ RSS 피드 생성
- ✅ 동적 OG 이미지 생성
- ✅ Canonical URL 지원
- ✅ Schema.org JSON-LD
- ✅ Twitter/Facebook 메타 태그

### 접근성

- ✅ 스크린 리더 최적화
- ✅ 키보드 네비게이션
- ✅ 다크/라이트 모드
- ✅ WCAG 준수

### 성능

- ✅ Lighthouse 100점 달성
- ✅ Zero JavaScript 기본
- ✅ 이미지 자동 최적화
- ✅ CSS 자동 번들링

---

## 설치 및 마이그레이션 가이드

### 1. 프로젝트 생성

```bash
# AstroPaper 템플릿으로 시작
npm create astro@latest -- --template satnaing/astro-paper

# 또는 기존 Astro 프로젝트에 설정
npm install astro
```

### 2. 콘텐츠 구조

```
src/data/blog/
├── 2025-12-26-ai-agents.md     # 마크다운 포스트
├── 2025-12-26-vibe-coding.md
└── _drafts/                     # 밑줄 = URL 제외
    └── upcoming-post.md
```

### 3. 설정 파일 (src/config.ts)

```typescript
export const SITE = {
  website: "https://yourblog.com/",
  author: "Your Name",
  desc: "블로그 설명",
  title: "블로그 제목",
  ogImage: "og-image.jpg",
  lightAndDarkMode: true,
  postPerPage: 10,
  dynamicOgImage: true,
  lang: "ko",
  timezone: "Asia/Seoul",
};
```

### 4. Hugo에서 마이그레이션

| Hugo | Astro |
|------|-------|
| `content/posts/*.md` | `src/data/blog/*.md` |
| `hugo.toml` | `src/config.ts` |
| `layouts/` | `src/layouts/` |
| `static/` | `public/` |

**프론트매터 변환:**
```yaml
# Hugo
date: 2025-12-26T09:00:00+09:00
categories: [AI]
tags: [GPT, Claude]

# Astro (AstroPaper)
pubDatetime: 2025-12-26T00:00:00Z
tags: [AI, GPT, Claude]
```

---

## 대안 옵션

### 1. Google eleventy-high-performance-blog

- **장점**: Lighthouse 100점, Google 공식, 초경량
- **단점**: 11ty 학습 필요, TypeScript 약함
- **적합**: 극한의 성능 필요 시

### 2. Next.js + MDX

- **장점**: React 생태계, ISR 지원
- **단점**: 오버엔지니어링 가능성, 복잡함
- **적합**: 동적 기능 많이 필요 시

### 3. Docusaurus

- **장점**: 문서화 최강, React/MDX
- **단점**: 블로그보단 문서 특화
- **적합**: 기술 문서 + 블로그 병행 시

---

## 결론

**Astro + AstroPaper** 추천 이유:

1. **데이터/UI 분리**: Content Collections로 완벽 분리
2. **자동화 친화적**: TypeScript + Zod 스키마
3. **SEO 완벽**: 모든 SEO 기능 내장
4. **문서화 확실**: 공식 문서 + 셀프 문서화 테마
5. **심플함**: 설정 최소화, 빠른 시작
6. **성능**: Lighthouse 100점 달성

### 다음 단계

1. [ ] AstroPaper 템플릿으로 새 프로젝트 생성
2. [ ] 기존 Hugo 콘텐츠 마이그레이션
3. [ ] content_enricher.py와 연동
4. [ ] GitHub Actions 배포 설정
5. [ ] 텔레그램 알림 연동 유지

---

## 참고 자료

- [Astro 공식 문서](https://docs.astro.build/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [AstroPaper GitHub](https://github.com/satnaing/astro-paper)
- [AstroPaper 데모](https://astro-paper.pages.dev/)
- [Jamstack SSG 비교](https://jamstack.org/generators/)
