import { describe, it, expect, beforeEach } from 'vitest';
import {
  createQualitativeAnalysisResponseJsonSchema,
  parseAndValidateAIAnalysis,
} from '../lib/zodSchemas';
import {
  extractHandwritingOCR,
  transcribeAudio,
  analyzeVisualRepresentation,
  analyzeQualitativeResponse,
} from '../lib/aiProvider';
import {
  enqueueResponseProcessing,
  getAllProcessingJobs,
} from '../lib/processingPipeline';
import {
  resetMemoryStore,
  seedInitialData,
  getTeacherReviewQueue,
  approveTeacherReview,
  updateTeacherReviewWithEdits,
  rejectTeacherReview,
  getAIAnalysisForResponse,
} from '../lib/db';

describe('Phase 4 Multimodal Processing & AI Qualitative Analysis Tests', () => {
  beforeEach(() => {
    resetMemoryStore();
    seedInitialData();
  });

  describe('Gemini structured output schema', () => {
    it('requires the complete analysis envelope and removes unsupported metadata', () => {
      const schema = createQualitativeAnalysisResponseJsonSchema() as {
        required?: string[];
        properties?: Record<string, unknown>;
      };
      const serialized = JSON.stringify(schema);

      expect(schema.required).toEqual(expect.arrayContaining([
        'conceptualUnderstanding',
        'higherOrderThinking',
        'recommendedTeacherFeedback',
        'analysisConfidence',
      ]));
      expect(schema.properties).toHaveProperty('conceptualUnderstanding');
      expect(serialized).not.toContain('"$schema"');
      expect(serialized).not.toContain('"default"');
    });

    it('only asks Gemini for the HOTS dimensions targeted by the question', () => {
      const schema = createQualitativeAnalysisResponseJsonSchema([
        'causalReasoning',
        'problemUnderstanding',
      ]) as any;
      const hotsProperties = schema.properties.higherOrderThinking.properties;

      expect(Object.keys(hotsProperties)).toEqual([
        'problemUnderstanding',
        'causalReasoning',
      ]);
      expect(hotsProperties).not.toHaveProperty('metacognition');
    });
  });

  describe('Zod Schema & Safe Repair Validation', () => {
    it('validates a correct structured QualitativeAnalysisOutput object', () => {
      const validPayload = {
        schemaVersion: '1.0.0',
        analysisSummary: 'Öğrenci cevabı kavramsal olarak açıklayıcıdır.',
        responseModes: ['direct_text', 'handwritten_image'],
        processingCompleteness: {
          typedTextAvailable: true,
          ocrAvailable: true,
          audioTranscriptAvailable: false,
          visualAnalysisAvailable: true,
          partialAnalysis: false,
          missingInputs: [],
        },
        extractedContent: {
          typedText: 'Isı alan taneciklerin kinetik enerjisi artar.',
          ocrText: 'Taneciklerin hızı artar',
          audioTranscript: null,
        },
        conceptualUnderstanding: {
          correctIdeas: [
            {
              idea: 'Tanecik hareketi artar',
              evidence: 'Taneciklerin hızı artar',
              sourceMode: 'handwritten_image',
              confidence: 0.9,
            },
          ],
          partiallyCorrectIdeas: [],
          missingExpectedConcepts: [],
          scientificErrors: [],
          misconceptions: [],
          conceptRelations: [],
          overallLevel: {
            score: 3,
            evidence: 'Tanecik hareketi açıklandı.',
            explanation: 'Doğru kavramsal seviye.',
            confidence: 0.88,
            sourceModes: ['direct_text'],
          },
        },
        representationAnalysis: {
          representationsPresent: ['yazı', 'çizim'],
          scientificallyCorrectElements: ['oklar'],
          partiallyCorrectElements: [],
          incorrectElements: [],
          missingExpectedElements: [],
          labelsUsed: true,
          arrowsUsedMeaningfully: true,
          graphUsed: false,
          tableUsed: false,
          modelUsed: true,
          representationConsistency: 'CONSISTENT',
          explanation: 'Temsiller tutarlıdır.',
          confidence: 0.85,
        },
        higherOrderThinking: {},
        argumentation: {},
        crossModalConsistency: {
          status: 'CONSISTENT',
          findings: [],
        },
        recommendedTeacherFeedback: {
          strength: 'İyi nedensellik.',
          developmentNeed: 'Grafik kullanımı.',
          promptingQuestion: 'Sıcaklık nasıl değişir?',
          suggestedActivity: 'Simülasyon',
          uncertaintyNote: null,
        },
        analysisConfidence: 0.88,
        requiresTeacherReview: true,
        reviewReasons: ['STANDART_OGRETMEN_ONAYI_GEREKLI'],
      };

      const result = parseAndValidateAIAnalysis(validPayload);
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data.analysisConfidence).toBe(0.88);
    });

    it('safely repairs missing fields in malformed AI output', () => {
      const malformedPayload = {
        analysisSummary: 'Kısmi analiz',
        // missing required nested objects
      };

      const result = parseAndValidateAIAnalysis(malformedPayload);
      expect(result.repaired).toBe(true);
      expect(result.data.requiresTeacherReview).toBe(true);
      expect(result.data.reviewReasons).toContain('SCHEMA_REPAIR_FAILED');
    });
  });

  describe('Multimodal Provider Functions', () => {
    it('performs handwriting OCR extraction gracefully', async () => {
      const ocrRes = await extractHandwritingOCR({
        studentResponseId: 'resp-1',
        imageUrls: [],
      });

      expect(ocrRes).toHaveProperty('extractedText');
      expect(ocrRes).toHaveProperty('confidence');
      expect(ocrRes).toHaveProperty('processingTimeMs');
      expect(ocrRes.language).toBe('tr');
    });

    it('transcribes audio input gracefully', async () => {
      const audioRes = await transcribeAudio({
        studentResponseId: 'resp-1',
        audioUrl: 'data:audio/mp3;base64,mockdata',
        durationSeconds: 10,
      });

      expect(audioRes).toHaveProperty('transcriptText');
      expect(audioRes.durationSeconds).toBe(10);
      expect(audioRes.confidence).toBeGreaterThan(0);
    });

    it('analyzes scientific visual representation', async () => {
      const visRes = await analyzeVisualRepresentation({
        studentResponseId: 'resp-1',
        imageUrls: ['data:image/png;base64,mockimage'],
        questionPrompt: 'Isı ve tanecik hareketini çizerek açıklayınız.',
      });

      expect(visRes.drawingPresent).toBe(true);
      expect(visRes).toHaveProperty('consistency');
      expect(visRes.confidence).toBeGreaterThan(0);
    });

    it('executes qualitative AI analysis with rubric and expected concepts', async () => {
      const qualRes = await analyzeQualitativeResponse({
        studentResponseId: 'resp-101',
        questionPrompt: 'Isı alan genleşen gaz moleküllerini açıklayınız.',
        expectedConcepts: [
          { conceptName: 'Tanecikler arası mesafe artar', isEssential: true },
        ],
        misconceptions: [
          { code: 'M-1', title: 'Taneciklerin boyutu büyür', description: 'Yanılgı' },
        ],
        targetedSkills: ['causalReasoning'],
        typedText: 'Isı alan gazın tanecikleri hızlanır ve aralarındaki mesafe artar.',
      });

      expect(qualRes.confidence).toBeGreaterThan(0.5);
      expect(qualRes.analysisJson.conceptualUnderstanding.overallLevel.score).toBeGreaterThanOrEqual(2);
      expect(qualRes.requiresTeacherReview).toBe(true);
    });
  });

  describe('Processing Pipeline & Teacher Review Queue', () => {
    it('enqueues a response processing job idempotently', () => {
      const job1 = enqueueResponseProcessing('resp-test-1');
      const job2 = enqueueResponseProcessing('resp-test-1');

      expect(job1.id).toBe(job2.id);
      expect(job1.idempotencyKey).toBe('prepare-resp-test-1-v1');

      const allJobs = getAllProcessingJobs();
      expect(allJobs.length).toBe(1);
    });
  });
});
