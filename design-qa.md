# Dashboard visual QA

**Source visual truth**

- Desktop: `/home/serg/Develop/AntEx/tmp/file_000000002ab481f4a289bd95c2674a9a.png` (`1536 x 1120`, JPEG content).
- Mobile: `/home/serg/Develop/AntEx/tmp/file_00000000a3188243ac4b0efd83bc1e1b.png` (`694 x 1536`, JPEG content).

**Implementation target**

- Route: `/dashboard`.
- Intended viewports: desktop container at full available width and mobile at the reference aspect ratio.
- State: populated operational summary.
- Implementation screenshot: unavailable until local Playwright use is approved.

**Full-view comparison evidence**

- Both source originals were opened at original detail before implementation.
- Static implementation review confirms the desktop shell no longer has a local `max-width`, both desktop grids remain two-column, and the mobile breakpoint preserves vertical card stacking with a two-column rates table.
- A rendered full-view comparison is still required; static CSS and unit tests are not treated as visual evidence.

**Focused region comparison evidence**

- `Сегодня`: source values are centered inside their metric cells; implementation now centers the complete metric cell.
- `Оборот завершённых`: source uses distinct colored currency markers and stronger numeric values; implementation maps currencies to Quasar icons/colors and uses semibold tabular values.
- `Курсы`: source uses a dense two-column table with cell dividers and stronger primary values; implementation keeps this geometry, adds pair markers, and replaces the lower direction line with `Базовая цена` from the backend contract.
- Rendered focused crops are unavailable until browser capture is approved.

**Required fidelity surfaces**

- Fonts and typography: Roboto/Quasar typography retained; primary rate and turnover values use weight `600`, secondary base prices use smaller regular text.
- Spacing and layout rhythm: full-width desktop shell, paired desktop grids, compact two-column rate cells, vertical cell divider, and mobile-specific padding are implemented.
- Colors and tokens: Quasar semantic palette is used for currency markers; dashboard background, surfaces, borders, and semantic states remain aligned with the originals.
- Image quality and assets: the dashboard uses the existing Quasar icon libraries; no generated or placeholder raster assets were introduced.
- Copy and content: `Базовая цена` is backed by `baseRateDisplay`; no invented deltas or historical values are shown.

**Findings**

- [P1] Rendered desktop/mobile fidelity is not yet proven.
  - Evidence: source originals are available, but no implementation screenshots exist for same-viewport comparison.
  - Fix: capture `/dashboard` in a real browser at matching desktop and mobile viewports, compare combined source/implementation evidence, then correct any visible P1/P2 drift.

**Comparison history**

1. Static pass: corrected shell width, `Сегодня` alignment, turnover markers/weight, rates table structure, pair markers, and base-price copy.
2. Rendered pass: pending browser authorization.

**Implementation checklist**

- [x] Backend returns `baseRate` and `baseRateDisplay`.
- [x] Dashboard targeted Vitest passes (`7/7`).
- [x] ESLint and Quasar production build pass.
- [x] Strict `expanded-admin-dashboard` OpenSpec validation passes.
- [ ] Capture and compare desktop implementation.
- [ ] Capture and compare mobile implementation.
- [ ] Check browser console and primary refresh/navigation interactions.

final result: blocked
