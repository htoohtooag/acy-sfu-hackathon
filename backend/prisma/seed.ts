import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { config } from 'dotenv';
import { z } from 'zod';
import { createTextEmbedding } from '../src/config/gemini.js';
import { normalizePostgresConnectionString } from '../src/config/postgres-connection.js';

type LoadedEnvironment = {
  DATABASE_URL: string;
  SUPER_ADMIN_USER_ID?: string;
};

const loadedEnvironment = config();
const databaseUrl = loadedEnvironment.parsed?.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL must be defined in backend/.env before seeding.');
}

const environment: LoadedEnvironment = {
  DATABASE_URL: normalizePostgresConnectionString(databaseUrl),
  SUPER_ADMIN_USER_ID: z.string().uuid().optional().parse(loadedEnvironment.parsed?.SUPER_ADMIN_USER_ID),
};

const adapter = new PrismaPg({ connectionString: environment.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const roles = [
  { name: 'CLIENT', description: 'A marketplace client.', is_system_role: true },
  { name: 'FREELANCER', description: 'A marketplace freelancer.', is_system_role: true },
  { name: 'SUPER_ADMIN', description: 'Full administrative access.', is_system_role: true },
];

const paymentMethods = [
  { name: 'KBZ_PAY', display_name: 'KBZPay' },
  { name: 'WAVE_MONEY', display_name: 'Wave Money' },
  { name: 'BANK_TRANSFER', display_name: 'Bank Transfer' },
];

const packageTiers = [
  { name: 'BASIC', display_name: 'Basic', sort_order: 1 },
  { name: 'STANDARD', display_name: 'Standard', sort_order: 2 },
  { name: 'PREMIUM', display_name: 'Premium', sort_order: 3 },
];

const experienceLevels = [
  { name: 'BEGINNER', display_name: 'Beginner', sort_order: 1 },
  { name: 'INTERMEDIATE', display_name: 'Intermediate', sort_order: 2 },
  { name: 'EXPERT', display_name: 'Expert', sort_order: 3 },
];

const adminRoles = [
  { name: 'SUPER_ADMIN', description: 'Full administrative access.' },
  { name: 'FINANCE_ADMIN', description: 'Payment and escrow administration.' },
  { name: 'MODERATION_ADMIN', description: 'User and marketplace moderation.' },
];

const auditActions = [
  { name: 'VERIFY_PAYMENT', category: 'PAYMENTS' },
  { name: 'REJECT_PAYMENT', category: 'PAYMENTS' },
  { name: 'MODERATE_USER', category: 'USERS' },
  { name: 'RESOLVE_DISPUTE', category: 'DISPUTES' },
];

const subscriptionPlans = [
  {
    name: 'FREE_CLIENT',
    audience: 'CLIENT' as const,
    level: 'FREE' as const,
    max_job_posts: 3,
    max_packages: 3,
    ai_sourcing_enabled: false,
    ai_search_mode: 'BASIC',
    commission_rate: 0,
  },
  {
    name: 'FREE_FREELANCER',
    audience: 'FREELANCER' as const,
    level: 'FREE' as const,
    max_job_posts: 3,
    max_packages: 3,
    ai_sourcing_enabled: false,
    ai_search_mode: 'BASIC',
    commission_rate: 10,
  },
  {
    name: 'GOLD_CLIENT',
    audience: 'CLIENT' as const,
    level: 'GOLD' as const,
    max_job_posts: 100,
    max_packages: 3,
    ai_sourcing_enabled: true,
    ai_search_mode: 'AGENT',
    commission_rate: 0,
  },
];

const platformDocuments = [
  {
    title: 'Escrow',
    content: [
      'An order starts in AWAITING_ESCROW when a client buys a package or accepts a custom offer.',
      'Workroom chat is read-only until an administrator verifies the client payment proof and the order becomes ACTIVE.',
      'When the client approves the completed work, the order becomes COMPLETED, the clean file is unlocked, and funds are released to the freelancer.',
      'An order may become DISPUTED or CANCELED according to the marketplace dispute and funding rules.',
    ].join(' '),
  },
  {
    title: 'Watermark Lock',
    content: [
      'When a freelancer uploads a deliverable, the backend creates a low-resolution watermarked preview stamped DRAFT and a separate clean high-resolution file.',
      'While an order is IN_REVIEW, clients may access only the watermarked preview.',
      'The clean file is exposed only after the order becomes COMPLETED.',
    ].join(' '),
  },
  {
    title: 'Subscription Plans',
    content: [
      'Subscription plans limit marketplace actions for the active plan.',
      'Free clients receive basic AI search only. Pro clients can use the AI agent and proactive AI sourcing.',
      'Free freelancers may create up to three active packages and pay a ten percent platform commission.',
      'Pro freelancer access requires administrator approval, a success rate above ninety percent, and more than five completed projects.',
    ].join(' '),
  },
];

function toVectorLiteral(values: number[]): string {
  if (values.length !== 1536 || !values.every((value) => Number.isFinite(value))) {
    throw new Error('Platform document embedding must contain 1536 finite values.');
  }

  return `[${values.join(',')}]`;
}

async function bootstrapSuperAdmin(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { id: true },
  });

  if (user === null) {
    throw new Error('SUPER_ADMIN_USER_ID must reference an existing nondeleted public user.');
  }

  const role = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
    select: { id: true },
  });
  const adminRole = await prisma.adminRole.findUnique({
    where: { name: 'SUPER_ADMIN' },
    select: { id: true },
  });

  if (role === null || adminRole === null) {
    throw new Error('SUPER_ADMIN role configuration is missing.');
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    await transaction.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: role.id,
        },
      },
      update: {},
      create: {
        user_id: userId,
        role_id: role.id,
      },
    });

    await transaction.adminProfile.upsert({
      where: { user_id: userId },
      update: {
        admin_role_id: adminRole.id,
        is_active: true,
      },
      create: {
        user_id: userId,
        admin_role_id: adminRole.id,
        is_active: true,
      },
    });
  });
}

async function main(): Promise<void> {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role,
    });
  }

  for (const paymentMethod of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: paymentMethod.name },
      update: paymentMethod,
      create: paymentMethod,
    });
  }

  for (const packageTier of packageTiers) {
    await prisma.packageTier.upsert({
      where: { name: packageTier.name },
      update: packageTier,
      create: packageTier,
    });
  }

  for (const experienceLevel of experienceLevels) {
    await prisma.experienceLevel.upsert({
      where: { name: experienceLevel.name },
      update: experienceLevel,
      create: experienceLevel,
    });
  }

  for (const adminRole of adminRoles) {
    await prisma.adminRole.upsert({
      where: { name: adminRole.name },
      update: adminRole,
      create: adminRole,
    });
  }

  for (const auditAction of auditActions) {
    await prisma.auditAction.upsert({
      where: { name: auditAction.name },
      update: auditAction,
      create: auditAction,
    });
  }

  if (environment.SUPER_ADMIN_USER_ID !== undefined) {
    await bootstrapSuperAdmin(environment.SUPER_ADMIN_USER_ID);
  } else {
    console.warn('SUPER_ADMIN_USER_ID is not configured. Admin bootstrap was skipped.');
  }

  for (const subscriptionPlan of subscriptionPlans) {
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: subscriptionPlan.name },
      select: { id: true },
    });

    if (existingPlan === null) {
      await prisma.subscriptionPlan.create({ data: subscriptionPlan });
    } else {
      await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: subscriptionPlan,
      });
    }
  }

  for (const platformDocument of platformDocuments) {
    const embedding = await createTextEmbedding(`${platformDocument.title}\n${platformDocument.content}`);
    const vector = toVectorLiteral(embedding);

    await prisma.$transaction(async (transaction) => {
      const document = await transaction.platformDocument.upsert({
        where: { title: platformDocument.title },
        update: { content: platformDocument.content },
        create: platformDocument,
        select: { id: true },
      });

      await transaction.$executeRaw`
        UPDATE platform_documents
        SET embedding = ${vector}::vector, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${document.id}::uuid
      `;
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
