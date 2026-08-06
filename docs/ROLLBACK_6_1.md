# Sprint 6.1 Rollback Instructions

In the event of a critical issue during Next.js deployment:

1. The legacy Vite/Express prototype remains fully preserved in `/legacy-vite-prototype`.
2. To restore the legacy Vite dev server:
   `cd legacy-vite-prototype && npm install && npm run dev`
3. The legacy prototype uses local state / memory store without affecting the new PostgreSQL database.
