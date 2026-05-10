# gugbab-voca — Phase 1 아키텍처 설계 문서

> 작성일: 2026-05-10 / 기준 PRD: 2026-05-07 / 스택: React 19 + Vite + Dexie 4.x + React Router v7

---

## 1. 개요

### 한 줄 요약
CEFR 6단계(A1~C2) 영어 단어·문장을 SRS(SM-2) 기반 플래시카드로 학습하는 1인용 클라이언트-온리 PWA. 백엔드 없음, 정적 JSON 콘텐츠 + IndexedDB 진도 저장 + Web Speech API TTS.

### 목표 (Phase 1 범위)
| 항목 | 정의 |
|---|---|
| 기능 범위 | PRD P0 (레벨 선택·모드 선택·플래시카드·TTS·세션 종료 요약) + P1 (SRS·설정) |
| 비기능 범위 | PWA 오프라인·반응형·접근성 AA |
| 기술 결정 | React 19 / Vite / TS strict / Dexie 4.x / RR v7 Data Mode / Zustand / SM-2 직접 구현 |
| 산출물 | 디렉토리 구조·라우트·DB 스키마·SRS 인터페이스·TTS 추상화·의존성 표 |

### 비목표
- 백엔드/인증/멀티 디바이스 동기화
- STT·발음 평가·LLM 연동
- 콘텐츠 입력 UI (Claude로 정적 JSON 갱신만)
- FSRS-5 (Phase 5+ 후보로 보류)

### 본 문서의 범위
*결정·근거·인터페이스 정의*만 다룬다. 구현 코드·UI 디자인·콘텐츠 큐레이션은 별도 단계에서.

---

## 2. 디렉토리 구조

```
src/
  routes/                  # React Router v7 라우트 컴포넌트 + loader
    root.tsx               # 루트 레이아웃 (헤더·하단 네비)
    home.tsx               # / : 레벨 선택
    level.tsx              # /level/:cefr : 모드 선택
    learn.tsx              # /learn/:cefr/:mode : 학습 세션
    summary.tsx            # /summary : 세션 종료 요약 (메모리 state)
    stats.tsx              # /stats : 통계 (P2)
    settings.tsx           # /settings : 설정
    not-found.tsx          # 404
  features/
    learning/              # 학습 도메인 (모든 모드 공통)
      composeQueue.ts      # due + new 합성 (마킹 가중치 포함, M5)
      session.ts           # 세션 상태 머신
      hooks/
        useSession.ts
    flashcard/             # Mode A: 플래시카드
      Flashcard.tsx        # 앞면·뒷면·뒤집기
      useFlashcard.ts
    recall/                # Mode B: 한→영 입력 (M3)
      RecallPrompt.tsx     # 한국어 + 입력창
      AnswerInput.tsx      # 입력 + 매칭 + 정답보기
      useRecall.ts
    cloze/                 # Mode C: 빈칸 채우기 (M2)
      ClozePrompt.tsx      # 영어 빈칸 + 입력창
      ClozeBlank.tsx       # 빈칸 셀 (마커 파싱)
      useCloze.ts
    vocabulary/            # Mode D: 단어장 (학습 X) (M4·M5)
      VocabularyList.tsx   # 리스트 + 검색
      VocabularyItem.tsx   # 행 + 상태 배지 + 마킹 토글
      VocabularyDetail.tsx # 상세 모달
      useVocabulary.ts
      filter.ts            # 검색·필터 로직
    stats/                 # 통계 (P2)
    settings/              # 설정 폼 + 저장 로직
  shared/
    components/            # 공통 UI (Flashcard·LevelCard·ProgressBar 등)
    hooks/                 # 공통 훅 (useDebouncedCallback 등)
    utils/                 # 순수 함수 유틸 (shuffle·clamp 등)
    types/                 # 도메인 타입 정의 (Card·Session·Settings)
  db/
    schema.ts              # Dexie 인스턴스 + version().stores()
    repository/
      progressRepo.ts      # cardProgress CRUD
      settingsRepo.ts      # appSettings key-value
      sessionLogRepo.ts    # sessionLog (P1)
    persistence.ts         # navigator.storage.persist() 요청
  srs/
    sm2.ts                 # SM-2 공식 (순수 함수)
    safeReview.ts          # 시계 변경 방어 래퍼
    rating.ts              # 2버튼/자동채점 → Q 매핑
    initialFromMark.ts     # userMark → 초기 EF·interval (M6)
    matching.ts            # 입력 매칭 함수 (M3, recall·cloze 공용)
    types.ts               # SrsCard / Rating / StudyMode / UserMark 타입
  tts/
    useSpeak.ts            # React 훅
    voices.ts              # loadVoices + pickEnglishVoice
    support.ts             # isSpeechSynthesisSupported
  content/
    loader.ts              # public/data/{words,sentences}/{cefr}.json fetch
    types.ts               # WordEntry / SentenceEntry / Manifest
    manifest.ts            # manifest.json 로딩 + 메타
  store/
    useSessionStore.ts     # Zustand: currentSession·activeQueue
    useUiStore.ts          # Zustand: toastQueue·playingTts
  pwa/
    register.ts            # virtual:pwa-register import + skipWaiting
    UpdateToast.tsx        # 새 SW 발견 시 안내 컴포넌트
  styles/
    global.css             # @gugbab/tokens CSS 변수 import
  main.tsx                 # ReactDOM.createRoot + RouterProvider
public/
  data/
    words/{a1,a2,b1,b2,c1,c2}.json
    sentences/{a1,a2,b1,b2,c1,c2}.json
    manifest.json          # 콘텐츠 빌드 메타
  manifest.webmanifest     # PWA manifest
  icons/                   # 192·512·maskable·apple-touch-icon
```

### 폴더 책임

| 폴더 | 책임 | 의존 방향 |
|---|---|---|
| `routes/` | URL ↔ 화면 매핑, loader 정의 | features·shared·content 사용 |
| `features/` | 도메인 로직 (학습 흐름·세션 머신) | shared·db·srs·content 사용 |
| `shared/` | 도메인 무관 재사용 코드 | 외부 라이브러리만 의존 |
| `db/` | Dexie 스키마·repository 패턴 (도메인 로직 X) | shared/types 사용 |
| `srs/` | SM-2 순수 함수 + 안전 래퍼. *외부 의존 0* | shared/types 사용 |
| `tts/` | Web Speech API 래퍼 | shared/types 사용 |
| `content/` | 정적 JSON loader·캐싱 | content/types만 export |
| `store/` | Zustand 전역 상태 (UI·세션 in-memory) | shared/types 사용 |
| `pwa/` | service worker 등록·업데이트 알림 | 외부만 |

원칙: **`srs/`·`shared/utils/`·`db/repository/`는 React 의존 0** — 단위 테스트 용이성·이식성 확보.

---

## 3. 라우트 설계

### 3.1 라우트 목록

> **변경 이력 (2026-05-10)**: 학습 모드 4종 확장에 따라 라우트 재구성. 기존 `/learn/:cefr/:mode`(여기서 :mode='word'|'sentence')는 `/learn/:cefr/:cardType/:studyMode`로 분할. 단어장 라우트 추가.

| 경로 | 컴포넌트 | loader | 비고 |
|---|---|:---:|---|
| `/` | `home.tsx` | ✓ | 레벨 카드 6개 + 각 레벨 due 카드 수 |
| `/level/:cefr` | `level.tsx` | ✓ | 콘텐츠 타입(word·sentence) 선택 |
| `/level/:cefr/:cardType` | `mode.tsx` | ✓ | 학습 모드 선택 (flashcard·recall·cloze·vocabulary). cardType=word일 때 cloze 비활성 |
| `/learn/:cefr/:cardType/:studyMode` | `learn.tsx` | ✓ | 학습 세션. studyMode∈{flashcard,recall,cloze}. 큐 초기화는 loader에서 |
| `/vocabulary/:cefr/:cardType` | `vocabulary.tsx` | ✓ | 단어장 리스트 + 학습 상태 + 검색 + 마킹 토글 |
| `/vocabulary/:cefr/:cardType/:cardId` | `vocabularyDetail.tsx` | ✓ | 단어 상세 모달 (예문·IPA·TTS·마킹) |
| `/summary` | `summary.tsx` | ✗ | 메모리 state 의존 — 직접 진입 시 홈으로 |
| `/stats` | `stats.tsx` | ✓ | P2 |
| `/settings` | `settings.tsx` | ✓ | 설정 폼 (Dexie 즉시 저장) |
| `*` | `not-found.tsx` | ✗ | 404 |

URL 파라미터 enum:
- `:cefr` ∈ `'A1'..'C2'`
- `:cardType` ∈ `'word' | 'sentence'`
- `:studyMode` ∈ `'flashcard' | 'recall' | 'cloze'` (단어장은 별도 라우트)

### 3.2 React Router v7 모드 선택

| 옵션 | 채택 여부 | 근거 |
|---|:---:|---|
| Declarative Mode (`<BrowserRouter>`) | ✗ | loader·useFetcher 사용 불가 → 콘텐츠 fetch·DB 조회 분리 어려움 |
| **Data Mode (`createBrowserRouter`)** | **✓** | loader/action·중첩 라우트·SPA에 최적. 서버 없이도 100% 동작 |
| Framework Mode (Remix-style) | ✗ | SSR·서버 build 필요. 정적 호스팅 + 백엔드 0 정책에 과함 |

**결정**: Data Mode (`createBrowserRouter`) + `RouterProvider`.

> 근거: RR v7 공식 문서에 따르면 loader는 Declarative Mode에서 미지원. 본 앱은 정적 JSON·IndexedDB라는 *비-서버 데이터*를 loader로 통일 관리하는 게 라우트마다 useEffect fetch보다 깔끔함.

### 3.3 데이터 로딩 전략

| 라우트 | loader 책임 | 컴포넌트 책임 |
|---|---|---|
| `/` | 6개 레벨의 due 카운트 + 콘텐츠 카운트 (Dexie + content) | 카드 그리드 렌더링 |
| `/level/:cefr` | 해당 레벨의 word/sentence 카운트 + due 카운트 | 타일 2개 렌더링 |
| `/learn/:cefr/:mode` | 콘텐츠 JSON 로드 + Dexie progress 조회 + queue 합성 | 카드 표시·자가체크 |
| `/settings` | 현재 설정값 + voices 목록 | 폼 |
| `/stats` | 누적 통계 집계 (P2) | 차트 |

**원칙:**
- *읽기 전용*은 loader, *상태 갱신*(자가체크 결과 저장 등)은 컴포넌트 내 useMutation 패턴 (단순 Dexie write 함수)
- loader는 *결정론적*이어야 — Date.now()는 loader 내부에서만 1회 호출
- useLiveQuery는 *세션 종료 후 통계*에만 한정 (학습 중에는 깜빡임 방지 위해 명시적 갱신)

### 3.4 상태 처리

| 상태 | 화면 | 처리 |
|---|---|---|
| **Loading** | 모든 라우트 | RR v7 `useNavigation().state === 'loading'` → skeleton |
| **Empty** | `/` | 콘텐츠 0개인 레벨은 카드 비활성 + "콘텐츠 준비 중" |
| **Empty** | `/learn` | due+new = 0이면 즉시 `/summary?empty=true` redirect |
| **Error** | 모든 라우트 | RR v7 `errorElement`로 글로벌 에러 바운더리 + 재시도 버튼 |
| **Offline** | 모든 라우트 | SW 캐시 히트로 동작. 콘텐츠 미캐시 시 안내 토스트 |
| **IndexedDB 차단** | 첫 진입 | 모달로 안내 → 사용자 선택: "설정 변경 후 재시도" 또는 "그래도 진행"(메모리 폴백·세션 종료 시 진도 손실 명시) |
| **단축키 (데스크톱 only)** | `/learn` | `Space`=뒤집기 / `←`=모르겠음 / `→`=알았음 / `P`=재생. `window.matchMedia('(pointer: fine)')` 일치 시에만 활성 + 안내 표시 |

> 401 인증 상태는 *해당 없음* — 백엔드/인증 없음.

---

## 4. Dexie 스키마 v1

### 4.1 DB 정의

| 항목 | 값 |
|---|---|
| DB 이름 | `gugbab-voca` |
| 버전 | 1 |
| 라이브러리 | `dexie@^4.4` + `dexie-react-hooks@^4.2` |

### 4.2 테이블

> **변경 이력 (2026-05-10)**: M1·M5·M6 결정에 따라 `cardProgress` PK가 `[cardId+studyMode]` 복합 키로 변경. `cardMark` 테이블 신설 (단어장 마킹 분리).

#### `cardProgress`

| 필드 | 타입 | 인덱스 | 설명 |
|---|---|---|---|
| `cardId` | string | **PK part** | `WordEntry.id` 또는 `SentenceEntry.id` (불변) |
| `studyMode` | `'flashcard' \| 'recall' \| 'cloze'` | **PK part** | 학습 모드. 같은 카드라도 모드별 SRS 분리 (M1) |
| `cardType` | `'word' \| 'sentence'` | ✓ | 콘텐츠 타입 구분 |
| `level` | `'A1'..'C2'` | ✓ | CEFR |
| `state` | `'new' \| 'learning' \| 'review' \| 'relearning'` | ✓ | SRS 상태 머신 |
| `dueAt` | number (epoch ms) | ✓ | 다음 노출 시각 |
| `lastReviewedAt` | number | | 마지막 학습 시각 |
| `repetitions` | number | | SM-2 n |
| `easeFactor` | number | | SM-2 EF (floor 1.3) |
| `intervalDays` | number | | 현재 간격 (일) |
| `lapses` | number | | "모르겠음"/오답 누적 |
| `lastRating` | `'again' \| 'good'` | | 마지막 채점 결과 |

**복합 인덱스:**
- `[studyMode+cardType+level+dueAt]` — 학습 시작 시 due 조회 (학습 모드별)
- `[studyMode+cardType+level+state]` — 신규 카드 카운트·필터
- `[cardId+studyMode]` — PK 자체 (Dexie는 `&[a+b]` 복합 PK 표기)

> 근거: indexeddb-dexie SKILL.md "복합 인덱스는 왼쪽 우선 정렬" — 학습 시작 시 `where('[studyMode+cardType+level+dueAt]').between(['flashcard','word','A1',0], ['flashcard','word','A1',now])`로 단일 인덱스 스캔.

#### `cardMark` (신규 — M5·M6)

단어장에서 사용자가 토글한 자기평가. `studyMode`에 무관하게 *카드 1개당 1개* 마킹.

| 필드 | 타입 | 인덱스 | 설명 |
|---|---|---|---|
| `cardId` | string | **PK** | `WordEntry.id` 또는 `SentenceEntry.id` |
| `cardType` | `'word' \| 'sentence'` | ✓ | 단어장 필터링 |
| `level` | `'A1'..'C2'` | ✓ | 단어장 필터링 |
| `mark` | `'known' \| 'unknown'` | ✓ | null이면 row 자체가 없음 (storage 절약) |
| `markedAt` | number | | 마킹 시각 |

**복합 인덱스:**
- `[cardType+level+mark]` — 단어장에서 mark별 카운트 표시

> 의도: `cardProgress`에 `userMark` 필드를 합치지 않고 분리한 이유는 (a) 학습 모드별 row가 여러 개라도 마킹은 1개여야 함, (b) 단어장에서 마킹은 *학습 X 카드*에도 가능 — `cardProgress` 미존재 카드도 마킹 가능해야 함.

#### `appSettings` (key-value)

| key | type | default | 설명 |
|---|---|---|---|
| `ttsVoiceURI` | string \| null | null | 선택된 voice URI |
| `ttsRate` | number | 1.0 | 0.5~1.5 clamp |
| `ttsAutoPlay` | boolean | true | 카드 표시 시 자동 재생 |
| `sessionSize` | number | 20 | 10/20/30/50 |
| `newCardRatio` | number | 0.3 | 0~1 |
| `autoFlipMs` | number | 0 | 0=수동 / 3000/5000/10000 |
| `lastUsedLevel` | `'A1'..'C2'` \| null | null | 홈 진입 시 우선 표시 |
| `srsAlgoVersion` | number | 1 | 향후 마이그레이션용 |

스키마: `appSettings: 'key'` (PK = key 문자열)

#### `sessionLog` (P1)

| 필드 | 타입 | 인덱스 | 설명 |
|---|---|---|---|
| `id` | number | `++id` PK | auto-increment |
| `startedAt` | number | ✓ | epoch ms |
| `endedAt` | number | | |
| `level` | string | ✓ | |
| `mode` | `'word'\|'sentence'` | ✓ | |
| `cardsSeen` | number | | |
| `goodCount` | number | | |
| `againCount` | number | | |

복합 인덱스: `[level+mode+startedAt]` — 통계 화면에서 매트릭스 집계.

### 4.3 스키마 코드 의도 (시그니처)

```typescript
// db/schema.ts — 시그니처만
this.version(1).stores({
  cardProgress: '&[cardId+studyMode], cardId, studyMode, cardType, level, state, dueAt, ' +
                '[studyMode+cardType+level+dueAt], [studyMode+cardType+level+state]',
  cardMark:     '&cardId, cardType, level, mark, [cardType+level+mark]',
  appSettings:  '&key',
  sessionLog:   '++id, startedAt, level, cardType, studyMode, [level+cardType+studyMode+startedAt]',
})
```

> Dexie 표기: `&` = unique·`++` = auto-increment·`[a+b]` = 복합 인덱스. PK는 첫 항목 (단일 또는 `&[a+b]`).

### 4.4 마이그레이션 정책

| 규칙 | 내용 |
|---|---|
| 버전 증가 시 모든 테이블 명시 | indexeddb-dexie SKILL.md 함정 회피 — 누락 시 *삭제*로 간주됨 |
| `.upgrade()` 필수 | 새 필드 default 부여 — undefined 방치 금지 |
| 스키마 v2+ 추가 시 | 인덱스 추가만이면 stores만 변경. 데이터 변환 시 .upgrade |
| `srsAlgoVersion` 활용 | FSRS 도입 시 v1 SM-2 데이터를 v2 FSRS 초기값으로 변환 |
| 카드 ID 사라짐 | progress 레코드는 *보존*. 다음 세션 구성 시 무시 (PRD 엣지케이스 준수) |

### 4.5 정적 콘텐츠 vs 진도 분리 원칙

| 데이터 | 위치 | 갱신 주체 | 갱신 빈도 |
|---|---|---|---|
| 콘텐츠 (단어·문장) | `public/data/*.json` | Claude로 생성 → git commit → Vercel 재배포 | 수개월 |
| 진도 (cardProgress) | IndexedDB | 사용자 학습 액션 | 실시간 |
| 설정 | IndexedDB (appSettings) | 사용자 | 산발적 |

**원칙: 콘텐츠는 read-only·외부 소스, 진도는 read-write·로컬.** 두 데이터의 join은 cardId 매칭으로 메모리에서 수행 (소규모이므로 충분).

---

## 5. SRS 인터페이스 정의

> **변경 이력 (2026-05-10)**: M1·M5·M6 결정 반영. `studyMode` 필드 추가, `userMark` 기반 초기값 결정 함수 추가.

### 5.1 타입 정의 (시그니처)

```typescript
// srs/types.ts
export type SrsState = 'new' | 'learning' | 'review' | 'relearning'
export type SrsRating = 'again' | 'good'  // 2-rating system
export type StudyMode = 'flashcard' | 'recall' | 'cloze'
export type UserMark = 'known' | 'unknown' | null

export interface SrsCard {
  cardId: string
  studyMode: StudyMode    // 같은 cardId라도 모드별 별도 row (M1)
  cardType: 'word' | 'sentence'
  level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'
  state: SrsState
  repetitions: number     // SM-2 n
  easeFactor: number      // SM-2 EF, floor 1.3
  intervalDays: number    // 현재 간격
  dueAt: number           // epoch ms
  lastReviewedAt: number  // epoch ms (0 = 미학습)
  lapses: number
  lastRating: SrsRating | null
}

export interface SrsInput {
  rating: SrsRating
  now: number  // epoch ms — 외부 주입(테스트 가능성)
}

export interface SrsResult {
  card: SrsCard            // 갱신된 카드
  nextDueAt: number        // 편의용 (= card.dueAt)
}

// srs/initialFromMark.ts — M6 결정 반영
export interface InitialSrsState {
  easeFactor: number
  intervalDays: number
}

export function initialFromMark(mark: UserMark): InitialSrsState
//   known   → { ef: 3.0, intervalDays: 6 }
//   unknown → { ef: 2.0, intervalDays: 1 }
//   null    → { ef: 2.5, intervalDays: 1 }  (SM-2 표준)
```

### 5.2 2버튼 매핑 결정

| 사용자 버튼 | 내부 SM-2 Q | 근거 |
|---|---|---|
| **알았음** (`good`) | **Q = 4** | srs SKILL.md "보수적 default" — Q=5는 EF가 너무 빨리 양극화됨 |
| **모르겠음** (`again`) | **Q = 1** | Q < 3 fail 트리거. Q=0은 EF 감소 폭이 과도(-0.8) |

> 근거: srs-spaced-repetition SKILL.md "2버튼 모드에서 SM-2 등급을 0/5로 극단 매핑하면 EF가 빠르게 양극화 — 학습 곡선 망가짐. 3 또는 4로 보수적 매핑 권장."

### 5.3 핵심 함수 시그니처

```typescript
// srs/sm2.ts — 순수 함수, React 의존 0
export function applySm2(card: SrsCard, q: 0|1|2|3|4|5, now: number): SrsCard

// srs/rating.ts
export function rating2to6(rating: SrsRating): 1 | 4
export function ratingToInput(buttonClicked: 'know'|'unknown'): SrsRating

// srs/safeReview.ts — 시계 변경 방어
export function safeReview(
  card: SrsCard,
  input: SrsInput
): SrsResult
// 내부 동작:
//   1. now < card.lastReviewedAt 이면 now := card.lastReviewedAt + 1000
//   2. rating2to6(input.rating) → q
//   3. applySm2(card, q, now) → updated
//   4. updated.dueAt < card.dueAt 이고 rating='good' 이면 단조 증가 위반 → assert 또는 floor
//   5. SrsResult 반환
```

### 5.4 단조 증가 보장

| 보장 | 구현 |
|---|---|
| EF floor 1.3 | `applySm2` 내 `if (ef < 1.3) ef = 1.3` |
| 시계 과거 변경 방어 | `safeReview`에서 now 보정 |
| 연속 'good' 시 dueAt 증가 | 단위 테스트로 검증: 10회 good → prevDue < currDue |

### 5.5 학습 큐 합성 알고리즘 (의사코드, M5 반영)

```text
// features/learning/composeQueue.ts
function composeQueue(
  progress: SrsCard[],          // 해당 cardType+level+studyMode의 모든 진도
  contentIds: string[],         // 해당 cardType+level의 모든 콘텐츠 id
  marks: Map<cardId, UserMark>, // 카드별 userMark
  settings: { sessionSize: N, newCardRatio: R },
  now: number
): string[]                     // 최종 cardId 배열 (length ≤ N)
{
  // 1. 진도 분류
  due  = progress.filter(p => p.state !== 'new' && p.dueAt <= now)
                 .sort(by dueAt asc)
  newPool = contentIds.filter(id =>
    !progress.find(p => p.cardId === id) ||
    progress.find(p => p.cardId === id)?.state === 'new'
  )

  // 2. 신규 풀 마킹별 분리 (M5)
  newUnknown  = newPool.filter(id => marks.get(id) === 'unknown')
  newUnmarked = newPool.filter(id => marks.get(id) == null)
  newKnown    = newPool.filter(id => marks.get(id) === 'known')

  // 3. 정원 계산
  dueCount   = min(due.length, floor(N * (1 - R)))
  newTarget  = N - dueCount

  // 4. 신규 풀 가중치 분배 (70/25/5)
  qUnknown   = round(newTarget * 0.70)
  qUnmarked  = round(newTarget * 0.25)
  qKnown     = newTarget - qUnknown - qUnmarked   // 잔여 흡수

  pickedNew = []
  pickedNew += take(shuffle(newUnknown),  qUnknown)
  pickedNew += take(shuffle(newUnmarked), qUnmarked)
  pickedNew += take(shuffle(newKnown),    qKnown)

  // 5. 부족분 보충 (channel-fallback): unknown 부족 → unmarked → known
  while (|pickedNew| < newTarget) {
    candidates = [...newUnmarked, ...newKnown, ...newUnknown]
                  .filter(c => not picked)
    if (empty) break
    pickedNew += shuffle(candidates).first()
  }

  // 6. due 셔플 (dueAt 동률 처리)
  pickedDue = due.slice(0, dueCount)

  // 7. 라운드로빈 인터리빙 (단조로움 회피)
  return interleave(pickedDue, pickedNew, ratio = dueCount : newTarget)
}
```

> 근거: PRD "셔플 vs SRS 우선순위 정책" 섹션 그대로 구현. due 카드가 N*(1-R)을 초과하면 신규 0개 가능 — *복습 우선*이 의도된 동작. 마킹 가중치 70/25/5는 M5 결정.

### 5.6 자가체크 처리 흐름

```text
사용자 "알았음" 탭
 → store.dispatch(answerCard(cardId, 'good'))
 → safeReview(currentCard, { rating: 'good', now: Date.now() })
 → progressRepo.upsert(updated)
 → store.advanceQueue()
 → 다음 카드 표시
```

**보장:**
- DB write 완료 전 다음 카드 표시 가능 (UX 우선) — write 실패 시 토스트 + 재시도
- 200ms 디바운스로 더블 클릭 방어 (PRD 엣지케이스)

### 5.7 입력 매칭 정책 (M3, 리콜·클로즈 공용)

```typescript
// srs/matching.ts — 순수 함수, React 의존 0
export function normalize(s: string): string {
  return s.trim()
          .toLowerCase()
          .replace(/[.,?!;:'"]/g, '')
}

export function isCorrect(input: string, expected: string): boolean {
  return normalize(input) === normalize(expected)
}

export function isAllCorrect(inputs: string[], expecteds: string[]): boolean {
  if (inputs.length !== expecteds.length) return false
  return inputs.every((v, i) => isCorrect(v, expecteds[i]))
}
```

**규칙:**
- 대소문자·공백·기본 구두점 (`.,?!;:'"`)만 무시
- 오타는 오답 (Levenshtein 미적용 — 학습 효과 우선)
- 클로즈 빈칸 N개는 *모두* 정답이어야 `good`. 하나라도 틀리면 전체 `again`

### 5.8 정답 보기 / 다시 시도 흐름 (리콜·클로즈)

```text
사용자 입력 → submit
 → isCorrect(input, expected)
   ├─ true  → answerCard('good') → 다음 카드
   └─ false → 입력창 아래 "다시 시도" + "정답 보기" 버튼 노출
              ├─ "다시 시도" 탭 → 입력 클리어, 같은 카드 유지 (count++)
              └─ "정답 보기" 탭 → 정답 노출 + answerCard('again') → "다음 카드"
   * count >= 3 자동으로 "정답 보기" 모드 강제 (좌절 방지)
```

`answerCard`는 플래시카드와 동일한 진입점 — 내부에서 `safeReview` 호출, 모드별 progress row 갱신.

### 5.9 단어장 마킹 (M5·M6)

```typescript
// db/repository/markRepo.ts (시그니처)
export async function getMark(cardId: string): Promise<UserMark>
export async function setMark(cardId: string, mark: 'known' | 'unknown'): Promise<void>
export async function clearMark(cardId: string): Promise<void>
export async function listMarksByLevel(cefr: CEFR, cardType: CardType): Promise<Map<string, UserMark>>

// 마킹 변경 시 영향:
// 1. 즉시 단어장 UI 갱신 (Dexie useLiveQuery)
// 2. 다음 학습 세션의 composeQueue가 새 마킹 반영
// 3. 진행 중 세션은 영향 X (큐 합성은 startSession 시점 1회)
// 4. 신규 학습 시 initialFromMark()로 초기 EF·interval 결정 (M6)
```

---

## 6. TTS 추상화

### 6.1 훅 시그니처

```typescript
// tts/useSpeak.ts
export interface UseSpeakOptions {
  lang?: string          // default 'en-US'
  rate?: number          // default settings.ttsRate (0.5~1.5 clamp)
  voiceURI?: string | null  // null이면 pickEnglishVoice
}

export interface UseSpeakReturn {
  speak: (text: string) => void
  stop: () => void
  speaking: boolean
  voices: SpeechSynthesisVoice[]
  supported: boolean
  ready: boolean         // voiceschanged fired 여부
}

export function useSpeak(opts?: UseSpeakOptions): UseSpeakReturn
```

### 6.2 voice 로딩 정책

| 단계 | 동작 |
|---|---|
| 마운트 시 | `getVoices()` 즉시 호출 → 빈 배열이면 voiceschanged 리스너 등록 |
| `voiceschanged` 발생 | 다시 `getVoices()` → state 갱신 → `ready = true` |
| 언마운트 시 | 리스너 제거 |
| 설정 화면 | `voices` 배열 + `ready` 플래그로 드롭다운 활성화 제어 |

> 근거: web-speech-api-tts SKILL.md "voiceschanged 이벤트 대기 패턴" — 즉시 빈 배열 반환 케이스 다수 보고됨.

### 6.3 iOS Safari 백그라운드 대응

| 상황 | 처리 |
|---|---|
| `visibilitychange`로 hidden 진입 | `speechSynthesis.cancel()` — 깔끔히 종료, 복귀 시 사용자 재상호작용 필요 |
| 긴 문장 (PRD에 거의 없음 — 최대 ~80자) | 분할 불필요. 단어·짧은 문장만 학습 |
| voice 0개 | 스피커 아이콘 비활성 + 툴팁 안내 (PRD 엣지케이스 준수) |
| 학습 중 카드 이동 | 새 utterance 전 `cancel()` 필수 |

### 6.4 자동 재생 정책 (확정)

| 설정 | 동작 |
|---|---|
| 세션 *첫 카드* | **수동 탭 후** 자동 재생 활성화 (iOS Safari user gesture 보존) |
| 이후 카드 (`ttsAutoPlay = true`) | 표시 후 200ms 지연 후 자동 speak |
| 카드 뒤집기 | 한국어는 자동 재생 X (영어 학습 목적이므로) |
| 사용자 스피커 탭 | 즉시 cancel + speak |

> 결정 근거: web-speech-api-tts SKILL.md iOS Safari 호환성 — 첫 utterance 차단 가능성 회피.

---

## 7. 상태 관리 매핑

### 7.1 3계층 분리

| 계층 | 도구 | 사용처 | 영속성 |
|---|---|---|---|
| **로컬 UI** | useState/useReducer | 카드 뒤집기·폼 입력·토글 | X |
| **전역 (in-memory)** | Zustand | 진행 중 세션·activeQueue·toastQueue·playingTts | X (새로고침 시 폐기) |
| **영속** | Dexie | cardProgress·appSettings·sessionLog | ✓ |

### 7.2 Zustand store 구성

```typescript
// store/useSessionStore.ts
interface SessionState {
  cefr: CEFR | null
  mode: 'word'|'sentence' | null
  queue: string[]              // cardId 배열
  cursor: number               // queue index
  flipped: boolean
  results: Array<{ cardId: string; rating: SrsRating }>
  startedAt: number | null
  // actions
  startSession(...)
  flip()
  answer(rating: SrsRating)
  endSession(): SessionSummary
  reset()
}

// store/useUiStore.ts
interface UiState {
  toasts: Array<{ id: string; message: string; type: 'info'|'error' }>
  pushToast(...)
  removeToast(...)
  speaking: boolean
  setSpeaking(v: boolean)
}
```

> 근거: Zustand는 외부 라이브러리지만 *대중 표준* + 작음(~3KB). 의존성 정책상 OK.

### 7.3 PRD 엣지케이스 매핑

| 케이스 | 저장 위치 |
|---|---|
| 세션 도중 새로고침 | 카드별 SRS 결과는 Dexie에 *즉시* 저장됨 → 유지. 진행 중 세션은 폐기 (Zustand 휘발) |
| 더블 클릭 방어 | 200ms 디바운스 — Zustand action 내부 |
| TTS 발화 중 다음 카드 | UiStore.speaking = true → cancel → 다음 카드 |

---

## 8. 콘텐츠 시드 정책

### 8.1 JSON 스키마 (PRD 준수)

```typescript
// content/types.ts — 시그니처
interface WordEntry {
  id: `w_${Lowercase<CEFR>}_${string}`  // 예: "w_a1_001"
  level: CEFR
  english: string
  korean: string
  partOfSpeech: PartOfSpeech
  ipa?: string
  examples?: Array<{ en: string; ko: string }>
  tags?: string[]
}

interface SentenceEntry {
  id: `s_${Lowercase<CEFR>}_${string}`
  level: CEFR
  english: string
  korean: string
  literal?: string
  context?: string
  tags?: string[]
}

interface ContentManifest {
  buildAt: string  // ISO 8601
  schemaVersion: 1
  counts: {
    words:     Record<CEFR, number>
    sentences: Record<CEFR, number>
  }
}
```

### 8.2 첫 출시 콘텐츠 (확정)

| 레벨 | 단어 | 문장 |
|---|---:|---:|
| **A1** | **80** | **40** |
| A2~C2 | "준비 중" 비활성 | "준비 중" 비활성 |

> 결정 근거: 콘텐츠 검수 가능성 + 사용자 본인 학습 효율. A2 이후는 A1 사용 데이터 누적 후 추가.

### 8.3 정적 호스팅 + PWA 캐싱

| 자원 | 캐시 전략 | 이유 |
|---|---|---|
| `public/data/manifest.json` | NetworkFirst (24h) | 빌드 메타. 갱신 감지용 |
| `public/data/words/*.json` | CacheFirst (StaleWhileRevalidate) | 변경 적음. 즉시 응답 우선 |
| `public/data/sentences/*.json` | 동일 | 동일 |
| 앱 셸 (HTML/JS/CSS) | precache | vite-plugin-pwa generateSW |
| 아이콘·manifest.webmanifest | precache | |

### 8.4 콘텐츠 갱신 감지 (P2)

| 단계 | 동작 |
|---|---|
| 앱 부팅 | `manifest.json` NetworkFirst fetch → `buildAt` 비교 |
| 신규 빌드 발견 | UiStore에 toast: "새 콘텐츠가 있습니다 — 새로고침" |
| 사용자 액션 | location.reload() → SW가 새 JSON 캐시 |
| ID 사라짐 | progress 보존, 세션 구성 시 무시 |
| ID 추가 | 자동으로 `state='new'` 풀에 합류 (cardProgress 미존재 = new) |

---

## 9. PWA 전략

### 9.1 vite-plugin-pwa 설정 방향

| 설정 | 값 | 근거 |
|---|---|---|
| 전략 | `generateSW` | Workbox 자동 생성 — 직접 SW 작성 불필요 |
| `registerType` | `prompt` | 새 SW 발견 시 사용자 명시 동의 후 적용 (학습 중 강제 새로고침 방지) |
| `injectRegister` | `'auto'` | virtual 모듈 import |
| `workbox.globPatterns` | `['**/*.{js,css,html,svg,png,woff2}']` | 앱 셸 precache |
| `workbox.runtimeCaching` | manifest.json: NetworkFirst 24h / 콘텐츠 JSON: CacheFirst 30d | 정적 콘텐츠 빠른 응답 |
| `manifest` | name·short_name·start_url=/·display=standalone·theme_color | PWA 설치 가능 요건 |

### 9.2 manifest.webmanifest 핵심 필드

| 필드 | 값 |
|---|---|
| `name` | "gugbab-voca" |
| `short_name` | "gugbab-voca" |
| `description` | "CEFR 영어 회화 단어·문장 학습" |
| `start_url` | `/` |
| `display` | `standalone` |
| `theme_color` | (@gugbab/tokens primary) |
| `background_color` | (@gugbab/tokens background) |
| `icons` | 192·512·maskable 각 1개 |

### 9.3 오프라인 가용 범위

| 기능 | 오프라인 동작 |
|---|---|
| 홈/모드 선택/학습/요약/설정 | ✓ (precache + 콘텐츠 캐시) |
| 진도 저장 | ✓ (IndexedDB) |
| TTS | ✓ (localService voice인 경우만) / ✗ (원격 voice인 경우) |
| 새 콘텐츠 갱신 | ✗ (네트워크 필요) |

### 9.4 업데이트 흐름 (확정 — `registerType: 'prompt'`)

```text
1. 사용자가 앱 사용 중 SW가 백그라운드에서 새 버전 다운로드
2. workbox-window의 'waiting' 이벤트 → UiStore에 toast 표시
3. 사용자가 "업데이트" 탭 → skipWaiting() 메시지 → SW 활성화
4. clientsClaim() → 페이지 reload
5. 새 버전 진입
```

> 결정 근거: 학습 중 강제 새로고침 회피. `autoUpdate`는 카드 진행 중 갑자기 reload 발생할 수 있어 학습 흐름 손상.

### 9.5 Persistent Storage 요청

```typescript
// pwa/persistence.ts (시그니처)
export async function requestPersistentStorage(): Promise<boolean>
//   첫 진입 후 사용자가 1회 학습 완료 시점에 호출
//   navigator.storage.persist() — 진도 데이터 자동 삭제 방지
```

> 근거: indexeddb-dexie SKILL.md "PWA 오프라인 영속화" — 사용자 학습 데이터가 브라우저 storage 정리로 사라지는 것을 막음.

---

## 10. UI 통합

### 10.1 `@gugbab/styled-mui` 연결

| 단계 | 내용 |
|---|---|
| 1. peer 설치 확인 | `react@^19`, `react-dom@^19` 만족 |
| 2. ThemeProvider 래핑 | `main.tsx`에서 RouterProvider 외부에 배치 |
| 3. 테마 객체 | `@gugbab/tokens`에서 import한 토큰을 styled-mui theme에 매핑 |
| 4. 컴포넌트 사용 | Button·Card·Dialog 등 직접 import |

### 10.2 `@gugbab/tokens` 적용 (확정 — CSS + JS 병행)

`@gugbab/tokens` 패키지는 두 형태를 모두 제공:
- **CSS 파일**: `@gugbab/tokens/mui.css`, `@gugbab/tokens/radix.css` (CSS 변수 정의)
- **JS 상수**: `index.mjs/cjs` + `index.d.ts` (TS 타입 동봉)

| 토큰 형태 | 사용처 | 방식 |
|---|---|---|
| CSS 변수 | `src/styles/global.css`에서 `@import '@gugbab/tokens/mui.css'` | 글로벌 스타일·다크모드 토글 호환 |
| JS 상수 | styled-mui theme 객체 매핑 | TS 타입 안전 + 컴포넌트 내부 사용 |

> 결정 근거: tokens 패키지가 둘 다 export하므로 한 형태로 제한할 이유 없음. CSS 변수는 다크모드 토글(P2)에 유리하고, JS 상수는 styled-mui 테마 매핑·타입 보강에 필수.

### 10.3 다크모드 정책 (P2)

| 단계 | 내용 |
|---|---|
| Phase 1 | 라이트 모드만. CSS 변수 구조는 다크 호환으로 미리 설계 |
| Phase 2+ | `prefers-color-scheme` + 사용자 토글. tokens.dark 토큰 정의 시 |

---

## 11. 의존성 후보 표

### 11.1 채택 (이견 없음)

| dep | 분류 | 결정 | 근거 |
|---|---|---|---|
| `react` `react-dom` | 코어 | 채택 | React 19 stable |
| `vite` | 빌드 | 채택 | 사용자 결정 |
| `typescript` | 언어 | 채택 | strict mode |
| `react-router` (v7) | 라우팅 | 채택 (Data Mode) | 사용자 결정 + loader 활용 |
| `dexie` `dexie-react-hooks` | DB | 채택 | 사용자 결정 |
| `zustand` | 전역 상태 | 채택 | typescript.md 룰 준수 |
| `vite-plugin-pwa` | PWA | 채택 | 사용자 결정 |
| `workbox-window` | PWA | 채택 (vite-plugin-pwa peer) | SW 업데이트 prompt 처리 |
| `@gugbab/styled-mui` `@gugbab/tokens` | UI | 채택 | 사용자 결정 |
| `@gugbab/hooks` `@gugbab/utils` | 유틸 | 필요 시 채택 | lodash 대체 |
| `vitest` `@testing-library/react` | 테스트 | 채택 | 단위 테스트 표준 (D5) |
| `clsx` | 스타일 유틸 | 채택 | className 조합 (~200B) |
| `eslint` `prettier` | 린트 | 채택 | typescript.md 룰 강제 |
| `@types/node` | 타입 | 채택 | Vite·테스트 환경 필수 |

### 11.2 회피

| dep | 회피 사유 |
|---|---|
| `lodash` `lodash-es` `ramda` | bloat. 필요한 함수만 self-build 또는 `@gugbab/utils` |
| `moment` `date-fns` `luxon` | 본 앱은 epoch ms 직접 다룸 — 포맷팅 1~2개만 필요. self-build |
| `axios` | fetch만으로 충분 (정적 JSON·동일 출처) |
| `tanstack/react-query` | 본 앱은 *서버 상태 없음* (모두 정적 또는 IndexedDB). loader + Dexie로 충분 |
| `ts-fsrs` | Phase 1은 SM-2 직접 구현 결정 |
| `redux` `redux-toolkit` | Zustand로 충분 |

### 11.3 추가 채택 / 보류 / 회피 (확정)

| dep | 분류 | 결정 | 근거 |
|---|---|---|---|
| `vitest` + `@testing-library/react` | 테스트 | **채택** | SRS·queue 합성 등 순수 함수 단위 테스트 가치 큼 |
| `playwright` | E2E | **보류** | 1인용·핵심 플로우 1~2개만 필요. Phase 3+에서 재검토 |
| `clsx` | 스타일 유틸 | **채택** | ~200B. className 조합 빈번. 본인 패키지에 동등 유틸 없음 |
| `eslint` `prettier` | 린트 | **채택** | 표준. typescript.md 코딩 룰 강제 |
| `@types/node` | 타입 | **채택** | Vite·테스트 등에 필요 |
| `dotenv` | env | **불요** | Vite 내장 `import.meta.env`로 충분 |
| `react-error-boundary` | 에러 | **보류** | RR v7 `errorElement`로 우선 처리. 부족하면 Phase 3에서 추가 |

### 11.4 self-build 함수 후보

| 함수 | 사용처 | self-build 비용 |
|---|---|---|
| `shuffle(arr)` | queue 합성 | Fisher-Yates 5줄 |
| `clamp(n, min, max)` | TTS rate · easeFactor | 1줄 |
| `debounce(fn, ms)` | 자가체크 더블 클릭 | 5줄 (또는 @gugbab/hooks 우선) |
| `interleave(a, b, ratio)` | queue 합성 | 10줄 |
| `formatRelative(ms)` | "다음 복습 X분 후" | 10줄 |

→ **모두 self-build 또는 @gugbab/utils·@gugbab/hooks 우선**.

---

## 12. 빌드·배포 설정 방향

### 12.1 Vite config 핵심 항목

| 항목 | 값 |
|---|---|
| `base` | `'/'` (Vercel 루트 배포) |
| `build.target` | `'es2020'` (모던 브라우저만) |
| `build.sourcemap` | `true` (개인 학습용·디버깅 우선) |
| `resolve.alias` | `'@/*': './src/*'` — TS paths와 동기화 |
| `define` | `import.meta.env.VITE_BUILD_AT` — manifest.json 검증용 |
| `plugins` | `react()`, `VitePWA({...})` |

### 12.2 TS 설정

| 옵션 | 값 |
|---|---|
| `strict` | `true` |
| `noUncheckedIndexedAccess` | `true` |
| `exactOptionalPropertyTypes` | `true` |
| `paths` | `'@/*': ['./src/*']` |
| `target` | `ES2020` |
| `moduleResolution` | `'Bundler'` |

### 12.3 Vercel 배포

| 설정 | 값 |
|---|---|
| Build Command | `pnpm build` |
| Output Directory | `dist` |
| Install Command | `pnpm install --frozen-lockfile` |
| Framework Preset | Vite |
| SPA Fallback | `vercel.json`에 `{ "rewrites": [{"source": "/(.*)", "destination": "/" }] }` |
| 정적 콘텐츠 캐시 | `public/data/*.json`은 SW가 캐시. manifest.json만 `Cache-Control: no-cache` 권장 |
| 환경 변수 | 없음 (백엔드 0) |

### 12.4 패키지 매니저

| 항목 | 값 |
|---|---|
| 매니저 | `pnpm` (lockfile 안정성·monorepo 호환) |
| Node | `>=20` (Vite 5+ 요건) |

---

## 13. 향후 단계 (Phase 2~7) 매핑

### 13.1 Phase 로드맵 초안

| Phase | 범위 | PRD 매핑 |
|---|---|---|
| **Phase 1 (현재)** | 아키텍처 결정 + 빈 프로젝트 부트스트랩 | 본 문서 |
| Phase 2 | DB·SRS·콘텐츠 로더 *순수 로직* 구현 + 단위 테스트 | AC-2, AC-3 핵심 |
| Phase 3 | UI 컴포넌트 + 라우트 + 학습 흐름 통합 | AC-1, AC-3, AC-5 |
| Phase 4 | TTS 통합 + 설정 화면 | AC-4, AC-6 |
| Phase 5 | PWA 패키징 + 오프라인 검증 | AC-7 |
| Phase 6 | 통계 화면(P2) + 다크모드(P2) + streak | PRD 미결사항 4 |
| Phase 7 | FSRS-5 마이그레이션 검토 (사용자 데이터 100+ review 누적 후) | PRD 미결사항 1 |

### 13.2 PRD 미결사항 7개 매핑 (모두 결정 완료)

| # | 미결 | Phase | 결정 |
|---|---|---|---|
| 1 | SRS 알고리즘 | 1→7 | **SM-2 직접 구현** (Phase 1) → Phase 7에서 FSRS 교체 검토 (review 데이터 100+ 누적 후) |
| 2 | 콘텐츠 데이터셋 | 2 | **Claude로 CEFR 가이드 기반 직접 생성** (Phase 0 결정 재확인) |
| 3 | 진도 백업 (JSON 내보내기) | 4 | **P2 유지** — Phase 4에서 설정 화면에 export/import 추가 |
| 4 | streak 정의 | 6 | **로컬 자정 리셋 + 1장 이상 학습 시 유지** (Anki 표준) |
| 5 | 자동 뒤집기 + 자가체크 | 4 | **자동 뒤집기는 표시만 자동·자가체크는 수동 유지**. 입력 없으면 다음 카드 진행 X |
| 6 | PWA 업데이트 알림 | 5 | **`registerType: 'prompt'` 방식** |
| 7 | 다크 모드 | 6 | tokens 다크 정의 활용. CSS 변수 구조는 Phase 1부터 다크 호환 설계 |

---

## 14. 결정 완료 항목 (Resolved Questions)

본 설계 진행 중 도출된 결정 사항 10개. 모두 Phase 1 시점에서 확정. 향후 변경 시 본 섹션 갱신.

### D1. TTS 자동 재생 첫 카드 정책
- **상황**: iOS Safari는 user gesture 없이 첫 utterance 재생 차단 가능
- **결정**: 세션 *첫 카드는 수동 탭 후* 자동 재생 활성화. 이후 카드는 `ttsAutoPlay` 설정 따라
- **반영 위치**: 섹션 6.4

### D2. 첫 출시 콘텐츠 범위
- **결정**: **A1만 출시** (단어 80 + 문장 40). A2~C2는 "준비 중" 상태로 비활성
- **이유**: 콘텐츠 검수 가능성 + 사용자 본인 학습 효율
- **반영 위치**: 섹션 8.2

### D3. `@gugbab/tokens` 적용 방식
- **결정**: **CSS 변수 + JS 상수 둘 다 사용**
- **구현**: `src/styles/global.css`에서 `@import '@gugbab/tokens/mui.css'` + JS 상수는 styled-mui theme 매핑
- **이유**: tokens 패키지가 둘 다 export. CSS 변수는 다크모드 토글에 유리, JS 상수는 타입 안전
- **반영 위치**: 섹션 10.2

### D4. PWA 업데이트 알림 방식
- **결정**: `vite-plugin-pwa registerType: 'prompt'`
- **이유**: 학습 중 강제 새로고침 회피 (autoUpdate은 카드 진행 중 reload 발생 가능)
- **반영 위치**: 섹션 9.4

### D5. 테스트 도구 채택
- **결정**: **vitest + @testing-library/react 채택**. Playwright는 Phase 3+에서 재검토
- **이유**: SRS·queue 합성 같은 순수 함수 단위 테스트 가치 큼. E2E는 1인용에 과함
- **반영 위치**: 섹션 11.3

### D6. 콘텐츠 데이터셋 시드
- **결정**: **Claude로 CEFR 가이드 기반 직접 생성** (Phase 0 결정 재확인)
- **참고**: NGSL/Oxford 3000/English Profile은 참고 자료로만
- **반영 위치**: 섹션 13.2 #2

### D7. streak 정의
- **결정**: **로컬 자정 리셋 + 1장 이상 학습 시 유지** (Anki 표준)
- **반영 위치**: 섹션 13.2 #4

### D8. 자동 뒤집기 시 자가체크
- **결정**: 자동 뒤집기는 *카드 표시만* 자동. **자가체크는 수동 유지**. 사용자 입력 없으면 다음 카드 진행 X
- **이유**: 자동 again은 학습자 실제 인지와 괴리
- **반영 위치**: 섹션 13.2 #5

### D9. IndexedDB 차단 시 폴백
- **결정**: 모달로 차단 안내 → 사용자 선택:
  - "설정 변경 후 재시도" (브라우저 권한 안내 링크)
  - "그래도 진행" → 메모리 폴백 (세션 종료 시 진도 손실 안내)
- **반영 위치**: 섹션 3.4

### D10. 키보드 단축키 활성화 범위
- **PRD 명시**: Space=뒤집기, ←=모르겠음, →=알았음, P=재생
- **결정**: **데스크톱 only** (`window.matchMedia('(pointer: fine)')` 감지). 모바일은 터치 UX 우선, 단축키 안내도 표시 X
- **반영 위치**: 섹션 3.4 (UI 처리 시)

---

## 부록 A. 결정 요약 (한눈에)

| 영역 | 결정 |
|---|---|
| 라우팅 | RR v7 Data Mode (`createBrowserRouter` + `RouterProvider`) |
| 데이터 로딩 | loader 우선 — 콘텐츠 fetch + Dexie 조회 통합 |
| 상태 | useState/Zustand/Dexie 3계층 |
| SRS | SM-2 직접 구현, 2버튼 매핑 (good=Q4, again=Q1), safeReview 시계 방어 |
| DB | Dexie 4.x v1, 복합 인덱스 `[cardType+level+dueAt]` |
| TTS | 네이티브 Web Speech API + voiceschanged 비동기 로딩 |
| PWA | vite-plugin-pwa generateSW, registerType=prompt |
| UI | @gugbab/styled-mui + @gugbab/tokens |
| 배포 | Vercel 정적 + SPA fallback |
| 의존성 | bloat 회피, self-build 우선, 애매하면 ❓로 표기 |

---

## 출처

- [React Router — Picking a Mode](https://reactrouter.com/start/modes)
- [vite-plugin-pwa — generateSW Workbox](https://vite-pwa-org.netlify.app/workbox/generate-sw)
- [vite-plugin-pwa — Service Worker Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache)
- [Dexie 공식 문서](https://dexie.org/)
- [SuperMemo SM-2](https://super-memory.com/english/ol/sm2.htm)
- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
