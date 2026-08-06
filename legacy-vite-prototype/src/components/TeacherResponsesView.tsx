import React, { useState, useEffect } from 'react';
import {
  Exam,
  ExamAttempt,
  StudentRosterItem,
  StudentResponse,
  AttemptEvent,
  AttemptStatus,
} from '../types/database';
import {
  getTeacherExamAttempts,
  getTeacherAttemptDetail,
} from '../lib/db';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Mic,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Calendar,
  Activity,
  Maximize2,
  RotateCw,
  X,
  Volume2,
} from 'lucide-react';

interface TeacherResponsesViewProps {
  exam: Exam;
  teacherId: string;
  onBack: () => void;
}

export const TeacherResponsesView: React.FC<TeacherResponsesViewProps> = ({ exam, teacherId, onBack }) => {
  const [attempts, setAttempts] = useState<
    Array<{
      attempt: ExamAttempt;
      student: StudentRosterItem;
      answeredQuestions: number;
      totalQuestions: number;
      hasText: boolean;
      hasImages: boolean;
      hasAudio: boolean;
    }>
  >([]);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Attempt Detail Modal State
  const [detailData, setDetailData] = useState<{
    exam: Exam;
    attempt: ExamAttempt;
    student: StudentRosterItem;
    responses: StudentResponse[];
    events: AttemptEvent[];
  } | null>(null);

  // Zoomed Image Modal State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);

  useEffect(() => {
    loadAttempts();
  }, [exam.id, teacherId]);

  const loadAttempts = () => {
    try {
      const data = getTeacherExamAttempts(exam.id, teacherId);
      setAttempts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetail = (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    try {
      const detail = getTeacherAttemptDetail(exam.id, attemptId, teacherId);
      setDetailData(detail);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAttemptId(null);
    setDetailData(null);
  };

  const filteredAttempts = attempts.filter((item) => {
    if (filterStatus !== 'ALL' && item.attempt.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = `${item.student.firstName} ${item.student.lastName}`.toLowerCase().includes(q);
      const matchNo = item.student.schoolNumber.toLowerCase().includes(q);
      return matchName || matchNo;
    }
    return true;
  });

  const getStatusBadge = (status: AttemptStatus) => {
    switch (status) {
      case AttemptStatus.SUBMITTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Teslim Edildi
          </span>
        );
      case AttemptStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Devam Ediyor
          </span>
        );
      case AttemptStatus.EXPIRED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Süresi Doldu
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            Başlamadı
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
              <span>{exam.classroomName}</span>
              <span>•</span>
              <span>Öğrenci Yanıtları ({attempts.length})</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{exam.title}</h1>
          </div>
        </div>

        {/* Action / Stats summary */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block">Teslim Edilen</span>
            <span className="text-base font-bold text-emerald-400">
              {attempts.filter((a) => a.attempt.status === AttemptStatus.SUBMITTED).length} / {attempts.length}
            </span>
          </div>
          <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <span className="text-slate-500 block">Devam Eden</span>
            <span className="text-base font-bold text-amber-400">
              {attempts.filter((a) => a.attempt.status === AttemptStatus.IN_PROGRESS).length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === 'ALL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tümü ({attempts.length})
          </button>
          <button
            onClick={() => setFilterStatus(AttemptStatus.SUBMITTED)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === AttemptStatus.SUBMITTED
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Teslim Edilenler ({attempts.filter((a) => a.attempt.status === AttemptStatus.SUBMITTED).length})
          </button>
          <button
            onClick={() => setFilterStatus(AttemptStatus.IN_PROGRESS)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === AttemptStatus.IN_PROGRESS
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Devam Edenler ({attempts.filter((a) => a.attempt.status === AttemptStatus.IN_PROGRESS).length})
          </button>
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci adı veya okul no..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Student Attempts Table */}
      {filteredAttempts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-600" />
          <p className="font-semibold text-slate-300">Henüz Bu Kriterlere Uygun Yanıt Bulunmuyor</p>
          <p className="text-xs text-slate-500">
            Öğrenciler sınav bağlantısını açıp yanıt gönderdikçe oturumlar bu listede görünecektir.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Okul No</th>
                  <th className="p-4">Öğrenci Adı Soyadı</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Tamamlanma Oranı</th>
                  <th className="p-4">Kullanılan Biçimler</th>
                  <th className="p-4">Başlangıç / Teslim</th>
                  <th className="p-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAttempts.map(({ attempt, student, answeredQuestions, totalQuestions, hasText, hasImages, hasAudio }) => (
                  <tr key={attempt.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4 font-mono font-bold text-indigo-400">{student.schoolNumber}</td>
                    <td className="p-4 font-semibold text-slate-100">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="p-4">{getStatusBadge(attempt.status)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{
                              width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="font-semibold text-slate-300">
                          {answeredQuestions} / {totalQuestions}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {hasText && (
                          <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20" title="Metin Yanıtı">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {hasImages && (
                          <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20" title="El Yazısı / Görsel">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {hasAudio && (
                          <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20" title="Ses Kaydı">
                            <Mic className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {!hasText && !hasImages && !hasAudio && (
                          <span className="text-slate-500 text-[11px] font-mono">Yanıt Yok</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      <div>Başlangıç: {new Date(attempt.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                      {attempt.submittedAt && (
                        <div className="text-emerald-400">
                          Teslim: {new Date(attempt.submittedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(attempt.id)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-semibold transition flex items-center gap-1.5 ml-auto text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Attempt Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-400">No: {detailData.student.schoolNumber}</span>
                  <span className="text-slate-600">•</span>
                  {getStatusBadge(detailData.attempt.status)}
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  {detailData.student.firstName} {detailData.student.lastName} — Öğrenci Yanıt İnceleme
                </h2>
              </div>

              <button
                onClick={handleCloseDetail}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Question Responses list */}
              <div className="space-y-6">
                {detailData.exam.questions?.map((q, qIdx) => {
                  const resp = detailData.responses.find((r) => r.questionId === q.id);
                  const textContent = resp?.textResponse?.content;
                  const images = resp?.imageResponses || [];
                  const audio = resp?.audioResponse;

                  return (
                    <div key={q.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                      {/* Question Prompt info */}
                      <div className="flex items-start justify-between gap-4 border-b border-slate-850 pb-3">
                        <div>
                          <span className="text-xs font-bold text-indigo-400 block">Soru {qIdx + 1}</span>
                          <h3 className="text-sm font-semibold text-slate-200">{q.questionText}</h3>
                        </div>
                        {resp ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-bold">
                            Yanıtlandı
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-500 rounded-full text-[11px] font-bold">
                            Yanıtlanmadı
                          </span>
                        )}
                      </div>

                      {/* Content Renderers */}
                      {!resp ? (
                        <p className="text-xs text-slate-500 italic">Bu soru için herhangi bir yanıt girilmemiştir.</p>
                      ) : (
                        <div className="space-y-4">
                          {/* Typed text */}
                          {textContent && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> Yazılı Metin Yanıtı
                              </span>
                              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {textContent}
                              </p>
                            </div>
                          )}

                          {/* Handwritten Images */}
                          {images.length > 0 && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" /> El Yazısı / Çizim Fotoğrafları ({images.length})
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {images.map((img) => (
                                  <div
                                    key={img.id}
                                    onClick={() => {
                                      setPreviewImageUrl(img.url);
                                      setImageRotation(0);
                                    }}
                                    className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-pointer aspect-video flex items-center justify-center hover:border-indigo-500 transition"
                                  >
                                    <img src={img.url} alt="Öğrenci el yazısı" className="object-cover w-full h-full" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                                      <Maximize2 className="w-4 h-4" /> Büyüt
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Audio Player */}
                          {audio && (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                                <Mic className="w-3.5 h-3.5" /> Ses Kaydı Anlatımı ({audio.durationSeconds} saniye)
                              </span>
                              <div className="pt-2">
                                <audio controls src={audio.url} className="w-full h-10 rounded-lg accent-indigo-500" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Event Timeline Audit Log */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" /> Oturum Olay Günlüğü (Timeline)
                </h3>
                <div className="space-y-2 text-xs">
                  {detailData.events.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-slate-850">
                      <span className="font-mono text-indigo-300 font-semibold">{evt.eventType}</span>
                      <span className="text-slate-500 text-[11px]">{new Date(evt.timestamp).toLocaleTimeString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal with Rotation */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl backdrop-blur-sm border border-slate-700 transition"
                title="Döndür"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl backdrop-blur-sm border border-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={previewImageUrl}
              alt="Büyütülmüş el yazısı"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl transition-transform duration-300"
              style={{ transform: `rotate(${imageRotation}deg)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
