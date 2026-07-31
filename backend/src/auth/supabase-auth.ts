import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import type { ApplicationRole, AuthenticatedUser } from '../types/auth.js';
import { ApiError } from '../utils/api-error.js';

const authorizationHeaderPattern = /^Bearer ([^\s]+)$/;
const uuidSchema = z.string().uuid();
const jwtSecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
const expectedIssuer = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;
const supabaseJwks = createRemoteJWKSet(
  new URL(`${expectedIssuer}/.well-known/jwks.json`),
);

export const unauthorizedError = new ApiError(
  401,
  'UNAUTHORIZED',
  'Authentication is required.',
);

type VerifiedClaims = {
  sub: string;
};

export function getBearerToken(value: string | undefined): string {
  const match = authorizationHeaderPattern.exec(value ?? '');

  if (match?.[1] === undefined) {
    throw unauthorizedError;
  }

  return match[1];
}

export function getSocketToken(value: unknown): string {
  if (typeof value !== 'string') {
    throw unauthorizedError;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    throw unauthorizedError;
  }

  if (trimmedValue.startsWith('Bearer ')) {
    return getBearerToken(trimmedValue);
  }

  return trimmedValue;
}

function getVerifiedClaims(payload: JWTPayload): VerifiedClaims {
  const subject = payload.sub;

  if (typeof subject !== 'string' || !uuidSchema.safeParse(subject).success) {
    throw unauthorizedError;
  }

  return { sub: subject };
}

async function verifySupabaseToken(token: string): Promise<JWTPayload> {
  try {
    const { alg } = decodeProtectedHeader(token);

    if (alg === 'ES256' || alg === 'RS256') {
      const { payload } = await jwtVerify(token, supabaseJwks, {
        algorithms: [alg],
        audience: 'authenticated',
        issuer: expectedIssuer,
      });

      return payload;
    }

    if (alg === 'HS256') {
      const { payload } = await jwtVerify(token, jwtSecret, {
        algorithms: ['HS256'],
        audience: 'authenticated',
        issuer: expectedIssuer,
      });

      return payload;
    }
  } catch (_error: unknown) {
    throw unauthorizedError;
  }

  throw unauthorizedError;
}

export async function authenticateSupabaseUser(token: string): Promise<AuthenticatedUser> {
  const claims = getVerifiedClaims(await verifySupabaseToken(token));
  const databaseUser = await prisma.user.findFirst({
    where: {
      id: claims.sub,
      deleted_at: null,
    },
    select: {
      id: true,
      email: true,
      status: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (
    databaseUser === null ||
    databaseUser.status === 'SUSPENDED' ||
    databaseUser.status === 'DELETED'
  ) {
    throw unauthorizedError;
  }

  const roles: ApplicationRole[] = databaseUser.roles.map(({ role }) => role.name);

  return {
    id: databaseUser.id,
    email: databaseUser.email,
    roles,
  };
}
