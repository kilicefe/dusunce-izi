'use server';

import { randomUUID } from 'node:crypto';
import { AttemptStatus, JobType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { getItem, setItem } from '@/lib/db';
import { enqueueResponseProcessing, runProcessingJob } from '@/lib/processingPipeline';
import { enqueueDurableResponseProcessing } from '@/lib/durableProcessingQueue';

const isDbAvailable = () => !!process.env.DATABASE_URL;

const reviewableAttemptStatuses: AttemptStatus[] = [
  AttemptStatus.SUBMITTED,
  AttemptStatus.PROCESSING,
  AttemptStatus.OCR_PROCESSING,
  AttemptStatus.TRANSCRIPTION_PROCESSING,
  AttemptStatus.AI_ANALYZING,
  AttemptStatus.NEEDS_TEACHER_REVIEW,
  AttemptStatus.TEACHER_REVIEWED,
  AttemptStatus.FEEDBACK_READY,
  AttemptStatus.FAILED,
];

function revalidateReviewViews(examId: string) {
  revalidatePath('/dashboard/exams');
  revalidatePath(`/dashboard/exams/${examId}`);
  revalidatePath(`/dashboard/exams/${examId}/review`);
  revalidatePath(`/dashboard/exams/${examId}/analytics`);
}

export async function getExamReviewList(examId: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınavı inceleme yetkiniz yok');
    }

    const responses = await prisma.studentResponse.findMany({
      where: {
        attempt: {
          examId,
          status: { in: reviewableAttemptStatuses },
        },
      },
      include: {
        attempt: {
          include: {
            studentRoster: true,
          },
        },
        question: true,
        textResponse: true,
        imageResponses: true,
        audioResponse: true,
        ocrResults: { orderBy: { processedAt: 'desc' }, take: 1 },
        transcriptions: { orderBy: { processedAt: 'desc' }, take: 1 },
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
        teacherReviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return responses;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    // Return stored/mock reviews for non-production tests
    const aiAnalyses = getItem<any[]>('dusunceizi_ai_analyses') || [];
    const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];

    return aiAnalyses.map((ai) => ({
      id: ai.studentResponseId || 'resp-mock-1',
      attempt: {
        studentRoster: {
          firstName: 'Örnek',
          lastName: 'Öğrenci',
          schoolNumber: '101',
        },
      },
      question: {
        title: 'Isı ve Sıcaklık İlişkisi',
        questionText: 'Isı alan maddelerde tanecik hareketi nasıl değişir?',
      },
      textResponse: { content: 'Isı alan maddenin sıcaklığı ve tanecik hızı artar.' },
      ocrResults: [],
      transcriptions: [],
      aiAnalyses: [ai],
      teacherReviews: reviews.filter((r) => r.studentResponseId === ai.studentResponseId),
    }));
  }
}

export async function submitTeacherReview(payload: {
  studentResponseId: string;
  aiAnalysisId: string;
  approved: boolean;
  editedJson?: any;
  feedbackText?: string;
  correctionReason?: string;
}) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const review = await prisma.teacherReview.create({
      data: {
        studentResponseId: payload.studentResponseId,
        aiAnalysisId: payload.aiAnalysisId,
        teacherId: teacher.id,
        status: payload.approved ? 'APPROVED' : 'APPROVED_WITH_CHANGES',
        approved: payload.approved,
        editedJson: payload.editedJson || null,
        feedbackText: payload.feedbackText || null,
        correctionReason: payload.correctionReason || null,
      },
    });

    const response = await prisma.studentResponse.findUnique({
      where: { id: payload.studentResponseId },
      select: { attemptId: true, attempt: { select: { examId: true } } },
    });
    if (response) {
      const responsesWithoutApproval = await prisma.studentResponse.count({
        where: {
          attemptId: response.attemptId,
          teacherReviews: {
            none: {
              status: { in: ['APPROVED', 'APPROVED_WITH_CHANGES'] },
            },
          },
        },
      });
      if (responsesWithoutApproval === 0) {
        await prisma.examAttempt.update({
          where: { id: response.attemptId },
          data: { status: 'TEACHER_REVIEWED' },
        });
      }
    }

    await createAuditLog({
      actorId: teacher.id,
      action: 'APPROVE_REVIEW',
      entityType: 'TEACHER_REVIEW',
      entityId: review.id,
      details: { approved: payload.approved },
    });

    if (response) revalidateReviewViews(response.attempt.examId);

    return review;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
    const newReview = {
      id: `rev-${Date.now()}`,
      studentResponseId: payload.studentResponseId,
      aiAnalysisId: payload.aiAnalysisId,
      teacherId: teacher.id,
      status: payload.approved ? 'APPROVED' : 'APPROVED_WITH_CHANGES',
      approved: payload.approved,
      editedJson: payload.editedJson || null,
      feedbackText: payload.feedbackText || null,
      reviewedAt: new Date().toISOString(),
    };
    reviews.push(newReview);
    setItem('dusunceizi_teacher_reviews', reviews);

    return newReview;
  }
}

export async function reanalyzeStudentResponse(studentResponseId: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const response = await prisma.studentResponse.findUnique({
      where: { id: studentResponseId },
      include: { attempt: { include: { exam: true } } },
    });
    if (!response) throw new Error('NOT_FOUND: Öğrenci yanıtı bulunamadı');
    if (teacher.role !== 'ADMIN' && response.attempt.exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu yanıtı yeniden analiz etme yetkiniz yok');
    }

    const job = await enqueueDurableResponseProcessing(studentResponseId, {
      idempotencyKey: `reanalyze-${studentResponseId}-${randomUUID()}`,
      jobType: JobType.REANALYSIS,
      priority: 2,
    });

    await createAuditLog({
      actorId: teacher.id,
      action: 'REANALYZE',
      entityType: 'STUDENT_RESPONSE',
      entityId: studentResponseId,
    });

    revalidateReviewViews(response.attempt.exam.id);

    return { success: true, jobId: job.id };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }
    const job = enqueueResponseProcessing(studentResponseId);
    await runProcessingJob(job.id);
    return { success: true };
  }
}
