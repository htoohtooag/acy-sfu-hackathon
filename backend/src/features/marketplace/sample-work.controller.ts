import type { RequestHandler } from 'express';
import { sampleWorkOrderSchema, sampleWorkTextSchema, sampleWorkUpdateSchema } from 'shared/schemas';
import { ApiError } from '../../utils/api-error.js';
import { successResponse } from '../../utils/api-response.js';
import { createOwnedSampleWork, deleteOwnedSampleWork, listOwnedSampleWorks, reorderOwnedSampleWorks, updateOwnedSampleWork } from './sample-work.service.js';

function userIdOrThrow(request: Parameters<RequestHandler>[0]): string {
  if (request.user === undefined) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.');
  return request.user.id;
}

function tagsFromBody(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || value.trim() === '') return [];
  try { return JSON.parse(value); } catch { return value.split(',').map((tag) => tag.trim()).filter(Boolean); }
}

function textBody(request: Parameters<RequestHandler>[0]): Record<string, unknown> {
  return { title: request.body.title, description: request.body.description, tags: tagsFromBody(request.body.tags) };
}

export const listSampleWorks: RequestHandler = async (request, response, next): Promise<void> => {
  try { response.status(200).json(successResponse(await listOwnedSampleWorks(userIdOrThrow(request)))); } catch (error: unknown) { next(error); }
};

export const createSampleWork: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    if (request.file === undefined) throw new ApiError(422, 'SAMPLE_WORK_REQUIRED', 'A sample work image is required.');
    const input = sampleWorkTextSchema.parse(textBody(request));
    response.status(201).json(successResponse(await createOwnedSampleWork(userIdOrThrow(request), input, request.file)));
  } catch (error: unknown) { next(error); }
};

export const updateSampleWork: RequestHandler = async (request, response, next): Promise<void> => {
  try {
    const raw = textBody(request);
    const input = sampleWorkUpdateSchema.parse(Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)));
    response.status(200).json(successResponse(await updateOwnedSampleWork(userIdOrThrow(request), String(request.params.sampleId), input, request.file)));
  } catch (error: unknown) { next(error); }
};

export const deleteSampleWork: RequestHandler = async (request, response, next): Promise<void> => {
  try { response.status(200).json(successResponse(await deleteOwnedSampleWork(userIdOrThrow(request), String(request.params.sampleId)))); } catch (error: unknown) { next(error); }
};

export const reorderSampleWork: RequestHandler = async (request, response, next): Promise<void> => {
  try { response.status(200).json(successResponse(await reorderOwnedSampleWorks(userIdOrThrow(request), sampleWorkOrderSchema.parse(request.body)))); } catch (error: unknown) { next(error); }
};
