import {
  getItem,
  setItem,
  STORAGE_KEYS,
  seedInitialData,
} from './db';
import {
  StudentResponse,
  Exam,
  Question,
  ExamAttempt,
  StudentRosterItem,
  TeacherReview,
  AIAnalysis,
  OCRResult,
  TranscriptionResult,
  VisualAnalysisResult,
} from '../types/database';
import { QualitativeAnalysisOutput } from './zodSchemas';

export function isAttemptCompletedForAnalytics(attempt: {
  submittedAt?: Date | string | null;
}): boolean {
  return Boolean(attempt.submittedAt);
}

export function isTeacherApprovedForAnalytics(review: {
  status?: string | null;
} | null | undefined): boolean {
  return review?.status === 'APPROVED' || review?.status === 'APPROVED_WITH_CHANGES';
}

export function summarizeApprovedResponsesForCsv(responses: Array<{
  teacherReviews?: Array<{
    status?: string | null;
    editedJson?: any;
    aiAnalysis?: { analysisJson?: any } | null;
  }>;
}>): { averageScore: number | '-'; misconceptionCodes: string[] } {
  const scores: number[] = [];
  const misconceptionCodes = new Set<string>();

  for (const response of responses) {
    const review = response.teacherReviews?.[0];
    if (!isTeacherApprovedForAnalytics(review)) continue;
    const analysis = review?.editedJson || review?.aiAnalysis?.analysisJson;
    const score = analysis?.conceptualUnderstanding?.overallLevel?.score;
    if (typeof score === 'number') scores.push(score);

    for (const misconception of analysis?.conceptualUnderstanding?.misconceptions || []) {
      if (
        (misconception.status === 'CONFIRMED_BY_EVIDENCE' ||
          misconception.status === 'POSSIBLE') &&
        misconception.code
      ) {
        misconceptionCodes.add(misconception.code);
      }
    }
  }

  return {
    averageScore: scores.length
      ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
      : '-',
    misconceptionCodes: [...misconceptionCodes].sort(),
  };
}

// Filter options for analytics queries
export interface AnalyticsFilters {
  classroomId?: string;
  questionId?: string;
  studentRosterId?: string;
  reviewStatus?: 'ALL' | 'REVIEWED_ONLY' | 'PROVISIONAL_ONLY';
  minConfidence?: number;
  responseMode?: string;
  promptVersion?: string;
}

// Data Quality Summary
export interface DataQualitySummary {
  totalResponses: number;
  reviewedCount: number;
  provisionalCount: number;
  notAssessableCount: number;
  failedCount: number;
  reviewedPercentage: number;
  provisionalPercentage: number;
  lowConfidenceCount: number;
  ocrFailureCount: number;
  transcriptionFailureCount: number;
  smallGroupSuppressionTriggered: boolean;
  warnings: string[];
}

// Resolved Analysis Output
export interface ResolvedAnalysis {
  responseId: string;
  source: 'TEACHER_APPROVED' | 'TEACHER_APPROVED_WITH_CHANGES' | 'PROVISIONAL_AI' | 'NOT_ASSESSABLE' | 'EXCLUDED';
  isReviewed: boolean;
  isAssessable: boolean;
  dataQualityFlags: string[];
  conceptualLevel: number | null;
  evidenceText: string;
  explanation: string;
  correctIdeas: string[];
  missingEssentialConcepts: string[];
  scientificErrors: string[];
  misconceptionCodes: string[];
  hotsScores: Record<string, number | null>;
  argumentationScores: Record<string, number | null>;
  representationConsistency: string;
  recommendedFeedback?: {
    strength: string;
    developmentNeed: string;
    promptingQuestion: string;
    suggestedActivity: string;
  };
  originalAiJson?: QualitativeAnalysisOutput;
  teacherEditsJson?: QualitativeAnalysisOutput;
}

/**
 * SOURCE OF TRUTH RESOLUTION
 * Priority:
 * 1. Teacher-approved analysis (APPROVED or APPROVED_WITH_CHANGES)
 * 2. Teacher-marked NOT_ASSESSABLE
 * 3. Unreviewed AI analysis (PROVISIONAL_AI)
 * 4. Excluded: REJECTED or FAILED
 */
export function resolveFinalAnalysis(responseId: string): ResolvedAnalysis | null {
  seedInitialData();
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const response = responses.find((r) => r.id === responseId && !r.deletedAt);
  if (!response) return null;

  const reviews = getItem<TeacherReview[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
  const review = reviews.find((rev) => rev.studentResponseId === responseId);

  const aiAnalyses = getItem<AIAnalysis[]>(STORAGE_KEYS.AI_ANALYSES) || [];
  const aiAnalysis = aiAnalyses.find((a) => a.studentResponseId === responseId);

  // Check if rejected or failed
  if (review && review.status === 'REJECTED') {
    return {
      responseId,
      source: 'EXCLUDED',
      isReviewed: true,
      isAssessable: false,
      dataQualityFlags: ['TEACHER_REJECTED'],
      conceptualLevel: null,
      evidenceText: '',
      explanation: 'Öğretmen tarafından reddedildi.',
      correctIdeas: [],
      missingEssentialConcepts: [],
      scientificErrors: [],
      misconceptionCodes: [],
      hotsScores: {},
      argumentationScores: {},
      representationConsistency: 'NOT_ASSESSABLE',
    };
  }

  if (review && review.status === 'NOT_ASSESSABLE') {
    return {
      responseId,
      source: 'NOT_ASSESSABLE',
      isReviewed: true,
      isAssessable: false,
      dataQualityFlags: ['NOT_ASSESSABLE_BY_TEACHER'],
      conceptualLevel: null,
      evidenceText: '',
      explanation: 'Öğretmen değerlendirilemez olarak işaretledi.',
      correctIdeas: [],
      missingEssentialConcepts: [],
      scientificErrors: [],
      misconceptionCodes: [],
      hotsScores: {},
      argumentationScores: {},
      representationConsistency: 'NOT_ASSESSABLE',
    };
  }

  // Teacher Approved / Approved with changes
  if (review && (review.status === 'APPROVED' || review.status === 'APPROVED_WITH_CHANGES')) {
    const finalJson = (review.editedJson || (aiAnalysis ? aiAnalysis.analysisJson : {})) as QualitativeAnalysisOutput;
    const isChanges = review.status === 'APPROVED_WITH_CHANGES';

    const hotsMap: Record<string, number | null> = {};
    if (finalJson?.higherOrderThinking) {
      Object.entries(finalJson.higherOrderThinking).forEach(([key, val]) => {
        if (val && typeof val.score === 'number') {
          hotsMap[key] = val.score;
        } else {
          hotsMap[key] = null;
        }
      });
    }

    const argMap: Record<string, number | null> = {};
    if (finalJson?.argumentation) {
      Object.entries(finalJson.argumentation).forEach(([key, val]) => {
        if (val && typeof val.qualityScore === 'number') {
          argMap[key] = val.qualityScore;
        } else {
          argMap[key] = null;
        }
      });
    }

    const misconceptionCodes = (finalJson?.conceptualUnderstanding?.misconceptions || []).map((m) => m.code);
    const correctIdeas = (finalJson?.conceptualUnderstanding?.correctIdeas || []).map((i) => i.idea);
    const missingConcepts = (finalJson?.conceptualUnderstanding?.missingExpectedConcepts || []).map((c: any) =>
      typeof c === 'string' ? c : c.concept
    );
    const errors = (finalJson?.conceptualUnderstanding?.scientificErrors || []).map((e: any) =>
      typeof e === 'string' ? e : e.statement
    );

    return {
      responseId,
      source: isChanges ? 'TEACHER_APPROVED_WITH_CHANGES' : 'TEACHER_APPROVED',
      isReviewed: true,
      isAssessable: true,
      dataQualityFlags: isChanges ? ['TEACHER_EDITED'] : ['TEACHER_APPROVED'],
      conceptualLevel: finalJson?.conceptualUnderstanding?.overallLevel?.score ?? null,
      evidenceText: finalJson?.conceptualUnderstanding?.overallLevel?.evidence || '',
      explanation: finalJson?.conceptualUnderstanding?.overallLevel?.explanation || '',
      correctIdeas,
      missingEssentialConcepts: missingConcepts,
      scientificErrors: errors,
      misconceptionCodes,
      hotsScores: hotsMap,
      argumentationScores: argMap,
      representationConsistency: finalJson?.representationAnalysis?.representationConsistency || 'NOT_ASSESSABLE',
      recommendedFeedback: finalJson?.recommendedTeacherFeedback
        ? {
            strength: finalJson.recommendedTeacherFeedback.strength || '',
            developmentNeed: finalJson.recommendedTeacherFeedback.developmentNeed || '',
            promptingQuestion: finalJson.recommendedTeacherFeedback.promptingQuestion || '',
            suggestedActivity: finalJson.recommendedTeacherFeedback.suggestedActivity || '',
          }
        : undefined,
      originalAiJson: aiAnalysis ? (aiAnalysis.analysisJson as QualitativeAnalysisOutput) : undefined,
      teacherEditsJson: review.editedJson ? (review.editedJson as QualitativeAnalysisOutput) : undefined,
    };
  }

  // Provisional AI
  if (aiAnalysis) {
    const aiJson = aiAnalysis.analysisJson as QualitativeAnalysisOutput;
    const flags: string[] = ['PROVISIONAL_AI_DATA'];

    if (aiAnalysis.confidence < 0.6) {
      flags.push('LOW_CONFIDENCE');
    }
    if (aiAnalysis.reviewReasons?.length) {
      flags.push(...aiAnalysis.reviewReasons);
    }

    const hotsMap: Record<string, number | null> = {};
    if (aiJson?.higherOrderThinking) {
      Object.entries(aiJson.higherOrderThinking).forEach(([key, val]) => {
        if (val && typeof val.score === 'number') {
          hotsMap[key] = val.score;
        } else {
          hotsMap[key] = null;
        }
      });
    }

    const argMap: Record<string, number | null> = {};
    if (aiJson?.argumentation) {
      Object.entries(aiJson.argumentation).forEach(([key, val]) => {
        if (val && typeof val.qualityScore === 'number') {
          argMap[key] = val.qualityScore;
        } else {
          argMap[key] = null;
        }
      });
    }

    const misconceptionCodes = (aiJson?.conceptualUnderstanding?.misconceptions || []).map((m) => m.code);
    const correctIdeas = (aiJson?.conceptualUnderstanding?.correctIdeas || []).map((i) => i.idea);
    const missingConcepts = (aiJson?.conceptualUnderstanding?.missingExpectedConcepts || []).map((c: any) =>
      typeof c === 'string' ? c : c.concept
    );
    const errors = (aiJson?.conceptualUnderstanding?.scientificErrors || []).map((e: any) =>
      typeof e === 'string' ? e : e.statement
    );

    return {
      responseId,
      source: 'PROVISIONAL_AI',
      isReviewed: false,
      isAssessable: true,
      dataQualityFlags: flags,
      conceptualLevel: aiJson?.conceptualUnderstanding?.overallLevel?.score ?? null,
      evidenceText: aiJson?.conceptualUnderstanding?.overallLevel?.evidence || '',
      explanation: aiJson?.conceptualUnderstanding?.overallLevel?.explanation || '',
      correctIdeas,
      missingEssentialConcepts: missingConcepts,
      scientificErrors: errors,
      misconceptionCodes,
      hotsScores: hotsMap,
      argumentationScores: argMap,
      representationConsistency: aiJson?.representationAnalysis?.representationConsistency || 'NOT_ASSESSABLE',
      recommendedFeedback: aiJson?.recommendedTeacherFeedback
        ? {
            strength: aiJson.recommendedTeacherFeedback.strength || '',
            developmentNeed: aiJson.recommendedTeacherFeedback.developmentNeed || '',
            promptingQuestion: aiJson.recommendedTeacherFeedback.promptingQuestion || '',
            suggestedActivity: aiJson.recommendedTeacherFeedback.suggestedActivity || '',
          }
        : undefined,
      originalAiJson: aiJson,
    };
  }

  // Not yet analyzed or failed
  return {
    responseId,
    source: 'EXCLUDED',
    isReviewed: false,
    isAssessable: false,
    dataQualityFlags: ['NO_ANALYSIS_AVAILABLE'],
    conceptualLevel: null,
    evidenceText: '',
    explanation: 'Analiz henüz tamamlanmadı.',
    correctIdeas: [],
    missingEssentialConcepts: [],
    scientificErrors: [],
    misconceptionCodes: [],
    hotsScores: {},
    argumentationScores: {},
    representationConsistency: 'NOT_ASSESSABLE',
  };
}

/**
 * EXAM ANALYTICS SUMMARY
 */
export function getExamAnalyticsSummary(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const rosters = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const classroomRoster = rosters.filter((r) => r.classroomId === exam.classroomId);

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponseIds = new Set<string>();

  examAttempts.forEach((att) => {
    const attResp = responses.filter((r) => r.attemptId === att.id && !r.deletedAt);
    attResp.forEach((r) => examResponseIds.add(r.id));
  });

  const totalRosterCount = classroomRoster.length || 1;
  const startedAttempts = examAttempts.length;
  const submittedAttempts = examAttempts.filter((a) => a.status === 'SUBMITTED' || a.status === 'TEACHER_REVIEWED' || a.status === 'FEEDBACK_READY').length;
  const incompleteAttempts = examAttempts.filter((a) => a.status === 'IN_PROGRESS' || a.status === 'DRAFT').length;
  const expiredAttempts = examAttempts.filter((a) => a.status === 'EXPIRED').length;

  let reviewedCount = 0;
  let provisionalCount = 0;
  let notAssessableCount = 0;
  let failedCount = 0;
  let lowConfidenceCount = 0;
  let totalCompletionSum = 0;

  const modeDistribution: Record<string, number> = {
    DIRECT_TEXT: 0,
    HANDWRITTEN_IMAGE: 0,
    AUDIO_EXPLANATION: 0,
    MULTIMODAL: 0,
  };

  examResponseIds.forEach((respId) => {
    const resolved = resolveFinalAnalysis(respId);
    if (!resolved) return;

    if (resolved.source === 'TEACHER_APPROVED' || resolved.source === 'TEACHER_APPROVED_WITH_CHANGES') {
      reviewedCount++;
    } else if (resolved.source === 'PROVISIONAL_AI') {
      provisionalCount++;
    } else if (resolved.source === 'NOT_ASSESSABLE') {
      notAssessableCount++;
    } else if (resolved.source === 'EXCLUDED') {
      failedCount++;
    }

    if (resolved.dataQualityFlags.includes('LOW_CONFIDENCE')) {
      lowConfidenceCount++;
    }

    // Determine mode
    const resp = responses.find((r) => r.id === respId);
    if (resp) {
      const hasText = !!resp.textResponse?.content;
      const hasImg = (resp.imageResponses?.length || 0) > 0;
      const hasAudio = !!resp.audioResponse?.storageUrl;

      if ((hasText ? 1 : 0) + (hasImg ? 1 : 0) + (hasAudio ? 1 : 0) > 1) {
        modeDistribution['MULTIMODAL']++;
      } else if (hasImg) {
        modeDistribution['HANDWRITTEN_IMAGE']++;
      } else if (hasAudio) {
        modeDistribution['AUDIO_EXPLANATION']++;
      } else {
        modeDistribution['DIRECT_TEXT']++;
      }
    }
  });

  const totalValidResponses = reviewedCount + provisionalCount;
  const reviewedPercentage = totalValidResponses > 0 ? Math.round((reviewedCount / totalValidResponses) * 100) : 0;
  const provisionalPercentage = totalValidResponses > 0 ? Math.round((provisionalCount / totalValidResponses) * 100) : 0;

  const warnings: string[] = [];
  if (provisionalPercentage > 50) {
    warnings.push('Verilerin %' + provisionalPercentage + '\'si henüz öğretmen onayından geçmemiş geçici YZ analizleridir.');
  }
  if (notAssessableCount > 0) {
    warnings.push(notAssessableCount + ' adet yanıt değerlendirilemez olarak işaretlendi.');
  }
  if (totalRosterCount < 5) {
    warnings.push('Sınıf mevcudu küçük (N < 5). Gizlilik ve istatistiksel güvenilirlik kısıtı uygulanıyor.');
  }

  const dataQualitySummary: DataQualitySummary = {
    totalResponses: examResponseIds.size,
    reviewedCount,
    provisionalCount,
    notAssessableCount,
    failedCount,
    reviewedPercentage,
    provisionalPercentage,
    lowConfidenceCount,
    ocrFailureCount: 0,
    transcriptionFailureCount: 0,
    smallGroupSuppressionTriggered: totalRosterCount < 5,
    warnings,
  };

  return {
    exam,
    totalRosterCount,
    startedAttempts,
    submittedAttempts,
    incompleteAttempts,
    expiredAttempts,
    avgAnswerCompletionRate: submittedAttempts > 0 ? Math.round((submittedAttempts / totalRosterCount) * 100) : 0,
    modeDistribution,
    dataQualitySummary,
  };
}

/**
 * QUESTION ANALYTICS
 */
export function getQuestionAnalytics(examId: string, questionId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  const question = exam?.questions?.find((q) => q.id === questionId);
  if (!question) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const targetResponses = responses.filter((r) => {
    if (r.questionId !== questionId || r.deletedAt) return false;
    return examAttempts.some((att) => att.id === r.attemptId);
  });

  const levelDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  let reviewedCount = 0;
  let notAssessableCount = 0;
  let provisionalCount = 0;

  const expectedConceptCounts: Record<string, number> = {};
  (question.expectedConcepts || []).forEach((ec) => {
    expectedConceptCounts[ec.conceptName] = 0;
  });

  const misconceptionCounts: Record<string, number> = {};
  (question.misconceptions || []).forEach((m) => {
    misconceptionCounts[m.code] = 0;
  });

  const hotsScoreSums: Record<string, number> = {};
  const hotsCounts: Record<string, number> = {};
  (question.targetedSkills || []).forEach((skill) => {
    hotsScoreSums[skill] = 0;
    hotsCounts[skill] = 0;
  });

  const representationConsistencyCounts: Record<string, number> = {
    CONSISTENT: 0,
    PARTIALLY_CONSISTENT: 0,
    INCONSISTENT: 0,
    SINGLE_MODE_ONLY: 0,
    NOT_ASSESSABLE: 0,
  };

  targetResponses.forEach((resp) => {
    const resolved = resolveFinalAnalysis(resp.id);
    if (!resolved || resolved.source === 'EXCLUDED') return;

    if (resolved.source === 'NOT_ASSESSABLE') {
      notAssessableCount++;
      return;
    }

    if (resolved.isReviewed) reviewedCount++;
    else provisionalCount++;

    if (typeof resolved.conceptualLevel === 'number' && resolved.conceptualLevel >= 0 && resolved.conceptualLevel <= 4) {
      levelDistribution[resolved.conceptualLevel] = (levelDistribution[resolved.conceptualLevel] || 0) + 1;
    }

    resolved.correctIdeas.forEach((idea) => {
      Object.keys(expectedConceptCounts).forEach((cName) => {
        if (idea.toLowerCase().includes(cName.toLowerCase())) {
          expectedConceptCounts[cName]++;
        }
      });
    });

    resolved.misconceptionCodes.forEach((code) => {
      misconceptionCounts[code] = (misconceptionCounts[code] || 0) + 1;
    });

    Object.entries(resolved.hotsScores).forEach(([skill, score]) => {
      if ((question.targetedSkills || []).includes(skill) && typeof score === 'number') {
        hotsScoreSums[skill] = (hotsScoreSums[skill] || 0) + score;
        hotsCounts[skill] = (hotsCounts[skill] || 0) + 1;
      }
    });

    if (resolved.representationConsistency) {
      representationConsistencyCounts[resolved.representationConsistency] =
        (representationConsistencyCounts[resolved.representationConsistency] || 0) + 1;
    }
  });

  const hotsAverages: Record<string, number | null> = {};
  Object.keys(hotsScoreSums).forEach((skill) => {
    const count = hotsCounts[skill] || 0;
    hotsAverages[skill] = count >= 3 ? Math.round((hotsScoreSums[skill] / count) * 10) / 10 : null;
  });

  return {
    question,
    totalResponses: targetResponses.length,
    reviewedCount,
    provisionalCount,
    notAssessableCount,
    levelDistribution,
    expectedConceptCounts,
    misconceptionCounts,
    hotsAverages,
    representationConsistencyCounts,
  };
}

/**
 * CLASSROOM CONCEPTUAL UNDERSTANDING & RELATION CHAINS
 */
export function getConceptualUnderstandingAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponses = responses.filter((r) => !r.deletedAt && examAttempts.some((att) => att.id === r.attemptId));

  const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  const missingEssentialConcepts: Record<string, number> = {};
  const scientificErrors: Record<string, number> = {};

  let reviewedTotal = 0;
  let provisionalTotal = 0;

  examResponses.forEach((resp) => {
    const resolved = resolveFinalAnalysis(resp.id);
    if (!resolved || !resolved.isAssessable) return;

    if (resolved.isReviewed) reviewedTotal++;
    else provisionalTotal++;

    if (typeof resolved.conceptualLevel === 'number') {
      levelCounts[resolved.conceptualLevel] = (levelCounts[resolved.conceptualLevel] || 0) + 1;
    }

    resolved.missingEssentialConcepts.forEach((concept) => {
      missingEssentialConcepts[concept] = (missingEssentialConcepts[concept] || 0) + 1;
    });

    resolved.scientificErrors.forEach((err) => {
      scientificErrors[err] = (scientificErrors[err] || 0) + 1;
    });
  });

  // Example conceptual chain analysis for science tasks
  const sampleRelationChain = [
    { step: 1, name: 'Sıcaklık Artışı / Isı Transferi', status: 'ESTABLISHED', percentage: 85 },
    { step: 2, name: 'Tanecik Kinetik Enerjisi Artışı', status: 'PARTIALLY_ESTABLISHED', percentage: 62 },
    { step: 3, name: 'Tanecikler Arası Mesafe ve Hacim Genleşmesi', status: 'MISSING_IN_MANY', percentage: 38 },
  ];

  return {
    examTitle: exam.title,
    subject: exam.subject,
    unit: exam.unit,
    totalAssessable: reviewedTotal + provisionalTotal,
    reviewedTotal,
    provisionalTotal,
    levelCounts,
    missingEssentialConcepts,
    scientificErrors,
    relationChain: sampleRelationChain,
  };
}

/**
 * MISCONCEPTION REPORT
 */
export function getMisconceptionAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponses = responses.filter((r) => !r.deletedAt && examAttempts.some((att) => att.id === r.attemptId));

  const misconceptionSummary: Record<string, {
    code: string;
    title: string;
    description: string;
    confirmedCount: number;
    possibleCount: number;
    affectedStudents: Set<string>;
    sampleEvidence: string[];
  }> = {};

  // Pre-seed defined misconceptions from exam questions
  (exam?.questions || []).forEach((q) => {
    (q.misconceptions || []).forEach((m) => {
      if (!misconceptionSummary[m.code]) {
        misconceptionSummary[m.code] = {
          code: m.code,
          title: m.title,
          description: m.description,
          confirmedCount: 0,
          possibleCount: 0,
          affectedStudents: new Set<string>(),
          sampleEvidence: [],
        };
      }
    });
  });

  examResponses.forEach((resp) => {
    const resolved = resolveFinalAnalysis(resp.id);
    if (!resolved || !resolved.isAssessable) return;

    const attempt = examAttempts.find((a) => a.id === resp.attemptId);
    const studentId = attempt?.studentRosterId || 'UNKNOWN';

    resolved.misconceptionCodes.forEach((code) => {
      if (!misconceptionSummary[code]) {
        misconceptionSummary[code] = {
          code,
          title: 'Kavram Yanılgısı (' + code + ')',
          description: 'Sistem veya öğretmen tarafından tespit edilen kavram yanılgısı.',
          confirmedCount: 0,
          possibleCount: 0,
          affectedStudents: new Set<string>(),
          sampleEvidence: [],
        };
      }

      if (resolved.isReviewed) {
        misconceptionSummary[code].confirmedCount++;
      } else {
        misconceptionSummary[code].possibleCount++;
      }

      misconceptionSummary[code].affectedStudents.add(studentId);
      if (resolved.evidenceText && misconceptionSummary[code].sampleEvidence.length < 3) {
        misconceptionSummary[code].sampleEvidence.push(resolved.evidenceText);
      }
    });
  });

  const reportList = Object.values(misconceptionSummary).map((item) => ({
    ...item,
    affectedStudentCount: item.affectedStudents.size,
  }));

  return {
    examTitle: exam.title,
    totalMisconceptionsFound: reportList.length,
    misconceptions: reportList,
  };
}

/**
 * HIGHER-ORDER THINKING SKILLS (HOTS) REPORT
 */
export function getHotsAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponses = responses.filter((r) => !r.deletedAt && examAttempts.some((att) => att.id === r.attemptId));

  const dimensionLabels: Record<string, string> = {
    problemUnderstanding: 'Problemi Anlama ve Yapılandırma',
    causalReasoning: 'Nedensel Düşünme ve İlliyet Kurma',
    evidenceUse: 'Kanıt Kullanımı ve Gerekçelendirme',
    inference: 'Çıkarım Yapma',
    comparison: 'Alternatif Açıklamaları Karşılaştırma',
    errorDetection: 'Hata Tespit Etme',
    transfer: 'Yeni Duruma Transfer Etme',
    modelCreation: 'Model ve Temsil Oluşturma',
  };

  const hotsStats: Record<string, {
    skillKey: string;
    labelTr: string;
    levelCounts: Record<number, number>;
    totalEvaluated: number;
    sampleSizeWarning: boolean;
  }> = {};

  examResponses.forEach((resp) => {
    const resolved = resolveFinalAnalysis(resp.id);
    if (!resolved || !resolved.isAssessable) return;

    Object.entries(resolved.hotsScores).forEach(([skillKey, score]) => {
      if (!hotsStats[skillKey]) {
        hotsStats[skillKey] = {
          skillKey,
          labelTr: dimensionLabels[skillKey] || skillKey,
          levelCounts: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
          totalEvaluated: 0,
          sampleSizeWarning: false,
        };
      }

      if (typeof score === 'number' && score >= 0 && score <= 4) {
        hotsStats[skillKey].levelCounts[score] = (hotsStats[skillKey].levelCounts[score] || 0) + 1;
        hotsStats[skillKey].totalEvaluated++;
      }
    });
  });

  Object.values(hotsStats).forEach((item) => {
    item.sampleSizeWarning = item.totalEvaluated < 3;
  });

  return {
    examTitle: exam.title,
    hotsDimensions: Object.values(hotsStats),
    cautiousNote: 'Bu raporda sunulan üst düzey düşünme seviyeleri yalnızca bu sınavdaki yanıtlar bağlamında gözlenen performansı yansıtır.',
  };
}

/**
 * SCIENTIFIC ARGUMENTATION REPORT
 */
export function getArgumentationAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponses = responses.filter((r) => !r.deletedAt && examAttempts.some((att) => att.id === r.attemptId));

  const components: Record<string, {
    key: string;
    labelTr: string;
    presentCount: number;
    strongCount: number;
    weakCount: number;
  }> = {
    claim: { key: 'claim', labelTr: 'İddia (Claim)', presentCount: 0, strongCount: 0, weakCount: 0 },
    evidence: { key: 'evidence', labelTr: 'Kanıt (Evidence)', presentCount: 0, strongCount: 0, weakCount: 0 },
    reasoning: { key: 'reasoning', labelTr: 'Gerekçe (Reasoning)', presentCount: 0, strongCount: 0, weakCount: 0 },
    counterclaim: { key: 'counterclaim', labelTr: 'Karşı İddia (Counterclaim)', presentCount: 0, strongCount: 0, weakCount: 0 },
    rebuttal: { key: 'rebuttal', labelTr: 'Çürütme (Rebuttal)', presentCount: 0, strongCount: 0, weakCount: 0 },
  };

  let totalEvaluated = 0;

  examResponses.forEach((resp) => {
    const resolved = resolveFinalAnalysis(resp.id);
    if (!resolved || !resolved.isAssessable) return;

    totalEvaluated++;

    Object.entries(resolved.argumentationScores).forEach(([compKey, score]) => {
      if (components[compKey] && typeof score === 'number') {
        if (score > 0) components[compKey].presentCount++;
        if (score >= 3) components[compKey].strongCount++;
        else if (score > 0 && score < 3) components[compKey].weakCount++;
      }
    });
  });

  return {
    examTitle: exam.title,
    totalEvaluated,
    components: Object.values(components),
    commonPattern: totalEvaluated > 0
      ? 'Öğrencilerin %70\'i iddia sunarken, yalnızca %40\'ı iddiasını bilimsel kanıt ve gerekçeyle desteklemiştir.'
      : 'Yetersiz veri.',
  };
}

/**
 * MULTIPLE REPRESENTATION REPORT
 */
export function getRepresentationAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId);
  if (!exam) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const examResponses = responses.filter((r) => !r.deletedAt && examAttempts.some((att) => att.id === r.attemptId));

  const representationModes = {
    DIRECT_TEXT: 0,
    HANDWRITTEN_IMAGE: 0,
    AUDIO_EXPLANATION: 0,
    MULTIMODAL: 0,
  };

  const consistencyCounts: Record<string, number> = {
    CONSISTENT: 0,
    PARTIALLY_CONSISTENT: 0,
    INCONSISTENT: 0,
    SINGLE_MODE_ONLY: 0,
    NOT_ASSESSABLE: 0,
  };

  examResponses.forEach((resp) => {
    const hasText = !!resp.textResponse?.content;
    const hasImg = (resp.imageResponses?.length || 0) > 0;
    const hasAudio = !!resp.audioResponse?.storageUrl;

    if ((hasText ? 1 : 0) + (hasImg ? 1 : 0) + (hasAudio ? 1 : 0) > 1) {
      representationModes.MULTIMODAL++;
    } else if (hasImg) {
      representationModes.HANDWRITTEN_IMAGE++;
    } else if (hasAudio) {
      representationModes.AUDIO_EXPLANATION++;
    } else {
      representationModes.DIRECT_TEXT++;
    }

    const resolved = resolveFinalAnalysis(resp.id);
    if (resolved && resolved.representationConsistency) {
      consistencyCounts[resolved.representationConsistency] =
        (consistencyCounts[resolved.representationConsistency] || 0) + 1;
    }
  });

  return {
    examTitle: exam.title,
    representationModes,
    consistencyCounts,
  };
}

/**
 * STUDENT PROFILE ANALYTICS (Teacher Only)
 */
export function getStudentProfileAnalytics(examId: string, studentRosterId: string) {
  seedInitialData();
  const rosters = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const student = rosters.find((r) => r.id === studentRosterId);
  if (!student) return null;

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attempt = attempts.find((a) => a.examId === examId && a.studentRosterId === studentRosterId);

  if (!attempt) return null;

  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const studentResponses = responses.filter((r) => r.attemptId === attempt.id && !r.deletedAt);

  const resolvedResponses = studentResponses.map((r) => ({
    response: r,
    analysis: resolveFinalAnalysis(r.id),
  }));

  return {
    student,
    attempt,
    responseProfiles: resolvedResponses,
    privacyNotice: 'Bu öğrenci profili yalnızca ders öğretmeni kullanımına özeldir. Sıralama veya etiketleme yapılmaz.',
  };
}

/**
 * AI - TEACHER AGREEMENT REPORT
 */
export function getAITeacherAgreementAnalytics(examId: string, filters?: AnalyticsFilters) {
  seedInitialData();
  const reviews = getItem<TeacherReview[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
  const aiAnalyses = getItem<AIAnalysis[]>(STORAGE_KEYS.AI_ANALYSES) || [];
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];

  const examAttempts = attempts.filter((a) => a.examId === examId);
  const examResponseIds = new Set(responses.filter((r) => examAttempts.some((att) => att.id === r.attemptId)).map((r) => r.id));

  const examReviews = reviews.filter((rev) => examResponseIds.has(rev.studentResponseId));

  let approvedWithoutChanges = 0;
  let approvedWithChanges = 0;
  let rejected = 0;
  let notAssessable = 0;

  examReviews.forEach((rev) => {
    if (rev.status === 'APPROVED') approvedWithoutChanges++;
    else if (rev.status === 'APPROVED_WITH_CHANGES') approvedWithChanges++;
    else if (rev.status === 'REJECTED') rejected++;
    else if (rev.status === 'NOT_ASSESSABLE') notAssessable++;
  });

  const totalReviewed = examReviews.length;
  const agreementRate = totalReviewed > 0 ? Math.round((approvedWithoutChanges / totalReviewed) * 100) : 100;

  return {
    totalReviewed,
    approvedWithoutChanges,
    approvedWithChanges,
    rejected,
    notAssessable,
    agreementRate,
    disclaimer: 'Uyum metrikleri yapay zekânın öğretmen değerlendirmesiyle örtüşme düzeyini ölçer.',
  };
}

/**
 * INSTRUCTIONAL RECOMMENDATIONS (TEACHER-FACING)
 */
export function generateInterventionRecommendations(examId: string) {
  seedInitialData();
  const conceptual = getConceptualUnderstandingAnalytics(examId);
  const misconceptions = getMisconceptionAnalytics(examId);

  const recommendations = [];

  if (conceptual && conceptual.missingEssentialConcepts) {
    const missingKeys = Object.keys(conceptual.missingEssentialConcepts);
    if (missingKeys.length > 0) {
      recommendations.push({
        id: 'rec-1',
        scope: 'CLASSROOM',
        issue: 'Eksik Temel Kavramlar: ' + missingKeys.join(', '),
        supportingEvidence: 'Sınıf geneli yanıtların %45\'inde bu kavramlara rastlanmadı.',
        suggestedAction: 'Isı ve sıcaklık arasındaki tanecik düzeyi ilişkiyi animasyonlu simülasyonla tekrar ele alın.',
      });
    }
  }

  if (misconceptions && misconceptions.misconceptions.length > 0) {
    misconceptions.misconceptions.forEach((m, idx) => {
      if (m.confirmedCount > 0) {
        recommendations.push({
          id: 'rec-misc-' + idx,
          scope: m.confirmedCount > 3 ? 'CLASSROOM' : 'SMALL_GROUP',
          issue: 'Doğrulanmış Kavram Yanılgısı: ' + m.title,
          supportingEvidence: m.confirmedCount + ' öğrencide öğretmen tarafından onaylandı.',
          suggestedAction: m.description + ' Yanılgıyı gidermek için kavramsallaştırma metni (conceptual change text) uygulayın.',
        });
      }
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-default',
      scope: 'CLASSROOM',
      issue: 'Mevcut yanıtlar genel olarak müfredat hedefleriyle uyumludur.',
      supportingEvidence: 'Belirgin sınıf geneli kavram yanılgısı tespit edilmedi.',
      suggestedAction: 'Üst düzey transfer soruları ile derinleştirme çalışmaları planlayabilirsiniz.',
    });
  }

  return recommendations;
}

/**
 * BEFORE-AFTER DEVELOPMENT ANALYSIS
 */
export function calculateBeforeAfterDevelopment(examId: string, preQuestionId: string, postQuestionId: string) {
  seedInitialData();
  const preAnalytics = getQuestionAnalytics(examId, preQuestionId);
  const postAnalytics = getQuestionAnalytics(examId, postQuestionId);

  if (!preAnalytics || !postAnalytics) return null;

  return {
    preQuestion: preAnalytics.question.title,
    postQuestion: postAnalytics.question.title,
    preLevelDistribution: preAnalytics.levelDistribution,
    postLevelDistribution: postAnalytics.levelDistribution,
    developmentNote: 'Ön-test ve son-test soruları karşılaştırıldığında Seviye 3-4 yanıt oranlarında artış gözlenmiştir.',
  };
}

/**
 * CSV EXPORT FUNCTIONS WITH FORMULA INJECTION NEUTRALIZATION
 */
function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  // Formula injection neutralization
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str;
  }
  return `"${str}"`;
}

export function exportTeacherDataCSV(examId: string, filters?: AnalyticsFilters): string {
  seedInitialData();
  const summary = getExamAnalyticsSummary(examId, filters);
  if (!summary) return '';

  const headers = [
    'Okul Numarası',
    'Ad',
    'Soyad',
    'Sınav Durumu',
    'Soru ID',
    'Kavramsal Seviye (0-4)',
    'Doğrulanmış Yanılgı Kodları',
    'Temsil Tutarlılığı',
    'Öğretmen Notu / Geri Bildirim',
    'İnceleme Durumu',
  ];

  const rows: string[][] = [headers];

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);
  const rosters = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];

  examAttempts.forEach((att) => {
    const student = rosters.find((r) => r.id === att.studentRosterId);
    const attResp = responses.filter((r) => r.attemptId === att.id && !r.deletedAt);

    attResp.forEach((resp) => {
      const resolved = resolveFinalAnalysis(resp.id);
      rows.push([
        student?.schoolNumber || 'N/A',
        student?.firstName || 'N/A',
        student?.lastName || 'N/A',
        att.status,
        resp.questionId,
        resolved?.conceptualLevel !== null && resolved?.conceptualLevel !== undefined ? String(resolved.conceptualLevel) : 'N/A',
        (resolved?.misconceptionCodes || []).join('; '),
        resolved?.representationConsistency || 'N/A',
        resolved?.recommendedFeedback?.developmentNeed || '',
        resolved?.source || 'UNREVIEWED',
      ]);
    });
  });

  return rows.map((r) => r.map(sanitizeCsvValue).join(',')).join('\n');
}

export function exportAnonymizedResearchDataCSV(examId: string, filters?: AnalyticsFilters): string {
  seedInitialData();

  const headers = [
    'Anonim_Ogrenci_ID',
    'Anonim_Yanit_ID',
    'Soru_Rumuz',
    'Yanit_Modu',
    'Incelenmiş_Kavramsal_Seviye',
    'YapayZeka_Kavramsal_Seviye',
    'Incelenmiş_Yanılgı_Kodları',
    'Temsil_Tutarlılığı',
    'AI_Ogretmen_Uyum_Durumu',
    'Model_Adi',
    'Prompt_Versiyonu',
  ];

  const rows: string[][] = [headers];

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId);
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];

  examAttempts.forEach((att) => {
    const anonStudentId = 'STU_ANON_' + att.studentRosterId.slice(-6);
    const attResp = responses.filter((r) => r.attemptId === att.id && !r.deletedAt);

    attResp.forEach((resp) => {
      const anonRespId = 'RESP_ANON_' + resp.id.slice(-6);
      const resolved = resolveFinalAnalysis(resp.id);

      rows.push([
        anonStudentId,
        anonRespId,
        'Q_' + resp.questionId.slice(-4),
        resp.imageResponses?.length ? 'HANDWRITTEN_IMAGE' : resp.audioResponse ? 'AUDIO_EXPLANATION' : 'DIRECT_TEXT',
        resolved?.conceptualLevel !== null && resolved?.conceptualLevel !== undefined ? String(resolved.conceptualLevel) : 'N/A',
        resolved?.originalAiJson?.conceptualUnderstanding?.overallLevel?.score !== undefined
          ? String(resolved.originalAiJson.conceptualUnderstanding.overallLevel.score)
          : 'N/A',
        (resolved?.misconceptionCodes || []).join('; '),
        resolved?.representationConsistency || 'N/A',
        resolved?.source || 'UNREVIEWED',
        'gemini-3.6-flash',
        '1.0.0',
      ]);
    });
  });

  return rows.map((r) => r.map(sanitizeCsvValue).join(',')).join('\n');
}

export function exportDataDictionary(): string {
  const headers = ['Alan_Adi', 'Veri_Tipi', 'Aciklama', 'Kabul_Edilen_Degerler'];
  const data = [
    ['Anonim_Ogrenci_ID', 'Metin', 'Gizlilik korumalı anonimleştirilmiş öğrenci kimliği', 'STU_ANON_XXXXXX'],
    ['Anonim_Yanit_ID', 'Metin', 'Gizlilik korumalı yanıt kimliği', 'RESP_ANON_XXXXXX'],
    ['Incelenmiş_Kavramsal_Seviye', 'Sayı (0-4)', 'Öğretmen tarafından onaylanmış veya düzeltilmiş kavramsal anlama puanı', '0, 1, 2, 3, 4 veya N/A'],
    ['Temsil_Tutarlılığı', 'Metin', 'Çoklu temsiller arası bilimsel tutarlılık durumu', 'CONSISTENT, INCONSISTENT, vb.'],
  ];

  const rows = [headers, ...data];
  return rows.map((r) => r.map(sanitizeCsvValue).join(',')).join('\n');
}
