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
REVOKE ALL PRIVILEGES ON TABLE public."AIAnalysis" FROM anon, authenticated;
ALTER TABLE public."AIAnalysisVersion" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AIAnalysisVersion" FROM anon, authenticated;
ALTER TABLE public."AITeacherAgreement" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AITeacherAgreement" FROM anon, authenticated;
ALTER TABLE public."AIUsageLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AIUsageLog" FROM anon, authenticated;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."Account" FROM anon, authenticated;
ALTER TABLE public."AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AnalyticsEvent" FROM anon, authenticated;
ALTER TABLE public."AnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AnalyticsSnapshot" FROM anon, authenticated;
ALTER TABLE public."ArgumentationComponent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ArgumentationComponent" FROM anon, authenticated;
ALTER TABLE public."AudioResponse" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AudioResponse" FROM anon, authenticated;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."AuditLog" FROM anon, authenticated;
ALTER TABLE public."Classroom" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."Classroom" FROM anon, authenticated;
ALTER TABLE public."ConceptCode" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ConceptCode" FROM anon, authenticated;
ALTER TABLE public."ConsentRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ConsentRecord" FROM anon, authenticated;
ALTER TABLE public."Exam" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."Exam" FROM anon, authenticated;
ALTER TABLE public."ExamAccessToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ExamAccessToken" FROM anon, authenticated;
ALTER TABLE public."ExamAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ExamAnalyticsSnapshot" FROM anon, authenticated;
ALTER TABLE public."ExamAttempt" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ExamAttempt" FROM anon, authenticated;
ALTER TABLE public."ExportJob" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ExportJob" FROM anon, authenticated;
ALTER TABLE public."HotsDimension" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."HotsDimension" FROM anon, authenticated;
ALTER TABLE public."ImageResponse" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ImageResponse" FROM anon, authenticated;
ALTER TABLE public."InterventionRecommendation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."InterventionRecommendation" FROM anon, authenticated;
ALTER TABLE public."MisconceptionCode" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."MisconceptionCode" FROM anon, authenticated;
ALTER TABLE public."MultimodalResponseSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."MultimodalResponseSnapshot" FROM anon, authenticated;
ALTER TABLE public."OCRResult" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."OCRResult" FROM anon, authenticated;
ALTER TABLE public."ProcessingEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ProcessingEvent" FROM anon, authenticated;
ALTER TABLE public."PromptTemplate" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."PromptTemplate" FROM anon, authenticated;
ALTER TABLE public."PromptVersion" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."PromptVersion" FROM anon, authenticated;
ALTER TABLE public."Question" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."Question" FROM anon, authenticated;
ALTER TABLE public."QuestionAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."QuestionAnalyticsSnapshot" FROM anon, authenticated;
ALTER TABLE public."QuestionExpectedConcept" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."QuestionExpectedConcept" FROM anon, authenticated;
ALTER TABLE public."QuestionImage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."QuestionImage" FROM anon, authenticated;
ALTER TABLE public."QuestionMisconception" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."QuestionMisconception" FROM anon, authenticated;
ALTER TABLE public."QuestionRubric" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."QuestionRubric" FROM anon, authenticated;
ALTER TABLE public."ReportGenerationJob" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ReportGenerationJob" FROM anon, authenticated;
ALTER TABLE public."ResponseAttachment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ResponseAttachment" FROM anon, authenticated;
ALTER TABLE public."ResponseProcessingJob" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."ResponseProcessingJob" FROM anon, authenticated;
ALTER TABLE public."School" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."School" FROM anon, authenticated;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."Session" FROM anon, authenticated;
ALTER TABLE public."StudentAnalyticsSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."StudentAnalyticsSnapshot" FROM anon, authenticated;
ALTER TABLE public."StudentResponse" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."StudentResponse" FROM anon, authenticated;
ALTER TABLE public."StudentRoster" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."StudentRoster" FROM anon, authenticated;
ALTER TABLE public."TeacherFeedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TeacherFeedback" FROM anon, authenticated;
ALTER TABLE public."TeacherReview" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TeacherReview" FROM anon, authenticated;
ALTER TABLE public."TeacherReviewChange" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TeacherReviewChange" FROM anon, authenticated;
ALTER TABLE public."TextResponse" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TextResponse" FROM anon, authenticated;
ALTER TABLE public."TranscriptionResult" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TranscriptionResult" FROM anon, authenticated;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."User" FROM anon, authenticated;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."VerificationToken" FROM anon, authenticated;
ALTER TABLE public."VisualAnalysisResult" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."VisualAnalysisResult" FROM anon, authenticated;
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."_prisma_migrations" FROM anon, authenticated;

-- Keep future Prisma tables closed by default when migrations run as postgres.
DO $$
BEGIN
  IF current_user = 'postgres' THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
      REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
  END IF;
END
$$;

-- This function may exist in older Supabase prototypes as an auth trigger target.
-- It is not intended to remain callable as a public RPC endpoint.
DO $$
BEGIN
  IF to_regprocedure('public.yeni_kullanici_profili()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.yeni_kullanici_profili() FROM PUBLIC, anon, authenticated';
  END IF;
END
$$;
