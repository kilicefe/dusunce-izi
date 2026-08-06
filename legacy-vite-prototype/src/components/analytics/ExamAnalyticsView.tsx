import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Brain,
  MessageSquare,
  Layers,
  Award,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Download,
  Filter,
} from 'lucide-react';
import {
  getExams,
  Exam,
  getStudentRosterByClassroom,
  StudentRosterItem,
} from '../../lib/db';
import {
  getExamAnalyticsSummary,
  getQuestionAnalytics,
  getConceptualUnderstandingAnalytics,
  getMisconceptionAnalytics,
  getHotsAnalytics,
  getArgumentationAnalytics,
  getRepresentationAnalytics,
  getStudentProfileAnalytics,
  getAITeacherAgreementAnalytics,
  generateInterventionRecommendations,
  exportTeacherDataCSV,
  exportAnonymizedResearchDataCSV,
  exportDataDictionary,
  calculateBeforeAfterDevelopment,
} from '../../lib/analyticsService';

export function ExamAnalyticsView() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'question'
    | 'conceptual'
    | 'misconceptions'
    | 'hots'
    | 'argumentation'
    | 'representation'
    | 'students'
    | 'development'
    | 'interventions'
    | 'agreement'
    | 'reports'
  >('overview');

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    const loadedExams = getExams();
    setExams(loadedExams);
    if (loadedExams.length > 0) {
      setSelectedExamId(loadedExams[0].id);
      if (loadedExams[0].questions.length > 0) {
        setSelectedQuestionId(loadedExams[0].questions[0].id);
      }
    }
  }, []);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  useEffect(() => {
    if (selectedExam && selectedExam.questions.length > 0) {
      setSelectedQuestionId(selectedExam.questions[0].id);
    }
  }, [selectedExamId]);

  if (!selectedExam) {
    return (
      <div className="p-8 text-center text-slate-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-400 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-700">Henüz Sınav Bulunmuyor</h3>
        <p className="text-sm text-slate-500">Analizlerini görüntülemek için önce bir sınav oluşturun.</p>
      </div>
    );
  }

  const summary = getExamAnalyticsSummary(selectedExamId);
  const questionAnalytics = selectedQuestionId ? getQuestionAnalytics(selectedExamId, selectedQuestionId) : null;
  const conceptualAnalytics = getConceptualUnderstandingAnalytics(selectedExamId);
  const misconceptionAnalytics = getMisconceptionAnalytics(selectedExamId);
  const hotsAnalytics = getHotsAnalytics(selectedExamId);
  const argumentationAnalytics = getArgumentationAnalytics(selectedExamId);
  const representationAnalytics = getRepresentationAnalytics(selectedExamId);
  const agreementAnalytics = getAITeacherAgreementAnalytics(selectedExamId);
  const recommendations = generateInterventionRecommendations(selectedExamId);

  // Student list for roster selector
  const roster = getStudentRosterByClassroom(selectedExam.classroomId);

  const handleDownloadTeacherCsv = () => {
    const csv = exportTeacherDataCSV(selectedExamId);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DusunceIzi_Ogretmen_Analiz_${selectedExam.shortCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadResearchCsv = () => {
    const csv = exportAnonymizedResearchDataCSV(selectedExamId);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DusunceIzi_Anonim_Arastirma_${selectedExam.shortCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Exam Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg">
              Faz 5 Analiz & Raporlama
            </span>
            <span className="text-xs text-slate-400">• Kod: {selectedExam.shortCode}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{selectedExam.title}</h1>
          <p className="text-sm text-slate-500">
            {selectedExam.subject} {selectedExam.unit ? `| ${selectedExam.unit}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.shortCode})
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadTeacherCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV İndir</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Rapor Yazdır</span>
          </button>
        </div>
      </div>

      {/* Data Quality & Source-of-Truth Banner */}
      {summary?.dataQualitySummary && (
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900 text-sm">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">
                Veri Güvenilirliği & Kaynak Durumu: Öğretmen Onayı %{summary.dataQualitySummary.reviewedPercentage}
              </p>
              <p className="text-amber-800 text-xs">
                Onaylanmış: {summary.dataQualitySummary.reviewedCount} | Geçici YZ Sonucu:{' '}
                {summary.dataQualitySummary.provisionalCount} | Değerlendirilemez:{' '}
                {summary.dataQualitySummary.notAssessableCount}
              </p>
            </div>
          </div>
          {summary.dataQualitySummary.warnings.length > 0 && (
            <div className="text-xs bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-300/50">
              ⚠️ {summary.dataQualitySummary.warnings[0]}
            </div>
          )}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 text-sm print:hidden">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Genel Bakış
        </button>

        <button
          onClick={() => setActiveTab('question')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'question'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Soru Analizi
        </button>

        <button
          onClick={() => setActiveTab('conceptual')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'conceptual'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Brain className="w-4 h-4" /> Kavramsal Anlama
        </button>

        <button
          onClick={() => setActiveTab('misconceptions')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'misconceptions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Kavram Yanılgıları
        </button>

        <button
          onClick={() => setActiveTab('hots')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'hots'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Üst Düzey Düşünme
        </button>

        <button
          onClick={() => setActiveTab('argumentation')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'argumentation'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Bilimsel Argümantasyon
        </button>

        <button
          onClick={() => setActiveTab('representation')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'representation'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Çoklu Temsiller
        </button>

        <button
          onClick={() => setActiveTab('interventions')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'interventions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Öğretim Önerileri
        </button>

        <button
          onClick={() => setActiveTab('agreement')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'agreement'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" /> YZ - Öğretmen Uyumu
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Rapor & Dışa Aktar
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Sınıf Mevcudu</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{summary.totalRosterCount}</h3>
              <p className="text-xs text-slate-500 mt-1">Kayıtlı öğrenci sayısı</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Teslim Edilen</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-2">{summary.submittedAttempts}</h3>
              <p className="text-xs text-emerald-600 mt-1">
                Katılım Oranı: %{summary.avgAnswerCompletionRate}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Öğretmen Tarafından Onaylı</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-2">
                {summary.dataQualitySummary.reviewedCount}
              </h3>
              <p className="text-xs text-indigo-600 mt-1">
                %{summary.dataQualitySummary.reviewedPercentage} kesinleşmiş
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase">Geçici YZ Analizi</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">
                {summary.dataQualitySummary.provisionalCount}
              </h3>
              <p className="text-xs text-amber-600 mt-1">İnceleme bekleniyor</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Yanıt Modu Dağılımı</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-600">Doğrudan Metin</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.modeDistribution.DIRECT_TEXT}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-600">El Yazısı Görseli</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.modeDistribution.HANDWRITTEN_IMAGE}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-600">Ses Kaydı</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {summary.modeDistribution.AUDIO_EXPLANATION}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm font-medium text-indigo-700">Çoklu Temsilli (Multimodal)</p>
                <p className="text-2xl font-bold text-indigo-700 mt-1">
                  {summary.modeDistribution.MULTIMODAL}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUESTION ANALYTICS TAB */}
      {activeTab === 'question' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-sm font-medium text-slate-700">Soru Seçin:</span>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800"
            >
              {selectedExam.questions.map((q, idx) => (
                <option key={q.id} value={q.id}>
                  Soru {idx + 1}: {q.title}
                </option>
              ))}
            </select>
          </div>

          {questionAnalytics && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900">{questionAnalytics.question.title}</h3>
                <p className="text-sm text-slate-600">{questionAnalytics.question.questionText}</p>
                {questionAnalytics.question.learningOutcome && (
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">
                    Kazanım: {questionAnalytics.question.learningOutcome}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4">Kavramsal Anlama Seviye Dağılımı (0-4)</h4>
                  <div className="space-y-3">
                    {[4, 3, 2, 1, 0].map((lvl) => {
                      const cnt = questionAnalytics.levelDistribution[lvl] || 0;
                      const total = questionAnalytics.totalResponses || 1;
                      const pct = Math.round((cnt / total) * 100);
                      return (
                        <div key={lvl} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>Seviye {lvl}</span>
                            <span>
                              {cnt} kişi (%{pct})
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-4">Beklenen Kavram Kullanımı</h4>
                  <div className="space-y-3">
                    {Object.entries(questionAnalytics.expectedConceptCounts).map(([conceptName, cnt]) => (
                      <div key={conceptName} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-800">{conceptName}</span>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                          {cnt} öğrenci
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CONCEPTUAL UNDERSTANDING TAB */}
      {activeTab === 'conceptual' && conceptualAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Sınıf Geneli Kavramsal Anlama Raporu</h3>
            <p className="text-sm text-slate-600">
              Bu raporda yalnızca öğretmen onayından geçmiş veya değerlendirilmiş yanıtlar baz alınmıştır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">En Sık Eksik Bırakılan Temel Kavramlar</h4>
                <div className="space-y-2">
                  {Object.entries(conceptualAnalytics.missingEssentialConcepts).length > 0 ? (
                    Object.entries(conceptualAnalytics.missingEssentialConcepts).map(([concept, count]) => (
                      <div key={concept} className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex justify-between items-center text-sm text-rose-900">
                        <span className="font-medium">{concept}</span>
                        <span className="font-bold">{count} öğrencide eksik</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-emerald-600 font-medium">Temel kavram eksikliği tespit edilmedi.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Kavram İlişki Zinciri Analizi</h4>
                <div className="space-y-3">
                  {conceptualAnalytics.relationChain.map((chain) => (
                    <div key={chain.step} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Adım {chain.step}: {chain.name}</span>
                        <span>%{chain.percentage} Kurulma Oranı</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${chain.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MISCONCEPTIONS TAB */}
      {activeTab === 'misconceptions' && misconceptionAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Kavram Yanılgıları Raporu</h3>
            <p className="text-sm text-slate-500">
              Not: Kavram eksikliği ile kavram yanılgısı ayrıştırılmıştır. Yalnızca bilimsel olarak yanlış nedensellik veya açıklama içeren durumlar yanılgı sayılır.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misconceptionAnalytics.misconceptions.map((m) => (
                <div key={m.code} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">
                      Kod: {m.code}
                    </span>
                    <span className="text-xs text-slate-500">
                      {m.affectedStudentCount} öğrenci etkilendi
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base">{m.title}</h4>
                  <p className="text-xs text-slate-600">{m.description}</p>

                  <div className="flex items-center gap-4 text-xs font-semibold pt-2 border-t border-slate-200">
                    <span className="text-emerald-700">Öğretmen Onaylı: {m.confirmedCount}</span>
                    <span className="text-amber-700">Geçici YZ Tespiti: {m.possibleCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. HOTS TAB */}
      {activeTab === 'hots' && hotsAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Üst Düzey Düşünme Becerileri (HOTS) Raporu</h3>
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium">
              💡 {hotsAnalytics.cautiousNote}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {hotsAnalytics.hotsDimensions.map((dim) => (
                <div key={dim.skillKey} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">{dim.labelTr}</h4>
                  {dim.sampleSizeWarning ? (
                    <p className="text-xs text-amber-700 font-medium">
                      ⚠️ Yetersiz veri örneği (N &lt; 3). İstatistiksel ortalama hesaplanmadı.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {[4, 3, 2, 1, 0].map((score) => {
                        const cnt = dim.levelCounts[score] || 0;
                        const pct = dim.totalEvaluated > 0 ? Math.round((cnt / dim.totalEvaluated) * 100) : 0;
                        return (
                          <div key={score} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Puan {score}:</span>
                            <span className="font-bold text-slate-800">{cnt} öğrenci (%{pct})</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ARGUMENTATION TAB */}
      {activeTab === 'argumentation' && argumentationAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Bilimsel Argümantasyon Yapısı</h3>
            <p className="text-sm text-slate-600">
              Toulmin Argüman Modeli bileşenlerine (İddia, Kanıt, Gerekçe, Karşı İddia, Çürütme) göre sınıf geneli dağılım.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {argumentationAnalytics.components.map((comp) => (
                <div key={comp.key} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-800 text-sm">{comp.labelTr}</h4>
                  <p className="text-2xl font-bold text-indigo-700">{comp.presentCount} Öğrenci</p>
                  <p className="text-xs text-slate-500">Güçlü: {comp.strongCount} | Kısmi: {comp.weakCount}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold">
              📌 Tipik Desen: {argumentationAnalytics.commonPattern}
            </div>
          </div>
        </div>
      )}

      {/* 7. REPRESENTATION TAB */}
      {activeTab === 'representation' && representationAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Çoklu Temsiller ve Tutarlılık Raporu</h3>
            <p className="text-sm text-slate-600">
              Öğrencilerin çizim, metin ve ses kanallarında kullandıkları temsillerin bilimsel uyumu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Temsiller Arası Tutarlılık</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-emerald-50 rounded-lg text-emerald-900 font-semibold">
                    <span>Tam Tutarlı (CONSISTENT)</span>
                    <span>{representationAnalytics.consistencyCounts.CONSISTENT || 0}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-amber-50 rounded-lg text-amber-900 font-semibold">
                    <span>Kısmen Tutarlı</span>
                    <span>{representationAnalytics.consistencyCounts.PARTIALLY_CONSISTENT || 0}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-rose-50 rounded-lg text-rose-900 font-semibold">
                    <span>Çelişkili / Tutarsız</span>
                    <span>{representationAnalytics.consistencyCounts.INCONSISTENT || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. INTERVENTIONS TAB */}
      {activeTab === 'interventions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Öğretimsel Müdahale Önerileri</h3>
            <p className="text-sm text-slate-600">
              Öğretmen tarafından doğrulanmış verilere dayalı sınıf geneli ve küçük grup öğretim önerileri.
            </p>

            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">
                      {rec.scope === 'CLASSROOM' ? 'Sınıf Geneli' : 'Küçük Grup'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{rec.issue}</h4>
                  <p className="text-xs text-slate-600">{rec.supportingEvidence}</p>
                  <p className="text-xs font-semibold text-indigo-900 pt-2 border-t border-indigo-100">
                    💡 Önerilen Etkinlik: {rec.suggestedAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. AGREEMENT TAB */}
      {activeTab === 'agreement' && agreementAnalytics && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Yapay Zekâ ve Öğretmen Uyumu Raporu</h3>
            <p className="text-sm text-slate-600">
              İnceleme sürecinde YZ analizi ile öğretmen kararları arasındaki örtüşme performansı.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">Değişikliksiz Onay</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{agreementAnalytics.approvedWithoutChanges}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">Düzeltmeyle Onay</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{agreementAnalytics.approvedWithChanges}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">Reddedilen YZ Analizi</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{agreementAnalytics.rejected}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-xs font-semibold text-slate-500">Uyum Oranı</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">%{agreementAnalytics.agreementRate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. REPORTS & EXPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Rapor ve Dışa Aktarım Merkezi</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-base">Öğretmen Detaylı CSV Dışa Aktar</h4>
                <p className="text-xs text-slate-600">
                  Öğrenci isimleri, okul numaraları, soru yanıtları ve öğretmen onaylı puanları içerir.
                </p>
                <button
                  onClick={handleDownloadTeacherCsv}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> CSV İndir (Öğretmen Dosyası)
                </button>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-900 text-base">Anonimleştirilmiş Araştırma CSV</h4>
                <p className="text-xs text-slate-600">
                  Kişisel verilerden arındırılmış, pseudonymous ID içeren akademik araştırma veri seti.
                </p>
                <button
                  onClick={handleDownloadResearchCsv}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Anonim Araştırma CSV İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
