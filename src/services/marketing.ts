import { api } from '@boot/axios';

import type {
  CampaignCreatePayload,
  DailyMetricPayload,
  MarketingApplicationRow,
  MarketingCampaign,
  MarketingDashboard,
  MarketingCurrency,
  MarketingPlatform,
  PaginatedResponse,
} from '@/types/marketing';

export const marketingApi = {
  async listPlatforms(): Promise<MarketingPlatform[]> {
    return (await api.get<MarketingPlatform[]>('/api/admin/marketing/platforms')).data;
  },

  async createPlatform(payload: MarketingPlatform): Promise<MarketingPlatform> {
    return (await api.post<MarketingPlatform>('/api/admin/marketing/platforms', payload)).data;
  },

  async listCurrencies(): Promise<MarketingCurrency[]> {
    return (await api.get<MarketingCurrency[]>('/api/admin/marketing/currencies')).data;
  },

  async createCurrency(payload: MarketingCurrency): Promise<MarketingCurrency> {
    return (await api.post<MarketingCurrency>('/api/admin/marketing/currencies', payload)).data;
  },

  async createCampaign(payload: CampaignCreatePayload): Promise<MarketingCampaign> {
    return (await api.post<MarketingCampaign>('/api/admin/marketing/campaigns', payload)).data;
  },

  async listCampaigns(
    params: Record<string, unknown>,
  ): Promise<PaginatedResponse<MarketingCampaign>> {
    return (
      await api.get<PaginatedResponse<MarketingCampaign>>('/api/admin/marketing/campaigns', {
        params,
      })
    ).data;
  },

  async updateCampaign(id: number, payload: Record<string, unknown>): Promise<MarketingCampaign> {
    return (await api.patch<MarketingCampaign>(`/api/admin/marketing/campaigns/${id}`, payload))
      .data;
  },

  async upsertDailyMetric(id: number, metricDate: string, payload: DailyMetricPayload) {
    return (
      await api.put(`/api/admin/marketing/campaigns/${id}/daily-metrics/${metricDate}`, payload)
    ).data;
  },

  async listApplications(
    params: Record<string, unknown>,
  ): Promise<PaginatedResponse<MarketingApplicationRow>> {
    return (await api.get('/api/admin/marketing/applications', { params })).data;
  },

  async dashboard(params: Record<string, unknown>): Promise<MarketingDashboard> {
    return (await api.get<MarketingDashboard>('/api/admin/marketing/dashboard', { params })).data;
  },
};
