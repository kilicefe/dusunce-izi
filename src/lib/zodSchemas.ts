import { z } from 'zod';

export const HotsDimensionSchema = z.object({
  targeted: z.boolean().default(false),
  score: z.number().min(0).max(4).nullable().optional(),
  evidence: z.string().default(''),
  sourceModes: z.array(z.string()).default([]),
  explanation: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0),
  teacherReviewRequired: z.boolean().default(false),
}).nullable().optional();

export type HotsDimension = z.infer<typeof HotsDimensionSchema>;

export const ArgumentationComponentSchema = z.object({
  required: z.boolean().default(false),
  present: z.boolean().default(false),
  extractedContent: z.string().nullable().optional(),
  sourceMode: z.string().nullable().optional(),
  qualityScore: z.number().min(0).max(4).nullable().optional(),
  evidence: z.string().default(''),
  explanation: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0),
}).nullable().optional();

export type ArgumentationComponent = z.infer<typeof ArgumentationComponentSchema>;

export const QualitativeAnalysisSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  analysisSummary: z.string().default(''),
  responseModes: z.array(z.string()).default([]),
  processingCompleteness: z.object({
    typedTextAvailable: z.boolean().default(false),
    ocrAvailable: z.boolean().default(false),
    audioTranscriptAvailable: z.boolean().default(false),
    visualAnalysisAvailable: z.boolean().default(false),
    partialAnalysis: z.boolean().default(false),
    missingInputs: z.array(z.string()).default([]),
  }),
  extractedContent: z.object({
    typedText: z.string().nullable().optional(),
    ocrText: z.string().nullable().optional(),
    audioTranscript: z.string().nullable().optional(),
  }),
  conceptualUnderstanding: z.object({
    correctIdeas: z.array(
      z.object({
        idea: z.string(),
        evidence: z.string().default(''),
        sourceMode: z.string().default('unknown'),
        confidence: z.number().min(0).max(1).default(0.9),
      })
    ).default([]),
    partiallyCorrectIdeas: z.array(
      z.object({
        idea: z.string(),
        evidence: z.string().default(''),
        sourceMode: z.string().default('unknown'),
        confidence: z.number().min(0).max(1).default(0.8),
      })
    ).default([]),
    missingExpectedConcepts: z.array(
      z.object({
        concept: z.string(),
        importance: z.enum(['essential', 'supporting', 'optional']).default('essential'),
        explanation: z.string().default(''),
      })
    ).default([]),
    scientificErrors: z.array(
      z.object({
        statement: z.string(),
        explanation: z.string().default(''),
        evidence: z.string().default(''),
        sourceMode: z.string().default('unknown'),
        confidence: z.number().min(0).max(1).default(0.8),
      })
    ).default([]),
    misconceptions: z.array(
      z.object({
        code: z.string(),
        title: z.string(),
        status: z.enum(['CONFIRMED_BY_EVIDENCE', 'POSSIBLE', 'INSUFFICIENT_EVIDENCE', 'NOT_PRESENT']).default('POSSIBLE'),
        explanation: z.string().default(''),
        evidence: z.string().default(''),
        sourceMode: z.string().default('unknown'),
        confidence: z.number().min(0).max(1).default(0.7),
        teacherDefined: z.boolean().default(false),
      })
    ).default([]),
    conceptRelations: z.array(
      z.object({
        fromConcept: z.string(),
        toConcept: z.string(),
        relation: z.string().default(''),
        correctness: z.enum(['correct', 'partially_correct', 'incorrect', 'uncertain']).default('correct'),
        evidence: z.string().default(''),
        sourceMode: z.string().default('unknown'),
      })
    ).default([]),
    overallLevel: z.object({
      score: z.number().min(0).max(4).nullable().default(null),
      evidence: z.string().default(''),
      explanation: z.string().default(''),
      confidence: z.number().min(0).max(1).default(0.8),
      sourceModes: z.array(z.string()).default([]),
    }),
  }),
  representationAnalysis: z.object({
    representationsPresent: z.array(z.string()).default([]),
    scientificallyCorrectElements: z.array(z.string()).default([]),
    partiallyCorrectElements: z.array(z.string()).default([]),
    incorrectElements: z.array(z.string()).default([]),
    missingExpectedElements: z.array(z.string()).default([]),
    labelsUsed: z.boolean().default(false),
    arrowsUsedMeaningfully: z.boolean().default(false),
    graphUsed: z.boolean().default(false),
    tableUsed: z.boolean().default(false),
    modelUsed: z.boolean().default(false),
    representationConsistency: z.enum([
      'CONSISTENT',
      'PARTIALLY_CONSISTENT',
      'INCONSISTENT',
      'COMPLEMENTARY',
      'SINGLE_MODE_ONLY',
      'NOT_ASSESSABLE',
    ]).default('NOT_ASSESSABLE'),
    explanation: z.string().default(''),
    confidence: z.number().min(0).max(1).default(0.8),
  }),
  higherOrderThinking: z.object({
    problemUnderstanding: HotsDimensionSchema,
    relevantInformationSelection: HotsDimensionSchema,
    relationshipBuilding: HotsDimensionSchema,
    causalReasoning: HotsDimensionSchema,
    inference: HotsDimensionSchema,
    evidenceUse: HotsDimensionSchema,
    evaluation: HotsDimensionSchema,
    alternativeExplanationComparison: HotsDimensionSchema,
    errorDetection: HotsDimensionSchema,
    transfer: HotsDimensionSchema,
    modelCreation: HotsDimensionSchema,
    originalSolution: HotsDimensionSchema,
    metacognition: HotsDimensionSchema,
    scientificArgumentation: HotsDimensionSchema,
  }),
  argumentation: z.object({
    claim: ArgumentationComponentSchema,
    evidence: ArgumentationComponentSchema,
    reasoning: ArgumentationComponentSchema,
    counterclaim: ArgumentationComponentSchema,
    rebuttal: ArgumentationComponentSchema,
  }),
  crossModalConsistency: z.object({
    status: z.enum([
      'CONSISTENT',
      'PARTIALLY_CONSISTENT',
      'INCONSISTENT',
      'COMPLEMENTARY',
      'SINGLE_MODE_ONLY',
      'NOT_ASSESSABLE',
    ]).default('NOT_ASSESSABLE'),
    findings: z.array(
      z.object({
        modes: z.array(z.string()).default([]),
        finding: z.string(),
        importance: z.enum(['low', 'medium', 'high']).default('medium'),
      })
    ).default([]),
  }),
  recommendedTeacherFeedback: z.object({
    strength: z.string().default(''),
    developmentNeed: z.string().default(''),
    promptingQuestion: z.string().default(''),
    suggestedActivity: z.string().default(''),
    uncertaintyNote: z.string().nullable().optional(),
  }),
  analysisConfidence: z.number().min(0).max(1).default(0.85),
  requiresTeacherReview: z.boolean().default(true),
  reviewReasons: z.array(z.string()).default([]),
});

export type QualitativeAnalysisOutput = z.infer<typeof QualitativeAnalysisSchema>;

const GEMINI_JSON_SCHEMA_KEYWORDS = new Set([
  '$id',
  '$defs',
  'definitions',
  '$ref',
  '$anchor',
  'type',
  'format',
  'title',
  'description',
  'enum',
  'items',
  'prefixItems',
  'minItems',
  'maxItems',
  'minimum',
  'maximum',
  'anyOf',
  'oneOf',
  'properties',
  'additionalProperties',
  'required',
  'propertyOrdering',
]);

function sanitizeGeminiJsonSchema(value: unknown, withinProperties = false): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeGeminiJsonSchema(item));
  }
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      if (!withinProperties && !GEMINI_JSON_SCHEMA_KEYWORDS.has(key)) return [];
      const nextValue = key === '$ref' && typeof child === 'string'
        ? child.replace('#/definitions/', '#/$defs/')
        : child;
      return [[
        key === 'definitions' ? '$defs' : key,
        sanitizeGeminiJsonSchema(
          nextValue,
          key === 'properties' || key === 'definitions' || key === '$defs'
        ),
      ]];
    })
  );
}

/**
 * Gemini structured output accepts a documented subset of JSON Schema.
 * Zod emits extra metadata such as `$schema` and `default`; removing those
 * keeps the provider request portable while preserving the validation shape.
 */
export function createQualitativeAnalysisResponseJsonSchema(
  targetedSkills: string[] = []
): object {
  const jsonSchema = z.toJSONSchema(QualitativeAnalysisSchema, {
    target: 'draft-7',
    reused: 'ref',
  });
  const sanitized = sanitizeGeminiJsonSchema(jsonSchema) as Record<string, any>;
  const hotsProperties = sanitized.properties?.higherOrderThinking?.properties;
  if (hotsProperties) {
    const selectedSkills = new Set(targetedSkills);
    sanitized.properties.higherOrderThinking.properties = Object.fromEntries(
      Object.entries(hotsProperties).filter(([skill]) => selectedSkills.has(skill))
    );
  }

  if (targetedSkills.length === 0 && sanitized.$defs) {
    delete sanitized.$defs.__schema0;
  }
  return sanitized;
}

/**
 * Validates JSON string or object against QualitativeAnalysisSchema.
 * If invalid, attempts safe repair/fallback normalization.
 */
export function parseAndValidateAIAnalysis(
  input: unknown
): {
  success: boolean;
  data: QualitativeAnalysisOutput;
  repaired: boolean;
  errors?: string[];
} {
  let parsedObj: unknown = input;
  if (typeof input === 'string') {
    try {
      // Clean JSON string if wrapped in markdown code blocks
      const cleanString = input.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedObj = JSON.parse(cleanString);
    } catch (e: any) {
      // If direct JSON parse fails, return default minimal fallback schema with review reason
      const fallbackData = QualitativeAnalysisSchema.parse({
        analysisSummary: 'AI çıktısı JSON ayrıştırma hatası nedeniyle tam ayrıştırılamadı.',
        requiresTeacherReview: true,
        reviewReasons: ['JSON_PARSE_ERROR', 'SCHEMA_REPAIR_FAILED'],
        analysisConfidence: 0.3,
      });
      return {
        success: false,
        data: fallbackData,
        repaired: true,
        errors: [e.message || 'Invalid JSON string'],
      };
    }
  }

  const result = QualitativeAnalysisSchema.safeParse(parsedObj);
  if (result.success) {
    return {
      success: true,
      data: result.data,
      repaired: false,
    };
  } else {
    // Attempt safe repair by coercing missing mandatory fields
    try {
      const repairedObj = {
        ...(typeof parsedObj === 'object' && parsedObj !== null ? parsedObj : {}),
        schemaVersion: '1.0.0',
        requiresTeacherReview: true,
        reviewReasons: [
          ...((parsedObj as any)?.reviewReasons || []),
          'SCHEMA_REPAIRED',
          ...result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        ],
      };
      const repairedResult = QualitativeAnalysisSchema.parse(repairedObj);
      return {
        success: true,
        data: repairedResult,
        repaired: true,
        errors: result.error.issues.map((i) => i.message),
      };
    } catch (repairErr: any) {
      const safeFallback = QualitativeAnalysisSchema.parse({
        analysisSummary: 'Yapay zeka şema doğrulama hatası alındı. Öğretmen incelemesi gerekiyor.',
        responseModes: ['direct_text'],
        processingCompleteness: {
          typedTextAvailable: false,
          ocrAvailable: false,
          audioTranscriptAvailable: false,
          visualAnalysisAvailable: false,
          partialAnalysis: true,
          missingInputs: [],
        },
        extractedContent: {
          typedText: null,
          ocrText: null,
          audioTranscript: null,
        },
        conceptualUnderstanding: {
          correctIdeas: [],
          partiallyCorrectIdeas: [],
          missingExpectedConcepts: [],
          scientificErrors: [],
          misconceptions: [],
          conceptRelations: [],
          overallLevel: {
            score: null,
            evidence: '',
            explanation: '',
            confidence: 0.3,
            sourceModes: [],
          },
        },
        representationAnalysis: {
          representationsPresent: [],
          scientificallyCorrectElements: [],
          partiallyCorrectElements: [],
          incorrectElements: [],
          missingExpectedElements: [],
          labelsUsed: false,
          arrowsUsedMeaningfully: false,
          graphUsed: false,
          tableUsed: false,
          modelUsed: false,
          representationConsistency: 'NOT_ASSESSABLE',
          explanation: '',
          confidence: 0.3,
        },
        higherOrderThinking: {},
        argumentation: {},
        crossModalConsistency: {
          status: 'NOT_ASSESSABLE',
          findings: [],
        },
        recommendedTeacherFeedback: {
          strength: '',
          developmentNeed: '',
          promptingQuestion: '',
          suggestedActivity: '',
          uncertaintyNote: null,
        },
        analysisConfidence: 0.3,
        requiresTeacherReview: true,
        reviewReasons: ['VALIDATION_FAILED', 'SCHEMA_REPAIR_FAILED'],
      });
      return {
        success: false,
        data: safeFallback,
        repaired: true,
        errors: result.error.issues.map((i) => i.message),
      };
    }
  }
}
