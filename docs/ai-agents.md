# AI Agents Workflow

## Роли

- Product Agent: страницы, UX-сценарии, тексты, композиция виджетов.
- Engineering Agent: архитектура, shared-код, типы, интеграции, проверки качества.

## Протокол работы

1. Проверить `git status --short`.
2. Определить затронутые слои: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
3. Не менять файлы вне задачи и не форматировать весь проект без необходимости.
4. Для новой фичи сначала добавить модель/типы в `entities` или `features`, затем UI, затем подключение на уровне `widgets/pages`.
5. Перед завершением выполнить минимум `npm run lint` и `npm run typecheck`.
6. Для календарных сценариев держать route state в формате `/:view/:firstDay`, где `view` = `month | week | list`.

## Границы слоев

- `shared` не импортирует проектные слои.
- `entities` импортирует только `shared`.
- `features` импортирует `entities` и `shared`.
- `widgets` импортирует `features`, `entities`, `shared`.
- `pages` импортирует `widgets`, `features`, `entities`, `shared`.
- `app` собирает провайдеры и маршруты.

## Calendar Decisions

- FullCalendar отвечает только за визуализацию и взаимодействие с сеткой.
- События хранятся в доменной модели `entities/event`, а в формат FullCalendar мапятся отдельной функцией.
- Календари и источники синхронизации живут в `entities/calendar`.
- Интеграции CalDAV/WebCal добавляются сервисами, а не напрямую в UI-компоненты.
