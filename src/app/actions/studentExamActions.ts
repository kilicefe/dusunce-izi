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
import { processAttemptResponses } from '@/lib/processingPipeline';
import { generateAttemptToken, hashAttemptToken } from '@/lib/attemptTokens';
import {
  createSignedStudentMediaUpload,
  createSignedMediaUrl,
  deleteStoredMedia,
  uploadStudentMedia,
  validateStoredStudentMedia,
} from '@/lib/mediaStorage';
import { ExamAttempt, AttemptStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

const isDbAvailable = () => !!process.env.DATABASE_URL;

function revalidateTeacherExamViews(examId: string) {
  revalidatePath('/dashboard/exams');
  revalidatePath(`/dashboard/exams/${examId}`);
  revalidatePath(`/dashboard/exams/${examId}/review`);
  revalidatePath(`/dashboard/exams/${examId}/analytics`);
}

const studentLoginSchema = z.object({
  shortCode: z.string().min(1, 'Sınav kodu girilmelidir'),
  schoolNumber: z.string().min(1, 'Okul numarası girilmelidir'),
});

const studentMediaUploadSchema = z.object({
  attemptToken: z.string().min(1),
  questionId: z.string().uuid(),
  kind: z.enum(['image', 'audio']),
  mimeType: z.string().min(1).max(128),
  fileSize: z.number().int().positive(),
});

async function getWritableStudentResponse(attemptToken: string, questionId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { attemptTokenHash: hashAttemptToken(attemptToken) },
  });
  if (!attempt) throw new Error('NOT_FOUND: Oturum bulunamadı');
  if (attempt.status !== 'IN_PROGRESS') throw new Error('ATTEMPT_NOT_WRITABLE');

  const question = await prisma.question.findFirst({
    where: { id: questionId, examId: attempt.examId, deletedAt: null },
    select: { id: true },
  });
  if (!question) throw new Error('QUESTION_NOT_IN_ATTEMPT');

  const response = await prisma.studentResponse.upsert({
    where: {
      attemptId_questionId: {
        attemptId: attempt.id,
        questionId,
      },
    },
    create: { attemptId: attempt.id, questionId },
    update: {},
  });
  return { attempt, response };
}

export async function createStudentMediaUploadTarget(
  payload: z.infer<typeof studentMediaUploadSchema>
) {
  const validation = studentMediaUploadSchema.safeParse(payload);
  if (!validation.success) {
    return { ok: false as const, error: 'Medya yükleme bilgileri geçersiz.' };
  }
  if (!isDbAvailable()) {
    return { ok: false as const, error: 'Güvenli medya depolaması kullanılamıyor.' };
  }

  try {
    const { attempt, response } = await getWritableStudentResponse(
      validation.data.attemptToken,
      validation.data.questionId
    );
    const target = await createSignedStudentMediaUpload({
      attemptId: attempt.id,
      studentResponseId: response.id,
      kind: validation.data.kind,
      mimeType: validation.data.mimeType,
      fileSize: validation.data.fileSize,
    });
    return { ok: true as const, target };
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code.includes('MEDIA_TOO_LARGE')) {
      return { ok: false as const, error: 'Dosya izin verilen boyut sınırını aşıyor.' };
    }
    if (code.includes('UNSUPPORTED_MEDIA_TYPE')) {
      return { ok: false as const, error: 'Bu dosya biçimi desteklenmiyor.' };
    }
    if (code.includes('ATTEMPT_NOT_WRITABLE')) {
      return { ok: false as const, error: 'Tamamlanmış bir sınavın yanıtları değiştirilemez.' };
    }
    console.error('Student media upload target creation failed', error);
    return { ok: false as const, error: 'Güvenli medya yüklemesi başlatılamadı.' };
  }
}

export async function loginStudentForExam(shortCode: string, schoolNumber: string) {
  const validation = studentLoginSchema.safeParse({ shortCode, schoolNumber });
  if (!validation.success) {
    return {
      ok: false as const,
      error: validation.error.issues[0]?.message || 'Giriş bilgileri geçersiz',
    };
  }
  const validated = validation.data;

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
      return { ok: false as const, error: 'Belirtilen koda sahip aktif sınav bulunamadı' };
    }

    if (exam.status !== 'PUBLISHED') {
      return { ok: false as const, error: 'Bu sınav henüz öğrenci erişimine açılmamıştır' };
    }

    const student = exam.classroom.roster.find(
      (s) => s.schoolNumber.trim().toLowerCase() === validated.schoolNumber.trim().toLowerCase()
    );

    if (!student) {
      return {
        ok: false as const,
        error: 'Bu okul numarasına sahip öğrenci bu sınıfta bulunamadı',
      };
    }

    let attempt = await prisma.examAttempt.findUnique({
      where: {
        examId_studentRosterId: {
          examId: exam.id,
          studentRosterId: student.id,
        },
      },
    });

    const rawAttemptToken = generateAttemptToken();
    const attemptTokenHash = hashAttemptToken(rawAttemptToken);

    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: {
          examId: exam.id,
          studentRosterId: student.id,
          attemptTokenHash,
          status: 'IN_PROGRESS',
        },
      });
    } else {
      attempt = await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { attemptTokenHash },
      });
    }

    revalidateTeacherExamViews(exam.id);

    return {
      ok: true as const,
      attemptToken: rawAttemptToken,
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
      return { ok: false as const, error: 'Belirtilen koda sahip aktif sınav bulunamadı' };
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
      ok: true as const,
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
      where: { attemptTokenHash: hashAttemptToken(attemptToken) },
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

    const { attemptTokenHash: _attemptTokenHash, ...publicAttempt } = attempt;
    return {
      ...publicAttempt,
      responses: await Promise.all(
        attempt.responses.map(async (response) => ({
          ...response,
          imageResponses: await Promise.all(
            response.imageResponses.map(async (image) => ({
              ...image,
              signedUrl: await createSignedMediaUrl(image.storageUrl),
            }))
          ),
          audioResponse: response.audioResponse
            ? {
                ...response.audioResponse,
                signedUrl: await createSignedMediaUrl(response.audioResponse.storageUrl),
              }
            : null,
        }))
      ),
    };
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
    const { attempt, response } = await getWritableStudentResponse(
      payload.attemptToken,
      payload.questionId
    );

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

    if (payload.imageUrls !== undefined) {
      if (payload.imageUrls.length > 5) throw new Error('TOO_MANY_IMAGES');
      const currentImages = await prisma.imageResponse.findMany({
        where: { studentResponseId: response.id },
      });
      const currentByReference = new Map(
        currentImages.map((image) => [image.storageUrl, image])
      );
      const newImages: Array<{
        storageReference: string;
        mimeType: string;
        fileSize: number;
      }> = [];

      try {
        for (const value of payload.imageUrls) {
          if (value.startsWith('data:')) {
            newImages.push(
              await uploadStudentMedia({
                attemptId: attempt.id,
                studentResponseId: response.id,
                kind: 'image',
                dataUrl: value,
              })
            );
          } else if (!currentByReference.has(value)) {
            newImages.push(
              await validateStoredStudentMedia({
                storageReference: value,
                attemptId: attempt.id,
                studentResponseId: response.id,
                kind: 'image',
              })
            );
          }
        }

        const retainedReferences = new Set(
          payload.imageUrls.filter((value) => currentByReference.has(value))
        );
        const uploadedForCreate = [...newImages];
        await prisma.$transaction([
          prisma.imageResponse.deleteMany({
            where: {
              studentResponseId: response.id,
              storageUrl: { notIn: [...retainedReferences] },
            },
          }),
          ...payload.imageUrls.map((value, index) => {
            const current = currentByReference.get(value);
            if (current) {
              return prisma.imageResponse.update({
                where: { id: current.id },
                data: { orderIndex: index },
              });
            }

            const uploaded = uploadedForCreate.shift();
            if (!uploaded) throw new Error('MEDIA_UPLOAD_RESULT_MISSING');
            return prisma.imageResponse.create({
              data: {
                studentResponseId: response.id,
                storageUrl: uploaded.storageReference,
                mimeType: uploaded.mimeType,
                fileSize: uploaded.fileSize,
                orderIndex: index,
              },
            });
          }),
        ]);

        const removedImages = currentImages.filter(
          (image) => !retainedReferences.has(image.storageUrl)
        );
        await Promise.allSettled(
          removedImages.map((image) => deleteStoredMedia(image.storageUrl))
        );
      } catch (error) {
        await Promise.allSettled(
          newImages.map((image) => deleteStoredMedia(image.storageReference))
        );
        throw error;
      }
    }

    if (payload.audioUrl !== undefined) {
      const currentAudio = await prisma.audioResponse.findUnique({
        where: { studentResponseId: response.id },
      });

      if (!payload.audioUrl) {
        await prisma.audioResponse.deleteMany({ where: { studentResponseId: response.id } });
        if (currentAudio) {
          await Promise.allSettled([deleteStoredMedia(currentAudio.storageUrl)]);
        }
      } else if (payload.audioUrl === currentAudio?.storageUrl) {
        await prisma.audioResponse.update({
          where: { studentResponseId: response.id },
          data: { durationSeconds: payload.audioDuration || currentAudio.durationSeconds },
        });
      } else {
        const uploadedAudio = payload.audioUrl.startsWith('data:')
          ? await uploadStudentMedia({
              attemptId: attempt.id,
              studentResponseId: response.id,
              kind: 'audio',
              dataUrl: payload.audioUrl,
            })
          : await validateStoredStudentMedia({
              storageReference: payload.audioUrl,
              attemptId: attempt.id,
              studentResponseId: response.id,
              kind: 'audio',
            });
        try {
          await prisma.audioResponse.upsert({
            where: { studentResponseId: response.id },
            create: {
              studentResponseId: response.id,
              storageUrl: uploadedAudio.storageReference,
              durationSeconds: payload.audioDuration || 10,
              fileSize: uploadedAudio.fileSize,
              mimeType: uploadedAudio.mimeType,
            },
            update: {
              storageUrl: uploadedAudio.storageReference,
              durationSeconds: payload.audioDuration || 10,
              fileSize: uploadedAudio.fileSize,
              mimeType: uploadedAudio.mimeType,
            },
          });
        } catch (error) {
          await Promise.allSettled([deleteStoredMedia(uploadedAudio.storageReference)]);
          throw error;
        }
        if (currentAudio) {
          await Promise.allSettled([deleteStoredMedia(currentAudio.storageUrl)]);
        }
      }
    }

    revalidateTeacherExamViews(attempt.examId);
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
      where: { attemptTokenHash: hashAttemptToken(attemptToken) },
      include: { responses: true },
    });

    if (!attempt) throw new Error('NOT_FOUND: Oturum bulunamadı');

    await prisma.$transaction(async (tx) => {
      await tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: attempt.submittedAt || new Date(),
        },
      });

      for (const response of attempt.responses) {
        const idempotencyKey = `prepare-${response.id}-v1`;
        await tx.responseProcessingJob.upsert({
          where: { idempotencyKey },
          update: {},
          create: {
            studentResponseId: response.id,
            jobType: 'PREPARE_RESPONSE',
            idempotencyKey,
            priority: 1,
            processingVersion: '1.0.0',
          },
        });
      }
    });

    revalidateTeacherExamViews(attempt.examId);

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
