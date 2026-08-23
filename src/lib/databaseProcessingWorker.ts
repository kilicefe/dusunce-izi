import { Prisma, ResponseProcessingJob } from '@prisma/client';
import {
  analyzeQualitativeResponse,
  analyzeVisualRepresentation,
  extractHandwritingOCR,
  transcribeAudio,
} from './aiProvider';
import { downloadStoredMediaAsDataUrl } from './mediaStorage';
import prisma from './prisma';

export async function processDurableResponseJob(job: ResponseProcessingJob): Promise<void> {
  const alreadyProcessed = await prisma.multimodalResponseSnapshot.findUnique({
    where: { processingJobId: job.id },
    select: { id: true },
  });
  if (alreadyProcessed) return;

  const response = await prisma.studentResponse.findUnique({
    where: { id: job.studentResponseId },
    include: {
      attempt: { include: { exam: { select: { teacherId: true } } } },
      question: {
        include: {
          expectedConcepts: true,
          misconceptions: true,
        },
      },
      textResponse: true,
      imageResponses: { orderBy: { orderIndex: 'asc' } },
      audioResponse: true,
    },
  });
  if (!response) throw new Error(`STUDENT_RESPONSE_NOT_FOUND: ${job.studentResponseId}`);

  await prisma.examAttempt.update({
    where: { id: response.attemptId },
    data: { status: 'PROCESSING' },
  });

  const imageDataUrls = await Promise.all(
    response.imageResponses.map((image) =>
      downloadStoredMediaAsDataUrl(image.storageUrl, image.mimeType)
    )
  );
  const audioDataUrl = response.audioResponse
    ? await downloadStoredMediaAsDataUrl(
        response.audioResponse.storageUrl,
        response.audioResponse.mimeType
      )
    : null;

  const ocrResult = imageDataUrls.length
    ? await extractHandwritingOCR({
        studentResponseId: response.id,
        imageUrls: imageDataUrls,
      })
    : null;
  const transcriptionResult = audioDataUrl
    ? await transcribeAudio({
        studentResponseId: response.id,
        audioUrl: audioDataUrl,
        mimeType: response.audioResponse?.mimeType,
        durationSeconds: response.audioResponse?.durationSeconds,
      })
    : null;
  const visualResult = imageDataUrls.length
    ? await analyzeVisualRepresentation({
        studentResponseId: response.id,
        imageUrls: imageDataUrls,
        questionPrompt: response.question.questionText,
      })
    : null;

  const aiResult = await analyzeQualitativeResponse({
    studentResponseId: response.id,
    questionPrompt: response.question.questionText,
    teacherInstructions: response.question.teacherNotes || '',
    expectedConcepts: response.question.expectedConcepts.map((concept) => ({
      conceptName: concept.conceptName,
      importance: concept.importance,
      isEssential: concept.isEssential,
    })),
    misconceptions: response.question.misconceptions.map((misconception) => ({
      code: misconception.code,
      title: misconception.title,
      description: misconception.description,
    })),
    targetedSkills: response.question.targetedSkills,
    rubricText: response.question.teacherRubric || '',
    typedText: response.textResponse?.content || null,
    ocrText: ocrResult?.extractedText || null,
    audioTranscript: transcriptionResult?.transcriptText || null,
    visualFindings: visualResult,
    promptVersion: job.processingVersion,
  });

  await prisma.$transaction(async (tx) => {
    const activeLease = await tx.responseProcessingJob.findFirst({
      where: { id: job.id, status: 'RUNNING', workerId: job.workerId },
      select: { id: true },
    });
    if (!activeLease) throw new Error('PROCESSING_JOB_LEASE_LOST');

    const duplicate = await tx.multimodalResponseSnapshot.findUnique({
      where: { processingJobId: job.id },
      select: { id: true },
    });
    if (duplicate) return;

    if (ocrResult) {
      await tx.oCRResult.create({
        data: {
          studentResponseId: response.id,
          imageResponseId: response.imageResponses[0]?.id,
          extractedText: ocrResult.extractedText,
          confidence: ocrResult.confidence,
          unreadableRegions: ocrResult.unreadableRegions,
          uncertainWords: ocrResult.uncertainWords,
          language: ocrResult.language,
          provider: ocrResult.provider,
          model: ocrResult.model,
          processingTimeMs: ocrResult.processingTimeMs,
        },
      });
    }

    if (transcriptionResult) {
      await tx.transcriptionResult.create({
        data: {
          studentResponseId: response.id,
          audioResponseId: response.audioResponse?.id,
          transcriptText: transcriptionResult.transcriptText,
          confidence: transcriptionResult.confidence,
          uncertainSegments: transcriptionResult.uncertainSegments,
          language: transcriptionResult.language,
          durationSeconds: transcriptionResult.durationSeconds,
          provider: transcriptionResult.provider,
          model: transcriptionResult.model,
          processingTimeMs: transcriptionResult.processingTimeMs,
        },
      });
    }

    if (visualResult) {
      await tx.visualAnalysisResult.create({
        data: {
          studentResponseId: response.id,
          imageResponseId: response.imageResponses[0]?.id,
          drawingPresent: visualResult.drawingPresent,
          scientificElements: visualResult.scientificElements,
          missingElements: visualResult.missingElements,
          incorrectElements: visualResult.incorrectElements,
          labelsUsed: visualResult.labelsUsed,
          arrowsUsed: visualResult.arrowsUsed,
          graphUsed: visualResult.graphUsed,
          tableUsed: visualResult.tableUsed,
          symbolicUsed: visualResult.symbolicUsed,
          modelUsed: visualResult.modelUsed,
          consistency: visualResult.consistency,
          confidence: visualResult.confidence,
          explanation: visualResult.explanation,
        },
      });
    }

    const previousSnapshot = await tx.multimodalResponseSnapshot.aggregate({
      where: { studentResponseId: response.id },
      _max: { snapshotVersion: true },
    });
    const snapshot = await tx.multimodalResponseSnapshot.create({
      data: {
        studentResponseId: response.id,
        processingJobId: job.id,
        attemptId: response.attemptId,
        questionId: response.questionId,
        snapshotVersion: (previousSnapshot._max.snapshotVersion || 0) + 1,
        typedText: response.textResponse?.content,
        ocrText: ocrResult?.extractedText,
        transcriptText: transcriptionResult?.transcriptText,
        visualFindings: visualResult
          ? (visualResult as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        anonymizedPayload: {
          questionText: response.question.questionText,
          expectedConcepts: response.question.expectedConcepts,
          misconceptions: response.question.misconceptions,
          targetedSkills: response.question.targetedSkills,
          rubric: response.question.teacherRubric || '',
          typedText: response.textResponse?.content || null,
          ocrText: ocrResult?.extractedText || null,
          transcriptText: transcriptionResult?.transcriptText || null,
        } as Prisma.InputJsonValue,
      },
    });

    const analysis = await tx.aIAnalysis.create({
      data: {
        studentResponseId: response.id,
        snapshotId: snapshot.id,
        promptVersion: aiResult.promptVersion,
        modelName: aiResult.modelName,
        tokenUsage: aiResult.tokenUsage,
        estimatedCost: aiResult.estimatedCost,
        confidence: aiResult.confidence,
        requiresTeacherReview: true,
        reviewReasons: aiResult.reviewReasons,
        rawOutput: aiResult.rawOutput,
        repairedOutput: aiResult.repairedOutput,
        analysisJson: aiResult.analysisJson as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.teacherReview.create({
      data: {
        studentResponseId: response.id,
        aiAnalysisId: analysis.id,
        teacherId: response.attempt.exam.teacherId,
        status: 'PENDING',
        approved: false,
      },
    });
    await tx.processingEvent.create({
      data: {
        studentResponseId: response.id,
        responseProcessingJobId: job.id,
        eventType: 'PROCESSING_COMPLETED',
        details: {
          processingVersion: job.processingVersion,
          ocr: Boolean(ocrResult),
          transcription: Boolean(transcriptionResult),
          visualAnalysis: Boolean(visualResult),
        },
      },
    });
    await tx.examAttempt.update({
      where: { id: response.attemptId },
      data: { status: 'NEEDS_TEACHER_REVIEW' },
    });
  });
}
