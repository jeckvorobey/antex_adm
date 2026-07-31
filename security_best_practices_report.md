# Security Best Practices Report

## Краткое резюме

Проверены изменённые dashboard-компоненты и связанные frontend/security-точки admin на Vue 3/TypeScript/Vite. В новом коде валютных маркеров подтверждённых уязвимостей не найдено: SVG берутся только из статического allowlist, пользовательский HTML и динамический JavaScript не используются. Ниже перечислены существующие риски и hardening-наблюдения вне текущего UI-изменения.

## Область проверки

- Изменённые файлы dashboard, marker-компонент и тесты.
- `admin/src/boot/axios.ts`, `admin/src/stores/auth.ts`.
- Preview рассылки и sanitizer в `admin/src/utils/telegramHtml.ts`.
- Видимые production-конфигурации `admin/nginx.conf`, `admin/Dockerfile`, `admin/index.html`.

## Findings

### SBP-001 — токены admin хранятся в localStorage

- **Rule ID:** VUE-SECRETS-001 / безопасное хранение сессии
- **Severity:** High
- **Location:** `src/stores/auth.ts:20-21`, `src/boot/axios.ts:10-29`
- **Evidence:** access и refresh tokens записываются в `localStorage`, затем читаются для каждого запроса и refresh.
- **Impact:** при успешной XSS-атаке JavaScript сможет прочитать refresh token и получить длительный доступ к admin API.
- **Fix:** перевести refresh-сессию на `HttpOnly; Secure; SameSite` cookie с согласованной CSRF-защитой backend; access token держать только в памяти либо использовать серверную cookie-сессию.
- **Mitigation:** строгий CSP на edge/nginx, короткий TTL access token, ротация и отзыв refresh token.
- **False positive notes:** это существующая auth-архитектура, не добавленная текущим dashboard change; перед миграцией проверить backend refresh/logout contract.

### SBP-002 — HTML preview требует поддержания sanitizer-контракта

- **Rule ID:** VUE-XSS-001
- **Severity:** Low (hardening)
- **Location:** `src/pages/BroadcastsPage.vue:81,166`, `src/utils/telegramHtml.ts:1-139`
- **Evidence:** preview рендерится через `v-html`, перед этим вызываются `normalizeTelegramHtml` и `telegramPreviewHtml`; sanitizer реализован локально.
- **Impact:** будущая ошибка в allowlist, обработке URL или добавление нового HTML-тега может превратить preview в XSS sink.
- **Fix:** сохранить строгую allowlist-модель, добавить regression tests для `script`, event attributes, `javascript:`/`data:` URL и неизвестных тегов; рассмотреть well-reviewed sanitizer при расширении Telegram HTML.
- **Mitigation:** не принимать произвольные HTML-шаблоны, держать CSP без `unsafe-eval`/`unsafe-inline`.
- **False positive notes:** в текущей реализации текст экранируется, атрибуты не переносятся, а ссылки проверяются по allowlist протоколов; подтверждённый exploit в рамках этого review не найден.

### SBP-003 — security headers не видны в admin deployment config

- **Rule ID:** frontend production hardening
- **Severity:** Medium (environment-dependent)
- **Location:** `nginx.conf:1-17`
- **Evidence:** видимая конфигурация задаёт static serving и cache headers, но не задаёт CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` и `Permissions-Policy`.
- **Impact:** фактическая защита зависит от внешнего reverse proxy/CDN; при отсутствии edge headers снижается защита от XSS impact и clickjacking.
- **Fix:** добавить согласованные response headers в nginx или подтвердить их на edge/CDN; CSP сначала проверить в report-only режиме.
- **Mitigation:** не считать отсутствие headers доказанным production-инцидентом без проверки публичного ответа.
- **False positive notes:** headers могут добавляться за пределами репозитория; требуется runtime/infra verification.

## Текущий change

Изменения `DashboardCurrencyMarker.vue` используют только импортированные `Usdt-icon.svg`/`atxg.svg` и статическую таблицу флагов. Новых dangerous sinks, динамической загрузки ресурсов, секретов или изменения auth/API-контрактов не добавлено.

## Рекомендации

SBP-001 и SBP-003 лучше вынести в отдельные OpenSpec changes, чтобы не смешивать миграцию admin auth/edge security с визуальным dashboard change. SBP-002 следует закрепить тестами при следующем изменении Telegram HTML preview.
