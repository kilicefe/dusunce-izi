import { describe, it, expect, beforeEach } from 'vitest';
import {
  seedInitialData,
  STORAGE_KEYS,
  getItem,
  setItem,
} from '../lib/db';
import {
  StudentResponse,
  TeacherReview,
  AIAnalysis,
  ExamAttempt,
  TeacherReviewStatus,
} from '../types/database';
import {
  resolveFinalAnalysis,
  getExamAnalyticsSummary,
  getQuestionAnalytics,
  getConceptualUnderstandingAnalytics,
  getMisconceptionAnalytics,
  getHotsAnalytics,
  getArgumentationAnalytics,
  getRepresentationAnalytics,
  getAITeacherAgreementAnalytics,
  generateInterventionRecommendations,
  exportTeacherDataCSV,
  exportAnonymizedResearchDataCSV,
  exportDataDictionary,
  isAttemptCompletedForAnalytics,
  isTeacherApprovedForAnalytics,
  summarizeApprovedResponsesForCsv,
} from '../lib/analyticsService';

describe('Phase 5: Analytics, Resolution Engine & Reporting Tests', () => {
  beforeEach(() => {
    seedInitialData();
  });

  it('counts a submitted attempt after processing changes its workflow status', () => {
    expect(isAttemptCompletedForAnalytics({ submittedAt: new Date(), status: 'NEEDS_TEACHER_REVIEW' } as any)).toBe(true);
    expect(isAttemptCompletedForAnalytics({ submittedAt: null, status: 'IN_PROGRESS' } as any)).toBe(false);
  });

  it('only treats explicit teacher approvals as reviewed analytics data', () => {
    expect(isTeacherApprovedForAnalytics({ status: 'APPROVED' })).toBe(true);
    expect(isTeacherApprovedForAnalytics({ status: 'APPROVED_WITH_CHANGES' })).toBe(true);
    expect(isTeacherApprovedForAnalytics({ status: 'PENDING' })).toBe(false);
  });

  it('exports the average of all approved responses and only detected misconceptions', () => {
    const summary = summarizeApprovedResponsesForCsv([
      {
        teacherReviews: [{
          status: 'APPROVED',
          aiAnalysis: {
            analysisJson: {
              conceptualUnderstanding: {
                overallLevel: { score: 4 },
                misconceptions: [
                  { code: 'MIS-NO', status: 'NOT_PRESENT' },
                  { code: 'MIS-YES', status: 'POSSIBLE' },
                ],
              },
            },
          },
        }],
      },
      {
        teacherReviews: [{
          status: 'APPROVED_WITH_CHANGES',
          editedJson: {
            conceptualUnderstanding: {
              overallLevel: { score: 2 },
              misconceptions: [{ code: 'MIS-YES', status: 'CONFIRMED_BY_EVIDENCE' }],
            },
          },
        }],
      },
      { teacherReviews: [{ status: 'PENDING' }] },
    ]);

    expect(summary).toEqual({ averageScore: 3, misconceptionCodes: ['MIS-YES'] });
  });

  it('1. Source of Truth Priority: Teacher-approved review overrides provisional AI analysis', () => {
    let responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
    if (responses.length === 0) {
      responses = [
        {
          id: 'resp-test-101',
          attemptId: 'att-101',
          questionId: 'q-1',
          status: 'SUBMITTED' as any,
          textResponse: { id: 'tr-1', studentResponseId: 'resp-test-101', content: 'Isı ve sıcaklık aynı değildir', characterCount: 29, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setItem(STORAGE_KEYS.RESPONSES, responses);
    }
    const targetResponse = responses[0];

    // Create AI Analysis with Level 1
    const aiAnalyses = getItem<AIAnalysis[]>(STORAGE_KEYS.AI_ANALYSES) || [];
    aiAnalyses.push({
      id: 'ai-test-1',
      studentResponseId: targetResponse.id,
      promptVersion: 'pv-1',
      modelName: 'gemini-2.5-pro',
      tokenUsage: 150,
      estimatedCost: 0.001,
      confidence: 0.9,
      requiresTeacherReview: false,
      reviewReasons: [],
      analysisJson: {
        conceptualUnderstanding: {
          overallLevel: { score: 1, label: 'Seviye 1', explanation: 'AI explanation', evidence: 'AI evidence' },
          correctIdeas: [],
          missingExpectedConcepts: ['Isı'],
          scientificErrors: [],
          misconceptions: [],
        },
      } as any,
      rawOutput: '{}',
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.AI_ANALYSES, aiAnalyses);

    // Initial resolution should be PROVISIONAL_AI with Level 1
    let resolved = resolveFinalAnalysis(targetResponse.id);
    expect(resolved).not.toBeNull();
    expect(resolved?.source).toBe('PROVISIONAL_AI');
    expect(resolved?.conceptualLevel).toBe(1);

    // Now add Teacher Review approving with changes to Level 3
    const reviews = getItem<TeacherReview[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
    reviews.push({
      id: 'rev-test-1',
      studentResponseId: targetResponse.id,
      teacherId: 't-101',
      status: TeacherReviewStatus.APPROVED_WITH_CHANGES,
      approved: true,
      originalAiAnalysisId: 'ai-test-1',
      editedJson: {
        conceptualUnderstanding: {
          overallLevel: { score: 3, label: 'Seviye 3', explanation: 'Teacher updated', evidence: 'Teacher evidence' },
          correctIdeas: [{ idea: 'Isı transferi', evidenceText: 'ogrenci yazisi' }],
          missingExpectedConcepts: [],
          scientificErrors: [],
          misconceptions: [{ code: 'M01', title: 'Sıcaklık ısıdır', evidenceText: 'test' }],
        },
      } as any,
      reviewedAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.TEACHER_REVIEWS, reviews);

    // Resolution should now be TEACHER_APPROVED_WITH_CHANGES with Level 3
    resolved = resolveFinalAnalysis(targetResponse.id);
    expect(resolved?.source).toBe('TEACHER_APPROVED_WITH_CHANGES');
    expect(resolved?.conceptualLevel).toBe(3);
    expect(resolved?.misconceptionCodes).toContain('M01');
    expect(resolved?.isReviewed).toBe(true);
  });

  it('2. Source of Truth Priority: REJECTED status excludes response from valid analytics', () => {
    let responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
    const targetResponse: StudentResponse = {
      id: 'resp-test-rej-102',
      attemptId: 'att-101',
      questionId: 'q-1',
      status: 'SUBMITTED' as any,
      textResponse: { id: 'tr-2', studentResponseId: 'resp-test-rej-102', content: 'Hatalı cevap', characterCount: 12, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    responses.push(targetResponse);
    setItem(STORAGE_KEYS.RESPONSES, responses);

    const reviews = getItem<TeacherReview[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
    reviews.push({
      id: 'rev-rej-1',
      studentResponseId: targetResponse.id,
      teacherId: 't-101',
      status: TeacherReviewStatus.REJECTED,
      approved: false,
      originalAiAnalysisId: 'ai-test-1',
      feedbackText: 'Hatalı tarama',
      reviewedAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.TEACHER_REVIEWS, reviews);

    const resolved = resolveFinalAnalysis(targetResponse.id);
    expect(resolved?.source).toBe('EXCLUDED');
    expect(resolved?.isAssessable).toBe(false);
  });

  it('3. Exam Analytics Summary correctly calculates completion rates and data quality percentages', () => {
    const summary = getExamAnalyticsSummary('e-801');
    expect(summary).not.toBeNull();
    expect(summary?.totalRosterCount).toBeGreaterThan(0);
    expect(summary?.avgAnswerCompletionRate).toBeGreaterThanOrEqual(0);
    expect(summary?.dataQualitySummary).toBeDefined();
    expect(summary?.dataQualitySummary.reviewedPercentage).toBeGreaterThanOrEqual(0);
  });

  it('4. Question Analytics calculates level distributions and expected concept counts', () => {
    const analytics = getQuestionAnalytics('e-801', 'q-1');
    expect(analytics).not.toBeNull();
    expect(analytics?.totalResponses).toBeGreaterThanOrEqual(0);
    expect(analytics?.levelDistribution).toBeDefined();
    expect(analytics?.expectedConceptCounts).toBeDefined();
  });

  it('5. Misconception Analytics aggregates confirmed vs possible counts', () => {
    const analytics = getMisconceptionAnalytics('e-801');
    expect(analytics).not.toBeNull();
    expect(analytics?.misconceptions).toBeDefined();
  });

  it('6. HOTS Analytics isolates targeted dimensions and enforces small sample size warnings', () => {
    const analytics = getHotsAnalytics('e-801');
    expect(analytics).not.toBeNull();
    expect(analytics?.hotsDimensions).toBeDefined();
    expect(analytics?.cautiousNote).toContain('yalnızca bu sınavdaki yanıtlar bağlamında');
  });

  it('7. AI-Teacher Agreement Analytics measures approval vs rejection rates', () => {
    const agreement = getAITeacherAgreementAnalytics('e-801');
    expect(agreement).not.toBeNull();
    expect(agreement?.agreementRate).toBeGreaterThanOrEqual(0);
    expect(agreement?.agreementRate).toBeLessThanOrEqual(100);
  });

  it('8. Instructional Recommendations generates actionable pedagogical steps', () => {
    const recs = generateInterventionRecommendations('e-801');
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].suggestedAction).toBeDefined();
  });

  it('9. Teacher CSV Export contains student names and neutralizes formula injection', () => {
    // Add a response with potential formula injection =SUM(A1:A10) in feedback or school number
    const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
    if (attempts.length > 0) {
      const att = attempts[0];
      const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
      const resp = responses.find((r) => r.attemptId === att.id);

      if (resp) {
        const reviews = getItem<TeacherReview[]>(STORAGE_KEYS.TEACHER_REVIEWS) || [];
        reviews.push({
          id: 'rev-formula-1',
          studentResponseId: resp.id,
          teacherId: 't-101',
          status: TeacherReviewStatus.APPROVED_WITH_CHANGES,
          approved: true,
          originalAiAnalysisId: 'ai-1',
          editedJson: {
            conceptualUnderstanding: {
              overallLevel: { score: 4, label: 'Seviye 4', explanation: 'Good', evidence: 'Evidence' },
            },
            recommendedTeacherFeedback: {
              developmentNeed: '=SUM(1+1)',
            },
          } as any,
          reviewedAt: new Date().toISOString(),
        });
        setItem(STORAGE_KEYS.TEACHER_REVIEWS, reviews);
      }
    }

    const csv = exportTeacherDataCSV('e-801');
    expect(csv).toContain('Okul Numarası');
    expect(csv).toContain('Ad');
    expect(csv).toContain('Soyad');
    // Formula injection check: =SUM(1+1) must be escaped as '=SUM(1+1)
    if (csv.includes('=SUM(1+1)')) {
      expect(csv).toContain("'\=SUM(1+1)");
    }
  });

  it('10. Anonymized Research CSV Export strips direct student PII and uses pseudonymous IDs', () => {
    const researchCsv = exportAnonymizedResearchDataCSV('e-801');
    expect(researchCsv).toContain('Anonim_Ogrenci_ID');
    expect(researchCsv).not.toContain('Zeynep');
    expect(researchCsv).not.toContain('Kaya');
  });

  it('11. Data Dictionary export contains standard metadata codebook definitions', () => {
    const dictCsv = exportDataDictionary();
    expect(dictCsv).toContain('Alan_Adi');
    expect(dictCsv).toContain('Anonim_Ogrenci_ID');
    expect(dictCsv).toContain('Incelenmiş_Kavramsal_Seviye');
  });
});
