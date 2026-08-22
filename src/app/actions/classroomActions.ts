'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireTeacher } from '@/lib/auth';
import { createAuditLog } from '@/lib/auditLogger';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const classroomSchema = z.object({
  name: z.string().min(1, 'Sınıf adı zorunludur'),
  grade: z.string().min(1, 'Sınıf düzeyi zorunludur'),
  branch: z.string().optional(),
  academicYear: z.string().min(1, 'Akademik yıl zorunludur'),
  schoolId: z.string().optional(),
});

export async function createClassroom(formData: z.infer<typeof classroomSchema>) {
  const teacher = await requireTeacher();
  const validated = classroomSchema.parse(formData);

  const classroom = await prisma.classroom.create({
    data: {
      teacherId: teacher.id,
      name: validated.name,
      grade: validated.grade,
      branch: validated.branch || null,
      academicYear: validated.academicYear,
      schoolId: validated.schoolId || null,
      status: 'ACTIVE',
    },
  });

  await createAuditLog({
    actorId: teacher.id,
    action: 'CREATE',
    entityType: 'CLASSROOM',
    entityId: classroom.id,
    details: { name: classroom.name, grade: classroom.grade },
  });

  revalidatePath('/dashboard');
  revalidatePath('/classrooms');

  return classroom;
}

export async function listClassrooms() {
  const user = await requireTeacher();
  if (user.role === Role.ADMIN) {
    return prisma.classroom.findMany({
      include: { _count: { select: { roster: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  return prisma.classroom.findMany({
    where: { teacherId: user.id },
    include: { _count: { select: { roster: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClassroom(id: string) {
  const user = await requireTeacher();
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      roster: {
        orderBy: { schoolNumber: 'asc' },
      },
      school: true,
    },
  });

  if (!classroom) {
    throw new Error('NOT_FOUND: Classroom not found');
  }

  // IDOR check: Teacher must own the classroom
  if (user.role !== Role.ADMIN && classroom.teacherId !== user.id) {
    throw new Error('FORBIDDEN: You do not have access to this classroom');
  }

  return classroom;
}

export async function updateClassroom(id: string, formData: Partial<z.infer<typeof classroomSchema>>) {
  const user = await requireTeacher();
  const classroom = await prisma.classroom.findUnique({ where: { id } });

  if (!classroom) throw new Error('NOT_FOUND: Classroom not found');
  if (user.role !== Role.ADMIN && classroom.teacherId !== user.id) {
    throw new Error('FORBIDDEN: You do not have permission to edit this classroom');
  }

  const updated = await prisma.classroom.update({
    where: { id },
    data: {
      ...(formData.name && { name: formData.name }),
      ...(formData.grade && { grade: formData.grade }),
      ...(formData.branch !== undefined && { branch: formData.branch }),
      ...(formData.academicYear && { academicYear: formData.academicYear }),
      ...(formData.schoolId !== undefined && { schoolId: formData.schoolId }),
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: 'UPDATE',
    entityType: 'CLASSROOM',
    entityId: updated.id,
    details: { changes: formData },
  });

  revalidatePath('/dashboard');
  revalidatePath('/classrooms');
  revalidatePath(`/classrooms/${id}`);

  return updated;
}

export async function archiveClassroom(id: string) {
  const user = await requireTeacher();
  const classroom = await prisma.classroom.findUnique({ where: { id } });

  if (!classroom) throw new Error('NOT_FOUND: Classroom not found');
  if (user.role !== Role.ADMIN && classroom.teacherId !== user.id) {
    throw new Error('FORBIDDEN: You do not have permission to archive this classroom');
  }

  const archived = await prisma.classroom.update({
    where: { id },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: 'ARCHIVE',
    entityType: 'CLASSROOM',
    entityId: archived.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/classrooms');
  revalidatePath(`/classrooms/${id}`);

  return archived;
}

export async function restoreClassroom(id: string) {
  const user = await requireTeacher();
  const classroom = await prisma.classroom.findUnique({ where: { id } });

  if (!classroom) throw new Error('NOT_FOUND: Classroom not found');
  if (user.role !== Role.ADMIN && classroom.teacherId !== user.id) {
    throw new Error('FORBIDDEN: You do not have permission to restore this classroom');
  }

  const restored = await prisma.classroom.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      archivedAt: null,
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: 'RESTORE',
    entityType: 'CLASSROOM',
    entityId: restored.id,
  });

  revalidatePath('/dashboard');
  revalidatePath('/classrooms');
  revalidatePath(`/classrooms/${id}`);

  return restored;
}
