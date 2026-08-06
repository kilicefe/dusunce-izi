import React, { useState } from 'react';
import { Question, ResponseMode, QuestionExpectedConcept, QuestionMisconception, QuestionRubric } from '../types/database';
import { HOTS_DIMENSIONS, SYSTEM_RUBRICS } from '../data/rubricsAndSkills';
import { validateImageFile, readFileAsDataURL, rotateImageDataUrl } from '../lib/imageService';
import {
  HelpCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  RotateCw,
  Check,
  AlertTriangle,
  BookOpen,
  Award,
  ListChecks,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface QuestionEditorProps {
  question: Partial<Question>;
  questionIndex: number;
  onSave: (questionData: Partial<Question>) => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  questionIndex,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(question.title || `Soru ${questionIndex + 1}`);
  const [questionText, setQuestionText] = useState(question.questionText || '');
  const [imageUrl, setImageUrl] = useState(question.imageUrl || '');
  const [sourceInfo, setSourceInfo] = useState(question.sourceInfo || '');
  const [teacherNotes, setTeacherNotes] = useState(question.teacherNotes || '');
  const [questionType, setQuestionType] = useState<'OPEN_ENDED' | 'MULTIPLE_CHOICE_EXPLANATION' | 'MODEL_DRAWING'>(
    question.questionType || 'OPEN_ENDED'
  );
  const [maximumScore, setMaximumScore] = useState<number>(question.maximumScore || 100);

  // Response Modes
  const [allowedResponseModes, setAllowedResponseModes] = useState<ResponseMode[]>(
    question.allowedResponseModes && question.allowedResponseModes.length > 0
      ? question.allowedResponseModes
      : [ResponseMode.DIRECT_TEXT, ResponseMode.HANDWRITTEN_IMAGE, ResponseMode.AUDIO_EXPLANATION, ResponseMode.MULTIMODAL]
  );

  // HOTS skills
  const [targetedSkills, setTargetedSkills] = useState<string[]>(question.targetedSkills || []);
  const [argumentationRequired, setArgumentationRequired] = useState<boolean>(question.argumentationRequired || false);

  // Expected concepts
  const [expectedConcepts, setExpectedConcepts] = useState<QuestionExpectedConcept[]>(question.expectedConcepts || []);
  const [newConceptName, setNewConceptName] = useState('');
  const [newConceptDesc, setNewConceptDesc] = useState('');
  const [newConceptEssential, setNewConceptEssential] = useState(true);

  // Misconceptions
  const [misconceptions, setMisconceptions] = useState<QuestionMisconception[]>(question.misconceptions || []);
  const [newMisCode, setNewMisCode] = useState('');
  const [newMisTitle, setNewMisTitle] = useState('');
  const [newMisDesc, setNewMisDesc] = useState('');
  const [newMisRemedy, setNewMisRemedy] = useState('');

  // Rubrics
  const [rubrics, setRubrics] = useState<QuestionRubric[]>(question.rubrics || []);

  // UI state
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'concepts' | 'rubric'>('basic');

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Görsel yüklenemedi.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setImageUrl(dataUrl);
    } catch (err: any) {
      setUploadError('Görsel okuma hatası.');
    }
  };

  const handleRotateImage = async () => {
    if (!imageUrl) return;
    try {
      const rotated = await rotateImageDataUrl(imageUrl, 90);
      setImageUrl(rotated);
    } catch (err: any) {
      console.error(err);
    }
  };

  const toggleResponseMode = (mode: ResponseMode) => {
    if (allowedResponseModes.includes(mode)) {
      if (allowedResponseModes.length === 1) {
        alert('En az bir yanıt biçimi seçilmelidir.');
        return;
      }
      setAllowedResponseModes(allowedResponseModes.filter((m) => m !== mode));
    } else {
      setAllowedResponseModes([...allowedResponseModes, mode]);
    }
  };

  const toggleHotsSkill = (key: string) => {
    if (targetedSkills.includes(key)) {
      setTargetedSkills(targetedSkills.filter((k) => k !== key));
    } else {
      setTargetedSkills([...targetedSkills, key]);
    }
  };

  const handleAddExpectedConcept = () => {
    if (!newConceptName.trim()) return;
    const newConcept: QuestionExpectedConcept = {
      id: 'ec-' + Date.now(),
      questionId: question.id || '',
      conceptName: newConceptName.trim(),
      description: newConceptDesc.trim(),
      isEssential: newConceptEssential,
      importance: newConceptEssential ? 'essential' : 'supporting',
    };
    setExpectedConcepts([...expectedConcepts, newConcept]);
    setNewConceptName('');
    setNewConceptDesc('');
  };

  const handleRemoveConcept = (id: string) => {
    setExpectedConcepts(expectedConcepts.filter((c) => c.id !== id));
  };

  const handleAddMisconception = () => {
    if (!newMisTitle.trim()) return;
    const newMis: QuestionMisconception = {
      id: 'mc-' + Date.now(),
      questionId: question.id || '',
      code: newMisCode.trim() || `MIS-${misconceptions.length + 1}`,
      title: newMisTitle.trim(),
      description: newMisDesc.trim(),
      remedy: newMisRemedy.trim(),
    };
    setMisconceptions([...misconceptions, newMis]);
    setNewMisCode('');
    setNewMisTitle('');
    setNewMisDesc('');
    setNewMisRemedy('');
  };

  const handleRemoveMisconception = (id: string) => {
    setMisconceptions(misconceptions.filter((m) => m.id !== id));
  };

  const handleApplySystemRubricTemplate = (templateKey: string) => {
    const template = SYSTEM_RUBRICS.find((sr) => sr.dimensionKey === templateKey);
    if (!template) return;

    // Filter out existing rubrics for this dimension and replace with template levels
    const filtered = rubrics.filter((r) => r.dimension !== templateKey);
    const newRubrics: QuestionRubric[] = template.levels.map((lvl) => ({
      id: 'rub-' + templateKey + '-' + lvl.level + '-' + Date.now(),
      questionId: question.id || '',
      dimension: templateKey,
      level: lvl.level,
      levelTitle: lvl.levelTitle,
      description: lvl.description,
      observableIndicators: lvl.observableIndicators,
    }));

    setRubrics([...filtered, ...newRubrics]);
  };

  const handleSaveQuestion = () => {
    if (!questionText.trim() && !imageUrl) {
      alert('Soru için en az bir soru metni veya bir soru görseli yüklemelisiniz.');
      return;
    }
    if (allowedResponseModes.length === 0) {
      alert('Öğrenciler için en az bir cevap biçimi seçiniz.');
      return;
    }

    onSave({
      ...question,
      title: title.trim(),
      questionText: questionText.trim(),
      imageUrl: imageUrl || undefined,
      sourceInfo: sourceInfo.trim(),
      teacherNotes: teacherNotes.trim(),
      questionType,
      maximumScore,
      allowedResponseModes,
      targetedSkills,
      argumentationRequired,
      expectedConcepts,
      misconceptions,
      rubrics,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" /> Soru {questionIndex + 1} Düzenleyici
          </h2>
          <p className="text-xs text-slate-400">Açık uçlu soru detayları, rubrikler ve kavram haritasını yapılandırın.</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'basic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Soru Metni & Biçim
          </button>
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'concepts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" /> Kavramlar & Yanılgılar ({expectedConcepts.length})
          </button>
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'rubric' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Değerlendirme Rubriği ({rubrics.length})
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        {/* TAB 1: BASIC INFO & QUESTION PROMPT */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Soru Başlığı / Etiketi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Soru 1: Fotosentez ve Solunum İlişkisi"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Maksimum Puan</label>
                <input
                  type="number"
                  value={maximumScore}
                  onChange={(e) => setMaximumScore(Number(e.target.value))}
                  min={1}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Question Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Soru Metni (Açık Uçlu Yönerge) <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Öğrencinin derinlemesine açıklamasını istediğiniz soru metnini giriniz..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Image Upload */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-400" /> Soru Görseli / Deney Şeması (İsteğe Bağlı)
                </span>
                <span className="text-[10px] text-slate-500">Maks: 5 MB (JPG, PNG, WEBP, SVG)</span>
              </label>

              {imageUrl ? (
                <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-900 p-2 flex items-center justify-between">
                  <img src={imageUrl} alt="Soru görseli" className="h-32 object-contain rounded-lg" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRotateImage}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Döndür (90°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Görseli Kaldır
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center">
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" id="q-img-input" />
                  <label htmlFor="q-img-input" className="cursor-pointer inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300">
                    <ImageIcon className="w-4 h-4" /> Bilgisayarınızdan Görsel Seçin
                  </label>
                </div>
              )}

              {uploadError && <p className="text-xs text-rose-400 font-medium">{uploadError}</p>}
            </div>

            {/* Response Modes checkboxes */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                İzin Verilen Öğrenci Yanıt Biçimleri (Çoklu Seçim)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { mode: ResponseMode.DIRECT_TEXT, title: 'Metin Olarak Yazma', desc: 'Öğrenci cevabını doğrudan klavyeyle yazar.' },
                  { mode: ResponseMode.HANDWRITTEN_IMAGE, title: 'El Yazısı / Çizim Fotoğrafı', desc: 'Kağıda yazdığı çözümü fotoğraflayıp yükler.' },
                  { mode: ResponseMode.AUDIO_EXPLANATION, title: 'Sesli Anlatım Kaydı', desc: 'Düşünce sürecini sesli olarak kaydeder.' },
                  { mode: ResponseMode.MULTIMODAL, title: 'Çok Modlu Hibrit Yanıt', desc: 'Metin, çizim ve sesi bir arada sunar.' },
                ].map((item) => {
                  const isChecked = allowedResponseModes.includes(item.mode);
                  return (
                    <div
                      key={item.mode}
                      onClick={() => toggleResponseMode(item.mode)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        isChecked
                          ? 'bg-indigo-600/10 border-indigo-500/40 text-slate-100'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-200">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Targeted HOTS Dimensions */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Hedeflenen Üst Düşünme Becerileri (HOTS)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs max-h-48 overflow-y-auto pr-1">
                {HOTS_DIMENSIONS.map((dim) => {
                  const isSelected = targetedSkills.includes(dim.key);
                  return (
                    <div
                      key={dim.key}
                      onClick={() => toggleHotsSkill(dim.key)}
                      className={`p-2 rounded-lg border cursor-pointer transition text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <span className="font-medium truncate">{dim.labelTr}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Argumentation Toggle */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Bilimsel Argümantasyon Şartı</span>
                <span className="text-[11px] text-slate-400">Öğrenciden İddia, Kanıt ve Gerekçe yapısı kurması beklenir.</span>
              </div>
              <input
                type="checkbox"
                checked={argumentationRequired}
                onChange={(e) => setArgumentationRequired(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 2: EXPECTED CONCEPTS & MISCONCEPTIONS */}
        {activeTab === 'concepts' && (
          <div className="space-y-6">
            {/* Expected Concepts */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" /> Beklenen Bilimsel Kavramlar ve İlkeler
              </h3>
              <p className="text-xs text-slate-400">
                Öğrencinin doğru cevabında geçmesi beklenen anahtar kavram ve kavram bağlarını ekleyin.
              </p>

              {/* Added concepts list */}
              <div className="space-y-2">
                {expectedConcepts.map((c) => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200">{c.conceptName}</span>
                        {c.isEssential && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                            Zorunlu Kavram
                          </span>
                        )}
                      </div>
                      {c.description && <p className="text-xs text-slate-400 mt-1">{c.description}</p>}
                    </div>
                    <button onClick={() => handleRemoveConcept(c.id)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add concept form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    placeholder="Kavram Adı (Örn: Özısı)"
                    value={newConceptName}
                    onChange={(e) => setNewConceptName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-5">
                  <input
                    type="text"
                    placeholder="Açıklama / Bağlam (Örn: Madde miktarı değişse de değişmez)"
                    value={newConceptDesc}
                    onChange={(e) => setNewConceptDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddExpectedConcept}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Misconceptions */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Olası Kavram Yanılgıları Kataloğu
              </h3>
              <p className="text-xs text-slate-400">
                Bu soruda öğrencilerin düşebileceği tipik yanılgıları ve yapay zekâ için iyileştirici geri bildirim notlarını tanımlayın.
              </p>

              <div className="space-y-2">
                {misconceptions.map((m) => (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {m.code}
                        </span>
                        <span className="font-semibold text-xs text-slate-200">{m.title}</span>
                      </div>
                      {m.description && <p className="text-xs text-slate-400 mt-1">{m.description}</p>}
                      {m.remedy && <p className="text-xs text-indigo-400 mt-1 italic">Düzeltme Yönergesi: {m.remedy}</p>}
                    </div>
                    <button onClick={() => handleRemoveMisconception(m.id)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add misconception form */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Yanılgı Kodu (Örn: HEAT_TEMP_CONF)"
                      value={newMisCode}
                      onChange={(e) => setNewMisCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="md:col-span-8">
                    <input
                      type="text"
                      placeholder="Yanılgı Başlığı (Örn: Isı ve Sıcaklık Kavramlarını Karıştırma)"
                      value={newMisTitle}
                      onChange={(e) => setNewMisTitle(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <input
                      type="text"
                      placeholder="Açıklama"
                      value={newMisDesc}
                      onChange={(e) => setNewMisDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="İyileştirici Dönüt Notu"
                      value={newMisRemedy}
                      onChange={(e) => setNewMisRemedy(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddMisconception}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Yanılgı Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RUBRIC BUILDER */}
        {activeTab === 'rubric' && (
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-400" /> Soruya Özel Dereceli Puanlama Anahtarı (Rubrik)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sistem hazır rubrik şablonlarını uygulayabilir veya seviyeleri özelleştirebilirsiniz.
                  </p>
                </div>

                {/* System template picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Hazır Şablon:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleApplySystemRubricTemplate(e.target.value);
                    }}
                    defaultValue=""
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Şablon Seçin ve Uygulayın...
                    </option>
                    {SYSTEM_RUBRICS.map((sr) => (
                      <option key={sr.dimensionKey} value={sr.dimensionKey}>
                        {sr.dimensionTitleTr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Applied Rubric Cards */}
              {rubrics.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl p-6 text-slate-500 text-xs">
                  Henüz bir rubrik tanımlanmadı. Yukarıdaki "Hazır Şablon" menüsünden standart boyutları seçebilirsiniz.
                </div>
              ) : (
                <div className="space-y-4">
                  {['conceptualUnderstanding', 'representation', 'higherOrderThinking', 'argumentation'].map((dimKey) => {
                    const dimRubrics = rubrics.filter((r) => r.dimension === dimKey);
                    if (dimRubrics.length === 0) return null;

                    const titleObj = SYSTEM_RUBRICS.find((s) => s.dimensionKey === dimKey);

                    return (
                      <div key={dimKey} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-xs text-indigo-300">
                            {titleObj?.dimensionTitleTr || dimKey}
                          </span>
                          <button
                            onClick={() => setRubrics(rubrics.filter((r) => r.dimension !== dimKey))}
                            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Boyutu Kaldır
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                          {dimRubrics
                            .sort((a, b) => a.level - b.level)
                            .map((r) => (
                              <div
                                key={r.id}
                                className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg space-y-1"
                              >
                                <span className="font-bold text-[11px] text-amber-400 block">
                                  Düzey {r.level}
                                </span>
                                <p className="font-semibold text-slate-200 text-xs line-clamp-1">{r.levelTitle}</p>
                                <p className="text-[11px] text-slate-400 leading-tight">{r.description}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
        >
          İptal
        </button>

        <button
          onClick={handleSaveQuestion}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
        >
          <Check className="w-4 h-4" /> Soruyu Kaydet
        </button>
      </div>
    </div>
  );
};
