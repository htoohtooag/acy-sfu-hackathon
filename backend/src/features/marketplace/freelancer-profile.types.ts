import type { FreelancerPublicProfile, FreelancerWorkHistoryItem } from 'shared/schemas';
import type { Prisma } from '../../../prisma/generated/prisma/client.js';

export const freelancerProfileSelect = {
  id: true,
  user_id: true,
  headline: true,
  bio: true,
  skills: true,
  years_of_experience: true,
  location_city: true,
  success_rate: true,
  is_verified: true,
  completed_projects_count: true,
  ongoing_projects_count: true,
  user: {
    select: {
      id: true,
      full_name: true,
      avatar_url: true,
      orders_as_freelancer: {
        where: { deleted_at: null, status: { in: ['COMPLETED', 'ACTIVE', 'IN_REVIEW'] } },
        orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
        take: 20,
        select: {
          id: true,
          source_type: true,
          agreed_price_mmk: true,
          status: true,
          created_at: true,
          updated_at: true,
          package: { select: { title: true, features: true, deleted_at: true } },
          job_post: { select: { title: true, deleted_at: true } },
          reviews: {
            where: { is_public: true, deleted_at: null },
            orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
            select: { reviewee_id: true, rating: true, comment: true },
          },
        },
      },
    },
  },
  experience_level: { select: { id: true, name: true, display_name: true } },
  packages: {
    where: { deleted_at: null, is_active: true },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      title: true,
      price_mmk: true,
      delivery_days: true,
      tier: { select: { id: true, name: true, display_name: true } },
    },
  },
} satisfies Prisma.FreelancerProfileSelect;

export type FreelancerProfileRecord = Prisma.FreelancerProfileGetPayload<{
  select: typeof freelancerProfileSelect;
}>;

function getStringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function mapWorkHistory(record: FreelancerProfileRecord['user']['orders_as_freelancer'], userId: string): FreelancerWorkHistoryItem[] {
  return record.filter((order) => order.status === 'COMPLETED' || order.status === 'ACTIVE' || order.status === 'IN_REVIEW').map((order) => {
    const isCompleted = order.status === 'COMPLETED';
    const sourcePackage = order.package?.deleted_at === null ? order.package : null;
    const sourceJob = order.job_post?.deleted_at === null ? order.job_post : null;
    const review = order.reviews.find((item) => item.reviewee_id === userId);

    return {
      id: order.id,
      title: sourcePackage?.title ?? sourceJob?.title ?? 'Freelance project',
      rating: review?.rating ?? null,
      contract_type: order.source_type === 'PACKAGE' ? 'PACKAGE' : 'CUSTOM_OFFER',
      rate_mmk: order.agreed_price_mmk.toString(),
      start_date: order.created_at.toISOString(),
      end_date: isCompleted ? order.updated_at.toISOString() : null,
      review: review?.comment ?? null,
      skills: sourcePackage ? getStringArray(sourcePackage.features) : [],
      status: isCompleted ? 'completed' : 'in-progress',
    };
  });
}

export function mapFreelancerProfile(record: FreelancerProfileRecord): FreelancerPublicProfile {
  return {
    id: record.id,
    user_id: record.user_id,
    headline: record.headline,
    bio: record.bio,
    skills: record.skills,
    years_of_experience: record.years_of_experience,
    location_city: record.location_city,
    success_rate: record.success_rate.toString(),
    is_verified: record.is_verified,
    completed_projects_count: record.completed_projects_count,
    ongoing_projects_count: record.ongoing_projects_count,
    experience_level: record.experience_level,
    user: {
      id: record.user.id,
      full_name: record.user.full_name,
      avatar_url: record.user.avatar_url,
    },
    packages: record.packages.map((item) => ({
      id: item.id,
      title: item.title,
      price_mmk: item.price_mmk.toString(),
      delivery_days: item.delivery_days,
      tier: item.tier,
    })),
    work_history: mapWorkHistory(record.user.orders_as_freelancer, record.user.id),
  };
}
