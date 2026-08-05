export type ApplicationRole = string;
export type UserStatus = 'LEAD' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type AuthenticatedUser = {
  id: string;
  email: string;
  status: UserStatus;
  roles: ApplicationRole[];
};
