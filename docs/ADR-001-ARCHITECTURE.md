# ADR-001: Architectural Foundation & Phase 1 Scope for DÜŞÜNCE İZİ

## Status
Accepted

## Context
"DÜŞÜNCE İZİ" (Yapay Zekâ Destekli Çok Modlu Açık Uçlu Değerlendirme ve Öğrenci Düşünme Analizi Sistemi) is designed as a teacher-centric decision-support platform with zero friction for K-12 students.

Students:
- Do NOT create accounts, use passwords, or provide email addresses.
- Access exams exclusively via unique, secure public URLs or QR codes.
- Identify themselves using a School Number within an assigned Classroom.
- Experience a simple, mobile-first, online-form-like interface.

Teachers:
- Securely authenticate via Google OAuth or Email/Password.
- Create & manage classrooms and import student rosters (manual or CSV).
- Design open-ended multimodal exams (Direct Text, Handwritten Image, Audio Explanation).
- Review, edit, and approve AI-generated qualitative reasoning analyses.

## Key Architectural Decisions

### 1. Multi-Tiered User Roles & Anonymization Pipeline
- **Role Hierarchy**: `TEACHER`, `ADMIN`, `ANONYMOUS_STUDENT_ATTEMPT`.
- **Privacy Assurance**: Student PII (name, school number, classroom details) is stored securely in the database but **never** transmitted to external AI providers.
- **Anonymization Proxy**: Before passing student responses to Gemini API for qualitative analysis, all direct identifiers are stripped, replacing identity with a cryptographic student attempt hash.

### 2. State-Machine Response Pipeline
Student attempts transition strictly across explicit states:
`DRAFT` -> `IN_PROGRESS` -> `SUBMITTED` -> `PROCESSING` -> (`OCR_PROCESSING` / `TRANSCRIPTION_PROCESSING` / `AI_ANALYZING`) -> `NEEDS_TEACHER_REVIEW` -> `TEACHER_REVIEWED` -> `FEEDBACK_READY`

### 3. Classroom Roster Management & Resolution
- Student identities are resolved strictly via composite key: `Exam + Classroom + School Number`.
- CSV import supports Turkish header variations (`Okul No`, `Ad`, `Soyad`, `schoolNumber`, `firstName`, `lastName`) with instant client/server validation.

### 4. Database Schema Design (Prisma / PostgreSQL Schema)
- Designed UUID-based primary keys across all domain entities: `User`, `School`, `Classroom`, `StudentRoster`, `Exam`, `Question`, `ExamAttempt`, `StudentResponse`, `AIAnalysis`, `TeacherReview`, `AuditLog`, `AIUsageLog`.

### 5. Single-Port Full-Stack Container Delivery
- Deployed on port 3000 running Express + Vite TS architecture.
- Full TypeScript strict mode across frontend & backend.
- Pure Turkish localization (UI labels, messages, error feedback).
