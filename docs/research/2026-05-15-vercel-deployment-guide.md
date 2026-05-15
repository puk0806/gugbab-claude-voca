# Vercel 배포 가이드 (Phase 6)

> 본 문서는 Phase 6 PR 머지 직후 사용자가 1회 수행할 작업을 정리한다. Claude는 가입·import·deploy를 대신 수행할 수 없다 (사용자 본인 GitHub 계정 OAuth + Vercel 토큰 필요).

## 사전 조건

- GitHub 계정 (현재 `puk0806`) + 본 PR이 푸시되어 GitHub에 올라간 상태
- 로컬에서 `pnpm build` · `pnpm preview` 성공 확인 완료 (DoD §14)

---

## 절차

### 1. Vercel 가입 (5분)

1. https://vercel.com 접속
2. **Sign Up** → **Continue with GitHub** 선택
3. GitHub OAuth 권한 부여
4. **Hobby 플랜** 선택 (무료, 본 1인용 PWA에 충분)

### 2. 프로젝트 import

1. 대시보드 → **Add New...** → **Project**
2. GitHub 저장소 목록에서 `gugbab-claude-voca` 선택 → **Import**
3. 다음 설정 자동 감지 확인:
   - **Framework Preset**: `Vite`
   - **Build Command**: `pnpm build` (또는 `npm run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
   - **Node.js Version**: 20.x (Vercel 자동, 권장 20.19+)
4. **Environment Variables**: 추가 없음 (백엔드·env 0)
5. **Deploy** 버튼 클릭

### 3. 첫 배포 확인

- 빌드 로그에서 `vite build` · `PWA v1.x.x` 출력 확인
- 도메인 자동 발급: `gugbab-claude-voca.vercel.app` 또는 `gugbab-claude-voca-{사용자}.vercel.app`
- 도메인 클릭 → 앱 정상 로드 확인

### 4. PWA 동작 검증 (DevTools)

Chrome/Edge에서 배포 도메인 접속 → DevTools 열기 (`F12` 또는 `Cmd+Option+I`):

| 탭 / 섹션 | 확인 항목 |
|---|---|
| Application → Manifest | name·short_name·icons(192/512/maskable)·theme_color #1976d2 모두 표시 |
| Application → Service Workers | 등록 완료 + active 상태 |
| Application → Storage | precache cache 생성됨 (workbox-precache-*) |
| Network → Offline 토글 | 라우트 이동 시 SW에서 응답 |
| Lighthouse → Categories: PWA | 90+ 점수 권장 |

### 5. 모바일 install 시연 (선택)

- **iOS Safari**: 도메인 접속 → 공유 버튼 → **"홈 화면에 추가"** → 앱 아이콘이 홈 화면에 추가됨
- **Android Chrome**: 도메인 접속 → 메뉴(점 3개) → **"앱 설치"** 또는 자동 install banner → 홈 화면 추가

### 6. 이후 자동 흐름

- `main`에 push → Vercel이 production 자동 재배포
- `feature/*` 브랜치 push → Vercel preview 도메인 자동 발급 (PR 코멘트로 링크 자동 표시)

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 새로고침 시 404 | SPA fallback 미작동 | `vercel.json`의 `rewrites: [/(.*) → /index.html]` 확인 |
| SW 갱신 안 됨 | 브라우저 캐시 | DevTools → Application → Service Workers → "Unregister" → 새로고침 |
| Lighthouse PWA 점수 낮음 | manifest 또는 SW 누락 | DevTools Application 탭으로 원인 확인 (manifest 필수 필드·아이콘·offline) |
| install 버튼 안 보임 | manifest 불완전 또는 HTTPS 아님 | Vercel 도메인은 자동 HTTPS이므로 manifest 필드(icons·display·start_url) 확인 |
| 빌드 실패: pnpm not found | Vercel이 pnpm 자동 감지 못한 경우 | Settings → Install Command를 `corepack enable && pnpm install`로 |

---

## 커스텀 도메인 (선택, 추후)

`*.vercel.app` 대신 자체 도메인 사용하려면:

1. 도메인 구매 (가비아·Namecheap·Cloudflare 등)
2. Vercel 프로젝트 Settings → Domains → 도메인 추가
3. Vercel이 안내하는 DNS A/CNAME 레코드를 도메인 등록 업체 DNS 설정에 추가
4. Vercel이 Let's Encrypt SSL 자동 발급 + 적용
