import { findActiveExperienceLevels } from './lookup.repository.js';
import type { ExperienceLevelLookup } from './lookup.types.js';

export async function getActiveExperienceLevels(): Promise<ExperienceLevelLookup[]> {
  return findActiveExperienceLevels();
}
