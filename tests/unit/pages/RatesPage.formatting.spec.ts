import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ratesPagePath = resolve(process.cwd(), 'src/pages/RatesPage.vue');

describe('RatesPage formatting', () => {
  it('uses backend-prepared price display values', () => {
    const source = readFileSync(ratesPagePath, 'utf8');

    expect(source).toContain("field: 'baseRateDisplay'");
    expect(source).toContain("field: 'finalRateDisplay'");
    expect(source).not.toContain('formatRate(');
    expect(source).not.toContain("field: 'priceDisplay'");
  });
});
