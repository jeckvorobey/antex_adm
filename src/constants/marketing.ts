import type { MarketingCampaignStatus } from '@/types/marketing';

export interface MarketingCampaignStatusOption {
  label: string;
  value: MarketingCampaignStatus;
}

export const MARKETING_CAMPAIGN_STATUS_OPTIONS: MarketingCampaignStatusOption[] = [
  { label: 'Черновик', value: 'draft' },
  { label: 'Активна', value: 'active' },
  { label: 'Приостановлена', value: 'paused' },
  { label: 'В архиве', value: 'archived' },
];
