/**
 * cloze 정합성 검증 유틸.
 *
 * 문장의 cloze 빈칸 정답이 *해당 레벨 또는 하위 레벨* 단어장의 lemma·활용형·기능어·불규칙
 * 형태로 존재하는지 확인한다.
 *
 * 규칙:
 * - lemma 완전 일치 (case-insensitive)
 * - 활용형 단순 형태론: -s, -es, -ed, -ied, -ing, -ly
 * - 기능어 화이트리스트 (관사·전치사·대명사·조동사 등)
 * - 불규칙 동사 화이트리스트 (be·go·come·eat·drink 등)
 */

export const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  // 관사
  'a',
  'an',
  'the',
  // be 동사
  'am',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  // do
  'do',
  'does',
  'did',
  'done',
  'doing',
  // have
  'have',
  'has',
  'had',
  'having',
  // 조동사
  'will',
  'would',
  'shall',
  'should',
  'can',
  'could',
  'may',
  'might',
  'must',
  // 대명사·소유격
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'its',
  'our',
  'their',
  'mine',
  'yours',
  'hers',
  'ours',
  'theirs',
  'this',
  'that',
  'these',
  'those',
  // 전치사
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'from',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'under',
  'over',
  'against',
  'around',
  'across',
  'along',
  'behind',
  'beside',
  'beyond',
  'inside',
  'outside',
  'off',
  'up',
  'down',
  'out',
  // 접속사
  'and',
  'or',
  'but',
  'so',
  'if',
  'when',
  'while',
  'as',
  'because',
  'since',
  'although',
  'though',
  'unless',
  'until',
  'whether',
  'than',
  // 의문사
  'what',
  'who',
  'whom',
  'whose',
  'which',
  'where',
  'why',
  'how',
  // 부사·기타
  'not',
  "n't",
  'there',
  'here',
  'yes',
  'no',
  'too',
  'very',
  'just',
  'only',
  'also',
  'still',
  'even',
  'always',
  'never',
  'often',
  'sometimes',
  'usually',
  'hardly',
  'let',
  'down',
  'up',
  "haven't",
  "hasn't",
  "hadn't",
  "doesn't",
  "didn't",
  "won't",
  "wouldn't",
  "couldn't",
  "shouldn't",
  "can't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
]);

export const IRREGULAR_FORMS: Record<string, string> = {
  // -ie + -ing (y→ie) 특수 활용
  dying: 'die',
  lying: 'lie',
  tying: 'tie',
  // 추가 불규칙 동사 (B1+)
  broke: 'break',
  broken: 'break',
  rang: 'ring',
  rung: 'ring',
  sang: 'sing',
  sung: 'sing',
  drank: 'drink',
  stole: 'steal',
  stolen: 'steal',
  shook: 'shake',
  shaken: 'shake',
  blew: 'blow',
  blown: 'blow',
  arose: 'arise',
  arisen: 'arise',
  bit: 'bite',
  bitten: 'bite',
  burnt: 'burn',
  cost: 'cost',
  cut: 'cut',
  hit: 'hit',
  hurt: 'hurt',
  shut: 'shut',
  spread: 'spread',
  bound: 'bind',
  // 불규칙 복수
  children: 'child',
  men: 'man',
  women: 'woman',
  people: 'person',
  feet: 'foot',
  teeth: 'tooth',
  geese: 'goose',
  mice: 'mouse',
  // be
  am: 'be',
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  been: 'be',
  // 일반 동사
  went: 'go',
  gone: 'go',
  came: 'come',
  ate: 'eat',
  eaten: 'eat',
  drunk: 'drink',
  slept: 'sleep',
  saw: 'see',
  seen: 'see',
  said: 'say',
  made: 'make',
  took: 'take',
  taken: 'take',
  brought: 'bring',
  thought: 'think',
  got: 'get',
  gotten: 'get',
  had: 'have',
  did: 'do',
  done: 'do',
  knew: 'know',
  known: 'know',
  gave: 'give',
  given: 'give',
  found: 'find',
  told: 'tell',
  became: 'become',
  become: 'become',
  left: 'leave',
  felt: 'feel',
  put: 'put',
  meant: 'mean',
  kept: 'keep',
  let: 'let',
  began: 'begin',
  begun: 'begin',
  showed: 'show',
  shown: 'show',
  heard: 'hear',
  ran: 'run',
  run: 'run',
  read: 'read',
  spoke: 'speak',
  spoken: 'speak',
  wrote: 'write',
  written: 'write',
  bought: 'buy',
  caught: 'catch',
  sat: 'sit',
  stood: 'stand',
  understood: 'understand',
  spent: 'spend',
  sold: 'sell',
  paid: 'pay',
  built: 'build',
  sent: 'send',
  chose: 'choose',
  chosen: 'choose',
  flew: 'fly',
  flown: 'fly',
  drove: 'drive',
  driven: 'drive',
  rode: 'ride',
  ridden: 'ride',
  rose: 'rise',
  risen: 'rise',
  fell: 'fall',
  fallen: 'fall',
  woke: 'wake',
  woken: 'wake',
  grew: 'grow',
  grown: 'grow',
  drew: 'draw',
  drawn: 'draw',
  threw: 'throw',
  thrown: 'throw',
  hung: 'hang',
  lost: 'lose',
  taught: 'teach',
  fought: 'fight',
  forgot: 'forget',
  forgotten: 'forget',
  met: 'meet',
  led: 'lead',
  dealt: 'deal',
  swam: 'swim',
  swum: 'swim',
  stuck: 'stick',
  hidden: 'hide',
  hid: 'hide',
  worn: 'wear',
  wore: 'wear',
  won: 'win',
  upheld: 'uphold',
  withheld: 'withhold',
  overcame: 'overcome',
  undertook: 'undertake',
  undertaken: 'undertake',
  withdrew: 'withdraw',
  withdrawn: 'withdraw',
  forbade: 'forbid',
  forbidden: 'forbid',
};

/**
 * 활용형 → lemma 후보 추출 (단순 형태론).
 */
export function normalizeToLemma(word: string): string[] {
  const w = word.toLowerCase().replace(/[.,!?;:"]/g, '');
  const candidates: string[] = [w];

  if (IRREGULAR_FORMS[w]) {
    candidates.push(IRREGULAR_FORMS[w]);
  }

  if (w.endsWith('ies') && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}y`);
  }
  if (w.endsWith('ied') && w.length > 4) {
    candidates.push(`${w.slice(0, -3)}y`);
  }
  if (w.endsWith('es') && w.length > 3) {
    candidates.push(w.slice(0, -2));
  }
  if (w.endsWith('ed') && w.length > 3) {
    candidates.push(w.slice(0, -2));
    candidates.push(w.slice(0, -1));
    if (w[w.length - 3] === w[w.length - 4]) {
      candidates.push(w.slice(0, -3));
    }
  }
  if (w.endsWith('ing') && w.length > 4) {
    candidates.push(w.slice(0, -3));
    candidates.push(`${w.slice(0, -3)}e`);
    if (w[w.length - 4] === w[w.length - 5]) {
      candidates.push(w.slice(0, -4));
    }
  }
  if (w.endsWith('ly') && w.length > 3) {
    candidates.push(w.slice(0, -2));
  }
  // 비교급·최상급
  if (w.endsWith('er') && w.length > 3) {
    candidates.push(w.slice(0, -2)); // smaller → small
    candidates.push(w.slice(0, -1)); // larger → large
    if (w[w.length - 3] === w[w.length - 4]) {
      candidates.push(w.slice(0, -3)); // bigger → big
    }
    if (w.endsWith('ier') && w.length > 4) {
      candidates.push(`${w.slice(0, -3)}y`); // happier → happy
    }
  }
  if (w.endsWith('est') && w.length > 4) {
    candidates.push(w.slice(0, -3)); // smallest → small
    candidates.push(w.slice(0, -2)); // largest → large
    if (w[w.length - 4] === w[w.length - 5]) {
      candidates.push(w.slice(0, -4)); // biggest → big
    }
    if (w.endsWith('iest') && w.length > 5) {
      candidates.push(`${w.slice(0, -4)}y`); // happiest → happy
    }
  }
  if (w.endsWith('s') && w.length > 2) {
    candidates.push(w.slice(0, -1));
  }
  if (w.endsWith("n't")) {
    candidates.push(w.slice(0, -3));
  }

  return candidates;
}

export function isClozeWordValid(
  clozeWord: string,
  lemmaPool: ReadonlySet<string>,
): boolean {
  const w = clozeWord.toLowerCase().replace(/[.,!?;:"]/g, '');
  if (FUNCTION_WORDS.has(w)) return true;
  if (lemmaPool.has(w)) return true;

  const candidates = normalizeToLemma(w);
  return candidates.some((c) => lemmaPool.has(c));
}
