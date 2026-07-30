type OnboardingUserStatus = 'LEAD' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export function canCreateOnboardingProfile(
  status: OnboardingUserStatus,
  selectedProfileExists: boolean,
): boolean {
  return (status === 'LEAD' || status === 'ACTIVE') && !selectedProfileExists;
}
