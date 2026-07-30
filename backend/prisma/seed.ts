import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { config } from 'dotenv';

type LoadedEnvironment = {
  DIRECT_URL: string;
};

const loadedEnvironment = config();
const directUrl = loadedEnvironment.parsed?.DIRECT_URL;

if (!directUrl) {
  throw new Error('DIRECT_URL must be defined in backend/.env before seeding.');
}

const environment: LoadedEnvironment = {
  DIRECT_URL: directUrl,
};

const adapter = new PrismaPg({ connectionString: environment.DIRECT_URL });
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
];

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
