# Восстановление Dockerfile админки

## Проблема

В ветке `dev` Dockerfile админки расходится с рабочими Dockerfile production
админки и Mini App: удалена директива BuildKit frontend, необходимая сборочному
контуру с `RUN --mount=type=cache`.

## Изменение

- Восстановить `# syntax=docker/dockerfile:1.7`.
- Не менять Node.js, Nginx, зависимости и команды сборки.

## Проверка

- Dockerfile `dev` должен совпадать с рабочим Dockerfile `origin/main`.
- Выполнить production build админки.
