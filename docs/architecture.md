# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep API calls in route components through the shared client and render loading, empty, error, and populated states.
- Logic tier decision: Keep Express routes thin and put validation, persistence, aggregation, and recommendations in the service layer.
- Data tier decision: Enforce required fields in Mongoose schemas and keep seed upserts idempotent without clearing unrelated records.
- Activity tracking approach: Validate user and team IDs and existence, then store the activity with points computed from minutes and an occurrence timestamp.
- Team management approach: Require a non-empty name and mascot, validate member IDs, and preserve submitted team details.
- Leaderboard approach: Sum activity points by team, sort highest first, and assign each entry a 1-based rank.
- Workout suggestions approach: Match the user's goal first, use recent activity as a secondary signal, explain each match, and return 404 for an unknown user.

## Current assessment

The presentation tier owns rendering and API calls through the shared client; the logic tier owns request validation and service behavior; the data tier owns Mongoose validation, persistence, and seeding. Keep these responsibilities within their existing directories and preserve the relative `/api` proxy boundary.

Baseline observed on 2026-10-26: the data suite has 4 failures and 1 pass (the idempotent seed test passes); the API suite has 4 failures; the frontend suite has 15 failures. The starter scaffold is intentionally incomplete. Data failures point to missing schema validation; API failures point to unimplemented or incorrect service behavior; frontend failures point to missing API rendering and loading, empty, or error states.

Smallest safe implementation order:

1. Complete Mongoose schema validation and preserve the passing seed idempotency behavior.
2. Implement activity and team service operations, then leaderboard aggregation and user-specific workout suggestions; verify the API contract after each capability group.
3. Implement the four frontend views using the shared API client, including loading, empty, error, and populated states.
4. Run all contract suites and both builds.


## Test plan

Run the focused contract suite after changing its tier. A data failure indicates missing schema validation, relationship, or seed behavior; an API failure indicates request handling or service behavior; a frontend failure indicates API consumption, rendered content, or an accessible state is missing. Build failures indicate TypeScript or production bundling issues.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
