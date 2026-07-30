export type ApplicationRole = string;

export type AuthenticatedUser = {
  id: string;
  email: string;
  roles: ApplicationRole[];
};
