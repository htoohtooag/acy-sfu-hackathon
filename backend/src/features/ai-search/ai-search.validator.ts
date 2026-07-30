import { aiSearchRequestSchema } from 'shared/schemas';
import { validateBody } from '../../middlewares/validate.js';

export const validateAiSearchRequest = validateBody(aiSearchRequestSchema);
