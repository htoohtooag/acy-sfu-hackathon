import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed } from 'ai';
import { env } from './env.js';
import { ApiError } from '../utils/api-error.js';

const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
const embeddingModel = google.embedding(env.GEMINI_EMBEDDING_MODEL);

export async function createTextEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embed({
      model: embeddingModel,
      value: text,
      providerOptions: {
        google: {
          outputDimensionality: env.GEMINI_EMBEDDING_OUTPUT_DIMENSIONALITY,
        },
      },
    });

    if (
      !Array.isArray(result.embedding) ||
      !result.embedding.every(
        (value): value is number => typeof value === 'number' && Number.isFinite(value),
      )
    ) {
      throw new ApiError(502, 'GEMINI_EMBEDDING_FAILED', 'Embedding generation failed.');
    }

    return result.embedding;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(502, 'GEMINI_EMBEDDING_FAILED', 'Embedding generation failed.');
  }
}
