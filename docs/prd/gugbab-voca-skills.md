# gugbab-voca — 신규 생성 스킬 명세

`gugbab-voca` PRD(`docs/prd/gugbab-voca.md`) 구현에 필요한 신규 스킬 3종 명세.
다른 환경(예: `01_gugbab-claude-package`)에서 본 명세 기반으로 스킬을 생성한 뒤 본 프로젝트로 복사한다.

- **작성일**: 2026-05-07
- **대상 프로젝트**: gugbab-voca (영어 회화 단어·문장 학습 웹/PWA)
- **생성 워크플로우**: 본 프로젝트의 `.claude/rules/creation-workflow.md` 5단계(조사 → 교차검증 → 작성 → verification.md → skill-tester) 준수
- **저장 위치**: 생성 후 `02_gugbab-claude-voca/.claude/skills/frontend/{스킬명}/SKILL.md`로 배치

---

## 개요 — 왜 이 3종인가

PRD가 정의한 핵심 기술 영역을 정리하면 3개로 모인다.

| PRD 요소 | 필요한 스킬 |
|---|---|
| 화면 1·3·6의 TTS 듣기, 자동재생, 미지원 폴백 | **web-speech-api-tts** |
| 자가체크 → 다음 due 시점 계산, state 전이, 단조 증가 보장 | **srs-spaced-repetition** |
| `cardProgress`·`sessionLog`·`appSettings` 영속화, 복합 인덱스, 마이그레이션 | **indexeddb-dexie** |

기존 보유 스킬(`vite-pwa-service-worker`, `react-core`, `nextjs`, `state-management`, `typescript-v5` 등)은 그대로 활용한다.

---

## 스킬 1 — `frontend/web-speech-api-tts`

### 목적

플래시카드 학습 화면에서 영어 텍스트를 브라우저 내장 음성으로 재생한다. PRD AC-4(TTS 듣기), 화면 3(스피커 버튼), 화면 6(설정 화면 voice 선택), 엣지 케이스 4종(미지원/voice 0개/모바일 백그라운드/연속 발화 cancel)을 모두 커버한다.

### 다뤄야 할 핵심 항목

1. **기본 사용**: `window.speechSynthesis` + `SpeechSynthesisUtterance` 라이프사이클
2. **voice 비동기 로딩**: `getVoices()`가 즉시 빈 배열 반환되는 케이스 → `voiceschanged` 이벤트로 대응
3. **영어 voice 필터링**: `lang.startsWith('en-')`, 기본값 결정 로직 (en-US 우선, 없으면 첫 영어 voice)
4. **재생 제어**: `rate`(0.5~2)·`pitch`(0~2)·`volume`(0~1) 파라미터, `pause()`/`resume()`/`cancel()`
5. **큐 관리**: `speak()` 큐 동작 이해, 새 발화 전 `cancel()` 호출 패턴
6. **이벤트**: `onstart`, `onend`, `onerror`, `onboundary`
7. **호환성·폴백**:
   - 미지원 브라우저 감지 (`'speechSynthesis' in window`)
   - voice 0개 환경 처리
   - iOS Safari 모바일 백그라운드 자동중단 이슈와 우회법
   - Android 일부 기기에서 voice 로딩 지연
8. **React 통합 패턴**: 커스텀 훅(`useTTS`) 형태로 캡슐화, voice 목록·재생 상태·에러 노출
9. **접근성**: TTS 미지원 환경에서 스피커 아이콘 비활성 + aria-label 안내

### 권장 소스 (creation-workflow 1단계 — 조사)

| 우선순위 | 소스 | URL |
|---|---|---|
| 1 | MDN — Web Speech API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |
| 1 | MDN — SpeechSynthesis | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis |
| 1 | MDN — SpeechSynthesisUtterance | https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance |
| 2 | W3C Web Speech API Draft | https://wicg.github.io/speech-api/ |
| 3 | Can I use — `mdn-api__SpeechSynthesis` | https://caniuse.com/speech-synthesis |

### 교차 검증 클레임 (creation-workflow 2단계)

다음 클레임은 반드시 2개 이상 독립 소스로 검증.

- `getVoices()`는 일부 브라우저에서 비동기 로딩되어 첫 호출 시 빈 배열을 반환할 수 있다
- iOS Safari 16+에서 백그라운드 진입 시 `speechSynthesis`가 일시중지된다
- `cancel()`은 큐에 남은 utterance도 모두 비운다
- `rate`·`pitch` 유효 범위 (브라우저별 클램핑 동작)
- Chrome 데스크톱은 네트워크 voice가 포함될 수 있어 오프라인에서 실패 가능

### 실사용 필수 여부

`verification-policy.md` 기준 **content test로 충분**. (라이브러리 사용법 스킬 — 빌드 산출물·실행 결과 검증 불필요)

---

## 스킬 2 — `frontend/srs-spaced-repetition`

### 목적

플래시카드 자가체크 입력("알았음"/"모르겠음")을 받아 다음 노출 시점(`dueAt`)·간격·상태를 계산한다. PRD "SRS 입력 처리 규칙" 섹션과 "셔플 vs SRS 우선순위 정책"을 구현 가능하게 만든다.

### 다뤄야 할 핵심 항목

1. **알고리즘 두 가지 비교 정리**
   - **SM-2** (SuperMemo 2, Anki 베이스): easiness factor·interval·repetitions 3변수
   - **FSRS** (Free Spaced Repetition Scheduler, Anki 23.10+ 기본): Stability·Difficulty·Retrievability 3변수
   - 각 알고리즘의 정확도/구현 복잡도/필요 데이터량 트레이드오프
2. **카드 상태 전이**: `new` → `learning` → `review` ↔ `relearning` (PRD 다이어그램과 일치)
3. **2버튼(again/good) → 4버튼(again/hard/good/easy) 매핑**: PRD가 2버튼만 노출하므로 hard·easy는 미사용. 매핑 규칙 명시
4. **단조 증가 보장**: 연속 "good" 시 `dueAt` 간격이 줄어들지 않도록 보장하는 검산 로직
5. **시계 변경 방어**: epoch ms 절대시각 사용, 미래 시점 입력에 대한 클램핑
6. **즉시 재출현**: "again" 직후 같은 세션 내 또는 짧은 시간 내 재등장 처리(learning 단계의 step 시퀀스)
7. **세션 카드 합성 알고리즘**: PRD "셔플 vs SRS 우선순위 정책"의 인터리빙 로직 (due 카드 + 신규 카드 비율 R, 라운드로빈)
8. **TypeScript 타입 시그니처 예시** (입력: 현재 카드 상태 + rating, 출력: 갱신된 카드 상태 + nextDueAt)
9. **추천 라이브러리**:
   - SM-2: 30~50줄 직접 구현 권장
   - FSRS: `ts-fsrs` (npm) 사용 권장, 파라미터 기본값과 학습 곡선 적응 옵션

### 권장 소스

| 우선순위 | 소스 | URL |
|---|---|---|
| 1 | SuperMemo SM-2 공식 설명 | https://supermemo.guru/wiki/SuperMemo_2 |
| 1 | Anki Manual — Studying & SRS | https://docs.ankiweb.net/studying.html |
| 1 | open-spaced-repetition/fsrs4anki (FSRS 공식) | https://github.com/open-spaced-repetition/fsrs4anki |
| 1 | open-spaced-repetition/ts-fsrs (TypeScript 구현체) | https://github.com/open-spaced-repetition/ts-fsrs |
| 2 | FSRS 논문/위키 | https://github.com/open-spaced-repetition/fsrs4anki/wiki |

### 교차 검증 클레임

- FSRS-5가 2024 기준 최신 (FSRS 6 진행 여부 재확인 필요)
- SM-2의 EF 초기값 2.5, 최소 1.3
- ts-fsrs 최신 메이저 버전 (npm)
- Anki 기본 알고리즘이 23.10+에서 FSRS로 전환됨
- 2버튼 모드 사용 시 권장되는 rating 매핑 (again=1, good=3 등)

### 실사용 필수 여부

`verification-policy.md` 기준 **content test로 충분**. (알고리즘 정리 스킬 — 빌드 산출물 없음)
단, FSRS의 경우 ts-fsrs 라이브러리 버전 일관성을 한 번은 확인할 것.

---

## 스킬 3 — `frontend/indexeddb-dexie`

### 목적

PRD 데이터 요구사항 B (IndexedDB 진도 스키마)를 구현한다. `cardProgress`·`sessionLog`·`appSettings` 3테이블, 복합 인덱스(`[cardType+level+dueAt]`), 마이그레이션, React 통합을 모두 커버한다.

### 다뤄야 할 핵심 항목

1. **Dexie 4.x 기본**: `class extends Dexie`, `version().stores()` 스키마 선언 문법
2. **인덱스 표기법**:
   - `++id` (auto-increment PK)
   - `&id` (unique)
   - 단일 인덱스 vs 복합 인덱스 `[a+b+c]`
   - 멀티엔트리 `*tags` (배열 인덱스)
3. **마이그레이션**: 버전 증가 시 `upgrade(tx)` 콜백, 기존 레코드 변환
4. **트랜잭션**: `db.transaction('rw', tables, async () => {...})`, 자동 롤백
5. **쿼리 패턴** (PRD에 직접 매칭):
   - `where('dueAt').belowOrEqual(now)` — 오늘 due 카드 조회
   - `where('[cardType+level+dueAt]').between(...)` — 복합 키 범위 조회
   - `orderBy('dueAt').limit(N)` — N개 limit
   - `where('state').equals('new')` — 신규 카드 풀
6. **React 통합**: `dexie-react-hooks`의 `useLiveQuery`로 진도 변경 자동 반영
7. **장애 대응**:
   - IndexedDB 차단 환경(시크릿 모드, Storage 권한 거부) 감지
   - DB 열기 실패 시 폴백 (메모리 또는 localStorage)
   - 쿼터 초과(`QuotaExceededError`) 처리
8. **PWA 환경 영속화**: Service Worker가 활성일 때도 IndexedDB 정상 동작 확인
9. **테이블 스키마 예시**: PRD 정의 그대로 매핑한 Dexie 코드 샘플 (cardProgress·sessionLog·appSettings)
10. **백업/복원** (P2): 전체 DB → JSON export, JSON → DB import

### 권장 소스

| 우선순위 | 소스 | URL |
|---|---|---|
| 1 | dexie.org 공식 문서 | https://dexie.org/docs/ |
| 1 | Dexie GitHub | https://github.com/dexie/Dexie.js |
| 1 | dexie-react-hooks | https://dexie.org/docs/dexie-react-hooks/useLiveQuery() |
| 2 | MDN — Using IndexedDB | https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB |

### 교차 검증 클레임

- Dexie 4.x 안정 버전 번호 (npm `dexie` latest 확인)
- `[a+b+c]` 복합 인덱스 표기법이 4.x에서 동일하게 동작
- `useLiveQuery`가 트랜잭션 종료 후 자동 재실행
- IndexedDB 쿼터: 일반적으로 origin당 가용 디스크의 일정 비율 (브라우저별 정책 다름)
- Service Worker와 동시 접근 시 트랜잭션 충돌 동작

### 실사용 필수 여부

`verification-policy.md` 기준 **content test로 충분**. (라이브러리 사용법 스킬)
단, 본 프로젝트에서 실제 IndexedDB로 구현하므로 사용 후 NEEDS_REVISION 사항이 나오면 보강한다.

---

## 생성 후 본 프로젝트로 가져오는 절차

각 스킬을 다른 환경에서 만든 뒤 다음 위치에 복사:

```
02_gugbab-claude-voca/
├── .claude/skills/frontend/
│   ├── web-speech-api-tts/SKILL.md
│   ├── srs-spaced-repetition/SKILL.md
│   └── indexeddb-dexie/SKILL.md
└── docs/skills/frontend/
    ├── web-speech-api-tts/verification.md
    ├── srs-spaced-repetition/verification.md
    └── indexeddb-dexie/verification.md
```

복사 후 본 프로젝트에서 추가로 해야 할 일:

1. `README.md` 스킬 목록 업데이트 (`.claude/rules/readme-update.md` 참조)
2. `skill-tester` 에이전트로 2단계 실사용 테스트 수행 (`pending-test-guard` 훅 통과)
3. `verification.md` 섹션 5에 오늘 날짜 "수행일" 기록

---

## 체크리스트 (생성 측에 전달용)

- [ ] **web-speech-api-tts**: 위 9개 핵심 항목, 5개 권장 소스, 5개 교차 검증 클레임 모두 반영
- [ ] **srs-spaced-repetition**: SM-2와 FSRS 둘 다 정리, 2버튼 매핑 규칙, ts-fsrs 라이브러리 버전 검증
- [ ] **indexeddb-dexie**: Dexie 4.x 기준, PRD 3테이블 스키마 그대로 예시, 복합 인덱스 동작 확인
- [ ] 각 스킬 SKILL.md 상단에 `> 소스:` `> 검증일:` 표기
- [ ] 각 스킬 verification.md에 사용 소스·교차검증 결과·status(`PENDING_TEST`로 시작) 기록
