'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import {
  getExams as getMemoryExams,
  getExamById as getMemoryExamById,
  createExam as createMemoryExam,
  getItem,
  setItem,
  STORAGE_KEYS,
} from '@/lib/db';

const isDbAvailable = () => !!process.env.DATABASE_URL;

const questionSchema = z.object({
  title: z.string().min(1, 'Soru başlığı zorunludur'),
  questionText: z.string().min(1, 'Soru metni zorunludur'),
  teacherNotes: z.string().optional(),
  maximumScore: z.number().default(100),
  allowedResponseModes: z.array(z.string()).default(['DIRECT_TEXT', 'HANDWRITTEN_IMAGE', 'AUDIO_EXPLANATION']),
  targetedSkills: z.array(z.string()).default(['causalReasoning', 'problemUnderstanding']),
  expectedConcepts: z.array(
    z.object({
      conceptName: z.string(),
      description: z.string().optional(),
      importance: z.string().default('essential'),
      isEssential: z.boolean().default(true),
    })
  ).default([]),
  misconceptions: z.array(
    z.object({
      code: z.string(),
      title: z.string(),
      description: z.string(),
      remedy: z.string().optional(),
    })
  ).default([]),
  teacherRubric: z.string().optional(),
});

const createExamSchema = z.object({
  classroomId: z.string().min(1, 'Sınıf seçimi zorunludur'),
  title: z.string().min(1, 'Sınav başlığı zorunludur'),
  subject: z.string().min(1, 'Ders adı zorunludur'),
  unit: z.string().optional(),
  topic: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimitMinutes: z.number().optional(),
  questions: z.array(questionSchema).min(1, 'En az 1 soru eklenmelidir'),
});

function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createExam(formData: z.infer<typeof createExamSchema>) {
  const teacher = await requireTeacher();
  const validated = createExamSchema.parse(formData);
  const shortCode = generateShortCode();

  if (isDbAvailable()) {
    const exam = await prisma.exam.create({
      data: {
        teacherId: teacher.id,
        classroomId: validated.classroomId,
        title: validated.title,
        subject: validated.subject,
        unit: validated.unit || null,
        topic: validated.topic || null,
        description: validated.description || null,
        instructions: validated.instructions || null,
        timeLimitMinutes: validated.timeLimitMinutes || null,
        shortCode,
        status: 'DRAFT',
        questions: {
          create: validated.questions.map((q, idx) => ({
            questionOrder: idx + 1,
            title: q.title,
            questionText: q.questionText,
            teacherNotes: q.teacherNotes || null,
            maximumScore: q.maximumScore,
            allowedResponseModes: q.allowedResponseModes,
            targetedSkills: q.targetedSkills,
            teacherRubric: q.teacherRubric || null,
            expectedConcepts: {
              create: q.expectedConcepts.map((c, cIdx) => ({
                conceptName: c.conceptName,
                description: c.description || null,
                importance: c.importance,
                isEssential: c.isEssential,
                order: cIdx,
              })),
            },
            misconceptions: {
              create: q.misconceptions.map((m, mIdx) => ({
                code: m.code,
                title: m.title,
                description: m.description,
                remedy: m.remedy || null,
                order: mIdx,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            expectedConcepts: true,
            misconceptions: true,
          },
        },
      },
    });

    await createAuditLog({
      actorId: teacher.id,
      action: 'CREATE',
      entityType: 'EXAM',
      entityId: exam.id,
      details: { title: exam.title, classroomId: exam.classroomId },
    });

    return exam;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    try {
      const memoryExam = createMemoryExam(
        {
          classroomId: validated.classroomId,
          title: validated.title,
          subject: validated.subject,
          unit: validated.unit,
          topic: validated.topic,
          description: validated.description,
          instructions: validated.instructions,
        },
        teacher.id
      );
      return memoryExam;
    } catch {
      const examId = `exam-${Date.now()}`;
      return {
        id: examId,
        teacherId: teacher.id,
        classroomId: validated.classroomId,
        title: validated.title,
        subject: validated.subject,
        status: 'DRAFT',
        shortCode,
        createdAt: new Date().toISOString(),
        questions: [],
      };
    }
  }
}

export async function listExams() {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    return prisma.exam.findMany({
      where: teacher.role === 'ADMIN' ? {} : { teacherId: teacher.id },
      include: {
        classroom: { select: { id: true, name: true, grade: true, branch: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }
    return getMemoryExams({ teacherId: teacher.id });
  }
}

export async function getExam(id: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        classroom: {
          include: {
            roster: { orderBy: { schoolNumber: 'asc' } },
          },
        },
        questions: {
          orderBy: { questionOrder: 'asc' },
          include: {
            expectedConcepts: true,
            misconceptions: true,
          },
        },
        attempts: {
          include: {
            studentRoster: true,
            responses: {
              include: {
                textResponse: true,
                ocrResults: true,
                transcriptions: true,
                aiAnalyses: true,
                teacherReviews: true,
              },
            },
          },
        },
      },
    });

    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınava erişim yetkiniz yok');
    }

    return exam;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }
    const exam = getMemoryExamById(id);
    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınava erişim yetkiniz yok');
    }
    return exam;
  }
}

export async function updateExamStatus(id: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınavı düzenleme yetkiniz yok');
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        status,
        ...(status === 'PUBLISHED' && !exam.publishedAt ? { publishedAt: new Date() } : {}),
        ...(status === 'CLOSED' ? { closedAt: new Date() } : {}),
        ...(status === 'ARCHIVED' ? { archivedAt: new Date() } : {}),
      },
    });

    await createAuditLog({
      actorId: teacher.id,
      action: 'UPDATE',
      entityType: 'EXAM',
      entityId: id,
      details: { newStatus: status },
    });

    return updated;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }
    const exams = getItem<any[]>(STORAGE_KEYS.EXAMS) || [];
    const exam = exams.find((e) => e.id === id);
    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    exam.status = status;
    setItem(STORAGE_KEYS.EXAMS, exams);
    return exam;
  }
}

export async function deleteExam(id: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınavı silme yetkiniz yok');
    }

    await prisma.exam.delete({ where: { id } });

    await createAuditLog({
      actorId: teacher.id,
      action: 'DELETE',
      entityType: 'EXAM',
      entityId: id,
    });

    return { success: true };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }
    const exams = getItem<any[]>(STORAGE_KEYS.EXAMS) || [];
    const filtered = exams.filter((e) => e.id !== id);
    setItem(STORAGE_KEYS.EXAMS, filtered);
    return { success: true };
  }
}
