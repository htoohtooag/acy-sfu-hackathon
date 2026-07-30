import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePostgresConnectionString } from '../src/config/postgres-connection.js';

test('normalizes pooled PostgreSQL URLs for Supabase SSL compatibility', () => {
  const normalized = new URL(normalizePostgresConnectionString(
    'postgresql://user:password@pooler.example:6543/postgres?pgbouncer=true',
  ));

  assert.equal(normalized.searchParams.get('pgbouncer'), 'true');
  assert.equal(normalized.searchParams.get('sslmode'), 'require');
  assert.equal(normalized.searchParams.get('uselibpqcompat'), 'true');
});

test('does not override an explicit SSL configuration', () => {
  const normalized = new URL(normalizePostgresConnectionString(
    'postgresql://user:password@db.example:5432/postgres?sslmode=verify-full',
  ));

  assert.equal(normalized.searchParams.get('sslmode'), 'verify-full');
  assert.equal(normalized.searchParams.has('uselibpqcompat'), false);
});
