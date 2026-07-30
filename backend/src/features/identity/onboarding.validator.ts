import { onboardingRequestSchema } from 'shared/schemas';
import { validateBody } from '../../middlewares/validate.js';

export const validateOnboardingBody = validateBody(onboardingRequestSchema);
