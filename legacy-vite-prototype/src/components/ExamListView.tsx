import React, { useState, useEffect } from 'react';
import { Exam, ExamStatus, Classroom } from '../types/database';
import {
  getExams,
  getClassrooms,
  duplicateExam,
  closeExam,
  unpublishExam,
  archiveExam,
  restoreExam,
  deleteDraftExam,
  publishExam,
} from '../lib/db';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Send,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  Lock,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Sparkles,
} from 'lucide-react';

interface ExamListViewProps {
  currentTeacherId: string;
  onNavigateNew: () => void;
  onNavigateEdit: (examId: string) => void;
  onNavigatePreview: (examId: string) => void;
  onNavigatePublish: (examId: string) => void;
  onNavigateResponses?: (exam: Exam) => void;
}

export const ExamListView: React.FC<ExamListViewProps> = ({
  currentTeacherId,
  onNavigateNew,
  onNavigateEdit,
  onNavigatePreview,
  onNavigatePublish,
  onNavigateResponses,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classroomFilter, setClassroomFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    try {
      const cls = getClassrooms(currentTeacherId);
      setClassrooms(cls);

      const list = getExams({
        teacherId: currentTeacherId,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as ExamStatus),
        classroomId: classroomFilter === 'ALL' ? undefined : classroomFilter,
        search: searchQuery,
      });

      // If statusFilter is explicitly 'ARCHIVED', make sure only archived are shown
      let filtered = list;
      if (statusFilter === 'ARCHIVED') {
        filtered = list.filter((e) => e.status === ExamStatus.ARCHIVED);
      } else if (statusFilter === 'ALL') {
        // Show everything except soft-deleted
        filtered = list;
      }

      setExams(filtered);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTeacherId, statusFilter, classroomFilter, searchQuery]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleDuplicate = (examId: string) => {
    try {
      const dup = duplicateExam(examId, currentTeacherId);
      showNotification('success', `"${dup.title}" başarıyla kopyalandı.`);
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const handleClose = (examId: string) => {
    try {
      closeExam(examId, currentTeacherId);
      showNotification('success', 'Sınav katılımına kapatıldı.');
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const handleUnpublish = (examId: string) => {
    try {
      unpublishExam(examId, currentTeacherId);
      showNotification('success', 'Sınav tekrar taslak durumuna çekildi.');
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const handleArchive = (examId: string) => {
    try {
      archiveExam(examId, currentTeacherId);
      showNotification('success', 'Sınav arşivlendi.');
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const handleRestore = (examId: string) => {
    try {
      restoreExam(examId, currentTeacherId);
      showNotification('success', 'Sınav taslağa geri yüklendi.');
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const handleDelete = (examId: string) => {
    if (!confirm('Bu taslak sınavı silmek istediğinize emin misiniz?')) return;
    try {
      deleteDraftExam(examId, currentTeacherId);
      showNotification('success', 'Taslak sınav silindi.');
      loadData();
    } catch (err: any) {
      showNotification('error', err.message);
    }
    setActiveMenuId(null);
  };

  const getStatusBadge = (status: ExamStatus) => {
    switch (status) {
      case ExamStatus.PUBLISHED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Yayında
          </span>
        );
      case ExamStatus.DRAFT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Taslak
          </span>
        );
      case ExamStatus.CLOSED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            <Lock className="w-3.5 h-3.5" /> Kapalı
          </span>
        );
      case ExamStatus.ARCHIVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Archive className="w-3.5 h-3.5" /> Arşivlendi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-400" /> Sınavlarım
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Açık uçlu, kavramsal ve çoklu temsil içeren düşünme değerlendirme sınavlarınızı yönetin.
          </p>
        </div>
        <button
          onClick={onNavigateNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Yeni Sınav Oluştur
        </button>
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

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Sınav başlığı, konu veya kod ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Tabs/Select */}
        <div className="md:col-span-4 flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'ALL', label: 'Tümü' },
            { id: ExamStatus.DRAFT, label: 'Taslak' },
            { id: ExamStatus.PUBLISHED, label: 'Yayında' },
            { id: ExamStatus.CLOSED, label: 'Kapalı' },
            { id: ExamStatus.ARCHIVED, label: 'Arşiv' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Classroom Filter */}
        <div className="md:col-span-3">
          <select
            value={classroomFilter}
            onChange={(e) => setClassroomFilter(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Tüm Sınıflar</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exam Grid */}
      {exams.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300">Henüz sınav bulunmuyor</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Filtreleme kriterlerinize uygun sınav bulunamadı. Yeni bir açık uçlu sınav kurgulayıp hemen yayınlayabilirsiniz.
          </p>

          <button
            onClick={onNavigateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition mt-2"
          >
            <Plus className="w-4 h-4" /> İlk Sınavı Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const isMenuOpen = activeMenuId === exam.id;
            const qCount = exam.questions?.length || exam._count?.questions || 0;
            const attemptCount = exam._count?.attempts || 0;

            return (
              <div
                key={exam.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between relative group"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(exam.status)}
                      {exam.shortCode && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                          {exam.shortCode}
                        </span>
                      )}
                    </div>

                    {/* Action Menu Toggle */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(isMenuOpen ? null : exam.id)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-30 text-xs">
                          {exam.status === ExamStatus.DRAFT && (
                            <button
                              onClick={() => onNavigateEdit(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-slate-200 flex items-center gap-2 font-medium"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-400" /> Sınavı Düzenle
                            </button>
                          )}

                          <button
                            onClick={() => onNavigatePreview(exam.id)}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-slate-200 flex items-center gap-2 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" /> Ön İzle
                          </button>

                          {exam.status === ExamStatus.DRAFT && (
                            <button
                              onClick={() => onNavigatePublish(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-emerald-400 flex items-center gap-2 font-medium"
                            >
                              <Send className="w-3.5 h-3.5" /> Yayınla & QR Al
                            </button>
                          )}

                          {exam.status === ExamStatus.PUBLISHED && (
                            <button
                              onClick={() => onNavigatePublish(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-indigo-400 flex items-center gap-2 font-medium"
                            >
                              <QrCode className="w-3.5 h-3.5" /> QR Code ve Bağlantı
                            </button>
                          )}

                          <button
                            onClick={() => handleDuplicate(exam.id)}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-slate-300 flex items-center gap-2 font-medium"
                          >
                            <Copy className="w-3.5 h-3.5 text-indigo-400" /> Kopyala (Çoğalt)
                          </button>

                          {exam.status === ExamStatus.PUBLISHED && attemptCount === 0 && (
                            <button
                              onClick={() => handleUnpublish(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-amber-400 flex items-center gap-2 font-medium"
                            >
                              <Clock className="w-3.5 h-3.5" /> Taslağa Çek
                            </button>
                          )}

                          {exam.status === ExamStatus.PUBLISHED && (
                            <button
                              onClick={() => handleClose(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-slate-400 flex items-center gap-2 font-medium"
                            >
                              <Lock className="w-3.5 h-3.5" /> Katılıma Kapat
                            </button>
                          )}

                          {exam.status !== ExamStatus.ARCHIVED ? (
                            <button
                              onClick={() => handleArchive(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-slate-400 flex items-center gap-2 font-medium"
                            >
                              <Archive className="w-3.5 h-3.5 text-slate-400" /> Arşivle
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-900 text-indigo-400 flex items-center gap-2 font-medium"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Geri Yükle
                            </button>
                          )}

                          {exam.status === ExamStatus.DRAFT && (
                            <button
                              onClick={() => handleDelete(exam.id)}
                              className="w-full text-left px-3.5 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 font-medium border-t border-slate-800/80 mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Sil
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Classroom */}
                  <div>
                    <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium mt-1">
                      <Users className="w-3.5 h-3.5" /> {exam.classroomName || 'Atanmamış Sınıf'}
                    </div>
                  </div>

                  {/* Meta Pills */}
                  <div className="text-xs text-slate-400 space-y-1">
                    {exam.subject && (
                      <p className="text-slate-400 font-medium">
                        Ders: <span className="text-slate-200">{exam.subject}</span>
                      </p>
                    )}
                    {exam.unit && (
                      <p className="text-slate-500 truncate">
                        Ünite: <span className="text-slate-400">{exam.unit}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Direct Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300">{qCount} Soru</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{attemptCount} Yanıt</span>
                  </div>

                  {exam.status === ExamStatus.DRAFT ? (
                    <button
                      onClick={() => onNavigateEdit(exam.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold rounded-lg transition text-xs"
                    >
                      Düzenle
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {onNavigateResponses && (
                        <button
                          onClick={() => onNavigateResponses(exam)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold rounded-lg transition border border-emerald-500/30 text-xs flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" /> Yanıtları İncele
                        </button>
                      )}
                      <button
                        onClick={() => onNavigatePublish(exam.id)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold rounded-lg transition border border-indigo-500/30 text-xs"
                      >
                        QR & Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
