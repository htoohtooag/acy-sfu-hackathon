import type { PaymentMethodLookup } from 'shared/schemas';

export type ExperienceLevelLookup = {
  id: string;
  name: string;
  display_name: string | null;
  sort_order: number;
};

export type PaymentMethodRecord = {
  id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
};

export type PaymentMethodDetails = Pick<PaymentMethodLookup, 'account_name' | 'account_number' | 'instructions'>;
