# Atlas Lions Analytics

A full-stack Moroccan football intelligence platform. Tracks player ratings, builds optimised national team lineups, and surfaces national team statistics — built for real-time use during international windows.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Rating System](#rating-system)
- [Best XI Algorithm](#best-xi-algorithm)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment (Vercel)](#deployment-vercel)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 (no React Router — custom hash router) |
| Styling | CSS variables + inline styles (no CSS framework) |
| HTTP client | Axios |
| Backend | Node.js + Express 4 |
| Database | MongoDB + Mongoose 8 |
| Caching | Upstash Redis (REST-based, serverless-compatible) |
| Deployment | Vercel (static frontend + Node.js serverless backend) |
| Charts | Pure SVG (no chart library) |
| Export | `html-to-image` (PNG export of Best XI) |

---

## Project Structure

```
atlas-lions/
├── vercel.json              # Vercel deployment config
├── package.json             # Root scripts (dev, build, seed)
├── .env.example             # All env var documentation
│
├── backend/
│   ├── server.js            # Express app entry point
│   ├── config/
│   │   ├── db.js            # MongoDB connection
│   │   └── redis.js         # Upstash Redis client
│   ├── controllers/
│   │   ├── playerController.js
│   │   ├── lineupController.js
│   │   ├── fixtureController.js
│   │   ├── compareController.js
│   │   ├── clubController.js
│   │   ├── leagueController.js
│   │   └── metaController.js
│   ├── services/
│   │   ├── ratingService.js  # Window-based rating aggregation
│   │   └── lineupService.js  # Greedy Best XI optimiser
│   ├── models/
│   │   ├── Player.js
│   │   ├── Rating.js
│   │   ├── Match.js
│   │   ├── Club.js
│   │   └── League.js
│   ├── routes/
│   │   ├── playerRoutes.js
│   │   ├── lineupRoutes.js
│   │   ├── fixtureRoutes.js
│   │   ├── compareRoutes.js
│   │   ├── clubRoutes.js
│   │   ├── leagueRoutes.js
│   │   └── metaRoutes.js
│   ├── middleware/
│   │   ├── cache.js          # Upstash Redis cache middleware
│   │   ├── rateLimiter.js    # 300 req / 15 min per IP
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── apiResponse.js    # { data, meta, error } envelope
│   │   ├── formations.js     # 8 formation slot definitions
│   │   ├── positionMapping.js # POS_TO_SLOTS map
│   │   └── leagueBuckets.js
│   └── seed/
│       └── seed.js           # Seeds 30 players, 354 matches, ~386 ratings
│
└── frontend/
    ├── .env                  # VITE_API_URL (empty = use proxy/same domain)
    ├── vite.config.js        # Dev proxy: /api → localhost:3001
    └── src/
        ├── App.jsx           # Hash-based router switch
        ├── main.jsx
        ├── api/
        │   └── index.js      # Axios instance + all API calls
        ├── context/
        │   ├── RouterContext.jsx   # Custom hash router
        │   └── LanguageContext.jsx # AR / FR / EN i18n
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx      # Fixed nav + command palette (⌘K)
        │   │   └── Footer.jsx
        │   ├── bestxi/
        │   │   └── PitchView.jsx   # SVG pitch + player slots + subs drawer
        │   ├── player/
        │   │   └── Charts.jsx      # Rating history + market value SVG charts
        │   └── ui/
        │       └── index.jsx       # Button, Card, Checkbox, Slider, Spinner, …
        └── pages/
            ├── HomePage.jsx
            ├── BestXIPage.jsx      # Best XI lineup builder
            ├── PlayersPage.jsx     # Filterable player roster
            ├── PlayerDetailPage.jsx
            ├── FixturesPage.jsx
            ├── StatsPage.jsx       # National team dashboard
            ├── ComparePage.jsx     # Side-by-side player comparison
            ├── MethodologyPage.jsx
            └── NotFoundPage.jsx
```

---

## Architecture

```
Browser (React SPA)
       │
       │ hash routing (#/best-xi, #/players/hakimi, …)
       │
       ▼
  Vite Dev Server          Vercel CDN (production)
  proxy /api → :3001       routes /api → serverless fn
       │
       ▼
  Express API  (:3001 locally / serverless on Vercel)
       │
       ├── Rate limiter  (300 req / 15 min)
       ├── CORS
       ├── Route handlers
       │       │
       │       ├── Redis cache (Upstash REST)
       │       │     └── bestxi:* keys, TTL 3600s
       │       │
       │       └── MongoDB (Atlas)
       │             ├── Players
       │             ├── Ratings
       │             ├── Matches
       │             ├── Clubs
       │             └── Leagues
       │
       └── { data, meta, error } JSON envelope on every response
```

**All API responses** follow the same envelope:

```json
{
  "data": { ... },
  "meta": { ... },
  "error": null
}
```

Errors return a non-2xx status with `data: null` and `error: "message"`.

---

## Data Models

### Player

| Field | Type | Notes |
|---|---|---|
| `slug` | String (unique) | URL-safe identifier, e.g. `hakimi` |
| `fullName` | String | |
| `fullNameAr` | String | Arabic name |
| `primaryPosition` | Enum | GK CB LB RB LWB RWB CDM CM CAM LM RM LW RW SS ST DM AM WB |
| `eligiblePositions` | [String] | Additional slots player can fill |
| `moroccoEligibility` | Enum | `capped` `eligible` `switchable` `ineligible` |
| `currentClub` | ref → Club | |
| `status` | Enum | `available` `doubtful` `injured` `suspended` |
| `returnDate` | Date | Expected return from injury/suspension |
| `marketValueEur` | Number | |
| `minutesCurrent` | Number | Minutes played this season |
| `archetypeLabel` | String | e.g. "Inverted Fullback", "Destroyer" |

### Rating

| Field | Type | Notes |
|---|---|---|
| `player` | ref → Player | |
| `match` | ref → Match | |
| `matchDate` | Date | |
| `minutes` | Number | Minutes played in this match |
| `sofascoreRating` | Number | 3–10 scale |
| `normalisedCustom` | Number | xT/VAEP score, normalised to 3–10 |
| `dataQuality` | Enum | `event` > `rating` > `heuristic` > `none` |

### Match

| Field | Type | Notes |
|---|---|---|
| `league` | ref → League | |
| `season` | String | e.g. `2025-26` |
| `kickoffUtc` | Date | Used for window filtering |
| `homeClub` / `awayClub` | ref → Club | |
| `homeScore` / `awayScore` | Number | |
| `status` | Enum | `scheduled` `in_play` `finished` |
| `moroccansPlaying` | [ref → Player] | |

### Club

| Field | Type |
|---|---|
| `name` | String |
| `shortName` | String |
| `league` | ref → League |
| `country` | String |
| `color` | String (hex) |

### League

| Field | Type | Notes |
|---|---|---|
| `name` | String | |
| `country` | String | |
| `tier` | Number | |
| `confederation` | Enum | UEFA CAF CONMEBOL AFC CONCACAF OFC |
| `bucket` | Enum | `big5` `other_europe` `botola` `mena` `americas` `world` |
| `hasEventData` | Boolean | Whether xT/VAEP is available |
| `hasSofascoreRatings` | Boolean | |

---

## API Reference

Base URL — local: `http://localhost:3001/api` — production: `/api` (same domain via Vercel routes)

### Players

#### `GET /api/players`

List players with optional filters.

| Query param | Type | Description |
|---|---|---|
| `position` | string | Filter by `primaryPosition` (e.g. `RB`, `ST`) |
| `bucket` | string | League bucket (`big5`, `botola`, etc.) |
| `league` | string | League `_id` |
| `club` | string | Club name substring |
| `ageMax` | number | Maximum age |
| `search` | string | Full-name substring search |
| `page` | number | Default `1` |
| `limit` | number | Default `30` |

**Response**
```json
{
  "data": [ { "slug": "hakimi", "fullName": "Achraf Hakimi", "primaryPosition": "RB", "currentClub": { ... }, ... } ],
  "meta": { "total": 30, "page": 1, "limit": 30 },
  "error": null
}
```

---

#### `GET /api/players/:id`

Get a single player by `_id` or `slug`.

**Response** — `data` is the player object with populated `currentClub.league`.

---

#### `GET /api/players/:id/ratings`

Rating history for a player.

| Query param | Type | Description |
|---|---|---|
| `from` | ISO date | Start of range (default: 90 days ago) |
| `to` | ISO date | End of range (default: now) |

**Response**
```json
{
  "data": [
    { "matchDate": "2026-04-12T...", "sofascoreRating": 7.8, "minutes": 90, "dataQuality": "event" }
  ],
  "meta": { "count": 14 },
  "error": null
}
```

---

### Best XI Lineup

#### `GET /api/lineup/best-xi`

Build the optimised starting eleven for a given formation and date window.

| Query param | Type | Default | Description |
|---|---|---|---|
| `formation` | string | `4-3-3` | One of 8 formations (see below) |
| `window` | number | `30` | Days to look back: 15, 30, 45, 60, 75, 90 |
| `buckets` | string | `big5,other_europe,botola` | Comma-separated league buckets |
| `ratingMethod` | string | `commercial` | `commercial` (Sofascore) or `custom` (xT/VAEP) |
| `minMinutes` | number | `90` | Minimum minutes played in the window |

**Available formations:** `4-3-3`, `4-4-2`, `4-2-3-1`, `3-5-2`, `3-4-3`, `5-4-1`, `5-3-2`, `4-1-4-1`

**Response**
```json
{
  "data": {
    "formation": "4-3-3",
    "startingXI": [
      {
        "id": "GK", "slot": "GK", "label": "GK", "x": 340, "y": 430,
        "eligiblePositions": ["GK"],
        "player": {
          "slug": "bounou", "fullName": "Yassine Bounou",
          "primaryPosition": "GK", "avgRating": 7.8,
          "totalMinutes": 270, "dataQuality": "rating",
          "club": { "name": "Al-Hilal", "league": { "bucket": "mena" } },
          "status": "available"
        },
        "subs": [ { "slug": "munir", "fullName": "Munir Mohamedi", "avgRating": 7.2, ... } ]
      }
    ],
    "subsBySlot": { "GK": [ ... ], "LB": [ ... ] }
  },
  "meta": {
    "candidateCount": 28,
    "relaxedMinMinutes": false,
    "window": 30,
    "buckets": ["big5", "other_europe", "botola", "mena"],
    "ratingMethod": "commercial"
  },
  "error": null
}
```

**Caching:** Results are cached in Upstash Redis for **3600 seconds** keyed by all query parameters.

---

### Fixtures

#### `GET /api/fixtures`

Upcoming and recent matches.

| Query param | Type | Description |
|---|---|---|
| `buckets` | string | Comma-separated league buckets |
| `from` | ISO date | Start date (default: today) |
| `to` | ISO date | End date |
| `playerId` | string | Filter to matches where this player participated |

---

### Compare

#### `GET /api/compare`

Side-by-side stats for 2–4 players over a time window.

| Query param | Type | Description |
|---|---|---|
| `players` | string | Comma-separated player slugs or IDs (2–4) |
| `window` | number | Days to look back (default: 30) |

---

### Leagues & Clubs

#### `GET /api/leagues`
#### `GET /api/clubs`

Return all leagues / clubs with their populated references. No query params.

---

### Meta

#### `GET /api/meta/formations`

Returns the full formations object (slot definitions with `x`, `y`, `eligiblePositions`).

#### `GET /api/meta/options`

Returns enum options for position, bucket, and rating method — useful for populating filter dropdowns.

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `#/` | Home | Hero + trending players + next fixtures |
| `#/best-xi` | Best XI | Formation builder calling `GET /api/lineup/best-xi` |
| `#/players` | Players | Searchable, filterable roster |
| `#/players/:slug` | Player Detail | Stats, rating history chart, market value chart |
| `#/fixtures` | Fixtures | Upcoming matches grouped by date |
| `#/stats` | Stats | Morocco NT dashboard: form, KPIs, charts, top contributors |
| `#/compare` | Compare | Radar/bar comparison of 2–4 players |
| `#/methodology` | Methodology | Explanation of the rating system |

The app uses **hash-based routing** (`#/path`). The server always serves `index.html` and the client reads `window.location.hash` to decide which page to render.

---

## Rating System

### Data Quality Tiers (highest to lowest)

| Tier | Label | Source | Leagues |
|---|---|---|---|
| 1 | `event` | xT + VAEP from StatsBomb / Opta | Big 5 + Saudi Pro League |
| 2 | `rating` | Sofascore match rating | 200+ leagues |
| 3 | `heuristic` | Estimated from minutes + context | Botola, some MENA |
| 4 | `none` | No data | — |

### Average Calculation

For a given player over a time window, the average is **minutes-weighted**:

```
avgRating = Σ(score_i × minutes_i) / Σ(minutes_i)
```

- `commercial` method: uses `sofascoreRating`
- `custom` method: uses `normalisedCustom` (xT/VAEP), falls back to `sofascoreRating` where unavailable

Players with fewer minutes than `minMinutes` in the window are excluded. If fewer than 11 candidates pass the threshold, the threshold is automatically relaxed to 0.

### League Buckets

| Bucket | Coverage |
|---|---|
| `big5` | Premier League, La Liga, Bundesliga, Serie A, Ligue 1 |
| `other_europe` | Eredivisie, Jupiler Pro, Süper Lig, Super League Greece, … |
| `botola` | Botola Pro (Morocco) |
| `mena` | Saudi Pro League, Qatar Stars League, UAE Pro League |
| `americas` | MLS, Liga MX, … |
| `world` | All other / international |

---

## Best XI Algorithm

**Service:** `backend/services/lineupService.js`

The optimiser uses a **greedy-per-slot** approach (not Hungarian / global optimal):

1. Sort all candidates descending by `avgRating`.
2. For each of the 11 formation slots (in order):
   - Find the highest-rated unassigned candidate whose `primaryPosition` is in `slot.eligiblePositions`.
   - Assign that candidate to the slot and mark them as used.
3. For each slot, compute **substitutes**: all candidates whose `primaryPosition` is in `slot.eligiblePositions`, sorted descending by `avgRating`, excluding only that slot's own starter (up to 9 subs).

**Position eligibility** is determined by `slot.eligiblePositions` in `backend/utils/formations.js`. Each slot lists the player `primaryPosition` values it accepts — e.g. the DM slot in `4-2-3-1` accepts `['CDM', 'CM', 'DM']`.

**Why greedy instead of Hungarian?**  
The user requirement is strict: fill each slot with the best available player for that specific position. Global optimisation (Hungarian) maximises total team rating but can produce positional mismatches. Greedy-per-slot respects position purity.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL — caching disabled if absent |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| `PORT` | No | API port (default: `3001`) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Allowed origin (default: `*`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend base URL. **Leave empty** — Vite proxy handles local dev, Vercel routes handle production. Set only if frontend and backend are on different domains. |

---

## Local Development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier works)

### Setup

```bash
# 1. Install all dependencies
npm run install:all

# 2. Create backend env file
cp .env.example backend/.env
# Edit backend/.env — fill in MONGO_URI at minimum

# 3. Create frontend env file (VITE_API_URL can stay empty)
cp frontend/.env.example frontend/.env

# 4. Seed the database
npm run seed

# 5. Start both servers
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

### Available Scripts (root `package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run build` | Build frontend for production |
| `npm run vercel-build` | Alias for `build` (used by Vercel) |
| `npm run seed` | Seed / re-seed the database |
| `npm run install:all` | Install backend + frontend dependencies |

### Re-seeding

```bash
npm run seed
```

Seeds: 15 leagues, 30 clubs, 30 players, ~354 matches (one per league per match day, every 3–4 days over 90 days), ~386 ratings.

---

## Deployment (Vercel)

### How it works

```
vercel.json
  buildCommand  → npm run vercel-build   (builds frontend/dist)
  builds[0]     → backend/server.js      @vercel/node  (serverless function)
  builds[1]     → frontend/dist/**       @vercel/static (CDN)
  routes
    /api/*      → backend/server.js
    /assets/*   → frontend/dist/assets/*
    /*          → frontend/dist/index.html  (SPA fallback)
```

### Steps

1. Push the repo to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set the following **Environment Variables** in the Vercel project settings:

| Key | Value |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas URI |
| `UPSTASH_REDIS_REST_URL` | From Upstash dashboard (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash dashboard (optional) |
| `NODE_ENV` | `production` |

4. Deploy. Vercel runs `npm run vercel-build`, builds `frontend/dist`, and wraps `backend/server.js` as a serverless function.

> **`VITE_API_URL` is not needed** — the frontend defaults to `/api` and Vercel routes that to the backend serverless function on the same domain.

### `backend/server.js` serverless guard

```js
// Only starts a local HTTP server when run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Listening on ${PORT}`));
}
module.exports = app; // Vercel imports this
```
