-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResponseMode" AS ENUM ('DIRECT_TEXT', 'HANDWRITTEN_IMAGE', 'AUDIO_EXPLANATION', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'INVALIDATED', 'PROCESSING', 'OCR_PROCESSING', 'TRANSCRIPTION_PROCESSING', 'AI_ANALYZING', 'NEEDS_TEACHER_REVIEW', 'TEACHER_REVIEWED', 'FEEDBACK_READY', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('PREPARE_RESPONSE', 'OCR', 'TRANSCRIPTION', 'VISUAL_ANALYSIS', 'MULTIMODAL_AGGREGATION', 'AI_QUALITATIVE_ANALYSIS', 'SCHEMA_REPAIR', 'REANALYSIS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRY_SCHEDULED', 'CANCELLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "TeacherReviewStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'APPROVED_WITH_CHANGES', 'REJECTED', 'NOT_ASSESSABLE', 'REANALYSIS_REQUESTED');

-- CreateEnum
CREATE TYPE "MisconceptionStatus" AS ENUM ('CONFIRMED_BY_EVIDENCE', 'POSSIBLE', 'INSUFFICIENT_EVIDENCE', 'NOT_PRESENT');

-- CreateEnum
CREATE TYPE "CrossModalStatus" AS ENUM ('CONSISTENT', 'PARTIALLY_CONSISTENT', 'INCONSISTENT', 'SINGLE_MODE_ONLY', 'NOT_ASSESSABLE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('EXAM_SUMMARY', 'QUESTION_ANALYSIS', 'CLASSROOM_CONCEPTUAL', 'MISCONCEPTION', 'HOTS', 'ARGUMENTATION', 'REPRESENTATION', 'STUDENT_PROFILE', 'AGREEMENT', 'DATA_QUALITY', 'INSTRUCTIONAL_PLANNING');

-- CreateEnum
CREATE TYPE "ReportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('TEACHER_FULL_CSV', 'ANONYMIZED_RESEARCH_CSV', 'DATA_DICTIONARY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "city" TEXT,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "branch" TEXT,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRoster" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "schoolNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE INDEX "Classroom_teacherId_idx" ON "Classroom"("teacherId");

-- CreateIndex
CREATE INDEX "StudentRoster_classroomId_idx" ON "StudentRoster"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRoster_classroomId_schoolNumber_key" ON "StudentRoster"("classroomId", "schoolNumber");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRoster" ADD CONSTRAINT "StudentRoster_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
