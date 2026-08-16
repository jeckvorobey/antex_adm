# Устранение внешней зависимости Dockerfile админки

## Проблема

Coolify не может начать сборку админки при временном сбое DNS для
`production.cloudfront.docker.com`: директива `# syntax=docker/dockerfile:1.7`
заставляет BuildKit скачать внешний Dockerfile frontend до обработки базового
образа. Docker 28.5.1 уже поддерживает используемый `RUN --mount=type=cache`
через встроенный frontend.

## Изменение

- Не загружать отдельный внешний Dockerfile frontend перед сборкой.
- Сохранить cache mount для Yarn через встроенный frontend BuildKit.
- Не менять Node.js, Nginx, зависимости и команды сборки.

## Проверка

- Регрессионный тест должен подтверждать отсутствие внешней syntax-директивы и
  сохранение cache mount.
- Выполнить production build админки.
