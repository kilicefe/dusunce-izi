import { describe, it, expect, beforeEach } from 'vitest';
import {
  seedInitialData,
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  getStudentRoster,
  addStudentToRoster,
  importRosterFromCSV,
  validateStudentEntry,
  resetMemoryStore,
} from '../lib/db';

describe('Phase 1: Classroom & Student Roster Management Tests', () => {
  beforeEach(() => {
    resetMemoryStore();
    seedInitialData();
  });

  it('should retrieve seeded initial classrooms', () => {
    const classrooms = getClassrooms();
    expect(classrooms.length).toBeGreaterThanOrEqual(2);
    expect(classrooms[0].name).toBe('8-A Fen Bilimleri');
  });

  it('should create a new classroom successfully', () => {
    const newClassroom = createClassroom({
      teacherId: 't-101',
      name: '7-C Matematik',
      grade: '7',
      branch: 'C',
      academicYear: '2025-2026',
    });

    expect(newClassroom.id).toBeDefined();
    expect(newClassroom.name).toBe('7-C Matematik');
    expect(getClassrooms().length).toBe(3);
  });

  it('should update existing classroom fields', () => {
    const classrooms = getClassrooms();
    const target = classrooms[0];
    const updated = updateClassroom(target.id, { name: '8-A Güncellenmiş Fen' });

    expect(updated?.name).toBe('8-A Güncellenmiş Fen');
  });

  it('should delete classroom and associated roster items', () => {
    const classrooms = getClassrooms();
    const targetId = classrooms[0].id;
    const initialRosterCount = getStudentRoster(targetId).length;
    expect(initialRosterCount).toBeGreaterThan(0);

    const deleted = deleteClassroom(targetId);
    expect(deleted).toBe(true);
    expect(getClassrooms().find((c) => c.id === targetId)).toBeUndefined();
    expect(getStudentRoster(targetId).length).toBe(0);
  });

  it('should manually add a student to roster and prevent duplicate school numbers', () => {
    const classroom = getClassrooms()[0];
    const newStudent = addStudentToRoster({
      classroomId: classroom.id,
      schoolNumber: '999',
      firstName: 'Berk',
      lastName: 'Güneş',
    });

    expect(newStudent.schoolNumber).toBe('999');
    expect(getStudentRoster(classroom.id).some((s) => s.schoolNumber === '999')).toBe(true);

    // Duplicate check
    expect(() =>
      addStudentToRoster({
        classroomId: classroom.id,
        schoolNumber: '999',
        firstName: 'Berk',
        lastName: 'Güneş',
      })
    ).toThrow();
  });

  it('should parse Turkish CSV headers and import student roster', () => {
    const classroom = getClassrooms()[0];
    const csvContent = `Okul No;Ad;Soyad
301;Ahmet;Yılmaz
302;Fatma;Kaya
303;Mustafa;Er`;

    const result = importRosterFromCSV(classroom.id, csvContent);
    expect(result.added.length).toBe(3);
    expect(result.errors.length).toBe(0);

    const roster = getStudentRoster(classroom.id);
    expect(roster.some((s) => s.schoolNumber === '301')).toBe(true);
    expect(roster.some((s) => s.schoolNumber === '302')).toBe(true);
  });

  it('should validate student entry by school number without sending PII to AI', () => {
    const classroom = getClassrooms()[0];
    const validated = validateStudentEntry(classroom.id, '101');
    expect(validated).not.toBeNull();
    expect(validated?.firstName).toBe('Zeynep');

    const invalid = validateStudentEntry(classroom.id, '9999');
    expect(invalid).toBeNull();
  });
});
