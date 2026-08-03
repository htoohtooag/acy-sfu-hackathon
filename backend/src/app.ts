import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { aiSearchRouter } from './features/ai-search/ai-search.routes.js';
import { adminRouter } from './features/admin/admin.routes.js';
import { identityRouter } from './features/identity/identity.routes.js';
import { jobRouter } from './features/marketplace/job.routes.js';
import { packageRouter } from './features/marketplace/package.routes.js';
import { reviewRouter } from './features/reputation/review.routes.js';
import { orderRouter } from './features/transactions/order.routes.js';
import { workroomRouter } from './features/workroom/workroom.routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { successResponse } from './utils/api-response.js';

export const app = express();

app.use(
  cors({
    credentials: true,
    origin: env.NODE_ENV === 'development' ? true : false,
  }),
);
app.use(express.json());

app.get('/api/v1/health', (_request, response) => {
  response.status(200).json(
    successResponse({
      service: 'backend',
      status: 'ok',
    }),
  );
});

app.use('/api/v1/users', identityRouter);
app.use('/api/v1/packages', packageRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/ai', aiSearchRouter);
app.use('/api/v1/orders', workroomRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/orders', reviewRouter);
app.use('/api/v1/admin', adminRouter);

app.use(errorHandler);


