# sitemap.xml + robots.txt 생성

## 프로젝트
풀림 (~/study/main/pullim/pullim/) — Next.js 15

## 작업

### 1. robots.txt
`pullim/src/app/robots.ts` 생성 (Next.js App Router):
```ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: 'https://pullim.vercel.app/sitemap.xml',
  }
}
```

### 2. sitemap.xml
`pullim/src/app/sitemap.ts` 생성:
```ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://pullim.vercel.app', lastModified: new Date(), priority: 1 },
    { url: 'https://pullim.vercel.app/history', lastModified: new Date(), priority: 0.5 },
  ]
}
```

## 주의
- 새 파일만 생성
- `npm run build` 통과 확인
