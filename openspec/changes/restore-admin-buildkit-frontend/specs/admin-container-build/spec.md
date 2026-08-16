## ADDED Requirements

### Requirement: Docker-сборка админки использует закреплённый BuildKit frontend

Dockerfile админки SHALL объявлять `docker/dockerfile:1.7` и сохранять общий с
Mini App build-stage на `node:24-alpine` для поддержки cache mount при установке
зависимостей.

#### Scenario: Coolify собирает админку из ветки dev

- **WHEN** Coolify запускает BuildKit-сборку Dockerfile админки
- **THEN** Dockerfile использует frontend `docker/dockerfile:1.7`
- **AND** команда `RUN --mount=type=cache` обрабатывается тем же сборочным контуром, что и в Mini App
