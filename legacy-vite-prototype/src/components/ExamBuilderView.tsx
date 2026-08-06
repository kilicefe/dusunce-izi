import React, { useState, useEffect } from 'react';
import {
  Exam,
  Classroom,
  Question,
  ExamStatus,
  ResponseMode,
} from '../types/database';
import {
  getExamById,
  getClassrooms,
  createExam,
  updateExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  validateExamForPublication,
  publishExam,
  rotateExamToken,
  closeExam,
} from '../lib/db';
import { QuestionEditor } from './QuestionEditor';
import { QRCodeView } from './QRCodeView';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  Eye,
  Send,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Edit,
  Smartphone,
  Monitor,
  Users,
  Sparkles,
  Lock,
  RotateCw,
  Info,
  QrCode,
} from 'lucide-react';

interface ExamBuilderViewProps {
  currentTeacherId: string;
  examId?: string | null; // If editing existing exam
  initialStep?: 1 | 2 | 3 | 4;
  onBackToList: () => void;
}

export const ExamBuilderView: React.FC<ExamBuilderViewProps> = ({
  currentTeacherId,
  examId: initialExamId,
  initialStep = 1,
  onBackToList,
}) => {
  const [currentExamId, setCurrentExamId] = useState<string | null>(initialExamId || null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Step 1 Form State
  const [classroomId, setClassroomId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Fen Bilimleri');
  const [unit, setUnit] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('Lütfen her soruyu açık bir biçimde, gerekçelerinizi belirterek cevaplayınız.');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [hasTimeLimit, setHasTimeLimit] = useState<boolean>(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(40);
  const [allowResume, setAllowResume] = useState<boolean>(true);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState<boolean>(false);
  const [showFeedbackAfterApproval, setShowFeedbackAfterApproval] = useState<boolean>(true);
  const [randomizeQuestionOrder, setRandomizeQuestionOrder] = useState<boolean>(false);

  // Question Editor modal state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editingQuestionData, setEditingQuestionData] = useState<Partial<Question> | null>(null);

  // Preview Mode viewport state
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Notification message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const cls = getClassrooms(currentTeacherId);
    setClassrooms(cls);
    if (cls.length > 0 && !classroomId) {
      setClassroomId(cls[0].id);
    }
  }, [currentTeacherId]);

  useEffect(() => {
    if (currentExamId) {
      try {
        const found = getExamById(currentExamId, currentTeacherId);
        if (found) {
          setExam(found);
          setClassroomId(found.classroomId);
          setTitle(found.title);
          setSubject(found.subject || 'Fen Bilimleri');
          setUnit(found.unit || '');
          setTopic(found.topic || '');
          setDescription(found.description || '');
          setInstructions(found.instructions || '');
          setStartDate(found.startDate || '');
          setEndDate(found.endDate || '');
          setHasTimeLimit(Boolean(found.timeLimitMinutes));
          setTimeLimitMinutes(found.timeLimitMinutes || 40);
          setAllowResume(found.allowResume ?? true);
          setAllowMultipleSubmissions(found.allowMultipleSubmissions ?? false);
          setShowFeedbackAfterApproval(found.showFeedbackAfterApproval ?? true);
          setRandomizeQuestionOrder(found.randomizeQuestionOrder ?? false);
        }
      } catch (err: any) {
        console.error(err);
      }
    }
  }, [currentExamId, currentTeacherId]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  // Step 1: Save Exam Info & Proceed
  const handleSaveStep1 = () => {
    if (!title.trim()) {
      showNotification('error', 'Lütfen sınav başlığını giriniz.');
      return;
    }
    if (!classroomId) {
      showNotification('error', 'Lütfen sınava atanacak sınıfı seçiniz.');
      return;
    }

    try {
      if (currentExamId) {
        const updated = updateExam(
          currentExamId,
          {
            classroomId,
            title: title.trim(),
            subject: subject.trim(),
            unit: unit.trim(),
            topic: topic.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeLimitMinutes: hasTimeLimit ? Number(timeLimitMinutes) : undefined,
            allowResume,
            allowMultipleSubmissions,
            showFeedbackAfterApproval,
            randomizeQuestionOrder,
          },
          currentTeacherId
        );
        setExam(updated);
        showNotification('success', 'Sınav bilgileri güncellendi.');
      } else {
        const created = createExam(
          {
            classroomId,
            title: title.trim(),
            subject: subject.trim(),
            unit: unit.trim(),
            topic: topic.trim(),
            description: description.trim(),
            instructions: instructions.trim(),
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeLimitMinutes: hasTimeLimit ? Number(timeLimitMinutes) : undefined,
            allowResume,
            allowMultipleSubmissions,
            showFeedbackAfterApproval,
            randomizeQuestionOrder,
          },
          currentTeacherId
        );
        setCurrentExamId(created.id);
        setExam(created);
        showNotification('success', 'Yeni sınav taslağı oluşturuldu.');
      }
      setStep(2);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Question Management Actions
  const handleAddNewQuestion = () => {
    if (!currentExamId) return;
    const questions = exam?.questions || [];
    setEditingQuestionIndex(questions.length);
    setEditingQuestionData({});
  };

  const handleEditQuestion = (index: number) => {
    if (!exam?.questions) return;
    setEditingQuestionIndex(index);
    setEditingQuestionData(exam.questions[index]);
  };

  const handleSaveQuestionData = (questionData: Partial<Question>) => {
    if (!currentExamId) return;
    try {
      if (editingQuestionIndex !== null && exam?.questions && editingQuestionIndex < exam.questions.length) {
        // Update existing question
        const qId = exam.questions[editingQuestionIndex].id;
        updateQuestion(currentExamId, qId, questionData, currentTeacherId);
      } else {
        // Add new question
        addQuestion(currentExamId, questionData, currentTeacherId);
      }

      // Refresh exam object
      const refreshed = getExamById(currentExamId, currentTeacherId);
      setExam(refreshed);
      setEditingQuestionIndex(null);
      setEditingQuestionData(null);
      showNotification('success', 'Soru kaydedildi.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!currentExamId) return;
    if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      deleteQuestion(currentExamId, qId, currentTeacherId);
      const refreshed = getExamById(currentExamId, currentTeacherId);
      setExam(refreshed);
      showNotification('success', 'Soru silindi.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!currentExamId || !exam?.questions) return;
    const questions = [...exam.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const newIds = questions.map((q) => q.id);
    try {
      reorderQuestions(currentExamId, newIds, currentTeacherId);
      const refreshed = getExamById(currentExamId, currentTeacherId);
      setExam(refreshed);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Step 4: Publish Action
  const handlePublishNow = () => {
    if (!currentExamId) return;
    try {
      const published = publishExam(currentExamId, currentTeacherId);
      setExam(published);
      showNotification('success', 'Sınav başarıyla yayınlandı!');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRotateTokenNow = () => {
    if (!currentExamId) return;
    if (!confirm('Yeni bir bağlantı ve QR kod oluşturulacak. Eski bağlantı geçersiz kılınacak. Devam edilsin mi?')) return;
    try {
      const updated = rotateExamToken(currentExamId, currentTeacherId);
      setExam(updated);
      showNotification('success', 'Yeni güvenli katılım bağlantısı oluşturuldu.');
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const publicUrl = exam?.publicToken
    ? `${window.location.origin}/exam/${exam.publicToken}`
    : '';

  const validation = currentExamId
    ? validateExamForPublication(currentExamId, currentTeacherId)
    : { valid: false, errors: [] };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition"
            title="Sınav Listesine Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              {currentExamId ? (exam?.title ? `Düzenle: ${exam.title}` : 'Sınav Oluşturucu') : 'Yeni Sınav Oluştur'}
            </h1>
            <p className="text-xs text-slate-400">
              Açık uçlu soru tasarlama, rubrik belirleme ve yayınlama adımları.
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { num: 1, label: '1. Temel Bilgiler' },
            { num: 2, label: '2. Sorular' },
            { num: 3, label: '3. Ön İzleme' },
            { num: 4, label: '4. Yayınla & QR' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (currentExamId || s.num === 1) setStep(s.num as any);
              }}
              disabled={!currentExamId && s.num > 1}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                step === s.num
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">
            Kapat
          </button>
        </div>
      )}

      {/* QUESTION EDITOR MODAL */}
      {editingQuestionIndex !== null && editingQuestionData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <QuestionEditor
              question={editingQuestionData}
              questionIndex={editingQuestionIndex}
              onSave={handleSaveQuestionData}
              onCancel={() => {
                setEditingQuestionIndex(null);
                setEditingQuestionData(null);
              }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: BASIC INFORMATION & SETTINGS */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Adım 1: Sınav Genel Ayarları & Bilgileri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Title */}
            <div className="md:col-span-8 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Sınav Başlığı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 8-A Fen Bilimleri II. Dönem Açık Uçlu Düşünme Değerlendirmesi"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Classroom */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Atanacak Sınıf <span className="text-rose-400">*</span>
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c._count?.roster || 0} Öğrenci)
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Ders Adı</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Örn: Fen Bilimleri"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Unit */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Ünite / Tema</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Örn: 2. Ünite: DNA ve Genetik Kod"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Topic */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Konu</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Örn: Nükleotidler ve Kalıtım"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Instructions */}
            <div className="md:col-span-12 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Öğrenci Yönergesi</label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Öğrencilerin sınav ekranında göreceği genel yönergeler..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Time & Availability Settings */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Zaman ve Uygulama Kuralları
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Başlangıç Tarihi (İsteğe Bağlı)</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-6 space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Bitiş Tarihi (İsteğe Bağlı)</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-6 flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Sınav Süresi Sınırı</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasTimeLimit}
                    onChange={(e) => setHasTimeLimit(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                  {hasTimeLimit && (
                    <input
                      type="number"
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      min={1}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 text-center font-bold"
                    />
                  )}
                  {hasTimeLimit && <span className="text-xs text-slate-400">dk</span>}
                </div>
              </div>

              <div className="md:col-span-6 flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Kaldığı Yerden Devam Etme</span>
                  <span className="text-[11px] text-slate-500">Öğrenci kopma durumunda aynı numarasıyla devam edebilir.</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowResume}
                  onChange={(e) => setAllowResume(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSaveStep1}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              Kaydet ve Sorulara Geç (Adım 2) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: QUESTIONS BUILDER */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" /> Adım 2: Açık Uçlu Soru Havuzu ve Yapılandırma
              </h2>
              <p className="text-xs text-slate-400">
                Sınava sorular ekleyin, öğrenci yanıt biçimlerini belirleyin ve kavram rubriklerini oluşturun.
              </p>
            </div>

            <button
              onClick={handleAddNewQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Yeni Soru Ekle
            </button>
          </div>

          {/* Questions List */}
          {(!exam?.questions || exam.questions.length === 0) ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Henüz soru eklenmedi</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                "Yeni Soru Ekle" butonunu kullanarak açık uçlu soru metni, görselleri ve değerlendirme rubriklerini ekleyebilirsiniz.
              </p>
              <button
                onClick={handleAddNewQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition mt-2"
              >
                <Plus className="w-4 h-4" /> İlk Soruyu Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {exam.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{q.title || `Soru ${idx + 1}`}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{q.questionText || 'Görsel bazlı soru'}</p>
                      </div>
                    </div>

                    {/* Question Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30"
                        title="Yukarı Taşı"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === (exam.questions?.length || 0) - 1}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30"
                        title="Aşağı Taşı"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditQuestion(idx)}
                        className="p-1.5 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition"
                        title="Soruyu Düzenle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 hover:bg-rose-950/40 rounded text-rose-400 hover:text-rose-300 transition"
                        title="Soruyu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900 text-[11px]">
                    {q.imageUrl && (
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                        🖼️ Görsel Var
                      </span>
                    )}
                    <span className="bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-medium">
                      {(q.allowedResponseModes || []).length} Yanıt Modu
                    </span>
                    <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-medium">
                      {(q.expectedConcepts || []).length} Beklenen Kavram
                    </span>
                    <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-medium">
                      {(q.misconceptions || []).length} Yanılgı Kataloğu
                    </span>
                    <span className="bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-medium">
                      {(q.rubrics || []).length} Rubrik Düzeyi
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              &larr; Adım 1'e Dön
            </button>

            <button
              onClick={() => setStep(3)}
              disabled={!exam?.questions || exam.questions.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 disabled:opacity-40"
            >
              Ön İzlemeye Geç (Adım 3) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: EXAM PREVIEW (EXACT STUDENT VIEW SIMULATION) */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Viewport controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Öğrenci Sınav Ekranı Ön İzlemesi</h3>
                <p className="text-xs text-slate-400">Öğrencilerin sınav ekranında karşılaşacağı arayüz.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setPreviewViewport('desktop')}
                className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  previewViewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Masaüstü Viewport
              </button>
              <button
                onClick={() => setPreviewViewport('mobile')}
                className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1.5 ${
                  previewViewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobil Viewport
              </button>
            </div>
          </div>

          {/* Device Frame Simulation */}
          <div className="flex justify-center">
            <div
              className={`transition-all duration-300 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl ${
                previewViewport === 'mobile' ? 'w-full max-w-sm border-slate-700' : 'w-full max-w-4xl'
              }`}
            >
              {/* Simulation Header */}
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-4 mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Öğrenci Sınav Oturumu Simulation
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Kalan Süre: {hasTimeLimit ? `${timeLimitMinutes}:00` : 'Sınırsız'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{exam?.title}</h2>
                <p className="text-xs text-indigo-200">{exam?.classroomName} • {exam?.subject}</p>

                {instructions && (
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 mt-2">
                    <strong className="text-indigo-300">Öğrenci Yönergesi:</strong> {instructions}
                  </div>
                )}
              </div>

              {/* Questions preview */}
              <div className="space-y-6">
                {(exam?.questions || []).map((q, idx) => (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <span className="font-bold text-sm text-indigo-300">Soru {idx + 1} / {exam?.questions?.length}</span>
                      <span className="text-xs text-slate-500 font-medium">Maks. Puan: {q.maximumScore || 100}</span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-sm leading-relaxed">{q.questionText}</h4>

                    {q.imageUrl && (
                      <div className="my-3 bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-center">
                        <img src={q.imageUrl} alt="Soru Görseli" className="max-h-56 object-contain rounded-lg" />
                      </div>
                    )}

                    {/* Response Mode Selector Simulation */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-semibold text-slate-400">
                        Cevabınızı sunma biçimini seçiniz:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {q.allowedResponseModes?.map((mode) => (
                          <div
                            key={mode}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-semibold text-indigo-300 text-xs"
                          >
                            {mode === ResponseMode.DIRECT_TEXT && '✍️ Metin Yaz'}
                            {mode === ResponseMode.HANDWRITTEN_IMAGE && '📷 Fotoğraf Yükle'}
                            {mode === ResponseMode.AUDIO_EXPLANATION && '🎙️ Ses Kaydet'}
                            {mode === ResponseMode.MULTIMODAL && '🧩 Karma Cevap'}
                          </div>
                        ))}
                      </div>

                      {/* Input Box Placeholder */}
                      <div className="mt-3 p-4 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500">
                        [Öğrenci Yanıt Alanı - Öğrenci bu alanda doğrudan yazacak veya dosya yükleyecektir]
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-center text-xs font-semibold">
                ⚠️ Bu alan öğretmen ön izleme alanıdır. Herhangi bir öğrenci yanıtı kaydedilmez.
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              &larr; Adım 2'ye Dön
            </button>

            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              Yayınlama & QR Adımına Geç (Adım 4) &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PUBLICATION & LINK / QR GENERATION */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" /> Adım 4: Sınav Yayınlama ve Katılım Kartı
          </h2>

          {/* Validation Checklist */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span>Yayınlama Öncesi Kontrol Listesi</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                validation.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {validation.valid ? 'Tüm Şartlar Sağlandı' : 'Eksikler Var'}
              </span>
            </h3>

            {validation.valid ? (
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sınavınız yayınlanmak için eksiksiz ve hazırdır.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {validation.errors.map((err, idx) => (
                  <div key={idx} className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> {err.message}
                    </span>
                    {err.category === 'settings' && (
                      <button onClick={() => setStep(1)} className="text-[11px] underline font-semibold hover:text-white">
                        Ayarlara Git
                      </button>
                    )}
                    {err.category === 'question' && (
                      <button onClick={() => setStep(2)} className="text-[11px] underline font-semibold hover:text-white">
                        Sorulara Git
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published QR & Link View */}
          {exam?.status === ExamStatus.PUBLISHED ? (
            <div className="space-y-6">
              <QRCodeView
                examTitle={exam.title}
                classroomName={exam.classroomName || 'Atanmış Sınıf'}
                publicUrl={publicUrl}
                shortCode={exam.shortCode}
              />

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleRotateTokenNow}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-semibold transition flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" /> Yeni Bağlantı Oluştur (Eskisini İptal Et)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-slate-300">
                Sınavı yayınladığınızda benzersiz bir öğrenci katılım bağlantısı ve QR kod oluşturulacaktır.
              </p>

              <button
                onClick={handlePublishNow}
                disabled={!validation.valid}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-emerald-600/20 transition inline-flex items-center gap-2 disabled:opacity-40"
              >
                <Send className="w-5 h-5" /> Sınavı Hemen Yayınla
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
