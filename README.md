# Ngo Boat Race — Soc Trang / Đua Ghe Ngo Sóc Trăng

**English (default)** · rhythm-racing H5 game inspired by the **Oóc Om Bóc** (*Oc Om Bok*) Khmer boat-racing festival on the **Maspéro River**, Soc Trang, Vietnam.

**Tiếng Việt** · game đua nhịp trên trình duyệt, lấy cảm hứng từ **lễ hội Oóc Om Bóc** — đua ghe Ngo truyền thống ven **sông Maspéro**, Sóc Trăng.

> *Row in rhythm — reach Soc Trang!* / *Chèo đúng nhịp — Về đích Sóc Trăng!*

---

## For English learners / Dành cho học sinh yêu tiếng Anh

- Default language is **English**; tap **EN | VN** (top-right) anytime.
- Read **Oóc Om Bóc Festival** from the home screen for cultural context, glossary, and vocabulary in context.
- Team mottos, story chapters, and race UI are written for clarity — not gaming slang.
- Some gameplay details are **simplified**; the real festival takes place on the Maspéro River in Soc Trang.

---

## How to play / Cách chơi

1. **Quick Play** — pick a Mekong Delta team and race.
2. **Tap in time with the drum** — keep **Rhythm** high to go faster.
3. Near the finish, trigger **Crowd cheer** (rapid taps) for a final burst.
4. **Story Mode** — village → district → inter-provincial → qualifiers → Soc Trang final.
5. **Daily Challenge** — one seed per day; scores can appear on the leaderboard when online.

---

## Quick start (developers)

**Requirements:** Node.js 18+, npm

```bash
npm install
npm run dev:all
```

| Service | URL |
|---------|-----|
| Game (Vite) | http://localhost:5173 |
| API (Fastify) | http://localhost:3000 |

Game only (no API):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Tests:

```bash
npm test
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (game) |
| `npm run dev:server` | Fastify API |
| `npm run dev:all` | Game + API together |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Game client | Vite, TypeScript, Phaser 3, PWA |
| UI / i18n | DOM HUD, EN/VN catalogs (`src/i18n/`) |
| API | Fastify (Node), optional for offline play |
| Tests | Vitest |

---

## Environment variables (optional)

Create `.env` in the project root if you need custom settings:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_VERSION=0.1.0
VITE_FEATURE_ONLINE_LEADERBOARD=true
VITE_FEATURE_CLOUD_SAVE=true
VITE_FEATURE_STORY_MODE=true
VITE_FEATURE_DAILY_CHALLENGE=true
VITE_FEATURE_GHOST_RACE=false
```

Vite proxies `/leaderboard`, `/scores`, `/daily`, etc. to port `3000` in dev (`vite.config.ts`).

Copy `.env.example` to `.env` for local overrides.

---

## Deploy (Vercel + Render)

### Frontend — Vercel

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |
| Install | `npm install` |

**Environment variables (required at build time):**

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://ngoboatrace-api.onrender.com` |
| `VITE_APP_VERSION` | `0.1.0` |
| Feature flags | See `.env.example` |

Run `npm run icons` once before the first deploy (or rely on CI) so PWA icons exist in `public/icons/`.

### Backend — Render

Use [`render.yaml`](render.yaml) or create a **Web Service**:

| Setting | Value |
|---------|-------|
| Start command | `npx tsx server/src/index.ts` |
| Health check | `GET /health` |

After Render deploys, copy the API URL into Vercel's `VITE_API_URL` and **redeploy** the frontend.

> **Beta note:** API data is stored in `server/data/db.json`. On Render's free tier, scores may reset when the service redeploys unless you add persistent storage or migrate to a database later.

### CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests, icon generation, and build on push/PR.

---

## Project documentation

| File | Contents |
|------|----------|
| [`gdd_gameplay.md`](gdd_gameplay.md) | Game design — core loop, mechanics |
| [`cau_truc_game.md`](cau_truc_game.md) | Technical architecture |
| [`le-hoi-ooc-om-boc.md`](le-hoi-ooc-om-boc.md) | Festival essay — bilingual combined (synced with in-app content) |
| [`src/content/festival/en.md`](src/content/festival/en.md) | In-app Festival (English) |
| [`src/content/festival/vi.md`](src/content/festival/vi.md) | In-app Festival (Vietnamese) |
| [`.cursor/rules/`](.cursor/rules/) | Cursor agent context (project, i18n, deploy, UI) |
| [`.env.example`](.env.example) | Environment variable template |

---

## Repository layout (short)

```
src/          Game client (Phaser scenes, UI, i18n, rhythm engine)
server/       Fastify API (leaderboard, daily seed, sync)
tests/        Unit tests
```

---

## Cultural note

This project celebrates **Khmer heritage** and **Mekong Delta** river culture through play. It is an educational experience — not an official event website. For authoritative festival information, refer to local Soc Trang sources and community organizations.

---

## License

Private project (`package.json`: `"private": true`). Contact the repository owner for reuse terms.
