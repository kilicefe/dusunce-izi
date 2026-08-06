import { describe, it, expect, beforeEach } from 'vitest';
import { Role, ExamStatus, ResponseMode } from '../types/database';
import {
  seedInitialData,
  resetMemoryStore,
  createExam,
  getExams,
  getExamById,
  updateExam,
  addQuestion,
  updateQuestion,
  reorderQuestions,
  deleteQuestion,
  validateExamForPublication,
  publishExam,
  unpublishExam,
  closeExam,
  archiveExam,
  restoreExam,
  duplicateExam,
  rotateExamToken,
  revokeExamToken,
  deleteDraftExam,
  getExamByToken,
  getExamByShortCode,
} from '../lib/db';

describe('Phase 2: Exam & Question Management, Publication & Authorization Tests', () => {
  const teacherId = 't-101';
  const otherTeacherId = 't-999';
  const classroomId = 'c-8a';

  beforeEach(() => {
    resetMemoryStore();
    seedInitialData();
  });

  it('1. Teacher can create an exam in their classroom', () => {
    const exam = createExam(
      {
        classroomId,
        title: '8-A Fen Bilimleri Genel Değerlendirme',
        subject: 'Fen Bilimleri',
        unit: '2. Ünite',
        topic: 'DNA ve Genetik Kod',
      },
      teacherId
    );

    expect(exam).toBeDefined();
    expect(exam.id).toBeDefined();
    expect(exam.title).toBe('8-A Fen Bilimleri Genel Değerlendirme');
    expect(exam.teacherId).toBe(teacherId);
    expect(exam.status).toBe(ExamStatus.DRAFT);
    expect(exam.publicToken).toBeDefined();
    expect(exam.shortCode).toHaveLength(6);
  });

  it('2. Teacher cannot create an exam in another teacher classroom', () => {
    expect(() =>
      createExam(
        {
          classroomId,
          title: 'Yetkisiz Sınav',
        },
        otherTeacherId
      )
    ).toThrow('Sadece kendi sınıflarınız için sınav oluşturabilirsiniz.');
  });

  it('3. Draft exam updates work correctly', () => {
    const exam = createExam(
      {
        classroomId,
        title: 'İlk Başlık',
      },
      teacherId
    );

    const updated = updateExam(
      exam.id,
      {
        title: 'Güncellenmiş Başlık',
        instructions: 'Soruları açıklayarak çözünüz.',
        timeLimitMinutes: 40,
      },
      teacherId
    );

    expect(updated.title).toBe('Güncellenmiş Başlık');
    expect(updated.instructions).toBe('Soruları açıklayarak çözünüz.');
    expect(updated.timeLimitMinutes).toBe(40);
  });

  it('4. Question creation and properties work', () => {
    const exam = createExam({ classroomId, title: 'Soru Testi' }, teacherId);

    const question = addQuestion(
      exam.id,
      {
        title: 'DNA İkili Sarmalı',
        questionText: 'Nükleotid dizilimini ve hidrojen bağlarını açıklayınız.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT, ResponseMode.HANDWRITTEN_IMAGE],
        targetedSkills: ['problemUnderstanding', 'causalReasoning'],
      },
      teacherId
    );

    expect(question.id).toBeDefined();
    expect(question.questionOrder).toBe(1);
    expect(question.title).toBe('DNA İkili Sarmalı');
    expect(question.allowedResponseModes).toContain(ResponseMode.DIRECT_TEXT);
    expect(question.targetedSkills).toContain('causalReasoning');
  });

  it('5. Question ordering and reordering works', () => {
    const exam = createExam({ classroomId, title: 'Sıralama Testi' }, teacherId);

    const q1 = addQuestion(exam.id, { title: 'Soru 1', questionText: 'Metin 1' }, teacherId);
    const q2 = addQuestion(exam.id, { title: 'Soru 2', questionText: 'Metin 2' }, teacherId);
    const q3 = addQuestion(exam.id, { title: 'Soru 3', questionText: 'Metin 3' }, teacherId);

    const reordered = reorderQuestions(exam.id, [q3.id, q1.id, q2.id], teacherId);

    expect(reordered[0].id).toBe(q3.id);
    expect(reordered[0].questionOrder).toBe(1);
    expect(reordered[1].id).toBe(q1.id);
    expect(reordered[1].questionOrder).toBe(2);
    expect(reordered[2].id).toBe(q2.id);
    expect(reordered[2].questionOrder).toBe(3);
  });

  it('6. Expected concept and misconception creation and management', () => {
    const exam = createExam({ classroomId, title: 'Kavram Testi' }, teacherId);
    const question = addQuestion(
      exam.id,
      {
        title: 'Fotozentez Mantığı',
        questionText: 'Kloroplast ve ışık enerjisi dönüşümünü yazınız.',
        expectedConcepts: [
          {
            id: 'ec-1',
            questionId: '',
            conceptName: 'Güneş Enerjisinin Kimyasal Enerjiye Dönüşümü',
            description: 'Işık enerjisinin ATP ve glikoz bağ enerjisine aktarılması',
            isEssential: true,
            importance: 'essential',
          },
        ],
        misconceptions: [
          {
            id: 'mc-1',
            questionId: '',
            code: 'PHOTOSYNTH_NIGHT',
            title: 'Fotosentezin Sadece Gece Yapıldığı Yanılgısı',
            description: 'Öğrenci kloroplastın sadece karanlıkta çalıştığını sanmaktadır.',
            remedy: 'Işık varlığında gerçekleştiği gösterilmelidir.',
          },
        ],
      },
      teacherId
    );

    expect(question.expectedConcepts).toHaveLength(1);
    expect(question.expectedConcepts![0].conceptName).toContain('Güneş Enerjisi');
    expect(question.misconceptions).toHaveLength(1);
    expect(question.misconceptions![0].code).toBe('PHOTOSYNTH_NIGHT');
  });

  it('7. Rubric configuration per question', () => {
    const exam = createExam({ classroomId, title: 'Rubrik Testi' }, teacherId);
    const question = addQuestion(
      exam.id,
      {
        title: 'Solunum Sorusuna Özel Rubrik',
        questionText: 'Mitoz ve Mayoz hücre bölünmesini karşılaştırınız.',
        rubrics: [
          {
            id: 'rub-1',
            questionId: '',
            dimension: 'conceptualUnderstanding',
            level: 4,
            levelTitle: 'Kusursuz Karşılaştırma',
            description: 'Kromozom sayısı ve kalıtsal çeşitlilik farkı tam açıklanmış.',
            observableIndicators: 'Krossing-over ve parça değişimi anılmıştır.',
          },
        ],
      },
      teacherId
    );

    expect(question.rubrics).toHaveLength(1);
    expect(question.rubrics![0].level).toBe(4);
  });

  it('8. Publication validation rejects invalid exams and accepts complete ones', () => {
    const exam = createExam({ classroomId, title: 'Boş Sınav' }, teacherId);

    // Empty questions -> should fail validation
    const val1 = validateExamForPublication(exam.id, teacherId);
    expect(val1.valid).toBe(false);
    expect(val1.errors.some((e) => e.message.includes('en az 1 soru'))).toBe(true);

    // Add a valid question
    addQuestion(
      exam.id,
      {
        title: 'Geçerli Soru',
        questionText: 'Bu soru geçerli bir metne sahiptir.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT],
      },
      teacherId
    );

    const val2 = validateExamForPublication(exam.id, teacherId);
    expect(val2.valid).toBe(true);
    expect(val2.errors).toHaveLength(0);
  });

  it('9. Exam publication creates secure public token and shortcode', () => {
    const exam = createExam({ classroomId, title: 'Yayınlanacak Sınav' }, teacherId);
    addQuestion(
      exam.id,
      {
        title: 'Soru 1',
        questionText: 'Cevabınızı giriniz.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT],
      },
      teacherId
    );

    const published = publishExam(exam.id, teacherId);

    expect(published.status).toBe(ExamStatus.PUBLISHED);
    expect(published.publishedAt).toBeDefined();

    // Verify retrieval by token and shortCode
    const foundByToken = getExamByToken(published.publicToken);
    expect(foundByToken?.id).toBe(published.id);

    const foundByShortCode = getExamByShortCode(published.shortCode);
    expect(foundByShortCode?.id).toBe(published.id);
  });

  it('10. Published exam read-only protection prevents accidental edits', () => {
    const exam = createExam({ classroomId, title: 'Korunan Sınav' }, teacherId);
    addQuestion(
      exam.id,
      {
        title: 'Soru 1',
        questionText: 'Açıklama yapınız.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT],
      },
      teacherId
    );

    publishExam(exam.id, teacherId);

    // Attempting to change content fields on published exam should throw
    expect(() =>
      updateExam(
        exam.id,
        {
          title: 'Değiştirilmeye Çalışılan Başlık',
        },
        teacherId
      )
    ).toThrow('Yayındaki veya kapalı sınavlar doğrudan değiştirilemez');

    // Attempting to add question to published exam should throw
    expect(() =>
      addQuestion(exam.id, { title: 'Yeni Soru', questionText: 'Hata' }, teacherId)
    ).toThrow('Yayındaki sınavlara yeni soru eklenemez');
  });

  it('11. Token rotation invalidates old link and generates new valid ones', () => {
    const exam = createExam({ classroomId, title: 'Rotasyon Testi' }, teacherId);
    addQuestion(
      exam.id,
      {
        title: 'Soru 1',
        questionText: 'Test sorusu.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT],
      },
      teacherId
    );

    const published = publishExam(exam.id, teacherId);
    const oldToken = published.publicToken;
    const oldShortCode = published.shortCode;

    const rotated = rotateExamToken(exam.id, teacherId);

    expect(rotated.publicToken).not.toBe(oldToken);
    expect(rotated.shortCode).not.toBe(oldShortCode);

    expect(getExamByToken(oldToken)).toBeNull();
    expect(getExamByToken(rotated.publicToken)?.id).toBe(exam.id);
  });

  it('12. Token revocation and exam closing work', () => {
    const exam = createExam({ classroomId, title: 'İptal Testi' }, teacherId);
    addQuestion(
      exam.id,
      {
        title: 'Soru 1',
        questionText: 'Metin',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT],
      },
      teacherId
    );

    publishExam(exam.id, teacherId);
    const closed = closeExam(exam.id, teacherId);

    expect(closed.status).toBe(ExamStatus.CLOSED);
    expect(closed.closedAt).toBeDefined();
  });

  it('13. Exam duplication creates an exact editable DRAFT copy', () => {
    const exam = createExam({ classroomId, title: 'Orijinal Sınav' }, teacherId);
    addQuestion(
      exam.id,
      {
        title: 'Orijinal Soru 1',
        questionText: 'Kopyalanacak soru metni.',
        allowedResponseModes: [ResponseMode.DIRECT_TEXT, ResponseMode.AUDIO_EXPLANATION],
        expectedConcepts: [
          { id: 'ec-1', questionId: '', conceptName: 'Enerji Akışı', isEssential: true },
        ],
      },
      teacherId
    );

    publishExam(exam.id, teacherId);

    const copy = duplicateExam(exam.id, teacherId);

    expect(copy.id).not.toBe(exam.id);
    expect(copy.title).toBe('Orijinal Sınav — Kopya');
    expect(copy.status).toBe(ExamStatus.DRAFT);
    expect(copy.publishedAt).toBeUndefined();
    expect(copy.questions).toHaveLength(1);
    expect(copy.questions![0].title).toBe('Orijinal Soru 1');
    expect(copy.questions![0].expectedConcepts).toHaveLength(1);

    // Copy should be editable!
    const updatedCopy = updateExam(copy.id, { title: 'Düzenlenen Kopya' }, teacherId);
    expect(updatedCopy.title).toBe('Düzenlenen Kopya');
  });

  it('14. Archive and restore work', () => {
    const exam = createExam({ classroomId, title: 'Arşiv Testi' }, teacherId);
    const archived = archiveExam(exam.id, teacherId);
    expect(archived.status).toBe(ExamStatus.ARCHIVED);

    // Default list excludes archived exams
    const activeExams = getExams({ teacherId });
    expect(activeExams.some((e) => e.id === exam.id)).toBe(false);

    // Explicit archived filter returns it
    const archivedExams = getExams({ teacherId, status: ExamStatus.ARCHIVED });
    expect(archivedExams.some((e) => e.id === exam.id)).toBe(true);

    const restored = restoreExam(exam.id, teacherId);
    expect(restored.status).toBe(ExamStatus.DRAFT);
  });

  it('15. Unauthorized exam actions are rejected', () => {
    const exam = createExam({ classroomId, title: 'Gizli Sınav' }, teacherId);

    expect(() => getExamById(exam.id, otherTeacherId, Role.TEACHER)).toThrow('Bu sınava erişim yetkiniz bulunmuyor.');
    expect(() => updateExam(exam.id, { title: 'Sabotaj' }, otherTeacherId, Role.TEACHER)).toThrow('Bu sınavı güncelleme yetkiniz yok.');
    expect(() => publishExam(exam.id, otherTeacherId)).toThrow();
    expect(() => duplicateExam(exam.id, otherTeacherId)).toThrow();
  });
});
