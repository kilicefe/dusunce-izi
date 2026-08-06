/**
 * Core Database & Domain Type Definitions for DÜŞÜNCE İZİ System
 */

export enum Role {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  ANONYMOUS_STUDENT_ATTEMPT = 'ANONYMOUS_STUDENT_ATTEMPT',
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum ResponseMode {
  DIRECT_TEXT = 'DIRECT_TEXT',
  HANDWRITTEN_IMAGE = 'HANDWRITTEN_IMAGE',
  AUDIO_EXPLANATION = 'AUDIO_EXPLANATION',
  MULTIMODAL = 'MULTIMODAL',
}

export enum AttemptStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
  INVALIDATED = 'INVALIDATED',
  PROCESSING = 'PROCESSING',
  OCR_PROCESSING = 'OCR_PROCESSING',
  TRANSCRIPTION_PROCESSING = 'TRANSCRIPTION_PROCESSING',
  AI_ANALYZING = 'AI_ANALYZING',
  NEEDS_TEACHER_REVIEW = 'NEEDS_TEACHER_REVIEW',
  TEACHER_REVIEWED = 'TEACHER_REVIEWED',
  FEEDBACK_READY = 'FEEDBACK_READY',
  FAILED = 'FAILED',
}

export enum CrossModalStatus {
  CONSISTENT = 'CONSISTENT',
  PARTIALLY_CONSISTENT = 'PARTIALLY_CONSISTENT',
  INCONSISTENT = 'INCONSISTENT',
  SINGLE_MODE_ONLY = 'SINGLE_MODE_ONLY',
  NOT_ASSESSABLE = 'NOT_ASSESSABLE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  code?: string;
  city?: string;
  district?: string;
}

export interface Classroom {
  id: string;
  teacherId: string;
  schoolId?: string;
  name: string;
  grade: string;
  branch?: string;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    roster: number;
    exams: number;
  };
}

export interface StudentRosterItem {
  id: string;
  classroomId: string;
  schoolNumber: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CSVImportResult {
  added: StudentRosterItem[];
  duplicates: string[];
  errors: Array<{ line: number; message: string }>;
}

export interface QuestionImage {
  id: string;
  questionId: string;
  url: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  caption?: string;
  order: number;
}

export interface QuestionExpectedConcept {
  id: string;
  questionId: string;
  conceptName: string;
  description?: string;
  importance?: 'essential' | 'supporting' | 'optional';
  isEssential: boolean;
  order?: number;
}

export interface QuestionMisconception {
  id: string;
  questionId: string;
  code: string;
  title: string;
  description: string;
  remedy?: string;
  order?: number;
}

export interface QuestionRubric {
  id: string;
  questionId: string;
  dimension: string; // 'conceptualUnderstanding' | 'representation' | 'higherOrderThinking' | 'argumentation' | custom
  rubricTitle?: string;
  level: number; // 0-4
  levelTitle?: string;
  description: string;
  observableIndicators?: string;
  examples?: string;
}

export interface Question {
  id: string;
  examId: string;
  questionOrder: number;
  title: string;
  questionText: string;
  imageUrl?: string;
  questionImages?: QuestionImage[];
  sourceInfo?: string;
  sourceDetails?: string;
  teacherNotes?: string;
  questionType?: 'OPEN_ENDED' | 'MULTIPLE_CHOICE_EXPLANATION' | 'IMAGE_BASED' | 'MODEL_BASED';
  multipleChoiceOpts?: string[];
  correctAnswer?: string;
  learningOutcome?: string;
  maximumScore?: number;
  teacherRubric?: string;
  allowedResponseModes: ResponseMode[];
  targetedSkills?: string[];
  argumentationRequired?: boolean;
  expectedConcepts?: QuestionExpectedConcept[];
  misconceptions?: QuestionMisconception[];
  rubrics?: QuestionRubric[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface Exam {
  id: string;
  teacherId: string;
  classroomId: string;
  classroomName?: string;
  title: string;
  subject: string;
  unit?: string;
  topic?: string;
  description?: string;
  instructions?: string;
  status: ExamStatus;
  publicToken: string;
  shortCode: string;
  startDate?: string;
  endDate?: string;
  timeLimitMinutes?: number;
  allowResume: boolean;
  allowMultipleSubmissions: boolean;
  showFeedbackAfterApproval: boolean;
  randomizeQuestionOrder?: boolean;
  publishedAt?: string;
  closedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  questions?: Question[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

export enum ResponseStatus {
  EMPTY = 'EMPTY',
  DRAFT = 'DRAFT',
  ANSWERED = 'ANSWERED',
  SUBMITTED = 'SUBMITTED',
}

export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export interface TextResponseComponent {
  id: string;
  studentResponseId: string;
  content: string;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImageResponseComponent {
  id: string;
  studentResponseId: string;
  storagePath: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  order: number;
  uploadStatus: UploadStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AudioResponseComponent {
  id: string;
  studentResponseId: string;
  storagePath: string;
  storageUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  durationSeconds?: number;
  uploadStatus: UploadStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface StudentResponse {
  id: string;
  attemptId: string;
  questionId: string;
  status: ResponseStatus;
  textResponse?: TextResponseComponent;
  imageResponses?: ImageResponseComponent[];
  audioResponse?: AudioResponseComponent;
  firstSavedAt?: string;
  lastSavedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentRosterId: string;
  attemptToken: string;
  attemptTokenHash?: string;
  status: AttemptStatus;
  startedAt: string;
  lastActivityAt: string;
  submittedAt?: string;
  expiresAt?: string;
  currentQuestionId?: string;
  currentQuestionIndex: number;
  timeLimitStartedAt?: string;
  timeLimitExpiresAt?: string;
  clientFingerprintHash?: string;
  resumeAllowed: boolean;
  submissionVersion: number;
  timeSpentSec: number;
  studentRoster?: StudentRosterItem;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface AttemptEvent {
  id: string;
  attemptId: string;
  eventType:
    | 'ATTEMPT_STARTED'
    | 'ATTEMPT_RESUMED'
    | 'QUESTION_VIEWED'
    | 'TEXT_SAVED'
    | 'IMAGE_UPLOADED'
    | 'IMAGE_DELETED'
    | 'AUDIO_UPLOADED'
    | 'AUDIO_DELETED'
    | 'SUBMISSION_STARTED'
    | 'SUBMITTED'
    | 'TIME_EXPIRED'
    | 'ATTEMPT_INVALIDATED';
  details?: Record<string, unknown>;
  timestamp: string;
}

// AI Output Schema matching Section 19
export interface HotsDimensionDetail {
  score?: number; // 0 to 4 or undefined if not applicable
  evidence?: string;
  explanation?: string;
  confidence?: number;
}

export interface ArgumentationComponentDetail {
  present?: boolean;
  extractedContent?: string;
  qualityScore?: number; // 0 to 4
  explanation?: string;
  confidence?: number;
}

export interface AIAnalysisOutput {
  responseSummary: string;
  responseModes: ResponseMode[];
  extractedContent: {
    typedText: string | null;
    ocrText: string | null;
    audioTranscript: string | null;
  };
  conceptualUnderstanding: {
    correctIdeas: Array<{
      idea: string;
      evidence: string;
      confidence: number;
    }>;
    partiallyCorrectIdeas: Array<{
      idea: string;
      evidence: string;
      confidence: number;
    }>;
    missingExpectedConcepts: string[];
    scientificErrors: string[];
    misconceptions: Array<{
      code: string;
      title: string;
      explanation: string;
      evidence: string;
      confidence: number;
    }>;
    conceptRelations: string[];
    overallLevel: {
      score: number; // 0 to 4
      evidence: string;
      confidence: number;
    };
  };
  representationAnalysis: {
    drawingPresent: boolean;
    scientificElements: string[];
    missingElements: string[];
    incorrectElements: string[];
    labelsUsed: boolean;
    arrowsUsedMeaningfully: boolean;
    textDrawingConsistency: 'consistent' | 'partially_consistent' | 'inconsistent' | 'not_assessable';
    explanation: string;
  };
  higherOrderThinking: {
    problemUnderstanding?: HotsDimensionDetail;
    relevantInformationSelection?: HotsDimensionDetail;
    relationshipBuilding?: HotsDimensionDetail;
    causalReasoning?: HotsDimensionDetail;
    inference?: HotsDimensionDetail;
    evidenceUse?: HotsDimensionDetail;
    evaluation?: HotsDimensionDetail;
    alternativeExplanationComparison?: HotsDimensionDetail;
    errorDetection?: HotsDimensionDetail;
    transfer?: HotsDimensionDetail;
    modelCreation?: HotsDimensionDetail;
    originalSolution?: HotsDimensionDetail;
    metacognition?: HotsDimensionDetail;
  };
  argumentation: {
    claim?: ArgumentationComponentDetail;
    evidence?: ArgumentationComponentDetail;
    reasoning?: ArgumentationComponentDetail;
    counterclaim?: ArgumentationComponentDetail;
    rebuttal?: ArgumentationComponentDetail;
  };
  crossModalConsistency: {
    status: CrossModalStatus;
    findings: string[];
  };
  recommendedTeacherFeedback: {
    strength: string;
    developmentNeed: string;
    promptingQuestion: string;
    suggestedActivity: string;
  };
  requiresTeacherReview: boolean;
  confidence: number;
}

export enum JobType {
  PREPARE_RESPONSE = 'PREPARE_RESPONSE',
  OCR = 'OCR',
  TRANSCRIPTION = 'TRANSCRIPTION',
  VISUAL_ANALYSIS = 'VISUAL_ANALYSIS',
  MULTIMODAL_AGGREGATION = 'MULTIMODAL_AGGREGATION',
  AI_QUALITATIVE_ANALYSIS = 'AI_QUALITATIVE_ANALYSIS',
  SCHEMA_REPAIR = 'SCHEMA_REPAIR',
  REANALYSIS = 'REANALYSIS',
}

export enum JobStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  CANCELLED = 'CANCELLED',
  PARTIAL = 'PARTIAL',
}

export enum TeacherReviewStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  APPROVED_WITH_CHANGES = 'APPROVED_WITH_CHANGES',
  REJECTED = 'REJECTED',
  NOT_ASSESSABLE = 'NOT_ASSESSABLE',
  REANALYSIS_REQUESTED = 'REANALYSIS_REQUESTED',
}

export enum MisconceptionStatus {
  CONFIRMED_BY_EVIDENCE = 'CONFIRMED_BY_EVIDENCE',
  POSSIBLE = 'POSSIBLE',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
  NOT_PRESENT = 'NOT_PRESENT',
}

export interface ResponseProcessingJob {
  id: string;
  studentResponseId: string;
  jobType: JobType;
  status: JobStatus;
  attemptCount: number;
  maximumAttempts: number;
  idempotencyKey: string;
  priority: number;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  nextRetryAt?: string;
  provider?: string;
  processingVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface OCRResultRecord {
  id: string;
  studentResponseId: string;
  imageResponseId?: string;
  extractedText: string;
  confidence: number;
  unreadableRegions: string[];
  uncertainWords: string[];
  language: string;
  provider: string;
  model: string;
  processingTimeMs: number;
  correctedText?: string;
  processedAt: string;
}

export interface TranscriptionResultRecord {
  id: string;
  studentResponseId: string;
  audioResponseId?: string;
  transcriptText: string;
  confidence: number;
  uncertainSegments: string[];
  language: string;
  durationSeconds: number;
  provider: string;
  model: string;
  processingTimeMs: number;
  correctedText?: string;
  processedAt: string;
}

export interface VisualAnalysisResultRecord {
  id: string;
  studentResponseId: string;
  imageResponseId?: string;
  drawingPresent: boolean;
  scientificElements: string[];
  missingElements: string[];
  incorrectElements: string[];
  labelsUsed: boolean;
  arrowsUsed: boolean;
  graphUsed: boolean;
  tableUsed: boolean;
  symbolicUsed: boolean;
  modelUsed: boolean;
  consistency: CrossModalStatus;
  confidence: number;
  explanation?: string;
  processedAt: string;
}

export interface MultimodalResponseSnapshotRecord {
  id: string;
  studentResponseId: string;
  attemptId: string;
  questionId: string;
  snapshotVersion: number;
  typedText?: string;
  ocrText?: string;
  transcriptText?: string;
  visualFindings?: Record<string, unknown>;
  anonymizedPayload: Record<string, unknown>;
  createdAt: string;
}

export interface AIAnalysisRecord {
  id: string;
  studentResponseId: string;
  snapshotId?: string;
  promptVersion: string;
  modelName: string;
  tokenUsage: number;
  estimatedCost: number;
  confidence: number;
  requiresTeacherReview: boolean;
  reviewReasons: string[];
  rawOutput?: string;
  repairedOutput?: string;
  analysisJson: any; // QualitativeAnalysisOutput
  createdAt: string;
}

export interface AIAnalysisVersionRecord {
  id: string;
  aiAnalysisId: string;
  versionNumber: number;
  promptVersion: string;
  modelName: string;
  analysisJson: any;
  reason?: string;
  createdAt: string;
}

export interface TeacherReviewRecord {
  id: string;
  studentResponseId: string;
  aiAnalysisId?: string;
  originalAiAnalysisId?: string;
  teacherId: string;
  status: TeacherReviewStatus;
  approved: boolean;
  editedJson?: any; // QualitativeAnalysisOutput
  feedbackText?: string;
  correctionReason?: string;
  reviewedAt: string;
}

export type TeacherReview = TeacherReviewRecord;
export type AIAnalysis = AIAnalysisRecord;
export type OCRResult = OCRResultRecord;
export type TranscriptionResult = TranscriptionResultRecord;
export type VisualAnalysisResult = VisualAnalysisResultRecord;
export type StudentRoster = StudentRosterItem;

export interface TeacherReviewChangeRecord {
  id: string;
  teacherReviewId: string;
  fieldPath: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  timestamp: string;
}

export interface AITeacherAgreementRecord {
  id: string;
  teacherReviewId: string;
  conceptualLevelDelta: number;
  misconceptionsApproved: string[];
  misconceptionsRejected: string[];
  hotsDeltas?: Record<string, number>;
  fieldsChangedCount: number;
  approvedWithoutChanges: boolean;
  ocrCorrected: boolean;
  transcriptCorrected: boolean;
  createdAt: string;
}

export interface PromptTemplateRecord {
  id: string;
  templateName: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersionRecord {
  id: string;
  promptTemplateId: string;
  version: string;
  systemPrompt: string;
  schemaVersion: string;
  isActive: boolean;
  createdAt: string;
}

export interface AIUsageLogRecord {
  id: string;
  endpoint: string;
  modelName: string;
  promptTokens: number;
  evalTokens: number;
  latencyMs: number;
  status: string;
  estimatedCost: number;
  createdAt: string;
}

export interface ProcessingEventRecord {
  id: string;
  studentResponseId: string;
  responseProcessingJobId?: string;
  eventType: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
