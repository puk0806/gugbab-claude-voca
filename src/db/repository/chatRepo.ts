/**
 * 대화 연습 히스토리 repo (v2: chatMessage 테이블).
 *
 * relay 는 상태를 갖지 않으므로 대화 히스토리는 IndexedDB 가 단일 소스.
 * 단일 대화 스레드만 유지 — "새 대화" 는 전체 삭제로 구현.
 */
import { db } from '../schema';
import type { ChatMessageRow } from '../types';

export type AppendChatMessageInput = Omit<ChatMessageRow, 'id'>;

/** 대화 메시지 추가. 반환값은 자동 증가 id. */
export async function appendChatMessage(input: AppendChatMessageInput): Promise<number> {
  return await db.chatMessage.add(input);
}

/**
 * 전체 대화 히스토리 — 삽입 순서(++id PK) 오름차순.
 * createdAt 은 ms 해상도라 동일 ms 쓰기의 상대 순서가 비결정적 — PK 가 순서의 단일 소스.
 */
export async function listChatMessages(): Promise<ChatMessageRow[]> {
  return await db.chatMessage.orderBy(':id').toArray();
}

/** "새 대화" — 히스토리 전체 삭제. */
export async function clearChatMessages(): Promise<void> {
  await db.chatMessage.clear();
}
