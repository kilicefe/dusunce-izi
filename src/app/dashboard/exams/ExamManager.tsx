'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
  X,
  Trash2,
  Share2,
  BarChart2,
  Eye,
} from 'lucide-react';
import { createExam, updateExamStatus, deleteExam } from '@/app/actions/examActions';

interface ClassroomItem {
  id: string;
  name: string;
  grade: string;
  branch?: string | null;
}

interface ExamItem {
  id: string;
  title: string;
  subject: string;
  status: string;
  shortCode: string;
  createdAt: any;
  classroom?: ClassroomItem | null;
  _count?: {
    questions: number;
    attempts: number;
  };
}

export function ExamManager({
  initialExams,
  classrooms,
}: {
  initialExams: any[];
  classrooms: ClassroomItem[];
}) {
  const [exams, setExams] = useState<ExamItem[]>(initialExams);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Fen Bilimleri');
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');
  const [unit, setUnit] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      title: '1. Soru: Isı ve Genleşme İlkesi',
      questionText: 'Isı alan metallerde tanecik boyutu ve hareket hızı nasıl değişir? Tanecik modeline göre açıklayınız.',
      teacherNotes: 'Öğrenciden tanecikler arası mesafenin arttığını vurgulaması beklenmektedir.',
      maximumScore: 100,
      allowedResponseModes: ['DIRECT_TEXT', 'HANDWRITTEN_IMAGE', 'AUDIO_EXPLANATION'],
      targetedSkills: ['causalReasoning', 'problemUnderstanding'],
      expectedConcepts: [
        { conceptName: 'Tanecik Hızı ve Kinetik Enerji', description: 'Isı aldıkça kinetik enerji artar', importance: 'essential', isEssential: true },
        { conceptName: 'Tanecikler Arası Mesafe', description: 'Genleşmede tanecikler arası mesafe artar', importance: 'essential', isEssential: true },
      ],
      misconceptions: [
        { code: 'MIS-01', title: 'Tanecik Boyutunun Büyümesi', description: 'Madde ısınınca taneciklerin kendi hacmi büyür sanılması', remedy: 'Tanecik boyutunun değişmediği simülasyonla gösterilmeli' },
      ],
      teacherRubric: '0: Cevap yok / yanlış\n2: Kısmi doğru\n4: Tam doğru ve nedensel açıklama',
    },
  ]);

  const filteredExams = exams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        title: `${questions.length + 1}. Soru: Yeni Soru`,
        questionText: '',
        teacherNotes: '',
        maximumScore: 100,
        allowedResponseModes: ['DIRECT_TEXT', 'HANDWRITTEN_IMAGE', 'AUDIO_EXPLANATION'],
        targetedSkills: ['causalReasoning'],
        expectedConcepts: [{ conceptName: '', description: '', importance: 'essential', isEssential: true }],
        misconceptions: [{ code: `MIS-0${questions.length + 1}`, title: '', description: '', remedy: '' }],
        teacherRubric: '',
      },
    ]);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !classroomId) {
      setErrorMsg('Lütfen sınav başlığını ve sınıf seçimini doldurunuz.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const created = await createExam({
        title,
        subject,
        classroomId,
        unit,
        topic,
        description,
        questions,
      });

      setExams([created, ...exams]);
      setIsModalOpen(false);
      // Reset
      setTitle('');
      setUnit('');
      setTopic('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Sınav oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    try {
      const updated = await updateExamStatus(examId, newStatus);
      setExams(exams.map((e) => (e.id === examId ? { ...e, status: updated.status } : e)));
    } catch (err: any) {
      alert(err.message || 'Durum güncellenemedi');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteExam(examId);
      setExams(exams.filter((e) => e.id !== examId));
    } catch (err: any) {
      alert(err.message || 'Sınav silinemedi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Sınıf İçi Sınav ve Açık Uçlu Analiz Yönetimi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geleneksel kağıt ve çoklu-modlu cevaplar için otomatik pedagojik yapay zeka analiz sınavları tanımlayın.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yeni Sınav Tanımla
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Sınav başlığı veya ders ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' && 'Tümü'}
              {st === 'DRAFT' && 'Taslak'}
              {st === 'PUBLISHED' && 'Aktif / Yayınlandı'}
              {st === 'CLOSED' && 'Kapatıldı'}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Henüz kayıtlı sınav bulunamadı</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Öğrencileriniz için açık uçlu, görsel veya sesli yanıt içeren ilk sınavınızı oluşturun.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Sınav Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      exam.status === 'PUBLISHED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exam.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {exam.status === 'PUBLISHED' && '● ÖĞRENCİ ERİŞİMİNE AÇIK'}
                    {exam.status === 'DRAFT' && 'TASLAK'}
                    {exam.status === 'CLOSED' && 'KAPATILDI'}
                  </span>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                    KOD: {exam.shortCode}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {exam.subject} — {exam.classroom?.name || 'Sınıf Seçili'} ({exam.classroom?.grade || ''}. Sınıf)
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam._count?.questions || 1} Soru</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam._count?.attempts || 0} Öğrenci Yanıtı</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTogglePublish(exam.id, exam.status)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                    exam.status === 'PUBLISHED'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {exam.status === 'PUBLISHED' ? 'Kapat' : 'Yayınla'}
                </button>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/exams/${exam.id}/review`}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition"
                    title="Yapay Zeka Yanıt İnceleme"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/dashboard/exams/${exam.id}/analytics`}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition"
                    title="Pedagojik Analitik"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition"
                    title="Sınavı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/dashboard/exams/${exam.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    Yönet <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Yeni Sınıf İçi Sınav Tanımla
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınav Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="ör. 1. Dönem Fen Bilimleri 2. Açık Uçlu Yazılı"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hedef Sınıf *</label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade}. Sınıf {c.branch || ''})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ders *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ünite</label>
                  <input
                    type="text"
                    placeholder="Madde ve Isı"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Konu</label>
                  <input
                    type="text"
                    placeholder="Isı Alışverişi ve Hal Değişimi"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Question Configuration Builder */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Sınav Soruları ve Pedagojik Ölçütler</h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    + Soru Ekle
                  </button>
                </div>

                {questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-800">{q.title}</div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">Soru Metni *</label>
                      <textarea
                        required
                        rows={2}
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].questionText = e.target.value;
                          setQuestions(updated);
                        }}
                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Beklenen Doğru Kavramlar</label>
                        <input
                          type="text"
                          placeholder="ör. Tanecik kinetik enerjisi artar"
                          value={q.expectedConcepts[0]?.conceptName || ''}
                          onChange={(e) => {
                            const updated = [...questions];
                            if (!updated[idx].expectedConcepts[0]) {
                              updated[idx].expectedConcepts = [{ conceptName: '', description: '', importance: 'essential', isEssential: true }];
                            }
                            updated[idx].expectedConcepts[0].conceptName = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Hedeflenen Kavram Yanılgısı (Varsa)</label>
                        <input
                          type="text"
                          placeholder="ör. MIS-01: Tanecik boyutu genleşir sanılması"
                          value={q.misconceptions[0]?.title || ''}
                          onChange={(e) => {
                            const updated = [...questions];
                            if (!updated[idx].misconceptions[0]) {
                              updated[idx].misconceptions = [{ code: 'MIS-01', title: '', description: '', remedy: '' }];
                            }
                            updated[idx].misconceptions[0].title = e.target.value;
                            updated[idx].misconceptions[0].description = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Sınavı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
