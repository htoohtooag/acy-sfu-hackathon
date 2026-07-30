import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { successResponse } from '../../utils/api-response.js';
import { createOnboarding } from './onboarding.controller.js';
import { validateOnboardingBody } from './onboarding.validator.js';

export const identityRouter = Router();

identityRouter.get('/me', requireAuth, (request, response) => {
  response.status(200).json(successResponse(request.user));
});

identityRouter.post('/me/onboarding', requireAuth, validateOnboardingBody, createOnboarding);


// curl -i http://localhost:3001/api/v1/users/me \
//   -H "Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwYjRmOGY2LTg1MGQtNDUwYi1hMzAyLTJlMjBjMDU3YmY0ZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2tkeXl5dmxibHBnZW1nemlxc2J4LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1ODE4OWZkMy1iMjcxLTQyMDYtYTY3OC03MDgwMjg4YjQ5ZDUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzg1MzkxMjgyLCJpYXQiOjE3ODUzODc2ODIsImVtYWlsIjoiaHRvaHRvb2F1bmcyMmFnQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJodG9odG9vYXVuZzIyYWdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiNTgxODlmZDMtYjI3MS00MjA2LWE2NzgtNzA4MDI4OGI0OWQ1In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODUzODc2ODJ9XSwic2Vzc2lvbl9pZCI6IjhmZTcxMGJlLTQwMmItNDdhYS1hYWVhLTgwN2M4YThhOGEyMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.SuyNrm6s82q-iMxl53_xVwUDoi9r2TuOnf9tfnhahUuDwB6FYoUiDSaGGiwi67NrZTFkuuJdGHwnT8NtlU9Bzw"
