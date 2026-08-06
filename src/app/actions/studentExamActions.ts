'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import {
  getExams as getMemoryExams,
  getExamById as getMemoryExamById,
  getAttemptById as getMemoryAttempt,
  getStudentResponseById as getMemoryResponse,
  saveStudentResponse as saveMemoryResponse,
  getItem,
  setItem,
  STORAGE_KEYS,
} from '@/lib/db';
import { processAttemptResponses, enqueueResponseProcessing } from '@/lib/processingPipeline';
import { ExamAttempt, AttemptStatus } from '@/types/database';

const isDbAvailable = () => !!process.env.DATABASE_URL;

const studentLoginSchema = z.object({
  shortCode: z.string().min(1, 'Sınav kodu girilmelidir'),
  schoolNumber: z.string().min(1, 'Okul numarası girilmelidir'),
});

export async function loginStudentForExam(shortCode: string, schoolNumber: string) {
  const validated = studentLoginSchema.parse({ shortCode, schoolNumber });

  if (isDbAvailable()) {
    const exam = await prisma.exam.findFirst({
      where: {
        shortCode: { equals: validated.shortCode, mode: 'insensitive' },
      },
      include: {
        classroom: {
          include: {
            roster: true,
          },
        },
      },
    });

    if (!exam) {
      throw new Error('NOT_FOUND: Belirtilen koda sahip aktif sınav bulunamadı');
    }

    if (exam.status !== 'PUBLISHED') {
      throw new Error('EXAM_NOT_ACTIVE: Bu sınav henüz öğrenci erişimine açılmamıştır');
    }

    const student = exam.classroom.roster.find(
      (s) => s.schoolNumber.trim().toLowerCase() === validated.schoolNumber.trim().toLowerCase()
    );

    if (!student) {
      throw new Error('STUDENT_NOT_IN_ROSTER: Bu okul numarasına sahip öğrenci bu sınıfta bulunamadı');
    }

    let attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentRosterId: {
          examId: exam.id,
          studentRosterId: student.id,
        },
      },
    });

    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: {
          examId: exam.id,
          studentRosterId: student.id,
          status: 'IN_PROGRESS',
        },
      });
    }

    return {
      attemptToken: attempt.attemptToken,
      studentName: `${student.firstName} ${student.lastName}`,
      schoolNumber: student.schoolNumber,
      examTitle: exam.title,
      subject: exam.subject,
      shortCode: exam.shortCode,
    };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const exams = getMemoryExams();
    const exam = exams.find((e) => e.shortCode?.toLowerCase() === validated.shortCode.toLowerCase());

    if (!exam) {
      throw new Error('NOT_FOUND: Belirtilen koda sahip aktif sınav bulunamadı');
    }

    const mockAttemptId = `att-${exam.id}-${validated.schoolNumber}`;
    let attempt = getMemoryAttempt(mockAttemptId);
    if (!attempt) {
      attempt = {
        id: mockAttemptId,
        examId: exam.id,
        studentRosterId: `s-${validated.schoolNumber}`,
        attemptToken: mockAttemptId,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date().toISOString(),
        timeSpentSec: 0,
        lastActivityAt: new Date().toISOString(),
        currentQuestionIndex: 0,
        resumeAllowed: true,
        submissionVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
      attempts.push(attempt);
      setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    }

    return {
      attemptToken: attempt.attemptToken,
      studentName: `Öğrenci #${validated.schoolNumber}`,
      schoolNumber: validated.schoolNumber,
      examTitle: exam.title,
      subject: exam.subject,
      shortCode: exam.shortCode,
    };
  }
}

export async function getStudentAttemptData(attemptToken: string) {
  if (isDbAvailable()) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: {
        studentRoster: true,
        exam: {
          include: {
            questions: {
              orderBy: { questionOrder: 'asc' },
              include: {
                expectedConcepts: true,
              },
            },
          },
        },
        responses: {
          include: {
            textResponse: true,
            imageResponses: true,
            audioResponse: true,
          },
        },
      },
    });

    if (!attempt) throw new Error('NOT_FOUND: Sınav oturumu bulunamadı');

    return attempt;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const attempt = getMemoryAttempt(attemptToken);
    const exam = attempt ? getMemoryExamById(attempt.examId) : null;

    return {
      id: attempt?.id || attemptToken,
      attemptToken,
      status: attempt?.status || 'IN_PROGRESS',
      studentRoster: {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        schoolNumber: '104',
      },
      exam: exam || {
        title: 'Örnek Fen Bilimleri Sınavı',
        subject: 'Fen Bilimleri',
        questions: [],
      },
      responses: [],
    };
  }
}

export async function saveStudentResponse(payload: {
  attemptToken: string;
  questionId: string;
  typedText?: string;
  imageUrls?: string[];
  audioUrl?: string;
  audioDuration?: number;
}) {
  if (isDbAvailable()) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { attemptToken: payload.attemptToken },
    });

    if (!attempt) throw new Error('NOT_FOUND: Oturum bulunamadı');

    let response = await prisma.studentResponse.findUnique({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: payload.questionId,
        },
      },
    });

    if (!response) {
      response = await prisma.studentResponse.create({
        data: {
          attemptId: attempt.id,
          questionId: payload.questionId,
        },
      });
    }

    if (payload.typedText !== undefined) {
      await prisma.textResponse.upsert({
        where: { studentResponseId: response.id },
        create: {
          studentResponseId: response.id,
          content: payload.typedText,
          charCount: payload.typedText.length,
        },
        update: {
          content: payload.typedText,
          charCount: payload.typedText.length,
        },
      });
    }

    if (payload.imageUrls && payload.imageUrls.length > 0) {
      await prisma.imageResponse.deleteMany({
        where: { studentResponseId: response.id },
      });
      for (let i = 0; i < payload.imageUrls.length; i++) {
        await prisma.imageResponse.create({
          data: {
            studentResponseId: response.id,
            storageUrl: payload.imageUrls[i],
            mimeType: payload.imageUrls[i].split(';')[0]?.replace('data:', '') || 'image/png',
            fileSize: payload.imageUrls[i].length,
            orderIndex: i,
          },
        });
      }
    }

    if (payload.audioUrl) {
      await prisma.audioResponse.upsert({
        where: { studentResponseId: response.id },
        create: {
          studentResponseId: response.id,
          storageUrl: payload.audioUrl,
          durationSeconds: payload.audioDuration || 10,
          fileSize: payload.audioUrl.length,
          mimeType: 'audio/webm',
        },
        update: {
          storageUrl: payload.audioUrl,
          durationSeconds: payload.audioDuration || 10,
          fileSize: payload.audioUrl.length,
        },
      });
    }

    return { success: true, responseId: response.id };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const responseObj: any = {
      id: `resp-${payload.questionId}`,
      attemptId: payload.attemptToken,
      questionId: payload.questionId,
      textResponse: payload.typedText ? { content: payload.typedText } : undefined,
      imageResponses: (payload.imageUrls || []).map((url) => ({ url })),
      audioResponse: payload.audioUrl ? { url: payload.audioUrl, durationSeconds: payload.audioDuration || 10 } : undefined,
    };

    saveMemoryResponse(responseObj);
    return { success: true, responseId: responseObj.id };
  }
}

export async function submitStudentExamAttempt(attemptToken: string) {
  if (isDbAvailable()) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { attemptToken },
      include: { responses: true },
    });

    if (!attempt) throw new Error('NOT_FOUND: Oturum bulunamadı');

    await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    for (const resp of attempt.responses) {
      try {
        enqueueResponseProcessing(resp.id);
      } catch (err) {
        console.warn('Pipeline enqueue warn:', err);
      }
    }

    return { success: true };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const attempt = getMemoryAttempt(attemptToken);
    if (attempt) {
      attempt.status = AttemptStatus.SUBMITTED;
      const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
      const idx = attempts.findIndex((a) => a.id === attempt.id);
      if (idx !== -1) {
        attempts[idx] = attempt;
        setItem(STORAGE_KEYS.ATTEMPTS, attempts);
      }
      try {
        await processAttemptResponses(attempt.id);
      } catch (err) {
        console.warn('Processing pipeline fallback completed:', err);
      }
    }

    return { success: true };
  }
}
