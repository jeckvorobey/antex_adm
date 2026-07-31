export type MarketingProvider = string;
export type MarketingCampaignStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface CampaignCreatePayload {
  codeToken?: string;
  name: string;
  provider: MarketingProvider;
  externalId?: string;
  objective?: string;
  status: MarketingCampaignStatus;
  budget?: number;
  currency: string;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
}

export interface CampaignCodePreview {
  code: string;
  token: string;
}

export interface MarketingCampaign extends CampaignCreatePayload {
  id: number;
  code: string;
  link: string;
  marketParameter: string;
  createdAt: string;
  updatedAt: string;
  attributedUsers: number;
  newUsers: number;
  returningUsers: number;
  touches: number;
  uniqueTouchedUsers: number;
  applications: number;
  completedApplications: number;
  spend: number;
  costPerNewUser: number | null;
  costPerApplication: number | null;
  costPerCompletedApplication: number | null;
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
  newUsers: number;
  returningUsers: number;
  touches: number;
  uniqueTouchedUsers: number;
  applications: number;
  newUserApplications: number;
  returningUserApplications: number;
  uniqueApplicants: number;
  completedApplications: number;
  attributionToApplicationRate: number | null;
  newUserToApplicationRate: number | null;
  touchToApplicationRate: number | null;
  applicationCompletionRate: number | null;
  spend: number;
  costPerApplication: number | null;
  costPerNewUser: number | null;
  costPerCompletedApplication: number | null;
}

export interface MarketingApplicationAttribution {
  orderId: number;
  publicNumber: string;
  userId: number;
  campaignId: number;
  campaignName: string;
  userState: 'new' | 'returning';
  attributionType: 'acquisition' | 'reengagement';
  touchAt: string;
  applicationAt: string;
  hoursToApplication: number;
  status: number;
  completed: boolean;
}

export interface MarketingDashboardSummary {
  attributedUsers?: number | null;
  newUsers?: number | null;
  returningUsers?: number | null;
  touches?: number | null;
  uniqueTouchedUsers?: number | null;
  applications?: number | null;
  uniqueApplicants?: number | null;
  completedApplications?: number | null;
  attributionToApplicationRate?: number | null;
  applicationCompletionRate?: number | null;
  spendTotal?: number | null;
  costPerApplication?: number | null;
  costPerAttributedUser?: number | null;
  costPerNewUser?: number | null;
  costPerCompletedApplication?: number | null;
}

export interface MarketingFunnelStage {
  stage: string;
  value: number;
}

export interface MarketingTimeSeriesRow {
  date: string;
  newUsers: number;
  returningUsers: number;
  touches: number;
  applications: number;
  completedApplications: number;
  [key: string]: string | number;
}

export interface MarketingDashboard {
  summary: MarketingDashboardSummary;
  funnel: MarketingFunnelStage[];
  timeSeries: MarketingTimeSeriesRow[];
  campaignComparison: MarketingApplicationRow[];
  spendByCurrency: Array<{ currency: string; spend: number }>;
  appliedFilters: Record<string, string | number | null>;
}
