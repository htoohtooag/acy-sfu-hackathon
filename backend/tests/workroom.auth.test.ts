import assert from 'node:assert/strict';
import test from 'node:test';
import { getSocketToken } from '../src/auth/supabase-auth.js';

test('Socket.io auth accepts raw and Bearer tokens without query-string auth', () => {
  assert.equal(getSocketToken('raw-token'), 'raw-token');
  assert.equal(getSocketToken('Bearer bearer-token'), 'bearer-token');
  assert.throws(() => getSocketToken(''), /Authentication is required/);
  assert.throws(() => getSocketToken(undefined), /Authentication is required/);
});
