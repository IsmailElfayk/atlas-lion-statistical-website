# Atlas Lions — External APIs & Database Storage Report

## Overview

The backend pulls data from **three external sources** and persists it across **six MongoDB collections**, with **Upstash Redis** as an in-memory cache layer. A nightly cron job (00:00 UTC) orchestrates the full pipeline; a safety-net retry fires at 00:30 UTC if the primary run had errors or synced fewer than 20 players.

---

## 1. External APIs

### 1.1 API-Football
| Property | Value |
|---|---|
| Base URL | `https://v3.football.api-sports.io` |
| Auth | `x-apisports-key: <key>` (request header) |
| Free-tier quota | **100 requests / day per key** |
| Keys supported | Up to **7 rotating keys** (`API_FOOTBALL_KEY1` … `API_FOOTBALL_KEY7`) |
| Throttle | 7 000 ms between requests (≤ 10 req/min) |
| Timeout | 15 000 ms |

**Key rotation logic:**  
Before the first request on each key, a pre-flight `GET /status` call checks remaining quota. If `requests.current >= 99`, or the response body contains any `errors` object, the key is marked exhausted and the next key is used automatically. All 7 keys share a single in-process rotation state reset to zero at the start of every nightly sync.

#### Endpoints Called

| Endpoint | Parameters | Purpose | Triggered by |
|---|---|---|---|
| `GET /status` | _(none)_ | Pre-flight quota check per key | Key rotation, every new key |
| `GET /leagues` | `type=League`, `current=true` | List all active leagues; filters to those in `LEAGUE_BUCKET_MAP` | `syncLeagues()` |
| `GET /teams` | `league={id}`, `season={year}` | Teams competing in a league this season | `syncClubs()` — once per tracked league |
| `GET /players` | `league={id}`, `season={year}`, `page={n}` | All players in a league (paginated, max 3 pages/league); non-Botola leagues keep only Moroccan nationality | `syncPlayers()` |
| `GET /players` | `nationality=Morocco`, `season={year}`, `page={n}` | Full paginated list of all Moroccan players globally | `nightlySync()` Step 2 |
| `GET /fixtures` | `league={id}`, `season={year}` | All fixtures for a league/season | `syncFixtures()` |
| `GET /fixtures` | `player={id}`, `season={year}`, `last=35` | Last 35 fixtures played by a specific player | `nightlySync()` Step 3 |
| `GET /fixtures/players` | `fixture={id}` | Full player statistics for one match (ratings, goals, assists, cards, minutes) | `syncRatings()` and `nightlySync()` Step 3 — cached in-process per fixture |
| `GET /injuries` | `league={id}`, `season={year}` | Injury/suspension reports per league | `syncInjuries()` |
| `GET /injuries` | `player={id}`, `season={year}` | Injury/suspension for one specific player | `nightlySync()` Step 4 |

---

### 1.2 TheSportsDB
| Property | Value |
|---|---|
| Base URL | `https://www.thesportsdb.com/api/v1/json/123` |
| Auth | Public key `123` — no sign-up required |
| Rate limit | 30 requests / minute |
| Timeout | 10 000 ms |

#### Endpoints Called

| Endpoint | Parameters | Purpose | Triggered by |
|---|---|---|---|
| `GET /searchteams.php` | `t={teamName}` | Fetch club badge URL (`strTeamBadge`) and primary colour (`strColour1`) | `syncClubs()` — once per club, 100 ms delay between calls |

---

### 1.3 StatsBomb Open Data
| Property | Value |
|---|---|
| Base URL | `https://raw.githubusercontent.com/statsbomb/open-data/master/data` |
| Auth | None — public GitHub raw file CDN |
| Rate limit | None (GitHub CDN) |
| Timeout | 30 000 ms (event files are large) |
| Redis cache TTL | **7 days** per file path |

**Morocco team ID in StatsBomb:** `1763`

**Competitions tracked:**

| Competition | `competition_id` | `season_id` |
|---|---|---|
| FIFA World Cup 2018 | 1 | 1 |
| FIFA World Cup 2022 | 43 | 3869 |
| AFCON 2019 | 6 | 1 |

#### Endpoints Called

| File path | Purpose | Triggered by |
|---|---|---|
| `/competitions.json` | Full list of available competitions/seasons | `syncStatsBombEvents()` — fetched once per sync |
| `/matches/{competition_id}/{season_id}.json` | All matches in a competition/season; filtered to those where Morocco played | `syncStatsBombEvents()` — once per relevant competition |
| `/events/{match_id}.json` | Full event stream (~3 000–5 000 events per match); aggregates shots, key passes, progressive carries per Morocco player | `syncStatsBombEvents()` — once per Morocco match |

**xT proxy formula computed from events:**
```
raw_xT = (shots × 0.10 + key_passes × 0.07 + progressive_carries × 0.03) × 90 / minutes
```
Then z-scored across all players and scaled to **[3.0, 10.0]** centred at 6.5 → stored as `Rating.normalisedCustom`.

---

## 2. Caching Layer — Upstash Redis

| Cache key pattern | Content | TTL | Set by | Used by |
|---|---|---|---|---|
| `bestxi:{formation}:{window}:{buckets}:{method}:{minMin}` | Full Best XI JSON response | 1 hour | `getBestXI()` controller | `getBestXI()` controller |
| `sb:{path}` | Raw StatsBomb JSON file (competitions, matches, events) | 7 days | `statsbombCached()` helper | `syncStatsBombEvents()` |

After every nightly sync, all `bestxi:*` keys are evicted via Redis `SCAN` (`preWarmCache()`) so stale lineups are not served.

---

## 3. MongoDB Database Collections

Database name: `atlas-lions` (configurable via `MONGO_URI` / `MONGODB_URI` env var)

---

### 3.1 `leagues`

Sourced from: **API-Football** `GET /leagues`

| Field | Type | Source / Notes |
|---|---|---|
| `apiFootballId` | Number (indexed) | `league.id` from API response |
| `name` | String (required) | `league.name` |
| `country` | String | `country.name` |
| `tier` | Number | Not set by sync; can be set manually |
| `confederation` | Enum: UEFA/CAF/CONMEBOL/AFC/CONCACAF/OFC | Derived from `country.name` via static lookup |
| `bucket` | Enum: big5/other\_europe/botola/mena/americas/world | Looked up from `LEAGUE_BUCKET_MAP` |
| `hasEventData` | Boolean | Default `false` (StatsBomb coverage flag) |
| `hasSofascoreRatings` | Boolean | Default `true` |
| `logoUrl` | String | `league.logo` from API response |

Only leagues present in the internal `LEAGUE_BUCKET_MAP` are upserted.

---

### 3.2 `clubs`

Sourced from: **API-Football** `GET /teams` + **TheSportsDB** `GET /searchteams.php`

| Field | Type | Source / Notes |
|---|---|---|
| `apiFootballId` | Number (indexed) | `team.id` |
| `transfermarktId` | String | Not set by sync; manual enrichment |
| `name` | String (required) | `team.name` |
| `shortName` | String | First 6 chars of name, uppercased |
| `league` | ObjectId → League | Looked up by `apiFootballId` |
| `country` | String | `team.country` or league country |
| `logoUrl` | String | TheSportsDB `strTeamBadge` if available, else API-Football `team.logo` |
| `color` | String | TheSportsDB `strColour1` as hex (e.g. `#C8102E`) |

---

### 3.3 `players`

Sourced from: **API-Football** `GET /players` (two paths: by-league and by-nationality)

| Field | Type | Source / Notes |
|---|---|---|
| `slug` | String (unique) | URL-safe slugified full name |
| `externalIds.apiFootball` | Number (indexed) | `player.id` — primary lookup key |
| `externalIds.sportsdb` | String | Not set by sync; reserved for future enrichment |
| `externalIds.transfermarkt` | String | Not set by sync; reserved for future enrichment |
| `sofascoreId` | Number | Legacy field |
| `apiFootballId` | Number | Legacy field |
| `transfermarktId` | String | Legacy field |
| `wikidataQid` | String | Not set by sync |
| `fullName` | String (required) | `player.name` (HTML entities decoded) |
| `fullNameAr` | String | Not set by sync; manual entry |
| `dob` | Date | `player.birth.date` |
| `age` | Number | `player.age` |
| `height` | Number (cm) | `player.height` parsed as integer |
| `preferredFoot` | Enum: Left/Right/Both | Not set by sync; `player.birth.country` incorrectly mapped (noted as a bug) |
| `photoUrl` | String | `player.photo` |
| `primaryPosition` | Enum (GK/CB/LB/…) | Normalised from `statistics[0].games.position` |
| `eligiblePositions` | [String] | Set to `[]` on insert |
| `isMoroccanNational` | Boolean | `true` for all synced players |
| `moroccoEligibility` | Enum: capped/eligible/switchable/ineligible | Default `eligible` on insert |
| `nationalities` | [String] | `[player.nationality]` |
| `currentClub` | ObjectId → Club | Looked up by `statistics[0].team.id`; club auto-upserted if missing |
| `marketValueEur` | Number | Not set by sync; manual enrichment |
| `marketValueUpdatedAt` | Date | Not set by sync |
| `archetypeLabel` | String | Not set by sync |
| `minutesCurrent` | Number | `statistics[0].games.minutes` (season total) |
| `status` | Enum: available/doubtful/injured/suspended | Reset to `available` each sync; updated by injury sync |
| `returnDate` | Date | `fixture.date` from injury response (expected return match date) |
| `lastSyncedAt` | Date | Timestamp of the nightly sync run |

**Text index:** `fullName` + `fullNameAr` (supports search queries).

---

### 3.4 `matches`

Sourced from: **API-Football** `GET /fixtures` (by-league) and `GET /fixtures` (by-player in nightly sync)

| Field | Type | Source / Notes |
|---|---|---|
| `apiFootballId` | Number | `fixture.id` |
| `league` | ObjectId → League | Looked up by name or `league.id` |
| `season` | String | e.g. `"2025"` |
| `kickoffUtc` | Date (indexed) | `fixture.date` |
| `homeClub` | ObjectId → Club | Looked up by `teams.home.id`; auto-upserted |
| `awayClub` | ObjectId → Club | Looked up by `teams.away.id`; auto-upserted |
| `homeScore` | Number | `goals.home` |
| `awayScore` | Number | `goals.away` |
| `status` | Enum: scheduled/in\_play/finished | Mapped from `fixture.status.short` (FT/AET/PEN → finished; 1H/2H/HT → in\_play) |
| `competition` | String | `league.name` from fixture response |
| `hasEventData` | Boolean | Default `false` |
| `moroccansPlaying` | [ObjectId → Player] | Players whose `currentClub` is one of the two clubs |

**Indexes:** `kickoffUtc` ascending, `league` ascending.

---

### 3.5 `ratings`

Sourced from: **API-Football** `GET /fixtures/players` and **StatsBomb** event files

| Field | Type | Source / Notes |
|---|---|---|
| `player` | ObjectId → Player (required) | Matched by `externalIds.apiFootball` |
| `match` | ObjectId → Match (required) | The match document for this fixture |
| `matchDate` | Date (indexed, required) | `fixture.date` |
| `competition` | String | League name (denormalised) |
| `homeTeam` | String | `teams.home.name` |
| `awayTeam` | String | `teams.away.name` |
| `homeScore` | Number | `goals.home` |
| `awayScore` | Number | `goals.away` |
| `minutes` | Number | `statistics[0].games.minutes` |
| `goals` | Number | `statistics[0].goals.total` |
| `assists` | Number | `statistics[0].goals.assists` |
| `yellowCards` | Number | `statistics[0].cards.yellow` |
| `redCards` | Number | `statistics[0].cards.red` |
| `saves` | Number | `statistics[0].goals.saves` (GK only) |
| `sofascoreRating` | Number (3–10) | `statistics[0].games.rating` — the Sofascore ML rating from the API |
| `fotmobRating` | Number | Not set by sync; reserved |
| `whoscoredRating` | Number | Not set by sync; reserved |
| `xtTotal` | Number | Not set by sync; reserved |
| `vaepTotal` | Number | Not set by sync; reserved |
| `normalisedCustom` | Number (3–10) | StatsBomb xT proxy, z-scored and scaled — set by `syncStatsBombEvents()` |
| `dataQuality` | Enum: event/rating/heuristic/none | `event` for Big 5 leagues or StatsBomb-enriched; `rating` for other leagues |

**Unique index:** `(player, match)` — prevents duplicate rating entries.  
**Cap:** Maximum **35 rating docs** per player; oldest rows are deleted when the cap is exceeded during nightly sync.

---

### 3.6 `synclogs`

Written at the end of every nightly sync run.

| Field | Type | Description |
|---|---|---|
| `startedAt` | Date (indexed desc) | Sync start timestamp |
| `finishedAt` | Date | Sync end timestamp |
| `durationMs` | Number | Wall-clock duration in milliseconds |
| `playersUpserted` | Number | Count of Player docs upserted this run |
| `ratingsUpserted` | Number | Count of Rating docs upserted this run |
| `keysUsed` | Number | How many API-Football keys were consumed |
| `requestsPerKey` | Mixed object | `{ "Key 1": 45, "Key 2": 32 }` — requests made per key |
| `errors` | [String] | Errors logged during the run |

The safety-net cron (00:30 UTC) reads the latest `SyncLog` from midnight and only re-runs if `errors.length > 0` or `playersUpserted < 20`.

---

## 4. Full Sync Pipeline (Execution Order)

```
nightlySync() / syncAll()
│
├── 1. apifootball.reset()           — reset key rotation counters
├── 2. GET /players (nationality=Morocco, paginated)
│        → upsert Players
├── 3. For each player:
│     ├── GET /fixtures (player=id, last=35)
│     │     → upsert Matches
│     └── GET /fixtures/players (fixture=id)  [cached per fixture]
│           → upsert Ratings (sofascoreRating, goals, assists, cards, minutes)
├── 4. For each player:
│     └── GET /injuries (player=id)
│           → update Player.status + returnDate
│
syncAll() additionally runs:
├── syncLeagues()   — GET /leagues
├── syncClubs()     — GET /teams  +  TheSportsDB /searchteams.php
├── syncFixtures()  — GET /fixtures (by league)
├── syncRatings()   — GET /fixtures/players (last 20 finished matches with Moroccans)
├── syncInjuries()  — GET /injuries (by league)
├── syncStatsBombEvents()
│     ├── GET /competitions.json
│     ├── GET /matches/{comp_id}/{season_id}.json  (filtered to Morocco matches)
│     └── GET /events/{match_id}.json              (aggregates xT proxy per player)
│           → update Rating.normalisedCustom
└── preWarmCache()  — evict all bestxi:* keys from Redis
```

---

## 5. Environment Variables Required

| Variable | Used by |
|---|---|
| `API_FOOTBALL_KEY1` … `API_FOOTBALL_KEY7` | API-Football multi-key rotation |
| `MONGO_URI` / `MONGODB_URI` | MongoDB connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis (caching) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis (caching) |
| `SYNC_SEASON` | Override the current football season (default: auto-detected) |

---

## 6. Data Quality Tiers

| Tier | Value | Meaning |
|---|---|---|
| `event` | Best | StatsBomb xT enriched **or** Big 5 league fixture (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) |
| `rating` | Good | API-Football Sofascore rating available; non-Big-5 league |
| `heuristic` | Fair | No rating available; fallback score of 6.0 used in lineup algorithm |
| `none` | Worst | No data at all |

The Best XI algorithm picks the rating score in this priority order per Rating doc: `sofascoreRating` → `normalisedCustom` → `fotmobRating` → `6.0` (heuristic).
