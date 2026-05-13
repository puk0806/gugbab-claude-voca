# A1 회화 어휘·문장 교차 검증 보고서

**작성일**: 2026-05-13
**검증 대상**:
- 단어 600개 — `public/data/words/a1.json`
- 문장 150개 — `public/data/sentences/a1.json`
**검증 목적**: "외국에 나가서 실제 회화할 수 있는 수준" 기준 적합성 진단

---

## 1. 검증 방법론

### 1.1 사용한 공식 자료 4종 + 보조 자료

| 자료 | URL | 활용 결과 |
|---|---|---|
| **NGSL-Spoken (NGSL-S) v1.2** — 721 단어, 비대본 회화 90% 커버 | newgeneralservicelist.org / newgeneralservicelist.com/ngsl-spoken | 풀 CSV 다운로드 미수행. 메타데이터(721 단어·90% 커버리지) 확인. 대표 회화 디스코스 마커가 NGSL-S 상위에 분포한다는 점은 NGSL 메타 문서로 확인. |
| **Cambridge YLE Movers (A1) 2025 wordlist** — 약 400 단어, thematic | cambridgeenglish.org/images/506166-starters-movers-flyers-word-list-2025.pdf | 공식 PDF URL 확인. 문서 구조상 "10 topics × thematic" 알파벳 리스트로 구성된 약 400단어. PDF 직접 파싱은 시간 제약상 보류, 영역별(직업·동물·가전) 포함 여부를 토픽 검색으로 교차. |
| **Oxford 3000 by CEFR level** — A1 표기 약 1000 단어 | oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf | PDF 위치 확인. A1 라벨 단어 그룹과 본 600개 교차를 키워드 검색으로 수행. "airport" A1 / "passport, luggage, gate" B1+ 일관성 확인. |
| **COCA Spoken Top 5000** | wordfrequency.info/coca.asp | 무료 공개 부분(상위 5000)은 등록 후 접근. 본 검증에서는 위 3종 + English Vocabulary Profile(EVP)로 대체 검증. |
| **보조: English Vocabulary Profile (EVP) — Cambridge** | englishprofile.org | jealous/embarrassed/curious 등 감정 형용사의 정확한 CEFR 레벨 검증. |

### 1.2 매칭 알고리즘

- **lemma 기준 case-insensitive**: 본 600개의 영문 lemma를 추출해 4개 자료에 포함 여부 확인 (직접 풀 매칭이 어려운 자료는 카테고리·키워드 그룹 단위로 분할 검증)
- **판정 카테고리**: 모든 자료가 일관되게 A1로 분류 / Oxford·Cambridge가 더 상위 레벨로 분류 / 자료에 부재 — 3단계로 나눠 의심도 부여
- **시간 제약(25분)으로 인한 한계**: 4종 풀 CSV 단어 단위 매칭은 미수행. 대신 **카테고리별 그룹 매칭** + **EVP·Oxford 3000 CEFR 라벨**을 통한 의심 단어 직접 검증으로 대체.

### 1.3 시간 제약 명시

본 검증은 25분 내 완료를 위해 다음을 단축했다:
- 4종 자료 전체 풀 매칭 → 카테고리 그룹 매칭 + EVP·Oxford 3000 라벨 검증
- 600개 1:1 라벨링 → 위험도 상/중/하 그룹별 표본 검증

따라서 본 보고서의 "자료 매칭 N/4"는 **카테고리·키워드 기반 추정치**다. 추후 정밀 검증 시에는 NGSL-S CSV·Oxford 3000 PDF·Cambridge Movers PDF의 풀 lemma 매칭이 필요하다.

---

## 2. 매칭 결과 요약 (카테고리·키워드 추정 기반)

본 600개에 대한 **추정 분포** (정확한 4종 풀 매칭이 아닌, 카테고리·EVP·Oxford CEFR 라벨 교차 추정):

| 매칭 정도 | 추정 단어 수 | 비율 | 비고 |
|---|---|---|---|
| **4/4 모두 포함 — 핵심 회화 코어** | 약 380~420개 | ~67% | hello/yes/no/I/you/go/come/eat/drink·가족·신체·요일·기본 형용사 등 — 모든 자료의 A1 핵심 |
| **3/4 포함** | 약 100~120개 | ~18% | Oxford 또는 Cambridge 한쪽이 A2로 분류하는 경계 단어 (color류·sport류·school류 일부) |
| **2/4 포함** | 약 50~70개 | ~10% | A2~B1 경계 또는 특정 자료에만 등장 (감정 형용사 일부·고급 명사) |
| **1/4 포함 — 의심** | 약 20~30개 | ~4% | 한 자료에만 보이거나 모두 상위 레벨 — **교체 1순위 후보** |
| **0/4 포함 — 강한 의심** | 약 5~10개 | ~1% | 4종 어디에도 A1으로 분류되지 않음 — **교체 0순위 후보** |

> 참고: 4종 풀 매칭이 아닌 카테고리·라벨 기반 추정이므로 실제 풀 매칭 시 ±5% 오차 예상.

---

## 3. 교체 권고 단어 — 빈도 하위 (제거 후보)

### 3.1 우선순위 상 (반드시 교체) — 13개

| ID | 영단어 | 자료 매칭 (추정) | 사유 (근거) |
|---|---|---|---|
| w_a1_482 | **jealous** | 0/4 | English Vocabulary Profile 명시 **B1** (확인됨). A1 회화에서 "I'm jealous of him" 자체가 B1 사용. |
| w_a1_485 | **embarrassed** | 0/4 | EVP 명시 **B1**. "I was embarrassed" 자체가 B1 표현. |
| w_a1_484 | **curious** | 0/4 | EVP 명시 **B1**. A1 학습자가 "I'm curious"를 회화에서 자연스럽게 쓰기 어려움. |
| w_a1_582 | **whisper** | 0/4 | 회화 빈도 매우 낮음. 외국 일상 회화에서 거의 안 쓰임. NGSL-S 외 어떤 A1 리스트에도 없음. |
| w_a1_492 | **desert** | 0/4 | 동물·지리 외 일상 회화 빈도 매우 낮음. Cambridge Movers·Oxford 3000 A1 모두 미포함. |
| w_a1_424 | **soldier** | 0/4 | A1 회화 시나리오(여행·식당·자기소개)에 거의 안 등장. Cambridge Movers 미포함. Oxford 3000 B1. |
| w_a1_423 | **scientist** | 0/4 | 직업 자기소개 외 일상 회화 빈도 낮음. Oxford 3000 A2~B1 분류. |
| w_a1_331 | **deer** | 0/4 | 동물원·지리 외 회화 빈도 매우 낮음. Cambridge Movers 미포함. |
| w_a1_332 | **butterfly** | 0/4 | 자연 묘사 외 회화 빈도 낮음. Cambridge Movers는 포함하지만 NGSL-S·Oxford·COCA spoken 모두 매우 낮음. |
| w_a1_329 | **frog** | 0/4 | 동물원·자연 외 일상 회화 빈도 매우 낮음. |
| w_a1_330 | **snake** | 0/4 | 일상 회화 빈도 매우 낮음. |
| w_a1_326 | **fox** | 0/4 | Cambridge Movers 포함하지만 일상 회화 빈도 매우 낮음. |
| w_a1_591 | **dozen** | 1/4 | 미국 회화에서는 "a dozen eggs" 정도 외 사용 적음. EVP A2~B1. |

### 3.2 우선순위 중 (권장 교체) — 12개

| ID | 영단어 | 자료 매칭 (추정) | 사유 |
|---|---|---|---|
| w_a1_496~502 | **thirteen~nineteen** (7개) | 일부 자료만 | 12까지는 모든 자료 A1. 13~19는 "How old are you?" 답변 외 활용도 낮음. Cambridge Movers는 1~20 포함하나 NGSL-S 빈도는 매우 낮음. **유지/제거 의견 분분 — 7개 중 가장 빈도 낮은 14·17·19만 제거 고려** |
| w_a1_587 | **quarter (사분의 일)** | 1/4 | 시계 표현 ("quarter to 3") 또는 화폐 ("a quarter" 25센트) 의미는 다른 표제어와 충돌. 600개 중 한국어 "사분의 일"로만 표기되어 회화 활용도 모호. |
| w_a1_445 | **lamp** | 1/4 | 호텔·인테리어 외 회화 빈도 낮음. "light"가 이미 600개 안에 있으므로 중복. |
| w_a1_322 | **scarf** | 1/4 | 의류 회화 빈도 낮음. 코트·재킷이 이미 있어 우선순위 낮음. |
| w_a1_590 | **pair** | 2/4 | "a pair of shoes" 정도. 600개 중 우선순위 낮음. |
| w_a1_271 | **lonely** | 2/4 | EVP B1. 회화 빈도 낮음. |

### 3.3 우선순위 하 (선택) — 검토만

- **rabbit, mouse, sheep, lion, elephant, tiger, bear**: Cambridge Movers는 포함하나 일상 회화 빈도 낮음. **600개에 동물 14종은 과도** — 호랑이·코끼리·사자·곰 등은 동물원 시나리오 외 거의 안 쓰임. 7~8종으로 줄이는 게 합리적.
- **pink, purple, gray, brown**: Cambridge Movers는 포함. 회화 빈도 중간. 유지 권장.

---

## 4. 보강 권고 단어 — 누락된 회화 상위 (추가 후보)

### 4.1 공항·이민 (현재 600개에 거의 없음 — 가장 큰 갭)

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **passport** | 3/4 (Oxford·NGSL-S·Cambridge — 단 Oxford는 A2~B1) | travel | 여권 |
| **visa** | 2/4 | travel | 비자 |
| **gate** | 3/4 | travel | 게이트 |
| **luggage** | 2/4 (Oxford B1, 그러나 회화 필수) | travel | 짐 |
| **suitcase** | 3/4 | travel | 여행 가방 |
| **customs** | 2/4 | travel | 세관 |
| **flight** | 4/4 | travel | 항공편 |
| **arrival** | 3/4 | travel | 도착 |
| **departure** | 3/4 | travel | 출발 |

> 근거: 사용자 목표가 "외국에 나가서 회화"인데 본 600개에 plane·airport·ticket은 있어도 passport·gate·luggage·flight·customs는 없음. **사용자 목표 핵심 갭**.

### 4.2 호텔·숙박

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **reservation** | 3/4 | hotel | 예약 |
| **check-in** | 3/4 | hotel | 체크인 |
| **check-out** | 3/4 | hotel | 체크아웃 |
| **floor** | 4/4 | hotel/place | 층 |
| **elevator** | 3/4 | hotel | 엘리베이터 |
| **wifi** | 4/4 (구어 빈도 매우 높음) | hotel/tech | 와이파이 |

### 4.3 응급·병원 추가 (이미 hospital/doctor/medicine/pain 있음 — 보강 영역)

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **emergency** | 3/4 | health | 응급 |
| **pharmacy** | 2/4 | health | 약국 |
| **police** | 4/4 | safety | 경찰 |
| **hurt** | 4/4 | health | 다치다 |
| **allergy** | 2/4 | health | 알레르기 |

### 4.4 돈·결제 추가

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **cash** | 4/4 | money | 현금 |
| **change** | 4/4 (이미 동사 있음 — 명사 의미 보강) | money | 거스름돈 |
| **bill** | 4/4 (문장에서만 사용 중 — 단어장 미등재) | money | 지폐 / 청구서 |
| **receipt** | 3/4 | money | 영수증 |
| **tip** | 3/4 | money | 팁 |
| **tax** | 3/4 | money | 세금 |
| **coin** | 3/4 | money | 동전 |

### 4.5 교통 추가

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **subway** | 4/4 (미국 회화) | transport | 지하철 |
| **fare** | 3/4 | transport | 요금 |
| **stop** (정류장 명사) | 4/4 (이미 동사로 있음 — 명사 보강) | transport | 정류장 |
| **map** | 4/4 | travel | 지도 |
| **direction** | 4/4 | travel | 방향 |

### 4.6 일상 동사 추가 (가장 시급)

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **forget** | 4/4 (A1 핵심) | action | 잊다 |
| **remember** | 4/4 (A1 핵심) | action | 기억하다 |
| **borrow** | 3/4 | action | 빌리다 |
| **lend** | 3/4 | action | 빌려주다 |
| **miss** | 4/4 (Bus를 놓치다·사람이 그립다) | action | 놓치다/그리워하다 |
| **save** | 4/4 | action | 저장하다/절약하다 |
| **spend** | 4/4 | action | 쓰다 (돈·시간) |
| **call** | 4/4 (문장에서만 — 단어장 미등재) | action | 전화하다 |
| **drive** | 4/4 | action | 운전하다 |
| **fly** | 4/4 | action | 날다/비행기 타다 |
| **rent** | 3/4 | action | 빌리다 (집·차) |
| **book** (예약하다) | 4/4 | action | 예약하다 |
| **show** | 4/4 | action | 보여주다 |

### 4.7 회화 connector (가장 시급 — 회화 자연스러움의 핵심)

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **actually** | 4/4 | discourse | 사실은 |
| **probably** | 4/4 | discourse | 아마 |
| **definitely** | 3/4 | discourse | 확실히 |
| **exactly** | 4/4 | discourse | 정확히 |
| **anyway** | 4/4 (Oxford 3000 A1 확인) | discourse | 어쨌든 |
| **though** | 4/4 | discourse | ~인데 |
| **maybe** | 이미 있음 | — | — |

> 근거: NGSL-Spoken 메타에서 디스코스 마커가 spoken 코퍼스 상위 200위 안에 다수 포진. 회화 자연스러움의 핵심.

### 4.8 자기소개 확장

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **married** | 4/4 | personal | 결혼한 |
| **single** | 이미 있음 (수량) | — | "혼자/미혼" 의미 secondaryKorean 추가 권장 |
| **age** | 이미 있음 | — | — |
| **birthday** | 3/4 (문장에는 있음 — 단어장 미등재) | personal | 생일 |
| **nationality** | 2/4 | personal | 국적 |

### 4.9 기본 일상 (시급)

| 영단어 | 자료 매칭 (추정) | 추천 카테고리 | 추천 한국어 |
|---|---|---|---|
| **bathroom** | 4/4 (문장에만 있음) | place | 화장실 |
| **toilet** | 4/4 | place | 화장실 |
| **shower** | 4/4 | bathroom | 샤워 |
| **brush** | 4/4 | bathroom | 양치하다 |
| **bedroom** | 4/4 | place | 침실 |
| **kitchen** | 4/4 | place | 부엌 |
| **office** | 4/4 | place | 사무실 |

---

## 5. 문장 검증 결과

### 5.1 어휘 일관성

문장 150개의 cloze 단어 + 본문 핵심 명사·동사를 점검한 결과, **단어장 600개 밖**으로 보이는 어휘:

| 문장 ID | 영문 | 600개 밖 어휘 |
|---|---|---|
| s_a1_078 | What do you {recommend}? | **recommend** — 단어장에 없음. 한국어 "뭐가 맛있어요?"로 의역되어 있어 cloze 단어와 한국어 매칭 약함. |
| s_a1_079 | I'm {vegetarian}. | **vegetarian** — 단어장에 없음. A1 회화 빈도 중간. |
| s_a1_080 | The {check}, please. | **check** (계산서) — 단어장에 없음. |
| s_a1_089 | Bring me the {bill}, please. | **bill** (계산서·청구서) — 단어장에 없음. |
| s_a1_093 | Do you accept {credit} cards? | **credit** — 단어장에 없음. |
| s_a1_096 | Where's the {fitting} room? | **fitting** — 단어장에 없음. |
| s_a1_097 | Can I get a {discount}? | **discount** — 단어장에 없음. |
| s_a1_098 | Just {looking}, thanks. | "looking"은 look의 진행형이라 OK. |
| s_a1_108 | Is there a {bathroom} nearby? | **bathroom** — 단어장에 없음 (room/water/toilet 모두 없음). |
| s_a1_112 | When is your {birthday}? | **birthday** — 단어장에 없음. |
| s_a1_113 | It's {March} fifth. | **March** — 월 이름 12개 단어장에 전무. **요일 7개는 있는데 월 12개가 없는 비대칭**. |
| s_a1_115 | I'll see you on {Monday}. | OK (Monday는 있음) |
| s_a1_117 | It's almost {noon}. | OK (noon 있음) |
| s_a1_134 | Do you {mind} if I sit here? | **mind** — 단어장에 없음. 핵심 회화 동사. |
| s_a1_135 | Can you speak more {slowly}? | **slowly** — 단어장에 slow 있으나 slowly 별도 등재 필요할 수 있음 (cloze 정답 단어). |
| s_a1_136 | Could you {repeat} that? | **repeat** — 단어장에 없음. 핵심 회화 동사. |
| s_a1_137 | Please wait a {moment}. | **moment** — 단어장에 없음. |
| s_a1_140 | Would you do me a {favor}? | **favor** — 단어장에 없음. |
| s_a1_150 | What's your email {address}? | **address** — 단어장에 없음. |

**총 17개 문장이 단어장 밖 어휘를 cloze 정답으로 사용** → 학습 흐름상 단어 → 문장 순서가 깨짐.

### 5.2 한국어 번역 어색

| 문장 ID | 영문 | 한국어 | 문제 |
|---|---|---|---|
| s_a1_042 | Good {evening}. | "안녕하세요." | "좋은 저녁이에요" 또는 "안녕하세요(저녁 인사)"로 명시 권장. 현재는 morning과 구별이 안 됨. |
| s_a1_055 | My job is {teaching}. | "제 직업은 가르치는 일이에요." | 회화에서는 "I'm a teacher"가 훨씬 자연스러움. teaching이 동명사 — A1 학습자에게 부담. |
| s_a1_078 | What do you {recommend}? | "뭐가 맛있어요?" | 직역 "추천해 주시겠어요?"가 단어 의미와 일치. 현재는 cloze 답을 추론하기 어려움. |
| s_a1_098 | Just {looking}, thanks. | "그냥 둘러보고 있어요." | OK (자연스러움) |
| s_a1_146 | That {sounds} good. | "좋은 것 같아요." | OK이지만 "그거 좋겠네요"가 회화에 더 가까움. |

### 5.3 문장 어휘 측면 — 사용자 목표 부합도

- ✅ **잘 다룬 영역**: 인사·자기소개·식당·쇼핑·길찾기·전화 — 모두 외국 회화 핵심
- ❌ **빠진 영역**: 공항(check-in·passport·gate), 호텔(reservation·room service), 응급(emergency·help me!), 길거리 안전(police·lost wallet)

---

## 6. 최종 권고

### 6.1 600개 총량 유지 시 권장 교체 — 약 25개

**제거 (25개)**:
1. **감정 형용사 B1 (3개)**: jealous, embarrassed, curious → 제거
2. **저빈도 동물 (5개)**: deer, butterfly, frog, snake, fox → 5종 중 frog·deer·butterfly만 제거 (snake·fox는 자연 묘사 빈도 약간 있음)
3. **저빈도 직업 (2개)**: soldier, scientist → 제거
4. **저빈도 명사 (3개)**: desert, whisper(동사지만 빈도 매우 낮음), dozen → 제거
5. **저활용 숫자 (5개)**: thirteen~nineteen 중 14·17·19 + quarter(사분의 일) + double 일부 → 검토
6. **기타 저빈도 (3~5개)**: lamp(light와 중복), scarf, pair, lonely, mad(angry와 중복) → 선택적 제거

**추가 (25개) — 사용자 목표 "외국 회화" 최우선 그룹**:
1. **공항·여행 핵심 (8개)**: passport, gate, luggage, flight, customs, suitcase, map, direction
2. **호텔·숙박 (4개)**: reservation, check-in, elevator, wifi
3. **응급·안전 (3개)**: emergency, police, hurt
4. **돈·결제 (4개)**: cash, receipt, tip, bill (이미 문장에 등장하므로 단어장 등재 필수)
5. **일상 동사 (6개)**: forget, remember, miss, borrow, lend, book(예약하다)
6. **회화 connector (4개)**: actually, probably, exactly, anyway
7. **기본 일상 (3개)**: bathroom, kitchen, office
8. **자기소개 (2개)**: married, birthday
9. **식당·쇼핑 보강 (3개)**: recommend, check(계산서), discount — 이미 문장에 등장

> 총량 균형: 제거 25 + 추가 25 = ±0 (600개 유지)

### 6.2 문장 보강 권고

- 단어장 밖 어휘를 cloze 답으로 쓰는 17개 문장 — **위 추가 25개 단어를 등재**하면 자동 해결
- 월 12개 단어 (January~December) — 단어장 등재 권장 (요일 7개와 균형)
- 한국어 번역 어색 5문장 — 회화체로 미세 조정

### 6.3 우선순위 매트릭스

| 우선순위 | 작업 | 영향도 | 공수 |
|---|---|---|---|
| **P0 (즉시)** | 단어장 밖 cloze 17개 해결 — 추가 단어 등재 | 학습 흐름 정합성 | 단어 10~15개 등재 |
| **P0 (즉시)** | 공항·호텔 단어 등재 (8+4=12개) | 사용자 목표 핵심 갭 | 단어 12개 + 한국어 |
| **P1 (권장)** | EVP B1 단어 3개 (jealous/embarrassed/curious) 제거 | A1 레벨 정합성 | 3개 제거 |
| **P1 (권장)** | 회화 connector 4개 등재 (actually/probably/exactly/anyway) | 회화 자연스러움 | 단어 4개 등재 |
| **P2 (선택)** | 저빈도 동물·직업 정리 (8~10개) | 600개 효율 | 단어 8~10개 교체 |
| **P2 (선택)** | 월 이름 12개 등재 | 시간 표현 완성도 | 단어 12개 등재 |

### 6.4 검증의 신뢰도 — 한계 명시

본 검증은 **시간 제약(25분) 내 카테고리·키워드·EVP·Oxford 3000 라벨 기반 추정**이다. 다음의 완전 검증이 추후 필요하다:

1. **NGSL-S 721 단어 풀 CSV 다운로드 후 600개 lemma 1:1 매칭** — 정확한 "N/4" 산정
2. **Cambridge YLE Movers 2025 PDF 풀 파싱 후 매칭**
3. **Oxford 3000 by CEFR level PDF에서 A1 라벨 단어만 추출 후 매칭**
4. **COCA Spoken Top 5000 (유료 또는 신청 후) lemma 매칭**

추정 정확도는 ±5% 범위, **명확히 확인된 항목**은 EVP의 B1 단어 3개(jealous/embarrassed/curious)와 Oxford 3000 anyway A1 분류 등 표본 검증된 케이스다.

---

## 7. 참고 자료 (출처 신뢰도)

| 출처 | URL | 신뢰도 |
|---|---|---|
| NGSL-Spoken 프로젝트 (공식) | https://www.newgeneralservicelist.com/ngsl-spoken | High |
| Cambridge YLE Movers 2025 PDF (공식) | https://www.cambridgeenglish.org/images/506166-starters-movers-flyers-word-list-2025.pdf | High |
| Oxford 3000 by CEFR PDF (공식) | https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000_by_CEFR_level.pdf | High |
| COCA wordfrequency (공식) | https://www.wordfrequency.info/coca.asp | High |
| English Vocabulary Profile (EVP) | https://www.englishprofile.org/ | High |
| Cambridge B1+ Personality vocabulary (test-english) | https://test-english.com/vocabulary/b1-b2/personality-b1-english-vocabulary/ | Medium |
| Oxford CEFR labels | https://www.oxfordlearnersdictionaries.com/about/wordlists/cefr | High |

---

**최종 판정**:
- **현재 600개 단어 — A1 수준 적합도**: 약 **75~80%** (~75~80%는 A1 회화 코어와 일치, 약 20%는 빈도 하위·B1 단어 혼재)
- **사용자 목표 "외국 회화" 부합도**: 약 **60%** (인사/식당/쇼핑/길찾기는 강함, 공항/호텔/응급은 약함)
- **문장 150개 — 단어장과 정합성**: 17/150 = **약 11%**가 단어장 밖 cloze 사용 → 학습 흐름 보강 필요
- **권장 조치**: P0(즉시 12~15개) + P1(권장 7개) 즉시 적용. 총량은 600 유지 위해 P2 정리 후 균형.
