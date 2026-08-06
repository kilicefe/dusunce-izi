import React, { useState, useEffect, useRef } from 'react';
import {
  Exam,
  ExamAttempt,
  StudentRosterItem,
  StudentResponse,
  ResponseMode,
  Question,
  AttemptStatus,
} from '../types/database';
import {
  validatePublicExamAvailability,
  createOrResumeAttempt,
  getAttemptByToken,
  getStudentResponsesForAttempt,
  saveTextResponse,
  addImageResponse,
  deleteImageResponse,
  saveAudioResponse,
  deleteAudioResponse,
  submitAttempt,
  updateCurrentQuestionIndex,
} from '../lib/db';
import {
  CheckCircle2,
  Clock,
  Lock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Mic,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  Trash2,
  RotateCw,
  Play,
  Pause,
  Square,
  Sparkles,
  HelpCircle,
  Save,
  Send,
  RefreshCw,
  Maximize2,
  X,
  Layers,
} from 'lucide-react';

interface PublicExamViewProps {
  token: string;
  onStudentVerified?: (exam: Exam, schoolNumber: string) => void;
}

export const PublicExamView: React.FC<PublicExamViewProps> = ({ token, onStudentVerified }) => {
  // 1. Initial Loading & Verification State
  const [exam, setExam] = useState<Exam | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'loading' | 'available' | 'not_started' | 'ended' | 'closed' | 'invalid'
  >('loading');
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

  // 2. Student Entry Form State
  const [schoolNumber, setSchoolNumber] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // 3. Active Attempt State
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [responses, setResponses] = useState<Record<string, StudentResponse>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'EXAM' | 'REVIEW' | 'COMPLETED'>('EXAM');

  // 4. Time Limit & Countdown State
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // 5. Autosave Status State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // 6. Active Response Mode selection per question
  const [selectedResponseMode, setSelectedResponseMode] = useState<Record<string, ResponseMode>>({});

  // 7. Voice Recording State (MediaRecorder)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 8. Image Zoom Modal State
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState<number>(0);

  // 9. Submission Confirmation Modal
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Check Public Availability on Mount
  useEffect(() => {
    checkAvailability();
  }, [token]);

  const checkAvailability = () => {
    setAvailabilityStatus('loading');
    const result = validatePublicExamAvailability(token);
    if (result.exam) setExam(result.exam);
    setAvailabilityStatus(result.status);
    setAvailabilityMessage(result.message);
  };

  // Restore attempt responses upon attempt creation/resumption
  useEffect(() => {
    if (attempt) {
      loadAttemptResponses(attempt.id);

      // Check if attempt is already submitted
      if (attempt.status === AttemptStatus.SUBMITTED) {
        setActiveTab('COMPLETED');
      }

      // Initialize Timer Countdown
      if (attempt.timeLimitExpiresAt) {
        const expiresMs = new Date(attempt.timeLimitExpiresAt).getTime();
        const nowMs = Date.now();
        const diffSec = Math.max(0, Math.floor((expiresMs - nowMs) / 1000));
        setRemainingSeconds(diffSec);
      }
    }
  }, [attempt]);

  // Timer Tick Effect
  useEffect(() => {
    if (remainingSeconds === null || activeTab === 'COMPLETED') return;

    if (remainingSeconds <= 0) {
      // Auto submit on time expiry!
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, activeTab]);

  const loadAttemptResponses = (attemptId: string) => {
    try {
      const respList = getStudentResponsesForAttempt(attemptId);
      const respMap: Record<string, StudentResponse> = {};
      respList.forEach((r) => {
        respMap[r.questionId] = r;
      });
      setResponses(respMap);
    } catch (err) {
      console.error(err);
    }
  };

  // Student Entry Action
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!schoolNumber.trim()) {
      setLoginError('Lütfen okul numaranızı giriniz.');
      return;
    }

    if (!exam) return;

    try {
      const newOrActiveAttempt = createOrResumeAttempt(exam.id, schoolNumber.trim());
      setAttempt(newOrActiveAttempt);
      if (onStudentVerified) {
        onStudentVerified(exam, schoolNumber.trim());
      }
    } catch (err: any) {
      setLoginError(err.message || 'Giriş yapılamadı.');
    }
  };

  // Question Navigation
  const currentQuestion: Question | undefined = exam?.questions?.[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (!exam?.questions) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      if (attempt) {
        updateCurrentQuestionIndex(attempt.id, nextIdx, exam.questions[nextIdx].id);
      }
    } else {
      setActiveTab('REVIEW');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      if (attempt && exam?.questions) {
        updateCurrentQuestionIndex(attempt.id, prevIdx, exam.questions[prevIdx].id);
      }
    }
  };

  // Typed Text Change Handler (Debounced Autosave)
  const [textInputMap, setTextInputMap] = useState<Record<string, string>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (qId: string, value: string) => {
    setTextInputMap((prev) => ({ ...prev, [qId]: value }));
    setSaveStatus('saving');

    // Sync draft in local storage for instant safety recovery
    if (attempt) {
      try {
        localStorage.setItem(`dusunceizi_draft_${attempt.id}_${qId}`, value);
      } catch (e) {
        // Safe fallback
      }
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (!attempt) return;
      try {
        const updatedResp = saveTextResponse(attempt.id, qId, value);
        setResponses((prev) => ({ ...prev, [qId]: updatedResp }));
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('error');
      }
    }, 600);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, qId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !attempt) return;

    setSaveStatus('saving');
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        try {
          const updated = addImageResponse(attempt.id, qId, {
            url: base64Url,
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
          });
          setResponses((prev) => ({ ...prev, [qId]: updated }));
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('error');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteImage = (qId: string, imageId: string) => {
    if (!attempt) return;
    try {
      const updated = deleteImageResponse(attempt.id, qId, imageId);
      setResponses((prev) => ({ ...prev, [qId]: updated }));
    } catch (err) {
      console.error(err);
    }
  };

  // Voice Recording (MediaRecorder API)
  const startRecording = async (qId: string) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Tarayıcınız doğrudan mikrofon kaydını desteklemiyor. Lütfen ses dosyanızı yükleme seçeneğini kullanınız.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const audioUrl = reader.result as string;
          if (attempt) {
            try {
              const updated = saveAudioResponse(attempt.id, qId, {
                url: audioUrl,
                durationSeconds: recordingSeconds,
                mimeType: 'audio/webm',
              });
              setResponses((prev) => ({ ...prev, [qId]: updated }));
              setSaveStatus('saved');
            } catch (err) {
              setSaveStatus('error');
            }
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio track streams
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Mikrofon erişim izni verilmedi veya mikrofon bulunamadı.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleDeleteAudio = (qId: string) => {
    if (!attempt) return;
    try {
      const updated = deleteAudioResponse(attempt.id, qId);
      setResponses((prev) => ({ ...prev, [qId]: updated }));
    } catch (err) {
      console.error(err);
    }
  };

  // Final Submission Handler
  const handleFinalSubmit = () => {
    if (!attempt) return;
    try {
      submitAttempt(attempt.id);
      setActiveTab('COMPLETED');
      setShowSubmitModal(false);
    } catch (err: any) {
      alert(err.message || 'Teslim edilirken bir hata oluştu.');
    }
  };

  // Render Availability States
  if (availabilityStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Sınav bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (availabilityStatus !== 'available' || !exam) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{availabilityMessage}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sınava erişim kısıtlanmış olabilir. Lütfen sınav saatini ve öğretmeninizin paylaştığı güncel bağlantıyı kontrol ediniz.
          </p>
        </div>
      </div>
    );
  }

  // Render Student Entry Screen (if attempt not yet created)
  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sınav Aktif • Giriş Ekranı
            </div>
            <h1 className="text-2xl font-bold text-slate-100">{exam.title}</h1>
            <p className="text-xs text-indigo-300 font-medium">
              {exam.classroomName} • {exam.subject}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-slate-500 block">Soru Sayısı</span>
              <span className="font-bold text-slate-200 text-sm">{exam.questions?.length || 0} Soru</span>
            </div>
            <div>
              <span className="text-slate-500 block">Sınav Süresi</span>
              <span className="font-bold text-slate-200 text-sm">
                {exam.timeLimitMinutes ? `${exam.timeLimitMinutes} Dakika` : 'Sınırsız'}
              </span>
            </div>
          </div>

          {/* Instructions */}
          {exam.instructions && (
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs space-y-1">
              <span className="font-bold text-indigo-400 block">Sınav Yönergesi</span>
              <p className="text-slate-300 leading-relaxed">{exam.instructions}</p>
            </div>
          )}

          {/* Student Entry Form */}
          <form onSubmit={handleStudentLogin} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Okul Numaranız <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={schoolNumber}
                onChange={(e) => setSchoolNumber(e.target.value)}
                placeholder="Örn: 101"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono font-bold text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 tracking-wider"
              />
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              Sınava Başla <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Completed View
  if (activeTab === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-100">Sınavınız Teslim Edildi!</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Yanıtlarınız başarıyla sisteme kaydedilmiştir. Öğretmeniniz değerlendirmeyi onayladıktan sonra sonuçlarınızı inceleyebilirsiniz.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Sınav:</span>
              <span className="font-semibold text-slate-200">{exam.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teslim Zamanı:</span>
              <span className="font-semibold text-emerald-400">
                {attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                  : 'Tamamlandı'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format Timer Countdown
  const formatTimer = (sec: number | null) => {
    if (sec === null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render Main Active Student Exam Interface
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 block">{exam.title}</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span>Soru {currentQuestionIndex + 1} / {exam.questions?.length}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{attempt.studentRoster?.firstName} ({attempt.studentRoster?.schoolNumber})</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Countdown */}
            {remainingSeconds !== null && (
              <div
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
                  remainingSeconds < 300
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                    : 'bg-slate-950 text-amber-400 border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            )}

            {/* Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-medium">
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Kaydedildi</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-300">Kaydediliyor...</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300">Kaydedilemedi (Yerel Taslak Aktif)</span>
                </>
              )}
            </div>

            {/* Review Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'EXAM' ? 'REVIEW' : 'EXAM')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {activeTab === 'EXAM' ? (
                <>
                  <Layers className="w-3.5 h-3.5" /> Gözden Geçir
                </>
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" /> Sorulara Dön
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Question Navigation Drawer/Bar */}
      <div className="bg-slate-950 border-b border-slate-850 px-4 py-2 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {exam.questions?.map((q, idx) => {
            const resp = responses[q.id];
            const isAnswered =
              Boolean(resp?.textResponse?.content?.trim()) ||
              (resp?.imageResponses && resp.imageResponses.length > 0) ||
              Boolean(resp?.audioResponse);

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx);
                  setActiveTab('EXAM');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  idx === currentQuestionIndex && activeTab === 'EXAM'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : isAnswered
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Soru {idx + 1}</span>
                {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'EXAM' && currentQuestion && (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Soru {currentQuestionIndex + 1} / {exam.questions?.length}
                </span>
                {currentQuestion.maximumScore && (
                  <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                    Maksimum Puan: {currentQuestion.maximumScore}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-semibold text-slate-100 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.questionText}
              </h2>

              {/* Prompt Images */}
              {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {currentQuestion.questionImages.map((img) => (
                    <div key={img.id} className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img src={img.url} alt="Soru görseli" className="w-full object-contain max-h-64" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Multimodal Response Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-sm font-bold text-slate-200">Cevabınızı Oluşturun</h3>
                <span className="text-xs text-slate-400">
                  İster yazarak, ister çizerek, ister ses kaydı ile açıklayın
                </span>
              </div>

              {/* Response Mode Input Selectors */}
              <div className="space-y-6">
                {/* Mode 1: Typed Text Response */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Metin ile Yanıtla
                    </span>
                    <span className="text-slate-500">
                      {(textInputMap[currentQuestion.id] || responses[currentQuestion.id]?.textResponse?.content || '').length} karakter
                    </span>
                  </div>

                  <textarea
                    rows={5}
                    value={textInputMap[currentQuestion.id] ?? responses[currentQuestion.id]?.textResponse?.content ?? ''}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    placeholder="Düşüncelerinizi buraya ayrıntılı olarak yazabilirsiniz..."
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                  />
                </div>

                {/* Mode 2: Handwritten / Drawing Photo Upload */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> El Yazısı / Kağıt Fotoğrafı Yükle
                    </span>
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Kamera / Fotoğraf Çek
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleImageUpload(e, currentQuestion.id)}
                        className="hidden"
                      />
                    </label>

                    <label className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Galeriden / Dosyadan Seç
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, currentQuestion.id)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Render Uploaded Images */}
                  {responses[currentQuestion.id]?.imageResponses &&
                    responses[currentQuestion.id]!.imageResponses!.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {responses[currentQuestion.id]!.imageResponses!.map((img) => (
                          <div
                            key={img.id}
                            className="group relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center"
                          >
                            <img src={img.url} alt="Yüklenen el yazısı" className="w-full h-full object-cover" />

                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setZoomedImageUrl(img.url);
                                  setImageRotation(0);
                                }}
                                className="p-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(currentQuestion.id, img.id)}
                                className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* Mode 3: Voice / Audio Recording */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Mic className="w-4 h-4" /> Sesli Anlatım Kaydet
                    </span>
                  </div>

                  {/* Audio Controls */}
                  {responses[currentQuestion.id]?.audioResponse ? (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ses Kaydınız Alındı ({responses[currentQuestion.id]?.audioResponse?.durationSeconds} sn)
                        </span>
                        <button
                          onClick={() => handleDeleteAudio(currentQuestion.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil ve Yeniden Kaydet
                        </button>
                      </div>
                      <audio controls src={responses[currentQuestion.id]?.audioResponse?.url} className="w-full h-10 accent-indigo-500" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      {!isRecording ? (
                        <button
                          onClick={() => startRecording(currentQuestion.id)}
                          className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/20 transition flex items-center gap-2"
                        >
                          <Mic className="w-4 h-4" /> Ses Kaydını Başlat
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={stopRecording}
                            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 transition flex items-center gap-2 animate-pulse"
                          >
                            <Square className="w-4 h-4 fill-current" /> Kaydı Durdur ({recordingSeconds} sn)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Question Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Önceki Soru
              </button>

              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                {currentQuestionIndex === (exam.questions?.length || 1) - 1 ? (
                  <>
                    Gözden Geçir & Teslim Et <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Sonraki Soru <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Review Screen */}
        {activeTab === 'REVIEW' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-center">
              <h2 className="text-xl font-bold text-slate-100">Sınav Cevaplarınızı Gözden Geçirin</h2>
              <p className="text-xs text-slate-400">
                Teslim etmeden önce tüm sorulara verdiğiniz yanıtları kontrol edebilirsiniz.
              </p>
            </div>

            {/* Question Summary Grid */}
            <div className="space-y-4">
              {exam.questions?.map((q, idx) => {
                const resp = responses[q.id];
                const hasText = Boolean(resp?.textResponse?.content?.trim());
                const imgCount = resp?.imageResponses?.length || 0;
                const hasAudio = Boolean(resp?.audioResponse);
                const isAnswered = hasText || imgCount > 0 || hasAudio;

                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setActiveTab('EXAM');
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-5 cursor-pointer transition flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-indigo-400">Soru {idx + 1}</span>
                        {isAnswered ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                            Yanıtlandı
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full text-[10px] font-bold">
                            Yanıtlanmadı
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">{q.questionText}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {hasText && <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded">Metin</span>}
                      {imgCount > 0 && <span className="p-1 bg-emerald-500/10 text-emerald-400 rounded">{imgCount} Fotoğraf</span>}
                      {hasAudio && <span className="p-1 bg-amber-500/10 text-amber-400 rounded">Ses Kaydı</span>}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setActiveTab('EXAM')}
                className="px-5 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-800 transition"
              >
                Sorulara Dön
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl text-sm font-bold shadow-xl shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Sınavı Teslim Et
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Send className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-100">Sınavı Teslim Etmek İstiyor Musunuz?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Teslim ettikten sonra cevaplarınızı değiştiremezsiniz. Yanıtlarınız değerlendirilmek üzere öğretmeninize aktarılacaktır.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Kontrol Et
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
              >
                Evet, Teslim Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {zoomedImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 transition"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setZoomedImageUrl(null)}
                className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={zoomedImageUrl}
              alt="Görsel"
              className="max-w-full max-h-[80vh] object-contain rounded-xl transition-transform duration-300"
              style={{ transform: `rotate(${imageRotation}deg)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
