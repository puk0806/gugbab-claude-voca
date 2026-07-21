import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resetDb } from '../schema';
import { appendChatMessage, clearChatMessages, listChatMessages } from './chatRepo';

describe('chatRepo', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterEach(async () => {
    await clearChatMessages();
  });

  it('빈 상태에서 listChatMessages 는 빈 배열', async () => {
    expect(await listChatMessages()).toEqual([]);
  });

  it('append 순서대로 createdAt 오름차순 조회된다', async () => {
    await appendChatMessage({ role: 'user', content: 'Hello!', createdAt: 1000 });
    await appendChatMessage({ role: 'assistant', content: 'Hi, how are you?', createdAt: 2000 });
    const rows = await listChatMessages();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.role).toBe('user');
    expect(rows[0]?.content).toBe('Hello!');
    expect(rows[1]?.role).toBe('assistant');
  });

  it('clearChatMessages 로 전체 삭제된다', async () => {
    await appendChatMessage({ role: 'user', content: 'x', createdAt: 1000 });
    await clearChatMessages();
    expect(await listChatMessages()).toEqual([]);
  });
});
