import { randomUUID } from 'node:crypto';
import { Prisma } from '../../../prisma/generated/prisma/client.js';
import type { FreelancerSampleWork, FreelancerSampleWorkList, SampleWorkOrder, SampleWorkText, SampleWorkUpdate } from 'shared/schemas';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import { countSampleWorks, createSampleWork, deleteSampleWork, findFreelancerIdByUserId, findSampleWork, listSampleWorks, reorderSampleWorks, updateSampleWork } from './sample-work.repository.js';
import { mapSampleWork, mapSampleWorkList, type SampleWorkRecord } from './sample-work.types.js';

export type SampleWorkFile = { buffer: Buffer; mimetype: string };

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function objectPath(freelancerId: string): string {
  return `freelancer-sample-work/${freelancerId}/${randomUUID()}`;
}

async function uploadObject(path: string, file: SampleWorkFile): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET).upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error !== null) throw new ApiError(502, 'SAMPLE_WORK_STORAGE_FAILED', 'The sample work image could not be stored.');
}

async function removeObject(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET).remove([path]);
  if (error !== null) console.error('Freelancer sample work storage cleanup failed.', { error: error.message });
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage.from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET).createSignedUrl(path, env.FREELANCER_SAMPLE_WORK_SIGNED_URL_TTL_SECONDS);
  if (error !== null || data?.signedUrl === undefined) throw new ApiError(502, 'SAMPLE_WORK_STORAGE_FAILED', 'A sample work image access URL could not be created.');
  return data.signedUrl;
}

async function mapRecord(record: SampleWorkRecord): Promise<FreelancerSampleWork> {
  return mapSampleWork(record, await signedUrl(record.image_path));
}

async function ownerIdOrThrow(userId: string): Promise<string> {
  const freelancerId = await findFreelancerIdByUserId(userId);
  if (freelancerId === null) throw new ApiError(403, 'FREELANCER_PROFILE_REQUIRED', 'A freelancer profile is required.');
  return freelancerId;
}

export async function listOwnedSampleWorks(userId: string): Promise<FreelancerSampleWorkList> {
  const freelancerId = await ownerIdOrThrow(userId);
  return mapSampleWorkList(await Promise.all((await listSampleWorks(freelancerId)).map(mapRecord)));
}

export async function createOwnedSampleWork(userId: string, input: SampleWorkText, file: SampleWorkFile): Promise<FreelancerSampleWork> {
  const freelancerId = await ownerIdOrThrow(userId);
  const path = objectPath(freelancerId);
  await uploadObject(path, file);
  try {
    const record = await prisma.$transaction(async (transaction) => {
      const count = await countSampleWorks(freelancerId, transaction);
      if (count >= 6) throw new ApiError(409, 'SAMPLE_WORK_LIMIT_REACHED', 'A freelancer can have at most six sample work items.');
      return createSampleWork(freelancerId, { ...input, image_path: path, sort_order: count }, transaction);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return mapRecord(record);
  } catch (error: unknown) {
    await removeObject(path);
    if (error instanceof ApiError) throw error;
    if (isPrismaError(error, 'P2034')) throw new ApiError(409, 'SAMPLE_WORK_RETRY_REQUIRED', 'The sample work changed while saving. Please retry.');
    throw error;
  }
}

export async function updateOwnedSampleWork(userId: string, sampleId: string, input: SampleWorkUpdate, file?: SampleWorkFile): Promise<FreelancerSampleWork> {
  const freelancerId = await ownerIdOrThrow(userId);
  const current = await findSampleWork(sampleId, freelancerId);
  if (current === null) throw new ApiError(404, 'SAMPLE_WORK_NOT_FOUND', 'The sample work item was not found.');
  if (file === undefined && Object.keys(input).length === 0) throw new ApiError(400, 'SAMPLE_WORK_UPDATE_EMPTY', 'Provide text changes or a replacement image.');
  const newPath = file === undefined ? undefined : objectPath(freelancerId);
  if (file !== undefined && newPath !== undefined) await uploadObject(newPath, file);
  try {
    const updateInput: { title?: string; description?: string; tags?: string[]; image_path?: string } = {};
    if (input.title !== undefined) updateInput.title = input.title;
    if (input.description !== undefined) updateInput.description = input.description;
    if (input.tags !== undefined) updateInput.tags = input.tags;
    if (newPath !== undefined) updateInput.image_path = newPath;
    const record = await updateSampleWork(sampleId, freelancerId, updateInput);
    if (newPath !== undefined) await removeObject(current.image_path);
    return mapRecord(record);
  } catch (error: unknown) {
    if (newPath !== undefined) await removeObject(newPath);
    throw error;
  }
}

export async function deleteOwnedSampleWork(userId: string, sampleId: string): Promise<{ id: string; deleted: true }> {
  const freelancerId = await ownerIdOrThrow(userId);
  const current = await findSampleWork(sampleId, freelancerId);
  if (current === null) throw new ApiError(404, 'SAMPLE_WORK_NOT_FOUND', 'The sample work item was not found.');
  await deleteSampleWork(sampleId, freelancerId);
  const { error } = await supabaseAdmin.storage.from(env.SUPABASE_FREELANCER_SAMPLE_WORK_BUCKET).remove([current.image_path]);
  if (error !== null) throw new ApiError(502, 'SAMPLE_WORK_CLEANUP_FAILED', 'The sample work was deleted, but its image cleanup failed.');
  return { id: sampleId, deleted: true };
}

export async function reorderOwnedSampleWorks(userId: string, input: SampleWorkOrder): Promise<FreelancerSampleWorkList> {
  const freelancerId = await ownerIdOrThrow(userId);
  const existing = await listSampleWorks(freelancerId);
  if (existing.length !== input.sampleIds.length || existing.some((item) => !input.sampleIds.includes(item.id))) {
    throw new ApiError(422, 'SAMPLE_WORK_ORDER_INVALID', 'The order must contain every owned sample work ID exactly once.');
  }
  const records = await prisma.$transaction((transaction) => reorderSampleWorks(freelancerId, input.sampleIds, transaction), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return mapSampleWorkList(await Promise.all(records.map(mapRecord)));
}
