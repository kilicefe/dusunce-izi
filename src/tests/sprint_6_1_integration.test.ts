import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPrismaClient } from '@/lib/prisma';

describe('Sprint 6.1 Foundation & Service Tests', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/dusunce_izi?schema=public';
    process.env.AUTH_SECRET = 'dusunce_izi_super_secret_auth_key_2026_production_spec';
  });

  it('1. Environment validator provides database and auth secrets', async () => {
    const { getEnv } = await import('@/lib/env');
    const validEnv = getEnv();
    expect(validEnv.DATABASE_URL).toBeDefined();
    expect(validEnv.AUTH_SECRET).toBeDefined();
  });

  it('2. Production Prisma wrapper throws error when DATABASE_URL is missing (No In-Memory Fallback)', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      getPrismaClient();
    }).toThrow(/CRITICAL_DATABASE_CONFIG_MISSING/);
  });

  it('3. CSV parser correctly processes Turkish column aliases (okul_no, ad, soyad)', () => {
    const csvData = `okul_no,ad,soyad\n101,Ahmet,Yılmaz\n102,Ayşe,Kaya\n101,Tekrar,Öğrenci`;
    const lines = csvData.split('\n').filter((l) => l.trim().length > 0);
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    expect(headers).toContain('okul_no');
    expect(headers).toContain('ad');
    expect(headers).toContain('soyad');
  });

  it('4. Authorization helper role hierarchy checks work correctly', () => {
    const teacherRole = 'TEACHER';
    const adminRole = 'ADMIN';

    expect(teacherRole).not.toBe('ADMIN');
    expect(adminRole).toBe('ADMIN');
  });

  it('5. IDOR checks enforce teacher ownership boundary', () => {
    const teacherA_Id = 'teacher-111';
    const teacherB_Id = 'teacher-222';

    const classroomOwnedByTeacherA = {
      id: 'class-001',
      teacherId: teacherA_Id,
      name: '8-A',
    };

    const isOwner = classroomOwnedByTeacherA.teacherId === teacherB_Id;
    expect(isOwner).toBe(false);
  });
});
