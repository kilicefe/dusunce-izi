import React, { useState } from 'react';
import { Classroom, StudentRosterItem, CSVImportResult } from '../types/database';
import {
  getClassrooms,
  createClassroom,
  deleteClassroom,
  getStudentRoster,
  addStudentToRoster,
  removeStudentFromRoster,
  importRosterFromCSV,
} from '../lib/db';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  UserPlus,
  GraduationCap,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

export const ClassroomsView: React.FC = () => {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>(getClassrooms());
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    classrooms.length > 0 ? classrooms[0] : null
  );

  // Modals
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  // Forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('8');
  const [newClassBranch, setNewClassBranch] = useState('A');
  const [newAcademicYear, setNewAcademicYear] = useState('2025-2026');

  const [studentNum, setStudentNum] = useState('');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // CSV State
  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<CSVImportResult | null>(null);

  // Roster Search
  const [searchQuery, setSearchQuery] = useState('');

  const refreshClassrooms = () => {
    const updated = getClassrooms();
    setClassrooms(updated);
    if (selectedClassroom) {
      const reSelected = updated.find((c) => c.id === selectedClassroom.id) || updated[0] || null;
      setSelectedClassroom(reSelected);
    } else if (updated.length > 0) {
      setSelectedClassroom(updated[0]);
    }
  };

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !user) return;

    createClassroom({
      teacherId: user.id,
      name: newClassName.trim(),
      grade: newClassGrade,
      branch: newClassBranch,
      academicYear: newAcademicYear,
    });

    setNewClassName('');
    setIsAddClassModalOpen(false);
    refreshClassrooms();
  };

  const handleDeleteClassroom = (id: string) => {
    if (window.confirm('Bu sınıfı ve ilgili tüm öğrenci listesini silmek istediğinize emin misiniz?')) {
      deleteClassroom(id);
      refreshClassrooms();
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedClassroom || !studentNum.trim() || !studentFirstName.trim()) return;

    try {
      addStudentToRoster({
        classroomId: selectedClassroom.id,
        schoolNumber: studentNum.trim(),
        firstName: studentFirstName.trim(),
        lastName: studentLastName.trim(),
      });
      setStudentNum('');
      setStudentFirstName('');
      setStudentLastName('');
      setIsAddStudentModalOpen(false);
      refreshClassrooms();
    } catch (err: any) {
      setErrorMsg(err.message || 'Öğrenci eklenirken bir hata oluştu.');
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    if (window.confirm('Öğrenciyi listeden çıkarmak istediğinize emin misiniz?')) {
      removeStudentFromRoster(studentId);
      refreshClassrooms();
    }
  };

  const handleCSVImport = () => {
    if (!selectedClassroom || !csvText.trim()) return;
    const result = importRosterFromCSV(selectedClassroom.id, csvText);
    setCsvResult(result);
    refreshClassrooms();
  };

  const handleDownloadCSVTemplate = () => {
    const template = `Okul No,Ad,Soyad\n101,Zeynep,Kaya\n102,Ali,Öztürk\n103,Elif,Şahin`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ogrenci_listesi_sablonu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentRoster = selectedClassroom ? getStudentRoster(selectedClassroom.id) : [];
  const filteredRoster = currentRoster.filter(
    (s) =>
      s.schoolNumber.includes(searchQuery) ||
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Sınıflarım ve Öğrenci Listeleri
          </h2>
          <p className="text-xs text-slate-400">
            Sınıfları yönetin, manuel veya CSV formatında öğrenci kadrosu içe aktarın.
          </p>
        </div>
        <button
          onClick={() => setIsAddClassModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Yeni Sınıf Ekle
        </button>
      </div>

      {/* Main Grid: Classroom Selection & Roster View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Classroom List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Sınıf Listesi ({classrooms.length})</span>
          </h3>

          <div className="space-y-2">
            {classrooms.map((cls) => {
              const isSelected = selectedClassroom?.id === cls.id;
              const rosterCount = getStudentRoster(cls.id).length;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassroom(cls)}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'
                      }`}
                    >
                      {cls.grade}-{cls.branch || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{cls.name}</h4>
                      <span className="text-xs text-slate-400">
                        {rosterCount} Öğrenci • {cls.academicYear}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Roster Detail View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          {selectedClassroom ? (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedClassroom.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {currentRoster.length} Öğrenci
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Sınıf Düzeyi: {selectedClassroom.grade} | Şube: {selectedClassroom.branch || 'A'} | Dönem:{' '}
                    {selectedClassroom.academicYear}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-400" /> Öğrenci Ekle
                  </button>
                  <button
                    onClick={() => {
                      setCsvResult(null);
                      setCsvText('');
                      setIsCSVModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> CSV İçe Aktar
                  </button>
                  <button
                    onClick={() => handleDeleteClassroom(selectedClassroom.id)}
                    title="Sınıfı Sil"
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Roster Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Okul numarası veya öğrenci adı arayın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Roster Table */}
              {filteredRoster.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Okul No</th>
                        <th className="px-4 py-3">Ad</th>
                        <th className="px-4 py-3">Soyad</th>
                        <th className="px-4 py-3">Kayıt Tarihi</th>
                        <th className="px-4 py-3 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                      {filteredRoster.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-400">{student.schoolNumber}</td>
                          <td className="px-4 py-3 font-medium text-white">{student.firstName}</td>
                          <td className="px-4 py-3 text-slate-300">{student.lastName || '-'}</td>
                          <td className="px-4 py-3 text-slate-500 text-[11px]">
                            {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Listeden Çıkar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl space-y-3">
                  <GraduationCap className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Sınıfta Kayıtlı Öğrenci Bulunmuyor</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Öğrenciler sınavlara katılırken sadece okul numaraları ile doğrulanır.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl font-medium"
                    >
                      Manuel Öğrenci Ekle
                    </button>
                    <button
                      onClick={() => setIsCSVModalOpen(true)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-xl border border-slate-700"
                    >
                      CSV Dosyası Yükle
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-500">Lütfen soldaki listeden bir sınıf seçin.</div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Classroom */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Yeni Sınıf Oluştur</h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sınıf Adı <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 8-A Fen Bilimleri"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sınıf Düzeyi</label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                  >
                    {['5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                      <option key={g} value={g}>
                        {g}. Sınıf
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Şube</label>
                  <input
                    type="text"
                    placeholder="Örn: A"
                    value={newClassBranch}
                    onChange={(e) => setNewClassBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Akademik Yıl</label>
                <input
                  type="text"
                  value={newAcademicYear}
                  onChange={(e) => setNewAcademicYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  Sınıfı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Single Student */}
      {isAddStudentModalOpen && selectedClassroom && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Öğrenci Ekle ({selectedClassroom.name})
              </h3>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Okul Numarası <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 101"
                  value={studentNum}
                  onChange={(e) => setStudentNum(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Zeynep"
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Soyad</label>
                  <input
                    type="text"
                    placeholder="Örn: Kaya"
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-2 rounded-xl transition-all shadow-md"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CSV Import */}
      {isCSVModalOpen && selectedClassroom && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                CSV Öğrenci Listesi İçe Aktar
              </h3>
              <button
                onClick={() => setIsCSVModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Aşağıdaki alana CSV içeriğini yapıştırın veya <code>.csv</code> dosyanızın içeriğini kopyalayın.
                </p>
                <button
                  onClick={handleDownloadCSVTemplate}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Şablon İndir
                </button>
              </div>

              <textarea
                rows={6}
                placeholder={`Okul No,Ad,Soyad\n101,Zeynep,Kaya\n102,Ali,Öztürk\n103,Elif,Şahin`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-600"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleCSVImport}
                  disabled={!csvText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> İçe Aktar ve Doğrula
                </button>
              </div>

              {/* Import Result Feedback */}
              {csvResult && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  {csvResult.added.length > 0 && (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>{csvResult.added.length}</strong> öğrenci başarıyla sınıfa eklendi.
                      </span>
                    </div>
                  )}

                  {csvResult.duplicates.length > 0 && (
                    <div className="p-3 bg-amber-950/60 border border-amber-800 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Zaten kayıtlı olan numaralar pas geçildi:{' '}
                        {csvResult.duplicates.join(', ')}
                      </span>
                    </div>
                  )}

                  {csvResult.errors.length > 0 && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        İşlenemeyen Satırlar ({csvResult.errors.length}):
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-400">
                        {csvResult.errors.map((err, idx) => (
                          <li key={idx}>
                            Satır {err.line}: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
