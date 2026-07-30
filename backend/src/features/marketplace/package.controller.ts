import type { RequestHandler } from 'express';
import {
  createPackageSchema,
  packageIdSchema,
  packageListQuerySchema,
  updatePackageSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import {
  createCatalogPackage,
  deleteCatalogPackage,
  getCatalogPackage,
  listCatalogPackages,
  updateCatalogPackage,
} from './package.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  return request.user.id;
}

function packageIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  return packageIdSchema.parse({ id: request.params.id }).id;
}

export const createPackage: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const result = await createCatalogPackage(userIdOrThrow(request), createPackageSchema.parse(request.body));
    response.status(201).json(successResponse(result));
  } catch (error: unknown) { next(error); }
};

export const listPackages: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const result = await listCatalogPackages(packageListQuerySchema.parse(request.query));
    response.status(200).json(successResponse(result));
  } catch (error: unknown) { next(error); }
};

export const getPackage: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await getCatalogPackage(packageIdOrThrow(request))));
  } catch (error: unknown) { next(error); }
};

export const updatePackage: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const result = await updateCatalogPackage(userIdOrThrow(request), packageIdOrThrow(request), updatePackageSchema.parse(request.body));
    response.status(200).json(successResponse(result));
  } catch (error: unknown) { next(error); }
};

export const deletePackage: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await deleteCatalogPackage(userIdOrThrow(request), packageIdOrThrow(request))));
  } catch (error: unknown) { next(error); }
};
