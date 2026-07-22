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

export const MARKETING_APPLICATION_STATUS_OPTIONS = [
  { label: 'Создана', value: 1 },
  { label: 'В обработке', value: 2 },
  { label: 'Завершена', value: 3 },
  { label: 'Отменена', value: 4 },
] as const;
