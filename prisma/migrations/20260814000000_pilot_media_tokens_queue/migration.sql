-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "unit" TEXT,
    "topic" TEXT,
    "description" TEXT,
    "instructions" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "publicToken" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "timeLimitMinutes" INTEGER,
    "allowResume" BOOLEAN NOT NULL DEFAULT true,
    "allowMultipleSubmissions" BOOLEAN NOT NULL DEFAULT false,
    "showFeedbackAfterApproval" BOOLEAN NOT NULL DEFAULT true,
    "randomizeQuestionOrder" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAccessToken" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceInfo" TEXT,
    "sourceDetails" TEXT,
    "teacherNotes" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'OPEN_ENDED',
    "multipleChoiceOpts" JSONB,
    "correctAnswer" TEXT,
    "learningOutcome" TEXT,
    "maximumScore" INTEGER NOT NULL DEFAULT 100,
    "teacherRubric" TEXT,
    "allowedResponseModes" TEXT[],
    "targetedSkills" TEXT[],
    "argumentationRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionImage" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "originalFilename" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRubric" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT 'conceptualUnderstanding',
    "rubricTitle" TEXT,
    "level" INTEGER NOT NULL,
    "levelTitle" TEXT,
    "description" TEXT NOT NULL,
    "observableIndicators" TEXT,
    "examples" TEXT,

    CONSTRAINT "QuestionRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionExpectedConcept" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "description" TEXT,
    "importance" TEXT NOT NULL DEFAULT 'essential',
    "isEssential" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionExpectedConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionMisconception" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "remedy" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionMisconception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentRosterId" TEXT NOT NULL,
    "attemptTokenHash" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpentSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextResponse" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TextResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageResponse" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioResponse" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseAttachment" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseProcessingJob" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maximumAttempts" INTEGER NOT NULL DEFAULT 3,
    "idempotencyKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "workerId" TEXT,
    "provider" TEXT,
    "processingVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponseProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OCRResult" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "imageResponseId" TEXT,
    "extractedText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "unreadableRegions" TEXT[],
    "uncertainWords" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'tr',
    "provider" TEXT NOT NULL DEFAULT 'gemini-vision',
    "model" TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
    "processingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "correctedText" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OCRResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptionResult" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "audioResponseId" TEXT,
    "transcriptText" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "uncertainSegments" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'tr',
    "durationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "provider" TEXT NOT NULL DEFAULT 'whisper-or-gemini',
    "model" TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
    "processingTimeMs" INTEGER NOT NULL DEFAULT 0,
    "correctedText" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualAnalysisResult" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "imageResponseId" TEXT,
    "drawingPresent" BOOLEAN NOT NULL DEFAULT false,
    "scientificElements" TEXT[],
    "missingElements" TEXT[],
    "incorrectElements" TEXT[],
    "labelsUsed" BOOLEAN NOT NULL DEFAULT false,
    "arrowsUsed" BOOLEAN NOT NULL DEFAULT false,
    "graphUsed" BOOLEAN NOT NULL DEFAULT false,
    "tableUsed" BOOLEAN NOT NULL DEFAULT false,
    "symbolicUsed" BOOLEAN NOT NULL DEFAULT false,
    "modelUsed" BOOLEAN NOT NULL DEFAULT false,
    "consistency" "CrossModalStatus" NOT NULL DEFAULT 'NOT_ASSESSABLE',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "explanation" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultimodalResponseSnapshot" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "processingJobId" TEXT,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "typedText" TEXT,
    "ocrText" TEXT,
    "transcriptText" TEXT,
    "visualFindings" JSONB,
    "anonymizedPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MultimodalResponseSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
    "tokenUsage" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "requiresTeacherReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewReasons" TEXT[],
    "rawOutput" TEXT,
    "repairedOutput" TEXT,
    "analysisJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysisVersion" (
    "id" TEXT NOT NULL,
    "aiAnalysisId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "analysisJson" JSONB NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysisVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherReview" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "aiAnalysisId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "TeacherReviewStatus" NOT NULL DEFAULT 'PENDING',
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "editedJson" JSONB,
    "feedbackText" TEXT,
    "correctionReason" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherReviewChange" (
    "id" TEXT NOT NULL,
    "teacherReviewId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherReviewChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AITeacherAgreement" (
    "id" TEXT NOT NULL,
    "teacherReviewId" TEXT NOT NULL,
    "conceptualLevelDelta" INTEGER NOT NULL DEFAULT 0,
    "misconceptionsApproved" TEXT[],
    "misconceptionsRejected" TEXT[],
    "hotsDeltas" JSONB,
    "fieldsChangedCount" INTEGER NOT NULL DEFAULT 0,
    "approvedWithoutChanges" BOOLEAN NOT NULL DEFAULT true,
    "ocrCorrected" BOOLEAN NOT NULL DEFAULT false,
    "transcriptCorrected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AITeacherAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingEvent" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "responseProcessingJobId" TEXT,
    "eventType" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherFeedback" (
    "id" TEXT NOT NULL,
    "studentResponseId" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "developmentNeed" TEXT NOT NULL,
    "promptingQuestion" TEXT NOT NULL,
    "suggestedActivity" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ConceptCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MisconceptionCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "remedy" TEXT,

    CONSTRAINT "MisconceptionCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotsDimension" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labelTr" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "HotsDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArgumentationComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labelTr" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ArgumentationComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "evalTokens" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "policyType" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "analyticsVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "reviewCutoffTimestamp" TIMESTAMP(3) NOT NULL,
    "includedResponseCount" INTEGER NOT NULL DEFAULT 0,
    "excludedResponseCount" INTEGER NOT NULL DEFAULT 0,
    "provisionalCount" INTEGER NOT NULL DEFAULT 0,
    "dataQualityWarnings" TEXT[],
    "filtersUsed" JSONB,
    "generatedBy" TEXT,
    "metrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "totalStudentsRoster" INTEGER NOT NULL DEFAULT 0,
    "startedAttempts" INTEGER NOT NULL DEFAULT 0,
    "submittedAttempts" INTEGER NOT NULL DEFAULT 0,
    "incompleteAttempts" INTEGER NOT NULL DEFAULT 0,
    "expiredAttempts" INTEGER NOT NULL DEFAULT 0,
    "pendingReviewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedCount" INTEGER NOT NULL DEFAULT 0,
    "notAssessableCount" INTEGER NOT NULL DEFAULT 0,
    "processingFailedCount" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "modeDistribution" JSONB,
    "reviewedPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "provisionalPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedCount" INTEGER NOT NULL DEFAULT 0,
    "notAssessableCount" INTEGER NOT NULL DEFAULT 0,
    "levelDistribution" JSONB,
    "expectedConceptMap" JSONB,
    "misconceptionMap" JSONB,
    "hotsDistribution" JSONB,
    "argDistribution" JSONB,
    "repConsistencyMap" JSONB,
    "correctionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "aiConfidenceAvg" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "avgProcessingTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "studentRosterId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "submittedResponses" INTEGER NOT NULL DEFAULT 0,
    "modesUsed" TEXT[],
    "conceptualEvidence" JSONB,
    "confirmedMisconceptions" TEXT[],
    "hotsScores" JSONB,
    "argScores" JSONB,
    "repConsistency" TEXT,
    "notAssessableCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentAnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionRecommendation" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "classroomId" TEXT,
    "scope" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "supportingEvidence" TEXT NOT NULL,
    "affectedResponseCount" INTEGER NOT NULL DEFAULT 0,
    "affectedStudentIds" TEXT[],
    "confidenceNote" TEXT,
    "suggestedAction" TEXT NOT NULL,
    "linkedConceptCodes" TEXT[],
    "linkedMisconceptionCodes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportGenerationJob" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "filters" JSONB,
    "outputStoragePath" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "exportType" "ExportType" NOT NULL,
    "status" "ReportJobStatus" NOT NULL DEFAULT 'QUEUED',
    "filters" JSONB,
    "outputStoragePath" TEXT,
    "downloadUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT,
    "examId" TEXT,
    "eventType" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Exam_publicToken_key" ON "Exam"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_shortCode_key" ON "Exam"("shortCode");

-- CreateIndex
CREATE INDEX "Exam_publicToken_idx" ON "Exam"("publicToken");

-- CreateIndex
CREATE INDEX "Exam_shortCode_idx" ON "Exam"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAccessToken_token_key" ON "ExamAccessToken"("token");

-- CreateIndex
CREATE INDEX "Question_examId_questionOrder_idx" ON "Question"("examId", "questionOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_attemptTokenHash_key" ON "ExamAttempt"("attemptTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_examId_studentRosterId_key" ON "ExamAttempt"("examId", "studentRosterId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResponse_attemptId_questionId_key" ON "StudentResponse"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TextResponse_studentResponseId_key" ON "TextResponse"("studentResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioResponse_studentResponseId_key" ON "AudioResponse"("studentResponseId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseProcessingJob_idempotencyKey_key" ON "ResponseProcessingJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ResponseProcessingJob_studentResponseId_idx" ON "ResponseProcessingJob"("studentResponseId");

-- CreateIndex
CREATE INDEX "ResponseProcessingJob_status_scheduledAt_idx" ON "ResponseProcessingJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ResponseProcessingJob_status_leaseExpiresAt_idx" ON "ResponseProcessingJob"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MultimodalResponseSnapshot_processingJobId_key" ON "MultimodalResponseSnapshot"("processingJobId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_templateName_key" ON "PromptTemplate"("templateName");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptCode_code_key" ON "ConceptCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MisconceptionCode_code_key" ON "MisconceptionCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HotsDimension_name_key" ON "HotsDimension"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArgumentationComponent_name_key" ON "ArgumentationComponent"("name");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_examId_idx" ON "AnalyticsSnapshot"("examId");

-- CreateIndex
CREATE INDEX "ExamAnalyticsSnapshot_examId_idx" ON "ExamAnalyticsSnapshot"("examId");

-- CreateIndex
CREATE INDEX "QuestionAnalyticsSnapshot_questionId_idx" ON "QuestionAnalyticsSnapshot"("questionId");

-- CreateIndex
CREATE INDEX "QuestionAnalyticsSnapshot_examId_idx" ON "QuestionAnalyticsSnapshot"("examId");

-- CreateIndex
CREATE INDEX "StudentAnalyticsSnapshot_studentRosterId_idx" ON "StudentAnalyticsSnapshot"("studentRosterId");

-- CreateIndex
CREATE INDEX "StudentAnalyticsSnapshot_examId_idx" ON "StudentAnalyticsSnapshot"("examId");

-- CreateIndex
CREATE INDEX "InterventionRecommendation_examId_idx" ON "InterventionRecommendation"("examId");

-- CreateIndex
CREATE INDEX "ReportGenerationJob_teacherId_idx" ON "ReportGenerationJob"("teacherId");

-- CreateIndex
CREATE INDEX "ReportGenerationJob_examId_idx" ON "ReportGenerationJob"("examId");

-- CreateIndex
CREATE INDEX "ExportJob_teacherId_idx" ON "ExportJob"("teacherId");

-- CreateIndex
CREATE INDEX "ExportJob_examId_idx" ON "ExportJob"("examId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_examId_idx" ON "AnalyticsEvent"("examId");

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAccessToken" ADD CONSTRAINT "ExamAccessToken_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionImage" ADD CONSTRAINT "QuestionImage_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRubric" ADD CONSTRAINT "QuestionRubric_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExpectedConcept" ADD CONSTRAINT "QuestionExpectedConcept_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionMisconception" ADD CONSTRAINT "QuestionMisconception_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_studentRosterId_fkey" FOREIGN KEY ("studentRosterId") REFERENCES "StudentRoster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResponse" ADD CONSTRAINT "StudentResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextResponse" ADD CONSTRAINT "TextResponse_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageResponse" ADD CONSTRAINT "ImageResponse_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioResponse" ADD CONSTRAINT "AudioResponse_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseAttachment" ADD CONSTRAINT "ResponseAttachment_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponseProcessingJob" ADD CONSTRAINT "ResponseProcessingJob_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OCRResult" ADD CONSTRAINT "OCRResult_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptionResult" ADD CONSTRAINT "TranscriptionResult_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualAnalysisResult" ADD CONSTRAINT "VisualAnalysisResult_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultimodalResponseSnapshot" ADD CONSTRAINT "MultimodalResponseSnapshot_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultimodalResponseSnapshot" ADD CONSTRAINT "MultimodalResponseSnapshot_processingJobId_fkey" FOREIGN KEY ("processingJobId") REFERENCES "ResponseProcessingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisVersion" ADD CONSTRAINT "AIAnalysisVersion_aiAnalysisId_fkey" FOREIGN KEY ("aiAnalysisId") REFERENCES "AIAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_aiAnalysisId_fkey" FOREIGN KEY ("aiAnalysisId") REFERENCES "AIAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReview" ADD CONSTRAINT "TeacherReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherReviewChange" ADD CONSTRAINT "TeacherReviewChange_teacherReviewId_fkey" FOREIGN KEY ("teacherReviewId") REFERENCES "TeacherReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AITeacherAgreement" ADD CONSTRAINT "AITeacherAgreement_teacherReviewId_fkey" FOREIGN KEY ("teacherReviewId") REFERENCES "TeacherReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingEvent" ADD CONSTRAINT "ProcessingEvent_studentResponseId_fkey" FOREIGN KEY ("studentResponseId") REFERENCES "StudentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingEvent" ADD CONSTRAINT "ProcessingEvent_responseProcessingJobId_fkey" FOREIGN KEY ("responseProcessingJobId") REFERENCES "ResponseProcessingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
