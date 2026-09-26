# frontend — ТЗ (React SPA)

> **Роль:** дашборд продажника (рейтинг лидов, карточка компании с доказательствами, живой прогресс) и настройки
> администратора (услуги, вопросы, ICP, правила, скоринг, аккаунты, автопоиск).
> **Владельцы:** F1 — сторона продаж (shell, auth, Prospects, Company, Runs) · F2 — сторона администратора
> (Settings, Accounts, Discovery, Quality)
> **Потребляет:** REST и SSE `core` через клиент, сгенерированный из OpenAPI ([core/SPEC.md](https://github.com/MacLovins/backend/blob/main/core/SPEC.md) §1.4.1)
> **Связано:** [ARCHITECTURE.md](https://github.com/MacLovins/backend/blob/main/ARCHITECTURE.md) §3.1 (экраны конвейера), §4.5 (потоки), §4.12 (демо)
> **Репозитории:** этот — `MacLovins/frontend`; бэкенд и общая архитектура — `MacLovins/backend`. Клонируйте оба рядом
> (`LeadRadar/backend`, `LeadRadar/frontend`), тогда агенту доступен `@../backend/ARCHITECTURE.md`.
> **Закрывает:** K4, K2 (UI настроек), K1 (прозрачность и фидбек) · S1–S5, S10, S17, S19 · A1, A3, A4

---

## 0. Как пользоваться этим файлом

- Базовый шаблон уже в репозитории: Vite 8, React 19, TypeScript 6, Tailwind 4, shadcn (стиль `base-nova` на Base UI),
  иконки Phosphor, npm. Добавляем: TanStack Query и Table, react-router 7, react-hook-form + zod, sonner, MSW, Vitest, Orval.
- **Contract-first:** P1 обновляет `openapi.json` в репо backend; `npm run sync:api` копирует его сюда из соседнего клона
  `../backend`, `npm run gen:api` (Orval) генерирует типы, хуки TanStack Query и MSW-моки. С часа 2 фронт работает на
  моках (`VITE_MOCK=true`) и не ждёт бэкенд.
- Для агента: один экран или компонент из §1.3 + макет из §1.7 + команда проверки. API вызываем **только** через
  сгенерированные хуки (кроме SSE-хука).

---

## 1. Этап 1 — MVP

### 1.1 Цель

Продажник без AI-экспертизы за 10 секунд понимает, кому писать сегодня и почему. Администратор за минуту меняет
вопросы, веса и ICP и сразу видит, как меняется рейтинг. Каждый сигнал можно проверить по цитате и ссылке и оценить.

### 1.2 Границы

| Входит                                                                                         | Не входит                                                                               |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Экраны §1.3, генерация клиента, SSE + polling, роли в UI, состояния загрузки, пустоты и ошибки | Любая бизнес-логика скоринга: UI только показывает значения API                         |
| Ссылки для ручной проверки ЛПР в LinkedIn (без запросов к LinkedIn)                            | i18n (английский UI; подписи собраны в одном словаре — задел)                           |
| P1: Quality, Fit × Intent, экспорт, подсказка вопросов от AI, история скора, лента активности  | Надстройки (outreach, алерты, HubSpot) — после ядра; тёмная тема, мобильная версия — P2 |

### 1.3 Экраны и функции

| ID    | Экран / функция                                                                                                                                                            | Маршрут                  | Роль   | Владелец | Пр.        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ | -------- | ---------- |
| FE-01 | Донастройка шаблона: роутер, провайдеры (Query, Toaster), ESLint (bulletproof-правила), Vitest, CI (GitHub Actions: lint, typecheck, test, build)                          | —                        | —      | F1       | P0         |
| FE-02 | Слой API: скрипты `sync:api` (копия `../backend/openapi.json`) и `gen:api` (Orval: хуки + MSW + типы), клиент `credentials: 'same-origin'`, 401 → `/login`, ошибки → toast | —                        | —      | F2       | P0         |
| FE-03 | Login + `RequireAuth` + `RequireRole` (страница 403)                                                                                                                       | `/login`                 | —      | F1       | P0         |
| FE-04 | AppShell: навигация, переключатель услуги (в URL `?service=`), меню пользователя (роль, выход), кнопка Analyze                                                             | все                      | любой  | F1       | P0         |
| FE-05 | **Prospects:** рейтинг, счётчики тиров, фильтры, «почему сейчас», NEW, сортировка и пагинация на сервере, виджет precision                                                 | `/prospects`             | любой  | F1       | P0         |
| FE-06 | **Company:** шапка, вкладки услуг, ScoreCard, WhyNow, ScoreBreakdown, сигналы по вопросам, фидбек, ЛПР + LinkedIn-ссылки, заметки, вкладка Sources, повторный анализ       | `/companies/:id`         | любой  | F1       | P0         |
| FE-07 | **Runs:** диалог запуска, прогресс по компаниям и стадиям (SSE + polling), retry failed, список прогонов                                                                   | `/runs`, `/runs/:id`     | любой  | F1       | P0         |
| FE-08 | **Accounts:** таблица компаний, добавление, импорт CSV с отчётом, массовый анализ, удаление (admin)                                                                        | `/accounts`              | любой  | F2       | P0         |
| FE-09 | **Discovery:** форма из ICP → кандидаты с Fit → выбор → добавить → «анализировать»                                                                                         | `/accounts/discover`     | любой  | F2       | P0         |
| FE-10 | **Settings → Services:** список, форма услуги, применить пресет (IA, Cyber)                                                                                                | `/settings/services`     | admin  | F2       | P0         |
| FE-11 | **Settings → Questions:** таблица с inline-весом, диалог вопроса, статус и редактор ключевых слов, баннер «переанализировать»                                              | `…/:serviceId/questions` | admin  | F2       | P0         |
| FE-12 | **Settings → ICP:** must-have (страны с пресетами регионов, индустрии, размер, выручка) + nice-to-have с весами                                                            | `…/:serviceId/icp`       | admin  | F2       | P0         |
| FE-13 | **Settings → Rules:** таблица и конструктор (фирмографика, сигнал, список доменов; exclude / cap / flag)                                                                   | `…/:serviceId/rules`     | admin  | F2       | P0         |
| FE-14 | **Settings → Scoring:** веса H/M/L, баланс Fit и сигналов, штраф за риск, пороги тиров, полураспады, мин. уверенность; сохранение → toast с итогом пересчёта               | `…/:serviceId/scoring`   | admin  | F2       | P0         |
| FE-15 | Quality: precision (всего, по категориям и источникам), отклонённое верификатором, использование AI за сутки                                                               | `/quality`               | любой  | F2       | P1         |
| FE-16 | Fit × Intent (scatter с квадрантами) — альтернативный вид Prospects                                                                                                        | `/prospects?view=matrix` | любой  | F1       | P1         |
| FE-17 | CSV-экспорт рейтинга, история скора (sparkline), лента активности, «Suggest questions with AI»                                                                             | разные                   | разные | F1 / F2  | P1         |
| FE-18 | Надстройки после ядра: модалка outreach-черновика, кнопка «Push to HubSpot», настройки алертов                                                                             | разные                   | разные | F1 / F2  | После ядра |

### 1.4 Входы и выходы

- **Вход:** `openapi.json` (снимок из core, копия из репо backend) → `src/api/generated/*`. Эндпоинты и схемы —
  [core/SPEC.md](https://github.com/MacLovins/backend/blob/main/core/SPEC.md) §1.4.1.
- **SSE:** `POST /api/v1/runs/{id}/events` (fetch + `eventsource-parser`), события `run.progress`, `company.stage`,
  `company.done`, `run.finished`. При переподключении передаём `Last-Event-ID`.
- **Auth:** cookie `lr_session` (httpOnly) ставит бэкенд. Фронт токен не видит. Текущий пользователь — `GET /auth/me`.
- **Выход:** действия пользователя → мутации (конфигурация, компании, прогоны, фидбек, импорт).
- **Перечисления и подписи** (tier, source_type, category, stage) — словарь `src/lib/labels.ts` (единственное место
  человеческих формулировок).

### 1.5 Зависимости

| Тип            | Что                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm            | `react@19`, `react-dom`, `react-router@7`, `@tanstack/react-query@5`, `@tanstack/react-table@8`, `tailwindcss@4`, `shadcn` (base-nova, `@base-ui/react`), `react-hook-form`, `zod@4`, `@hookform/resolvers`, `recharts` (shadcn charts), `date-fns`, `sonner`, `zustand`, `eventsource-parser`, `@phosphor-icons/react` (уже в шаблоне); dev: `orval`, `msw`, `vitest`, `@testing-library/react`, `eslint` + `eslint-plugin-import`, `prettier`, `typescript` |
| От других репо | `openapi.json` из репо backend (H4 — первый, H8 — рабочий, H24 — заморожен)                                                                                                                                                                                                                                                                                                                                                                                   |
| Окружение      | `VITE_API_BASE=/api/v1`, `VITE_MOCK=false`. Dev-прокси Vite: `/api` → `http://localhost:8000`. Прод — Caddy отдаёт `dist/` и проксирует `/api`                                                                                                                                                                                                                                                                                                                |

### 1.6 Структура папки (bulletproof-react, P10)

```
frontend/ (корень репо MacLovins/frontend)
├── SPEC.md · package.json · package-lock.json · vite.config.ts · tsconfig*.json · eslint.config.js · components.json
├── orval.config.ts · openapi.json (копия из backend) · Dockerfile   # Dockerfile: npm run build → статика для Caddy
├── .github/workflows/ci.yml
└── src/
    ├── app/        main.tsx · providers.tsx · router.tsx · routes/ (страницы собирают features)
    ├── api/        client.ts · generated/ (Orval: хуки, модели, msw)
    ├── components/ ui/ (shadcn) · layout/ (AppShell, Sidebar, Topbar, ServiceSwitcher)
    │               common/ (TierBadge, ScoreBar, SubScore, SourceIcon, RelativeDate, EmptyState, ErrorState, InfoTip)
    ├── features/
    │   ├── auth/        LoginForm, useAuth, RequireAuth, RequireRole
    │   ├── prospects/   ProspectsTable, ProspectsFilters, TierCounters, TopReasons, PrecisionBadge, FitIntentChart (P1)
    │   ├── company/     CompanyHeader, ScoreCard, WhyNow, ScoreBreakdown, SignalsByQuestion, SignalCard,
    │   │                FeedbackButtons, DecisionMakers, NotesForm, SourcesTab, ScoreHistory (P1)
    │   ├── runs/        StartAnalysisDialog, RunProgress, RunsList, useRunEvents
    │   ├── accounts/    CompaniesTable, AddCompanyDialog, CsvImportDialog, DiscoveryPanel
    │   ├── settings/    ServicesList, ServiceForm, PresetsPanel, QuestionsTable, QuestionDialog, KeywordsEditor,
    │   │                IcpForm, RulesTable, RuleDialog, ScoringProfileForm
    │   └── quality/     QualityDashboard, UsageWidget (P1)
    ├── lib/        labels.ts · format.ts · sse.ts · favicon.ts · linkedin.ts
    ├── stores/     ui.ts (zustand: выбранная услуга, синхронизация с URL)
    └── testing/    msw-handlers.ts · render.tsx
```

Правило ESLint `import/no-restricted-paths`: `features/*` не импортируют друг друга, `components` и `lib` не
импортируют `features`, `app` собирает всё.

### 1.7 Макеты экранов и поведение

**FE-05 Prospects** (главный экран, K4):

```
┌ Intelligent Automation ▾ ─────────────────────────────── [Analyze] ─ admin@… ┐
│ Hot 12 · Warm 19 · Cold 21 · Disqualified 4       Signal precision 86% (124) │
│ [Search…] [Country ▾] [Industry ▾] [Tier ▾] [☐ New signals] [Min priority ━●] │
├──┬─────────────────────┬──────────────┬─────────────────────┬───────────────┬────────┤
│# │ Company             │ Priority     │ Fit · Signals · Risk│ Why now       │ Signals│
├──┼─────────────────────┼──────────────┼─────────────────────┼───────────────┼────────┤
│1 │ 🟦 DHL Group  DE    │ 69 🔥 Hot    │ ▇▇▇▇ ▇▇▇▇ ▇▇        │ • Uses agentic│ 7 NEW 2│
│  │ dhl.com · Logistics │              │                     │   AI for RFQs │        │
│  │                     │              │                     │   dhl.com · 3m│        │
└──┴─────────────────────┴──────────────┴─────────────────────┴───────────────┴────────┘
```

Колонки: ранг; компания (favicon, название, домен, флаг страны, индустрия); Priority (число + TierBadge);
три мини-полосы Fit / Buying signals / Blockers с подсказками; до 3 причин с источником и относительной датой;
число сигналов и бейдж NEW. Клик по строке открывает Company. Сортировка, фильтры и пагинация (50 строк) — на сервере,
состояние в URL. Пустое состояние: «Пока нет лидов → Проанализировать демо-аккаунты». Загрузка — скелетоны.

**FE-06 Company:**

```
┌ 🟦 DHL Group · dhl.com ↗ · Germany · Logistics · 590k employees      [Re-analyze] ┐
│ [Intelligent Automation] [Cybersecurity]                                          │
│ ┌ Priority 69 🔥 Hot ─┐  Fit 92 ⓘ   Buying signals 81 ⓘ   Blockers 38 ⓘ           │
│ Why now                                                                            │
│  ✓ Uses agentic AI to process customer RFQs (Strategy 2030) — dhl.com · Jun 2026 ↗│
│  ✓ Hiring 6 automation & AI engineers — Workday · 2 weeks ago ↗                   │
│  ⚠ Large in-house automation capability and third-party AI partners              │
│ Score breakdown  [How is this calculated?]                                         │
│  Automation & AI projects (H) ██████████ +2.5                                      │
│  Hiring (H)                   █████      +1.3                                      │
│  In-house capability (M)      ████       −1.0                                      │
│ Evidence by question ▾                                                             │
│  ▸ Automation & AI projects — strong                                               │
│    "…deploying agentic AI to handle RFQ processing…"  dhl.com · 18 Jun 2026 ↗     │
│    ●●● strong · 90%            [✓ Correct] [✗ Wrong] [⊘ Not relevant]              │
│ Decision makers to validate: COO · CIO · Head of Automation  [Find on LinkedIn ↗] │
│ Notes / LinkedIn URL [__________]                        Sources: news 23 · web 12 │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- Цитата показывается на языке оригинала, резюме — на английском. Флаги (fuzzy quote, headline only, corroborated,
  derived) — маленькие бейджи с подсказкой.
- Фидбек — оптимистичное обновление + toast. «Wrong» убирает сигнал из скоринга (бэкенд пересчитывает, UI обновляет карточку).
- ЛПР: для каждой должности из услуги — ссылка
  `https://www.linkedin.com/search/results/people/?keywords=<title>%20<company>` в новой вкладке. Запросов к LinkedIn из
  приложения нет (S10).
- Re-analyze → `POST /runs` → прогресс inline (стадии), в конце — перезапрос карточки.
- Вкладка Sources: что просканировано (заголовок, источник, дата, ссылка), фильтр по типу — прозрачность для K1.

**FE-07 Runs.** Прогресс-бар (done / total, failed, paused), строки компаний со степпером стадий
`resolving → collecting → indexing → prefiltering → extracting → verifying → scoring → done`, последнее сообщение,
кнопка «Retry failed». Хук `useRunEvents(runId)`:

1. `fetch(POST …/events, {headers: {Accept: 'text/event-stream', 'Last-Event-ID': lastId}})` + `eventsource-parser`;
   keep-alive-комментарии (каждые 15 с) считаются признаком жизни.
2. Нет событий 20 с или две ошибки подряд → polling `GET /runs/{id}` каждые 3 с.
3. `company.done` → invalidate `['leads', serviceId]` и `['lead', companyId]`. `run.finished` → стоп и toast.

**FE-11 Questions** (K2): таблица — текст, категория, полярность (+/−), вес (сегмент H/M/L, inline → PATCH → toast
«Ranking updated: 3 tier changes»), источники (чипы), окно (дни), статус ключевых слов (pending / ready / failed),
активность. Диалог вопроса: textarea с примерами формулировок, категория, полярность, вес, источники, окно.
После сохранения ключевые слова генерируются: пока `pending`, запрос обновляется каждые 3 с, затем редактор чипов по языкам.
Баннер «N questions changed — re-analyze affected companies». P1: «Suggest questions with AI» → черновики с чекбоксами.

**FE-14 Scoring.** Каждый контрол подписан одной фразой простого языка. Пример: «Half-life for news: after 120 days a
news signal counts half as much». Сохранение → PUT → toast `Rescored 58 companies in 0.8 s, 4 tier changes`.

### 1.8 UX-принципы (K4, S19)

- **Простой язык** (`labels.ts`): Intent → «Buying signals», Risk → «Blockers», Fit → «ICP fit»; категории — человеческие
  («Cost reduction program», «Automation & AI projects», «New leadership»…). В UI нет слов embedding, LLM, token, RRF
  (кроме блока «AI usage» на Quality).
- У каждого числа есть подсказка «что это значит и как считается».
- Цвет не единственный носитель смысла: зелёный + ✓ для позитива, красный + ⚠ для блокеров, серый + ⊘ для
  дисквалификации; контраст WCAG AA.
- Состояния: скелетоны, пустые состояния со следующим действием, ошибки с повтором, toasts на мутации.
- Быстродействие: серверная пагинация, `staleTime` 30 с, оптимистичный фидбек, никакой клиентской фильтрации больших списков.
- Клавиатура: строки таблиц фокусируются, Enter открывает; диалоги доступны (Base UI).
- Разрешение: desktop-first, удобно от 1280 px.

### 1.9 План работ

| Окно    | F1 (сторона продаж)                                                                           | F2 (сторона администратора)                                             |
| ------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| H0–H2   | FE-01: донастройка шаблона, providers, layout, CI                                             | FE-02: `sync:api` + Orval + MSW, мок-данные, `labels.ts`, дизайн-токены |
| H2–H8   | FE-03, FE-04, FE-05 на моках, каркас FE-06                                                    | FE-10, FE-11 на моках, FE-08 (таблица + добавление)                     |
| H8–H12  | FE-05 и FE-06 на живом API, FE-07 (SSE + polling)                                             | FE-11 на живом API + редактор ключевых слов                             |
| H12–H24 | FE-06 полностью: breakdown, why now, сигналы, фидбек, ЛПР, Sources, re-analyze; фильтры FE-05 | FE-12, FE-13, FE-14 (мгновенный пересчёт), импорт CSV, FE-09            |
| H24–H32 | UX фидбека, все состояния, FE-16 (P1), полировка                                              | FE-15 (P1), виджет precision, полировка                                 |
| H32–H40 | E2E-проход, баги, доступность                                                                 | E2E-проход, баги                                                        |
| H36–H44 | FE-18 (outreach-модалка), если ядро готово                                                    | FE-18 (HubSpot, алерты), если ядро готово                               |
| H40–H48 | Полировка демо-сценария (ARCHITECTURE §4.12)                                                  | Полировка демо-сценария                                                 |

### 1.10 Критерии готовности (DoD)

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` зелёные (и в CI); в консоли браузера нет ошибок.
- [ ] `VITE_MOCK=true npm run dev` — все экраны работают на моках.
- [ ] С бэкендом: вход admin и sales; sales не видит Settings, прямой URL даёт страницу 403.
- [ ] Prospects показывает ранжированных лидов обеих услуг; переключение услуги меняет рейтинг; фильтры и сортировка
      сохраняются в URL.
- [ ] Company: у каждого сигнала есть цитата, ссылка и дата; фидбек сохраняется после перезагрузки;
      Re-analyze показывает прогресс и обновляет скор.
- [ ] Прогресс прогона обновляется в реальном времени через Cloudflare; при отключённом SSE (тест) работает polling.
- [ ] Accounts: добавление, импорт CSV с отчётом, автопоиск с добавлением работают.
- [ ] Settings: смена веса → рейтинг изменился ≤ 2 с (toast с итогом); новый вопрос → ключевые слова появились;
      правило exclude → компания стала Disqualified с причиной.
- [ ] Тесты: `useRunEvents` (fallback на polling, fake timers), `ScoreBreakdown`, `QuestionDialog` (валидация),
      Prospects и Company на MSW.

### 1.11 Какие критерии закрывает модуль (MVP)

| ID          | Как                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| K4, S19     | Простой язык, «почему сейчас», тиры, подсказки, состояния, пресеты из коробки, живой прогресс                             |
| K2, S1–S5   | Экраны услуг, вопросов (вес, полярность, источники, окно, ключевые слова), ICP, правил, скоринга с мгновенным результатом |
| K1          | Цитата + ссылка + дата у каждого сигнала, вкладка Sources, фидбек, виджет precision                                       |
| K5          | SSE с fallback на polling, типизированный клиент из OpenAPI, моки                                                         |
| S10, A4     | ЛПР из услуги → ссылки для ручной проверки в LinkedIn, заметки и `linkedin_url`                                           |
| S17, A1, A3 | Why now, breakdown, экраны повторяют конвейер; сила, свежесть и полярность видны у сигнала                                |

---

## 2. Этап 2 — продуктовый фронтенд

### 2.1 Цель

Ежедневный рабочий инструмент SDR-команд многих организаций: персональные представления, уведомления, работа
с outreach и CRM прямо из интерфейса, расширение браузера для ручной проверки.

### 2.2 Функции

| Область         | Функции                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Работа с лидами | Сохранённые представления и территории, заметки и задачи, назначение ответственного, массовые действия, сравнение компаний                                                                 |
| Outreach        | Редактор черновиков (email, LinkedIn InMail, звонок) с вставкой сигналов-цитат, тон и язык, A/B-варианты                                                                                   |
| Интеграции      | Статус синхронизации HubSpot / Salesforce у лида, push одним кликом, история                                                                                                               |
| Уведомления     | Центр уведомлений, правила алертов, дайджесты                                                                                                                                              |
| Настройки       | Песочница вопроса (проверить на 5 компаниях до сохранения), what-if симулятор весов с превью изменения рейтинга, конструктор AND/OR, библиотека шаблонов, версии профилей с diff и откатом |
| Аналитика       | Воронка «сигнал → встреча → сделка», ROI-дашборд, качество по источникам и вопросам, тренды рынка                                                                                          |
| Платформа       | i18n (EN / RO / RU / DE), тёмная тема, мобильная версия, SSO-вход, переключатель организаций, white-label под тенанта                                                                      |
| Расширение      | Chrome-расширение: скор и сигналы на сайте компании и на её странице в LinkedIn (только чтение нашего API; LinkedIn не скрейпим)                                                           |
| Качество        | Playwright E2E в CI, Storybook для дизайн-системы, аудит доступности, мониторинг ошибок (Sentry)                                                                                           |

### 2.3 Входы и выходы (изменения)

Новые ресурсы API (`/views`, `/alerts/rules`, `/integrations/*`, `/outreach/*`) приходят новыми сгенерированными хуками.
Push-уведомления — через тот же SSE-канал или WebSocket.

### 2.4 Зависимости

`react-i18next`, Storybook, Playwright, Sentry, сборка расширения (Vite + CRXJS), OIDC-клиент для SSO.

### 2.5 Критерии готовности этапа 2

Время до первого полезного экрана ≤ 1.5 с; accessibility ≥ 95 (Lighthouse); E2E покрывает ключевые сценарии; четыре
языка; расширение опубликовано во внутреннем канале.

### 2.6 Критерии, которые усиливает этап 2

K4 (ежедневный инструмент), K2 (песочница, what-if), K6 (мультитенантность, white-label, ROI-дашборд), S14, S15.

---

## 3. Рост и развитие: что заложено в MVP и как расширять

| Заложено в MVP                                                         | Зачем                                 | Как растёт на этапе 2                                                  |
| ---------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Клиент и моки, сгенерированные Orval из OpenAPI                        | Параллельная работа, типобезопасность | Новые эндпоинты = новые хуки без ручного кода                          |
| Feature-папки с запретом кросс-импортов                                | Независимые фичи                      | outreach, alerts, integrations, views — новые папки, старые не трогаем |
| Единый словарь `labels.ts`                                             | Простой язык в одном месте            | Переносится в i18n-ресурсы                                             |
| Состояние экрана в URL (услуга, фильтры, сортировка)                   | Шаринг ссылок                         | Сохранённые представления и территории                                 |
| Хук `useRunEvents` (SSE + polling)                                     | Надёжный real-time                    | Центр уведомлений и общий канал событий                                |
| Презентационные компоненты `TierBadge`, `ScoreBreakdown`, `SignalCard` | Переиспользование                     | Те же компоненты в Chrome-расширении и в письмах-дайджестах            |
| Дизайн-токены shadcn / Tailwind                                        | Единый стиль                          | Темы и white-label для тенантов                                        |

---

## 4. Риски и анти-паттерны

- **Не пересчитывать скор на клиенте** — только отображать значения из API (иначе UI и бэкенд разойдутся).
- **Не делать fetch мимо сгенерированного клиента** (кроме SSE-хука).
- **Не хранить токен в localStorage** — авторизация только через httpOnly-cookie.
- Не фильтровать и не сортировать большие списки на клиенте.
- Не использовать AI-жаргон в интерфейсе продажника.
- Не блокировать UI на время анализа — прогресс асинхронный, пользователь может уйти на другие экраны.
- Не менять `openapi.json` вручную — только через `lr export-openapi` в backend (P1), затем `npm run sync:api && npm run gen:api`.
