import {
  User,
  Role,
  Classroom,
  StudentRosterItem,
  CSVImportResult,
  School,
  Exam,
  ExamStatus,
  ResponseMode,
  Question,
  AuditLogItem,
  ExamAttempt,
  AttemptStatus,
  StudentResponse,
  ResponseStatus,
  UploadStatus,
  TextResponseComponent,
  ImageResponseComponent,
  AudioResponseComponent,
  AttemptEvent,
} from '../types/database';

export type {
  User,
  Role,
  Classroom,
  StudentRosterItem,
  CSVImportResult,
  School,
  Exam,
  ExamStatus,
  ResponseMode,
  Question,
  AuditLogItem,
  ExamAttempt,
  AttemptStatus,
  StudentResponse,
  ResponseStatus,
  UploadStatus,
  TextResponseComponent,
  ImageResponseComponent,
  AudioResponseComponent,
  AttemptEvent,
};

// Memory/Storage Key Constants
export const STORAGE_KEYS = {
  USERS: 'dusunceizi_users',
  CLASSROOMS: 'dusunceizi_classrooms',
  ROSTER: 'dusunceizi_roster',
  EXAMS: 'dusunceizi_exams',
  CURRENT_USER: 'dusunceizi_current_user',
  AUDIT_LOGS: 'dusunceizi_audit_logs',
  ATTEMPTS: 'dusunceizi_attempts',
  RESPONSES: 'dusunceizi_responses',
  ATTEMPT_EVENTS: 'dusunceizi_attempt_events',
  TEACHER_REVIEWS: 'dusunceizi_teacher_reviews',
  AI_ANALYSES: 'dusunceizi_ai_analyses',
};

// Seed Data Initialization
export function seedInitialData() {
  const existingUsers = getItem<User[]>(STORAGE_KEYS.USERS);
  if (existingUsers && existingUsers.length > 0) return;

  const defaultTeacher: User = {
    id: 't-101',
    name: 'Dr. Selin Yılmaz',
    email: 'selin.yilmaz@okul.k12.tr',
    role: Role.TEACHER,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultAdmin: User = {
    id: 'a-101',
    name: 'Ahmet Demir (Sistem Yöneticisi)',
    email: 'admin@dusunceizi.edu.tr',
    role: Role.ADMIN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultClassrooms: Classroom[] = [
    {
      id: 'c-8a',
      teacherId: 't-101',
      name: '8-A Fen Bilimleri',
      grade: '8',
      branch: 'A',
      academicYear: '2025-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { roster: 5, exams: 2 },
    },
    {
      id: 'c-8b',
      teacherId: 't-101',
      name: '8-B Fen Bilimleri',
      grade: '8',
      branch: 'B',
      academicYear: '2025-2026',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { roster: 4, exams: 1 },
    },
  ];

  const defaultRoster: StudentRosterItem[] = [
    {
      id: 'r-101',
      classroomId: 'c-8a',
      schoolNumber: '101',
      firstName: 'Zeynep',
      lastName: 'Kaya',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-102',
      classroomId: 'c-8a',
      schoolNumber: '102',
      firstName: 'Ali',
      lastName: 'Öztürk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-103',
      classroomId: 'c-8a',
      schoolNumber: '103',
      firstName: 'Elif',
      lastName: 'Şahin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-104',
      classroomId: 'c-8a',
      schoolNumber: '104',
      firstName: 'Mehmet',
      lastName: 'Demir',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-105',
      classroomId: 'c-8a',
      schoolNumber: '105',
      firstName: 'Ayşe',
      lastName: 'Çelik',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-201',
      classroomId: 'c-8b',
      schoolNumber: '201',
      firstName: 'Can',
      lastName: 'Aydın',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'r-202',
      classroomId: 'c-8b',
      schoolNumber: '202',
      firstName: 'Deniz',
      lastName: 'Yıldız',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultExams: Exam[] = [
    {
      id: 'e-801',
      teacherId: 't-101',
      classroomId: 'c-8a',
      classroomName: '8-A Fen Bilimleri',
      title: 'Madde ve Isı Düşünme ve Kavram Değerlendirmesi',
      subject: 'Fen Bilimleri',
      unit: '3. Ünite: Madde ve Isı',
      topic: 'Isı Alışverişi ve Özısı',
      description: 'Özısı, sıcaklık değişimi ve moleküler düzeyde enerji aktarımına ilişkin düşünme süreçlerinizi açıklayınız.',
      instructions: 'Soruları dikkatlice okuyunuz. Cevaplarınızı yazarak, çizerek veya ses kaydı ile açıklayabilirsiniz.',
      status: ExamStatus.PUBLISHED,
      publicToken: 'exam-8a-maddesi',
      shortCode: '8fK29d',
      allowResume: true,
      allowMultipleSubmissions: false,
      showFeedbackAfterApproval: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { questions: 2, attempts: 4 },
      questions: [
        {
          id: 'q-1',
          examId: 'e-801',
          questionOrder: 1,
          title: 'Sıcaklık ve Isı Farkı',
          questionText: 'Eşit kütledeki su ve zeytinyağı aynı ısıtıcıyla eşit süre ısıtılıyor. Sıcaklık artışlarının neden farklı olduğunu moleküler hareket ve özısı kavramlarını kullanarak açıklayınız.',
          learningOutcome: 'F.8.4.4.1. Maddelerin özısı değerlerinin sıcaklık değişimine etkisini analiz eder.',
          allowedResponseModes: [ResponseMode.DIRECT_TEXT, ResponseMode.HANDWRITTEN_IMAGE, ResponseMode.AUDIO_EXPLANATION, ResponseMode.MULTIMODAL],
          expectedConcepts: [
            { id: 'ec-1', questionId: 'q-1', conceptName: 'Özısı Tanımı', description: 'Bir gram maddenin sıcaklığını 1°C artırmak için gereken ısı', isEssential: true },
            { id: 'ec-2', questionId: 'q-1', conceptName: 'Moleküler Ortalama Kinetik Enerji', description: 'Sıcaklığın taneciklerin ortalama kinetik enerjisi olduğu', isEssential: true },
          ],
          misconceptions: [
            { id: 'mc-1', questionId: 'q-1', code: 'MIS-01', title: 'Isı ve Sıcaklık Eşleştirmesi', description: 'Isı ve sıcaklığın aynı kavramlar olduğu yanılgısı', remedy: 'Isı enerji aktarımı iken sıcaklık ortalama kinetik enerji göstergesidir.' },
          ],
        },
      ],
    },
  ];

  setItem(STORAGE_KEYS.USERS, [defaultTeacher, defaultAdmin]);
  setItem(STORAGE_KEYS.CLASSROOMS, defaultClassrooms);
  setItem(STORAGE_KEYS.ROSTER, defaultRoster);
  setItem(STORAGE_KEYS.EXAMS, defaultExams);
  setItem(STORAGE_KEYS.CURRENT_USER, defaultTeacher);
}

// In-memory store fallback for SSR / Node environment (Vitest)
let memoryStore: Record<string, string> = {};

export function resetMemoryStore() {
  memoryStore = {};
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

export function getItem<T>(key: string): T | null {
  let raw: string | null = null;
  if (typeof localStorage !== 'undefined') {
    raw = localStorage.getItem(key);
  }
  if (!raw) {
    raw = memoryStore[key] || null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  const json = JSON.stringify(value);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, json);
  }
  memoryStore[key] = json;
}

// User / Auth Services
export function getCurrentUser(): User | null {
  seedInitialData();
  return getItem<User>(STORAGE_KEYS.CURRENT_USER);
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function getStudentRosterByClassroom(classroomId: string): StudentRosterItem[] {
  seedInitialData();
  const roster = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  return roster.filter((r) => r.classroomId === classroomId);
}

export function getAllUsers(): User[] {
  seedInitialData();
  return getItem<User[]>(STORAGE_KEYS.USERS) || [];
}

export function loginAs(role: Role): User {
  const users = getAllUsers();
  const target = users.find((u) => u.role === role) || users[0];
  setCurrentUser(target);
  logAuditAction(target.id, 'LOGIN', 'User Session', { role });
  return target;
}

export function loginWithEmail(email: string, name?: string): User {
  const users = getAllUsers();
  let user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: 'u-' + Date.now(),
      name: name || email.split('@')[0],
      email,
      role: Role.TEACHER,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);
    setItem(STORAGE_KEYS.USERS, users);
  }
  setCurrentUser(user);
  logAuditAction(user.id, 'LOGIN_EMAIL', 'User Session', { email });
  return user;
}

// Classroom CRUD Operations
export function getClassrooms(teacherId?: string): Classroom[] {
  seedInitialData();
  const list = getItem<Classroom[]>(STORAGE_KEYS.CLASSROOMS) || [];
  if (teacherId) {
    return list.filter((c) => c.teacherId === teacherId);
  }
  return list;
}

export function getClassroomById(id: string): Classroom | null {
  const list = getClassrooms();
  return list.find((c) => c.id === id) || null;
}

export function createClassroom(data: {
  teacherId: string;
  name: string;
  grade: string;
  branch?: string;
  academicYear: string;
}): Classroom {
  const list = getClassrooms();
  const newClassroom: Classroom = {
    id: 'c-' + Date.now(),
    teacherId: data.teacherId,
    name: data.name,
    grade: data.grade,
    branch: data.branch || '',
    academicYear: data.academicYear,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _count: { roster: 0, exams: 0 },
  };

  list.push(newClassroom);
  setItem(STORAGE_KEYS.CLASSROOMS, list);
  logAuditAction(data.teacherId, 'CREATE_CLASSROOM', 'Classroom', { classroomId: newClassroom.id, name: newClassroom.name });
  return newClassroom;
}

export function updateClassroom(id: string, updates: Partial<Classroom>): Classroom | null {
  const list = getClassrooms();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  setItem(STORAGE_KEYS.CLASSROOMS, list);
  logAuditAction(list[index].teacherId, 'UPDATE_CLASSROOM', 'Classroom', { id, updates });
  return list[index];
}

export function deleteClassroom(id: string): boolean {
  let list = getClassrooms();
  const target = list.find((c) => c.id === id);
  if (!target) return false;

  list = list.filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CLASSROOMS, list);

  // Remove corresponding roster items
  let roster = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  roster = roster.filter((r) => r.classroomId !== id);
  setItem(STORAGE_KEYS.ROSTER, roster);

  logAuditAction(target.teacherId, 'DELETE_CLASSROOM', 'Classroom', { id });
  return true;
}

// Roster Operations
export function getStudentRoster(classroomId: string): StudentRosterItem[] {
  seedInitialData();
  const all = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  return all.filter((r) => r.classroomId === classroomId);
}

export function addStudentToRoster(data: {
  classroomId: string;
  schoolNumber: string;
  firstName: string;
  lastName: string;
}): StudentRosterItem {
  const all = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  
  // Check for duplicate school number in classroom
  const duplicate = all.find(
    (r) => r.classroomId === data.classroomId && r.schoolNumber.trim() === data.schoolNumber.trim()
  );
  if (duplicate) {
    throw new Error(`Bu sınıfta "${data.schoolNumber}" numaralı öğrenci zaten kayıtlı.`);
  }

  const newItem: StudentRosterItem = {
    id: 'r-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    classroomId: data.classroomId,
    schoolNumber: data.schoolNumber.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  all.push(newItem);
  setItem(STORAGE_KEYS.ROSTER, all);

  // Update classroom count
  updateClassroomRosterCount(data.classroomId);

  return newItem;
}

export function removeStudentFromRoster(studentId: string): boolean {
  let all = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const target = all.find((r) => r.id === studentId);
  if (!target) return false;

  all = all.filter((r) => r.id !== studentId);
  setItem(STORAGE_KEYS.ROSTER, all);

  updateClassroomRosterCount(target.classroomId);
  return true;
}

function updateClassroomRosterCount(classroomId: string) {
  const classroom = getClassroomById(classroomId);
  if (classroom) {
    const roster = getStudentRoster(classroomId);
    updateClassroom(classroomId, {
      _count: {
        roster: roster.length,
        exams: classroom._count?.exams || 0,
      },
    });
  }
}

// Robust CSV Parser for Student Rosters
export function importRosterFromCSV(classroomId: string, csvText: string): CSVImportResult {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: CSVImportResult = {
    added: [],
    duplicates: [],
    errors: [],
  };

  if (lines.length === 0) {
    result.errors.push({ line: 0, message: 'CSV dosyası boş.' });
    return result;
  }

  // Header detection
  const header = lines[0].toLowerCase();
  const hasHeader =
    header.includes('okul') ||
    header.includes('numara') ||
    header.includes('ad') ||
    header.includes('soyad') ||
    header.includes('number');

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const lineNum = i + 1;
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());

    if (parts.length < 2) {
      result.errors.push({ line: lineNum, message: 'Yetersiz sütun sayısı (en az Okul No ve Ad gereklidir).' });
      continue;
    }

    const schoolNumber = parts[0];
    const firstName = parts[1];
    const lastName = parts[2] || '';

    if (!schoolNumber || !firstName) {
      result.errors.push({ line: lineNum, message: 'Okul Numarası veya Ad boş olamaz.' });
      continue;
    }

    try {
      const student = addStudentToRoster({
        classroomId,
        schoolNumber,
        firstName,
        lastName,
      });
      result.added.push(student);
    } catch (err: any) {
      result.duplicates.push(schoolNumber);
    }
  }

  return result;
}

// Student lookup by (Exam/Classroom + School Number)
export function validateStudentEntry(classroomId: string, schoolNumber: string): StudentRosterItem | null {
  const roster = getStudentRoster(classroomId);
  const found = roster.find((r) => r.schoolNumber.trim() === schoolNumber.trim());
  return found || null;
}

// =========================================================
// PHASE 2: EXAM MANAGEMENT & PUBLICATION SERVICE MODULE
// =========================================================

export function generateShortCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateUniqueShortCode(existingExams: Exam[]): string {
  let code = generateShortCode();
  let attempts = 0;
  while (existingExams.some((e) => e.shortCode === code) && attempts < 100) {
    code = generateShortCode();
    attempts++;
  }
  return code;
}

export function generatePublicToken(): string {
  return 'ex-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function generateUniquePublicToken(existingExams: Exam[]): string {
  let token = generatePublicToken();
  let attempts = 0;
  while (existingExams.some((e) => e.publicToken === token) && attempts < 100) {
    token = generatePublicToken();
    attempts++;
  }
  return token;
}

export function verifyExamOwnership(exam: Exam, userId: string, userRole?: Role): boolean {
  if (userRole === Role.ADMIN) return true;
  return exam.teacherId === userId;
}

export function getExams(filters?: {
  teacherId?: string;
  status?: ExamStatus | 'ALL';
  classroomId?: string;
  search?: string;
}): Exam[] {
  seedInitialData();
  let list = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];

  list = list.filter((e) => !e.deletedAt);

  if (filters?.teacherId) {
    list = list.filter((e) => e.teacherId === filters.teacherId);
  }

  if (filters?.classroomId) {
    list = list.filter((e) => e.classroomId === filters.classroomId);
  }

  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((e) => e.status === filters.status);
  } else if (!filters?.status) {
    list = list.filter((e) => e.status !== ExamStatus.ARCHIVED);
  }

  if (filters?.search) {
    const query = filters.search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.subject && e.subject.toLowerCase().includes(query)) ||
        (e.topic && e.topic.toLowerCase().includes(query)) ||
        (e.shortCode && e.shortCode.toLowerCase().includes(query))
    );
  }

  return list;
}

export function getExamById(id: string, requesterUserId?: string, requesterRole?: Role): Exam | null {
  seedInitialData();
  const list = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = list.find((e) => e.id === id && !e.deletedAt) || null;

  if (!exam) return null;

  if (requesterUserId && !verifyExamOwnership(exam, requesterUserId, requesterRole)) {
    throw new Error('Bu sınava erişim yetkiniz bulunmuyor.');
  }

  return exam;
}

export function getExamByToken(publicToken: string): Exam | null {
  seedInitialData();
  const list = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = list.find((e) => e.publicToken === publicToken && !e.deletedAt) || null;
  return exam;
}

export function getExamByShortCode(shortCode: string): Exam | null {
  seedInitialData();
  const list = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = list.find((e) => e.shortCode?.toUpperCase() === shortCode.trim().toUpperCase() && !e.deletedAt) || null;
  return exam;
}

export interface CreateExamPayload {
  classroomId: string;
  title: string;
  subject?: string;
  unit?: string;
  topic?: string;
  description?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  timeLimitMinutes?: number;
  allowResume?: boolean;
  allowMultipleSubmissions?: boolean;
  showFeedbackAfterApproval?: boolean;
  randomizeQuestionOrder?: boolean;
}

export function createExam(payload: CreateExamPayload, teacherId: string): Exam {
  seedInitialData();
  const classroom = getClassroomById(payload.classroomId);
  if (!classroom) {
    throw new Error('Seçilen sınıf bulunamadı.');
  }
  if (classroom.teacherId !== teacherId) {
    throw new Error('Sadece kendi sınıflarınız için sınav oluşturabilirsiniz.');
  }

  if (!payload.title || !payload.title.trim()) {
    throw new Error('Sınav başlığı zorunludur.');
  }

  const allExams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const publicToken = generateUniquePublicToken(allExams);
  const shortCode = generateUniqueShortCode(allExams);

  const newExam: Exam = {
    id: 'e-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    teacherId,
    classroomId: payload.classroomId,
    classroomName: classroom.name,
    title: payload.title.trim(),
    subject: payload.subject?.trim() || 'Fen Bilimleri',
    unit: payload.unit?.trim() || '',
    topic: payload.topic?.trim() || '',
    description: payload.description?.trim() || '',
    instructions: payload.instructions?.trim() || '',
    status: ExamStatus.DRAFT,
    publicToken,
    shortCode,
    startDate: payload.startDate || undefined,
    endDate: payload.endDate || undefined,
    timeLimitMinutes: payload.timeLimitMinutes ? Number(payload.timeLimitMinutes) : undefined,
    allowResume: payload.allowResume !== undefined ? payload.allowResume : true,
    allowMultipleSubmissions: payload.allowMultipleSubmissions !== undefined ? payload.allowMultipleSubmissions : false,
    showFeedbackAfterApproval: payload.showFeedbackAfterApproval !== undefined ? payload.showFeedbackAfterApproval : true,
    randomizeQuestionOrder: payload.randomizeQuestionOrder || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [],
    _count: { questions: 0, attempts: 0 },
  };

  allExams.push(newExam);
  setItem(STORAGE_KEYS.EXAMS, allExams);

  const updatedExamsCount = allExams.filter((e) => e.classroomId === payload.classroomId && !e.deletedAt).length;
  updateClassroom(payload.classroomId, {
    _count: {
      roster: classroom._count?.roster || 0,
      exams: updatedExamsCount,
    },
  });

  logAuditAction(teacherId, 'CREATE_EXAM', 'Exam', { examId: newExam.id, title: newExam.title });
  return newExam;
}

export function updateExam(id: string, updates: Partial<Exam>, teacherId: string, role?: Role): Exam {
  const allExams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const index = allExams.findIndex((e) => e.id === id && !e.deletedAt);
  if (index === -1) {
    throw new Error('Sınav bulunamadı.');
  }

  const current = allExams[index];
  if (!verifyExamOwnership(current, teacherId, role)) {
    throw new Error('Bu sınavı güncelleme yetkiniz yok.');
  }

  const isStatusOnlyChange = Object.keys(updates).every((k) =>
    ['status', 'publishedAt', 'closedAt', 'archivedAt', 'updatedAt', 'questions', '_count', 'publicToken', 'shortCode'].includes(k)
  );
  if (current.status !== ExamStatus.DRAFT && !isStatusOnlyChange) {
    throw new Error('Yayındaki veya kapalı sınavlar doğrudan değiştirilemez. Lütfen sınavı kopyalayarak yeni bir versiyon oluşturunuz.');
  }

  let classroomName = current.classroomName;
  if (updates.classroomId && updates.classroomId !== current.classroomId) {
    const classroom = getClassroomById(updates.classroomId);
    if (!classroom || (classroom.teacherId !== teacherId && role !== Role.ADMIN)) {
      throw new Error('Geçersiz sınıf seçimi.');
    }
    classroomName = classroom.name;
  }

  allExams[index] = {
    ...current,
    ...updates,
    classroomName,
    updatedAt: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.EXAMS, allExams);
  logAuditAction(teacherId, 'UPDATE_EXAM', 'Exam', { id, updates });
  return allExams[index];
}

export function addQuestion(
  examId: string,
  questionPayload: Partial<Question>,
  teacherId: string
): Question {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Yayındaki sınavlara yeni soru eklenemez. Lütfen kopyasını oluşturunuz.');
  }

  const existingQuestions = exam.questions || [];
  const newQuestion: Question = {
    id: 'q-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    examId,
    questionOrder: existingQuestions.length + 1,
    title: questionPayload.title?.trim() || `Soru ${existingQuestions.length + 1}`,
    questionText: questionPayload.questionText?.trim() || '',
    imageUrl: questionPayload.imageUrl || undefined,
    questionImages: questionPayload.questionImages || [],
    sourceInfo: questionPayload.sourceInfo?.trim() || '',
    sourceDetails: questionPayload.sourceDetails?.trim() || '',
    teacherNotes: questionPayload.teacherNotes?.trim() || '',
    questionType: questionPayload.questionType || 'OPEN_ENDED',
    multipleChoiceOpts: questionPayload.multipleChoiceOpts || [],
    correctAnswer: questionPayload.correctAnswer?.trim() || '',
    learningOutcome: questionPayload.learningOutcome?.trim() || '',
    maximumScore: questionPayload.maximumScore || 100,
    allowedResponseModes:
      questionPayload.allowedResponseModes && questionPayload.allowedResponseModes.length > 0
        ? questionPayload.allowedResponseModes
        : [ResponseMode.DIRECT_TEXT, ResponseMode.HANDWRITTEN_IMAGE, ResponseMode.AUDIO_EXPLANATION, ResponseMode.MULTIMODAL],
    targetedSkills: questionPayload.targetedSkills || [],
    argumentationRequired: questionPayload.argumentationRequired || false,
    expectedConcepts: questionPayload.expectedConcepts || [],
    misconceptions: questionPayload.misconceptions || [],
    rubrics: questionPayload.rubrics || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedQuestions = [...existingQuestions, newQuestion];
  updateExam(
    examId,
    { questions: updatedQuestions, _count: { questions: updatedQuestions.length, attempts: exam._count?.attempts || 0 } },
    teacherId
  );

  logAuditAction(teacherId, 'ADD_QUESTION', 'Question', { examId, questionId: newQuestion.id });
  return newQuestion;
}

export function updateQuestion(
  examId: string,
  questionId: string,
  updates: Partial<Question>,
  teacherId: string
): Question {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Yayındaki sınavların soruları değiştirilemez.');
  }

  const questions = exam.questions || [];
  const qIndex = questions.findIndex((q) => q.id === questionId);
  if (qIndex === -1) throw new Error('Soru bulunamadı.');

  questions[qIndex] = {
    ...questions[qIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  updateExam(examId, { questions }, teacherId);
  logAuditAction(teacherId, 'UPDATE_QUESTION', 'Question', { examId, questionId });
  return questions[qIndex];
}

export function reorderQuestions(examId: string, questionIds: string[], teacherId: string): Question[] {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Yayındaki sınavların soru sırası değiştirilemez.');
  }

  const currentQuestions = exam.questions || [];
  const reordered: Question[] = [];

  questionIds.forEach((qId, idx) => {
    const q = currentQuestions.find((item) => item.id === qId);
    if (q) {
      reordered.push({
        ...q,
        questionOrder: idx + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  updateExam(examId, { questions: reordered }, teacherId);
  logAuditAction(teacherId, 'REORDER_QUESTIONS', 'Question', { examId, newOrder: questionIds });
  return reordered;
}

export function deleteQuestion(examId: string, questionId: string, teacherId: string): boolean {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Yayındaki sınavdan soru silinemez.');
  }

  const questions = exam.questions || [];
  const filtered = questions.filter((q) => q.id !== questionId);

  const reindexed = filtered.map((q, idx) => ({ ...q, questionOrder: idx + 1 }));

  updateExam(
    examId,
    { questions: reindexed, _count: { questions: reindexed.length, attempts: exam._count?.attempts || 0 } },
    teacherId
  );
  logAuditAction(teacherId, 'DELETE_QUESTION', 'Question', { examId, questionId });
  return true;
}

export interface PublicationValidationError {
  category: 'settings' | 'question' | 'classroom';
  questionIndex?: number;
  field?: string;
  message: string;
}

export function validateExamForPublication(
  examId: string,
  teacherId: string
): {
  valid: boolean;
  errors: PublicationValidationError[];
} {
  const exam = getExamById(examId, teacherId);
  const errors: PublicationValidationError[] = [];

  if (!exam) {
    return { valid: false, errors: [{ category: 'settings', message: 'Sınav bulunamadı.' }] };
  }

  if (!exam.title || !exam.title.trim()) {
    errors.push({ category: 'settings', field: 'title', message: 'Sınav başlığı boş olamaz.' });
  }

  if (!exam.classroomId) {
    errors.push({ category: 'settings', field: 'classroomId', message: 'Sınava bir sınıf atanmalıdır.' });
  } else {
    const classroom = getClassroomById(exam.classroomId);
    if (!classroom) {
      errors.push({ category: 'classroom', field: 'classroomId', message: 'Atanan sınıf bulunamadı.' });
    } else {
      if (classroom.teacherId !== teacherId) {
        errors.push({ category: 'classroom', field: 'classroomId', message: 'Bu sınıfın yetkili öğretmeni değilsiniz.' });
      }
      const roster = getStudentRoster(exam.classroomId);
      if (roster.length === 0) {
        errors.push({ category: 'classroom', field: 'roster', message: 'Seçilen sınıfta kayıtlı en az 1 öğrenci bulunmalıdır.' });
      }
    }
  }

  const questions = exam.questions || [];
  if (questions.length === 0) {
    errors.push({ category: 'question', message: 'Sınav yayınlanmak için en az 1 soru içermelidir.' });
  }

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const hasPromptText = q.questionText && q.questionText.trim().length > 0;
    const hasImage = (q.imageUrl && q.imageUrl.trim().length > 0) || (q.questionImages && q.questionImages.length > 0);

    if (!hasPromptText && !hasImage) {
      errors.push({
        category: 'question',
        questionIndex: qNum,
        field: 'questionText',
        message: `Soru ${qNum}: Soru metni veya soru görseli girilmelidir.`,
      });
    }

    if (!q.allowedResponseModes || q.allowedResponseModes.length === 0) {
      errors.push({
        category: 'question',
        questionIndex: qNum,
        field: 'allowedResponseModes',
        message: `Soru ${qNum}: En az bir öğrenci cevap biçimi seçilmelidir.`,
      });
    }
  });

  if (exam.startDate && exam.endDate) {
    const start = new Date(exam.startDate).getTime();
    const end = new Date(exam.endDate).getTime();
    if (end <= start) {
      errors.push({ category: 'settings', field: 'endDate', message: 'Sınav bitiş tarihi, başlangıç tarihinden sonra olmalıdır.' });
    }
  }

  if (exam.timeLimitMinutes !== undefined && exam.timeLimitMinutes !== null && exam.timeLimitMinutes <= 0) {
    errors.push({ category: 'settings', field: 'timeLimitMinutes', message: 'Sınav süresi pozitif bir sayı olmalıdır.' });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function publishExam(examId: string, teacherId: string): Exam {
  const validation = validateExamForPublication(examId, teacherId);
  if (!validation.valid) {
    const msg = validation.errors.map((e) => e.message).join(' | ');
    throw new Error(`Sınav yayınlama koşulları sağlanmadı: ${msg}`);
  }

  const updated = updateExam(
    examId,
    {
      status: ExamStatus.PUBLISHED,
      publishedAt: new Date().toISOString(),
    },
    teacherId
  );

  logAuditAction(teacherId, 'PUBLISH_EXAM', 'Exam', { examId, publicToken: updated.publicToken, shortCode: updated.shortCode });
  return updated;
}

export function unpublishExam(examId: string, teacherId: string): Exam {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam._count?.attempts && exam._count.attempts > 0) {
    throw new Error('Öğrenci yanıtı/girişi olan sınavlar taslağa çekilemez. Sınavı kapatabilirsiniz.');
  }

  const updated = updateExam(
    examId,
    {
      status: ExamStatus.DRAFT,
    },
    teacherId
  );

  logAuditAction(teacherId, 'UNPUBLISH_EXAM', 'Exam', { examId });
  return updated;
}

export function closeExam(examId: string, teacherId: string): Exam {
  const updated = updateExam(
    examId,
    {
      status: ExamStatus.CLOSED,
      closedAt: new Date().toISOString(),
    },
    teacherId
  );

  logAuditAction(teacherId, 'CLOSE_EXAM', 'Exam', { examId });
  return updated;
}

export function archiveExam(examId: string, teacherId: string): Exam {
  const updated = updateExam(
    examId,
    {
      status: ExamStatus.ARCHIVED,
      archivedAt: new Date().toISOString(),
    },
    teacherId
  );

  logAuditAction(teacherId, 'ARCHIVE_EXAM', 'Exam', { examId });
  return updated;
}

export function restoreExam(examId: string, teacherId: string): Exam {
  const updated = updateExam(
    examId,
    {
      status: ExamStatus.DRAFT,
    },
    teacherId
  );

  logAuditAction(teacherId, 'RESTORE_EXAM', 'Exam', { examId });
  return updated;
}

export function deleteDraftExam(examId: string, teacherId: string): boolean {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  if (exam.status !== ExamStatus.DRAFT) {
    throw new Error('Sadece taslak sınavlar silinebilir.');
  }

  updateExam(examId, { deletedAt: new Date().toISOString() }, teacherId);

  const allExams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const remaining = allExams.filter((e) => e.classroomId === exam.classroomId && !e.deletedAt).length;
  const classroom = getClassroomById(exam.classroomId);
  if (classroom) {
    updateClassroom(exam.classroomId, {
      _count: { roster: classroom._count?.roster || 0, exams: remaining },
    });
  }

  logAuditAction(teacherId, 'DELETE_DRAFT_EXAM', 'Exam', { examId });
  return true;
}

export function rotateExamToken(examId: string, teacherId: string): Exam {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı.');

  const allExams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const newPublicToken = generateUniquePublicToken(allExams);
  const newShortCode = generateUniqueShortCode(allExams);

  const updated = updateExam(
    examId,
    {
      publicToken: newPublicToken,
      shortCode: newShortCode,
    },
    teacherId
  );

  logAuditAction(teacherId, 'ROTATE_EXAM_TOKEN', 'Exam', { examId, newPublicToken, newShortCode });
  return updated;
}

export function revokeExamToken(examId: string, teacherId: string): Exam {
  const updated = closeExam(examId, teacherId);
  logAuditAction(teacherId, 'REVOKE_EXAM_TOKEN', 'Exam', { examId });
  return updated;
}

export function duplicateExam(examId: string, teacherId: string): Exam {
  seedInitialData();
  const source = getExamById(examId, teacherId);
  if (!source) throw new Error('Kopyalanacak sınav bulunamadı veya yetkiniz yok.');

  const allExams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const newPublicToken = generateUniquePublicToken(allExams);
  const newShortCode = generateUniqueShortCode(allExams);

  const copiedQuestions: Question[] = (source.questions || []).map((q, idx) => ({
    ...q,
    id: 'q-' + Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 1000),
    examId: '',
    questionOrder: idx + 1,
    questionImages: (q.questionImages || []).map((img, iIdx) => ({
      ...img,
      id: 'img-' + Date.now() + '-' + iIdx,
    })),
    expectedConcepts: (q.expectedConcepts || []).map((ec, cIdx) => ({
      ...ec,
      id: 'ec-' + Date.now() + '-' + cIdx,
    })),
    misconceptions: (q.misconceptions || []).map((mc, mIdx) => ({
      ...mc,
      id: 'mc-' + Date.now() + '-' + mIdx,
    })),
    rubrics: (q.rubrics || []).map((rub, rIdx) => ({
      ...rub,
      id: 'rub-' + Date.now() + '-' + rIdx,
    })),
  }));

  const newExamId = 'e-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  copiedQuestions.forEach((q) => {
    q.examId = newExamId;
    if (q.questionImages) q.questionImages.forEach((img) => (img.questionId = q.id));
    if (q.expectedConcepts) q.expectedConcepts.forEach((ec) => (ec.questionId = q.id));
    if (q.misconceptions) q.misconceptions.forEach((mc) => (mc.questionId = q.id));
    if (q.rubrics) q.rubrics.forEach((rub) => (rub.questionId = q.id));
  });

  const duplicate: Exam = {
    ...source,
    id: newExamId,
    teacherId,
    title: `${source.title} — Kopya`,
    status: ExamStatus.DRAFT,
    publicToken: newPublicToken,
    shortCode: newShortCode,
    publishedAt: undefined,
    closedAt: undefined,
    archivedAt: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: undefined,
    questions: copiedQuestions,
    _count: {
      questions: copiedQuestions.length,
      attempts: 0,
    },
  };

  allExams.push(duplicate);
  setItem(STORAGE_KEYS.EXAMS, allExams);

  const classroom = getClassroomById(source.classroomId);
  if (classroom) {
    const count = allExams.filter((e) => e.classroomId === source.classroomId && !e.deletedAt).length;
    updateClassroom(source.classroomId, {
      _count: { roster: classroom._count?.roster || 0, exams: count },
    });
  }

  logAuditAction(teacherId, 'DUPLICATE_EXAM', 'Exam', { sourceId: examId, newExamId });
  return duplicate;
}

// Audit Logging
export function logAuditAction(userId: string | null, action: string, resource: string, details?: Record<string, unknown>) {
  const logs = getItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS) || [];
  const logItem: AuditLogItem = {
    id: 'log-' + Date.now(),
    userId: userId || undefined,
    action,
    resource,
    details,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(logItem);
  setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // Keep last 100 logs
}

export function getAuditLogs(): AuditLogItem[] {
  seedInitialData();
  return getItem<AuditLogItem[]>(STORAGE_KEYS.AUDIT_LOGS) || [];
}

// =========================================================
// PHASE 3: PUBLIC STUDENT EXAM FLOW & SUBMISSION SERVICES
// =========================================================

// Rate Limiting Helper
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {};
export function isRateLimited(key: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore[key];
  if (!record || now > record.resetAt) {
    rateLimitStore[key] = { count: 1, resetAt: now + windowMs };
    return false;
  }
  record.count++;
  return record.count > maxAttempts;
}

export interface PublicExamAvailabilityResult {
  status: 'available' | 'not_started' | 'ended' | 'closed' | 'invalid';
  message: string;
  exam?: Exam;
  startDate?: string;
  endDate?: string;
}

export function validatePublicExamAvailability(tokenOrShortCode: string): PublicExamAvailabilityResult {
  let exam = getExamByToken(tokenOrShortCode);
  if (!exam) {
    exam = getExamByShortCode(tokenOrShortCode);
  }

  if (!exam || exam.deletedAt) {
    return { status: 'invalid', message: 'Girdiğiniz bağlantıya veya koda ait sınav bulunamadı.' };
  }

  if (exam.status === ExamStatus.DRAFT || exam.status === ExamStatus.ARCHIVED) {
    return { status: 'invalid', message: 'Sınav bağlantısı henüz aktif değil veya taslak durumunda.' };
  }

  if (exam.status === ExamStatus.CLOSED) {
    return { status: 'closed', message: 'Bu sınav kapatıldı.' };
  }

  const now = Date.now();
  if (exam.startDate && new Date(exam.startDate).getTime() > now) {
    return {
      status: 'not_started',
      message: 'Sınav henüz başlamadı.',
      startDate: exam.startDate,
      exam,
    };
  }

  if (exam.endDate && new Date(exam.endDate).getTime() < now) {
    return {
      status: 'ended',
      message: 'Sınav süresi doldu ve erişime kapatıldı.',
      endDate: exam.endDate,
      exam,
    };
  }

  return {
    status: 'available',
    message: 'Sınav şu anda erişilebilir.',
    exam,
  };
}

export function createOrResumeAttempt(
  examId: string,
  schoolNumber: string,
  clientInfo?: { clientFingerprint?: string }
): ExamAttempt {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === examId && !e.deletedAt);

  if (!exam) {
    throw new Error('Sınav bulunamadı.');
  }

  const availability = validatePublicExamAvailability(exam.publicToken);
  if (availability.status !== 'available') {
    throw new Error(availability.message);
  }

  // Rate Limiter Check for school number validation
  const rateLimitKey = `entry_${examId}_${schoolNumber.trim()}`;
  if (isRateLimited(rateLimitKey, 15, 60000)) {
    throw new Error('Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyiniz.');
  }

  // Validate student roster number
  const student = validateStudentEntry(exam.classroomId, schoolNumber);
  if (!student) {
    // Generic privacy-preserving error message as requested in section 11
    throw new Error('Girilen bilgiler doğrulanamadı veya bu sınava erişim uygun değil.');
  }

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const existingAttempt = attempts.find(
    (a) => a.examId === examId && a.studentRosterId === student.id && !a.deletedAt
  );

  if (existingAttempt) {
    if (existingAttempt.status === AttemptStatus.SUBMITTED) {
      if (!exam.allowMultipleSubmissions) {
        throw new Error('Bu sınava katılımınız daha önce tamamlanmıştır.');
      }
    } else if (existingAttempt.status === AttemptStatus.EXPIRED || existingAttempt.status === AttemptStatus.INVALIDATED) {
      throw new Error('Sınav süreniz dolmuş veya oturumunuz sonlandırılmıştır.');
    } else if (existingAttempt.status === AttemptStatus.IN_PROGRESS || existingAttempt.status === AttemptStatus.DRAFT) {
      if (exam.allowResume) {
        existingAttempt.lastActivityAt = new Date().toISOString();
        setItem(STORAGE_KEYS.ATTEMPTS, attempts);
        logAttemptEvent(existingAttempt.id, 'ATTEMPT_RESUMED', { schoolNumber: student.schoolNumber });
        return {
          ...existingAttempt,
          studentRoster: student,
        };
      } else {
        throw new Error('Bu sınavda yarım kalan oturuma devam etme izni verilmemiştir.');
      }
    }
  }

  // Create new ExamAttempt
  const now = new Date();
  const timeLimitExpiresAt = exam.timeLimitMinutes
    ? new Date(now.getTime() + exam.timeLimitMinutes * 60 * 1000).toISOString()
    : undefined;

  const newAttempt: ExamAttempt = {
    id: 'att-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    examId,
    studentRosterId: student.id,
    attemptToken: 'tok-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9),
    status: AttemptStatus.IN_PROGRESS,
    startedAt: now.toISOString(),
    lastActivityAt: now.toISOString(),
    currentQuestionIndex: 0,
    currentQuestionId: exam.questions?.[0]?.id,
    timeLimitStartedAt: exam.timeLimitMinutes ? now.toISOString() : undefined,
    timeLimitExpiresAt,
    clientFingerprintHash: clientInfo?.clientFingerprint,
    resumeAllowed: exam.allowResume,
    submissionVersion: 1,
    timeSpentSec: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    studentRoster: student,
  };

  attempts.push(newAttempt);
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);

  // Increment attempt counter on exam
  exam._count = {
    questions: exam.questions?.length || 0,
    attempts: (exam._count?.attempts || 0) + 1,
  };
  setItem(STORAGE_KEYS.EXAMS, exams);

  logAttemptEvent(newAttempt.id, 'ATTEMPT_STARTED', { schoolNumber: student.schoolNumber });
  return newAttempt;
}

export function getAttemptByToken(attemptToken: string): ExamAttempt | null {
  seedInitialData();
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const found = attempts.find((a) => (a.attemptToken === attemptToken || a.id === attemptToken) && !a.deletedAt);
  if (!found) return null;

  const roster = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const student = roster.find((r) => r.id === found.studentRosterId);
  return {
    ...found,
    studentRoster: student || undefined,
  };
}

export function getStudentResponsesForAttempt(attemptId: string): StudentResponse[] {
  seedInitialData();
  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  return allResponses.filter((r) => r.attemptId === attemptId && !r.deletedAt);
}

export function saveTextResponse(attemptId: string, questionId: string, content: string): StudentResponse {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Sınav oturumu bulunamadı.');

  const attempt = attempts[attemptIndex];
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error('Bu sınav oturumu aktif değil veya teslim edilmiştir.');
  }

  // Check Timer Expiry
  if (attempt.timeLimitExpiresAt && new Date(attempt.timeLimitExpiresAt).getTime() < Date.now()) {
    attempt.status = AttemptStatus.EXPIRED;
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    logAttemptEvent(attemptId, 'TIME_EXPIRED');
    throw new Error('Süreniz doldu.');
  }

  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  let response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  const now = new Date().toISOString();
  // Sanitize content (strip potential script tags while preserving text formatting)
  const sanitizedContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  const textComponent: TextResponseComponent = {
    id: response?.textResponse?.id || 'txt-' + Date.now(),
    studentResponseId: response?.id || 'res-' + Date.now(),
    content: sanitizedContent,
    characterCount: sanitizedContent.length,
    createdAt: response?.textResponse?.createdAt || now,
    updatedAt: now,
  };

  if (!response) {
    response = {
      id: textComponent.studentResponseId,
      attemptId,
      questionId,
      status: sanitizedContent.trim().length > 0 ? ResponseStatus.ANSWERED : ResponseStatus.EMPTY,
      textResponse: textComponent,
      imageResponses: [],
      firstSavedAt: now,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    allResponses.push(response);
  } else {
    response.textResponse = textComponent;
    response.lastSavedAt = now;
    response.updatedAt = now;
    const hasMedia = (response.imageResponses && response.imageResponses.length > 0) || Boolean(response.audioResponse);
    response.status = (sanitizedContent.trim().length > 0 || hasMedia) ? ResponseStatus.ANSWERED : ResponseStatus.EMPTY;
  }

  setItem(STORAGE_KEYS.RESPONSES, allResponses);

  attempt.lastActivityAt = now;
  attempts[attemptIndex] = attempt;
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);

  logAttemptEvent(attemptId, 'TEXT_SAVED', { questionId, characterCount: sanitizedContent.length });
  return response;
}

export function addImageResponse(
  attemptId: string,
  questionId: string,
  imageData: { url: string; originalFilename?: string; mimeType?: string; fileSize?: number; width?: number; height?: number }
): StudentResponse {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Sınav oturumu bulunamadı.');

  const attempt = attempts[attemptIndex];
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error('Bu sınav oturumu aktif değil veya teslim edilmiştir.');
  }

  if (attempt.timeLimitExpiresAt && new Date(attempt.timeLimitExpiresAt).getTime() < Date.now()) {
    attempt.status = AttemptStatus.EXPIRED;
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    logAttemptEvent(attemptId, 'TIME_EXPIRED');
    throw new Error('Süreniz doldu.');
  }

  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  let response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  const now = new Date().toISOString();
  const respId = response?.id || 'res-' + Date.now();
  const currentImages = response?.imageResponses || [];

  // Privacy-safe random UUID path structure
  const storagePath = `student-responses/${attempt.examId}/${attemptId}/${questionId}/images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;

  const newImageComp: ImageResponseComponent = {
    id: 'img-comp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    studentResponseId: respId,
    storagePath,
    originalFilename: imageData.originalFilename || 'el_yazisi_yanit.jpg',
    mimeType: imageData.mimeType || 'image/jpeg',
    fileSize: imageData.fileSize || 0,
    width: imageData.width,
    height: imageData.height,
    order: currentImages.length + 1,
    uploadStatus: UploadStatus.READY,
    url: imageData.url,
    createdAt: now,
    updatedAt: now,
  };

  if (!response) {
    response = {
      id: respId,
      attemptId,
      questionId,
      status: ResponseStatus.ANSWERED,
      imageResponses: [newImageComp],
      firstSavedAt: now,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    allResponses.push(response);
  } else {
    response.imageResponses = [...currentImages, newImageComp];
    response.status = ResponseStatus.ANSWERED;
    response.lastSavedAt = now;
    response.updatedAt = now;
  }

  setItem(STORAGE_KEYS.RESPONSES, allResponses);

  attempt.lastActivityAt = now;
  attempts[attemptIndex] = attempt;
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);

  logAttemptEvent(attemptId, 'IMAGE_UPLOADED', { questionId, imageId: newImageComp.id });
  return response;
}

export function deleteImageResponse(attemptId: string, questionId: string, imageId: string): StudentResponse {
  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  if (!response || !response.imageResponses) {
    throw new Error('Silinecek görsel bulunamadı.');
  }

  const updatedImages = response.imageResponses.filter((img) => img.id !== imageId);
  response.imageResponses = updatedImages;
  response.updatedAt = new Date().toISOString();

  const hasText = Boolean(response.textResponse?.content?.trim());
  const hasAudio = Boolean(response.audioResponse);
  response.status = (hasText || updatedImages.length > 0 || hasAudio) ? ResponseStatus.ANSWERED : ResponseStatus.EMPTY;

  setItem(STORAGE_KEYS.RESPONSES, allResponses);
  logAttemptEvent(attemptId, 'IMAGE_DELETED', { questionId, imageId });
  return response;
}

export function reorderImageResponses(attemptId: string, questionId: string, imageIds: string[]): StudentResponse {
  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  if (!response || !response.imageResponses) {
    throw new Error('Yeniden sıralanacak görseller bulunamadı.');
  }

  const reordered: ImageResponseComponent[] = [];
  imageIds.forEach((id, idx) => {
    const found = response.imageResponses?.find((img) => img.id === id);
    if (found) {
      reordered.push({ ...found, order: idx + 1 });
    }
  });

  response.imageResponses = reordered;
  response.updatedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.RESPONSES, allResponses);
  return response;
}

export function saveAudioResponse(
  attemptId: string,
  questionId: string,
  audioData: { url: string; durationSeconds?: number; originalFilename?: string; mimeType?: string; fileSize?: number }
): StudentResponse {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attemptIndex = attempts.findIndex((a) => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Sınav oturumu bulunamadı.');

  const attempt = attempts[attemptIndex];
  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error('Bu sınav oturumu aktif değil veya teslim edilmiştir.');
  }

  if (attempt.timeLimitExpiresAt && new Date(attempt.timeLimitExpiresAt).getTime() < Date.now()) {
    attempt.status = AttemptStatus.EXPIRED;
    setItem(STORAGE_KEYS.ATTEMPTS, attempts);
    logAttemptEvent(attemptId, 'TIME_EXPIRED');
    throw new Error('Süreniz doldu.');
  }

  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  let response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  const now = new Date().toISOString();
  const respId = response?.id || 'res-' + Date.now();
  const storagePath = `student-responses/${attempt.examId}/${attemptId}/${questionId}/audio/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webm`;

  const audioComp: AudioResponseComponent = {
    id: 'aud-comp-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    studentResponseId: respId,
    storagePath,
    originalFilename: audioData.originalFilename || 'sesli_anlatim.webm',
    mimeType: audioData.mimeType || 'audio/webm',
    fileSize: audioData.fileSize || 0,
    durationSeconds: audioData.durationSeconds || 0,
    uploadStatus: UploadStatus.READY,
    url: audioData.url,
    createdAt: now,
    updatedAt: now,
  };

  if (!response) {
    response = {
      id: respId,
      attemptId,
      questionId,
      status: ResponseStatus.ANSWERED,
      audioResponse: audioComp,
      firstSavedAt: now,
      lastSavedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    allResponses.push(response);
  } else {
    response.audioResponse = audioComp;
    response.status = ResponseStatus.ANSWERED;
    response.lastSavedAt = now;
    response.updatedAt = now;
  }

  setItem(STORAGE_KEYS.RESPONSES, allResponses);

  attempt.lastActivityAt = now;
  attempts[attemptIndex] = attempt;
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);

  logAttemptEvent(attemptId, 'AUDIO_UPLOADED', { questionId, duration: audioData.durationSeconds });
  return response;
}

export function deleteAudioResponse(attemptId: string, questionId: string): StudentResponse {
  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const response = allResponses.find((r) => r.attemptId === attemptId && r.questionId === questionId && !r.deletedAt);

  if (!response || !response.audioResponse) {
    throw new Error('Silinecek ses kaydı bulunamadı.');
  }

  response.audioResponse = undefined;
  response.updatedAt = new Date().toISOString();

  const hasText = Boolean(response.textResponse?.content?.trim());
  const hasImages = Boolean(response.imageResponses && response.imageResponses.length > 0);
  response.status = (hasText || hasImages) ? ResponseStatus.ANSWERED : ResponseStatus.EMPTY;

  setItem(STORAGE_KEYS.RESPONSES, allResponses);
  logAttemptEvent(attemptId, 'AUDIO_DELETED', { questionId });
  return response;
}

export function updateCurrentQuestionIndex(attemptId: string, questionIndex: number, questionId: string): ExamAttempt {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const index = attempts.findIndex((a) => a.id === attemptId);
  if (index === -1) throw new Error('Sınav oturumu bulunamadı.');

  attempts[index] = {
    ...attempts[index],
    currentQuestionIndex: questionIndex,
    currentQuestionId: questionId,
    lastActivityAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  setItem(STORAGE_KEYS.ATTEMPTS, attempts);
  logAttemptEvent(attemptId, 'QUESTION_VIEWED', { questionIndex, questionId });
  return attempts[index];
}

export function validateAttemptForSubmission(attemptId: string): {
  valid: boolean;
  errors: Array<{ questionIndex: number; message: string }>;
  answeredCount: number;
  totalCount: number;
} {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attempt = attempts.find((a) => a.id === attemptId);
  if (!attempt) return { valid: false, errors: [{ questionIndex: 0, message: 'Sınav oturumu bulunamadı.' }], answeredCount: 0, totalCount: 0 };

  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  const exam = exams.find((e) => e.id === attempt.examId);
  if (!exam || !exam.questions) return { valid: false, errors: [{ questionIndex: 0, message: 'Sınav soruları yüklenemedi.' }], answeredCount: 0, totalCount: 0 };

  const responses = getStudentResponsesForAttempt(attemptId);
  const errors: Array<{ questionIndex: number; message: string }> = [];
  let answeredCount = 0;

  exam.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const resp = responses.find((r) => r.questionId === q.id);
    const hasText = Boolean(resp?.textResponse?.content?.trim());
    const hasImages = Boolean(resp?.imageResponses && resp.imageResponses.length > 0);
    const hasAudio = Boolean(resp?.audioResponse);
    const isAnswered = hasText || hasImages || hasAudio;

    if (isAnswered) {
      answeredCount++;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    answeredCount,
    totalCount: exam.questions.length,
  };
}

export function submitAttempt(attemptId: string): ExamAttempt {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const index = attempts.findIndex((a) => a.id === attemptId);
  if (index === -1) throw new Error('Sınav oturumu bulunamadı.');

  const attempt = attempts[index];
  if (attempt.status === AttemptStatus.SUBMITTED) {
    // Idempotent submission: if already submitted, return attempt as is
    return attempt;
  }

  const now = new Date().toISOString();
  attempt.status = AttemptStatus.SUBMITTED;
  attempt.submittedAt = now;
  attempt.lastActivityAt = now;
  attempt.submissionVersion = (attempt.submissionVersion || 1) + 1;
  attempt.updatedAt = now;

  // Mark all responses as SUBMITTED
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  responses.forEach((r) => {
    if (r.attemptId === attemptId) {
      r.status = ResponseStatus.SUBMITTED;
      r.submittedAt = now;
      r.updatedAt = now;
    }
  });
  setItem(STORAGE_KEYS.RESPONSES, responses);

  attempts[index] = attempt;
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);

  logAttemptEvent(attemptId, 'SUBMITTED', { submittedAt: now });

  // Trigger Phase 4 automated processing for submitted responses
  import('./processingPipeline').then(({ processAttemptResponses }) => {
    processAttemptResponses(attemptId).catch((e) =>
      console.warn('Background response processing failed:', e)
    );
  });

  return attempt;
}

export function getAIAnalysisForResponse(responseId: string) {
  const analyses = getItem<any[]>('dusunceizi_ai_analyses') || [];
  return analyses.filter((a) => a.studentResponseId === responseId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
}

export function getTeacherReviewForResponse(responseId: string) {
  const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
  return reviews.find((r) => r.studentResponseId === responseId) || null;
}

export function getOCRResultForResponse(responseId: string) {
  const ocrList = getItem<any[]>('dusunceizi_ocr_results') || [];
  return ocrList.find((o) => o.studentResponseId === responseId) || null;
}

export function getTranscriptionForResponse(responseId: string) {
  const transList = getItem<any[]>('dusunceizi_transcriptions') || [];
  return transList.find((t) => t.studentResponseId === responseId) || null;
}

export function getVisualAnalysisForResponse(responseId: string) {
  const visualList = getItem<any[]>('dusunceizi_visual_analyses') || [];
  return visualList.find((v) => v.studentResponseId === responseId) || null;
}

export function updateCorrectedOCRText(responseId: string, correctedText: string) {
  const ocrList = getItem<any[]>('dusunceizi_ocr_results') || [];
  const item = ocrList.find((o) => o.studentResponseId === responseId);
  if (item) {
    item.correctedText = correctedText;
    setItem('dusunceizi_ocr_results', ocrList);
  }
}

export function updateCorrectedTranscriptText(responseId: string, correctedText: string) {
  const transList = getItem<any[]>('dusunceizi_transcriptions') || [];
  const item = transList.find((t) => t.studentResponseId === responseId);
  if (item) {
    item.correctedText = correctedText;
    setItem('dusunceizi_transcriptions', transList);
  }
}

export function approveTeacherReview(reviewId: string, teacherId: string) {
  const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index !== -1) {
    reviews[index].approved = true;
    reviews[index].status = 'APPROVED';
    reviews[index].reviewedAt = new Date().toISOString();
    reviews[index].teacherId = teacherId;
    setItem('dusunceizi_teacher_reviews', reviews);

    // Record agreement
    const agreements = getItem<any[]>('dusunceizi_agreements') || [];
    agreements.push({
      id: `agr-${Date.now()}`,
      teacherReviewId: reviewId,
      conceptualLevelDelta: 0,
      misconceptionsApproved: [],
      misconceptionsRejected: [],
      fieldsChangedCount: 0,
      approvedWithoutChanges: true,
      ocrCorrected: false,
      transcriptCorrected: false,
      createdAt: new Date().toISOString(),
    });
    setItem('dusunceizi_agreements', agreements);
  }
}

export function updateTeacherReviewWithEdits(
  reviewId: string,
  teacherId: string,
  editedJson: any,
  correctionReason?: string
) {
  const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index !== -1) {
    reviews[index].approved = false;
    reviews[index].status = 'APPROVED_WITH_CHANGES';
    reviews[index].editedJson = editedJson;
    reviews[index].correctionReason = correctionReason || 'Öğretmen düzenlemesi uygulandı.';
    reviews[index].reviewedAt = new Date().toISOString();
    reviews[index].teacherId = teacherId;
    setItem('dusunceizi_teacher_reviews', reviews);

    const agreements = getItem<any[]>('dusunceizi_agreements') || [];
    agreements.push({
      id: `agr-${Date.now()}`,
      teacherReviewId: reviewId,
      conceptualLevelDelta: 0,
      misconceptionsApproved: [],
      misconceptionsRejected: [],
      fieldsChangedCount: 2,
      approvedWithoutChanges: false,
      ocrCorrected: false,
      transcriptCorrected: false,
      createdAt: new Date().toISOString(),
    });
    setItem('dusunceizi_agreements', agreements);
  }
}

export function rejectTeacherReview(reviewId: string, teacherId: string, reason: string) {
  const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
  const index = reviews.findIndex((r) => r.id === reviewId);
  if (index !== -1) {
    reviews[index].approved = false;
    reviews[index].status = 'REJECTED';
    reviews[index].correctionReason = reason;
    reviews[index].reviewedAt = new Date().toISOString();
    reviews[index].teacherId = teacherId;
    setItem('dusunceizi_teacher_reviews', reviews);
  }
}

export function getTeacherReviewQueue(teacherId: string, filterStatus: string = 'all') {
  const reviews = getItem<any[]>('dusunceizi_teacher_reviews') || [];
  const responses = getItem<StudentResponse[]>('dusunceizi_responses') || [];
  const attempts = getItem<ExamAttempt[]>('dusunceizi_attempts') || [];
  const exams = getItem<Exam[]>('dusunceizi_exams') || [];
  const roster = getItem<StudentRosterItem[]>('dusunceizi_roster') || [];
  const aiAnalyses = getItem<any[]>('dusunceizi_ai_analyses') || [];

  const queue = [];

  for (const rev of reviews) {
    const resp = responses.find((r) => r.id === rev.studentResponseId);
    if (!resp) continue;

    const att = attempts.find((a) => a.id === resp.attemptId);
    if (!att) continue;

    const exam = exams.find((e) => e.id === att.examId);
    if (!exam || (teacherId && exam.teacherId !== teacherId)) continue;

    const student = roster.find((r) => r.id === att.studentRosterId) || {
      id: att.studentRosterId,
      schoolNumber: '---',
      firstName: 'Öğrenci',
      lastName: '',
    };

    const aiAnalysis = aiAnalyses.find((a) => a.id === rev.aiAnalysisId) || getAIAnalysisForResponse(resp.id);
    const q = (exam.questions || []).find((quest) => quest.id === resp.questionId);

    const queueItem = {
      review: rev,
      response: resp,
      attempt: att,
      exam,
      student,
      question: q,
      aiAnalysis,
      confidence: aiAnalysis?.confidence || 0.85,
      reasons: aiAnalysis?.reviewReasons || [],
    };

    if (filterStatus === 'all') queue.push(queueItem);
    else if (filterStatus === 'unreviewed' && (rev.status === 'PENDING' || rev.status === 'IN_REVIEW')) queue.push(queueItem);
    else if (filterStatus === 'low_confidence' && (aiAnalysis?.confidence || 1.0) < 0.80) queue.push(queueItem);
    else if (filterStatus === 'reviewed' && (rev.status === 'APPROVED' || rev.status === 'APPROVED_WITH_CHANGES')) queue.push(queueItem);
    else if (filterStatus === 'rejected' && rev.status === 'REJECTED') queue.push(queueItem);
  }

  return queue;
}

export function getTeacherExamAttempts(examId: string, teacherId: string): Array<{
  attempt: ExamAttempt;
  student: StudentRosterItem;
  answeredQuestions: number;
  totalQuestions: number;
  hasText: boolean;
  hasImages: boolean;
  hasAudio: boolean;
}> {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı veya yetkiniz yok.');

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const examAttempts = attempts.filter((a) => a.examId === examId && !a.deletedAt);
  const roster = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const allResponses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];

  return examAttempts.map((att) => {
    const student = roster.find((r) => r.id === att.studentRosterId) || {
      id: att.studentRosterId,
      classroomId: exam.classroomId,
      schoolNumber: 'Bilinmiyor',
      firstName: 'Bilinmeyen',
      lastName: 'Öğrenci',
      createdAt: att.createdAt,
      updatedAt: att.updatedAt,
    };

    const studentResp = allResponses.filter((r) => r.attemptId === att.id && !r.deletedAt);
    const answeredCount = studentResp.filter(
      (r) => Boolean(r.textResponse?.content?.trim()) || (r.imageResponses && r.imageResponses.length > 0) || Boolean(r.audioResponse)
    ).length;

    const hasText = studentResp.some((r) => Boolean(r.textResponse?.content?.trim()));
    const hasImages = studentResp.some((r) => r.imageResponses && r.imageResponses.length > 0);
    const hasAudio = studentResp.some((r) => Boolean(r.audioResponse));

    return {
      attempt: att,
      student,
      answeredQuestions: answeredCount,
      totalQuestions: exam.questions?.length || 0,
      hasText,
      hasImages,
      hasAudio,
    };
  });
}

export function getTeacherAttemptDetail(examId: string, attemptId: string, teacherId: string): {
  exam: Exam;
  attempt: ExamAttempt;
  student: StudentRosterItem;
  responses: StudentResponse[];
  events: AttemptEvent[];
} {
  const exam = getExamById(examId, teacherId);
  if (!exam) throw new Error('Sınav bulunamadı veya yetkiniz yok.');

  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const attempt = attempts.find((a) => a.id === attemptId && a.examId === examId);
  if (!attempt) throw new Error('Sınav yanıt oturumu bulunamadı.');

  const roster = getItem<StudentRosterItem[]>(STORAGE_KEYS.ROSTER) || [];
  const student = roster.find((r) => r.id === attempt.studentRosterId) || {
    id: attempt.studentRosterId,
    classroomId: exam.classroomId,
    schoolNumber: '000',
    firstName: 'Anonim',
    lastName: 'Öğrenci',
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };

  const responses = getStudentResponsesForAttempt(attemptId);
  const events = getAttemptEvents(attemptId);

  return {
    exam,
    attempt,
    student,
    responses,
    events,
  };
}

export function getStudentResponseById(responseId: string): StudentResponse | null {
  seedInitialData();
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  return responses.find((r) => r.id === responseId && !r.deletedAt) || null;
}

export function getExam(examId: string): Exam | null {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  return exams.find((e) => e.id === examId) || null;
}

export function getQuestion(questionId: string, examId?: string): Question | null {
  seedInitialData();
  const exams = getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  if (examId) {
    const exam = exams.find((e) => e.id === examId);
    return exam?.questions?.find((q) => q.id === questionId) || null;
  }
  for (const e of exams) {
    const q = e.questions?.find((item) => item.id === questionId);
    if (q) return q;
  }
  return null;
}

export function getAttemptById(attemptId: string): ExamAttempt | null {
  seedInitialData();
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  return attempts.find((a) => a.id === attemptId) || null;
}

export function updateAttemptStatus(attemptId: string, status: AttemptStatus): ExamAttempt | null {
  const attempts = getItem<ExamAttempt[]>(STORAGE_KEYS.ATTEMPTS) || [];
  const idx = attempts.findIndex((a) => a.id === attemptId);
  if (idx === -1) return null;
  attempts[idx].status = status;
  attempts[idx].updatedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.ATTEMPTS, attempts);
  return attempts[idx];
}

export function saveStudentResponse(response: StudentResponse): void {
  const responses = getItem<StudentResponse[]>(STORAGE_KEYS.RESPONSES) || [];
  const idx = responses.findIndex((r) => r.id === response.id);
  if (idx >= 0) {
    responses[idx] = response;
  } else {
    responses.push(response);
  }
  setItem(STORAGE_KEYS.RESPONSES, responses);
}

export function logAttemptEvent(attemptId: string, eventType: AttemptEvent['eventType'], details?: Record<string, unknown>) {
  const events = getItem<AttemptEvent[]>(STORAGE_KEYS.ATTEMPT_EVENTS) || [];
  const eventItem: AttemptEvent = {
    id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    attemptId,
    eventType,
    details,
    timestamp: new Date().toISOString(),
  };
  events.unshift(eventItem);
  setItem(STORAGE_KEYS.ATTEMPT_EVENTS, events);
}

export function getAttemptEvents(attemptId: string): AttemptEvent[] {
  seedInitialData();
  const events = getItem<AttemptEvent[]>(STORAGE_KEYS.ATTEMPT_EVENTS) || [];
  return events.filter((e) => e.attemptId === attemptId);
}
