# BorderlessHire

BorderlessHire is a two-part Next.js app for international students in Singapore: a sponsor-friendly job board that surfaces roles more likely to support Employment Pass hiring, and an interview coach that helps candidates rehearse company-specific answers before applying.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add your `OPENAI_API_KEY`.
3. Add your `APIFY_API_TOKEN` if you want live portal discovery from job-board search results. Without it, the board still falls back to direct company-careers apply links.
4. Start the app with `npm run dev`, or build it for production with `npm run build`.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

If you want to run the production build locally instead:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Available scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## COMPASS explainer

COMPASS is Singapore’s points-based framework for Employment Pass applications. In practice, salary, qualifications, diversity, and skills shortage signals all affect whether a role is likely to strengthen a candidate’s profile. The board’s COMPASS points are directional estimates only, intended to help students compare roles rather than predict MOM outcomes.
