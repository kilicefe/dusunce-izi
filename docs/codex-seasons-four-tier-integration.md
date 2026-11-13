# Codex handoff — Düşünce İzi × EduAnalytics Mevsimler tanılama

## Status
Feature implementation is on **codex/mevsimler-four-tier-eduanalytics** only. Do not merge to main or publish to students before running the checklist.

- Teacher launch: /dashboard/diagnostics
- Student public route: /diagnostic/[code]
- Results: /dashboard/diagnostics/[id]
- Teacher API: /api/diagnostics/seasons/teacher
- Student GET/POST: /api/diagnostics/seasons
- Instrument and deterministic four-tier scoring: src/lib/seasonsDiagnostic.ts
- Unit tests: src/lib/seasonsDiagnostic.test.ts

This feature reuses the existing Next.js 15 + Prisma/PostgreSQL infrastructure, User/Teacher auth, Classroom/StudentRoster, Exam/Question, QuestionExpectedConcept, QuestionMisconception, ExamAttempt, StudentResponse/TextResponse. **No schema migration** required by this initial implementation.

## How to check in Codex
1. Checkout the branch: git switch codex/mevsimler-four-tier-eduanalytics
2. npm ci; npx prisma generate; npm test -- --run src/lib/seasonsDiagnostic.test.ts; npm run lint; npm run build
3. Verify Vercel preview build and DATABASE_URL configuration without exposing secrets.
4. Log in as teacher; create a test class with synthetic identities, launch quiz; open share URL in incognito, answer all 10 questions, ensure 2× confidence 1..5 are required; submit.
5. Reload teacher report and verify 100-point dual correctness score, confident scientific count, misconception distributions and CSV.
6. Attempt to access other teacher's exam via API; expect 404/403. Attempt public answer-key access via GET; ensure none. Attempt repeat submission and forged identity; reject.
7. Confirm Turkish character handling and mobile controls at 375px viewport.

## Before a school-wide launch
- Add deployment-tier rate limiting to anonymous student submit and identity-lookup attempts. Existing roster number+name check is not robust authentication against deliberate impersonation. Prefer teacher-issued single-use enrollment tokens or authenticated student access.
- Introduce immutable instrument version snapshot per Exam to prevent future changes of question bank from modifying historical scoring.
- Implement server-side logging and retry guidance for transactions, proper monitoring, teacher data retention/deletion policy, and privacy information for minors consistent with school policy/KVKK.
- Run a content expert review plus pilot administration and cognitive interviews with students. Item analysis, distractor functioning, test–retest and appropriate reliability/validity evaluation are required before claiming a validated instrument.
- Investigate pre-existing credentials authorization separately before production release; this feature assumes requireTeacher is effective.
- Keep main unaffected until reviewed and tested.

## Research basis (not validation of this original bank)
- Kaltakci Gurel, Eryilmaz & McDermott (2015), *A Review and Comparison of Diagnostic Instruments to Identify Students' Misconceptions in Science*, Eurasia J Math Sci Technol Educ 11(5), doi:10.12973/eurasia.2015.1369a.
- Lunar and Planetary Institute, Seasons Misconceptions: https://www.lpi.usra.edu/education/pre_service_edu/SeasonsMisconceptions.shtml
- NASA Space Place, What Causes the Seasons: https://spaceplace.nasa.gov/seasons/en/
- Four-tier interpretive patterns: https://pmc.ncbi.nlm.nih.gov/articles/PMC11626058/

## Measurement rules
Joint score = 10 × number of items with both content choice and rationale choice correct (max 100).
Scientifically supported count = joint correct **and** both confidence ratings >= 4/5.
High-confidence misconception distractor selection signals a *suspected* misconception, not confirmed misconception. Repetition of the same code on 2+ items is marked recurring. Keep raw response choices and dual confidence for teacher audit.
