import {
  ResponseProcessingJob,
  JobType,
  JobStatus,
  AttemptStatus,
  StudentResponse,
  OCRResultRecord,
  TranscriptionResultRecord,
  VisualAnalysisResultRecord,
  MultimodalResponseSnapshotRecord,
  AIAnalysisRecord,
  TeacherReviewRecord,
  TeacherReviewStatus,
  AIUsageLogRecord,
  CrossModalStatus,
} from '../types/database';
import {
  getItem,
  setItem,
  getExam,
  getQuestion,
  getStudentResponseById,
  saveStudentResponse,
  getAttemptById,
  updateAttemptStatus,
} from './db';
import {
  extractHandwritingOCR,
  transcribeAudio,
  analyzeVisualRepresentation,
  analyzeQualitativeResponse,
} from './aiProvider';

const STORAGE_KEYS = {
  JOBS: 'dusunceizi_jobs',
  OCR_RESULTS: 'dusunceizi_ocr_results',
  TRANSCRIPTIONS: 'dusunceizi_transcriptions',
  VISUAL_ANALYSES: 'dusunceizi_visual_analyses',
  SNAPSHOTS: 'dusunceizi_snapshots',
  AI_ANALYSES: 'dusunceizi_ai_analyses',
  TEACHER_REVIEWS: 'dusunceizi_teacher_reviews',
  AGREEMENT_RECORDS: 'dusunceizi_agreements',
  AI_USAGE_LOGS: 'dusunceizi_ai_usage_logs',
  PROMPT_TEMPLATES: 'dusunceizi_prompt_templates',
  PROCESSING_EVENTS: 'dusunceizi_processing_events',
};

// Helper for local storage access
function getJobs(): ResponseProcessingJob[] {
  return getItem<ResponseProcessingJob[]>(STORAGE_KEYS.JOBS) || [];
}

function saveJobs(jobs: ResponseProcessingJob[]) {
  setItem(STORAGE_KEYS.JOBS, jobs);
}

function logAIUsage(log: Omit<AIUsageLogRecord, 'id' | 'createdAt'>): AIUsageLogRecord {
  const logs = getItem<AIUsageLogRecord[]>(STORAGE_KEYS.AI_USAGE_LOGS) || [];
  const newLog: AIUsageLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...log,
    createdAt: new Date().toISOString(),
  };
  logs.push(newLog);
  setItem(STORAGE_KEYS.AI_USAGE_LOGS, logs);
  return newLog;
}

export function getAIUsageLogs(): AIUsageLogRecord[] {
  return getItem<AIUsageLogRecord[]>(STORAGE_KEYS.AI_USAGE_LOGS) || [];
}

export function getAllProcessingJobs(): ResponseProcessingJob[] {
  return getJobs();
}

/**
 * Enqueues an explicit processing pipeline for a submitted student response.
 * Idempotent: skips if active job with same idempotencyKey already exists.
 */
export function enqueueResponseProcessing(studentResponseId: string): ResponseProcessingJob {
  const jobs = getJobs();
  const idempotencyKey = `prepare-${studentResponseId}-v1`;

  const existing = jobs.find((j) => j.idempotencyKey === idempotencyKey);
  if (existing) {
    return existing;
  }

  const newJob: ResponseProcessingJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    studentResponseId,
    jobType: JobType.PREPARE_RESPONSE,
    status: JobStatus.QUEUED,
    attemptCount: 0,
    maximumAttempts: 3,
    idempotencyKey,
    priority: 1,
    scheduledAt: new Date().toISOString(),
    processingVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.push(newJob);
  saveJobs(jobs);

  // Trigger processing asynchronously
  setTimeout(() => {
    runProcessingJob(newJob.id).catch((err) =>
      console.error(`Error executing processing job ${newJob.id}:`, err)
    );
  }, 10);

  return newJob;
}

/**
 * Processes all responses in an exam attempt.
 */
export async function processAttemptResponses(attemptId: string): Promise<void> {
  const attempt = getAttemptById(attemptId);
  if (!attempt) return;

  updateAttemptStatus(attemptId, AttemptStatus.PROCESSING);

  // Find all responses for this attempt
  const allResponses = getItem<StudentResponse[]>('dusunceizi_responses') || [];
  const attemptResponses = allResponses.filter((r) => r.attemptId === attemptId);

  for (const resp of attemptResponses) {
    const job = enqueueResponseProcessing(resp.id);
    await runProcessingJob(job.id);
  }

  updateAttemptStatus(attemptId, AttemptStatus.NEEDS_TEACHER_REVIEW);
}

/**
 * Executes a single processing job in the pipeline.
 */
export async function runProcessingJob(jobId: string): Promise<ResponseProcessingJob> {
  const jobs = getJobs();
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) throw new Error(`Job not found: ${jobId}`);

  const job = jobs[jobIndex];
  job.status = JobStatus.RUNNING;
  job.startedAt = new Date().toISOString();
  job.attemptCount += 1;
  job.updatedAt = new Date().toISOString();
  saveJobs(jobs);

  try {
    const response = getStudentResponseById(job.studentResponseId);
    if (!response) {
      throw new Error(`StudentResponse not found: ${job.studentResponseId}`);
    }

    const question = getQuestion(response.questionId);
    if (!question) {
      throw new Error(`Question not found: ${response.questionId}`);
    }

    // Pipeline Step 1: Extract OCR if handwritten images present
    let ocrText: string | null = null;
    let ocrConfidence = 1.0;
    const imageUrls = (response.imageResponses || []).map((img) => img.url).filter(Boolean);

    if (imageUrls.length > 0) {
      const ocrRes = await extractHandwritingOCR({
        studentResponseId: response.id,
        imageUrls,
      });

      ocrText = ocrRes.extractedText;
      ocrConfidence = ocrRes.confidence;

      const ocrRecords = getItem<OCRResultRecord[]>(STORAGE_KEYS.OCR_RESULTS) || [];
      const newOcrRecord: OCRResultRecord = {
        id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentResponseId: response.id,
        imageResponseId: response.imageResponses?.[0]?.id,
        extractedText: ocrRes.extractedText,
        confidence: ocrRes.confidence,
        unreadableRegions: ocrRes.unreadableRegions,
        uncertainWords: ocrRes.uncertainWords,
        language: ocrRes.language,
        provider: ocrRes.provider,
        model: ocrRes.model,
        processingTimeMs: ocrRes.processingTimeMs,
        processedAt: new Date().toISOString(),
      };
      ocrRecords.push(newOcrRecord);
      setItem(STORAGE_KEYS.OCR_RESULTS, ocrRecords);

      logAIUsage({
        endpoint: '/api/ocr',
        modelName: ocrRes.model,
        promptTokens: 150,
        evalTokens: 80,
        latencyMs: ocrRes.processingTimeMs,
        status: 'SUCCESS',
        estimatedCost: 0.0001,
      });
    }

    // Pipeline Step 2: Transcribe Audio if audio recording present
    let transcriptText: string | null = null;
    let audioConfidence = 1.0;
    if (response.audioResponse?.url) {
      const audioRes = await transcribeAudio({
        studentResponseId: response.id,
        audioUrl: response.audioResponse.url,
        durationSeconds: response.audioResponse.durationSeconds,
      });

      transcriptText = audioRes.transcriptText;
      audioConfidence = audioRes.confidence;

      const transcriptRecords = getItem<TranscriptionResultRecord[]>(STORAGE_KEYS.TRANSCRIPTIONS) || [];
      const newTransRecord: TranscriptionResultRecord = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentResponseId: response.id,
        audioResponseId: response.audioResponse.id,
        transcriptText: audioRes.transcriptText,
        confidence: audioRes.confidence,
        uncertainSegments: audioRes.uncertainSegments,
        language: audioRes.language,
        durationSeconds: audioRes.durationSeconds,
        provider: audioRes.provider,
        model: audioRes.model,
        processingTimeMs: audioRes.processingTimeMs,
        processedAt: new Date().toISOString(),
      };
      transcriptRecords.push(newTransRecord);
      setItem(STORAGE_KEYS.TRANSCRIPTIONS, transcriptRecords);

      logAIUsage({
        endpoint: '/api/transcribe',
        modelName: audioRes.model,
        promptTokens: 200,
        evalTokens: 100,
        latencyMs: audioRes.processingTimeMs,
        status: 'SUCCESS',
        estimatedCost: 0.00015,
      });
    }

    // Pipeline Step 3: Visual Representation Analysis if images present
    let visualFindings = null;
    if (imageUrls.length > 0) {
      visualFindings = await analyzeVisualRepresentation({
        studentResponseId: response.id,
        imageUrls,
        questionPrompt: question.questionText,
      });

      const visualRecords = getItem<VisualAnalysisResultRecord[]>(STORAGE_KEYS.VISUAL_ANALYSES) || [];
      const newVisualRecord: VisualAnalysisResultRecord = {
        id: `vis-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentResponseId: response.id,
        imageResponseId: response.imageResponses?.[0]?.id,
        drawingPresent: visualFindings.drawingPresent,
        scientificElements: visualFindings.scientificElements,
        missingElements: visualFindings.missingElements,
        incorrectElements: visualFindings.incorrectElements,
        labelsUsed: visualFindings.labelsUsed,
        arrowsUsed: visualFindings.arrowsUsed,
        graphUsed: visualFindings.graphUsed,
        tableUsed: visualFindings.tableUsed,
        symbolicUsed: visualFindings.symbolicUsed,
        modelUsed: visualFindings.modelUsed,
        consistency: visualFindings.consistency as CrossModalStatus,
        confidence: visualFindings.confidence,
        explanation: visualFindings.explanation,
        processedAt: new Date().toISOString(),
      };
      visualRecords.push(newVisualRecord);
      setItem(STORAGE_KEYS.VISUAL_ANALYSES, visualRecords);
    }

    // Pipeline Step 4: Create Anonymized Response Snapshot
    const snapshots = getItem<MultimodalResponseSnapshotRecord[]>(STORAGE_KEYS.SNAPSHOTS) || [];
    const newSnapshot: MultimodalResponseSnapshotRecord = {
      id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentResponseId: response.id,
      attemptId: response.attemptId,
      questionId: response.questionId,
      snapshotVersion: 1,
      typedText: response.textResponse?.content || undefined,
      ocrText: ocrText || undefined,
      transcriptText: transcriptText || undefined,
      visualFindings: visualFindings ? (visualFindings as any) : null,
      anonymizedPayload: {
        questionText: question.questionText,
        expectedConcepts: question.expectedConcepts || [],
        misconceptions: question.misconceptions || [],
        targetedSkills: question.targetedSkills || [],
        rubric: question.teacherRubric || '',
        typedText: response.textResponse?.content || null,
        ocrText,
        transcriptText,
      },
      createdAt: new Date().toISOString(),
    };
    snapshots.push(newSnapshot);
    setItem(STORAGE_KEYS.SNAPSHOTS, snapshots);

    // Pipeline Step 5: AI Qualitative Analysis Execution
    const qualitativeInput = {
      studentResponseId: response.id,
      questionPrompt: question.questionText,
      teacherInstructions: question.teacherNotes || '',
      expectedConcepts: (question.expectedConcepts || []).map((c) => ({
        conceptName: c.conceptName,
        importance: c.importance || 'essential',
        isEssential: c.isEssential ?? true,
      })),
      misconceptions: (question.misconceptions || []).map((m) => ({
        code: m.code,
        title: m.title,
        description: m.description,
      })),
      targetedSkills: question.targetedSkills || ['causalReasoning', 'problemUnderstanding'],
      rubricText: question.teacherRubric || '',
      typedText: response.textResponse?.content || null,
      ocrText,
      audioTranscript: transcriptText,
      visualFindings,
      promptVersion: '1.0.0',
    };

    const aiResult = await analyzeQualitativeResponse(qualitativeInput);

    logAIUsage({
      endpoint: '/api/qualitative-analysis',
      modelName: aiResult.modelName,
      promptTokens: Math.round(aiResult.tokenUsage * 0.7),
      evalTokens: Math.round(aiResult.tokenUsage * 0.3),
      latencyMs: aiResult.latencyMs,
      status: 'SUCCESS',
      estimatedCost: aiResult.estimatedCost,
    });

    // Pipeline Step 6: Store AI Analysis & Create Pending Teacher Review Queue Item
    const aiAnalyses = getItem<AIAnalysisRecord[]>(STORAGE_KEYS.AI_ANALYSES) || [];
    const newAIAnalysis: AIAnalysisRecord = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentResponseId: response.id,
      snapshotId: newSnapshot.id,
      promptVersion: aiResult.promptVersion,
      modelName: aiResult.modelName,
      tokenUsage: aiResult.tokenUsage,
      estimatedCost: aiResult.estimatedCost,
      confidence: aiResult.confidence,
      requiresTeacherReview: true,
      reviewReasons: aiResult.reviewReasons,
      rawOutput: aiResult.rawOutput,
      repairedOutput: aiResult.repairedOutput,
      analysisJson: aiResult.analysisJson,
      createdAt: new Date().toISOString(),
    };
    aiAnalyses.push(newAIAnalysis);
    setItem(STORAGE_KEYS.AI_ANALYSES, aiAnalyses);

    // Create Teacher Review Item
    const reviews = getItem<TeacherReviewRecord[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
    const attempt = getAttemptById(response.attemptId);
    const exam = attempt ? getExam(attempt.examId) : null;
    const teacherId = exam?.teacherId || 't-101';

    const newReview: TeacherReviewRecord = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentResponseId: response.id,
      aiAnalysisId: newAIAnalysis.id,
      teacherId,
      status: TeacherReviewStatus.PENDING,
      approved: false,
      reviewedAt: new Date().toISOString(),
    };
    reviews.push(newReview);
    setItem(STORAGE_KEYS.TEACHER_REVIEWS, reviews);

    // Pipeline Step 7: Update Job Status
    job.status = JobStatus.COMPLETED;
    job.completedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    saveJobs(jobs);

    return job;
  } catch (error: any) {
    job.status = JobStatus.FAILED;
    job.failedAt = new Date().toISOString();
    job.lastErrorCode = 'PROCESSING_ERROR';
    job.lastErrorMessage = error.message || 'Unknown processing error';
    job.updatedAt = new Date().toISOString();
    saveJobs(jobs);
    throw error;
  }
}
