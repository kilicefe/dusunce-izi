'use client';

import { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Send,
  CheckCircle2,
  Upload,
  Square,
} from 'lucide-react';
import {
  createStudentMediaUploadTarget,
  saveStudentResponse,
  submitStudentExamAttempt,
} from '@/app/actions/studentExamActions';
import { selectAudioRecordingMimeType } from '@/lib/browserMediaRecorder';
import { mediaUploadErrorMessage, uploadBlobToSignedUrl } from '@/lib/browserMediaUpload';

export function StudentExamPortal({
  initialAttempt,
  token,
}: {
  initialAttempt: any;
  token: string;
}) {
  type MediaItem = { storageValue: string; previewUrl: string };
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [activeMode, setActiveMode] = useState<'text' | 'image' | 'audio'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(initialAttempt.status === 'SUBMITTED');

  // Response state maps per question ID
  const questions = initialAttempt.exam?.questions || [];
  const currentQ = questions[activeQuestionIdx];

  const [typedTexts, setTypedTexts] = useState<Record<string, string>>({});
  const [imageLists, setImageLists] = useState<Record<string, MediaItem[]>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, MediaItem>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioError, setAudioError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [mediaUploadCount, setMediaUploadCount] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingQuestionIdRef = useRef<string | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Populate existing responses
    const initialTyped: Record<string, string> = {};
    const initialImgs: Record<string, MediaItem[]> = {};
    const initialAuds: Record<string, MediaItem> = {};
    const initialAudioDurations: Record<string, number> = {};

    for (const r of initialAttempt.responses || []) {
      if (r.textResponse?.content) initialTyped[r.questionId] = r.textResponse.content;
      if (r.imageResponses?.length > 0) {
        initialImgs[r.questionId] = r.imageResponses.map((i: any) => ({
          storageValue: i.storageUrl || i.url,
          previewUrl: i.signedUrl || i.storageUrl || i.url,
        }));
      }
      if (r.audioResponse?.storageUrl || r.audioResponse?.url) {
        initialAuds[r.questionId] = {
          storageValue: r.audioResponse.storageUrl || r.audioResponse.url,
          previewUrl: r.audioResponse.signedUrl || r.audioResponse.storageUrl || r.audioResponse.url,
        };
        initialAudioDurations[r.questionId] = r.audioResponse.durationSeconds || 0;
      }
    }

    setTypedTexts(initialTyped);
    setImageLists(initialImgs);
    setAudioUrls(initialAuds);
    setAudioDurations(initialAudioDurations);
  }, [initialAttempt]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const uploadStudentBlob = async (input: {
    blob: Blob;
    fileName: string;
    kind: 'image' | 'audio';
    questionId: string;
  }): Promise<MediaItem> => {
    setMediaError('');
    setMediaUploadCount((count) => count + 1);
    try {
      const result = await createStudentMediaUploadTarget({
        attemptToken: token,
        questionId: input.questionId,
        kind: input.kind,
        mimeType: input.blob.type,
        fileSize: input.blob.size,
      });
      if (!result.ok) throw new Error(result.error);

      await uploadBlobToSignedUrl({
        target: result.target,
        blob: input.blob,
        fileName: input.fileName,
      });
      return {
        storageValue: result.target.storageReference,
        previewUrl: URL.createObjectURL(input.blob),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const publicMessage = message && !message.startsWith('MEDIA_')
        ? message
        : mediaUploadErrorMessage(error);
      setMediaError(publicMessage);
      throw error;
    } finally {
      setMediaUploadCount((count) => Math.max(0, count - 1));
    }
  };

  const handleSaveCurrentResponse = async () => {
    if (!currentQ) return;
    if (mediaUploadCount > 0) {
      setMediaError('Medya yüklemesi tamamlanmadan yanıt kaydedilemez.');
      return;
    }
    try {
      await saveStudentResponse({
        attemptToken: token,
        questionId: currentQ.id,
        typedText: typedTexts[currentQ.id] || '',
        imageUrls: (imageLists[currentQ.id] || []).map((item) => item.storageValue),
        audioUrl: audioUrls[currentQ.id]?.storageValue || '',
        audioDuration: audioDurations[currentQ.id] || 0,
      });
      alert('Yanıtınız kaydedildi.');
    } catch (err: any) {
      alert(err.message || 'Yanıt kaydedilemedi');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentQ || !e.target.files) return;
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if ((imageLists[currentQ.id] || []).length >= 5) {
      setMediaError('Bir soru için en fazla 5 görsel yükleyebilirsiniz.');
      return;
    }

    try {
      const uploaded = await uploadStudentBlob({
        blob: file,
        fileName: file.name,
        kind: 'image',
        questionId: currentQ.id,
      });
      setImageLists((current) => ({
        ...current,
        [currentQ.id]: [...(current[currentQ.id] || []), uploaded],
      }));
    } catch {
      // uploadStudentBlob exposes a safe, actionable message in the page.
    }
  };

  const handleAudioRecording = async () => {
    if (!currentQ) return;
    if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      return;
    }

    setAudioError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setAudioError('Bu tarayıcı ses kaydını desteklemiyor. Güncel bir tarayıcı kullanınız.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = selectAudioRecordingMimeType((candidate) =>
        MediaRecorder.isTypeSupported(candidate)
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const questionId = currentQ.id;

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];
      recordingQuestionIdRef.current = questionId;
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onerror = () => setAudioError('Ses kaydı sırasında bir hata oluştu.');
      recorder.onstop = async () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - (recordingStartedAtRef.current || Date.now())) / 1000)
        );
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        mediaChunksRef.current = [];
        if (blob.size === 0) {
          setAudioError('Ses kaydı boş oluştu. Mikrofonunuzu kontrol edip tekrar deneyiniz.');
          return;
        }

        try {
          const recordedQuestionId = recordingQuestionIdRef.current || questionId;
          const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
          const uploaded = await uploadStudentBlob({
            blob,
            fileName: `ses-kaydi.${extension}`,
            kind: 'audio',
            questionId: recordedQuestionId,
          });
          setAudioUrls((current) => ({
            ...current,
            [recordedQuestionId]: uploaded,
          }));
          setAudioDurations((current) => ({
            ...current,
            [recordedQuestionId]: durationSeconds,
          }));
        } catch {
          setAudioError('Ses kaydı güvenli depolama alanına yüklenemedi. Lütfen tekrar deneyiniz.');
        }
      };

      recorder.start(250);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(
        () => setRecordingSeconds((seconds) => seconds + 1),
        1000
      );
    } catch (error) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
      setAudioError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Mikrofon izni verilmedi. Tarayıcı izinlerinden mikrofonu etkinleştiriniz.'
          : 'Mikrofona erişilemedi. Cihaz bağlantısını ve tarayıcı izinlerini kontrol ediniz.'
      );
    }
  };

  const handleSubmitAttempt = async () => {
    if (mediaUploadCount > 0) {
      setMediaError('Medya yüklemesi tamamlanmadan sınav gönderilemez.');
      return;
    }
    if (!confirm('Sınavı tamamlayıp göndermek istediğinize emin misiniz?')) return;
    setIsSubmitting(true);
    try {
      // Save current active response first
      if (currentQ) {
        await saveStudentResponse({
          attemptToken: token,
          questionId: currentQ.id,
          typedText: typedTexts[currentQ.id] || '',
          imageUrls: (imageLists[currentQ.id] || []).map((item) => item.storageValue),
          audioUrl: audioUrls[currentQ.id]?.storageValue || '',
          audioDuration: audioDurations[currentQ.id] || 0,
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
          disabled={isSubmitting || mediaUploadCount > 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-sm shrink-0"
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

            {mediaUploadCount > 0 && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-indigo-700 text-xs" role="status" aria-live="polite">
                Medya güvenli depolama alanına yükleniyor…
              </div>
            )}

            {mediaError && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs" role="alert">
                {mediaError}
              </div>
            )}

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
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={mediaUploadCount > 0}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                {(imageLists[currentQ.id] || []).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {imageLists[currentQ.id].map((image, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.previewUrl} alt={`Cevap görseli ${idx + 1}`} className="w-full h-full object-cover" />
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
                  type="button"
                  onClick={handleAudioRecording}
                  disabled={mediaUploadCount > 0}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition inline-flex items-center gap-2 ${
                    isRecording ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
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

                {isRecording && (
                  <div className="font-mono text-red-700" aria-live="polite">
                    Kayıt süresi: {recordingSeconds} sn
                  </div>
                )}

                {audioError && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700" role="alert">
                    {audioError}
                  </div>
                )}

                {audioUrls[currentQ.id] && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-emerald-700 font-bold">
                    <div>✓ Ses kaydı başarıyla eklendi ({audioDurations[currentQ.id] || 0} sn)</div>
                    <audio controls src={audioUrls[currentQ.id].previewUrl} className="w-full" />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveCurrentResponse}
                disabled={mediaUploadCount > 0}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {mediaUploadCount > 0 ? 'Medya Yükleniyor…' : 'Bu Sorunun Yanıtını Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
