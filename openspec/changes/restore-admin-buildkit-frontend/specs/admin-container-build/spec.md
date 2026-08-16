## ADDED Requirements

### Requirement: Docker-сборка админки не зависит от внешнего Dockerfile frontend

Dockerfile админки SHALL использовать встроенный Dockerfile frontend BuildKit и
сохранять build-stage на `node:24-alpine` с cache mount при установке
зависимостей.

#### Scenario: Coolify собирает админку из ветки dev

- **WHEN** Coolify запускает BuildKit-сборку Dockerfile админки
- **THEN** перед обработкой базового образа не требуется загрузка отдельного
  `docker/dockerfile` frontend
- **AND** команда `RUN --mount=type=cache` обрабатывается встроенным frontend
  BuildKit
