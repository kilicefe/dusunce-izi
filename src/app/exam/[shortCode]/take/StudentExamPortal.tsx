'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  Square,
  Play,
  RotateCcw,
} from 'lucide-react';
import { saveStudentResponse, submitStudentExamAttempt } from '@/app/actions/studentExamActions';

export function StudentExamPortal({
  initialAttempt,
  token,
}: {
  initialAttempt: any;
  token: string;
}) {
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<'text' | 'image' | 'audio'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(initialAttempt.status === 'SUBMITTED');

  // Response state maps per question ID
  const questions = initialAttempt.exam?.questions || [];
  const currentQ = questions[activeQuestionIdx];

  const [typedTexts, setTypedTexts] = useState<Record<string, string>>({});
  const [imageLists, setImageLists] = useState<Record<string, string[]>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Populate existing responses
    const initialTyped: Record<string, string> = {};
    const initialImgs: Record<string, string[]> = {};
    const initialAuds: Record<string, string> = {};

    for (const r of initialAttempt.responses || []) {
      if (r.textResponse?.content) initialTyped[r.questionId] = r.textResponse.content;
      if (r.imageResponses?.length > 0) {
        initialImgs[r.questionId] = r.imageResponses.map((i: any) => i.storageUrl || i.url);
      }
      if (r.audioResponse?.storageUrl || r.audioResponse?.url) {
        initialAuds[r.questionId] = r.audioResponse.storageUrl || r.audioResponse.url;
      }
    }

    setTypedTexts(initialTyped);
    setImageLists(initialImgs);
    setAudioUrls(initialAuds);
  }, [initialAttempt]);

  const handleSaveCurrentResponse = async () => {
    if (!currentQ) return;
    try {
      await saveStudentResponse({
        attemptToken: token,
        questionId: currentQ.id,
        typedText: typedTexts[currentQ.id] || '',
        imageUrls: imageLists[currentQ.id] || [],
        audioUrl: audioUrls[currentQ.id] || '',
      });
      alert('Yanıtınız kaydedildi.');
    } catch (err: any) {
      alert(err.message || 'Yanıt kaydedilemedi');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentQ || !e.target.files) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const currentImages = imageLists[currentQ.id] || [];
        setImageLists({
          ...imageLists,
          [currentQ.id]: [...currentImages, result],
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateAudioRecording = () => {
    if (!currentQ) return;
    if (isRecording) {
      setIsRecording(false);
      // Sample audio data URI simulation
      const sampleAudioUri =
        'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAACxAAAAAA==';
      setAudioUrls({
        ...audioUrls,
        [currentQ.id]: sampleAudioUri,
      });
    } else {
      setIsRecording(true);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!confirm('Sınavı tamamlayıp göndermek istediğinize emin misiniz?')) return;
    setIsSubmitting(true);
    try {
      // Save current active response first
      if (currentQ) {
        await saveStudentResponse({
          attemptToken: token,
          questionId: currentQ.id,
          typedText: typedTexts[currentQ.id] || '',
          imageUrls: imageLists[currentQ.id] || [],
          audioUrl: audioUrls[currentQ.id] || '',
        });
      }

      await submitStudentExamAttempt(token);
      setIsSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Gönderim esnasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sınavınız Başarıyla Tamamlandı!</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Yanıtlarınız sisteme kaydedildi ve yapay zeka pedagojik analiz kuyruğuna alındı.
            Öğretmeniniz değerlendirmeyi onayladığında sonuçlarınızı inceleyebilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            {initialAttempt.exam?.subject}
          </span>
          <h1 className="text-xl font-bold text-slate-900">{initialAttempt.exam?.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Öğrenci: {initialAttempt.studentRoster?.firstName} {initialAttempt.studentRoster?.lastName} (No: {initialAttempt.studentRoster?.schoolNumber})
          </p>
        </div>

        <button
          onClick={handleSubmitAttempt}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm shrink-0"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Gönderiliyor...' : 'Sınavı Tamamla ve Gönder'}
        </button>
      </div>

      {/* Question Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {questions.map((q: any, idx: number) => (
          <button
            key={q.id}
            onClick={() => setActiveQuestionIdx(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeQuestionIdx === idx
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Soru {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Detail & Response Area */}
      {currentQ && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">{currentQ.title}</h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800 leading-relaxed">
              {currentQ.questionText}
            </div>
          </div>

          {/* Response Mode Selector Tabs */}
          <div className="pt-2 border-t border-slate-100 space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Yanıtlama Yöntemi Seçiniz:
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveMode('text')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeMode === 'text'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" /> Yazılı Yanıt
              </button>

              <button
                onClick={() => setActiveMode('image')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeMode === 'image'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> El Yazısı Fotoğrafı Yükle
              </button>

              <button
                onClick={() => setActiveMode('audio')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeMode === 'audio'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Mic className="w-4 h-4" /> Sesli Açıklama Kaydet
              </button>
            </div>

            {/* Input Panels */}
            {activeMode === 'text' && (
              <div>
                <textarea
                  rows={5}
                  placeholder="Cevabınızı buraya yazınız..."
                  value={typedTexts[currentQ.id] || ''}
                  onChange={(e) =>
                    setTypedTexts({ ...typedTexts, [currentQ.id]: e.target.value })
                  }
                  className="w-full p-3.5 border border-slate-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {activeMode === 'image' && (
              <div className="space-y-3 text-xs">
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Kağıttaki El Yazısı Cevabınızın Fotoğrafını Yükleyin</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                {(imageLists[currentQ.id] || []).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {imageLists[currentQ.id].map((imgUrl, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Cevap görseli ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeMode === 'audio' && (
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 text-center space-y-3 text-xs">
                <p className="font-semibold text-slate-700">Sözlü Açıklama Kaydı</p>
                <button
                  onClick={handleSimulateAudioRecording}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition inline-flex items-center gap-2 ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" /> Kaydı Durdur
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Ses Kaydını Başlat
                    </>
                  )}
                </button>

                {audioUrls[currentQ.id] && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 inline-block font-mono text-emerald-700 font-bold">
                    ✓ Ses kaydı başarıyla eklendi
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveCurrentResponse}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition"
              >
                Bu Sorunun Yanıtını Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
