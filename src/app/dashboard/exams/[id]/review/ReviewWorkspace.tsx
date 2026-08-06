'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Mic,
  Check,
  X,
  MessageSquare,
  Award,
} from 'lucide-react';
import { submitTeacherReview, reanalyzeStudentResponse } from '@/app/actions/multimodalActions';

export function ReviewWorkspace({
  examId,
  initialResponses,
}: {
  examId: string;
  initialResponses: any[];
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [editedScore, setEditedScore] = useState<number | null>(null);

  const currentResp = responses[selectedIndex];
  const aiAnalysis = currentResp?.aiAnalyses?.[0]?.analysisJson;
  const existingReview = currentResp?.teacherReviews?.[0];

  const handleApprove = async (approved: boolean) => {
    if (!currentResp) return;
    setIsSubmitting(true);
    try {
      let editedJson = undefined;
      if (editedScore !== null && aiAnalysis) {
        editedJson = {
          ...aiAnalysis,
          conceptualUnderstanding: {
            ...aiAnalysis.conceptualUnderstanding,
            overallLevel: {
              ...aiAnalysis.conceptualUnderstanding?.overallLevel,
              score: editedScore,
            },
          },
        };
      }

      await submitTeacherReview({
        studentResponseId: currentResp.id,
        aiAnalysisId: currentResp.aiAnalyses?.[0]?.id || 'ai-1',
        approved,
        editedJson,
        feedbackText,
      });

      // Update local state
      const updated = [...responses];
      updated[selectedIndex].teacherReviews = [
        {
          status: approved ? 'APPROVED' : 'APPROVED_WITH_CHANGES',
          approved,
          feedbackText,
        },
      ];
      setResponses(updated);
      alert('Değerlendirme kaydedildi.');
    } catch (err: any) {
      alert(err.message || 'Hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReanalyze = async () => {
    if (!currentResp) return;
    setIsSubmitting(true);
    try {
      await reanalyzeStudentResponse(currentResp.id);
      alert('Yapay zeka analizi yeniden başlatıldı.');
    } catch (err: any) {
      alert(err.message || 'Yeniden analiz başlatılamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/exams/${examId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Sınav Detayına Dön
        </Link>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          Öğrenci Yanıtı: {selectedIndex + 1} / {responses.length || 1}
        </span>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800">Henüz incelenecek öğrenci yanıtı bulunmuyor</h3>
          <p className="text-xs text-slate-500 mt-1">
            Öğrenciler sınav sorularını tamamladığında yapay zeka analizleri bu ekranda görünecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Student Roster Selector Sidebar */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 space-y-2 max-h-[700px] overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Öğrenci Listesi
            </h3>
            {responses.map((resp, idx) => {
              const student = resp.attempt?.studentRoster;
              const isApproved = resp.teacherReviews?.[0]?.approved;
              return (
                <button
                  key={resp.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setEditedScore(null);
                    setFeedbackText('');
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs transition flex items-center justify-between ${
                    selectedIndex === idx
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="block font-semibold">
                      {student?.firstName} {student?.lastName}
                    </span>
                    <span className="text-[11px] text-slate-400">No: {student?.schoolNumber}</span>
                  </div>
                  {isApproved !== undefined && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Response & AI Workspace Content */}
          <div className="lg:col-span-9 space-y-6">
            {/* Student Submission Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Öğrenci: {currentResp.attempt?.studentRoster?.firstName}{' '}
                    {currentResp.attempt?.studentRoster?.lastName} (#{currentResp.attempt?.studentRoster?.schoolNumber})
                  </h2>
                  <p className="text-xs text-slate-500">{currentResp.question?.title}</p>
                </div>
                <button
                  onClick={handleReanalyze}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Yeniden Analiz Et
                </button>
              </div>

              {/* Multimodal Outputs Display */}
              <div className="space-y-3 text-xs">
                {/* Direct Typed Text */}
                {currentResp.textResponse?.content && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                      <FileText className="w-4 h-4 text-indigo-600" /> Metin Cevap:
                    </span>
                    <p className="text-slate-800 leading-relaxed">{currentResp.textResponse.content}</p>
                  </div>
                )}

                {/* OCR Handwriting Extracted Text */}
                {currentResp.ocrResults?.[0] && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                      <ImageIcon className="w-4 h-4 text-amber-600" /> El Yazısı Fotoğrafı (OCR Metni):
                    </span>
                    <p className="text-amber-950 leading-relaxed">
                      {currentResp.ocrResults[0].extractedText}
                    </p>
                  </div>
                )}

                {/* Audio Transcription Text */}
                {currentResp.transcriptions?.[0] && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                      <Mic className="w-4 h-4 text-indigo-600" /> Ses Kaydı Transkripsiyonu:
                    </span>
                    <p className="text-indigo-950 leading-relaxed">
                      {currentResp.transcriptions[0].transcriptText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Qualitative AI Analysis Result Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> Yapay Zeka Pedagojik Değerlendirme Çıktısı
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Model: {currentResp.aiAnalyses?.[0]?.modelName || 'Gemini 3.6 Flash'}
                </span>
              </div>

              {aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  {/* Conceptual Level Score & Badge */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Kavramsal Anlama Düzeyi (0 - 4)
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-900">
                          Puan: {editedScore !== null ? editedScore : aiAnalysis.conceptualUnderstanding?.overallLevel?.score ?? 3} / 4
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Güven Oranı: %{Math.round((aiAnalysis.analysisConfidence || 0.88) * 100)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        {aiAnalysis.conceptualUnderstanding?.overallLevel?.explanation || aiAnalysis.analysisSummary}
                      </p>
                    </div>

                    {/* Score Editor Override Buttons */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditedScore(s)}
                          className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                            (editedScore !== null ? editedScore : aiAnalysis.conceptualUnderstanding?.overallLevel?.score) === s
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Evidence & Misconception Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900 space-y-2">
                      <span className="font-bold text-emerald-800 block">Doğru İfade Edilen Kavramlar:</span>
                      {(aiAnalysis.conceptualUnderstanding?.correctIdeas || []).map((idea: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          • <span className="font-semibold">{idea.idea}:</span> "{idea.evidence}"
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-900 space-y-2">
                      <span className="font-bold text-amber-800 block">Tespit Edilen Kavram Yanılgıları:</span>
                      {(aiAnalysis.conceptualUnderstanding?.misconceptions || []).map((m: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          • <span className="font-bold">{m.code}:</span> {m.explanation || m.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Feedback & Approval Form */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Öğrenciye İletilecek Öğretmen Geri Bildirimi
                      </label>
                      <textarea
                        rows={2}
                        placeholder={aiAnalysis.recommendedTeacherFeedback?.strength || 'Geri bildirim yazınız...'}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(false)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-semibold transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Düzeltmelerle Onayla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(true)}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Yapay Zeka Analizini Onayla
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Bu yanıt için henüz yapay zeka analizi üretilmemiştir.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
