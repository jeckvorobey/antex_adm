export type MarketingProvider = string;
export type MarketingCampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface CampaignCreatePayload {
  name: string;
  provider: MarketingProvider;
  medium?: string;
  externalId?: string;
  objective?: string;
  status: MarketingCampaignStatus;
  budget?: number;
  currency: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
}

export interface MarketingCampaign extends CampaignCreatePayload {
  id: number;
  code: string;
  link: string;
  marketParameter: string;
  createdAt: string;
  updatedAt: string;
  attributedUsers: number;
  applications: number;
  campaignType: 'paid' | 'free';
}

export interface MarketingPlatform {
  slug: string;
  name: string;
}

export interface MarketingCurrency {
  code: string;
  name: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface DailyMetricPayload {
  impressions: number;
  starts: number;
  spend: number;
  platformCpm?: number;
}

export interface MarketingApplicationRow {
  campaignId: number;
  campaignName: string;
  code: string;
  provider: string;
  status: MarketingCampaignStatus;
  currency: string | null;
  attributedUsers: number;
  applications: number;
  uniqueApplicants: number;
  completedApplications: number;
  attributionToApplicationRate: number | null;
  applicationCompletionRate: number | null;
  spend: number;
  costPerApplication: number | null;
}

export interface MarketingDashboard {
  summary: Record<string, number | null>;
  funnel: Array<{ stage: string; value: number }>;
  timeSeries: Array<Record<string, string | number>>;
  campaignComparison: MarketingApplicationRow[];
  spendByCurrency: Array<{ currency: string; spend: number }>;
  appliedFilters: Record<string, string | number | null>;
}
