import { findActiveExperienceLevels, findActivePackageTiers } from './lookup.repository.js';
import type { PackageTierLookup } from 'shared/schemas';
import type { ExperienceLevelLookup } from './lookup.types.js';

export async function getActiveExperienceLevels(): Promise<ExperienceLevelLookup[]> {
  return findActiveExperienceLevels();
}

export async function getActivePackageTiers(): Promise<PackageTierLookup[]> {
  return findActivePackageTiers();
}
