import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Sparkles,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Mic,
  Save,
  RotateCcw,
  Check,
  ChevronDown,
  Info,
  HelpCircle,
  Brain,
  MessageSquare,
} from 'lucide-react';
import {
  getStudentResponseById,
  getQuestion,
  getAIAnalysisForResponse,
  getTeacherReviewForResponse,
  getOCRResultForResponse,
  getTranscriptionForResponse,
  getVisualAnalysisForResponse,
  updateCorrectedOCRText,
  updateCorrectedTranscriptText,
  approveTeacherReview,
  updateTeacherReviewWithEdits,
  rejectTeacherReview,
  getAttemptById,
  getExam,
} from '../lib/db';
import { QualitativeAnalysisOutput } from '../lib/zodSchemas';

interface TeacherReviewDetailViewProps {
  studentResponseId: string;
  teacherId: string;
  onBack: () => void;
}

export const TeacherReviewDetailView: React.FC<TeacherReviewDetailViewProps> = ({
  studentResponseId,
  teacherId,
  onBack,
}) => {
  const [response, setResponse] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [review, setReview] = useState<any>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [transcription, setTranscription] = useState<any>(null);
  const [visualAnalysis, setVisualAnalysis] = useState<any>(null);

  // Editable fields state
  const [editableOcr, setEditableOcr] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [editedAnalysis, setEditedAnalysis] = useState<QualitativeAnalysisOutput | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'evidence' | 'feedback'>('analysis');

  useEffect(() => {
    loadData();
  }, [studentResponseId]);

  const loadData = () => {
    const resp = getStudentResponseById(studentResponseId);
    if (!resp) return;
    setResponse(resp);

    const q = getQuestion(resp.questionId);
    setQuestion(q);

    const att = getAttemptById(resp.attemptId);
    if (att) {
      const exam = getExam(att.examId);
      setStudentInfo({
        schoolNumber: '104',
        name: 'Ahmet Yılmaz',
        examTitle: exam?.title || 'Fen Bilimleri Sınavı',
      });
    }

    const ai = getAIAnalysisForResponse(studentResponseId);
    setAiAnalysis(ai);

    if (ai?.analysisJson) {
      setEditedAnalysis(JSON.parse(JSON.stringify(ai.analysisJson)));
    }

    const rev = getTeacherReviewForResponse(studentResponseId);
    setReview(rev);

    const ocr = getOCRResultForResponse(studentResponseId);
    setOcrResult(ocr);
    if (ocr) setEditableOcr(ocr.correctedText || ocr.extractedText || '');

    const trans = getTranscriptionForResponse(studentResponseId);
    setTranscription(trans);
    if (trans) setEditableTranscript(trans.correctedText || trans.transcriptText || '');

    const vis = getVisualAnalysisForResponse(studentResponseId);
    setVisualAnalysis(vis);
  };

  if (!response || !question || !editedAnalysis) {
    return (
      <div className="p-12 text-center text-slate-400">
        Öğrenci yanıtı veya AI analiz verisi yükleniyor...
      </div>
    );
  }

  const handleApproveWithoutChanges = () => {
    if (review?.id) {
      approveTeacherReview(review.id, teacherId);
      setIsSaved(true);
      setTimeout(() => onBack(), 800);
    }
  };

  const handleSaveWithEdits = () => {
    if (review?.id && editedAnalysis) {
      // Update OCR and Transcript corrections if changed
      if (ocrResult && editableOcr !== (ocrResult.correctedText || ocrResult.extractedText)) {
        updateCorrectedOCRText(studentResponseId, editableOcr);
      }
      if (transcription && editableTranscript !== (transcription.correctedText || transcription.transcriptText)) {
        updateCorrectedTranscriptText(studentResponseId, editableTranscript);
      }

      updateTeacherReviewWithEdits(review.id, teacherId, editedAnalysis, correctionReason);
      setIsSaved(true);
      setTimeout(() => onBack(), 800);
    }
  };

  const handleReject = () => {
    if (review?.id) {
      const reason = correctionReason || 'Öğretmen tarafından yetersiz/uygunsuz değerlendirildi.';
      rejectTeacherReview(review.id, teacherId, reason);
      setIsSaved(true);
      setTimeout(() => onBack(), 800);
    }
  };

  const updateConceptualScore = (score: number) => {
    if (!editedAnalysis) return;
    const copy = { ...editedAnalysis };
    copy.conceptualUnderstanding.overallLevel.score = score;
    setEditedAnalysis(copy);
  };

  const toggleMisconceptionStatus = (index: number) => {
    if (!editedAnalysis) return;
    const copy = { ...editedAnalysis };
    const curr = copy.conceptualUnderstanding.misconceptions[index].status;
    copy.conceptualUnderstanding.misconceptions[index].status =
      curr === 'CONFIRMED_BY_EVIDENCE' ? 'NOT_PRESENT' : 'CONFIRMED_BY_EVIDENCE';
    setEditedAnalysis(copy);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> DEĞERLENDİRME DETAYI
            </div>
            <h1 className="text-lg font-bold text-slate-100">
              {studentInfo?.schoolNumber} - {studentInfo?.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApproveWithoutChanges}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Doğrudan Onayla</span>
          </button>
          <button
            onClick={handleSaveWithEdits}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Düzenleyerek Onayla</span>
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 font-medium text-xs rounded-xl border border-slate-700 transition-all"
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Reddet</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-center text-sm font-medium animate-fade-in">
          ✓ İnceleme başarıyla kaydedildi ve durum güncellendi.
        </div>
      )}

      {/* Main Grid: Left Evidence vs Right Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question & Multimodal Evidence (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Question Prompt */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Soru İadesi & Beklenen İfadeler
            </h3>
            <p className="text-sm font-medium text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {question.questionText}
            </p>
            {question.expectedConcepts && question.expectedConcepts.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Hedef Kavramlar:</span>
                <div className="flex flex-wrap gap-1.5">
                  {question.expectedConcepts.map((c: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {c.conceptName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multimodal Student Evidence Card */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Çoklu-Modlu Öğrenci Verileri</span>
              <span className="text-[10px] text-indigo-400 font-normal">Kanıt Kaynakları</span>
            </h3>

            {/* Direct Text */}
            {response.textResponse?.content && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-sky-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Kullanıcı Tarafından Yazılan Metin</span>
                </div>
                <p className="text-sm text-slate-200 italic">{response.textResponse.content}</p>
              </div>
            )}

            {/* OCR Image & Extracted Text */}
            {response.imageResponses && response.imageResponses.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-amber-400">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>El Yazısı OCR Ekstraksiyonu</span>
                  </div>
                  {ocrResult && (
                    <span className="text-[10px] text-slate-400">
                      Güven: %{Math.round((ocrResult.confidence || 0.85) * 100)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {response.imageResponses.map((img: any, idx: number) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt="El yazısı cevabı"
                      className="w-32 h-24 object-cover rounded-lg border border-slate-800"
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Okunan Metin (Öğretmen Düzenleyebilir):
                  </label>
                  <textarea
                    value={editableOcr}
                    onChange={(e) => setEditableOcr(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Audio Recording & Transcript */}
            {response.audioResponse && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Ses Kaydı Transkripti ({response.audioResponse.durationSeconds}sn)</span>
                  </div>
                  {transcription && (
                    <span className="text-[10px] text-slate-400">
                      Güven: %{Math.round((transcription.confidence || 0.90) * 100)}
                    </span>
                  )}
                </div>

                <audio controls src={response.audioResponse.url} className="w-full h-8" />

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">
                    Transkript Metni (Öğretmen Düzenleyebilir):
                  </label>
                  <textarea
                    value={editableTranscript}
                    onChange={(e) => setEditableTranscript(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 p-2 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Visual Representation Analysis Findings */}
            {visualAnalysis && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Çizim & Görsel Şema Analizi</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div>Çizim Varlığı: {visualAnalysis.drawingPresent ? 'Evet' : 'Hayır'}</div>
                  <div>Gözlemlenen Ögeler: {visualAnalysis.scientificElements?.join(', ') || 'Yok'}</div>
                  <div>Temsil Tutarlılığı: {visualAnalysis.consistency}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Qualitative Analysis & Teacher Correction Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary & Review Reasons Header */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-slate-100">Yapay Zekâ Nitel Analizi</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Güven Puanı:</span>
                <span className="px-2.5 py-1 bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold text-xs rounded-lg">
                  %{Math.round((editedAnalysis.analysisConfidence || 0.85) * 100)}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              {editedAnalysis.analysisSummary}
            </p>

            {editedAnalysis.reviewReasons && editedAnalysis.reviewReasons.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-400">İnceleme Nedeni:</span>
                {editedAnalysis.reviewReasons.map((reason: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 1: Conceptual Understanding Score & Level */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              1. Kavramsal Anlama Düzeyi (0 - 4 Rubrik)
            </h3>

            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Öğretmen Puan Ayarı:</span>
              {[0, 1, 2, 3, 4].map((score) => (
                <button
                  key={score}
                  onClick={() => updateConceptualScore(score)}
                  className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${
                    editedAnalysis.conceptualUnderstanding.overallLevel.score === score
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 scale-105'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {score}
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-auto">
                (Mevcut: {editedAnalysis.conceptualUnderstanding.overallLevel.score ?? 'Değerlendirilemedi'})
              </span>
            </div>

            {/* Correct & Missing Ideas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-emerald-400">Doğru İfadeler / Kanıtlar</div>
                {editedAnalysis.conceptualUnderstanding.correctIdeas.length === 0 ? (
                  <div className="text-slate-500 italic">Saptanmadı.</div>
                ) : (
                  editedAnalysis.conceptualUnderstanding.correctIdeas.map((ci, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 space-y-1">
                      <div className="text-slate-200 font-medium">{ci.idea}</div>
                      <div className="text-[10px] text-slate-400 italic">"{ci.evidence}"</div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-rose-400">Eksik / Yanlış Bilimsel Ögeler</div>
                {editedAnalysis.conceptualUnderstanding.missingExpectedConcepts.length === 0 ? (
                  <div className="text-slate-500 italic">Eksik saptanmadı.</div>
                ) : (
                  editedAnalysis.conceptualUnderstanding.missingExpectedConcepts.map((mc, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                      • {typeof mc === 'string' ? mc : mc.concept}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Misconception Verification */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Kavram Yanılgısı Doğrulama
            </h3>

            {editedAnalysis.conceptualUnderstanding.misconceptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Tanımlanmış kavram yanılgısı yok.</p>
            ) : (
              <div className="space-y-2">
                {editedAnalysis.conceptualUnderstanding.misconceptions.map((m: any, idx: number) => {
                  const isConfirmed = m.status === 'CONFIRMED_BY_EVIDENCE';
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">
                          [{m.code}] {m.title}
                        </div>
                        <div className="text-[11px] text-slate-400">{m.explanation}</div>
                      </div>

                      <button
                        onClick={() => toggleMisconceptionStatus(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isConfirmed
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {isConfirmed ? '✓ Yanılgı Mevcut' : '+ Yanılgı İşaretle'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Recommended Feedback & Correction Reason */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              3. Önerilen Öğretmen Geri Bildirimi & Düzeltme Notu
            </h3>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-indigo-400 font-semibold">Güçlü Yön:</span>
                <p className="text-slate-300">{editedAnalysis.recommendedTeacherFeedback.strength}</p>
              </div>
              <div>
                <span className="text-amber-400 font-semibold">Gelişim İhtiyacı:</span>
                <p className="text-slate-300">{editedAnalysis.recommendedTeacherFeedback.developmentNeed}</p>
              </div>
              <div>
                <span className="text-emerald-400 font-semibold">Yönlendirici Soru:</span>
                <p className="text-slate-300">{editedAnalysis.recommendedTeacherFeedback.promptingQuestion}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">
                Öğretmen Düzeltme Gerekçesi (Opsiyonel):
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Neden puan veya yanılgı durumunu değiştirdiğinizi yazabilirsiniz..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 p-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
