import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aiSearchRequestSchema,
  searchPackagesToolSchema,
  searchPlatformDocsToolSchema,
} from 'shared/schemas';

const textMessage = (role: 'user' | 'assistant', text: string) => ({
  id: `${role}-message`,
  role,
  parts: [{ type: 'text', text }],
});

test('AI search requires a final user message with bounded text', () => {
  assert.equal(aiSearchRequestSchema.safeParse({ messages: [textMessage('assistant', 'Hello')] }).success, false);
  assert.equal(aiSearchRequestSchema.safeParse({ messages: [textMessage('user', 'Find a designer')] }).success, true);
  assert.equal(aiSearchRequestSchema.safeParse({ messages: [textMessage('user', 'x'.repeat(4001))] }).success, false);
});

test('AI search rejects more than twenty messages', () => {
  const messages = Array.from({ length: 20 }, (_, index) => textMessage(index === 19 ? 'user' : 'assistant', String(index)));
  assert.equal(aiSearchRequestSchema.safeParse({ messages }).success, true);
  assert.equal(aiSearchRequestSchema.safeParse({ messages: [...messages, textMessage('user', 'one more')] }).success, false);
});

test('AI search safely accepts UI parts but tool parts are not part of the tool contract', () => {
  const result = aiSearchRequestSchema.safeParse({
    messages: [{
      id: 'user-message',
      role: 'user',
      parts: [
        { type: 'text', text: 'Find a web designer' },
        { type: 'tool-searchPackages', state: 'output-available', output: { secret: true } },
      ],
    }],
  });

  assert.equal(result.success, true);
  assert.equal(searchPackagesToolSchema.safeParse({ query: 'web design', max_budget_mmk: '250000' }).success, true);
  assert.equal(searchPackagesToolSchema.safeParse({ query: 'web design', max_budget_mmk: '-1' }).success, false);
  assert.equal(searchPlatformDocsToolSchema.safeParse({ query: 'How does escrow work?' }).success, true);
});
