import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import type { ApplicationRole } from '../types/auth.js';
import { ApiError } from '../utils/api-error.js';

const authorizationHeaderPattern = /^Bearer ([^\s]+)$/;
const uuidSchema = z.string().uuid();
const jwtSecret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
const expectedIssuer = `${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`;
const supabaseJwks = createRemoteJWKSet(
  new URL(`${expectedIssuer}/.well-known/jwks.json`),
);
const unauthorizedError = new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');

type VerifiedClaims = {
  sub: string;
  email?: string;
};

function getBearerToken(request: Request): string {
  const authorization = request.get('authorization');
  const match = authorizationHeaderPattern.exec(authorization ?? '');

  if (!match) {
    throw unauthorizedError;
  }

  const token = match[1];

  if (token === undefined) {
    throw unauthorizedError;
  }

  return token;
}

function getVerifiedClaims(payload: JWTPayload): VerifiedClaims {
  const subject = payload.sub;

  if (typeof subject !== 'string' || !uuidSchema.safeParse(subject).success) {
    throw unauthorizedError;
  }

  const email = typeof payload.email === 'string' ? payload.email : undefined;

  return email === undefined ? { sub: subject } : { sub: subject, email };
}

async function verifySupabaseToken(token: string): Promise<JWTPayload> {
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

  throw unauthorizedError;
}

export const requireAuth: RequestHandler = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  let tokenVerified = false;

  try {
    const token = getBearerToken(request);
    const payload = await verifySupabaseToken(token);
    const claims = getVerifiedClaims(payload);
    tokenVerified = true;

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

    request.user = {
      id: databaseUser.id,
      email: databaseUser.email,
      roles,
    };
    next();
  } catch (error: unknown) {
    if (error === unauthorizedError) {
      next(unauthorizedError);
      return;
    }

    if (error instanceof ApiError) {
      next(error);
      return;
    }

    if (!tokenVerified) {
      next(unauthorizedError);
      return;
    }

    next(error);
  }
};
