'use server';

import prisma from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth';
import { getExamAnalyticsSummary, exportTeacherDataCSV } from '@/lib/analyticsService';

const isDbAvailable = () => !!process.env.DATABASE_URL;

export async function getExamAnalyticsData(examId: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        classroom: {
          include: {
            roster: true,
          },
        },
        questions: {
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
                aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
                teacherReviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Bu sınav istatistiklerine erişim yetkiniz yok');
    }

    const totalStudents = exam.classroom.roster.length;
    const submittedAttempts = exam.attempts.filter((a) => a.status === 'SUBMITTED');

    const levelCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    const misconceptionCounts: Record<string, { title: string; count: number }> = {};
    const hotsScores: Record<string, number> = { causalReasoning: 0, problemUnderstanding: 0 };
    let totalReviewed = 0;

    for (const attempt of submittedAttempts) {
      for (const resp of attempt.responses) {
        const review = resp.teacherReviews[0];
        const ai = resp.aiAnalyses[0];
        const analysis = (review?.editedJson || ai?.analysisJson) as any;

        if (analysis) {
          totalReviewed++;
          const score = analysis.conceptualUnderstanding?.overallLevel?.score ?? 2;
          levelCounts[score] = (levelCounts[score] || 0) + 1;

          const miscs = analysis.conceptualUnderstanding?.misconceptions || [];
          for (const m of miscs) {
            if (m.status === 'CONFIRMED_BY_EVIDENCE' || m.status === 'POSSIBLE') {
              if (!misconceptionCounts[m.code]) {
                misconceptionCounts[m.code] = { title: m.title || m.code, count: 0 };
              }
              misconceptionCounts[m.code].count++;
            }
          }

          if (analysis.higherOrderThinking?.causalReasoning?.score) {
            hotsScores.causalReasoning += analysis.higherOrderThinking.causalReasoning.score;
          }
          if (analysis.higherOrderThinking?.problemUnderstanding?.score) {
            hotsScores.problemUnderstanding += analysis.higherOrderThinking.problemUnderstanding.score;
          }
        }
      }
    }

    return {
      examTitle: exam.title,
      subject: exam.subject,
      totalStudents,
      startedCount: exam.attempts.length,
      submittedCount: submittedAttempts.length,
      reviewedCount: totalReviewed,
      levelCounts,
      misconceptionList: Object.entries(misconceptionCounts).map(([code, val]) => ({
        code,
        title: val.title,
        count: val.count,
      })),
      hotsAverage: {
        causalReasoning: totalReviewed > 0 ? (hotsScores.causalReasoning / totalReviewed).toFixed(2) : '0.0',
        problemUnderstanding: totalReviewed > 0 ? (hotsScores.problemUnderstanding / totalReviewed).toFixed(2) : '0.0',
      },
      studentScores: submittedAttempts.map((att) => ({
        id: att.id,
        studentName: `${att.studentRoster.firstName} ${att.studentRoster.lastName}`,
        schoolNumber: att.studentRoster.schoolNumber,
        status: att.status,
        responseCount: att.responses.length,
      })),
    };
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    const summary = getExamAnalyticsSummary(examId);
    return {
      examTitle: 'Örnek Sınav Analizi',
      subject: 'Fen Bilimleri',
      totalStudents: summary?.totalRosterCount || 20,
      startedCount: summary?.startedAttempts || 18,
      submittedCount: summary?.submittedAttempts || 15,
      reviewedCount: summary?.dataQualitySummary?.reviewedCount || 10,
      levelCounts: { 0: 1, 1: 2, 2: 4, 3: 6, 4: 2 },
      misconceptionList: [
        { code: 'MIS-01', title: 'Tanecik boyutu genleşir sanılması', count: 4 },
      ],
      hotsAverage: { causalReasoning: '3.1', problemUnderstanding: '3.4' },
      studentScores: [],
    };
  }
}

export async function exportExamCsvData(examId: string) {
  const teacher = await requireTeacher();

  if (isDbAvailable()) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        attempts: {
          include: {
            studentRoster: true,
            responses: {
              include: {
                aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!exam) throw new Error('NOT_FOUND: Sınav bulunamadı');
    if (teacher.role !== 'ADMIN' && exam.teacherId !== teacher.id) {
      throw new Error('FORBIDDEN: Yetkiniz yok');
    }

    let csv = 'Okul Numarası,Adı Soyadı,Sınav Durumu,Kavramsal Düzey (0-4),Tespit Edilen Kavram Yanılgıları\n';

    for (const attempt of exam.attempts) {
      const studentName = `"${attempt.studentRoster.firstName} ${attempt.studentRoster.lastName}"`;
      const resp = attempt.responses[0];
      const ai = resp?.aiAnalyses[0]?.analysisJson as any;
      const score = ai?.conceptualUnderstanding?.overallLevel?.score ?? '-';
      const miscs = (ai?.conceptualUnderstanding?.misconceptions || [])
        .map((m: any) => m.code)
        .join(';');

      csv += `${attempt.studentRoster.schoolNumber},${studentName},${attempt.status},${score},"${miscs}"\n`;
    }

    return csv;
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_DATABASE_CONFIG_MISSING: DATABASE_URL environment variable is required.');
    }

    return exportTeacherDataCSV(examId) || `Okul Numarası,Adı Soyadı,Sınav Durumu,Kavramsal Düzey (0-4)\n101,"Ahmet Yılmaz",SUBMITTED,3\n`;
  }
}
