-- Pilot tables live in Supabase's Data API exposed public schema.
-- The application uses server-side Prisma only, so browser roles receive no table access.

DO $$
BEGIN
  IF current_user = 'postgres'
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dusunce_izi_app') THEN
    EXECUTE 'ALTER ROLE dusunce_izi_app BYPASSRLS';
  END IF;
END
$$;

ALTER TABLE public."AIAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIAnalysisVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AITeacherAgreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AIUsageLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ArgumentationComponent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AudioResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Classroom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConceptCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ConsentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Exam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExamAccessToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExamAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExamAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExportJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."HotsDimension" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ImageResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InterventionRecommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MisconceptionCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MultimodalResponseSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."OCRResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ProcessingEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromptTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PromptVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionExpectedConcept" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionMisconception" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."QuestionRubric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReportGenerationJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResponseAttachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ResponseProcessingJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StudentRoster" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherFeedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TeacherReviewChange" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TextResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TranscriptionResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VisualAnalysisResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Supabase provides these Data API roles; plain PostgreSQL CI does not.
-- Keep the migration portable while revoking grants only on the Prisma/pilot tables.
DO $$
DECLARE
  target_role text;
  protected_table text;
  protected_tables constant text[] := ARRAY[
    'AIAnalysis',
    'AIAnalysisVersion',
    'AITeacherAgreement',
    'AIUsageLog',
    'Account',
    'AnalyticsEvent',
    'AnalyticsSnapshot',
    'ArgumentationComponent',
    'AudioResponse',
    'AuditLog',
    'Classroom',
    'ConceptCode',
    'ConsentRecord',
    'Exam',
    'ExamAccessToken',
    'ExamAnalyticsSnapshot',
    'ExamAttempt',
    'ExportJob',
    'HotsDimension',
    'ImageResponse',
    'InterventionRecommendation',
    'MisconceptionCode',
    'MultimodalResponseSnapshot',
    'OCRResult',
    'ProcessingEvent',
    'PromptTemplate',
    'PromptVersion',
    'Question',
    'QuestionAnalyticsSnapshot',
    'QuestionExpectedConcept',
    'QuestionImage',
    'QuestionMisconception',
    'QuestionRubric',
    'ReportGenerationJob',
    'ResponseAttachment',
    'ResponseProcessingJob',
    'School',
    'Session',
    'StudentAnalyticsSnapshot',
    'StudentResponse',
    'StudentRoster',
    'TeacherFeedback',
    'TeacherReview',
    'TeacherReviewChange',
    'TextResponse',
    'TranscriptionResult',
    'User',
    'VerificationToken',
    'VisualAnalysisResult',
    '_prisma_migrations'
  ];
BEGIN
  FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
      FOREACH protected_table IN ARRAY protected_tables
      LOOP
        EXECUTE format(
          'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %I',
          protected_table,
          target_role
        );
      END LOOP;
    END IF;
  END LOOP;
END
$$;

-- Keep future Prisma tables closed by default when migrations run as postgres.
DO $$
DECLARE
  target_role text;
BEGIN
  IF current_user = 'postgres' THEN
    FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
        EXECUTE format(
          'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM %I',
          target_role
        );
      END IF;
    END LOOP;
  END IF;
END
$$;

-- This function may exist in older Supabase prototypes as an auth trigger target.
-- It is not intended to remain callable as a public RPC endpoint.
DO $$
DECLARE
  target_role text;
BEGIN
  IF to_regprocedure('public.yeni_kullanici_profili()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.yeni_kullanici_profili() FROM PUBLIC';

    FOREACH target_role IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_role) THEN
        EXECUTE format(
          'REVOKE EXECUTE ON FUNCTION public.yeni_kullanici_profili() FROM %I',
          target_role
        );
      END IF;
    END LOOP;
  END IF;
END
$$;
