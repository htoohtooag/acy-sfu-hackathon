import type { RequestHandler } from 'express';
import {
  createJobPostSchema,
  jobPostIdSchema,
  jobPostListQuerySchema,
  updateJobPostSchema,
} from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import {
  createCatalogJob,
  deleteCatalogJob,
  getCatalogJob,
  listCatalogJobs,
  updateCatalogJob,
} from './job.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  return request.user.id;
}

function jobIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  return jobPostIdSchema.parse({ id: request.params.id }).id;
}

export const createJob: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(201).json(successResponse(await createCatalogJob(userIdOrThrow(request), createJobPostSchema.parse(request.body))));
  } catch (error: unknown) { next(error); }
};

export const listJobs: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await listCatalogJobs(jobPostListQuerySchema.parse(request.query))));
  } catch (error: unknown) { next(error); }
};

export const getJob: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await getCatalogJob(jobIdOrThrow(request))));
  } catch (error: unknown) { next(error); }
};

export const updateJob: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await updateCatalogJob(userIdOrThrow(request), jobIdOrThrow(request), updateJobPostSchema.parse(request.body))));
  } catch (error: unknown) { next(error); }
};

export const deleteJob: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    response.status(200).json(successResponse(await deleteCatalogJob(userIdOrThrow(request), jobIdOrThrow(request))));
  } catch (error: unknown) { next(error); }
};
