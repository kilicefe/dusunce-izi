import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetMemoryStore,
  seedInitialData,
  createExam,
  publishExam,
  addQuestion,
  validatePublicExamAvailability,
  createOrResumeAttempt,
  saveTextResponse,
  addImageResponse,
  deleteImageResponse,
  saveAudioResponse,
  deleteAudioResponse,
  submitAttempt,
  getTeacherExamAttempts,
  getTeacherAttemptDetail,
  closeExam,
  updateExam,
} from '../lib/db';
import { ExamStatus, AttemptStatus, ResponseStatus, ResponseMode } from '../types/database';

describe('Phase 3: Public Student Exam Flow & Multimodal Submissions', () => {
  const teacherId = 't-101';
  const classroomId = 'c-8a';
  const validSchoolNo = '101'; // Zeynep Kaya

  beforeEach(() => {
    resetMemoryStore();
    seedInitialData();
  });

  it('validates public exam availability states', () => {
    // Default exam e-801 is published in seed data
    const seedAvailability = validatePublicExamAvailability('exam-8a-maddesi');
    expect(seedAvailability.status).toBe('available');
    expect(seedAvailability.exam).toBeDefined();

    // Create a new draft exam
    const draft = createExam(
      { classroomId, title: 'Draft Exam', subject: 'Fen', instructions: 'Test' },
      teacherId
    );
    const draftAvailability = validatePublicExamAvailability(draft.publicToken);
    expect(draftAvailability.status).toBe('invalid');

    // Add question and publish
    addQuestion(draft.id, { questionText: 'Q1?', allowedResponseModes: [ResponseMode.DIRECT_TEXT] }, teacherId);
    const published = publishExam(draft.id, teacherId);
    expect(validatePublicExamAvailability(published.publicToken).status).toBe('available');

    // Close exam
    closeExam(published.id, teacherId);
    expect(validatePublicExamAvailability(published.publicToken).status).toBe('closed');
  });

  it('validates future start date and past end date', () => {
    const exam = createExam({ classroomId, title: 'Timed Exam' }, teacherId);
    addQuestion(exam.id, { questionText: 'Q1' }, teacherId);

    // Future start date
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    updateExam(exam.id, { startDate: futureDate }, teacherId);
    publishExam(exam.id, teacherId);
    expect(validatePublicExamAvailability(exam.publicToken).status).toBe('not_started');

    // Past end date
    const draft2 = createExam({ classroomId, title: 'Expired Exam' }, teacherId);
    addQuestion(draft2.id, { questionText: 'Q1' }, teacherId);
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const pastStart = new Date(Date.now() - 172800000).toISOString();
    updateExam(draft2.id, { startDate: pastStart, endDate: pastDate }, teacherId);
    publishExam(draft2.id, teacherId);
    expect(validatePublicExamAvailability(draft2.publicToken).status).toBe('ended');
  });

  it('prevents student entry with invalid school number using generic error', () => {
    expect(() => createOrResumeAttempt('e-801', '999999')).toThrow(
      'Girilen bilgiler doğrulanamadı veya bu sınava erişim uygun değil.'
    );
  });

  it('creates new attempt and allows resuming in-progress attempt', () => {
    const attempt1 = createOrResumeAttempt('e-801', validSchoolNo);
    expect(attempt1.status).toBe(AttemptStatus.IN_PROGRESS);
    expect(attempt1.studentRoster?.schoolNumber).toBe(validSchoolNo);

    // Resuming active attempt returns the same attempt
    const attemptResume = createOrResumeAttempt('e-801', validSchoolNo);
    expect(attemptResume.id).toBe(attempt1.id);
  });

  it('handles multimodal response creation and removal', () => {
    const attempt = createOrResumeAttempt('e-801', validSchoolNo);
    const questionId = 'q-1';

    // 1. Save text response
    const textResp = saveTextResponse(attempt.id, questionId, 'Moleküller hızlı hareket eder.');
    expect(textResp.textResponse?.content).toBe('Moleküller hızlı hareket eder.');
    expect(textResp.status).toBe(ResponseStatus.ANSWERED);

    // 2. Add handwritten image response
    const imgResp = addImageResponse(attempt.id, questionId, {
      url: 'data:image/png;base64,fakeimage',
      originalFilename: 'cizim.png',
      fileSize: 1024,
    });
    expect(imgResp.imageResponses).toHaveLength(1);
    expect(imgResp.imageResponses![0].url).toBe('data:image/png;base64,fakeimage');

    // 3. Add audio response
    const audioResp = saveAudioResponse(attempt.id, questionId, {
      url: 'blob:http://localhost/audio-123',
      durationSeconds: 15,
    });
    expect(audioResp.audioResponse?.durationSeconds).toBe(15);

    // 4. Delete audio response
    const afterAudioDel = deleteAudioResponse(attempt.id, questionId);
    expect(afterAudioDel.audioResponse).toBeUndefined();
    expect(afterAudioDel.status).toBe(ResponseStatus.ANSWERED); // Text and images still present

    // 5. Delete image response
    const imgId = imgResp.imageResponses![0].id;
    const afterImgDel = deleteImageResponse(attempt.id, questionId, imgId);
    expect(afterImgDel.imageResponses).toHaveLength(0);
  });

  it('submits attempt and prevents editing after submission', () => {
    const attempt = createOrResumeAttempt('e-801', validSchoolNo);
    saveTextResponse(attempt.id, 'q-1', 'Deney sonucu...');

    const submitted = submitAttempt(attempt.id);
    expect(submitted.status).toBe(AttemptStatus.SUBMITTED);
    expect(submitted.submittedAt).toBeDefined();

    // Idempotent re-submission returns same submitted object
    const resubmit = submitAttempt(attempt.id);
    expect(resubmit.submittedAt).toBe(submitted.submittedAt);

    // Trying to edit submitted attempt throws error
    expect(() => saveTextResponse(attempt.id, 'q-1', 'Yeni metin')).toThrow(
      'Bu sınav oturumu aktif değil veya teslim edilmiştir.'
    );

    // Trying to re-enter exam throws submission completed error
    expect(() => createOrResumeAttempt('e-801', validSchoolNo)).toThrow(
      'Bu sınava katılımınız daha önce tamamlanmıştır.'
    );
  });

  it('provides teacher response overview and detailed inspection', () => {
    // Create & Submit student 101
    const att1 = createOrResumeAttempt('e-801', '101');
    saveTextResponse(att1.id, 'q-1', 'Zeynep cevabı');
    addImageResponse(att1.id, 'q-1', { url: 'data:image/png;base64,101' });
    submitAttempt(att1.id);

    // Create student 102 (in progress)
    const att2 = createOrResumeAttempt('e-801', '102');
    saveTextResponse(att2.id, 'q-1', 'Ali cevabı');

    const teacherAttempts = getTeacherExamAttempts('e-801', teacherId);
    expect(teacherAttempts.length).toBeGreaterThanOrEqual(2);

    const zeynepAtt = teacherAttempts.find((a) => a.student.schoolNumber === '101');
    expect(zeynepAtt?.attempt.status).toBe(AttemptStatus.SUBMITTED);
    expect(zeynepAtt?.hasText).toBe(true);
    expect(zeynepAtt?.hasImages).toBe(true);

    const detail = getTeacherAttemptDetail('e-801', att1.id, teacherId);
    expect(detail.student.schoolNumber).toBe('101');
    expect(detail.responses).toHaveLength(1);
    expect(detail.events.some((e) => e.eventType === 'SUBMITTED')).toBe(true);
  });
});
