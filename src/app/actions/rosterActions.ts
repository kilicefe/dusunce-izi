'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

function revalidateRosterViews(classroomId: string) {
  revalidatePath('/dashboard');
  revalidatePath('/classrooms');
  revalidatePath(`/classrooms/${classroomId}`);
}

const studentSchema = z.object({
  classroomId: z.string().min(1, 'Sınıf seçilmelidir'),
  schoolNumber: z.string().min(1, 'Okul numarası zorunludur').trim(),
  firstName: z.string().min(1, 'Ad zorunludur').trim(),
  lastName: z.string().min(1, 'Soyad zorunludur').trim(),
});

export async function addStudentToRoster(data: z.infer<typeof studentSchema>) {
  const teacher = await requireTeacher();
  const validated = studentSchema.parse(data);

  // IDOR check: Verify classroom exists and teacher owns it
  const classroom = await prisma.classroom.findUnique({
    where: { id: validated.classroomId },
  });

  if (!classroom) throw new Error('NOT_FOUND: Sınıf bulunamadı');
  if (teacher.role !== Role.ADMIN && classroom.teacherId !== teacher.id) {
    throw new Error('FORBIDDEN: Bu sınıfa öğrenci ekleme yetkiniz yok');
  }

  // Duplicate check
  const existing = await prisma.studentRoster.findUnique({
    where: {
      classroomId_schoolNumber: {
        classroomId: validated.classroomId,
        schoolNumber: validated.schoolNumber,
      },
    },
  });

  if (existing) {
    throw new Error(`DUPLICATE: ${validated.schoolNumber} numaralı öğrenci bu sınıfta zaten kayıtlı`);
  }

  const student = await prisma.studentRoster.create({
    data: {
      classroomId: validated.classroomId,
      schoolNumber: validated.schoolNumber,
      firstName: validated.firstName,
      lastName: validated.lastName,
    },
  });

  await createAuditLog({
    actorId: teacher.id,
    action: 'ADD_STUDENT',
    entityType: 'ROSTER',
    entityId: student.id,
    details: { schoolNumber: student.schoolNumber, classroomId: student.classroomId },
  });

  revalidateRosterViews(validated.classroomId);

  return student;
}

export interface CSVRowPreview {
  rowIndex: number;
  schoolNumber: string;
  firstName: string;
  lastName: string;
  valid: boolean;
  error?: string;
}

export async function previewAndImportCSV(classroomId: string, csvContent: string, commit: boolean = false) {
  const teacher = await requireTeacher();

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) throw new Error('NOT_FOUND: Sınıf bulunamadı');
  if (teacher.role !== Role.ADMIN && classroom.teacherId !== teacher.id) {
    throw new Error('FORBIDDEN: Bu sınıfa öğrenci yükleme yetkiniz yok');
  }

  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('INVALID_CSV: CSV dosyası başlık ve en az bir veri satırı içermelidir');
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  
  let numColIndex = headers.findIndex((h) => ['schoolnumber', 'okul_no', 'okul_numarasi', 'numara', 'no'].includes(h));
  let firstNameColIndex = headers.findIndex((h) => ['firstname', 'ad', 'isim'].includes(h));
  let lastNameColIndex = headers.findIndex((h) => ['lastname', 'soyad', 'soyisim'].includes(h));

  if (numColIndex === -1 || firstNameColIndex === -1 || lastNameColIndex === -1) {
    // Default column order fallback if header names don't match exactly
    numColIndex = 0;
    firstNameColIndex = 1;
    lastNameColIndex = 2;
  }

  const existingRoster = await prisma.studentRoster.findMany({
    where: { classroomId },
    select: { schoolNumber: true },
  });
  const existingNumbers = new Set(existingRoster.map((s) => s.schoolNumber));
  const seenInCSV = new Set<string>();

  const rowsPreview: CSVRowPreview[] = [];
  const validRowsToInsert: { schoolNumber: string; firstName: string; lastName: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const schoolNumber = cols[numColIndex] || '';
    const firstName = cols[firstNameColIndex] || '';
    const lastName = cols[lastNameColIndex] || '';

    if (!schoolNumber || !firstName || !lastName) {
      rowsPreview.push({
        rowIndex: i,
        schoolNumber,
        firstName,
        lastName,
        valid: false,
        error: 'Eksik alan (Okul No, Ad veya Soyad boş olamaz)',
      });
      continue;
    }

    if (existingNumbers.has(schoolNumber)) {
      rowsPreview.push({
        rowIndex: i,
        schoolNumber,
        firstName,
        lastName,
        valid: false,
        error: `Bu okul numarası (${schoolNumber}) veritabanında zaten mevcut`,
      });
      continue;
    }

    if (seenInCSV.has(schoolNumber)) {
      rowsPreview.push({
        rowIndex: i,
        schoolNumber,
        firstName,
        lastName,
        valid: false,
        error: `Bu okul numarası (${schoolNumber}) CSV içinde tekrarlanıyor`,
      });
      continue;
    }

    seenInCSV.add(schoolNumber);
    rowsPreview.push({
      rowIndex: i,
      schoolNumber,
      firstName,
      lastName,
      valid: true,
    });

    validRowsToInsert.push({ schoolNumber, firstName, lastName });
  }

  if (commit && validRowsToInsert.length > 0) {
    // Execute atomic import transaction
    await prisma.$transaction(
      validRowsToInsert.map((item) =>
        prisma.studentRoster.create({
          data: {
            classroomId,
            schoolNumber: item.schoolNumber,
            firstName: item.firstName,
            lastName: item.lastName,
          },
        })
      )
    );

    await createAuditLog({
      actorId: teacher.id,
      action: 'IMPORT_ROSTER_CSV',
      entityType: 'ROSTER',
      entityId: classroomId,
      details: { importedCount: validRowsToInsert.length },
    });

    revalidateRosterViews(classroomId);
  }

  return {
    totalRows: lines.length - 1,
    validCount: validRowsToInsert.length,
    invalidCount: rowsPreview.length - validRowsToInsert.length,
    rows: rowsPreview,
    committed: commit && validRowsToInsert.length > 0,
  };
}
