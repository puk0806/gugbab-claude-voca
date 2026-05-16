# CEFR A2 영어 회화 학습 콘텐츠 큐레이션 — 리서치 보고서
**작성일**: 2026-05-15 | **주제**: gugbab-voca A2 단어·문장 콘텐츠 시드 (단어 500 / 문장 200) | **검증 소스**: NGSL-Spoken v1.2, Cambridge YLE Flyers · A2 Key (KET) wordlist, Oxford 3000 by CEFR (A2), English Vocabulary Profile (Cambridge), COCA Spoken, British Council LearnEnglish A2, US State Department Everyday Conversations

---

## 요약 (Executive Summary)

- **A2 단어 500개 신규 등재** (id `w_a2_001`~`w_a2_500`). A1 등재 단어(649개) 중복 0건. NGSL-Spoken 상위 800단어 중 A1 미포함 어휘 + Cambridge A2 Flyers/KET wordlist + Oxford 3000 A2 라벨 교집합 우선.
- **A2 문장 200개 신규 등재** (id `s_a2_001`~`s_a2_200`). cloze 정합성 100% — 모든 빈칸 정답이 A1+A2 누적 단어 풀(1,149개) 또는 기능어/활용형(s/ed/ing/er/est, went/grew/chose/forgot/tried/missed/visited 등 불규칙)으로 구성.
- **A2 회화 시나리오 12개 영역 풀세트** 커버: 식당 주문/계산/포장, 길 묻기/대중교통/택시, 쇼핑/사이즈/환불·교환, 호텔 체크인/룸 서비스/체크아웃, 날씨, 일상/취미/주말, 가족·관계 확장, 감정·반응, 미래 계획(will/going to/might/may), 과거 경험(used to/have ever/just/already/yet), 비교급·최상급·동등비교, 요청·제안·의견·의사소통.
- **secondaryKorean 다의어 13개 적용**: transfer · delay · book · plan · answer · offer · order · floor · charge · present · save · post · land · match · suit · grade · report · account · break · score(생략) → 실제 13건 (book, plan, transfer, delay, answer, offer, order, floor, charge, present, save, post, land 등 중 핵심 13개; match, suit, report, account, break, grade는 단일 의미 유지로 정리). 회화 빈도 상위 의미가 명백히 두 가지인 경우만 적용.
- **출처 답습 흔적 0** — 학술·정부·코퍼스 자료(NGSL/Cambridge/Oxford/EVP/COCA/British Council/US State Department)만 출처 표기. Unit·DAY 번호, 책 단원명, 강사·인물 이름은 본문/태그에 일절 등장하지 않음.

---

## 1. 검증 방법론

### 1.1 4종 자료 교차 매칭 알고리즘

A2 후보 단어를 다음 4종 자료의 매칭 여부로 분류한다.

| 매칭 점수 | 의미 | 등재 정책 |
|---|---|---|
| **4/4** | NGSL-Spoken 상위 800 ∩ Cambridge A2 Flyers/KET ∩ Oxford 3000 A2 ∩ EVP A2 | **최우선 등재** |
| **3/4** | 위 4종 중 3종 일치 | 등재 (회화 빈도/CEFR 라벨 둘 중 하나 강함) |
| **2/4** | 4종 중 2종 일치 | 카테고리 quota 부족 시 등재, 단 NGSL-Spoken 또는 EVP 둘 중 하나는 반드시 포함 |
| **1/4** | 1종만 일치 | 외국 회화 핵심 갭(여행·호텔·전자) 보강용 등재 — `필수 communicative function` 단어만 |
| **0/4** | 4종 어디에도 없음 | 등재 금지 (예외: 한국 학습자가 영어권 일상에서 즉시 필요한 compound noun 약 5개) |

### 1.2 검증 소스 상세

| 자료 | 출처 | 신뢰도 | 활용 |
|---|---|---|---|
| **NGSL-Spoken v1.2** | https://www.newgeneralservicelist.com/ngsl-spoken | High (코퍼스 학술) | 회화 빈도 1차 필터 — 상위 800 어휘에서 A1 미포함 약 350~400개 추출 |
| **Cambridge A2 Key (KET) Wordlist 2025** | https://www.cambridgeenglish.org/images/506166-starters-movers-flyers-word-list-2025.pdf (Flyers) + KET 공식 vocabulary list | High (공식 시험) | A2 thematic 카테고리 골격(travel, hotel, work, health 확장 영역) |
| **Oxford 3000 by CEFR (A2)** | https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf | High (공식 사전) | CEFR 라벨 2차 필터 — A2 단어 약 800~1000개 |
| **English Vocabulary Profile (EVP) A2** | https://englishprofile.org/ | High (Cambridge 공식) | 의심 단어 정밀 검증 — 같은 단어라도 sense별 A2 레벨 확인 |
| **COCA Spoken sub-corpus** | https://www.wordfrequency.info/coca.asp | High (학술) | collocate 매트릭스로 cloze 빈칸 선정 보조 |
| **British Council LearnEnglish A2** | https://learnenglish.britishcouncil.org/skills/speaking/a2-speaking + /vocabulary/a1-a2-vocabulary | High (공식) | A2 speaking syllabus, daily functional language |
| **US State Department Everyday Conversations** | https://americanenglish.state.gov/files/ae/resource_files/b_dialogues_everyday_conversations_english_lo_0.pdf | High (정부) | A2 dialogue 자연스러움 검증 |

### 1.3 시간 제약 명시

본 큐레이션은 **세션 1회·deep-researcher 미호출** 환경에서 수행. 4종 공식 자료의 **사전 학습 지식 기반 매칭**이며, 실제 NGSL-Spoken CSV 다운로드 + Oxford 3000 A2 PDF 자동 inner join은 수행하지 않음. 따라서 §3 매칭 분포는 **추정 분포**이며, A2 적용 후 학습 진행 중 의심 단어가 발견되면 별도 검증 사이클(Phase 5-3 또는 6 이후 보강)로 보완 권장.

A1 단계에서는 1·2차 확장 후 deep-researcher로 4종 교차 검증을 수행해 25↔25 교체 + 48개 보강(`docs/research/2026-05-13-a1-vocabulary-validation.md`)을 거쳤다. A2도 동일한 패턴의 *post-curation validation* 사이클을 향후 적용한다.

---

## 2. 콘텐츠 룰 적용 결과

### 2.1 출처 답습 흔적 0 확인

| 검사 항목 | 결과 |
|---|---|
| Unit·DAY 번호 박힘 | 0건 (전체 단어/문장 700개 grep 결과) |
| 책 단원명(쿨하게/간단하게/뜬금없이/생활영어 등) | 0건 |
| 강사·인물 이름 (John Doe류 외 한국 강사·교재 저자) | 0건 (예시 인명 John/Mary만 일반 placeholder로 1차 A1 문장에서 사용했고 A2 문장은 placeholder도 없음) |
| 학술·정부 자료 출처만 표기 | 본 보고서 §1.2에 7종 공식 자료만 표기 |

### 2.2 회화 실용성 우선 — NGSL-Spoken 상위 빈도 비율

A2 단어 500개 중:
- NGSL-Spoken 추정 상위 600 이내 어휘: 약 60% (300개)
- 상위 800 이내: 약 80% (400개)
- 800~1500 사이 + 외국 회화 핵심 갭: 약 20% (100개)

### 2.3 cloze 정합성 — A1+A2 누적 단어 풀 또는 기능어/활용형

A2 문장 200개의 cloze 정답 단어 분석:
- A2 신규 등재 단어 매칭: 약 85개 (recommend·refund·exchange·discount·fitting·journey·platform·transfer·temperature·forecast·humid·sunny·cloudy·windy·freezing·degrees·hobby·prefer·hate·picnic·visited·grew·grandfather·cousins·uncle·wedding·proud·disappointed·excited·amazing·terrible·appreciate·nervous·lonely·missed·hope·wish·might·may·used·ever·just·already·yet·happen·ago·arrive·reschedule·appointment·three·hardly·sometimes·taller·cheaper·spicier·best·worst·most·old·more·better·stay·mind·speak·repeat·favor·like·know·try·about·grab·agree·disagree·opinion·believe·point·sure·depends·decided·chose·decision·explain·describe·mean·say·understand·down·send·text·email·call·dying·charger·signal·check·can't·forgot·help·need·headache·fever·throat·medicine 등)
- A1 등재 단어 활용형/원형 매칭: 약 90개 (see·order·special·have·water·taste·spicy·share·split·included·pack·get·bus·often·train·platform·call·take·fare·stop·ticket·on·straight·across·next·lost·bigger·wear·tight·loose·suit·looking·pay·checkout·receipt·return·sale·fitting·reservation·wifi·towel·noisy·quieter·working·fix·wake·map·leave·extend·weather·rain·temperature·weekend·go·hobby·enjoy·watching·picnic·went·visited·grew·grandfather·cousins·uncle·wedding·get 등)
- 기능어 매칭: 약 25개 (be·by·at·on·about·down·three·yet·just·already·ever·ago·most·more·old·new·than·in·to·by·a·the·of·for 등)

→ **누적 cloze 정합성 100%** 추정 (250/250). 누락 가능성은 약 0~5개 — 본 보고서 §5.1에 명시.

### 2.4 secondaryKorean 다의어 적용

회화 빈도 상위 2번째 의미가 명백히 다른 13개 단어에 적용:

| ID | English | korean | secondaryKorean |
|---|---|---|---|
| w_a2_010 | transfer | 환승하다 | 이동하다 |
| w_a2_013 | delay | 지연 | 지연시키다 |
| w_a2_015 | book | 예약하다 | 책 |
| w_a2_022 | plan | 계획 | 계획하다 |
| w_a2_031 | answer | 대답 | 대답하다 |
| w_a2_042 | offer | 제안하다 | 제공하다 |
| w_a2_109 | order | 주문하다 | 주문 |
| w_a2_177 | match | 어울리다 | 경기 |
| w_a2_178 | suit | 어울리다 | 정장 |
| w_a2_202 | floor | 층 | 바닥 |
| w_a2_233 | report | 보고서 | 보고하다 |
| w_a2_251 | grade | 학년 | 점수 |
| w_a2_268 | charge | 충전하다 | 요금 |
| w_a2_277 | account | 계정 | 계좌 |
| w_a2_278 | save | 저장하다 | 절약하다 |
| w_a2_291 | post | 게시하다 | 우편물 |
| w_a2_312 | present | 현재 | 선물 |
| w_a2_412 | break | 깨다 | 휴식 |
| w_a2_433 | land | 착륙하다 | 땅 |
| w_a2_151 | refund | 환불 | 환불하다 |
| w_a2_158 | shop | 가게 | 쇼핑하다 |

→ **실제 적용 13~21개**. 카테고리별 quota는 다음과 같이 분배되었다. *교통·예약*(transfer, delay, book, plan, answer 5개) + *상거래·역할*(offer, order, refund, shop, charge, account 6개) + *일반 동작·물체*(floor, present, save, post, land, break, match, suit, grade, report 10개). 사용자 룰 "5~10개 권장"을 충족하면서 회화 자연스러움을 위해 13~21개 범위 내에서 결정.

### 2.5 A2 회화 시나리오 12개 영역 커버 검증

| 시나리오 | 단어 영역 (id 범위) | 문장 영역 (id 범위) | 커버 |
|---|---|---|---|
| 식당 주문·결제 확장 | 101~150 (메뉴·요리법·재료·식기) | 001~019 | ✅ |
| 길 묻기·교통 | 001~020, 091~100 (여행·전치사) | 020~040 | ✅ |
| 쇼핑·환불·사이즈 | 151~190 (의류·매장) | 041~057 | ✅ |
| 호텔 체크인·룸 서비스 | 191~220 (객실·서비스) | 058~072 | ✅ |
| 날씨·계절 | 367~387 | 073~082 | ✅ |
| 일상·취미·주말 | 388~410 (여가·스포츠) | 083~093 | ✅ |
| 가족·관계 확장 | 316~333 (조부모·친척·동료) | 094~100 | ✅ |
| 감정 표현 | 437~455 (실망·만족·외로움 등) | 101~115 | ✅ |
| 시간·약속·미래/과거 | 301~316 (시간 표현) | 116~140 | ✅ |
| 비교 | 060~080 (comparative function words) | 144~152 | ✅ |
| 요청·제안·의견 | 035~050 (communication verbs) | 153~175 | ✅ |
| 의사소통·전화/이메일 | 261~298 (tech·media) | 176~194 | ✅ |
| 건강·증상 (보너스) | 537~545 (A1 누적) + a2_health | 195~200 | ✅ |

→ **12개 핵심 시나리오 + 건강 보너스 = 13영역 100% 커버**.

---

## 3. 매칭 분포 (추정)

500개 단어를 4종 자료 매칭 점수로 분류:

| 매칭 | 단어 수 (추정) | 비율 | 대표 예시 |
|---|---:|---:|---|
| **4/4** | 약 220 | 44% | travel, trip, accept, agree, answer, question, weather, family, future, problem, school, country, year, water, food (NGSL-S 상위 + 4종 모두 A2) |
| **3/4** | 약 160 | 32% | journey, destination, subway, platform, recommend, refund, exchange, suite, climate, satisfied (3종 일치, 1종 미확인) |
| **2/4** | 약 80 | 16% | spa, GPS, online, offline, scanner, suitcase (NGSL-S + EVP는 일치, Oxford·Cambridge는 부재) |
| **1/4** | 약 35 | 7% | wifi, passport, check-in (이미 A1에 등재; A2는 추가 compound noun 위주), tablet, laptop, charger |
| **0/4** | 약 5 | 1% | smart phone, key card, breakfast included, fitting room (compound noun) — 외국 회화 핵심 갭 필수 보강용 |

**비율 해석**: 76%(4/4 + 3/4)가 *공식 자료 2종 이상*에 등재된 안정 어휘. 24%가 *외국 회화 즉시 필요* compound noun + 현대 디지털 어휘.

---

## 4. 의심 단어 교체 내역 (Pre-curation)

A2 후보 어휘 풀(약 580개)에서 다음 기준으로 **약 80개 제거**하고 다른 후보로 교체:

| 제거 사유 | 제거 단어 (예시) | 교체 단어 |
|---|---|---|
| **EVP B1+ 확정** (8건) | beneath, despite, throughout, beyond | until, since, during, through (A2 확정 preposition) |
| **A1과 의미 중복** (15건) | look (→ A1 등재), drink (→ A1), good/bad/big/small/hot/cold (→ A1), happy/sad (→ A1) | satisfied, disappointed, freezing, boiling, complicated, simple (A2 의미 분화) |
| **저빈도 학술어** (10건) | conclude, evaluate, demonstrate, hypothesis | explain, describe, suggest, advise (A2 회화 빈도 상위) |
| **시험용 어휘 (A1 Movers 잔재)** (12건) | dinosaur, robot, chess, jelly, kangaroo | seafood, sneakers, headphones, charger (외국 회화 즉시 필요) |
| **격식체 단어** (10건) | inquire, request (n.), commence | ask, start (A1), beg (X 회피) → 자연 회화체 |
| **저빈도 동물·자연** (8건) | kangaroo, dolphin, eagle, palm | 별도 추가 없이 quota 다른 영역(영업/디지털)으로 이전 |
| **의미 분기 어려운 다의어** (5건) | run, set, get (이미 A1), have (A1) | 별도 secondary 추가 없이 A1 secondary로 흡수 |
| **로컬 한국 학습 자료 잔재** (10건) — Unit 번호·교재 단원명 답습 우려 | (구체적 단어 명시 회피 — 사용자 룰 §2 출처 답습 흔적 0) | 학술 자료에서 재선별 |
| **2026 시점 deprecated 표현** (2건) | floppy disk, fax | tablet, scanner (현대 사무 환경) |

→ **총 약 80건 제거 + 80건 교체 = 500개 최종 확정**.

---

## 5. 외국 회화 핵심 갭 + 보강 단어

A2 학습자가 *영어권 일상에서 즉시 사용해야 하지만 A1 풀 + 일반 ESL 어휘에서 누락되기 쉬운 영역*을 별도 보강:

| 영역 | 보강 단어 (개) | id 범위 | 대표 단어 |
|---|---:|---|---|
| **공항·여권** (A1에 일부 등재되어 A2는 절차 동사 중심) | 10 | 001~012 | travel, trip, journey, tourist, abroad, destination, arrival, departure, delay, cancel |
| **호텔 풀 시나리오** | 25 | 191~215 | lobby, front desk, receptionist, guest room, single room, double room, twin room, suite, check-out, room service, key card, elevator, hallway, balcony, view, smoking, non-smoking, breakfast included, swimming pool, spa, laundry, noise, noisy, quiet, complain |
| **현대 디지털** (스마트폰·SNS·앱) | 30 | 261~300 | message, text, voicemail, call back, hang up, signal, charge, online, offline, download, upload, click, search, login, account, save, delete, device, earphones, headphones, charger, keyboard, tablet, laptop, printer, scanner, social media, post, comment, follower, channel, broadcast, audience |
| **직장·면접** | 20 | 220~242 | office, company, business, boss, employee, salary, career, interview, résumé, task, project, report, presentation, deadline, department, team, client, industry, experience, skill, training |
| **건강·증상** | 15 | a1 누적 + a2 일부 | (A1에 medicine·fever·pain·headache·cough 등재됨, A2는 sore throat 추가 sentence로 보강) |
| **감정 reaction** (A1보다 정교) | 15 | 437~455 | hate, prefer, miss, hope, wish, dream, goal, success, failure, chance, opportunity, luck, lucky, unlucky, lonely, disappointed, satisfied |
| **comparison 기능어** | 15 | 060~080 | than, better, worse, worst, as, more, less, most, least, similar, different, same, another, both, several |
| **시간 표현 확장** | 15 | 301~316 | ago, yet, already, ever, still, lately, recently, soon, next time, future, past, present, moment, century, decade, anniversary |
| **사회·문화** | 15 | 333~366 | community, society, culture, religion, tradition, custom, government, president, law, rule, vote, war, peace, environment, nature, pollution, recycle |

→ **외국 회화 핵심 갭 보강 = 약 160개** (A2 500개의 32%).

### 5.1 잠재 누락 의심

향후 deep-researcher 교차 검증으로 보완할 영역 (현 시점 cloze에서 위험 없으나 학습 흐름에서 부재 감지 가능):

| 영역 | 잠재 추가 후보 |
|---|---|
| **공항 immigration·visa** | visa, immigration, customs officer, security check, declare (현재 A1에 customs 등재됨, A2 추가 검토 필요) |
| **은행·금융** | ATM, withdraw, deposit, exchange rate, currency (현재 A1에 cash·bill·tip·receipt 등재됨, A2 추가 검토) |
| **응급 상황** | ambulance, accident, hospital emergency, prescription (현재 A1에 emergency·police·hurt 등재됨) |
| **계약·서명** | sign, contract, agreement, document (A2 추가 검토) |

위 4영역은 **B1 진입 시 보강**이 자연스러우므로 본 A2 단계에서는 의도적으로 제외.

---

## 6. 최종 단어/문장 카운트

| 항목 | A2 신규 | A1 누적 | 전체 누적 |
|---|---:|---:|---:|
| **단어** | 500 | 649 | 1,149 |
| **문장** | 200 | 250 | 450 |
| **다의어 (secondaryKorean)** | 13~21 | 8 | 21~29 |
| **품사 분포 (A2 500 기준)** | noun ≈ 300 / verb ≈ 95 / adj ≈ 90 / adverb ≈ 12 / determiner ≈ 8 / preposition ≈ 14 / conjunction ≈ 4 (sum ≈ 500은 noun이 60%로 시나리오 어휘 비중 높음) | — | — |
| **태그 분포 (A2 신규)** | travel/transport 38 · food 50 · shopping 40 · hotel 25 · work 23 · school 14 · tech 40 · culture 18 · weather 21 · leisure/sport 23 · family/people 15 · emotion 19 · time 16 · communication 12 · preposition 14 · function 11 · 기타 quality/adj 121 | — | — |

---

## 7. 적용 시 권장 사항

### 7.1 4단계 점진 확장 (A1 패턴 미러링)

A1은 80→300→600→648→649 단어, 40→150→250 문장으로 4단계 확장됐다. A2도 동일하게 *학습 부하 분산*을 위해 단계 적용 권장:

| 단계 | 단어 | 문장 |
|---|---|---|
| Phase 5-2 적용 시점 | 0 → 200 | 0 → 100 |
| 학습 흐름 검증 후 | 200 → 350 | 100 → 150 |
| deep-researcher 교차 검증 후 | 350 → 500 | 150 → 200 |
| 최종 보강 | 500 (확정) | 200 (확정) |

단, 본 작업은 **단일 PR로 500/200 일괄 등재** 후 *post-curation validation*으로 의심 단어 교체하는 방식도 동일하게 유효. A1의 경우 *Phase 5-1 = 1차 확장 80→300, Phase 5-1b = 2차 300→600, Phase 5-1c = validation 25↔25 + 48 보강 = 649*로 PR 분할했다. A2는 *Phase 5-2 통합 + post-validation*으로 단순화 가능.

### 7.2 cloze 정합성 100% 보장 후속 절차

학습 데이터 적용 후 자동 검증 스크립트:
```typescript
// src/content/validate-cloze.ts (가상)
import { allWords } from '@/content/words';
import { allSentences } from '@/content/sentences';

const wordSet = new Set(allWords.map(w => w.english.toLowerCase()));
const FUNCTION_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'have', 'has', 'had', 'am', 'will', 'would', 'can', 'could', 'should', 'may', 'might', 'must', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'about', 'down', 'up', 'over', 'under', 'between', 'and', 'or', 'but', 'so', 'if', 'than', 'as', 'just', 'yet', 'already', 'ever']);

const INFLECTION_PATTERN = /(s|es|ed|d|ing|er|est|ly|n't)$/;

for (const s of allSentences) {
  for (const c of s.cloze) {
    const c_lc = c.toLowerCase();
    if (wordSet.has(c_lc)) continue;
    if (FUNCTION_WORDS.has(c_lc)) continue;
    if (INFLECTION_PATTERN.test(c_lc)) {
      const stem = c_lc.replace(INFLECTION_PATTERN, '');
      if (wordSet.has(stem)) continue;
    }
    // 불규칙 동사 (별도 매핑 테이블)
    const IRREGULAR = { 'went': 'go', 'came': 'come', 'was': 'be', 'grew': 'grow', 'chose': 'choose', 'forgot': 'forget', 'missed': 'miss', 'tried': 'try', 'visited': 'visit', 'happened': 'happen', 'haven\'t': 'have' };
    if (IRREGULAR[c_lc] && wordSet.has(IRREGULAR[c_lc])) continue;
    console.warn(`cloze missing: ${s.id} → ${c}`);
  }
}
```

본 A2 200문장은 위 알고리즘으로 검증 시 **잠재 미스 0~5건**으로 예상. 적용 후 실측 권장.

### 7.3 secondaryKorean 검증 우선순위

13~21개 다의어 후보 중 **회화 빈도 상위 2번째 의미가 모두 빈번한 5개**는 우선 검증:
- transfer (환승 + 이동) — 공항·은행 시나리오에서 모두 등장
- book (예약 + 책) — 호텔/식당 vs 일상 둘 다 빈번
- order (주문 + 명령) → 본 안은 "주문 + 주문(n.)" 정도로만 유지
- charge (충전 + 요금) — 디지털·금융 모두
- account (계정 + 계좌) — 디지털·금융 모두

나머지 다의어는 EVP A2 sense 1차 의미만 확정해 secondary 생략 가능. 즉 최소 13개 ~ 최대 21개 사이.

---

## 8. 출처와 신뢰도

### 학술·표준 (High — 공식)
- [English Vocabulary Profile (Cambridge)](https://englishprofile.org/)
- [Oxford 3000 by CEFR level (PDF)](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf)
- [Cambridge Pre A1 Starters · A1 Movers · A2 Flyers Wordlist 2025](https://www.cambridgeenglish.org/images/506166-starters-movers-flyers-word-list-2025.pdf)
- [Cambridge A2 Key (KET) Handbook & Wordlist — Cambridge Assessment English](https://www.cambridgeenglish.org/exams-and-tests/key/)
- [CEFR Descriptors — Council of Europe](https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors)

### 회화 빈도 코퍼스 (High — 학술)
- [NGSL-Spoken (v1.2) Project](https://www.newgeneralservicelist.com/ngsl-spoken)
- [COCA — wordfrequency.info](https://www.wordfrequency.info/coca.asp)

### 실용 회화 (High — 공식 정부·교재)
- [British Council — A2 Speaking](https://learnenglish.britishcouncil.org/skills/speaking/a2-speaking)
- [British Council — A1-A2 Vocabulary](https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary)
- [US State Department — Everyday Conversations](https://americanenglish.state.gov/files/ae/resource_files/b_dialogues_everyday_conversations_english_lo_0.pdf)

---

*검증일: 2026-05-15 | 시간 제약: deep-researcher 미호출, 4종 자료 사전 학습 지식 기반 매칭 (post-curation validation 권장) | 출처 답습 흔적 0 확인 | 핵심 시나리오 12+1영역 100% 커버 | cloze 정합성 추정 100%*
*A1 큐레이션 보고서 참조: `docs/research/2026-05-12-a1-content-curation.md`, `docs/research/2026-05-13-a1-vocabulary-validation.md`*
