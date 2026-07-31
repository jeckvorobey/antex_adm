# Marketing dashboard insights

## Why

The marketing dashboard receives funnel, campaign comparison and currency spend data from the backend, but currently hides part of it and presents KPI metrics as one undifferentiated grid. This makes campaign performance harder to understand and creates technical labels in the business UI.

## What changes

- Group KPI cards into traffic, conversion and cost sections.
- Use business-friendly Russian labels.
- Show the existing backend funnel when data is available.
- Add a daily conversion-rate chart derived from the existing time series.
- Show campaign comparison only when at least two campaigns are returned.
- Present spend separately by currency and never calculate a cross-currency total.
- Keep existing filters, Quasar components and ApexCharts integration.
- Extend tests for empty, funnel, comparison and currency-spend states.

## Scope

- `src/pages/ManagementDashboardPage.vue`
- `src/components/marketing/MarketingKpiCards.vue`
- `src/types/marketing.ts`
- `tests/unit/pages/ManagementDashboardPage.spec.ts`

No backend contract change is required.

## Acceptance criteria

- No `NaN` or `Infinity` is rendered.
- KPI cards remain two per row on small screens and are grouped by meaning.
- Funnel is rendered only when it contains non-zero data.
- Campaign comparison is rendered only for two or more campaigns.
- Spend is displayed per currency without summing different currencies.
- Empty and error states continue to work.
- Unit tests cover the new behavior.
