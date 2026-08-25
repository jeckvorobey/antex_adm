import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('AntEx Admin design-system contract', () => {
  it('defines the canonical Quasar brand and Admin semantic token layer', () => {
    const config = read('quasar.config.ts');
    const styles = read('src/css/app.scss');

    expect(config).toContain("primary: '#FFB300'");
    expect(config).toContain("secondary: '#123530'");
    expect(config).toContain("accent: '#F1C769'");
    expect(styles).toContain('--antex-admin-surface-page: #0f2a26;');
    expect(styles).toContain('--antex-admin-surface-card: #123530;');
    expect(styles).toContain('--antex-admin-text-primary: #ffffff;');
    expect(styles).toContain('--antex-admin-radius-card: 18px;');
  });

  it('gives confirmed icon-only actions accessible names', () => {
    const layout = read('src/layouts/MainLayout.vue');
    const users = read('src/pages/UsersPage.vue');
    const rates = read('src/pages/aex/AexRatesSettingsPage.vue');
    const settings = read('src/pages/SettingsPage.vue');

    expect(layout).toMatch(/icon="menu"[^>]*aria-label="Открыть навигацию"/s);
    expect(layout).toMatch(/icon="logout"[^>]*aria-label="Выйти"/s);
    expect(users).toMatch(/icon="vpn_key"[^>]*aria-label="Создать реферальный код"/s);
    expect(rates.match(/icon="delete"[^>]*aria-label="Удалить ставку"/gs)).toHaveLength(2);
    expect(settings).toMatch(/icon="delete"[^>]*aria-label="Удалить рекламную платформу"/s);
    expect(settings).toMatch(/icon="delete"[^>]*aria-label="Удалить валюту маркетинга"/s);
  });
});
