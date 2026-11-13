# Скиллы агента

Библиотека скиллов, которую opencode подхватывает из `.agents/skills` — путь задан в `opencode.json`. Нужна, чтобы на чистом раннере GitHub Actions у агента были те же скиллы, что и на машине разработчика, а не только инструкции из `AGENTS.md` и `docs/agents/`.

## Источники и лицензии

- 38 скиллов — [mattpocock/skills](https://github.com/mattpocock/skills), MIT, © 2026 Matt Pocock. Текст лицензии — в `LICENSE`.
- `find-skills` — [vercel-labs/skills](https://github.com/vercel-labs/skills), MIT.

Версии и хеши папок зафиксированы в `.skill-lock.json`. Содержимое скиллов при копировании не редактировалось: обновлять их нужно переустановкой из источника, а не правкой в этом репозитории.
