import type { RequestHandler } from 'express';
import { pipeUIMessageStreamToResponse } from 'ai';
import { ApiError } from '../../utils/api-error.js';
import { createAiSearchUiStream } from './ai-search.service.js';

export const searchWithAi: RequestHandler = async (request, response, next): Promise<void> => {
  const abortController = new AbortController();
  const abortRequest = (): void => abortController.abort();
  request.once('aborted', abortRequest);
  response.once('close', abortRequest);

  try {
    const userId = request.user?.id;
    if (userId === undefined) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Authentication is required.'));
      return;
    }

    const stream = await createAiSearchUiStream(request.body, userId, abortController.signal);
    console.log(stream,"ai search stream")
    await pipeUIMessageStreamToResponse({
      response,
      stream,
    });
  } catch (error: unknown) {
    if (response.headersSent) {
      response.destroy();
      return;
    }

    next(error);
  } finally {
    request.removeListener('aborted', abortRequest);
    response.removeListener('close', abortRequest);
  }
};
